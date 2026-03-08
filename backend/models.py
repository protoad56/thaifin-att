from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class Company(Base):
    __tablename__ = "companies"

    symbol = Column(String, primary_key=True, index=True)
    company_name_en = Column(String)
    company_name_th = Column(String)
    industry = Column(String)
    sector = Column(String)
    market = Column(String)
    website = Column(String)

class FinancialQuarterly(Base):
    __tablename__ = "financials_quarterly"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    year = Column(Integer)
    quarter = Column(Integer)
    revenue = Column(Float, nullable=True)
    net_profit = Column(Float, nullable=True)
    eps = Column(Float, nullable=True)
    roe = Column(Float, nullable=True)
    roa = Column(Float, nullable=True)
    pe_ratio = Column(Float, nullable=True)
    pb_ratio = Column(Float, nullable=True)
    gross_margin = Column(Float, nullable=True)
    net_margin = Column(Float, nullable=True)
    dividend_yield = Column(Float, nullable=True)
    
    # --- New Metrics Added in V3 ---
    # Profitability & Growth
    gross_profit = Column(Float, nullable=True)
    sga = Column(Float, nullable=True)
    sga_per_revenue = Column(Float, nullable=True)
    ebit_dattm = Column(Float, nullable=True)
    revenue_yoy = Column(Float, nullable=True)
    revenue_qoq = Column(Float, nullable=True)
    net_profit_yoy = Column(Float, nullable=True)
    net_profit_qoq = Column(Float, nullable=True)
    eps_yoy = Column(Float, nullable=True)
    eps_qoq = Column(Float, nullable=True)

    # Balance Sheet (Financial Health)
    asset = Column(Float, nullable=True)
    total_debt = Column(Float, nullable=True)
    equity = Column(Float, nullable=True)
    cash = Column(Float, nullable=True)
    paid_up_capital = Column(Float, nullable=True)
    debt_to_equity = Column(Float, nullable=True)

    # Cash Flow
    operating_activities = Column(Float, nullable=True)
    investing_activities = Column(Float, nullable=True)
    financing_activities = Column(Float, nullable=True)
    cash_cycle = Column(Float, nullable=True)
    da = Column(Float, nullable=True)

    # Valuation & Per-Share
    close = Column(Float, nullable=True)
    mkt_cap = Column(Float, nullable=True)
    book_value_per_share = Column(Float, nullable=True)
    ev_per_ebit_da = Column(Float, nullable=True)

class SystemStatus(Base):
    __tablename__ = "system_status"

    key = Column(String, primary_key=True, index=True)
    last_refresh_time = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status = Column(String)
