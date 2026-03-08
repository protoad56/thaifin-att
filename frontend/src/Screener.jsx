import React, { useState, useEffect } from 'react';
import { api } from './api';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Filter } from 'lucide-react';

export default function Screener({ onSelectSymbol }) {
    const [minRoe, setMinRoe] = useState(15);
    const [maxPe, setMaxPe] = useState(15);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchScreener = async () => {
        setLoading(true);
        try {
            const res = await api.getScreener({ min_roe: minRoe, max_pe: maxPe, limit: 100 });
            setResults(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScreener();
        // eslint-disable-next-line
    }, [minRoe, maxPe]);

    const chartData = results.map(r => ({
        name: r.symbol,
        pe: r.latest_financials?.pe_ratio || 0,
        roe: r.latest_financials?.roe || 0,
        dividend_yield: r.latest_financials?.dividend_yield || 0
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="glass-panel p-3" style={{ border: 'none', background: 'rgba(10,10,12,0.9)' }}>
                    <p className="font-bold text-lg mb-1">{data.name}</p>
                    <p className="text-sm text-primary">P/E Ratio: {data.pe.toFixed(2)}x</p>
                    <p className="text-sm text-accent">ROE: {data.roe.toFixed(2)}%</p>
                    <p className="text-sm text-success">Yield: {data.dividend_yield.toFixed(2)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fade-in space-y-6">
            <div className="glass-panel p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Filter className="text-primary" />
                    <h2 className="text-xl font-semibold">Value Screener</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block text-sm text-muted mb-2">Minimum ROE (%) - {minRoe}%</label>
                        <input
                            type="range"
                            min="0" max="50" step="1"
                            value={minRoe}
                            onChange={(e) => setMinRoe(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-muted mb-2">Maximum P/E (x) - {maxPe}x</label>
                        <input
                            type="range"
                            min="5" max="50" step="1"
                            value={maxPe}
                            onChange={(e) => setMaxPe(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loader-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-medium mb-4">Valuation Map (ROE vs P/E)</h3>
                        <div className="chart-container" style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" dataKey="pe" name="P/E Ratio" stroke="rgba(255,255,255,0.4)" tick={{ fill: '#94a3b8' }} label={{ value: 'P/E Ratio', position: 'insideBottomRight', offset: 0, fill: '#64748b' }} />
                                    <YAxis type="number" dataKey="roe" name="ROE" stroke="rgba(255,255,255,0.4)" tick={{ fill: '#94a3b8' }} label={{ value: 'ROE (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                                    <ZAxis type="number" dataKey="dividend_yield" range={[50, 400]} name="Yield" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                    <Scatter data={chartData} fill="#6366f1" opacity={0.8} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-sm text-muted mt-2 mt-4 text-center">Bubble size represents Dividend Yield</p>
                    </div>

                    <div className="glass-panel p-0 overflow-hidden" autoFocus>
                        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-muted">Symbol</th>
                                    <th className="p-4 text-sm font-semibold text-muted">ROE</th>
                                    <th className="p-4 text-sm font-semibold text-muted">P/E</th>
                                    <th className="p-4 text-sm font-semibold text-muted text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.slice(0, 15).map(r => (
                                    <tr key={r.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-gradient">{r.symbol}</td>
                                        <td className="p-4 text-accent">{r.latest_financials?.roe?.toFixed(2)}%</td>
                                        <td className="p-4 text-primary">{r.latest_financials?.pe_ratio?.toFixed(2)}x</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => onSelectSymbol(r.symbol)}
                                                className="text-xs bg-primary/20 text-primary hover:bg-primary/40 px-3 py-1.5 rounded-md transition-colors font-medium border border-primary/20"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {results.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-muted">No stocks exactly match this criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {results.length > 15 && <div className="p-4 text-center text-sm text-muted bg-white/5 border-t border-white/10">Showing top 15 results out of {results.length}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
