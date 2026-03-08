import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { DollarSign, Percent, TrendingUp, AlertTriangle, Settings2, ShieldCheck, ShieldAlert, Info, Activity, ArrowRight, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://127.0.0.1:8000/api';

export default function DCFValuation({ defaultSymbol = 'PTT', onSelectSymbol }) {
    const [symbol, setSymbol] = useState(defaultSymbol);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Story-Driven Assumptions
    const [wacc, setWacc] = useState(8.0);
    const [termGrowth, setTermGrowth] = useState(2.5);
    const [projGrowth, setProjGrowth] = useState(5.0);

    // Toggle between Operating CF and Net Profit proxy
    const [useNetProfit, setUseNetProfit] = useState(false);

    const fetchDCF = () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);
        axios.get(`${API_URL}/analysis/dcf/${symbol}`)
            .then(res => {
                setData(res.data);
                let histGrowth = res.data.revenue_yoy;
                if (histGrowth > 50) histGrowth = 50;
                if (histGrowth < -20) histGrowth = -20;
                setProjGrowth(Number(histGrowth.toFixed(1)));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Could not load financial data for DCF. Try another symbol.");
                setData(null);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchDCF();
        // eslint-disable-next-line
    }, []);

    const applyPreset = (type) => {
        if (type === 'utility') {
            setWacc(7.0); setProjGrowth(3.0); setTermGrowth(2.0);
        } else if (type === 'growth') {
            setWacc(10.0); setProjGrowth(15.0); setTermGrowth(3.0);
        } else if (type === 'declining') {
            setWacc(8.5); setProjGrowth(-2.0); setTermGrowth(1.0);
        }
    };

    const calculateScenario = (wRate, projG, termG, baseFCF, shares) => {
        let rate = wRate / 100;
        let t_growth = termG / 100;
        let p_growth = projG / 100;

        if (rate <= t_growth) t_growth = rate - 0.01;

        let pvSum = 0;
        let cfs = [];
        let currentCF = baseFCF;

        for (let i = 1; i <= 5; i++) {
            currentCF = currentCF * (1 + p_growth);
            let pv = currentCF / Math.pow(1 + rate, i);
            pvSum += pv;
            cfs.push({
                year: `Year ${i}`,
                cash_flow: currentCF / 1000000000,
                pv: pv / 1000000000
            });
        }

        let terminalValue = (currentCF * (1 + t_growth)) / (rate - t_growth);
        let pvTerminal = terminalValue / Math.pow(1 + rate, 5);

        let enterpriseValue = pvSum + pvTerminal;
        let intrinsicValuePerShare = shares > 0 ? (enterpriseValue / shares) : 0;

        let terminalWeight = enterpriseValue > 0 ? (pvTerminal / enterpriseValue) * 100 : 0;

        return {
            intrinsicValue: intrinsicValuePerShare,
            cashFlows: cfs,
            pvTerminal,
            terminalWeight,
            wRate, projG, termG
        };
    };

    const { scenarios, currentPrice } = useMemo(() => {
        if (!data) return { scenarios: null, currentPrice: 0 };

        let baseFCF = useNetProfit ? (data.net_profit + data.da) : data.fcf;

        // Base Case
        const base = calculateScenario(wacc, projGrowth, termGrowth, baseFCF, data.shares_outstanding);

        // Bear Case (Higher Risk, Lower Growth)
        const bear = calculateScenario(wacc + 1.5, projGrowth - 5.0, termGrowth - 0.5, baseFCF, data.shares_outstanding);

        // Bull Case (Lower Risk, Higher Growth)
        const bull = calculateScenario(wacc - 1.0, projGrowth + 5.0, termGrowth + 0.5, baseFCF, data.shares_outstanding);

        return {
            scenarios: { bear, base, bull },
            currentPrice: data.current_price
        };
    }, [data, wacc, termGrowth, projGrowth, useNetProfit]);

    const formatBillion = (val) => val != null ? `${(val / 1000000000).toFixed(2)}B` : '0.00B';

    const getMargin = (intrinsic) => {
        if (currentPrice <= 0) return 0;
        return ((intrinsic - currentPrice) / currentPrice) * 100;
    };

    return (
        <div className="fade-in space-y-6 pb-12">
            <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="text-success" /> Pro Valuation Engine</h1>
                    <p className="text-sm text-muted">Probabilistic Discounted Cash Flow modeling.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Symbol (e.g. ADVANC)"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && fetchDCF()}
                        className="flex-1 md:w-48 text-center uppercase border-primary/30 text-white"
                    />
                    <button onClick={fetchDCF} className="btn btn-primary px-6">Analyze</button>
                </div>
            </div>

            {loading ? <div className="p-12"><div className="spinner mx-auto"></div></div> : error ? (
                <div className="glass-panel text-center text-red-400 p-8 border border-red-500/20 flex flex-col items-center gap-2">
                    <AlertTriangle size={32} />
                    {error}
                </div>
            ) : data && scenarios && (
                <div className="space-y-6">
                    {/* Layer 1: Context & Health Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-4 md:col-span-1 border-l-4 border-l-secondary flex flex-col justify-center">
                            <h3 className="text-sm font-semibold text-muted mb-1">Company Reality</h3>
                            <p className="text-xl font-bold text-white">{data.company_name}</p>
                            <span className="text-[10px] text-muted mt-2">Before projecting, observe the present trend.</span>
                        </div>
                        <div className="glass-panel p-4 flex flex-col">
                            <span className="text-[10px] text-muted uppercase">Historical Revenue YoY</span>
                            <span className={`text-xl font-bold ${data.revenue_yoy > 0 ? 'text-success' : 'text-red-400'}`}>{data.revenue_yoy?.toFixed(1)}%</span>
                        </div>
                        <div className="glass-panel p-4 flex flex-col">
                            <span className="text-[10px] text-muted uppercase">Baseline FCF Proxy</span>
                            <span className="text-xl font-bold text-accent">{formatBillion(useNetProfit ? (data.net_profit + data.da) : data.fcf)} THB</span>
                        </div>
                        <div className="glass-panel p-4 flex flex-col border border-white/5">
                            <span className="text-[10px] text-muted uppercase mb-2">FCF Proxy Source</span>
                            <div className="flex bg-black/30 rounded p-1">
                                <button className={`flex-1 text-[10px] py-1 rounded transition-colors ${!useNetProfit ? 'bg-primary text-white' : 'text-muted'}`} onClick={() => setUseNetProfit(false)}>Operating CF</button>
                                <button className={`flex-1 text-[10px] py-1 rounded transition-colors ${useNetProfit ? 'bg-primary text-white' : 'text-muted'}`} onClick={() => setUseNetProfit(true)}>Net Profit + D&A</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Left Panel: Story Assumptions & Presets */}
                        <div className="space-y-6">
                            <div className="glass-panel p-6">
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><Settings2 size={18} className="text-primary" /> Story Assumptions</h3>

                                <div className="mb-6">
                                    <p className="text-[11px] text-muted mb-2">Business Archetypes (Quick Limits):</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => applyPreset('utility')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded border border-white/5">Stable Utility</button>
                                        <button onClick={() => applyPreset('growth')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded border border-white/5">Growth Tech</button>
                                        <button onClick={() => applyPreset('declining')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded border border-white/5">Declining</button>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-white/5">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1 text-muted">
                                            <label>Business Outlook (Growth 1-5Y)</label>
                                            <span className="font-bold text-primary">{projGrowth}%</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted mb-1 px-1">
                                            <span>Bearish</span><span>Optimistic</span>
                                        </div>
                                        <input type="range" min="-20" max="40" step="0.5" value={projGrowth} onChange={(e) => setProjGrowth(Number(e.target.value))} className="w-full accent-primary" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-1 text-muted">
                                            <label>Business Risk (WACC)</label>
                                            <span className="font-bold text-accent">{wacc}%</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted mb-1 px-1">
                                            <span>Stable</span><span>Risky</span>
                                        </div>
                                        <input type="range" min="4" max="20" step="0.5" value={wacc} onChange={(e) => setWacc(Number(e.target.value))} className="w-full accent-accent" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-1 text-muted">
                                            <label>Long-Term Decay (Terminal Growth)</label>
                                            <span className="font-bold text-blue-400">{termGrowth}%</span>
                                        </div>
                                        <input type="range" min="0" max="5" step="0.1" value={termGrowth} onChange={(e) => setTermGrowth(Number(e.target.value))} className="w-full accent-blue-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-6 border border-primary/20 bg-primary/5">
                                <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><Info size={16} className="text-primary" /> Valuation Narrative</h3>
                                <p className="text-xs text-muted leading-relaxed">
                                    The Base Case model estimates an intrinsic value of <span className="text-white font-bold">฿{scenarios.base.intrinsicValue.toFixed(2)}</span>.
                                    This interprets that the core cash generation will adjust by <span className="text-white font-bold">{projGrowth}%</span> annually for 5 years, discounted at a perceived business risk rate of <span className="text-white font-bold">{wacc}%</span>.
                                </p>
                                <div className="mt-4 p-3 bg-black/40 rounded border border-white/5 text-xs text-muted">
                                    <strong className="text-white">Terminal Transparency:</strong> heavily weighted. <span className="text-accent font-bold">{scenarios.base.terminalWeight.toFixed(1)}%</span> of the computed capitalization is derived blindly from the distant Terminal Value phase.
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Probabilistic Output */}
                        <div className="xl:col-span-2 flex flex-col gap-6">

                            {/* Probabilistic Scenario Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Bear Case */}
                                <div className={`glass-panel p-4 flex flex-col justify-center items-center relative overflow-hidden ${getMargin(scenarios.bear.intrinsicValue) > 0 ? 'border border-success/30' : 'border border-red-500/30'}`}>
                                    <span className="text-[10px] text-muted uppercase mb-1 font-bold text-red-300">Bear Case</span>
                                    <span className="text-[9px] text-muted mb-2">Risk: {scenarios.bear.wRate.toFixed(1)}% | Growth: {scenarios.bear.projG.toFixed(1)}%</span>
                                    <span className="text-3xl font-bold mb-1">฿{scenarios.bear.intrinsicValue.toFixed(2)}</span>
                                    {getMargin(scenarios.bear.intrinsicValue) > 0 ? (
                                        <span className="text-[10px] text-success font-bold flex items-center gap-1"><ArrowRight size={10} className="-rotate-45" /> Margin: +{getMargin(scenarios.bear.intrinsicValue).toFixed(0)}%</span>
                                    ) : (
                                        <span className="text-[10px] text-red-400 font-bold flex items-center gap-1"><ArrowRight size={10} className="rotate-45" /> Downside: {getMargin(scenarios.bear.intrinsicValue).toFixed(0)}%</span>
                                    )}
                                </div>

                                {/* Base Case */}
                                <div className={`glass-panel p-5 flex flex-col justify-center items-center relative overflow-hidden ring-1 ring-primary transform scale-105 z-10 ${getMargin(scenarios.base.intrinsicValue) > 0 ? 'bg-success/5' : 'bg-red-500/5'}`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                                    <span className="text-xs text-muted uppercase mb-1 font-bold text-primary flex items-center gap-1"><Target size={12} /> Base Case</span>
                                    <span className="text-[9px] text-muted mb-2">Risk: {scenarios.base.wRate.toFixed(1)}% | Growth: {scenarios.base.projG.toFixed(1)}%</span>
                                    <span className="text-4xl font-bold mb-1 text-gradient-primary">฿{scenarios.base.intrinsicValue.toFixed(2)}</span>

                                    <div className="mt-2 w-full max-w-[150px] bg-black/40 h-1.5 rounded-full overflow-hidden flex items-center">
                                        {getMargin(scenarios.base.intrinsicValue) > 0 ? (
                                            <div className="bg-success h-full" style={{ width: `${Math.min(100, getMargin(scenarios.base.intrinsicValue))}%` }}></div>
                                        ) : (
                                            <div className="bg-red-500 h-full" style={{ width: `100%` }}></div>
                                        )}
                                    </div>

                                    {getMargin(scenarios.base.intrinsicValue) > 0 ? (
                                        <span className="text-[10px] text-success font-bold mt-2">Safety: +{getMargin(scenarios.base.intrinsicValue).toFixed(1)}%</span>
                                    ) : (
                                        <span className="text-[10px] text-red-400 font-bold mt-2">Hazard: {getMargin(scenarios.base.intrinsicValue).toFixed(1)}%</span>
                                    )}
                                </div>

                                {/* Bull Case */}
                                <div className={`glass-panel p-4 flex flex-col justify-center items-center relative overflow-hidden ${getMargin(scenarios.bull.intrinsicValue) > 0 ? 'border border-success/30' : 'border border-red-500/30'}`}>
                                    <span className="text-[10px] text-muted uppercase mb-1 font-bold text-success">Bull Case</span>
                                    <span className="text-[9px] text-muted mb-2">Risk: {scenarios.bull.wRate.toFixed(1)}% | Growth: {scenarios.bull.projG.toFixed(1)}%</span>
                                    <span className="text-3xl font-bold mb-1">฿{scenarios.bull.intrinsicValue.toFixed(2)}</span>
                                    {getMargin(scenarios.bull.intrinsicValue) > 0 ? (
                                        <span className="text-[10px] text-success font-bold flex items-center gap-1"><ArrowRight size={10} className="-rotate-45" /> Margin: +{getMargin(scenarios.bull.intrinsicValue).toFixed(0)}%</span>
                                    ) : (
                                        <span className="text-[10px] text-red-400 font-bold flex items-center gap-1"><ArrowRight size={10} className="rotate-45" /> Downside: {getMargin(scenarios.bull.intrinsicValue).toFixed(0)}%</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-muted px-2 py-1 bg-black/20 rounded">
                                <span>Current Market Price: <strong className="text-white text-xs">฿{currentPrice.toFixed(2)}</strong></span>
                                <span>Implied Total Cap: {formatBillion(data.shares_outstanding * currentPrice)} THB</span>
                            </div>

                            <div className="glass-panel p-6 flex-1 flex flex-col min-h-[300px]">
                                <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Base Scenario Cash Flow Cast (Billion THB)</h3>
                                <div style={{ width: '100%', height: 250, position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={scenarios.base.cashFlows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCF" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                                            <YAxis stroke="rgba(255,255,255,0.3)" tickFormatter={(val) => `฿${val.toFixed(0)}`} style={{ fontSize: '10px' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e1e24', borderColor: 'rgba(255,255,255,0.1)' }} itemStyle={{ color: '#fff' }} />
                                            <Area type="monotone" dataKey="cash_flow" name="Projected CF" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCF)" />
                                            <Area type="monotone" dataKey="pv" name="Present Value" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPV)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
