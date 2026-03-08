# Proposed Improvements for ThaiFin Web Application

Based on the testing phase and your feedback, here are the recommended features and improvements to include in future iterations of this application:

## 1. Advanced Charting & Data Integrity

- **Handling Data Gaps Automatically**: We have implemented a basic filter for missing data points (`0` value bugs). However, moving forward, we should use interpolation or explicit gap indication so users know exactly *when* a company missed a financial filing, rather than just skipping the dot on the chart.
- **Multi-Stock Comparison Charts**: Allow users to overlay the revenue or profit trend of 2 or more stocks on the *same* line chart to easily perform direct competitor analysis.

## 2. Market Sentiment & Expanded Data (Using `Stocks.search()`)

- **Top Gainers / Losers Dashboard Component**: Fetch daily market closing prices and visualize the highest moving stocks on the main dashboard for quick sentiment checks.
- **Dividend Yield Screener**: The Value Screener currently filters by P/E and ROE. Adding a specific slider and sorting mechanism solely for High Dividend Yield stocks will cater to value investors.

## 3. UI/UX Enhancements

- **Export to CSV / Excel**: Add a simple button on the `Stock List` and `Screener` pages that allows users to export the filtered tables locally for further modeling in Excel.
- **Detailed Financial Tables**: Currently, the dashboard shows basic metrics and a trend chart. Adding an expandable accordion that renders the raw 38+ data points from `quarter_dataframe` in a clean data table format would be highly beneficial for deep financial analysis.
- **Favorites / Watchlist**: Implement a LocalStorage or simple DB table allowing users to 'star' stocks and view a personalized watchlist feed upon logging in.
