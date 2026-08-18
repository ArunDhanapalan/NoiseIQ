import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Volume2, Radio, AlertTriangle, TrendingUp, Layers, Zap, Sun, Moon, MapPin, Building2, ShieldAlert } from 'lucide-react';
import { INDIAN_CITIES } from '../services/mockData';

export default function AnalyticsPanel({ stats, trends, rawReadings, selectedCityId }) {
  if (!stats) return null;

  const currentCity = selectedCityId === 'all'
    ? { name: 'National Grid (10 Metropolises)', state: 'All-India Telemetry', gradient: 'from-blue-700 via-indigo-600 to-purple-700' }
    : (INDIAN_CITIES.find(c => c.id === selectedCityId) || INDIAN_CITIES[0]);

  // 1. Category distribution
  const categoryCounts = {
    traffic: 0,
    construction: 0,
    loudspeakers: 0,
    industrial: 0,
    ambient: 0
  };

  // 2. Decibel bands
  let quietCount = 0;
  let moderateCount = 0;
  let highCount = 0;
  let severeCount = 0;

  // 3. Area Decibel Ranking for selected city
  const areaData = [];

  if (rawReadings && rawReadings.length > 0) {
    rawReadings.forEach(r => {
      if (categoryCounts[r.category] !== undefined) {
        categoryCounts[r.category] += 1;
      }
      if (r.decibel_level < 55) quietCount++;
      else if (r.decibel_level <= 70) moderateCount++;
      else if (r.decibel_level <= 85) highCount++;
      else severeCount++;

      // Short area name
      const shortName = r.location_name.split(' (')[0].split(' - ')[0];
      if (!areaData.find(a => a.name === shortName)) {
        areaData.push({
          name: shortName,
          decibel: r.decibel_level,
          color: r.decibel_level > 70 ? '#EF4444' : r.decibel_level >= 55 ? '#F59E0B' : '#10B981'
        });
      }
    });
  }

  // Sort top 6 areas by decibel level
  areaData.sort((a, b) => b.decibel - a.decibel);
  const topAreasData = areaData.slice(0, 6);

  const totalReadings = rawReadings?.length || 1;
  const complianceRate = stats.compliance_rate ?? Math.round(((quietCount + moderateCount) / totalReadings) * 100);

  const categoryData = [
    { name: 'Traffic', count: categoryCounts.traffic, color: '#3B82F6' },
    { name: 'Construction', count: categoryCounts.construction, color: '#EF4444' },
    { name: 'Loudspeakers', count: categoryCounts.loudspeakers, color: '#F59E0B' },
    { name: 'Industrial', count: categoryCounts.industrial, color: '#8B5CF6' },
    { name: 'Ambient', count: categoryCounts.ambient, color: '#10B981' },
  ];

  // 4. Day vs Night Comparison data
  const dayNightData = [
    { period: 'Daytime (06:00 - 22:00)', avg_db: Math.round((stats.city_avg_db + 4.2) * 10) / 10, limit: 65, color: '#F59E0B' },
    { period: 'Nighttime (22:00 - 06:00)', avg_db: Math.round((stats.city_avg_db - 8.5) * 10) / 10, limit: 55, color: '#6366F1' },
  ];

  const getDbBadgeColor = (db) => {
    if (db > 70) return 'badge-error text-white';
    if (db >= 55) return 'badge-warning text-white';
    return 'badge-success text-white';
  };

  const getGrade = (avgDb) => {
    if (avgDb < 55) return { letter: 'A+', label: 'Compliant' };
    if (avgDb < 65) return { letter: 'B', label: 'Moderate' };
    if (avgDb < 72) return { letter: 'C', label: 'Elevated' };
    return { letter: 'D', label: 'High Noise' };
  };

  const grade = getGrade(stats.city_avg_db || 65);

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Vibrant City Gradient Hero Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-r ${currentCity.gradient || 'from-blue-600 to-teal-500'} text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden`}>
        <div className="relative z-10">
          <div className="flex items-center space-x-2">
            <span className="bg-black/30 backdrop-blur px-2.5 py-0.5 rounded text-[11px] font-mono uppercase font-bold text-white border border-white/20">
              {currentCity.state}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 drop-shadow-sm">
            {currentCity.name} Acoustic Analytics
          </h2>
        </div>

        <div className="flex items-center space-x-3 shrink-0 relative z-10">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/25 backdrop-blur border border-white/20 text-right text-white">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/80 block">Grade</span>
            <span className="text-xl font-extrabold font-mono text-white">{grade.letter} ({grade.label})</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-black/25 backdrop-blur border border-white/20 text-right text-white">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/80 block font-mono">CPCB Compliance</span>
            <span className="text-xl font-extrabold font-mono text-emerald-300">{complianceRate}%</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Stat 1: City Avg Noise */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <span className="text-xs font-semibold text-base-content/70 block">City Avg Noise</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary font-mono mt-1">
              {stats.city_avg_db || 0} <span className="text-xs font-normal text-base-content/60">dB</span>
            </div>
            <span className={`badge badge-xs ${getDbBadgeColor(stats.city_avg_db)} font-mono font-bold mt-1`}>
              {stats.city_avg_db > 70 ? 'High' : stats.city_avg_db >= 55 ? 'Moderate' : 'Safe'}
            </span>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Stat 2: Active Sensors */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <span className="text-xs font-semibold text-base-content/70 block">Active Sensors</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-info font-mono mt-1">
              {stats.active_sensors || 0}
            </div>
            <span className="text-[11px] text-base-content/60 font-mono block mt-1">
              IoT: {stats.iot_count || 0} • Citizen: {stats.crowdsourced_count || 0}
            </span>
          </div>
          <div className="p-3 bg-info/10 text-info rounded-xl shrink-0">
            <Radio className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Stat 3: Violations Today */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <span className="text-xs font-semibold text-base-content/70 block">Violations (&gt;70dB)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-error font-mono mt-1">
              {stats.violations_today || 0}
            </div>
            <span className="text-[11px] text-base-content/60 block mt-1">
              Above WHO acoustic threshold
            </span>
          </div>
          <div className="p-3 bg-error/10 text-error rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Stat 4: Peak Noise Zone */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <span className="text-xs font-semibold text-base-content/70 block mb-3">Peak Hotspot</span>
            <div className="text-sm sm:text-base font-extrabold text-base-content truncate mb-2" title={stats.peak_noise_zone}>
              {stats.peak_noise_zone || 'Commercial Hub'}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium truncate block mt-0.5">
              Quiet: {stats.quietest_zone || 'Eco Sanctuary'}
            </span>
          </div>
          <div className="p-3 bg-warning/10 text-warning rounded-xl shrink-0">
            <Zap className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

      </div>

      {/* CHARTS GRID 1: 24-Hour Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart 1: 24-Hour Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-base-100 border border-base-300 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>24-Hour Decibel Fluctuation ({currentCity.name})</span>
              </h3>
              <p className="text-xs text-base-content/60">Hourly average and peak decibel levels</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Avg dB</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-error/60 rounded-sm"></span> Peak dB</span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis domain={[30, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  formatter={(value, name) => [`${value} dB`, name === 'avg_db' ? 'Average dB' : 'Peak dB']}
                />
                <Area type="monotone" dataKey="max_db" stroke="#EF4444" fillOpacity={1} fill="url(#colorMax)" strokeWidth={1.5} strokeDasharray="3 3" />
                <Area type="monotone" dataKey="avg_db" stroke="#10B981" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Source Classification (1 col) */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-secondary" />
              <span>Noise Source Breakdown</span>
            </h3>
            <p className="text-xs text-base-content/60 mb-4">Sampled sources in {currentCity.name}</p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: '12px' }}
                    itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS GRID 2: Day vs Night & Top Neighborhood Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 3: Day vs Night Noise Profile */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Day vs. Night Noise Profile</span>
              </h3>
              <p className="text-xs text-base-content/60">Daytime (06:00–22:00) vs Nighttime (22:00–06:00) decibels</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayNightData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[30, 90]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  formatter={(val, name) => [`${val} dB`, name === 'avg_db' ? 'Measured Avg dB' : 'CPCB Standard Limit']}
                />
                <Bar dataKey="avg_db" name="Measured Avg" radius={[4, 4, 0, 0]} barSize={40}>
                  {dayNightData.map((entry, index) => (
                    <Cell key={`dn-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top Neighborhood Noise Level Ranking */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Neighborhood Noise Level Ranking</span>
              </h3>
              <p className="text-xs text-base-content/60">Decibel levels across key areas in {currentCity.name}</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAreasData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, angle: -15, textAnchor: 'end' }} />
                <YAxis domain={[30, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  formatter={(val) => [`${val} dB`, 'Noise Level']}
                />
                <Bar dataKey="decibel" radius={[4, 4, 0, 0]} barSize={24}>
                  {topAreasData.map((entry, index) => (
                    <Cell key={`area-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
