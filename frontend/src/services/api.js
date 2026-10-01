import { INITIAL_MOCK_READINGS, INITIAL_MOCK_TRENDS } from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Local storage key for persistent crowdsourced offline submissions
const LOCAL_STORAGE_KEY = 'noiseiq_local_readings_v3';

function getStoredLocalReadings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local storage noise readings:', e);
  }
  return INITIAL_MOCK_READINGS;
}

function saveStoredLocalReadings(readings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(readings));
  } catch (e) {
    console.warn('Failed to save to local storage:', e);
  }
}

export async function fetchLiveNoiseGeoJSON(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.city && filters.city !== 'all') params.append('city', filters.city);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.source_type && filters.source_type !== 'all') params.append('source_type', filters.source_type);
    if (filters.min_db) params.append('min_db', filters.min_db);
    if (filters.max_db) params.append('max_db', filters.max_db);

    const res = await fetch(`${BASE_URL}/noise/live?${params.toString()}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.info('Backend unreachable, using client-side mock GeoJSON:', err.message);
    
    let readings = getStoredLocalReadings();
    
    // Apply strict local filters
    if (filters.city && filters.city !== 'all') {
      readings = readings.filter(r => r.city === filters.city);
    }
    if (filters.category && filters.category !== 'all') {
      readings = readings.filter(r => r.category === filters.category);
    }
    if (filters.source_type && filters.source_type !== 'all') {
      readings = readings.filter(r => r.source_type === filters.source_type);
    }
    if (filters.min_db) {
      readings = readings.filter(r => r.decibel_level >= parseFloat(filters.min_db));
    }
    if (filters.max_db) {
      readings = readings.filter(r => r.decibel_level <= parseFloat(filters.max_db));
    }

    return {
      type: 'FeatureCollection',
      features: readings.map(r => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [r.longitude, r.latitude]
        },
        properties: r
      }))
    };
  }
}

export async function fetchRawNoiseReadings(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.city && filters.city !== 'all') params.append('city', filters.city);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.source_type && filters.source_type !== 'all') params.append('source_type', filters.source_type);
    if (filters.min_db) params.append('min_db', filters.min_db);

    const res = await fetch(`${BASE_URL}/noise/raw?${params.toString()}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.info('Backend unreachable, using client-side mock list:', err.message);
    let readings = getStoredLocalReadings();
    if (filters.city && filters.city !== 'all') {
      readings = readings.filter(r => r.city === filters.city);
    }
    if (filters.category && filters.category !== 'all') {
      readings = readings.filter(r => r.category === filters.category);
    }
    if (filters.source_type && filters.source_type !== 'all') {
      readings = readings.filter(r => r.source_type === filters.source_type);
    }
    if (filters.min_db !== undefined && filters.min_db !== '' && filters.min_db !== null) {
      readings = readings.filter(r => r.decibel_level >= parseFloat(filters.min_db));
    }
    if (filters.max_db !== undefined && filters.max_db !== '' && filters.max_db !== null) {
      readings = readings.filter(r => r.decibel_level <= parseFloat(filters.max_db));
    }
    return readings;
  }
}

export async function fetchAnalyticsStats(cityId = null) {
  try {
    const url = (cityId && cityId !== 'all') ? `${BASE_URL}/analytics/stats?city=${cityId}` : `${BASE_URL}/analytics/stats`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.info('Backend unreachable, using calculated mock stats:', err.message);
    let readings = getStoredLocalReadings();
    if (cityId && cityId !== 'all') {
      readings = readings.filter(r => r.city === cityId);
    }
    const sumDb = readings.reduce((sum, r) => sum + r.decibel_level, 0);
    const avgDb = readings.length > 0 ? Math.round((sumDb / readings.length) * 10) / 10 : 0;
    const violations = readings.filter(r => r.decibel_level > 70).length;
    const iotCount = readings.filter(r => r.source_type === 'iot_sensor').length;
    const crowdsourcedCount = readings.filter(r => r.source_type === 'crowdsourced').length;

    const sortedByDb = [...readings].sort((a, b) => b.decibel_level - a.decibel_level);
    const peakZone = sortedByDb.length > 0 ? sortedByDb[0].location_name : 'Municipal Transit Corridor';
    const quietestZone = sortedByDb.length > 0 ? sortedByDb[sortedByDb.length - 1].location_name : 'Eco Reserve Sanctuary';

    // Compliance percentage (<70dB)
    const compliantCount = readings.filter(r => r.decibel_level <= 70).length;
    const complianceRate = readings.length > 0 ? Math.round((compliantCount / readings.length) * 100) : 100;

    return {
      city_avg_db: avgDb,
      active_sensors: iotCount,
      violations_today: violations,
      peak_noise_zone: peakZone,
      quietest_zone: quietestZone,
      total_readings: readings.length,
      crowdsourced_count: crowdsourcedCount,
      iot_count: iotCount,
      compliance_rate: complianceRate
    };
  }
}

export async function fetchHourlyTrends(cityId = null) {
  try {
    const url = cityId ? `${BASE_URL}/analytics/trends?city=${cityId}` : `${BASE_URL}/analytics/trends`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.info('Backend unreachable, using mock hourly trends:', err.message);
    return INITIAL_MOCK_TRENDS;
  }
}

export async function submitNoiseReading(payload) {
  try {
    const res = await fetch(`${BASE_URL}/noise/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) throw new Error(`HTTP submission failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.info('Backend submission unavailable, storing locally in browser:', err.message);
    const readings = getStoredLocalReadings();
    const newObj = {
      id: `reading-local-${Date.now()}`,
      city: payload.city || 'chennai',
      latitude: payload.latitude,
      longitude: payload.longitude,
      decibel_level: round(payload.decibel_level, 1),
      source_type: payload.source_type || 'crowdsourced',
      category: payload.category || 'ambient',
      location_name: payload.location_name || 'Citizen Report',
      notes: payload.notes || 'Recorded via browser audio sampler',
      timestamp: new Date().toISOString(),
      severity: payload.decibel_level > 70 ? 'violation' : (payload.decibel_level >= 55 ? 'moderate' : 'safe')
    };
    readings.unshift(newObj);
    saveStoredLocalReadings(readings);
    return newObj;
  }
}

function round(val, decimals = 1) {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
