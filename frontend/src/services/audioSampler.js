/**
 * Real-Time Microphone Decibel Sampler using Web Audio API
 * Measures ambient sound level in RMS amplitude and converts to estimated dB SPL.
 */

export class AudioDecibelSampler {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.source = null;
    this.isSampling = false;
    this.animFrameId = null;
    this.sampleBuffer = [];
  }

  /**
   * Start sampling audio from user's microphone for given duration (in ms)
   * @param {Object} options 
   * @param {number} options.durationMs - Sampling window in ms (e.g. 4000)
   * @param {Function} options.onTick - Callback receiving instant dB and volume % (0-100)
   * @returns {Promise<{ averageDb: number, peakDb: number, minDb: number }>}
   */
  async startSampling({ durationMs = 10000, onTick = () => {} } = {}) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Web Audio API / getUserMedia is not supported in this browser environment.");
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.3;

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);

      this.isSampling = true;
      this.sampleBuffer = [];

      const pcmData = new Float32Array(this.analyser.fftSize);

      return new Promise((resolve) => {
        const startTime = Date.now();

        const processFrame = () => {
          if (!this.isSampling) return;

          this.analyser.getFloatTimeDomainData(pcmData);

          // Calculate Root Mean Square (RMS)
          let sumSquares = 0;
          for (let i = 0; i < pcmData.length; i++) {
            sumSquares += pcmData[i] * pcmData[i];
          }
          const rms = Math.sqrt(sumSquares / pcmData.length);

          // Convert RMS to estimated dB SPL (Sound Pressure Level)
          // Minimum floor: 0.00001 (~30 dB baseline room noise)
          const clampedRms = Math.max(rms, 0.00001);
          
          // Calibration offset: maps mic digital amplitude to acoustic dB SPL scale
          // Standard reference: 0 dB FS approx equal to 110-120 dB SPL max
          const rawDb = 20 * Math.log10(clampedRms) + 95;
          const instantDb = Math.min(125, Math.max(30, Math.round(rawDb * 10) / 10));

          this.sampleBuffer.push(instantDb);

          // Volume percentage for UI meter (map 30dB - 100dB to 0% - 100%)
          const volumePct = Math.min(100, Math.max(0, ((instantDb - 30) / 70) * 100));

          onTick({ instantDb, volumePct });

          const elapsed = Date.now() - startTime;
          if (elapsed < durationMs && this.isSampling) {
            this.animFrameId = requestAnimationFrame(processFrame);
          } else {
            const results = this.stopAndCalculateResults();
            resolve(results);
          }
        };

        this.animFrameId = requestAnimationFrame(processFrame);
      });

    } catch (err) {
      this.stop();
      throw err;
    }
  }

  /**
   * Stop sampling immediately and return calculated metrics
   */
  stopAndCalculateResults() {
    this.stop();
    if (this.sampleBuffer.length === 0) {
      return { averageDb: 55.0, peakDb: 55.0, minDb: 55.0 };
    }

    const sum = this.sampleBuffer.reduce((a, b) => a + b, 0);
    const averageDb = Math.round((sum / this.sampleBuffer.length) * 10) / 10;
    const peakDb = Math.round(Math.max(...this.sampleBuffer) * 10) / 10;
    const minDb = Math.round(Math.min(...this.sampleBuffer) * 10) / 10;

    return { averageDb, peakDb, minDb };
  }

  stop() {
    this.isSampling = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
