import pandas as pd
import sqlite3
import os
import sys
from dagster import asset, Output, AssetExecutionContext, Config
from dbt.cli.main import dbtRunner, dbtRunnerResult

# Ensure thaifin is importable
PROJECT_ROOT = "/Users/predaboon/ThaiStockAnalyser/thaifin-att"
sys.path.insert(0, PROJECT_ROOT)

from thaifin import Stock, Stocks

DB_PATH = os.path.join(PROJECT_ROOT, "thaifin.db")

class ExtractionConfig(Config):
    # Set to true to extract just top 3 for fast iteration
    fast_dev_mode: bool = False

@asset(group_name="extraction", description="Downloads all Thai stock metadata into SQLite")
def raw_companies(context: AssetExecutionContext, config: ExtractionConfig) -> list[str]:
    context.log.info("Fetching all stocks...")
    symbols = Stocks.list()
    
    if config.fast_dev_mode:
        symbols = ["PTT", "AOT", "ADVANC"]
        
    context.log.info(f"Total symbols found: {len(symbols)}")
    
    companies_data = []
    
    for i, symbol in enumerate(symbols):
        if i % 50 == 0:
            context.log.info(f"Processing company [{i+1}/{len(symbols)}]: {symbol}")
        try:
            stock_en = Stock(symbol, language="en")
            
            company_th_name = stock_en.company_name
            try:
                stock_th = Stock(symbol, language="th")
                company_th_name = stock_th.company_name
            except Exception:
                pass

            companies_data.append({
                "symbol": stock_en.symbol,
                "company_name_en": stock_en.company_name,
                "company_name_th": company_th_name,
                "industry": stock_en.industry,
                "sector": stock_en.sector,
                "market": stock_en.market,
                "website": stock_en.website
            })
        except Exception as e:
            context.log.warning(f"Error fetching metadata for {symbol}: {e}")
            
    if companies_data:
        df_companies = pd.DataFrame(companies_data)
        conn = sqlite3.connect(DB_PATH)
        df_companies.to_sql("raw_companies", conn, if_exists="replace", index=False)
        conn.close()
        context.log.info(f"Successfully saved {len(companies_data)} companies to raw_companies.")
        
        return [c["symbol"] for c in companies_data]
    else:
        raise ValueError("No company data extracted.")


@asset(group_name="extraction", description="Downloads all quarterly financials into SQLite")
def raw_financials(context: AssetExecutionContext, raw_companies: list[str]) -> None:
    symbols = raw_companies
    all_financials = []
    
    for i, symbol in enumerate(symbols):
        if i % 10 == 0:
            context.log.info(f"Processing financials [{i+1}/{len(symbols)}]: {symbol}")
        try:
            stock = Stock(symbol, language="en")
            df = stock.quarter_dataframe
            
            if df is not None and not df.empty:
                df = df.reset_index()
                # Ensure time index is normalized
                if 'index' in df.columns:
                    df = df.rename(columns={'index': 'time_index'})
                if 'time' in df.columns:
                    df = df.rename(columns={'time': 'time_str'})
                    
                df['symbol'] = symbol
                all_financials.append(df)
        except Exception as e:
            context.log.warning(f"Error extracting financials for {symbol}: {e}")
            
    if all_financials:
        final_df = pd.concat(all_financials, ignore_index=True)
        final_df = final_df.astype(str) 
        
        conn = sqlite3.connect(DB_PATH)
        final_df.to_sql("raw_financials", conn, if_exists="replace", index=False)
        conn.close()
        context.log.info(f"Successfully saved {len(final_df)} raw financial rows to SQLite.")
    else:
        context.log.warning("No financial data found.")

from dagster import AssetKey

from dagster_dbt import dbt_assets, DbtCliResource, DagsterDbtTranslator

DBT_PROJECT_DIR = os.path.join(PROJECT_ROOT, "dbt-sqlite")
DBT_MANIFEST_PATH = os.path.join(DBT_PROJECT_DIR, "target", "manifest.json")

dbt_resource = DbtCliResource(project_dir=DBT_PROJECT_DIR)

class CustomDagsterDbtTranslator(DagsterDbtTranslator):
    def get_asset_key(self, dbt_resource_props):
        # Map the dbt source 'raw_financials' to our python asset 'raw_financials'
        if dbt_resource_props["resource_type"] == "source" and dbt_resource_props["name"] == "raw_financials":
            return AssetKey("raw_financials")
        return super().get_asset_key(dbt_resource_props)

@dbt_assets(
    manifest=DBT_MANIFEST_PATH,
    dagster_dbt_translator=CustomDagsterDbtTranslator()
)
def thaifin_dbt_assets(context: AssetExecutionContext, dbt: DbtCliResource):
    # Depending on raw_financials means this won't run until extraction finishes
    yield from dbt.cli(["run"], context=context).stream()
