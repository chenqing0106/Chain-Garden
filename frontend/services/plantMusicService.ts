import { PlantDNA, AudioSource } from '../types';

// Seeded random generator for deterministic music per specimen
const sfc32 = (a: number, b: number, c: number, d: number) => {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    var t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

const cyrb128 = (str: string) => {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return sfc32(h1, h2, h3, h4);
}

// Scales
const SCALES = {
  pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25], // C Major Pent
  dorian: [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25],     // C Dorian
  lydian: [261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25]      // C Lydian
};

export class PlantMusicService implements AudioSource {
  private ctx: AudioContext | null = null;
  private output: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isPlaying: boolean = false;
  private timeoutIds: number[] = [];
  private rand: () => number = () => Math.random();

  constructor() {
    // Init empty
  }

  play(dna: PlantDNA) {
    this.stop();
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    // Master Output (with Limiter feel)
    this.output = this.ctx.createGain();
    this.output.gain.value = 0.4;
    this.output.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isPlaying = true;
    
    // Seed RNG with name
    this.rand = cyrb128(dna.speciesName);

    // Start Generation based on Architecture
    switch (dna.growthArchitecture) {
      case 'fractal_tree':
        this.playTree(dna);
        break;
      case 'fern_frond':
        this.playFern(dna);
        break;
      case 'organic_vine':
        this.playVine(dna);
        break;
      case 'radial_succulent':
        this.playSucculent(dna);
        break;
    }
  }

  private playNote(freq: number, type: OscillatorType, duration: number, startTime: number, vol: number = 0.5, slideTo?: number) {
    if (!this.ctx || !this.output) return;
    
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, startTime + duration);
    }

    // Envelope
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(vol, startTime + 0.1);
    env.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    // Filter for lo-fi feel
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.output);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  // 1. Tree: Deep, Slow, resonant
  private playTree(dna: PlantDNA) {
    if (!this.ctx) return;
    const baseFreq = 65.41; // Low C
    
    const loop = () => {
        if (!this.isPlaying || !this.ctx) return;
        const time = this.ctx.currentTime;
        
        // Drone Bass
        this.playNote(baseFreq, 'triangle', 4, time, 0.6);
        this.playNote(baseFreq * 1.5, 'sine', 4, time, 0.3);
        
        // Wind Chimes (High random notes)
        if (this.rand() > 0.6) {
            const note = SCALES.dorian[Math.floor(this.rand() * SCALES.dorian.length)] * 2;
            this.playNote(note, 'sine', 1.5, time + this.rand(), 0.2);
        }

        const nextTime = (4000 / dna.growthSpeed);
        this.timeoutIds.push(window.setTimeout(loop, nextTime));
    }
    loop();
  }

  // 2. Fern: Fast, repetitive, plucky
  private playFern(dna: PlantDNA) {
    if (!this.ctx) return;
    const sequence = [0, 2, 3, 5, 7, 5, 3, 2]; // Pattern indices
    let step = 0;

    const loop = () => {
        if (!this.isPlaying || !this.ctx) return;
        const time = this.ctx.currentTime;
        
        const noteIdx = sequence[step % sequence.length];
        const freq = SCALES.pentatonic[noteIdx];
        
        // Pluck sound
        this.playNote(freq, 'sawtooth', 0.2, time, 0.15);
        // Delay/Echo effect via ghost note
        this.playNote(freq, 'triangle', 0.2, time + 0.15, 0.05);

        step++;
        const speed = (300 / dna.growthSpeed); // Faster
        this.timeoutIds.push(window.setTimeout(loop, speed));
    }
    loop();
  }

  // 3. Vine: Wandering, Theremin-like, Portamento
  private playVine(dna: PlantDNA) {
    if (!this.ctx || !this.output) return;
    
    // Continuous Oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = 329.63;
    
    gain.gain.value = 0.3;
    
    osc.connect(gain);
    gain.connect(this.output);
    osc.start();
    
    const wander = () => {
        if (!this.isPlaying || !this.ctx) {
            osc.stop();
            return;
        }
        const time = this.ctx.currentTime;
        const nextNote = SCALES.lydian[Math.floor(this.rand() * SCALES.lydian.length)];
        
        // Portamento slide
        osc.frequency.linearRampToValueAtTime(nextNote, time + 1.0);
        
        // Tremolo volume
        gain.gain.linearRampToValueAtTime(0.1 + (this.rand()*0.2), time + 1.0);

        this.timeoutIds.push(window.setTimeout(wander, 1000 / dna.growthSpeed));
    };
    wander();
  }

  // 4. Succulent: Polyphonic, swelling pads, pure
  private playSucculent(dna: PlantDNA) {
    if (!this.ctx) return;
    
    const loop = () => {
        if (!this.isPlaying || !this.ctx) return;
        const time = this.ctx.currentTime;
        
        // Chord
        const rootIdx = Math.floor(this.rand() * 3);
        const chord = [
            SCALES.pentatonic[rootIdx], 
            SCALES.pentatonic[rootIdx + 2], 
            SCALES.pentatonic[rootIdx + 4]
        ];

        chord.forEach((freq, i) => {
             // Long attack, long release
             const osc = this.ctx!.createOscillator();
             const env = this.ctx!.createGain();
             
             osc.type = 'sine';
             osc.frequency.value = freq;
             
             env.gain.setValueAtTime(0, time);
             env.gain.linearRampToValueAtTime(0.15, time + 2); // Slow attack
             env.gain.linearRampToValueAtTime(0, time + 6);    // Long release

             osc.connect(env);
             env.connect(this.output!);
             osc.start(time);
             osc.stop(time + 6.5);
        });

        const nextTime = (5000 / dna.growthSpeed);
        this.timeoutIds.push(window.setTimeout(loop, nextTime));
    }
    loop();
  }

  getFrequencyData() {
    if (!this.analyser || !this.dataArray) {
        return { bass: 0, mid: 0, treble: 0, raw: new Uint8Array(0) };
    }
    // Type assertion to fix TypeScript strict type checking for ArrayBufferLike vs ArrayBuffer
    this.analyser.getByteFrequencyData(this.dataArray as any);
    
    const bufferLength = this.dataArray.length;
    const third = Math.floor(bufferLength / 3);

    const getAvg = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += this.dataArray![i];
      }
      return sum / (end - start);
    };

    // Create a new Uint8Array to avoid type issues
    const rawCopy = new Uint8Array(Array.from(this.dataArray));

    return {
      bass: getAvg(0, third),
      mid: getAvg(third, third * 2),
      treble: getAvg(third * 2, bufferLength),
      raw: rawCopy as Uint8Array
    };
  }

  stop() {
    this.isPlaying = false;
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];
    
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
  
  cleanup() {
      this.stop();
  }
}