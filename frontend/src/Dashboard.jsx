import React, { useState, useEffect } from 'react';
import { api } from './api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, DollarSign, Briefcase, FileText, Info } from 'lucide-react';
import { metricTooltips } from './tooltipData';

function MetricRow({ label, value, format }) {
    const tooltipText = metricTooltips[label] || "";

    if (value === null || value === undefined) {
        return (
            <div className="flex justify-between text-sm border-b border-white/5 pb-1 px-1">
                <span className="text-muted">{label}</span>
                <span className="text-muted/50">-</span>
            </div>
        );
    }

    let displayValue = value.toFixed(2);
    let colorClass = "text-white/90";

    if (format === 'M_THB') {
        if (Math.abs(value) >= 1000000000) {
            displayValue = `${(value / 1000000000).toFixed(2)}B`;
        } else if (Math.abs(value) >= 1000000) {
            displayValue = `${(value / 1000000).toFixed(2)}M`;
        } else {
            displayValue = `${value.toFixed(2)}`;
        }
    } else if (format === 'THB') {
        displayValue = `${value.toFixed(2)}`;
    } else if (format === '%') {
        displayValue = `${value.toFixed(2)}%`;
        if (value > 0 && !label.includes('SGA') && !label.includes('Debt')) colorClass = "text-success";
        if (value < 0 && !label.includes('SGA') && !label.includes('Debt')) colorClass = "text-red-400";
    } else if (format === 'x') {
        displayValue = `${value.toFixed(2)}x`;
    } else if (format === 'Days') {
        displayValue = `${value.toFixed(0)}`;
    }

    return (
        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-1 hover:bg-white/5 transition-colors px-1 rounded flex-wrap gap-2 group">
            <span
                className="text-muted flex items-center gap-1 cursor-help relative"
                title={tooltipText}
            >
                {label}
                {tooltipText && <Info size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />}
            </span>
            <span className={`font-medium ${colorClass} text-right`}>{displayValue}</span>
        </div>
    );
}

export default function Dashboard({ symbol }) {
    const [company, setCompany] = useState(null);
    const [financials, setFinancials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!symbol) return;

        setLoading(true);
        // Fetch company info and financials
        Promise.all([
            api.getStock(symbol),
            api.getStockFinancials(symbol)
        ])
            .then(([compRes, finRes]) => {
                setCompany(compRes.data);

                // format financials for charting
                const formatted = finRes.data
                    .filter(f => f.revenue && f.revenue !== 0 && f.net_profit && f.net_profit !== 0)
                    .map(f => ({
                        ...f,
                        period: `${f.year}Q${f.quarter}`,
                        revenue: f.revenue || 0,
                        net_profit: f.net_profit || 0,
                        margin: f.net_margin || 0
                    }));
                setFinancials(formatted);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [symbol]);

    if (loading) {
        return (
            <div className="loader-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!company) {
        return <div className="text-muted fade-in">Select a company to view dashboard.</div>;
    }

    const latest = financials.length > 0 ? financials[financials.length - 1] : null;

    return (
        <div className="fade-in space-y-6">
            <div className="glass-panel p-6 mb-6">
                <h1 className="text-2xl font-bold text-gradient mb-2">{company.company_name_en}</h1>
                <h2 className="text-lg text-muted mb-4">{company.company_name_th}</h2>

                <div className="flex gap-4 flex-wrap">
                    <span className="glass-panel px-3 py-1 text-sm rounded-full text-gradient-primary border-primary/30">{company.sector}</span>
                    <span className="glass-panel px-3 py-1 text-sm rounded-full border-white/10">{company.industry}</span>
                    <span className="glass-panel px-3 py-1 text-sm rounded-full text-gradient-accent border-accent/30">{company.market}</span>
                </div>
            </div>

            {latest && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="glass-panel p-6 stat-card">
                        <div className="flex justify-between items-center mb-2">
                            <span className="stat-title">Latest Revenue</span>
                            <DollarSign size={20} className="text-primary" />
                        </div>
                        <span className="stat-value text-gradient-primary">
                            {(latest.revenue / 1000000000).toFixed(2)}B
                        </span>
                    </div>

                    <div className="glass-panel p-6 stat-card">
                        <div className="flex justify-between items-center mb-2">
                            <span className="stat-title">Net Profit</span>
                            <TrendingUp size={20} className="text-success" />
                        </div>
                        <span className="stat-value">
                            {(latest.net_profit / 1000000000).toFixed(2)}B
                        </span>
                    </div>

                    <div className="glass-panel p-6 stat-card">
                        <div className="flex justify-between items-center mb-2">
                            <span className="stat-title">ROE</span>
                            <Activity size={20} className="text-accent" />
                        </div>
                        <span className="stat-value text-gradient-accent">
                            {latest.roe?.toFixed(2)}%
                        </span>
                    </div>

                    <div className="glass-panel p-6 stat-card">
                        <div className="flex justify-between items-center mb-2">
                            <span className="stat-title">P/E Ratio</span>
                            <Briefcase size={20} className="text-secondary" />
                        </div>
                        <span className={`stat-value ${latest.pe_ratio < 15 ? 'text-success' : ''}`}>
                            {latest.pe_ratio?.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            <div className="glass-panel p-6 mb-6">
                <h3 className="text-xl mb-6 font-semibold">10-Year Financial Trend</h3>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={financials} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="period" stroke="rgba(255,255,255,0.4)" tick={{ fill: '#94a3b8' }} />
                            <YAxis yAxisId="left" stroke="rgba(255,255,255,0.4)" tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000000000).toFixed(0)}B`} />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                            <Line yAxisId="left" type="monotone" dataKey="net_profit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Comprehensive 38 Metrics Grid */}
            <div className="glass-panel p-6 mb-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary"><FileText size={20} /></div>
                    <div>
                        <h3 className="text-xl font-semibold">Comprehensive Financial Metrics</h3>
                        <p className="text-xs text-muted">Latest mapped quarter details from the thaifin library.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                    {/* Category 1: Profitability & Growth */}
                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-primary font-bold border-b border-primary/20 pb-2 mb-3">Profitability & Growth</h4>
                        <MetricRow label="Gross Profit" value={latest.gross_profit} format="M_THB" />
                        <MetricRow label="Net Profit" value={latest.net_profit} format="M_THB" />
                        <MetricRow label="Revenue YoY" value={latest.revenue_yoy} format="%" />
                        <MetricRow label="Revenue QoQ" value={latest.revenue_qoq} format="%" />
                        <MetricRow label="Net Profit YoY" value={latest.net_profit_yoy} format="%" />
                        <MetricRow label="Net Profit QoQ" value={latest.net_profit_qoq} format="%" />
                        <MetricRow label="EPS YoY" value={latest.eps_yoy} format="%" />
                        <MetricRow label="EPS QoQ" value={latest.eps_qoq} format="%" />
                        <MetricRow label="Gross Margin" value={latest.gross_margin} format="%" />
                        <MetricRow label="Net Margin" value={latest.net_margin} format="%" />
                        <MetricRow label="SGA" value={latest.sga} format="M_THB" />
                        <MetricRow label="SGA % Rev" value={latest.sga_per_revenue} format="%" />
                        <MetricRow label="EBIT (TTM)" value={latest.ebit_dattm} format="M_THB" />
                    </div>

                    {/* Category 2: Balance Sheet */}
                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-accent font-bold border-b border-accent/20 pb-2 mb-3">Balance Sheet (Health)</h4>
                        <MetricRow label="Total Assets" value={latest.asset} format="M_THB" />
                        <MetricRow label="Total Debt" value={latest.total_debt} format="M_THB" />
                        <MetricRow label="Total Equity" value={latest.equity} format="M_THB" />
                        <MetricRow label="Cash" value={latest.cash} format="M_THB" />
                        <MetricRow label="Paid-up Capital" value={latest.paid_up_capital} format="M_THB" />
                        <MetricRow label="Debt to Equity" value={latest.debt_to_equity} format="x" />
                        <MetricRow label="ROA" value={latest.roa} format="%" />
                        <MetricRow label="ROE" value={latest.roe} format="%" />
                    </div>

                    {/* Category 3: Cash Flow */}
                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-secondary font-bold border-b border-secondary/20 pb-2 mb-3">Cash Flow Operations</h4>
                        <MetricRow label="Operating CF" value={latest.operating_activities} format="M_THB" />
                        <MetricRow label="Investing CF" value={latest.investing_activities} format="M_THB" />
                        <MetricRow label="Financing CF" value={latest.financing_activities} format="M_THB" />
                        <MetricRow label="Cash Cycle" value={latest.cash_cycle} format="Days" />
                        <MetricRow label="D&A" value={latest.da} format="M_THB" />
                    </div>

                    {/* Category 4: Valuation & Per-Share */}
                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-success font-bold border-b border-success/20 pb-2 mb-3">Market Valuation</h4>
                        <MetricRow label="Close Price" value={latest.close} format="THB" />
                        <MetricRow label="Market Cap" value={latest.mkt_cap} format="M_THB" />
                        <MetricRow label="P/E Ratio" value={latest.pe_ratio} format="x" />
                        <MetricRow label="P/B Ratio" value={latest.pb_ratio} format="x" />
                        <MetricRow label="EV/EBITDA" value={latest.ev_per_ebit_da} format="x" />
                        <MetricRow label="Dividend Yield" value={latest.dividend_yield} format="%" />
                        <MetricRow label="EPS" value={latest.eps} format="THB" />
                        <MetricRow label="BVPS" value={latest.book_value_per_share} format="THB" />
                    </div>
                </div>
            </div>
        </div>
    );
}
