import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import MapView from './components/MapView';
import AnalyticsPanel from './components/AnalyticsPanel';
import NoiseFeedTable from './components/NoiseFeedTable';
import SubmitNoiseModal from './components/SubmitNoiseModal';
import CitySwitcherModal from './components/CitySwitcherModal';
import {
  fetchLiveNoiseGeoJSON,
  fetchRawNoiseReadings,
  fetchAnalyticsStats,
  fetchHourlyTrends,
  submitNoiseReading
} from './services/api';
import { INDIAN_CITIES, SLUG_TO_CITY_ID, CITY_ID_TO_SLUG } from './services/mockData';
import { Plus, MapPin, BarChart3, Radio, Volume2, ShieldAlert, Sparkles, Layers, Building2, Globe } from 'lucide-react';

export default function App() {
  const getInitialCityId = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cityParam = params.get('city');
      if (cityParam) {
        if (cityParam.toLowerCase() === 'all') return 'all';
        if (SLUG_TO_CITY_ID[cityParam.toLowerCase()]) {
          return SLUG_TO_CITY_ID[cityParam.toLowerCase()];
        }
      }
    } catch (e) { }
    return 'all'; // Default homepage shows all cities overview
  };

  const [selectedCityId, setSelectedCityId] = useState(getInitialCityId);
  const [activeTab, setActiveTab] = useState('map'); // 'map', 'analytics', 'feed'
  const [filters, setFilters] = useState({ category: 'all', source_type: 'all', min_db: '' });

  const [geojson, setGeojson] = useState({ type: 'FeatureCollection', features: [] });
  const [rawReadings, setRawReadings] = useState([]);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState(true);

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isSelectingLocationOnMap, setIsSelectingLocationOnMap] = useState(false);
  const [selectedUserLocation, setSelectedUserLocation] = useState(null);

  const isAllSelected = selectedCityId === 'all' || !selectedCityId;
  const currentCity = INDIAN_CITIES.find(c => c.id === selectedCityId) || INDIAN_CITIES[0];

  // Default map center: India center for All-India overview, city center for specific city
  const initialMapCenter = isAllSelected ? [20.5937, 78.9629] : currentCity.center;
  const [mapCenter, setMapCenter] = useState(initialMapCenter);
  const [targetZoom, setTargetZoom] = useState(null);

  // Load telemetry data from API or mock client fallback
  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const activeFilters = { ...filters, city: selectedCityId };
      const [geoRes, rawRes, statsRes, trendRes] = await Promise.all([
        fetchLiveNoiseGeoJSON(activeFilters),
        fetchRawNoiseReadings(activeFilters),
        fetchAnalyticsStats(selectedCityId),
        fetchHourlyTrends(selectedCityId)
      ]);

      setGeojson(geoRes);
      setRawReadings(rawRes);
      setStats(statsRes);
      setTrends(trendRes);

      setIsBackendLive(true);
    } catch (err) {
      console.warn('Error loading telemetry data:', err);
      setIsBackendLive(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'emerald');

    // Handle browser back/forward buttons for ?city=
    const handlePopState = () => {
      const cityId = getInitialCityId();
      setSelectedCityId(cityId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Whenever selectedCityId changes, update mapCenter and reload telemetry data
  useEffect(() => {
    setTargetZoom(null);
    if (selectedCityId === 'all') {
      setMapCenter([20.5937, 78.9629]);
    } else {
      const city = INDIAN_CITIES.find(c => c.id === selectedCityId);
      if (city) {
        setMapCenter(city.center);
      }
    }
    loadData(true);
  }, [selectedCityId, filters]);

  const handleSelectCity = (cityId) => {
    setTargetZoom(null);
    setSelectedCityId(cityId);
    const slug = cityId === 'all' ? 'all' : (CITY_ID_TO_SLUG[cityId] || cityId);
    const newUrl = `${window.location.pathname}?city=${slug}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleSelectReadingLocation = (location) => {
    setSelectedUserLocation(location);
    setMapCenter([location.lat, location.lng]);
    setTargetZoom(15);
    setActiveTab('map');
  };

  const handleLocationSelectedFromMap = (location) => {
    setSelectedUserLocation(location);
    setMapCenter([location.lat, location.lng]);
    setIsSelectingLocationOnMap(false);
    setIsSubmitModalOpen(true);
  };

  const handleSubmitReading = async (payload) => {
    const fullPayload = { ...payload, city: isAllSelected ? 'chennai' : selectedCityId };
    await submitNoiseReading(fullPayload);
    setSelectedUserLocation(null);
    await loadData(false);
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col font-sans">

      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        isBackendLive={isBackendLive}
        selectedCityId={selectedCityId}
        onOpenCityModal={() => setIsCityModalOpen(true)}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">

        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
        />

        {/* View Content Switcher */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

            {/* Left Column (Desktop 7/8 cols, Mobile 12 cols): Spatial Map */}
            <div className="lg:col-span-7 xl:col-span-8 h-[55vh] md:h-[650px] min-h-[400px]">
              <MapView
                features={geojson.features || []}
                selectedUserLocation={selectedUserLocation}
                isSelectingLocation={isSelectingLocationOnMap}
                onLocationSelected={handleLocationSelectedFromMap}
                mapCenter={mapCenter}
                targetZoom={targetZoom}
              />
            </div>

            {/* Right Column (Desktop 5/4 cols, Mobile 12 cols): Side Telemetry Panel */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4 h-auto lg:h-[650px] lg:overflow-y-auto pr-1">

              {/* National Mode Side Panel: Cities list on the side of the India map */}
              {isAllSelected ? (
                <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-base-200 pb-2.5">
                    <div>
                      <h3 className="font-bold text-sm text-base-content/90 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>National Grid (10 Metropolises)</span>
                      </h3>
                      <p className="text-[11px] text-base-content/60">Click any city to load localized spatial telemetry</p>
                    </div>
                    <span className="badge badge-sm badge-primary text-white font-mono font-bold">10 CITIES</span>
                  </div>

                  <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                    {[...INDIAN_CITIES].sort((a, b) => b.avgDb - a.avgDb).map((city, idx) => (
                      <div
                        key={city.id}
                        onClick={() => handleSelectCity(city.id)}
                        className="group cursor-pointer rounded-xl border border-base-300 hover:border-primary/60 transition-all duration-200 overflow-hidden bg-base-100 shadow-sm hover:shadow-md p-2.5 flex items-center justify-between gap-3 hover:-translate-y-0.5"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-xs font-mono font-bold text-base-content/40 w-4 text-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div
                            className="w-11 h-11 rounded-lg bg-cover bg-center shrink-0 border border-white/20 shadow-sm relative overflow-hidden"
                            style={{ backgroundImage: `url(${city.image})` }}
                          >
                            <div className="absolute inset-0 bg-black/35"></div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-base-content truncate group-hover:text-primary transition-colors flex items-center gap-1">
                              <span>{city.name}</span>
                              <span className="text-[10px] text-base-content/50 font-normal font-mono font-bold">({city.state})</span>
                            </h4>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`badge badge-xs sm:badge-sm font-mono font-bold block mb-1 text-white ${city.avgDb > 68 ? 'bg-red-500' : (city.avgDb >= 60 ? 'bg-amber-500' : 'bg-emerald-500')
                            }`}>
                            {city.avgDb} dB Avg
                          </span>
                          <span className="text-[10px] text-error font-semibold block">
                            {city.violationsCount} Alerts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* City Specific Side Overview Stats & Telemetry Logs */
                <>
                  {stats && (
                    <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm space-y-3">
                      <h3 className="font-bold text-sm text-base-content/80 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-primary" />
                          <span>{currentCity.name} Live Overview</span>
                        </span>
                        <span className="badge badge-sm badge-success text-white font-mono">24h Active</span>
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-base-200/60 rounded-lg">
                          <span className="text-[11px] text-base-content/60 font-semibold block">City Avg Noise</span>
                          <span className="text-xl font-extrabold text-primary font-mono">{stats.city_avg_db} dB</span>
                        </div>

                        <div className="p-3 bg-base-200/60 rounded-lg">
                          <span className="text-[11px] text-base-content/60 font-semibold block">Violations (&gt;70dB)</span>
                          <span className="text-xl font-extrabold text-error font-mono">{stats.violations_today}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs">
                        <span className="text-base-content/70">Peak Hotspot:</span>
                        <span className="font-semibold text-warning truncate max-w-[170px]" title={stats.peak_noise_zone}>
                          {stats.peak_noise_zone}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Side Feed Preview */}
                  <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-secondary" />
                        <span>{currentCity.name} Telemetry Logs</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('feed')}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        View All &rarr;
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {rawReadings.length === 0 ? (
                        <div className="text-center py-6 text-xs text-base-content/50">
                          No noise readings found matching filters for {currentCity.name}.
                        </div>
                      ) : (
                        rawReadings.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectReadingLocation({ lat: item.latitude, lng: item.longitude })}
                            className="p-2.5 bg-base-200/50 hover:bg-base-200 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer hover:border-primary/50 border border-transparent"
                            title="Click to view & zoom on map"
                          >
                            <div className="space-y-0.5 max-w-[70%]">
                              <span className="font-semibold text-base-content block truncate">{item.location_name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-base-content/60">
                                <span className="capitalize font-mono">{item.category}</span>
                                <span>&bull;</span>
                                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs text-white ${item.decibel_level > 70 ? 'bg-error' : (item.decibel_level >= 55 ? 'bg-warning' : 'bg-success')
                                }`}>
                                {item.decibel_level} dB
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        )}

        {/* Tab 2: Full Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsPanel
            stats={stats}
            trends={trends}
            rawReadings={rawReadings}
            selectedCityId={selectedCityId}
          />
        )}

        {/* Tab 3: Sensor Feed Table */}
        {activeTab === 'feed' && (
          <NoiseFeedTable
            rawReadings={rawReadings}
            onSelectReadingLocation={handleSelectReadingLocation}
          />
        )}

      </main>

      {/* Floating Action Button for Noise Submission */}
      <button
        onClick={() => setIsSubmitModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 btn btn-circle btn-primary btn-lg shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/30"
        title="Submit dB Reading"
      >
        <Plus className="w-8 h-8 text-white" />
      </button>

      {/* City Switcher Popup Dialog */}
      <CitySwitcherModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCityId={selectedCityId}
        onSelectCity={handleSelectCity}
      />

      {/* Crowdsourced Submission Modal */}
      <SubmitNoiseModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitReading={handleSubmitReading}
        selectedLocationFromMap={selectedUserLocation}
        onToggleMapSelection={() => {
          setIsSubmitModalOpen(false);
          setIsSelectingLocationOnMap(true);
          setActiveTab('map');
        }}
        currentCity={currentCity}
      />

      {/* Footer */}
      <footer className="bg-base-100 border-t border-base-300 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-base-content/60 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 NoiseIQ – Municipal Acoustic Telemetry Platform (India Grid). All rights reserved.</span>
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span>CPCB Standards</span>
            <span>&bull;</span>
            <span>Web Audio API SPL v1.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
