from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
import pandas as pd
import sqlite3
import os
import sys

# Need to ensure thaifin is importable
PROJECT_ROOT = "/Users/predaboon/ThaiStockAnalyser/thaifin-att"
sys.path.insert(0, PROJECT_ROOT)

from thaifin import Stock, Stocks

DB_PATH = os.path.join(PROJECT_ROOT, "thaifin.db")
DBT_DIR = os.path.join(PROJECT_ROOT, "dbt-sqlite")

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'thaifin_pipeline',
    default_args=default_args,
    description='A stable data pipeline orchestrating thaifin extraction and dbt transformation',
    schedule_interval=timedelta(days=1),
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['thaifin'],
)

def extract_companies(**kwargs):
    """
    Extracts the list of symbols and basic metadata into `raw_companies`
    """
    print("Fetching all stocks...")
    symbols = Stocks.list()
    # symbols = ["PTT", "AOT", "CPALL"] # Uncomment for fast testing
    print(f"Total symbols found: {len(symbols)}")
    
    companies_data = []
    
    for i, symbol in enumerate(symbols):
        print(f"Processing company [{i+1}/{len(symbols)}]: {symbol}")
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
            print(f"Error fetching metadata for {symbol}: {e}")
            
    # Save raw_companies to SQLite
    if companies_data:
        df_companies = pd.DataFrame(companies_data)
        conn = sqlite3.connect(DB_PATH)
        df_companies.to_sql("raw_companies", conn, if_exists="replace", index=False)
        conn.close()
        print(f"Successfully saved {len(companies_data)} companies to raw_companies.")
        
        # Pushing symbols to xcom to be picked up by the next task
        return [c["symbol"] for c in companies_data]
    else:
        raise ValueError("No company data extracted.")

def extract_financials(ti, **kwargs):
    """
    Extracts the quarterly financial dataframes and dumps to `raw_financials`
    """
    symbols = ti.xcom_pull(task_ids='extract_companies')
    if not symbols:
        print("No symbols passed from extract_companies, fetching manually across all...")
        symbols = Stocks.list()
        
    all_financials = []
    
    conn = sqlite3.connect(DB_PATH)
    # create empty table or clear existing so we easily append
    # But usually full refresh is cleaner if it fits memory. With 800 * 40 rows == 32000 rows. Memory is small enough.
    
    for i, symbol in enumerate(symbols):
        print(f"Processing financials [{i+1}/{len(symbols)}]: {symbol}")
        try:
            stock = Stock(symbol, language="en")
            df = stock.quarter_dataframe
            
            if df is not None and not df.empty:
                df = df.reset_index()
                # Ensure the 'time' index becomes a column, and might be named 'index' or 'time'
                if 'index' in df.columns:
                    df = df.rename(columns={'index': 'time_index'})
                if 'time' in df.columns:
                    df = df.rename(columns={'time': 'time_str'})
                    
                df['symbol'] = symbol
                all_financials.append(df)
        except Exception as e:
            print(f"Error extracting financials for {symbol}: {e}")
            
    if all_financials:
        final_df = pd.concat(all_financials, ignore_index=True)
        # Convert all columns to string/float generic types for raw loading to avoid dtype mismatches
        final_df = final_df.astype(str) 
        
        final_df.to_sql("raw_financials", conn, if_exists="replace", index=False)
        print(f"Successfully saved {len(final_df)} raw financial rows to SQLite.")
    else:
        print("No financial data found.")
        
    conn.close()

t1_extract_companies = PythonOperator(
    task_id='extract_companies',
    python_callable=extract_companies,
    dag=dag,
)

t2_extract_financials = PythonOperator(
    task_id='extract_financials',
    python_callable=extract_financials,
    dag=dag,
)

# Instead of native airflow dbt provider (which is chunky), we can just use the BashOperator
# Setting profiles-dir allows it to find profiles.yml in that directory instead of ~/.dbt
t3_run_dbt = BashOperator(
    task_id='dbt_run',
    bash_command=f"cd {DBT_DIR} && dbt run --profiles-dir .",
    dag=dag,
)

t1_extract_companies >> t2_extract_financials >> t3_run_dbt
