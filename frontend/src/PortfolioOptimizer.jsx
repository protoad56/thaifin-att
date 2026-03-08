import React, { useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Target, Search, Plus, Trash2, Shield, Zap, AlertTriangle, Filter, Sparkles } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6'];

export default function PortfolioOptimizer() {
    const [basket, setBasket] = useState(['PTT', 'AOT', 'CPALL', 'BDMS', 'ADVANC']); // Default basket
    const [searchInput, setSearchInput] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [riskFreeRate, setRiskFreeRate] = useState(2.5);

    const handleAdd = () => {
        if (!searchInput) return;
        const sym = searchInput.toUpperCase();
        if (!basket.includes(sym)) {
            setBasket([...basket, sym]);
        }
        setSearchInput('');
    };

    const handleRemove = (sym) => {
        setBasket(basket.filter(s => s !== sym));
        setResults(null);
    };

    const handleSmartFilter = async (category) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/portfolio/filter?category=${category}&limit=8`);
            setBasket(res.data);
            setResults(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load smart filter stocks.");
        } finally {
            setLoading(false);
        }
    };

    const handleOptimize = () => {
        if (basket.length < 2) {
            setError("You need at least 2 stocks to optimize.");
            return;
        }
        setLoading(true);
        setError(null);
        axios.post(`${API_URL}/portfolio/optimize`, {
            symbols: basket,
            risk_free_rate: riskFreeRate / 100
        })
            .then(res => {
                // Transform object weights to array for Recharts
                const transformWeights = (port) => {
                    if (!port || port.error) return null;
                    return Object.entries(port.weights)
                        .filter(([_, weight]) => weight > 0.001) // ignore essentially 0
                        .map(([sym, weight]) => ({ name: sym, value: weight * 100 }));
                };

                setResults({
                    max_sharpe: { ...res.data.max_sharpe, charts: transformWeights(res.data.max_sharpe) },
                    min_volatility: { ...res.data.min_volatility, charts: transformWeights(res.data.min_volatility) },
                    frontier_curve: res.data.frontier_curve || []
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.response?.data?.detail || "Error calculating optimization. Ensure valid stock symbols.");
                setLoading(false);
            });
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
        if (percent < 0.05) return null;
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold shadow-lg">
                {name}
            </text>
        );
    };

    return (
        <div className="fade-in space-y-6 pb-12">
            <div className="glass-panel p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="text-orange-400" /> Portfolio Optimizer</h1>
                        <p className="text-sm text-muted mt-1">Markowitz Efficient Frontier theory applied to Thai stocks (3 Years Trailing).</p>
                    </div>
                </div>

                {/* Basket Builder */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <h3 className="font-semibold text-sm mb-3">Portfolio Basket ({basket.length})</h3>

                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Add Symbol..."
                                        className="w-full pl-8 py-1.5 text-sm uppercase"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    />
                                </div>
                                <button onClick={handleAdd} className="btn btn-primary px-3 py-1.5 rounded-md"><Plus size={16} /></button>
                            </div>

                            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                {basket.map(sym => (
                                    <div key={sym} className="flex justify-between items-center bg-white/5 px-2 py-1.5 rounded-md text-sm border border-white/5">
                                        <span className="font-bold text-gradient-primary">{sym}</span>
                                        <button onClick={() => handleRemove(sym)} className="text-red-400/50 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-xs text-muted mb-2 flex items-center gap-1"><Sparkles size={12} /> Smart Filters (Live Demo)</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleSmartFilter('dividend')} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded border border-white/5 transition-colors">High Dividend</button>
                                    <button onClick={() => handleSmartFilter('growth')} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded border border-white/5 transition-colors">Growth (ROE)</button>
                                    <button onClick={() => handleSmartFilter('value')} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded border border-white/5 transition-colors col-span-2">Deep Value (Low P/E)</button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted">Risk-Free Rate:</span>
                                    <span className="text-accent">{riskFreeRate}%</span>
                                </div>
                                <input type="range" min="0" max="6" step="0.25" value={riskFreeRate} onChange={(e) => setRiskFreeRate(Number(e.target.value))} className="w-full accent-accent" />
                            </div>

                            <button onClick={handleOptimize} className="w-full btn btn-primary mt-4 py-2 flex justify-center items-center gap-2">
                                <Zap size={16} /> Run Optimization
                            </button>
                        </div>
                    </div>

                    {/* Results Data */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="h-full flex flex-col justify-center items-center p-12 glass-panel">
                                <div className="spinner mb-4"></div>
                                <p className="text-muted text-sm blink">Running Covariance Matrix & Solving Constraints...</p>
                            </div>
                        ) : error ? (
                            <div className="h-full flex flex-col justify-center items-center border border-red-500/20 glass-panel text-red-400 p-8 text-center">
                                <AlertTriangle size={32} className="mb-2" />
                                <p>{error}</p>
                            </div>
                        ) : results ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                                {/* Max Sharpe */}
                                <div className={`glass-panel p-4 flex flex-col border border-primary/20 ${results.max_sharpe.error ? 'opacity-50' : ''}`}>
                                    <div className="text-center mb-2 border-b border-white/10 pb-2">
                                        <h3 className="font-bold text-lg text-primary flex justify-center items-center gap-2"><Zap size={18} /> Max Sharpe Ratio</h3>
                                        <p className="text-xs text-muted">Optimal risk-adjusted returns</p>
                                    </div>

                                    {results.max_sharpe.error ? (
                                        <div className="flex-1 flex items-center justify-center text-xs text-red-400 p-4">{results.max_sharpe.error}</div>
                                    ) : (
                                        <>
                                            <div style={{ width: '100%', height: 224, position: 'relative' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={results.max_sharpe.charts} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={renderCustomLabel}>
                                                            {results.max_sharpe.charts.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(val) => `${val.toFixed(2)}%`} contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#333' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-white/5 text-center">
                                                <div>
                                                    <p className="text-[10px] text-muted uppercase">Expected Return</p>
                                                    <p className="font-bold text-success">{(results.max_sharpe.expected_return * 100).toFixed(1)}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted uppercase">Risk (Volatility)</p>
                                                    <p className="font-bold text-red-400">{(results.max_sharpe.volatility * 100).toFixed(1)}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted uppercase">Sharpe Ratio</p>
                                                    <p className="font-bold text-gradient-primary">{results.max_sharpe.sharpe_ratio.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Min Volatility */}
                                <div className={`glass-panel p-4 flex flex-col border border-blue-400/20 ${results.min_volatility.error ? 'opacity-50' : ''}`}>
                                    <div className="text-center mb-2 border-b border-white/10 pb-2">
                                        <h3 className="font-bold text-lg text-blue-400 flex justify-center items-center gap-2"><Shield size={18} /> Min Volatility</h3>
                                        <p className="text-xs text-muted">Safest possible asset allocation</p>
                                    </div>

                                    {results.min_volatility.error ? (
                                        <div className="flex-1 flex items-center justify-center text-xs text-red-400 p-4">{results.min_volatility.error}</div>
                                    ) : (
                                        <>
                                            <div style={{ width: '100%', height: 224, position: 'relative' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={results.min_volatility.charts} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={renderCustomLabel}>
                                                            {results.min_volatility.charts.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(val) => `${val.toFixed(2)}%`} contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#333' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-white/5 text-center">
                                                <div>
                                                    <p className="text-[10px] text-muted uppercase">Expected Return</p>
                                                    <p className="font-bold text-success">{(results.min_volatility.expected_return * 100).toFixed(1)}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted uppercase">Risk (Volatility)</p>
                                                    <p className="font-bold text-orange-400">{(results.min_volatility.volatility * 100).toFixed(1)}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-muted uppercase">Sharpe Ratio</p>
                                                    <p className="font-bold text-gradient-accent">{results.min_volatility.sharpe_ratio.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Efficient Frontier Chart */}
                                {results.frontier_curve && results.frontier_curve.length > 0 && (
                                    <div className="md:col-span-2 glass-panel p-4 flex flex-col h-72">
                                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Filter size={18} className="text-accent" /> Efficient Frontier Curve</h3>
                                        <p className="text-xs text-muted mb-4">Risk (Volatility) vs Expected Return</p>
                                        <div style={{ width: '100%', height: 288, position: 'relative' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={results.frontier_curve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                    <defs>
                                                        <linearGradient id="colorFrontier" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis
                                                        dataKey="volatility"
                                                        type="number"
                                                        domain={['dataMin - 2', 'dataMax + 2']}
                                                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                                                        stroke="rgba(255,255,255,0.3)"
                                                    />
                                                    <YAxis
                                                        dataKey="expected_return"
                                                        type="number"
                                                        domain={['dataMin - 5', 'dataMax + 5']}
                                                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                                                        stroke="rgba(255,255,255,0.3)"
                                                    />
                                                    <Tooltip
                                                        formatter={(val, name) => [`${val.toFixed(2)}%`, name === 'expected_return' ? 'Return' : 'Risk']}
                                                        labelFormatter={(val) => `Volatility: ${Number(val).toFixed(2)}%`}
                                                        contentStyle={{ backgroundColor: '#1e1e24', borderColor: '#333' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="expected_return"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorFrontier)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col justify-center items-center opacity-30">
                                <Target size={64} className="mb-4 text-muted" />
                                <p className="text-muted">Build a basket and run optimization to see allocations.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
