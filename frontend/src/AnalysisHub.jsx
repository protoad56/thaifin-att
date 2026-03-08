import React, { useState, useEffect } from 'react';
import { api } from './api';
import { ShieldPlus, Trophy, HeartPulse, ArrowUpRight, DollarSign, Gem, BarChart2, Info } from 'lucide-react';
import { metricTooltips } from './tooltipData';

// New api methods added locally to avoid refactoring api.js extensively in one go if we can just wrap it
import axios from 'axios';
const API_URL = 'http://127.0.0.1:8000/api';

export default function AnalysisHub({ onSelectSymbol }) {
    const [activeSection, setActiveSection] = useState('health'); // 'health', 'sectors', 'yield', 'growth'

    return (
        <div className="fade-in space-y-6">
            {/* Analysis Hub Navigation */}
            <div className="flex gap-4 border-b border-white/10 pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveSection('health')}
                    className={`nav-link text-sm whitespace-nowrap ${activeSection === 'health' ? 'text-primary border-b-2 border-primary pb-2 -mb-[9px]' : 'text-muted'}`}
                >
                    <div className="flex items-center gap-2"><HeartPulse size={16} /> Financial Health</div>
                </button>
                <button
                    onClick={() => setActiveSection('sectors')}
                    className={`nav-link text-sm whitespace-nowrap ${activeSection === 'sectors' ? 'text-primary border-b-2 border-primary pb-2 -mb-[9px]' : 'text-muted'}`}
                >
                    <div className="flex items-center gap-2"><Trophy size={16} /> Sector Rankings</div>
                </button>
                <button
                    onClick={() => setActiveSection('yield')}
                    className={`nav-link text-sm whitespace-nowrap ${activeSection === 'yield' ? 'text-primary border-b-2 border-primary pb-2 -mb-[9px]' : 'text-muted'}`}
                >
                    <div className="flex items-center gap-2"><DollarSign size={16} /> Dividend Hunters</div>
                </button>
                <button
                    onClick={() => setActiveSection('growth')}
                    className={`nav-link text-sm whitespace-nowrap ${activeSection === 'growth' ? 'text-primary border-b-2 border-primary pb-2 -mb-[9px]' : 'text-muted'}`}
                >
                    <div className="flex items-center gap-2"><ArrowUpRight size={16} /> Growth Screen</div>
                </button>
            </div>

            {/* Content Areas */}
            {activeSection === 'health' && <HealthAssessment onSelectSymbol={onSelectSymbol} />}
            {activeSection === 'sectors' && <SectorRankings />}
            {activeSection === 'yield' && <YieldHunters onSelectSymbol={onSelectSymbol} />}
            {activeSection === 'growth' && <GrowthScreener onSelectSymbol={onSelectSymbol} />}
        </div>
    );
}

function HealthAssessment({ onSelectSymbol }) {
    const [symbol, setSymbol] = useState('PTT');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchHealth = () => {
        if (!symbol) return;
        setLoading(true);
        axios.get(`${API_URL}/analysis/health/${symbol}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setData(null);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHealth();
        // eslint-disable-next-line
    }, []);

    return (
        <div className="fade-in space-y-6">
            <div className="glass-panel p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold mb-1">Financial Health Assessment</h2>
                    <p className="text-sm text-muted">Deep dive into profitability, structure, and valuation metrics.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Enter Symbol (e.g. PTT)"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        className="flex-1 md:w-48 text-center uppercase"
                        onKeyDown={(e) => e.key === 'Enter' && fetchHealth()}
                    />
                    <button onClick={fetchHealth} className="btn btn-primary"><ShieldPlus size={18} /></button>
                </div>
            </div>

            {loading ? (
                <div className="loader-container"><div className="spinner"></div></div>
            ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profitability */}
                    <div className="glass-panel p-6">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <BarChart2 size={20} /> <h3 className="font-semibold text-lg">Profitability</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["Revenue YoY"] || "รายได้รวม"}>
                                    Revenue <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span className="font-medium">{(data.profitability.revenue / 1000).toFixed(0)}B THB</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["Net Profit"]}>
                                    Net Profit <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span className="font-medium text-success">{(data.profitability.net_profit / 1000).toFixed(0)}B THB</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["Net Margin"]}>
                                    Net Margin <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span>{data.profitability.net_margin?.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["ROE"]}>
                                    ROE <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span className="text-accent">{data.profitability.roe?.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Structure */}
                    <div className="glass-panel p-6">
                        <div className="flex items-center gap-2 mb-4 text-accent">
                            <Gem size={20} /> <h3 className="font-semibold text-lg">Financial Structure</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["EPS"]}>
                                    EPS <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span className="font-medium">{data.financial_structure.eps?.toFixed(2)} THB</span>
                            </div>
                        </div>
                    </div>

                    {/* Market Valuation */}
                    <div className="glass-panel p-6">
                        <div className="flex items-center gap-2 mb-4 text-purple-400">
                            <ArrowUpRight size={20} /> <h3 className="font-semibold text-lg">Market Valuation</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["P/E Ratio"]}>
                                    P/E Ratio <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span className="font-medium">{data.market_valuation.pe_ratio?.toFixed(2)}x</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["P/B Ratio"]}>
                                    P/BV Ratio <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span>{data.market_valuation.pb_ratio?.toFixed(2)}x</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2 group">
                                <span className="text-muted text-sm flex items-center gap-1 cursor-help" title={metricTooltips["Dividend Yield"]}>
                                    Dividend Yield <Info size={12} className="opacity-40 group-hover:opacity-100" />
                                </span>
                                <span className="text-success">{data.market_valuation.dividend_yield?.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center p-12 text-muted glass-panel border border-red-500/20">No financial health data found for this symbol.</div>
            )}
        </div>
    );
}

function SectorRankings() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_URL}/analysis/sectors/ranking`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    return (
        <div className="glass-panel p-0 overflow-hidden fade-in">
            <div className="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold mb-1 flex items-center gap-2"><Trophy className="text-accent" /> Top Performing Sectors</h2>
                    <p className="text-sm text-muted">Ranked by Average Return on Equity (ROE)</p>
                </div>
            </div>
            {loading ? <div className="p-12"><div className="spinner mx-auto"></div></div> : (
                <table className="w-full text-left">
                    <thead className="bg-black/20">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-muted">Rank</th>
                            <th className="p-4 text-sm font-semibold text-muted">Sector</th>
                            <th className="p-4 text-sm font-semibold text-muted">Avg ROE</th>
                            <th className="p-4 text-sm font-semibold text-muted text-right">Stocks Analyzed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((r, i) => (
                            <tr key={r.sector} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold text-gradient-primary">#{i + 1}</td>
                                <td className="p-4 font-medium">{r.sector}</td>
                                <td className="p-4 text-accent font-bold">{r.avg_roe?.toFixed(2)}%</td>
                                <td className="p-4 text-right text-muted">{r.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function YieldHunters({ onSelectSymbol }) {
    const [data, setData] = useState([]);
    const [minYield, setMinYield] = useState(5.0);
    const [loading, setLoading] = useState(false);

    const fetchYield = () => {
        setLoading(true);
        axios.get(`${API_URL}/analysis/yield?min_yield=${minYield}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(console.error);
    };

    useEffect(() => { fetchYield(); }, [minYield]);

    return (
        <div className="fade-in space-y-6">
            <div className="glass-panel p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold mb-1 flex items-center gap-2"><DollarSign className="text-success" /> Dividend Yield Hunters</h2>
                    <p className="text-sm text-muted">Find stocks with attractive dividend payouts.</p>
                </div>
                <div className="w-48">
                    <label className="block text-xs text-muted mb-2 text-right">Min Yield: {minYield}%</label>
                    <input
                        type="range" min="0" max="15" step="0.5"
                        value={minYield} onChange={(e) => setMinYield(e.target.value)}
                        className="w-full accent-success"
                    />
                </div>
            </div>

            <div className="glass-panel p-0 overflow-hidden">
                {loading ? <div className="p-12"><div className="spinner mx-auto"></div></div> : (
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-muted">Symbol</th>
                                <th className="p-4 text-sm font-semibold text-muted">Company</th>
                                <th className="p-4 text-sm font-semibold text-muted">Dividend Yield</th>
                                <th className="p-4 text-sm font-semibold text-muted">P/E Ratio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(r => (
                                <tr key={r.symbol} onClick={() => onSelectSymbol(r.symbol)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer">
                                    <td className="p-4 font-bold text-gradient">{r.symbol}</td>
                                    <td className="p-4 text-sm text-muted truncate max-w-[200px]" title={r.company_name}>{r.company_name}</td>
                                    <td className="p-4 text-success font-bold">{r.dividend_yield?.toFixed(2)}%</td>
                                    <td className="p-4 text-primary">{r.pe_ratio?.toFixed(2)}x</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function GrowthScreener({ onSelectSymbol }) {
    const [data, setData] = useState([]);
    const [minRevGrowth, setMinRevGrowth] = useState(10);
    const [minProfGrowth, setMinProfGrowth] = useState(15);
    const [loading, setLoading] = useState(false);

    const fetchGrowth = () => {
        setLoading(true);
        axios.get(`${API_URL}/analysis/growth?min_revenue_growth=${minRevGrowth}&min_profit_growth=${minProfGrowth}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(console.error);
    };

    useEffect(() => { fetchGrowth(); }, [minRevGrowth, minProfGrowth]);

    return (
        <div className="fade-in space-y-6">
            <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-center justify-between border-b border-purple-500/20">
                <div className="w-full md:w-auto">
                    <h2 className="text-xl font-semibold mb-1 flex items-center gap-2 text-purple-400"><ArrowUpRight /> Growth Screen</h2>
                    <p className="text-sm text-muted">High-growth revenue companies (YoY).</p>
                </div>

                <div className="flex gap-6 w-full md:w-1/2">
                    <div className="flex-1">
                        <label className="block text-xs text-muted mb-2">Min Rev Growth: {minRevGrowth}%</label>
                        <input type="range" min="-50" max="100" step="5" value={minRevGrowth} onChange={(e) => setMinRevGrowth(e.target.value)} className="w-full accent-purple-500" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-muted mb-2">Min Profit Growth: {minProfGrowth}%</label>
                        <input type="range" min="-50" max="100" step="5" value={minProfGrowth} onChange={(e) => setMinProfGrowth(e.target.value)} className="w-full accent-purple-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <div className="col-span-full py-12"><div className="spinner mx-auto"></div></div> :
                    data.map(r => (
                        <div key={r.symbol} onClick={() => onSelectSymbol(r.symbol)} className="glass-panel p-5 cursor-pointer hover:-translate-y-1 transition-transform border border-purple-500/10 hover:border-purple-500/30">
                            <h3 className="font-bold text-xl mb-1 text-gradient-primary">{r.symbol}</h3>
                            <p className="text-xs text-muted truncate mb-4">{r.company_name}</p>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">Rev Growth</span>
                                    <span className={r.revenue_growth > 0 ? "text-success" : "text-red-400"}>{r.revenue_growth.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Profit Growth</span>
                                    <span className={r.profit_growth > 0 ? "text-success" : "text-red-400"}>{r.profit_growth.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    ))
                }
                {!loading && data.length === 0 && <div className="col-span-full text-center text-muted p-8">No high-growth stocks match criteria.</div>}
            </div>
        </div>
    );
}
