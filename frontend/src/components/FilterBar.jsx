import React from 'react';
import { SlidersHorizontal, RefreshCw, AlertTriangle, ShieldAlert, X } from 'lucide-react';

export default function FilterBar({ filters, setFilters, onRefresh, isRefreshing }) {
  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'traffic', label: 'Traffic Noise' },
    { id: 'construction', label: 'Construction' },
    { id: 'loudspeakers', label: 'Loudspeakers' },
    { id: 'industrial', label: 'Industrial' },
    { id: 'ambient', label: 'Ambient / Quiet' }
  ];

  const sources = [
    { id: 'all', label: 'All Telemetry Sources' },
    { id: 'iot_sensor', label: 'Municipal IoT Sensors' },
    { id: 'crowdsourced', label: 'Citizen Crowdsourced' }
  ];

  const hasActiveFilters = filters.category !== 'all' || filters.source_type !== 'all' || filters.min_db;

  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-2 sm:p-3 shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        
        {/* Filter Label */}
        <div className="flex items-center space-x-1.5 text-xs font-bold text-base-content/80 shrink-0 px-1">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="hidden xs:inline">Filters:</span>
        </div>

        {/* Category Dropdown (Compact fixed width on desktop) */}
        <select
          value={filters.category || 'all'}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          className="select select-sm select-bordered text-xs bg-base-100 w-36 sm:w-44 shrink-0 rounded-xl focus:border-primary font-medium"
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {/* Source Type Dropdown (Compact fixed width on desktop) */}
        <select
          value={filters.source_type || 'all'}
          onChange={(e) => setFilters(prev => ({ ...prev, source_type: e.target.value }))}
          className="select select-sm select-bordered text-xs bg-base-100 w-40 sm:w-48 shrink-0 rounded-xl focus:border-primary font-medium"
        >
          {sources.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        {/* Severity Quick Toggles */}
        <div className="inline-flex items-center space-x-1 bg-base-200 p-1 rounded-xl border border-base-300 shrink-0">
          <button
            onClick={() => setFilters(prev => ({ ...prev, min_db: prev.min_db === '70' ? '' : '70' }))}
            className={`btn btn-xs gap-1 border-0 rounded-lg transition-all ${
              filters.min_db === '70' ? 'bg-error text-white font-bold shadow' : 'btn-ghost text-base-content/70 hover:text-base-content'
            }`}
            title="Show Violations (>70 dB)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>&gt;70dB Violations</span>
          </button>

          <button
            onClick={() => setFilters(prev => ({ ...prev, min_db: prev.min_db === '55' ? '' : '55' }))}
            className={`btn btn-xs gap-1 border-0 rounded-lg transition-all ${
              filters.min_db === '55' ? 'bg-warning text-white font-bold shadow' : 'btn-ghost text-base-content/70 hover:text-base-content'
            }`}
            title="Show Moderate & High (>=55 dB)"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>&ge;55dB</span>
          </button>
        </div>

        {/* Right Actions: Clear & Refresh tightly aligned */}
        <div className="flex items-center space-x-2 shrink-0 ml-auto">
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ category: 'all', source_type: 'all', min_db: '' })}
              className="btn btn-xs btn-ghost text-error hover:bg-error/10 font-bold gap-1 rounded-lg"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-xs sm:btn-sm btn-outline gap-1.5 text-xs font-bold rounded-xl shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

      </div>
    </div>
  );
}
