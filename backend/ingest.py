import sys
import os
import argparse
from datetime import datetime
import pandas as pd
from sqlalchemy.orm import Session

# Add the parent directory to sys.path to allow importing thaifin
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from thaifin import Stock, Stocks
from backend.database import SessionLocal, engine, Base
from backend.models import Company, FinancialQuarterly, SystemStatus

def init_db():
    Base.metadata.create_all(bind=engine)

def process_dataframe_value(val):
    if pd.isna(val):
        return None
    return float(val)

def ingest_data(test_mode=False):
    db: Session = SessionLocal()
    try:
        init_db()
        print("Fetching all stocks...")
        symbols = Stocks.list()
        
        if test_mode:
            print("Test mode enabled. Only processing 5 stocks.")
            symbols = ["PTT", "CPALL", "ADVANC", "SCB", "AOT"] # A few sample large caps

        total = len(symbols)
        for i, symbol in enumerate(symbols):
            print(f"[{i+1}/{total}] Processing {symbol}...")
            try:
                stock_en = Stock(symbol, language="en")
                
                # Check if company already exists
                company = db.query(Company).filter(Company.symbol == symbol).first()
                if not company:
                    company = Company(
                        symbol=stock_en.symbol,
                        company_name_en=stock_en.company_name,
                        industry=stock_en.industry,
                        sector=stock_en.sector,
                        market=stock_en.market,
                        website=stock_en.website
                    )
                    
                    # fetch thai name as well
                    try:
                        stock_th = Stock(symbol, language="th")
                        company.company_name_th = stock_th.company_name
                    except:
                        company.company_name_th = stock_en.company_name
                        
                    db.add(company)
                    db.commit()
                
                # Get quarterly data
                try:
                    df = stock_en.quarter_dataframe
                    if df is not None and not df.empty:
                        # Reset index to make 'time' a column
                        df = df.reset_index(names=["time"])
                        
                        # Clear old quarterly data for this symbol to avoid duplicates
                        db.query(FinancialQuarterly).filter(FinancialQuarterly.symbol == symbol).delete()
                        
                        records = df.to_dict(orient="records")
                        for record in records:
                            # Safely extract values
                            # The time column might be the index or a column. Usually it's in record if it's a column
                            # Let's extract year and quarter from the fiscal/quarter columns if they exist
                            year = int(process_dataframe_value(record.get("fiscal"))) if record.get("fiscal") else None
                            quarter = int(process_dataframe_value(record.get("quarter"))) if record.get("quarter") else None
                            
                            # if not presented, use index if possible
                            if not year and record.get("time"):
                                time_str = str(record.get("time"))
                                if "Q" in time_str:
                                    y, q = time_str.split("Q")
                                    year = int(y)
                                    quarter = int(q)
                            
                            revenue = process_dataframe_value(record.get("revenue"))
                            net_profit = process_dataframe_value(record.get("net_profit"))
                            eps = process_dataframe_value(record.get("earning_per_share"))
                            roe = process_dataframe_value(record.get("roe"))
                            roa = process_dataframe_value(record.get("roa"))
                            pe_ratio = process_dataframe_value(record.get("price_earning_ratio"))
                            pb_ratio = process_dataframe_value(record.get("price_book_value_ratio")) # Might be none
                            gross_margin = process_dataframe_value(record.get("gpm"))
                            net_margin = process_dataframe_value(record.get("npm"))
                            div_yield = process_dataframe_value(record.get("dividend_yield"))

                            # --- New Metrics Added in V3 ---
                            # Profitability & Growth
                            gross_profit = process_dataframe_value(record.get("gross_profit"))
                            sga = process_dataframe_value(record.get("sga"))
                            sga_per_revenue = process_dataframe_value(record.get("sga_per_revenue"))
                            ebit_dattm = process_dataframe_value(record.get("ebit_dattm"))
                            revenue_yoy = process_dataframe_value(record.get("revenue_yoy"))
                            revenue_qoq = process_dataframe_value(record.get("revenue_qoq"))
                            net_profit_yoy = process_dataframe_value(record.get("net_profit_yoy"))
                            net_profit_qoq = process_dataframe_value(record.get("net_profit_qoq"))
                            eps_yoy = process_dataframe_value(record.get("earning_per_share_yoy"))
                            eps_qoq = process_dataframe_value(record.get("earning_per_share_qoq"))

                            # Balance Sheet (Financial Health)
                            asset = process_dataframe_value(record.get("asset"))
                            total_debt = process_dataframe_value(record.get("total_debt"))
                            equity = process_dataframe_value(record.get("equity"))
                            cash = process_dataframe_value(record.get("cash"))
                            paid_up_capital = process_dataframe_value(record.get("paid_up_capital"))
                            debt_to_equity = process_dataframe_value(record.get("debt_to_equity"))

                            # Cash Flow
                            operating_activities = process_dataframe_value(record.get("operating_activities"))
                            investing_activities = process_dataframe_value(record.get("investing_activities"))
                            financing_activities = process_dataframe_value(record.get("financing_activities"))
                            cash_cycle = process_dataframe_value(record.get("cash_cycle"))
                            da = process_dataframe_value(record.get("da"))

                            # Valuation & Per-Share
                            close = process_dataframe_value(record.get("close"))
                            mkt_cap = process_dataframe_value(record.get("mkt_cap"))
                            book_value_per_share = process_dataframe_value(record.get("book_value_per_share"))
                            ev_per_ebit_da = process_dataframe_value(record.get("ev_per_ebit_da"))

                            record_db = FinancialQuarterly(
                                symbol=symbol,
                                year=year,
                                quarter=quarter,
                                revenue=revenue,
                                net_profit=net_profit,
                                eps=eps,
                                roe=roe,
                                roa=roa,
                                pe_ratio=pe_ratio,
                                pb_ratio=pb_ratio,
                                gross_margin=gross_margin,
                                net_margin=net_margin,
                                dividend_yield=div_yield,
                                gross_profit=gross_profit,
                                sga=sga,
                                sga_per_revenue=sga_per_revenue,
                                ebit_dattm=ebit_dattm,
                                revenue_yoy=revenue_yoy,
                                revenue_qoq=revenue_qoq,
                                net_profit_yoy=net_profit_yoy,
                                net_profit_qoq=net_profit_qoq,
                                eps_yoy=eps_yoy,
                                eps_qoq=eps_qoq,
                                asset=asset,
                                total_debt=total_debt,
                                equity=equity,
                                cash=cash,
                                paid_up_capital=paid_up_capital,
                                debt_to_equity=debt_to_equity,
                                operating_activities=operating_activities,
                                investing_activities=investing_activities,
                                financing_activities=financing_activities,
                                cash_cycle=cash_cycle,
                                da=da,
                                close=close,
                                mkt_cap=mkt_cap,
                                book_value_per_share=book_value_per_share,
                                ev_per_ebit_da=ev_per_ebit_da
                            )
                            db.add(record_db)
                        db.commit()
                            
                except Exception as e:
                    print(f"Error fetching fundamental data for {symbol}: {e}")
                    
            except Exception as e:
                print(f"Error processing company {symbol}: {e}")

        # Update system status
        status = db.query(SystemStatus).filter(SystemStatus.key == "main").first()
        if not status:
            status = SystemStatus(key="main", status="success")
            db.add(status)
        else:
            status.status = "success"
        db.commit()
        print("Ingestion complete.")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Run in test mode (only 5 stocks)")
    args = parser.parse_args()
    
    ingest_data(test_mode=args.test)
