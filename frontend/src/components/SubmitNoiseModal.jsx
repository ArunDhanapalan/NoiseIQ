import React, { useState, useEffect } from 'react';
import { AudioDecibelSampler } from '../services/audioSampler';
import { Mic, MicOff, Navigation, MapPin, X, Check, Volume2, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';

export default function SubmitNoiseModal({
  isOpen,
  onClose,
  onSubmitReading,
  selectedLocationFromMap,
  onToggleMapSelection,
  currentCity
}) {
  const [decibelLevel, setDecibelLevel] = useState(65.0);
  const [category, setCategory] = useState('traffic');
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState(currentCity?.center?.[0] || 13.0827);
  const [longitude, setLongitude] = useState(currentCity?.center?.[1] || 80.2707);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Audio Sampler State
  const [isSampling, setIsSampling] = useState(false);
  const [liveDb, setLiveDb] = useState(null);
  const [volumePct, setVolumePct] = useState(0);
  const [audioSampler, setAudioSampler] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [isFetchingLocationName, setIsFetchingLocationName] = useState(false);

  // Reverse-geocode coordinates to automatically switch location name
  const updateLocationNameAutomatically = async (lat, lng) => {
    if (!lat || !lng) return;
    setIsFetchingLocationName(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const a = data.address;
          const main = a.road || a.pedestrian || a.street || a.amenity || a.building || a.suburb || a.neighbourhood;
          const city = a.city || a.town || a.village || a.county || a.state;
          if (main && city) {
            setLocationName(`${main}, ${city}`);
            return;
          } else if (main || city) {
            setLocationName(main || city);
            return;
          }
        }
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          setLocationName(parts.slice(0, 2).join(',').trim());
          return;
        }
      }
    } catch (err) {
      console.warn('Reverse geocode fetch error:', err);
    } finally {
      setIsFetchingLocationName(false);
    }
    setLocationName(`Position (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`);
  };

  // Default to active city landmark when modal opens if no map selection was made
  useEffect(() => {
    if (isOpen) {
      if (selectedLocationFromMap) {
        setLatitude(selectedLocationFromMap.lat);
        setLongitude(selectedLocationFromMap.lng);
        setLocationDetected(true);
        updateLocationNameAutomatically(selectedLocationFromMap.lat, selectedLocationFromMap.lng);
      } else if (currentCity && currentCity.center) {
        setLatitude(currentCity.center[0]);
        setLongitude(currentCity.center[1]);
        setLocationName(`${currentCity.landmark || 'City Center'}, ${currentCity.name}`);
        setLocationDetected(true);
      }
    }
  }, [isOpen, selectedLocationFromMap, currentCity]);

  if (!isOpen) return null;

  // Auto-Detect GPS Location handler
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationDetected(true);
        setIsLocating(false);
        updateLocationNameAutomatically(lat, lng);
      },
      (error) => {
        setIsLocating(false);
        alert(`Geolocation error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Web Audio API Mic Sampler handler
  const handleSampleMicrophone = async () => {
    try {
      const sampler = new AudioDecibelSampler();
      setAudioSampler(sampler);
      setIsSampling(true);

      const results = await sampler.startSampling({
        durationMs: 10000,
        onTick: ({ instantDb, volumePct }) => {
          setLiveDb(instantDb);
          setVolumePct(volumePct);
        }
      });

      // Set recorded level to peakDb (highest dB during 10s sample)
      setDecibelLevel(results.peakDb || results.averageDb);
      setIsSampling(false);
      setLiveDb(null);
      setVolumePct(0);
    } catch (err) {
      setIsSampling(false);
      setLiveDb(null);
      setVolumePct(0);
      alert(`Microphone Audio Error: ${err.message || 'Permission denied or audio hardware unavailable.'}`);
    }
  };

  const handleStopSampling = () => {
    if (audioSampler) {
      const res = audioSampler.stopAndCalculateResults();
      if (res && (res.peakDb || res.averageDb)) {
        setDecibelLevel(res.peakDb || res.averageDb);
      }
    }
    setIsSampling(false);
    setLiveDb(null);
    setVolumePct(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      decibel_level: parseFloat(decibelLevel),
      source_type: 'crowdsourced',
      category: category,
      location_name: locationName || 'Citizen Report Location',
      notes: notes
    };

    await onSubmitReading(payload);
    setIsSubmitting(false);
    setSuccessMessage(true);

    setTimeout(() => {
      setSuccessMessage(false);
      onClose();
    }, 1200);
  };

  const categories = [
    { id: 'traffic', label: 'Traffic Noise', color: 'btn-info' },
    { id: 'construction', label: 'Construction', color: 'btn-error' },
    { id: 'loudspeakers', label: 'Loudspeakers', color: 'btn-warning' },
    { id: 'industrial', label: 'Industrial', color: 'btn-secondary' },
    { id: 'ambient', label: 'Ambient / Quiet', color: 'btn-success' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-base-100 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-base-300 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/20 text-primary rounded-lg">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Submit Citizen Noise Measurement</h3>
              <p className="text-xs text-base-content/70">Contribute real-time decibel telemetry to city acoustics grid</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Success Overlay Banner */}
          {successMessage && (
            <div className="alert alert-success shadow-lg text-xs font-semibold">
              <Check className="w-4 h-4" />
              <span>Decibel reading submitted successfully! Updating acoustic map...</span>
            </div>
          )}

          {/* SECTION 1: Web Audio API Microphone Sampler */}
          <div className="bg-base-200/70 border border-base-300 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-primary" />
                <span>Real-Time Microphone dB Sampler</span>
              </label>
              <span className="text-[11px] text-base-content/60 font-mono">10s Audio Window</span>
            </div>

            {isSampling ? (
              <div className="space-y-3 p-3 bg-base-100 rounded-lg border border-primary/40 text-center">
                <div className="flex items-center justify-center space-x-2 text-primary font-bold text-lg font-mono animate-pulse">
                  <span>Sampling 10s Ambient Audio...</span>
                  <span className="text-2xl">{liveDb || '--'} dB</span>
                </div>

                {/* Animated Volume Meter Bar */}
                <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="volume-meter-bar bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full rounded-full"
                    style={{ width: `${volumePct}%` }}
                  ></div>
                </div>

                <button
                  type="button"
                  onClick={handleStopSampling}
                  className="btn btn-xs btn-error gap-1 mt-2"
                >
                  <MicOff className="w-3.5 h-3.5" /> Stop & Lock Peak dB
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSampleMicrophone}
                  className="btn btn-primary btn-sm flex-1 gap-2 shadow-sm"
                >
                  <Mic className="w-4 h-4" />
                  <span>Record / Sample Noise (10s)</span>
                </button>
              </div>
            )}

            {/* Recorded Peak Decibel Display */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-base-300">
              <span className="text-base-content/70 font-semibold">Recorded Peak Decibel Level:</span>
              <span className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded text-white ${
                decibelLevel > 70 ? 'bg-error' : (decibelLevel >= 55 ? 'bg-warning' : 'bg-success')
              }`}>
                {decibelLevel} dB SPL
              </span>
            </div>
          </div>

          {/* SECTION 2: Geolocation API & Location Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-info" />
                <span>Geospatial Location</span>
              </span>
              {locationDetected && (
                <span className="text-[11px] text-success font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Location Locked
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isLocating}
                className="btn btn-outline btn-sm text-xs gap-1.5"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Auto-Detect GPS'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleMapSelection();
                }}
                className="btn btn-outline btn-sm text-xs gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Pin on Map</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-base-content/60 text-[10px] block">Latitude:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => {
                    const newLat = e.target.value;
                    setLatitude(newLat);
                    if (newLat && longitude) updateLocationNameAutomatically(newLat, longitude);
                  }}
                  className="input input-xs input-bordered w-full font-mono"
                  required
                />
              </div>
              <div>
                <span className="text-base-content/60 text-[10px] block">Longitude:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => {
                    const newLng = e.target.value;
                    setLongitude(newLng);
                    if (latitude && newLng) updateLocationNameAutomatically(latitude, newLng);
                  }}
                  className="input input-xs input-bordered w-full font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-base-content/60 mt-1">
                <span>Location Name (Auto-Detected):</span>
                {isFetchingLocationName && <span className="text-primary font-medium animate-pulse">Switching Location...</span>}
              </div>
              <input
                type="text"
                placeholder="Location Description (e.g. Market St & 4th Ave)"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="input input-sm input-bordered w-full text-xs mt-0.5"
                required
              />
            </div>
          </div>

          {/* SECTION 3: Category Tagging */}
          <div className="space-y-2">
            <label className="text-xs font-bold flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-warning" />
              <span>Noise Category Source</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`btn btn-xs ${
                    category === c.id ? `${c.color} text-white font-bold` : 'btn-outline border-base-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4: Notes / Observation details */}
          <div className="space-y-1">
            <label className="text-xs font-bold">Observation Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Siren sound, construction equipment idling, loud concert stage..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea textarea-bordered w-full text-xs"
            ></textarea>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-base-300">
            <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm gap-2"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Submit Telemetry</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
