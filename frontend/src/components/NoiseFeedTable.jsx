import React, { useState } from 'react';
import { Search, Volume2, ShieldAlert, CheckCircle2, Radio, UserCheck, ArrowUpDown } from 'lucide-react';

export default function NoiseFeedTable({ rawReadings, onSelectReadingLocation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  if (!rawReadings) return null;

  const filtered = rawReadings.filter(r => 
    r.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.city && r.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'timestamp') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSeverityBadge = (db) => {
    if (db > 70) {
      return <span className="badge badge-error gap-1 text-xs font-semibold text-white"><ShieldAlert className="w-3 h-3" /> Violation</span>;
    }
    if (db >= 55) {
      return <span className="badge badge-warning gap-1 text-xs font-semibold text-white">Moderate</span>;
    }
    return <span className="badge badge-success gap-1 text-xs font-semibold text-white"><CheckCircle2 className="w-3 h-3" /> Safe</span>;
  };

  const getCategoryBadge = (cat) => {
    const map = {
      traffic: 'badge-outline badge-info',
      construction: 'badge-outline badge-error',
      loudspeakers: 'badge-outline badge-warning',
      industrial: 'badge-outline badge-secondary',
      ambient: 'badge-outline badge-success'
    };
    return <span className={`badge badge-sm font-mono capitalize ${map[cat] || 'badge-ghost'}`}>{cat}</span>;
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm overflow-hidden">
      
      {/* Table Header & Search */}
      <div className="p-4 border-b border-base-300 flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-200/40">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <span>Live Acoustic Telemetry Stream</span>
          </h3>
          <p className="text-xs text-base-content/70">Click any row to focus and zoom into spatial map location</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search location or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-base-content/50 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="table table-compact w-full text-xs">
          <thead className="bg-base-200 text-base-content/70">
            <tr>
              <th className="cursor-pointer" onClick={() => handleSort('timestamp')}>
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th>Location Name</th>
              <th>Category</th>
              <th className="cursor-pointer" onClick={() => handleSort('decibel_level')}>
                <div className="flex items-center gap-1">
                  <span>Decibel (dB SPL)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th>Source Type</th>
              <th>Acoustic Status</th>
              <th>Notes / Details</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-base-content/50">
                  No acoustic telemetry records found matching filters.
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => onSelectReadingLocation && onSelectReadingLocation({ lat: item.latitude, lng: item.longitude })}
                  className="hover cursor-pointer transition-colors hover:bg-primary/10"
                  title="Click to view on Spatial Map"
                >
                  <td className="font-mono text-base-content/70 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="font-semibold text-base-content flex items-center gap-1.5">
                    <span>{item.location_name}</span>
                    {item.city && <span className="text-[10px] text-base-content/50 font-mono">({item.city})</span>}
                  </td>
                  <td>
                    {getCategoryBadge(item.category)}
                  </td>
                  <td className="font-mono font-bold text-sm">
                    <div className="flex items-center space-x-2">
                      <span>{item.decibel_level} dB</span>
                      {/* Mini progress bar */}
                      <progress
                        className={`progress w-16 h-1.5 ${
                          item.decibel_level > 70 ? 'progress-error' : (item.decibel_level >= 55 ? 'progress-warning' : 'progress-success')
                        }`}
                        value={Math.min(100, Math.max(0, ((item.decibel_level - 30) / 70) * 100))}
                        max="100"
                      ></progress>
                    </div>
                  </td>
                  <td>
                    {item.source_type === 'iot_sensor' ? (
                      <span className="flex items-center gap-1 text-info font-mono">
                        <Radio className="w-3.5 h-3.5" /> Municipal IoT
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-primary font-mono">
                        <UserCheck className="w-3.5 h-3.5" /> Crowdsourced
                      </span>
                    )}
                  </td>
                  <td>
                    {getSeverityBadge(item.decibel_level)}
                  </td>
                  <td className="max-w-xs truncate text-base-content/70" title={item.notes}>
                    {item.notes || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
