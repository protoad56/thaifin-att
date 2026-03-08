import React, { useState, useEffect } from 'react';
import { Search, Monitor, BarChart2, Filter, Zap, Clock, ChevronRight, Globe, Cpu, BookOpen, Users, TrendingUp } from 'lucide-react';
import { api } from './api';
import Dashboard from './Dashboard';
import Screener from './Screener';
import SectorView from './SectorView';
import StockList from './StockList';
import AnalysisHub from './AnalysisHub';
import UserGuide from './UserGuide';
import DCFValuation from './DCFValuation';
import PortfolioOptimizer from './PortfolioOptimizer';
import QuantDashboard from './QuantDashboard';
import { List, Activity, Target, DollarSign, Compass } from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Market View',
    icon: <Globe size={13} />,
    items: [
      { id: 'quant', label: 'Quant Map', icon: <Compass size={16} /> },
      { id: 'screener', label: 'Screener', icon: <Filter size={16} /> },
      { id: 'sector', label: 'Sectors', icon: <Monitor size={16} /> },
    ]
  },
  {
    label: 'Stock Analysis',
    icon: <Cpu size={13} />,
    items: [
      { id: 'dashboard', label: 'Terminal', icon: <BarChart2 size={16} /> },
      { id: 'dcf', label: 'DCF Valuation', icon: <DollarSign size={16} /> },
      { id: 'analysis', label: 'Analysis Hub', icon: <Activity size={16} /> },
    ]
  },
  {
    label: 'Portfolio',
    icon: <Target size={13} />,
    items: [
      { id: 'portfolio', label: 'Optimizer', icon: <TrendingUp size={16} /> },
    ]
  },
  {
    label: 'Resources',
    icon: <Users size={13} />,
    items: [
      { id: 'list', label: 'All Stocks', icon: <List size={16} /> },
      { id: 'guide', label: 'User Guide', icon: <BookOpen size={16} /> },
    ]
  },
];

const TAB_LABELS = {
  dashboard: 'Stock Terminal',
  screener: 'Value Discovery',
  sector: 'Sector Dynamics',
  analysis: 'Analysis Hub',
  dcf: 'DCF Valuation Engine',
  portfolio: 'Portfolio Optimizer',
  quant: 'Systematic Market Map',
  list: 'Stock Directory',
  guide: 'Learning Center',
};

const TAB_DESCRIPTIONS = {
  dashboard: 'Deep-dive into historical financials, metrics and ratios for any listed stock.',
  screener: 'Filter the entire Thai market by ROE, P/E and dividend yield thresholds.',
  sector: 'Compare revenue & profitability leaders across industries side-by-side.',
  analysis: 'Run Financial Health, Growth Screens, Dividend Hunters and Sector Rankings.',
  dcf: 'Model Discounted Cash Flows with scenario-based Bear / Base / Bull sensitivity.',
  portfolio: 'Construct an optimal basket using Markowitz Mean-Variance Optimization.',
  quant: 'Run Base-Case DCF on 800+ stocks simultaneously to surface systemic mispricings.',
  list: 'Browse and search the full directory of SET-listed companies.',
  guide: 'Beginner\'s guide to Thai stock analysis in Thai language.',
};

function App() {
  const [activeTab, setActiveTab] = useState('quant');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ status: 'unknown', time: null });
  const [topStocks, setTopStocks] = useState([]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      api.getStocks({ query: searchQuery, limit: 10 }).then(res => setSearchResults(res.data.items));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    api.getSystemStatus().then(res => {
      setSystemStatus({ status: res.data.status, time: res.data.last_refresh_time });
    }).catch(() => { });
    // Load top stocks for onboarding
    api.getStocks({ query: '', limit: 8 }).then(res => setTopStocks(res.data.items || [])).catch(() => { });
  }, []);

  const handleSelectSymbol = (symbol) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    setSearchResults([]);
    setActiveTab('dashboard');
  };

  return (
    <div className="app-container">
      <nav className="navbar" style={{ padding: '0 1.5rem', height: 'auto', minHeight: 'var(--nav-height)' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0', overflowX: 'auto', paddingBottom: '0' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, marginRight: '1.25rem' }}>
            <Zap size={24} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 6px var(--primary-glow))' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.15rem', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ThaiFin</span>
          </div>

          {/* Grouped Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.15rem', flexWrap: 'wrap', rowGap: '0.25rem', padding: '0.4rem 0' }}>
            {NAV_GROUPS.map((group, gi) => (
              <React.Fragment key={group.label}>
                {gi > 0 && <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 0.4rem', flexShrink: 0 }} />}
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.09em', marginRight: '0.2rem', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {group.icon}{group.label}
                </span>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '0.35rem 0.65rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
                      color: activeTab === item.id ? 'var(--primary)' : 'var(--text-secondary)',
                      background: activeTab === item.id ? 'var(--primary-glow)' : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-surface-hover)'; } }}
                    onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    {item.icon}{item.label}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0, marginLeft: '0.75rem' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={15} />
            <input
              type="text"
              placeholder="Search stocks (e.g. PTT)..."
              style={{ paddingLeft: '2.1rem', width: '195px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '2.8rem', right: 0, width: '320px', zIndex: 100, padding: '6px' }}
                className="glass-panel">
                {searchResults.map(s => (
                  <button
                    key={s.symbol}
                    onClick={() => handleSelectSymbol(s.symbol)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <span style={{ fontWeight: 700, background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.symbol.replace('.BK', '')}</span>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{s.company_name_en}</p>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>{s.sector}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-5 fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-1">{TAB_LABELS[activeTab]}</h1>
            <p className="text-muted text-sm">{TAB_DESCRIPTIONS[activeTab]}</p>
          </div>
          {systemStatus.time && (
            <div className="flex items-center gap-2 text-xs text-muted bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Clock size={12} className={systemStatus.status === 'success' ? 'text-success' : 'text-warning'} />
              Last Data Refresh: {new Date(systemStatus.time).toLocaleString()}
            </div>
          )}
        </div>

        {/* Tab Routing */}
        <div className="mt-4">
          {activeTab === 'dashboard' && (
            selectedSymbol ? (
              <Dashboard symbol={selectedSymbol} />
            ) : (
              <OnboardingDiscover topStocks={topStocks} onSelectSymbol={handleSelectSymbol} onNavigate={setActiveTab} />
            )
          )}
          {activeTab === 'screener' && <Screener onSelectSymbol={handleSelectSymbol} />}
          {activeTab === 'sector' && <SectorView />}
          {activeTab === 'analysis' && <AnalysisHub onSelectSymbol={handleSelectSymbol} />}
          {activeTab === 'dcf' && <DCFValuation defaultSymbol={selectedSymbol || 'PTT'} onSelectSymbol={handleSelectSymbol} />}
          {activeTab === 'portfolio' && <PortfolioOptimizer />}
          {activeTab === 'quant' && <QuantDashboard onSelectSymbol={handleSelectSymbol} />}
          {activeTab === 'list' && <StockList onSelectSymbol={handleSelectSymbol} />}
          {activeTab === 'guide' && <UserGuide />}
        </div>
      </main>
    </div>
  );
}

// Smart Onboarding / Discover Component
function OnboardingDiscover({ topStocks, onSelectSymbol, onNavigate }) {
  const WORKFLOWS = [
    { icon: <Compass size={22} className="text-accent" />, title: 'Find Undervalued Stocks', desc: 'Use the Quant Map to scan 800+ stocks and identify systemic mispricings at a glance.', action: () => onNavigate('quant'), btnLabel: 'Open Quant Map →' },
    { icon: <Filter size={22} className="text-primary" />, title: 'Screen by Fundamentals', desc: 'Filter by minimum ROE and maximum P/E to surface quality stocks at a fair price.', action: () => onNavigate('screener'), btnLabel: 'Open Screener →' },
    { icon: <DollarSign size={22} className="text-success" />, title: 'Value a Single Stock', desc: 'Pick a company, choose a business archetype preset, and run a DCF valuation instantly.', action: () => onNavigate('dcf'), btnLabel: 'Open DCF Valuation →' },
    { icon: <TrendingUp size={22} className="text-secondary" />, title: 'Optimise a Portfolio', desc: 'Add up to 20 tickers and find the Max Sharpe / Min Volatility efficient frontier mix.', action: () => onNavigate('portfolio'), btnLabel: 'Open Optimizer →' },
  ];

  return (
    <div className="fade-in space-y-8">
      {/* Hero */}
      <div className="glass-panel p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.05) 100%)' }}>
        <Zap size={36} className="text-primary glow-icon mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-2">Welcome to <span className="text-gradient">ThaiFin</span></h2>
        <p className="text-muted max-w-xl mx-auto">A professional-grade quantitative toolkit for the Thai Stock Exchange. Search for a company above, or explore one of the guided workflows below.</p>
      </div>

      {/* Workflow Cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Guided Workflows</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {WORKFLOWS.map((w, i) => (
            <button key={i} onClick={w.action} className="glass-panel p-5 text-left hover:bg-white/5 transition-all group">
              <div className="mb-3">{w.icon}</div>
              <h4 className="font-semibold text-white mb-1 group-hover:text-primary transition-colors">{w.title}</h4>
              <p className="text-xs text-muted leading-relaxed mb-3">{w.desc}</p>
              <span className="text-xs text-primary font-medium flex items-center gap-1">{w.btnLabel}<ChevronRight size={12} /></span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Pick Stocks */}
      {topStocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Quick Pick — Popular Stocks</h3>
          <div className="flex flex-wrap gap-2">
            {topStocks.map(s => (
              <button
                key={s.symbol}
                onClick={() => onSelectSymbol(s.symbol)}
                className="glass-panel px-4 py-2.5 text-sm hover:bg-white/10 transition-all flex items-center gap-2 group"
              >
                <span className="font-bold text-gradient-primary">{s.symbol.replace('.BK', '')}</span>
                <span className="text-xs text-muted group-hover:text-white/70 transition-colors">{s.company_name_en?.slice(0, 20)}</span>
                <ChevronRight size={13} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
