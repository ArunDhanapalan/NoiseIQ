import React, { useState, useEffect } from 'react';
import { INDIAN_CITIES } from '../services/mockData';
import { Building2, MapPin, Search, X, Check, Globe } from 'lucide-react';

export default function CitySwitcherModal({
  isOpen,
  onClose,
  selectedCityId,
  onSelectCity
}) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCities = INDIAN_CITIES.filter(city =>
    !searchTerm ||
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllSelected = selectedCityId === 'all' || !selectedCityId;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-base-100 text-base-content w-[95vw] max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl border border-base-300 flex flex-col my-auto overflow-hidden"
      >
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-base-300 flex items-center justify-between bg-base-200/60 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="p-2 sm:p-2.5 bg-primary/20 text-primary rounded-xl shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-xl tracking-tight text-base-content">
                  Select Metropolis
                </h3>
                <span className="badge badge-primary badge-xs sm:badge-sm font-mono font-bold">10 CITIES</span>
              </div>
              <p className="text-[11px] sm:text-xs text-base-content/70 hidden xs:block">
                Switch acoustic telemetry & live map view to another city
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-base-content/70 hover:text-base-content shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 sm:px-6 py-2.5 bg-base-100 border-b border-base-200 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search city or state (e.g. Chennai, Maharashtra, Delhi NCR)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm sm:input-md input-bordered w-full pl-9 text-xs sm:text-sm shadow-inner"
            />
            <Search className="w-4 h-4 text-base-content/50 absolute left-3 top-2.5 sm:top-3" />
          </div>
        </div>

        {/* City Image Cards Grid (Scrollable Body) */}
        <div className="p-3 sm:p-6 overflow-y-auto min-h-0 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Top Card: All-India National Overview Option */}
          {(!searchTerm || 'all india national overview'.includes(searchTerm.toLowerCase())) && (
            <div
              onClick={() => {
                onSelectCity('all');
                onClose();
              }}
              className={`group cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden relative h-36 sm:h-40 flex flex-col justify-between p-3.5 sm:p-4 text-white bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 shadow-md hover:shadow-xl hover:-translate-y-1 ${
                isAllSelected
                  ? 'border-primary ring-4 ring-primary/40 shadow-xl'
                  : 'border-base-300 hover:border-primary/60'
              }`}
            >
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur px-2.5 py-0.5 rounded-full text-white font-mono border border-white/20">
                  NATIONAL GRID
                </span>

                {isAllSelected && (
                  <span className="badge badge-sm bg-emerald-500 text-white border-none font-extrabold gap-1 shadow-lg">
                    <Check className="w-3.5 h-3.5" /> ACTIVE
                  </span>
                )}
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-md flex items-center gap-1.5 font-sans">
                  <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>National</span>
                </h4>
              </div>
            </div>
          )}

          {/* 10 City Image Cards */}
          {filteredCities.map((city) => {
            const isSelected = city.id === selectedCityId;

            return (
              <div
                key={city.id}
                onClick={() => {
                  onSelectCity(city.id);
                  onClose();
                }}
                className={`group cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden relative h-36 sm:h-40 flex flex-col justify-between p-3.5 sm:p-4 text-white bg-cover bg-center shadow-md hover:shadow-xl hover:-translate-y-1 ${
                  isSelected
                    ? 'border-primary ring-4 ring-primary/40 shadow-xl'
                    : 'border-base-300 hover:border-primary/60'
                }`}
                style={{ backgroundImage: `url(${city.image})` }}
              >
                {/* Background Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/95 transition-all z-0"></div>

                {/* Top Row: State Badge & Active Status */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur px-2.5 py-0.5 rounded-full text-white font-mono border border-white/20">
                    {city.state}
                  </span>

                  {isSelected && (
                    <span className="badge badge-sm bg-primary text-white border-none font-extrabold gap-1 shadow-lg">
                      <Check className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  )}
                </div>

                {/* Bottom Row: City Name only */}
                <div className="relative z-10 flex items-center justify-between">
                  <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-md flex items-center gap-1.5 font-sans">
                    <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{city.name}</span>
                  </h4>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-2.5 sm:p-3 border-t border-base-300 bg-base-200/40 text-center text-xs text-base-content/60 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <span className="text-[11px] truncate">Central Pollution Control Board (CPCB) Standard Compliant</span>
          <span className="font-mono text-[11px] hidden sm:inline">10 Major Metropolises</span>
        </div>

      </div>
    </div>
  );
}
