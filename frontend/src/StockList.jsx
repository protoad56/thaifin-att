import React, { useState, useEffect } from 'react';
import { api } from './api';
import { List, Search, ArrowRight } from 'lucide-react';

export default function StockList({ onSelectSymbol }) {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');

    const limit = 50;

    const fetchStocks = async (reset = false) => {
        try {
            setLoading(true);
            const currentPage = reset ? 0 : page;
            const res = await api.getStocks({
                limit,
                skip: currentPage * limit,
                query: search
            });

            const newStocks = res.data.items;
            if (reset) {
                setStocks(newStocks);
            } else {
                setStocks(prev => [...prev, ...newStocks]);
            }

            setHasMore(newStocks.length === limit);
            setPage(currentPage + 1);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchStocks(true);
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line
    }, [search]);

    return (
        <div className="fade-in space-y-6">
            <div className="glass-panel p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <List className="text-secondary" />
                    <h2 className="text-xl font-semibold">Thai Stock Universe</h2>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Filter stocks by name or symbol..."
                        className="w-full pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stocks.map(stock => (
                    <div key={stock.symbol} className="glass-panel p-5 hover:-translate-y-1 transition-transform group cursor-pointer" onClick={() => onSelectSymbol(stock.symbol)}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl text-gradient-primary">{stock.symbol}</h3>
                            <ArrowRight size={18} className="text-muted opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all ml-2" />
                        </div>
                        <p className="text-sm text-text-primary mb-1 truncate" title={stock.company_name_en}>{stock.company_name_en}</p>
                        <p className="text-xs text-muted mb-4 truncate" title={stock.company_name_th}>{stock.company_name_th}</p>

                        <div className="flex gap-2 flex-wrap">
                            <span className="text-[10px] px-2 py-1 bg-white/5 rounded-full text-muted border border-white/10">{stock.sector}</span>
                            <span className="text-[10px] px-2 py-1 bg-white/5 rounded-full text-muted border border-white/10">{stock.market}</span>
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="loader-container">
                    <div className="spinner"></div>
                </div>
            )}

            {!loading && hasMore && (
                <div className="text-center mt-6">
                    <button
                        className="btn btn-primary"
                        onClick={() => fetchStocks(false)}
                    >
                        Load More Stocks
                    </button>
                </div>
            )}

            {!loading && !hasMore && stocks.length > 0 && (
                <div className="text-center mt-6 text-muted text-sm">
                    End of results
                </div>
            )}
        </div>
    );
}
