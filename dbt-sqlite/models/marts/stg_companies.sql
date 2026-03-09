{{ config(materialized='table', alias='companies') }}

WITH raw AS (
    SELECT *
    FROM {{ source('thaifin_sqlite', 'raw_companies') }}
)

SELECT
    symbol,
    company_name_en,
    company_name_th,
    industry,
    sector,
    market,
    website
FROM raw
