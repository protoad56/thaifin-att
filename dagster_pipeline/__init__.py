from dagster import Definitions, ScheduleDefinition, define_asset_job
from .assets.pipeline import raw_companies, raw_financials, thaifin_dbt_assets, dbt_resource

# Define a single job that runs everything
all_assets_job = define_asset_job(
    name="thaifin_extraction_job",
    selection=[raw_companies, raw_financials, thaifin_dbt_assets]
)

# Run daily at 1:00 AM BKK
daily_refresh_schedule = ScheduleDefinition(
    job=all_assets_job,
    cron_schedule="0 1 * * *",
)

defs = Definitions(
    assets=[raw_companies, raw_financials, thaifin_dbt_assets],
    schedules=[daily_refresh_schedule],
    resources={
        "dbt": dbt_resource
    }
)
