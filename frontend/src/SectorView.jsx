import React, { useState, useEffect } from 'react';
import { api } from './api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

export default function SectorView() {
    const [sectors, setSectors] = useState([]);
    const [selectedSector, setSelectedSector] = useState('');
    const [sectorData, setSectorData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.getSectors().then(res => {
            // Sort sectors by count descending
            const sorted = res.data.sort((a, b) => b.count - a.count);
            setSectors(sorted);
            if (sorted.length > 0) {
                setSelectedSector(sorted[0].sector);
            }
        });
    }, []);

    useEffect(() => {
        if (!selectedSector) return;
        setLoading(true);

        // First fetch companies in sector
        api.getStocks({ sector: selectedSector, limit: 100 })
            .then(async res => {
                const companies = res.data.items;
                // Fetch financials for top companies (to get latest net margin)
                // Optimization: In a real app we'd have a specific endpoint, but here we can just do parallel requests for top 15
                const top15 = companies.slice(0, 15);
                const results = await Promise.all(
                    top15.map(c =>
                        api.getStockFinancials(c.symbol).then(f => ({
                            symbol: c.symbol,
                            name: c.company_name_en,
                            financials: f.data.length > 0 ? f.data[f.data.length - 1] : null
                        })).catch(() => ({ symbol: c.symbol, name: c.company_name_en, financials: null }))
                    )
                );

                const chartData = results
                    .filter(r => r.financials && r.financials.revenue)
                    .map(r => ({
                        name: r.symbol,
                        revenue: r.financials.revenue,
                        net_profit: r.financials.net_profit,
                        margin: r.financials.net_margin
                    }))
                    .sort((a, b) => b.revenue - a.revenue); // sort by revenue

                setSectorData(chartData);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [selectedSector]);

    return (
        <div className="fade-in space-y-6">
            <div className="glass-panel p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Layers className="text-accent" />
                        <h2 className="text-xl font-semibold">Sector Analysis</h2>
                    </div>
                    <select
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        className="w-full md:w-64"
                    >
                        {sectors.map(s => (
                            <option key={s.sector} value={s.sector}>{s.sector} ({s.count})</option>
                        ))}
                    </select>
                </div>
                <p className="text-sm text-muted">Comparing Top Companies by Revenue in {selectedSector}</p>
            </div>

            {loading ? (
                <div className="loader-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-medium mb-4">Revenue & Net Profit Comparison</h3>
                        <div className="chart-container" style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sectorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill: '#94a3b8' }} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}B`} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="net_profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
