import * as Tone from 'tone';
import { PlantDNA, AudioSource } from '../types';

// Scales mapped to Moods
const SCALES: Record<string, string[]> = {
  happy: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5'], // Pentatonic Major
  melancholic: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5'], // Pentatonic Minor
  mysterious: ['C4', 'C#4', 'E4', 'F#4', 'G4', 'B4', 'C5'], // Lydian #5 / Exotic
  aggressive: ['C3', 'C#3', 'F3', 'F#3', 'G3', 'Bb3', 'C4'], // Locrian-ish / Diminished
  calm: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4'] // Lydian (Dreamy)
};

export class PlantMusicService implements AudioSource {
  private analyser: Tone.Analyser | null = null;
  private synth: Tone.PolySynth<any> | Tone.FMSynth | Tone.AMSynth | Tone.DuoSynth | null = null;
  private bassSynth: Tone.MembraneSynth | null = null;
  private effects: Tone.ToneAudioNode[] = [];
  private loop: Tone.Loop | null = null;
  private dna: PlantDNA | null = null;

  constructor() {
    // Init nothing
  }

  async play(dna: PlantDNA) {
    await this.stop(); // Ensure clean state
    await Tone.start(); 
    this.dna = dna;

    // 1. Setup Master Output & Analyser
    this.analyser = new Tone.Analyser('fft', 512);
    Tone.Destination.chain(this.analyser);

    // 2. Create Instruments
    this.createInstrument(dna.growthArchitecture);
    
    // 3. Create Effects
    this.createEffects(dna.mood);

    // 4. Setup Transport
    const bpm = 60 + (dna.growthSpeed * 40); // Map 0.5-2.5 to 80-160 BPM
    Tone.Transport.bpm.value = bpm;
    
    this.startGenerativeLoop(dna);

    Tone.Transport.start();
  }

  private createInstrument(arch: string) {
    switch(arch) {
        case 'fractal_tree': 
            this.synth = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 3, modulationIndex: 10,
                oscillator: { type: "sine" },
                envelope: { attack: 0.5, decay: 0.5, sustain: 1, release: 2 },
                modulation: { type: "square" },
                modulationEnvelope: { attack: 0.5, decay: 0.01, sustain: 1, release: 0.5 }
            }).toDestination();
            break;
            
        case 'organic_vine':
            this.synth = new Tone.PolySynth(Tone.MonoSynth, {
                oscillator: { type: "triangle" },
                envelope: { attack: 1, decay: 0.5, sustain: 0.5, release: 2 },
                filterEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.5, baseFrequency: 200, octaves: 3, exponent: 2 }
            }).toDestination();
            break;

        case 'weeping_willow':
            // Harp-like AM Synth
            this.synth = new Tone.PolySynth(Tone.AMSynth, {
                harmonicity: 2.5,
                oscillator: { type: "fatcustom", partials: [0, 2, 3] },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 1 }
            }).toDestination();
            break;

        case 'crystal_cactus':
            // Glassy FM
            this.synth = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 8, modulationIndex: 20,
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 2, sustain: 0.0, release: 2 },
                modulation: { type: "sine" },
                modulationEnvelope: { attack: 0.001, decay: 2, sustain: 0, release: 2 }
            }).toDestination();
            break;
            
        case 'alien_shrub':
            // Sci-fi DuoSynth
            this.synth = new Tone.PolySynth(Tone.DuoSynth, {
                vibratoAmount: 0.5, vibratoRate: 5, harmonicity: 1.5,
                voice0: { oscillator: { type: "sawtooth" }, filterEnvelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 } },
                voice1: { oscillator: { type: "sine" }, filterEnvelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 } }
            }).toDestination();
            (this.synth as Tone.PolySynth<Tone.DuoSynth>).volume.value = -10;
            break;
            
        default:
            this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    }

    this.bassSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05, octaves: 4, oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination();
    this.bassSynth.volume.value = -10;
}

  private createEffects(mood: string) {
    if (!this.synth) return;

    // Dispose old effects safely
    this.effects.forEach(e => e.dispose());
    this.effects = [];

    const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination();
    this.effects.push(reverb);

    const delay = new Tone.FeedbackDelay("8n", 0.3).toDestination();
    this.effects.push(delay);

    if (mood === 'mysterious' || mood === 'calm') {
        const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start();
        this.synth.connect(chorus);
        this.effects.push(chorus);
        chorus.connect(reverb);
    } 
    else if (mood === 'aggressive' || mood === 'alien_shrub') {
        const distortion = new Tone.Distortion(0.4).toDestination();
        this.synth.connect(distortion);
        this.effects.push(distortion);
        distortion.connect(reverb);
    } else {
        this.synth.connect(reverb);
    }
    
    this.synth.connect(delay);
  }

  private startGenerativeLoop(dna: PlantDNA) {
      const scale = SCALES[dna.mood] || SCALES.happy;
      const energy = dna.energy; // 0.0 to 1.0
      
      this.loop = new Tone.Loop((time) => {
          // SAFETY CHECK: Prevent using disposed synths
          if (!this.synth || this.synth.disposed || !this.bassSynth || this.bassSynth.disposed) return;

          const r = Math.random();

          // 1. Bass (Structure) - Weighted by Energy
          // Low energy = sparse bass. High energy = driving bass.
          if (r < (0.2 + energy * 0.3)) {
             const bassNote = scale[0].replace('4', '2').replace('3', '1'); 
             this.bassSynth.triggerAttackRelease(bassNote, "8n", time);
          }

          // 2. Melody / Texture
          // Silence probability (Rest) inversely proportional to energy
          const playProbability = 0.3 + (energy * 0.6); 
          
          if (r < playProbability) {
              const noteIdx = Math.floor(Math.random() * scale.length);
              const note = scale[noteIdx];
              
              // Dynamic Velocity
              const velocity = 0.5 + (Math.random() * 0.5);

              // High Energy = Short notes (16n), Low Energy = Long notes (2n)
              const duration = energy > 0.7 ? "16n" : (energy < 0.3 ? "2n" : "4n");
              
              // Chord Chance (Polyphony)
              if (Math.random() > 0.85) {
                  const chord = [
                      note,
                      scale[(noteIdx + 2) % scale.length],
                      scale[(noteIdx + 4) % scale.length]
                  ];
                  // Use 'any' cast because PolySynth trigger signature varies in TS definition vs implementation
                  (this.synth as any).triggerAttackRelease(chord, duration, time, velocity);
              } else {
                  (this.synth as any).triggerAttackRelease(note, duration, time, velocity);
              }
          }
      }, "8n").start(0);
  }

  getFrequencyData() {
    if (!this.analyser || this.analyser.disposed) {
        return { bass: 0, mid: 0, treble: 0, raw: new Uint8Array(0) };
    }
    
    try {
        const values = this.analyser.getValue();
        if (values instanceof Float32Array) {
             const raw = new Uint8Array(values.length);
             let bassSum = 0, midSum = 0, trebleSum = 0;
             
             const bassCount = Math.floor(values.length * 0.1); 
             const midCount = Math.floor(values.length * 0.4); 
             
             for(let i=0; i<values.length; i++) {
                 // Map dB (-100 to 0) to 0-255 range
                 let val = (values[i] + 100) * 2.55; 
                 val = Math.max(0, Math.min(255, val));
                 raw[i] = val;
                 
                 if (i < bassCount) bassSum += val;
                 else if (i < bassCount + midCount) midSum += val;
                 else trebleSum += val;
             }
             
             return {
                 bass: bassSum / bassCount,
                 mid: midSum / midCount,
                 treble: trebleSum / (values.length - bassCount - midCount),
                 raw: raw
             };
        }
    } catch (e) {
        console.warn("Analyser access failed", e);
    }

    return { bass: 0, mid: 0, treble: 0, raw: new Uint8Array(0) };
  }

  async stop() {
    // 1. CRITICAL: Cancel future events BEFORE disposing instruments
    Tone.Transport.cancel();
    Tone.Transport.stop();

    // 2. Dispose Loop
    if (this.loop) {
        this.loop.stop();
        this.loop.dispose();
        this.loop = null;
    }

    // 3. Dispose Instruments
    if (this.synth) {
        if ('releaseAll' in this.synth && typeof this.synth.releaseAll === 'function') {
            this.synth.releaseAll();
        }
        this.synth.dispose();
        this.synth = null;
    }
    if (this.bassSynth) {
        this.bassSynth.dispose();
        this.bassSynth = null;
    }
    
    // 4. Dispose Effects
    this.effects.forEach(e => e.dispose());
    this.effects = [];

    if (this.analyser) {
        this.analyser.dispose();
        this.analyser = null;
    }
  }
  
  cleanup() {
      this.stop();
  }
}
