import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

export const api = {
  getSystemStatus: () => axios.get(`${API_BASE}/system/status`),
  getStocks: (params) => axios.get(`${API_BASE}/stocks`, { params }),
  getStock: (symbol) => axios.get(`${API_BASE}/stocks/${symbol}`),
  getStockFinancials: (symbol) => axios.get(`${API_BASE}/stocks/${symbol}/financials`),
  getSectors: () => axios.get(`${API_BASE}/sectors`),
  getScreener: (params) => axios.get(`${API_BASE}/screener`, { params }),
};
