import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Target, BarChart2, Activity, Layers, List, TrendingUp, AlertTriangle, HelpCircle, X, ChevronRight } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';

const API_URL = 'http://127.0.0.1:8000/api';

// Contextual help popover component
function HelpPopover({ title, children }) {
    const [open, setOpen] = useState(false);
    return (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}
                title="How to read this chart"
            >
                <HelpCircle size={14} />
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '1.6rem', left: '50%', transform: 'translateX(-50%)',
                    width: '280px', background: '#1a1b26', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', padding: '12px 14px', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#fff' }}>{title}</span>
                        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0 }}><X size={13} /></button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>{children}</div>
                </div>
            )}
        </span>
    );
}

export default function QuantDashboard({ onSelectSymbol }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${API_URL}/analysis/market-valuation`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to generate market valuation map.");
                setLoading(false);
            });
    }, []);

    const { scatterData, histogramData, sectorHeatmap, leagueTable } = useMemo(() => {
        if (!data.length) return { scatterData: [], histogramData: [], sectorHeatmap: [], leagueTable: [] };

        // 1. Scatter Data (filter weird extremes further for visual clarity)
        const scatter = data.filter(d => d.expected_growth > -20 && d.expected_growth < 50 && d.margin_of_safety > -100 && d.margin_of_safety < 200);

        // 2. Histogram Distribution (Vertical Bins)
        const histBins = [
            { range: '< -50%', min: -Infinity, max: -50 },
            { range: '-50% to -25%', min: -50, max: -25 },
            { range: '-25% to 0%', min: -25, max: 0 },
            { range: '0% to 25%', min: 0, max: 25 },
            { range: '25% to 50%', min: 25, max: 50 },
            { range: '50% to 75%', min: 50, max: 75 },
            { range: '75% to 100%', min: 75, max: 100 },
            { range: '> 100%', min: 100, max: Infinity }
        ];
        const histoData = histBins.map(b => ({ name: b.range, count: 0, fill: b.max <= 0 ? '#ef4444' : '#22c55e' }));
        data.forEach(d => {
            const m = d.margin_of_safety;
            for (let i = 0; i < histBins.length; i++) {
                if (m >= histBins[i].min && m < histBins[i].max) {
                    histoData[i].count++;
                    break;
                }
            }
        });

        // 3. Sector Heatmap (Counts by Valuation Category)
        let sectorMap = {};
        data.forEach(d => {
            if (!d.sector) return;
            if (!sectorMap[d.sector]) sectorMap[d.sector] = { sector: d.sector, Cheap: 0, Fair: 0, Expensive: 0, total: 0 };

            const m = d.margin_of_safety;
            if (m > 15) sectorMap[d.sector].Cheap++;
            else if (m < -15) sectorMap[d.sector].Expensive++;
            else sectorMap[d.sector].Fair++;

            sectorMap[d.sector].total++;
        });
        const heatmap = Object.values(sectorMap)
            .filter(s => s.total >= 5) // Require at least 5 companies
            .sort((a, b) => b.total - a.total); // Sort by total companies

        // 4. League Table (Top 20 by Quant Score)
        const league = [...data].sort((a, b) => b.quant_score - a.quant_score).slice(0, 20);
        return { scatterData: scatter, histogramData: histoData, sectorHeatmap: heatmap, leagueTable: league };
    }, [data]);

    const CustomScatterTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div style={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', fontSize: '12px' }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '2px' }}>{item.symbol}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontSize: '11px' }}>{item.company_name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Sector: {item.sector}</p>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />
                    <p style={{ color: '#6366f1', fontWeight: 700 }}>Growth: {item.expected_growth?.toFixed(1)}%</p>
                    <p style={{ color: item.margin_of_safety > 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>Safety: {item.margin_of_safety?.toFixed(1)}%</p>
                    <p style={{ color: '#f59e0b', fontWeight: 700 }}>Quant Score: {item.quant_score?.toFixed(1)}</p>
                    {onSelectSymbol && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '6px' }}>Click to open Terminal →</p>}
                </div>
            );
        }
        return null;
    };

    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e1e24] border border-white/10 p-3 rounded-md shadow-xl text-xs">
                    <p className="font-bold text-white mb-1">{label}</p>
                    <p className="text-muted">Count: <span className="text-white font-bold">{payload[0].value} Stocks</span></p>
                </div>
            );
        }
        return null;
    };

    const CustomHeatmapTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[#1e1e24] border border-white/10 p-3 rounded-md shadow-xl text-xs w-48">
                    <p className="font-bold text-white mb-2 pb-1 border-b border-white/10">{label} ({data.total} Stocks)</p>
                    <p className="text-success flex justify-between gap-4 mb-1"><span>Cheap:</span> <strong className="text-white">{data.Cheap}</strong></p>
                    <p className="text-muted flex justify-between gap-4 mb-1"><span>Fair:</span> <strong className="text-white">{data.Fair}</strong></p>
                    <p className="text-red-400 flex justify-between gap-4"><span>Expensive:</span> <strong className="text-white">{data.Expensive}</strong></p>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="p-12 text-center"><div className="spinner mx-auto mb-4"></div><p className="text-muted">Calculating DCF for 800+ symbols...</p></div>;
    if (error) return <div className="p-12 text-center text-red-500">{error}</div>;

    return (
        <div className="fade-in space-y-6 pb-12">
            <div className="glass-panel p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2"><Target className="text-primary" /> Systematic Quant Dashboard</h1>
                        <p className="text-sm text-muted">Running dynamic DCF valuations across the entire Thai market ({data.length} analyzed). Shifting focus from single stocks to macro mispricings.</p>
                    </div>
                    <div className="bg-black/30 p-3 rounded border border-white/5 text-xs text-muted max-w-sm">
                        <p className="font-semibold text-white mb-1 flex items-center gap-1"><Activity size={12} className="text-accent" /> Margin of Safety Methodology</p>
                        <code className="text-[10px] text-accent block mb-1 bg-black/50 px-1 py-0.5 rounded">((Intrinsic Value - Current Price) / Current Price) × 100</code>
                        <p className="leading-tight opacity-80 text-[10px]">Calculated via Base Case DCF. Values are visually capped between <span className="text-success font-bold">+300%</span> and <span className="text-red-400 font-bold">-100%</span> to prevent extreme outliers from warping the charting distribution axes.</p>
                    </div>
                </div>
            </div>

            {/* Scatter & Histogram Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Valuation Scatter Map */}
                <div className="glass-panel p-6 xl:col-span-2 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Activity size={18} className="text-blue-400" /> Valuation Scatter Map
                                <HelpPopover title="How to Read This Chart">
                                    <p style={{ marginBottom: '6px' }}>Each dot is a company. The axes map two independent value signals:</p>
                                    <p style={{ marginBottom: '4px' }}><strong style={{ color: '#6366f1' }}>X-axis</strong> — Expected Growth (based on trailing revenue YoY %).</p>
                                    <p style={{ marginBottom: '8px' }}><strong style={{ color: '#22c55e' }}>Y-axis</strong> — Margin of Safety. How much cheaper the stock is vs its Base-Case DCF intrinsic value.</p>
                                    <p style={{ color: '#22c55e', fontWeight: 700 }}>🎯 Top-right = Hunting Ground: High Growth AND Undervalued.</p>
                                    {onSelectSymbol && <p style={{ marginTop: '8px', color: 'rgba(255,255,255,0.4)' }}>💡 Click any dot to open that stock's full Terminal.</p>}
                                </HelpPopover>
                            </h3>
                            <p className="text-xs text-muted mt-1">Expected Growth vs Margin of Safety. The top-right quadrant is the Hunting Ground (High Growth + Undervalued).</p>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 400, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" dataKey="expected_growth" name="Growth" unit="%" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} domain={[-20, 50]} label={{ value: 'Expected Growth (YoY %)', position: 'insideBottom', offset: -15, fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                                <YAxis type="number" dataKey="margin_of_safety" name="Safety" unit="%" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} domain={[-100, 200]} label={{ value: 'Margin of Safety (%)', angle: -90, position: 'insideLeft', offset: 10, fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                                <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                <Scatter
                                    name="Market"
                                    data={scatterData}
                                    fill="#3b82f6"
                                    fillOpacity={0.6}
                                    onClick={(payload) => onSelectSymbol && onSelectSymbol(payload.symbol)}
                                    style={{ cursor: onSelectSymbol ? 'pointer' : 'default' }}
                                >
                                    {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.margin_of_safety > 0 && entry.expected_growth > 0 ? '#22c55e' : entry.margin_of_safety < 0 && entry.expected_growth < 0 ? '#ef4444' : '#3b82f6'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mispricing Distribution */}
                <div className="glass-panel p-6 flex flex-col min-h-[500px]">
                    <h3 className="font-semibold flex items-center gap-2 mb-1">
                        <BarChart2 size={18} className="text-accent" /> Mispricing Distribution
                        <HelpPopover title="How to Read This Histogram">
                            <p style={{ marginBottom: '6px' }}>This histogram shows how many companies fall into each Margin of Safety bucket.</p>
                            <p style={{ marginBottom: '6px' }}><strong style={{ color: '#ef4444' }}>Red bars (left)</strong> — Stocks trading above their intrinsic value (overvalued).</p>
                            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#22c55e' }}>Green bars (right)</strong> — Stocks trading below intrinsic value (undervalued).</p>
                            <p><strong>📈 Macro read:</strong> If the distribution skews left (red), market sentiment is euphoric. If it skews right (green), systemic pessimism creates opportunity.</p>
                        </HelpPopover>
                    </h3>
                    <p className="text-xs text-muted mb-6 leading-relaxed">
                        A macro view of market sentiment. If the curve skews deeply green, the regime holds systemic pessimism (opportunities abound). A red skew indicates euphoria.
                    </p>
                    <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={histogramData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={60} />
                                <YAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                                <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {histogramData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Heatmap & League Table Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Sector Heatmap */}
                <div className="glass-panel p-6 flex flex-col min-h-[400px]">
                    <h3 className="font-semibold flex items-center gap-2 mb-1"><Layers size={18} className="text-secondary" /> Sector Valuation Heatmap</h3>
                    <p className="text-[11px] text-muted mb-4 opacity-70">Average Margin of Safety across sectors. Identifies industries systematically mispriced by the market.</p>
                    <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorHeatmap} margin={{ top: 10, right: 20, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="sector" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={60} />
                                <YAxis type="number" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                                <RechartsTooltip content={<CustomHeatmapTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                                <Bar dataKey="Cheap" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Fair" stackId="a" fill="#94a3b8" />
                                <Bar dataKey="Expensive" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 20 League Table */}
                <div className="glass-panel p-6 flex flex-col h-full max-h-[500px] overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold flex items-center gap-2"><List size={18} className="text-primary" /> Alpha League Table (Top 20)
                            <HelpPopover title="Alpha League Table">
                                <p style={{ marginBottom: '6px' }}>Stocks ranked by a composite <strong>Quant Score</strong> that blends three independent signals:</p>
                                <p style={{ marginBottom: '4px' }}>• <strong style={{ color: '#22c55e' }}>50% Margin of Safety</strong> — Is it cheap vs intrinsic value?</p>
                                <p style={{ marginBottom: '4px' }}>• <strong style={{ color: '#6366f1' }}>30% ROE</strong> — Is management creating shareholder value?</p>
                                <p style={{ marginBottom: '8px' }}>• <strong style={{ color: '#f59e0b' }}>20% Expected Growth</strong> — Is revenue expanding?</p>
                                {onSelectSymbol && <p style={{ color: 'rgba(255,255,255,0.4)' }}>💡 Click any row to open that stock's full Terminal.</p>}
                            </HelpPopover>
                        </h3>
                        <div className="text-[10px] text-muted bg-black/30 px-2 py-1 rounded border border-white/5">Score = (0.5×Safety) + (0.3×ROE) + (0.2×Growth)</div>
                    </div>

                    <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="text-xs text-muted border-b border-white/10 sticky top-0 bg-[#0F111A] z-10">
                                    <th className="py-2 pl-2 w-8">#</th>
                                    <th className="py-2">Symbol</th>
                                    <th className="py-2 text-right">Safety</th>
                                    <th className="py-2 text-right">ROE</th>
                                    <th className="py-2 text-right">Growth</th>
                                    <th className="py-2 text-right pr-2">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leagueTable.map((stock, idx) => (
                                    <tr
                                        key={stock.symbol}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        style={{ cursor: onSelectSymbol ? 'pointer' : 'default' }}
                                        onClick={() => onSelectSymbol && onSelectSymbol(stock.symbol)}
                                    >
                                        <td className="py-3 pl-2 text-xs text-muted">{idx + 1}</td>
                                        <td className="py-3 font-bold text-white">
                                            {stock.symbol}
                                            <span className="block text-[9px] text-muted font-normal">{stock.sector}</span>
                                        </td>
                                        <td className={`py-3 text-right font-semibold ${stock.margin_of_safety > 0 ? 'text-success' : 'text-red-400'}`}>
                                            {stock.margin_of_safety > 0 ? '+' : ''}{stock.margin_of_safety.toFixed(1)}%
                                        </td>
                                        <td className={`py-3 text-right ${stock.roe > 15 ? 'text-primary' : 'text-white'}`}>
                                            {stock.roe.toFixed(1)}%
                                        </td>
                                        <td className="py-3 text-right">
                                            {stock.expected_growth.toFixed(1)}%
                                        </td>
                                        <td className="py-3 text-right pr-2 font-bold text-accent">
                                            {stock.quant_score.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
