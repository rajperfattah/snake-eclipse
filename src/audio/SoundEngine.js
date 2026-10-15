// SoundEngine.js - Procedural Web Audio API Synthesizer
// Provides cosmic ambient music and dynamic sci-fi sound effects with zero external assets.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    
    // Music state
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.ambientDroneNodes = [];
    this.tempo = 120;
    this.step = 0;
    
    // Scale for procedural cosmic synth (A Minor / Dorian: A, C, D, E, G, A, B)
    this.scale = [220, 261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00];

    // Default volumes
    this.masterVol = 0.8;
    this.sfxVol = 0.8;
    this.musicVol = 0.5;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked', e);
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes({ master, sfx, music }) {
    if (master !== undefined) {
      this.masterVol = master;
      if (this.masterGain && !this.isMuted) {
        this.masterGain.gain.setTargetAtTime(master, this.ctx?.currentTime || 0, 0.05);
      }
    }
    if (sfx !== undefined) {
      this.sfxVol = sfx;
      if (this.sfxGain) {
        this.sfxGain.gain.setTargetAtTime(sfx, this.ctx?.currentTime || 0, 0.05);
      }
    }
    if (music !== undefined) {
      this.musicVol = music;
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(music, this.ctx?.currentTime || 0, 0.05);
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- SOUND EFFECTS (SFX) ---

  playPickup(comboLevel = 1, coreType = 'quantum') {
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const baseFreqs = {
      quantum: [523.25, 659.25, 783.99, 1046.50, 1318.51], // C5, E5, G5, C6, E6
      solar: [587.33, 739.99, 880.00, 1174.66, 1479.98],   // D5, F#5, A5, D6, F#6
      darkmatter: [220.00, 277.18, 329.63, 440.00, 554.37],// A3 chord deep
      chrono: [440.00, 554.37, 659.25, 880.00, 1108.73],   // A4 shimmer
    };

    const notes = baseFreqs[coreType] || baseFreqs.quantum;
    const idx = Math.min(comboLevel - 1, notes.length - 1);
    const freq = notes[idx];

    // Bell/crystal dual-oscillator
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.01, t); // slight harmonic shimmer

    gainNode.gain.setValueAtTime(0.3, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  playDash() {
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Low whoosh with resonant filter drop
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    filter.Q.setValueAtTime(6, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);

    // Add noise puff
    this.playNoiseBurst(0.2, 800, 0.25);
  }

  playPortal() {
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220, t);
    osc1.frequency.linearRampToValueAtTime(880, t + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(330, t + 0.4);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(224, t); // slight detune
    osc2.frequency.linearRampToValueAtTime(888, t + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(332, t + 0.4);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  playNearMiss() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playHazard() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.setValueAtTime(90, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playGameOver() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Sub-bass collapse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 1.2);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.2);

    // Singularity noise burst
    this.playNoiseBurst(1.0, 400, 0.4);
  }

  playUIClick() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playUIHover() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  playNoiseBurst(duration, cutoff = 1000, volume = 0.2) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // --- PROCEDURAL COSMIC BACKGROUND MUSIC (BGM) ---

  startBGM() {
    if (this.bgmPlaying) return;
    this.resume();
    this.bgmPlaying = true;
    this.startAmbientDrone();
    this.scheduleSynthArp();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.stopAmbientDrone();
  }

  startAmbientDrone() {
    if (!this.ctx) return;
    this.stopAmbientDrone();

    // Two detuned low-frequency sine waves + lowpass filter
    const freqs = [55.0, 55.4, 110.0]; // A1 drone
    const t = this.ctx.currentTime;

    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.08, t);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      this.ambientDroneNodes.push({ osc, gain });
    });
  }

  stopAmbientDrone() {
    this.ambientDroneNodes.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    });
    this.ambientDroneNodes = [];
  }

  scheduleSynthArp() {
    if (!this.bgmPlaying || !this.ctx) return;

    const secondsPerBeat = 60.0 / this.tempo;
    const interval = (secondsPerBeat / 2) * 1000; // eighth notes

    // Sequence of scale indices
    const arpPattern = [0, 2, 4, 7, 4, 2, 3, 5, 2, 4, 6, 8, 5, 3, 1, 0];
    const noteIdx = arpPattern[this.step % arpPattern.length];
    const freq = this.scale[noteIdx % this.scale.length];

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = (this.step % 4 === 0) ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + secondsPerBeat * 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + secondsPerBeat * 0.45);

    this.step++;
    this.bgmTimer = setTimeout(() => this.scheduleSynthArp(), interval);
  }
}

export const soundEngine = new SoundEngine();
