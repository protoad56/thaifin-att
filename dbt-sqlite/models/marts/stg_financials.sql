{{ config(materialized='table', alias='financials_quarterly') }}

with raw as (
    select *
    from {{ source('thaifin_sqlite', 'raw_financials') }}
)

select
    -- Generate an auto-incrementing id for SQLAlchemy
    ROW_NUMBER() OVER () as id,
    
    symbol,
    
    -- time_str parsing to Year / Quarter
    -- if it contains 'Q', split it. e.g "2024Q1"
    CAST(SUBSTR(time_str, 1, 4) AS INTEGER) as year,
    CAST(SUBSTR(time_str, 6, 1) AS INTEGER) as quarter,

    CAST(revenue AS REAL) as revenue,
    CAST(net_profit AS REAL) as net_profit,
    CAST(earning_per_share AS REAL) as eps,
    CAST(roe AS REAL) as roe,
    CAST(roa AS REAL) as roa,
    CAST(price_earning_ratio AS REAL) as pe_ratio,
    CAST(price_book_value AS REAL) as pb_ratio,
    CAST(gpm AS REAL) as gross_margin,
    CAST(npm AS REAL) as net_margin,
    CAST(dividend_yield AS REAL) as dividend_yield,

    -- V3 specific metrics
    CAST(gross_profit AS REAL) as gross_profit,
    CAST(sga AS REAL) as sga,
    CAST(sga_per_revenue AS REAL) as sga_per_revenue,
    CAST(ebit_dattm AS REAL) as ebit_dattm,
    
    CAST(revenue_yoy AS REAL) as revenue_yoy,
    CAST(revenue_qoq AS REAL) as revenue_qoq,
    CAST(net_profit_yoy AS REAL) as net_profit_yoy,
    CAST(net_profit_qoq AS REAL) as net_profit_qoq,
    CAST(earning_per_share_yoy AS REAL) as eps_yoy,
    CAST(earning_per_share_qoq AS REAL) as eps_qoq,

    CAST(asset AS REAL) as asset,
    CAST(total_debt AS REAL) as total_debt,
    CAST(equity AS REAL) as equity,
    CAST(cash AS REAL) as cash,
    CAST(paid_up_capital AS REAL) as paid_up_capital,
    CAST(debt_to_equity AS REAL) as debt_to_equity,

    CAST(operating_activities AS REAL) as operating_activities,
    CAST(investing_activities AS REAL) as investing_activities,
    CAST(financing_activities AS REAL) as financing_activities,
    CAST(cash_cycle AS REAL) as cash_cycle,
    CAST(da AS REAL) as da,

    CAST(close AS REAL) as close,
    CAST(mkt_cap AS REAL) as mkt_cap,
    CAST(book_value_per_share AS REAL) as book_value_per_share,
    CAST(ev_per_ebit_da AS REAL) as ev_per_ebit_da

from raw
where time_str like '%Q%' -- Ensure it's effectively a quarterly row
