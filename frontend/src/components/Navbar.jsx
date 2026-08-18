import React from 'react';
import { Activity, Radio, PlusCircle, Volume2, ShieldCheck, MapPin, BarChart3, ListFilter, Building2, ChevronDown, AudioLines } from 'lucide-react';
import { INDIAN_CITIES } from '../services/mockData';

export default function Navbar({ activeTab, setActiveTab, onOpenSubmitModal, isBackendLive, selectedCityId, onOpenCityModal }) {
  const isAllSelected = selectedCityId === 'all' || !selectedCityId;
  const currentCity = INDIAN_CITIES.find(c => c.id === selectedCityId) || INDIAN_CITIES[0];
  const displayCityName = isAllSelected ? 'National' : currentCity.name;

  return (
    <header className="bg-slate-900/70 text-white sticky top-0 z-[2000] shadow-xl backdrop-blur-xl border-b border-white/10 bg-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <AudioLines className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-mono">NoiseIQ</span>
                <span className="badge badge-sm bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-mono font-bold">INDIA</span>
              </div>
              <p className="text-[11px] text-gray-300 hidden sm:block font-medium">Urban Noise Analytics</p>
            </div>
          </div>

          {/* Center Tabs Navigation - Liquid Glass Bar */}
          <nav className="hidden md:flex space-x-1.5 bg-white/10 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 p-1.5 rounded-full shadow-2xl">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 ${activeTab === 'map'
                ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-[1.02]'
                : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Spatial Map</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 ${activeTab === 'analytics'
                ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-[1.02]'
                : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 ${activeTab === 'feed'
                ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-[1.02]'
                : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Sensor Feed</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* City Switcher Dialog Button */}
            <button
              onClick={onOpenCityModal}
              className="px-3.5 py-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700 text-white border border-white/20 text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all hover:border-emerald-400/50"
              title="Switch City"
            >
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="max-w-[120px] sm:max-w-[150px] truncate">{displayCityName}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
            </button>

            {/* System Status Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/60 px-3 py-1 rounded-full text-xs border border-white/15">
              <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className="text-gray-200 font-mono text-[11px]">
                {isBackendLive ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Submit dB Reading Button */}
            <button
              onClick={onOpenSubmitModal}
              className="btn btn-primary btn-sm rounded-full gap-1.5 shadow-lg shadow-primary/30 hover:scale-105 transition-transform font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Submit dB</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden px-3 py-2 bg-slate-950/80 backdrop-blur-xl border-t border-white/10">
        <nav className="flex space-x-1 bg-slate-800/60 backdrop-blur-xl p-1 rounded-full border border-white/20 shadow-xl">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center space-x-1 transition-all ${activeTab === 'map' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-gray-300 hover:text-white'
              }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center space-x-1 transition-all ${activeTab === 'analytics' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-gray-300 hover:text-white'
              }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center space-x-1 transition-all ${activeTab === 'feed' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-gray-300 hover:text-white'
              }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
