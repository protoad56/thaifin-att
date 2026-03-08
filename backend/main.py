from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os
import sys

from .database import engine, get_db, Base
from . import models

# Import ingest_data to run as background task, but since ingest_data uses synchronous DB calls,
# we need to be careful. APScheduler runs in a separate thread which is fine.
from apscheduler.schedulers.background import BackgroundScheduler
from .ingest import ingest_data

app = FastAPI(title="ThaiFin Web App API")

# Setup Scheduler for auto-refresh
scheduler = BackgroundScheduler()

def scheduled_ingest():
    print("Running scheduled data ingestion...")
    # Run full ingestion
    try:
        ingest_data(test_mode=False)
        print("Scheduled ingestion completed successfully.")
    except Exception as e:
        print(f"Scheduled ingestion failed: {e}")

@app.on_event("startup")
def startup_event():
    # Create tables if not exists
    Base.metadata.create_all(bind=engine)
    
    # Schedule the ingest job to run every day at 1:00 AM
    scheduler.add_job(scheduled_ingest, 'cron', hour=1, minute=0)
    scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

@app.get("/api/system/status")
def get_system_status(db: Session = Depends(get_db)):
    status = db.query(models.SystemStatus).filter(models.SystemStatus.key == "main").first()
    if status is None:
        return {"status": "unknown", "last_refresh_time": None}
    return {
        "status": status.status,
        "last_refresh_time": status.last_refresh_time
    }

@app.get("/api/stocks")
def get_stocks(
    db: Session = Depends(get_db),
    query: Optional[str] = None,
    sector: Optional[str] = None,
    market: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    sql_query = db.query(models.Company)

    if query:
        search = f"%{query}%"
        sql_query = sql_query.filter(
            (models.Company.symbol.ilike(search)) |
            (models.Company.company_name_en.ilike(search)) |
            (models.Company.company_name_th.ilike(search))
        )
    
    if sector:
        sql_query = sql_query.filter(models.Company.sector == sector)
    
    if market:
        sql_query = sql_query.filter(models.Company.market == market)
        
    total = sql_query.count()
    companies = sql_query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": companies
    }

@app.get("/api/stocks/{symbol}")
def get_stock(symbol: str, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.symbol == symbol.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Stock not found")
    return company

@app.get("/api/stocks/{symbol}/financials")
def get_stock_financials(symbol: str, db: Session = Depends(get_db)):
    # Returns chronological financials
    financials = db.query(models.FinancialQuarterly)\
        .filter(models.FinancialQuarterly.symbol == symbol.upper())\
        .order_by(models.FinancialQuarterly.year.asc(), models.FinancialQuarterly.quarter.asc())\
        .all()
    return financials

@app.get("/api/sectors")
def get_sectors(db: Session = Depends(get_db)):
    sectors = db.query(models.Company.sector, func.count(models.Company.symbol).label("count"))\
        .filter(models.Company.sector != "-")\
        .filter(models.Company.sector.isnot(None))\
        .group_by(models.Company.sector)\
        .all()
    
    return [{"sector": s[0], "count": s[1]} for s in sectors]

@app.get("/api/screener")
def run_screener(
    db: Session = Depends(get_db),
    min_roe: Optional[float] = Query(None),
    max_pe: Optional[float] = Query(None),
    limit: int = 50
):
    # For screener, we want to look at the latest financial data for each company
    # A simple way in SQLite is to find the max year/quarter, or just query the latest overall.
    # We can do a subquery or simply filter directly if we assume we just do it roughly:
    # Let's get the latest quarter available in the DB for each symbol.
    
    subq = db.query(
        models.FinancialQuarterly.symbol,
        func.max(models.FinancialQuarterly.id).label("max_id")
    ).group_by(models.FinancialQuarterly.symbol).subquery()
    
    sql_query = db.query(
        models.Company,
        models.FinancialQuarterly
    ).join(
        subq, models.Company.symbol == subq.c.symbol
    ).join(
        models.FinancialQuarterly, models.FinancialQuarterly.id == subq.c.max_id
    )

    if min_roe is not None:
        sql_query = sql_query.filter(models.FinancialQuarterly.roe >= min_roe)
    
    if max_pe is not None:
        sql_query = sql_query.filter(models.FinancialQuarterly.pe_ratio <= max_pe)
        sql_query = sql_query.filter(models.FinancialQuarterly.pe_ratio > 0) # usually we want positive P/E
    
    # Exclude rows with completely missing financial metrics
    sql_query = sql_query.filter(models.FinancialQuarterly.roe.isnot(None))
    sql_query = sql_query.filter(models.FinancialQuarterly.pe_ratio.isnot(None))
        
    results = sql_query.limit(limit).all()
    
    output = []
    for comp, fin in results:
        comp_dict = {c.name: getattr(comp, c.name) for c in comp.__table__.columns}
        fin_dict = {c.name: getattr(fin, c.name) for c in fin.__table__.columns}
        comp_dict["latest_financials"] = fin_dict
        output.append(comp_dict)
        
    return output

@app.get("/api/analysis/health/{symbol}")
def get_financial_health(symbol: str, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.symbol == symbol.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Stock not found")
        
    latest_fin = db.query(models.FinancialQuarterly)\
        .filter(models.FinancialQuarterly.symbol == symbol.upper())\
        .filter(models.FinancialQuarterly.revenue.isnot(None))\
        .order_by(models.FinancialQuarterly.year.desc(), models.FinancialQuarterly.quarter.desc())\
        .first()
        
    if not latest_fin:
        raise HTTPException(status_code=404, detail="Financial data not available")
        
    # We map what we have from quarterly to the health assessment
    return {
        "symbol": company.symbol,
        "company_name": company.company_name_en,
        "profitability": {
            "revenue": latest_fin.revenue,
            "net_profit": latest_fin.net_profit,
            "net_margin": latest_fin.net_margin,
            "roe": latest_fin.roe,
            "roa": latest_fin.roa
        },
        "financial_structure": {
            "eps": latest_fin.eps,
            "book_value_per_share": None # thaifin quarterly might not have this directly, but pb_ratio exists
        },
        "market_valuation": {
            "pe_ratio": latest_fin.pe_ratio,
            "pb_ratio": latest_fin.pb_ratio,
            "dividend_yield": latest_fin.dividend_yield
        }
    }

from pydantic import BaseModel
class CompareRequest(BaseModel):
    symbols: List[str]

class PortfolioRequest(BaseModel):
    symbols: List[str]
    risk_free_rate: float = 0.025

@app.post("/api/analysis/compare")
def compare_profitability(req: CompareRequest, db: Session = Depends(get_db)):
    results = []
    
    # We query the max ID to get the latest quarter exactly like the screener
    subq = db.query(
        models.FinancialQuarterly.symbol,
        func.max(models.FinancialQuarterly.id).label("max_id")
    ).filter(models.FinancialQuarterly.symbol.in_([s.upper() for s in req.symbols])).group_by(models.FinancialQuarterly.symbol).subquery()
    
    sql_query = db.query(
        models.Company,
        models.FinancialQuarterly
    ).join(
        subq, models.Company.symbol == subq.c.symbol
    ).join(
        models.FinancialQuarterly, models.FinancialQuarterly.id == subq.c.max_id
    )
    
    data = sql_query.all()
    for comp, fin in data:
        results.append({
            "symbol": comp.symbol,
            "company_name": comp.company_name_en,
            "sector": comp.sector,
            "revenue": fin.revenue,
            "net_profit": fin.net_profit,
            "net_margin": fin.net_margin,
            "roe": fin.roe
        })
        
    # Sort by ROE descending
    results.sort(key=lambda x: x["roe"] if x["roe"] is not None else -999, reverse=True)
    return results

@app.get("/api/analysis/sectors/ranking")
def rank_sector_performance(db: Session = Depends(get_db)):
    # Calculate average ROE per sector using the latest financial data
    subq = db.query(
        models.FinancialQuarterly.symbol,
        func.max(models.FinancialQuarterly.id).label("max_id")
    ).group_by(models.FinancialQuarterly.symbol).subquery()
    
    # We want to group by Company.sector and average the ROE
    results = db.query(
        models.Company.sector,
        func.avg(models.FinancialQuarterly.roe).label("avg_roe"),
        func.count(models.Company.symbol).label("count")
    ).join(
        subq, models.Company.symbol == subq.c.symbol
    ).join(
        models.FinancialQuarterly, models.FinancialQuarterly.id == subq.c.max_id
    ).filter(
        models.Company.sector != "-"
    ).filter(
        models.Company.sector.isnot(None)
    ).filter(
        models.FinancialQuarterly.roe.isnot(None)
    ).group_by(
        models.Company.sector
    ).order_by(
        func.avg(models.FinancialQuarterly.roe).desc()
    ).all()
    
    return [{"sector": r[0], "avg_roe": r[1], "count": r[2]} for r in results]

@app.get("/api/analysis/yield")
def dividend_yield_analysis(
    min_yield: float = Query(3.0),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    subq = db.query(
        models.FinancialQuarterly.symbol,
        func.max(models.FinancialQuarterly.id).label("max_id")
    ).group_by(models.FinancialQuarterly.symbol).subquery()
    
    sql_query = db.query(
        models.Company,
        models.FinancialQuarterly
    ).join(
        subq, models.Company.symbol == subq.c.symbol
    ).join(
        models.FinancialQuarterly, models.FinancialQuarterly.id == subq.c.max_id
    ).filter(
        models.FinancialQuarterly.dividend_yield >= min_yield
    ).order_by(
        models.FinancialQuarterly.dividend_yield.desc()
    ).limit(limit)
    
    results = sql_query.all()
    output = []
    for comp, fin in results:
        output.append({
            "symbol": comp.symbol,
            "company_name": comp.company_name_en,
            "sector": comp.sector,
            "dividend_yield": fin.dividend_yield,
            "pe_ratio": fin.pe_ratio
        })
    return output

@app.get("/api/analysis/growth")
def growth_stock_screen(
    min_revenue_growth: float = Query(20.0), # Example defaults
    min_profit_growth: float = Query(25.0),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    # To calculate growth, we need latest quarter vs same quarter last year.
    # Since we have historical data, we can define growth as:
    # (latest revenue - previous year revenue) / abs(previous year revenue) * 100
    # For simplicity and speed in SQLite, let's fetch the latest 5 quarters for all and compute in python.
    # A more optimized DB approach requires window functions depending on sqlite version.
    
    # Let's get the latest 5 quarters for all companies
    # Or just use the already defined `/financials` endpoint logic if UI fetches it individually.
    # For a screener, we must do it server-side.
    
    # Let's do a python-side screen for speed of implementation:
    all_companies = db.query(models.Company).all()
    
    candidates = []
    for comp in all_companies:
        fins = db.query(models.FinancialQuarterly)\
            .filter(models.FinancialQuarterly.symbol == comp.symbol)\
            .order_by(models.FinancialQuarterly.year.desc(), models.FinancialQuarterly.quarter.desc())\
            .limit(5).all()
            
        if len(fins) >= 5:
            latest = fins[0]
            last_year = fins[4] # usually 4 quarters ago is index 4
            
            # basic safety check that the quarter matches (e.g., Q1 vs Q1)
            if latest.quarter == last_year.quarter and latest.year == last_year.year + 1:
                if last_year.revenue and last_year.revenue != 0:
                    rev_growth = ((latest.revenue or 0) - last_year.revenue) / abs(last_year.revenue) * 100
                else:
                    rev_growth = 0
                    
                if last_year.net_profit and last_year.net_profit != 0:
                    prof_growth = ((latest.net_profit or 0) - last_year.net_profit) / abs(last_year.net_profit) * 100
                else:
                    prof_growth = 0
                    
                if rev_growth >= min_revenue_growth and prof_growth >= min_profit_growth:
                    candidates.append({
                        "symbol": comp.symbol,
                        "company_name": comp.company_name_en,
                        "sector": comp.sector,
                        "revenue_growth": rev_growth,
                        "profit_growth": prof_growth,
                        "pe_ratio": latest.pe_ratio
                    })
                    
    # Sort by rev growth
    candidates.sort(key=lambda x: x["revenue_growth"], reverse=True)
    return candidates[:limit]

@app.get("/api/analysis/dcf/{symbol}")
def calculate_dcf(symbol: str, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.symbol == symbol.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Stock not found")
        
    latest_fin = db.query(models.FinancialQuarterly)\
        .filter(models.FinancialQuarterly.symbol == symbol.upper())\
        .filter(models.FinancialQuarterly.revenue.isnot(None))\
        .filter(models.FinancialQuarterly.revenue != 0)\
        .order_by(models.FinancialQuarterly.year.desc(), models.FinancialQuarterly.quarter.desc())\
        .first()
        
    if not latest_fin:
        raise HTTPException(status_code=404, detail="Financial data not available")

    # Fetch last year to get growth
    last_year_fin = db.query(models.FinancialQuarterly)\
        .filter(models.FinancialQuarterly.symbol == symbol.upper())\
        .filter(models.FinancialQuarterly.year == latest_fin.year - 1)\
        .filter(models.FinancialQuarterly.quarter == latest_fin.quarter)\
        .first()

    revenue_yoy = 0.0
    if last_year_fin and last_year_fin.revenue:
        revenue_yoy = ((latest_fin.revenue or 0) - last_year_fin.revenue) / abs(last_year_fin.revenue) * 100

    # Calculate proxies for FCF
    # Proxy 1: Operating CF + Investing CF
    op_cf = latest_fin.operating_activities or 0
    inv_cf = latest_fin.investing_activities or 0
    fcf = op_cf + inv_cf

    # Fallback to Net Profit + D&A if FCF is 0 or missing
    if fcf == 0:
        fcf = (latest_fin.net_profit or 0) + (latest_fin.da or 0)

    # Estimate shares outstanding: Market Cap / Close Price
    shares_outstanding = 0
    if latest_fin.mkt_cap and latest_fin.close and latest_fin.close > 0:
        shares_outstanding = latest_fin.mkt_cap / latest_fin.close

    return {
        "symbol": company.symbol,
        "company_name": company.company_name_en,
        "current_price": latest_fin.close or 0,
        "shares_outstanding": shares_outstanding,
        "revenue_yoy": revenue_yoy,
        "fcf": fcf,
        "net_profit": latest_fin.net_profit or 0,
        "operating_activities": latest_fin.operating_activities or 0,
        "investing_activities": latest_fin.investing_activities or 0,
        "da": latest_fin.da or 0,
        "wacc": 0.08, # Default 8%
        "terminal_growth_rate": 0.025 # Default 2.5%
    }

@app.post("/api/portfolio/optimize")
def optimize_portfolio(req: PortfolioRequest):
    import yfinance as yf
    import pandas as pd
    from pypfopt import expected_returns, risk_models, cla
    from pypfopt.efficient_frontier import EfficientFrontier

    if not req.symbols:
        raise HTTPException(status_code=400, detail="No symbols provided")

    # Suffix .BK for Thai stocks on yfinance
    yf_symbols = [f"{s.upper()}.BK" for s in req.symbols]
    
    # Download 3 years of daily data
    data = yf.download(yf_symbols, period="3y", progress=False)
    if 'Close' in data:
        data = data['Close']
    else:
        raise HTTPException(status_code=404, detail="Could not fetch price data")
    
    if data.empty:
        raise HTTPException(status_code=404, detail="Could not fetch price data")

    # If only one symbol was passed, it returns a Series instead of DataFrame
    if isinstance(data, pd.Series):
        data = data.to_frame(name=yf_symbols[0])
        
    # Drop columns with all NaN
    data = data.dropna(axis=1, how='all')
    data = data.ffill().bfill()
    
    if data.shape[1] < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 valid stocks for optimization")

    # Calculate expected returns and sample covariance
    mu = expected_returns.mean_historical_return(data)
    S = risk_models.sample_cov(data)

    results = {}

    try:
        # 1. Max Sharpe Portfolio
        ef_sharpe = EfficientFrontier(mu, S)
        weights_sharpe = ef_sharpe.max_sharpe(risk_free_rate=req.risk_free_rate)
        cleaned_weights_sharpe = ef_sharpe.clean_weights()
        perf_sharpe = ef_sharpe.portfolio_performance(verbose=False, risk_free_rate=req.risk_free_rate)
        
        results["max_sharpe"] = {
            "weights": {k.replace('.BK', ''): v for k, v in cleaned_weights_sharpe.items()},
            "expected_return": perf_sharpe[0],
            "volatility": perf_sharpe[1],
            "sharpe_ratio": perf_sharpe[2]
        }
    except Exception as e:
        results["max_sharpe"] = {"error": str(e)}

    try:
        # 2. Min Volatility Portfolio
        ef_minvol = EfficientFrontier(mu, S)
        weights_minvol = ef_minvol.min_volatility()
        cleaned_weights_minvol = ef_minvol.clean_weights()
        perf_minvol = ef_minvol.portfolio_performance(verbose=False, risk_free_rate=req.risk_free_rate)
        
        results["min_volatility"] = {
            "weights": {k.replace('.BK', ''): v for k, v in cleaned_weights_minvol.items()},
            "expected_return": perf_minvol[0],
            "volatility": perf_minvol[1],
            "sharpe_ratio": perf_minvol[2]
        }
    except Exception as e:
        results["min_volatility"] = {"error": str(e)}

    # 3. Efficient Frontier Curve Mapping (using CLA)
    try:
        c = cla.CLA(mu, S)
        # Compute the frontier
        c.max_sharpe()
        c.efficient_frontier()
        # cla.frontier_values is a tuple: (returns, risks, weights)
        frontier_returns = c.frontier_values[0]
        frontier_risks = c.frontier_values[1]
        
        curve = []
        for i in range(len(frontier_returns)):
            curve.append({
                "expected_return": frontier_returns[i] * 100,
                "volatility": frontier_risks[i] * 100
            })
        results["frontier_curve"] = curve
    except Exception as e:
        results["frontier_curve"] = []

    return results

@app.get("/api/portfolio/filter")
def filter_portfolio_candidates(
    category: str = Query("dividend"), # dividend, growth, value
    limit: int = 10,
    db: Session = Depends(get_db)
):
    subq = db.query(
        models.FinancialQuarterly.symbol,
        func.max(models.FinancialQuarterly.id).label("max_id")
    ).group_by(models.FinancialQuarterly.symbol).subquery()
    
    sql_query = db.query(
        models.Company.symbol
    ).join(
        subq, models.Company.symbol == subq.c.symbol
    ).join(
        models.FinancialQuarterly, models.FinancialQuarterly.id == subq.c.max_id
    )

    if category == "dividend":
        sql_query = sql_query.filter(models.FinancialQuarterly.dividend_yield >= 4.0)\
                             .order_by(models.FinancialQuarterly.dividend_yield.desc())
    elif category == "growth":
        sql_query = sql_query.filter(models.FinancialQuarterly.eps_yoy >= 10.0)\
                             .filter(models.FinancialQuarterly.roe >= 15.0)\
                             .order_by(models.FinancialQuarterly.eps_yoy.desc())
    elif category == "value":
        sql_query = sql_query.filter(models.FinancialQuarterly.pe_ratio > 0)\
                             .filter(models.FinancialQuarterly.pe_ratio <= 12.0)\
                             .filter(models.FinancialQuarterly.pb_ratio <= 1.5)\
                             .order_by(models.FinancialQuarterly.pe_ratio.asc())

    results = sql_query.limit(limit).all()
    # just return array of strings
    return [r[0] for r in results]

@app.get("/api/analysis/market-valuation")
def get_market_valuation(db: Session = Depends(get_db)):
    # 1. Fetch latest quarter for ALL symbols
    subq = db.query(
        models.FinancialQuarterly.symbol,
        func.max(models.FinancialQuarterly.id).label("max_id")
    ).group_by(models.FinancialQuarterly.symbol).subquery()
    
    results = db.query(
        models.Company,
        models.FinancialQuarterly
    ).join(
        subq, models.Company.symbol == subq.c.symbol
    ).join(
        models.FinancialQuarterly, models.FinancialQuarterly.id == subq.c.max_id
    ).all()
    
    market_data = []
    
    # Standard Base Case DCF Assumptions
    WACC = 0.08
    TERM_GROWTH = 0.02
    
    for comp, fin in results:
        if not fin.close or fin.close <= 0 or not fin.mkt_cap or fin.mkt_cap <= 0:
            continue
            
        shares_out = fin.mkt_cap / fin.close
        
        net_profit = fin.net_profit if fin.net_profit else 0
        da = fin.da if fin.da else 0
        base_fcf = net_profit + da
        
        # Skip deeply unprofitable companies that break baseline DCF mathematics
        if base_fcf <= 0:
            continue
            
        proj_growth = fin.revenue_yoy if fin.revenue_yoy is not None else 0
        if proj_growth > 50: proj_growth = 50
        if proj_growth < -20: proj_growth = -20
        
        p_growth = proj_growth / 100
        
        pv_sum = 0
        current_cf = base_fcf
        for i in range(1, 6):
            current_cf = current_cf * (1 + p_growth)
            pv_sum += current_cf / ((1 + WACC) ** i)
            
        terminal_value = (current_cf * (1 + TERM_GROWTH)) / (WACC - TERM_GROWTH)
        pv_terminal = terminal_value / ((1 + WACC) ** 5)
        
        enterprise_value = pv_sum + pv_terminal
        intrinsic_value = enterprise_value / shares_out
        
        margin_of_safety = ((intrinsic_value - fin.close) / fin.close) * 100
        
        # Cap extreme outliers for clean charts
        if margin_of_safety > 300: margin_of_safety = 300
        if margin_of_safety < -100: margin_of_safety = -100
        
        roe = fin.roe if fin.roe is not None else 0
        
        quant_score = (0.5 * margin_of_safety) + (0.3 * roe) + (0.2 * proj_growth)
        
        market_data.append({
            "symbol": comp.symbol.replace('.BK', ''),
            "company_name": comp.company_name_en,
            "sector": comp.sector,
            "close": fin.close,
            "intrinsic_value": intrinsic_value,
            "margin_of_safety": margin_of_safety,
            "expected_growth": proj_growth,
            "roe": roe,
            "quant_score": quant_score
        })
        
    return market_data


# CORS setup
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
