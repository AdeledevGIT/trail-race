/**
 * Web Audio API Game Sound Effects Synthesizer
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('sfx_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('sfx_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Create oscillator node with gain envelope
  createOsc(type, freq, duration, gainStart = 0.15) {
    if (this.muted) return null;
    this.init();

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    return { osc, gainNode, duration };
  }

  play(soundName) {
    if (this.muted) return;
    this.init();
    
    const now = this.ctx.currentTime;
    
    switch (soundName) {
      case 'tick': {
        // Fast woodblock tick during rolling
        const s = this.createOsc('triangle', 380 + Math.random() * 200, 0.05, 0.1);
        if (s) {
          s.osc.start(now);
          s.osc.stop(now + s.duration);
        }
        break;
      }
      case 'move': {
        // Pop/bubble sound on each space
        const s = this.createOsc('sine', 200, 0.1, 0.2);
        if (s) {
          s.osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
          s.osc.start(now);
          s.osc.stop(now + s.duration);
        }
        break;
      }
      case 'bonus': {
        // Happy major arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const s = this.createOsc('triangle', freq, 0.2, 0.12);
            if (s) {
              s.osc.start(this.ctx.currentTime);
              s.osc.stop(this.ctx.currentTime + s.duration);
            }
          }, idx * 75);
        });
        break;
      }
      case 'trap': {
        // Descending warning slide
        const s = this.createOsc('sawtooth', 360, 0.4, 0.12);
        if (s) {
          s.osc.frequency.linearRampToValueAtTime(120, now + 0.35);
          s.osc.start(now);
          s.osc.stop(now + s.duration);
        }
        break;
      }
      case 'reset': {
        // Alarm/power-down sweep
        const notes = [440, 392, 349, 293]; // Descending minor
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const s = this.createOsc('sawtooth', freq, 0.25, 0.1);
            if (s) {
              s.osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);
              s.osc.start(this.ctx.currentTime);
              s.osc.stop(this.ctx.currentTime + s.duration);
            }
          }, idx * 100);
        });
        break;
      }
      case 'knockout': {
        // Crunchy heavy collision explosion
        const s = this.createOsc('sawtooth', 800, 0.45, 0.2);
        if (s) {
          s.osc.frequency.linearRampToValueAtTime(60, now + 0.4);
          
          // Generate white noise for explosion crackle
          const bufferSize = this.ctx.sampleRate * 0.3; // 300ms
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.12, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
          
          // Bandpass filter to make noise sound more cruncy/heavy
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 400;
          
          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          
          s.osc.start(now);
          s.osc.stop(now + s.duration);
          noise.start(now);
          noise.stop(now + 0.3);
        }
        break;
      }
      case 'win': {
        // Epic game victory fanfare
        // C4, G4, C5, E5, G5, C6
        const melody = [
          { f: 261.63, d: 0.12 },
          { f: 392.00, d: 0.12 },
          { f: 523.25, d: 0.12 },
          { f: 659.25, d: 0.12 },
          { f: 783.99, d: 0.2 },
          { f: 1046.50, d: 0.7 }
        ];
        let accumDelay = 0;
        melody.forEach((note, idx) => {
          setTimeout(() => {
            const s = this.createOsc('sine', note.f, note.d, idx === 5 ? 0.22 : 0.15);
            if (s) {
              s.osc.start(this.ctx.currentTime);
              s.osc.stop(this.ctx.currentTime + s.duration);
            }
          }, accumDelay);
          accumDelay += note.d * 1000;
        });
        break;
      }
    }
  }
}

// Global Sound Instance
const GameSFX = new SoundEngine();
