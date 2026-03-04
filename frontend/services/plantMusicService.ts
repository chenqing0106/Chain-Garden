
import * as Tone from 'tone';
import { PlantDNA, AudioSource, BioState } from '../types';

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
  private recorder: Tone.Recorder | null = null;
  private synth: Tone.PolySynth<any> | null = null;
  private bassSynth: Tone.MembraneSynth | null = null;
  private effects: Tone.ToneAudioNode[] = [];
  private loop: Tone.Loop | null = null;
  
  // Dynamic Bio-Feedback Nodes
  private distortionNode: Tone.Distortion | null = null;
  private bitCrusherNode: Tone.BitCrusher | null = null;
  private bioState: BioState = { stress: 0, energy: 0 };
  
  constructor() {
    // Init nothing
  }

  // New method to update physics state
  updateBioState(state: BioState) {
      this.bioState = state;
      
      if (Tone.Transport.state === 'started') {
          // 1. DISTORTION: Map Stress directly to wetness
          if (this.distortionNode) {
              this.distortionNode.wet.rampTo(state.stress > 0.3 ? state.stress : 0, 0.1);
          }
          
          // 2. BITCRUSHER: Extreme stress reduces bit depth
          if (this.bitCrusherNode) {
              if (state.stress > 0.6) {
                  this.bitCrusherNode.bits.rampTo(4, 0.2); // Low Fi
                  this.bitCrusherNode.wet.rampTo(1, 0.2);
              } else {
                  this.bitCrusherNode.bits.rampTo(8, 0.5); // Clean
                  this.bitCrusherNode.wet.rampTo(0, 0.5);
              }
          }

          // 3. BPM MODULATION
          const baseBPM = (Tone.Transport.bpm as any)._defaultValue || 120;
          const targetBPM = baseBPM + (state.stress * 60);
          Tone.Transport.bpm.rampTo(targetBPM, 0.5);
      }
  }

  async play(dna: PlantDNA) {
    await this.stop(); // Ensure clean state
    await Tone.start(); 

    // 1. Setup Master Output & Analyser & Recorder
    this.analyser = new Tone.Analyser('fft', 512);
    this.recorder = new Tone.Recorder();
    
    // 2. Create Instruments
    this.createInstrument(dna.growthArchitecture);
    
    // 3. Create Effects
    this.createEffects(dna.mood);

    // 4. Setup Transport
    const bpm = 60 + (dna.growthSpeed * 40); 
    Tone.Transport.bpm.value = bpm;
    (Tone.Transport.bpm as any)._defaultValue = bpm; 
    
    this.startGenerativeLoop(dna);

    Tone.Transport.start();
  }

  // RECORDING METHODS
  async startRecording() {
    if (this.recorder && this.recorder.state !== 'started') {
        this.recorder.start();
    }
  }

  async stopRecording(): Promise<Blob | null> {
      if (this.recorder && this.recorder.state === 'started') {
          return await this.recorder.stop();
      }
      return null;
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
            } as Partial<Tone.MonoSynthOptions>).toDestination();
            break;
        case 'weeping_willow':
            this.synth = new Tone.PolySynth(Tone.AMSynth, {
                harmonicity: 2.5,
                oscillator: { type: "fatcustom", partials: [0, 2, 3] },
                envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 1 }
            }).toDestination();
            break;
        case 'crystal_cactus':
            this.synth = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 8, modulationIndex: 20,
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 2, sustain: 0.0, release: 2 },
                modulation: { type: "sine" },
                modulationEnvelope: { attack: 0.001, decay: 2, sustain: 0, release: 2 }
            }).toDestination();
            break;
        case 'alien_shrub':
            this.synth = new Tone.PolySynth(Tone.DuoSynth, {
                vibratoAmount: 0.5,
                vibratoRate: 5,
                harmonicity: 1.5
            } as Partial<Tone.DuoSynthOptions>).toDestination();
            this.synth.set({
                voice0: { oscillator: { type: "sawtooth" }, filterEnvelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 } },
                voice1: { oscillator: { type: "sine" }, filterEnvelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 } }
            } as Partial<Tone.DuoSynthOptions>);
            break;
        case 'data_blossom':
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sine" },
                envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 3 },
                portamento: 0.05
            } as Partial<Tone.SynthOptions>).toDestination();
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

    this.effects.forEach(e => e.dispose());
    this.effects = [];

    this.bitCrusherNode = new Tone.BitCrusher(8).toDestination(); 
    this.bitCrusherNode.wet.value = 0;
    
    this.distortionNode = new Tone.Distortion(0).connect(this.bitCrusherNode);
    
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).connect(this.distortionNode);
    const delay = new Tone.FeedbackDelay("8n", 0.3).connect(this.distortionNode);
    
    this.effects.push(reverb, delay, this.distortionNode, this.bitCrusherNode);

    if (mood === 'mysterious' || mood === 'calm') {
        const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start();
        this.synth.connect(chorus);
        this.effects.push(chorus);
        chorus.connect(reverb);
        chorus.connect(delay);
    } 
    else if (mood === 'aggressive') {
        const preDist = new Tone.Distortion(0.4).toDestination();
        this.synth.connect(preDist);
        this.effects.push(preDist);
        preDist.connect(reverb);
        preDist.connect(delay);
    } 
    else {
        this.synth.connect(reverb);
        this.synth.connect(delay);
    }
    
    if(this.bassSynth) this.bassSynth.connect(reverb);
    
    // Connect Analyser and Recorder at end of chain
    Tone.Destination.connect(this.analyser!);
    if(this.recorder) Tone.Destination.connect(this.recorder);
  }

  private startGenerativeLoop(dna: PlantDNA) {
      const scale = SCALES[dna.mood] || SCALES.happy;
      
      this.loop = new Tone.Loop((time) => {
          if (!this.synth || this.synth.disposed || !this.bassSynth || this.bassSynth.disposed) return;

          const r = Math.random();
          const bassThreshold = 0.15 + (this.bioState.stress * 0.2);
          const cappedBassThreshold = Math.min(bassThreshold, 0.35);
          if (r < cappedBassThreshold) {
             const bassNote = scale[0].replace('4', '2').replace('3', '1'); 
             this.bassSynth.triggerAttackRelease(bassNote, "8n", time);
          }

          const density = 0.2 + (dna.energy * 0.15) + (this.bioState.energy * 0.2);
          const cappedDensity = Math.min(density, 0.6);
          if (r < cappedDensity) {
              const note = scale[Math.floor(Math.random() * scale.length)];
              const duration = this.bioState.stress > 0.7 ? "8n" : (Math.random() > 0.5 ? "4n" : "8n");
              
              if (Math.random() > 0.85) {
                  const noteIndex = scale.indexOf(note);
                  if (noteIndex !== -1) {
                      const chord = [
                          note, 
                          scale[(noteIndex + 2) % scale.length], 
                          scale[(noteIndex + 4) % scale.length]
                      ];
                      (this.synth as any).triggerAttackRelease(chord, duration, time);
                  } else {
                      (this.synth as any).triggerAttackRelease(note, duration, time);
                  }
              } else {
                  (this.synth as any).triggerAttackRelease(note, duration, time);
              }
          }
      }, "4n").start(0);
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
                 let val = (values[i] + 100) * 2.55; 
                 val = Math.max(0, Math.min(255, val));
                 raw[i] = val;
                 if (i < bassCount) bassSum += val;
                 else if (i < bassCount + midCount) midSum += val;
                 else trebleSum += val;
             }
             return { bass: bassSum / bassCount, mid: midSum / midCount, treble: trebleSum / (values.length - bassCount - midCount), raw: raw };
        }
    } catch (e) { }
    return { bass: 0, mid: 0, treble: 0, raw: new Uint8Array(0) };
  }

  async stop() {
    Tone.Transport.cancel();
    Tone.Transport.stop();
    if (this.loop) { this.loop.stop(); this.loop.dispose(); this.loop = null; }
    if (this.synth) { this.synth.releaseAll(); this.synth.dispose(); this.synth = null; }
    if (this.bassSynth) { this.bassSynth.dispose(); this.bassSynth = null; }
    this.effects.forEach(e => e.dispose());
    this.effects = [];
    this.bioState = { stress: 0, energy: 0 };
    if (this.distortionNode) { this.distortionNode.dispose(); this.distortionNode = null; }
    if (this.bitCrusherNode) { this.bitCrusherNode.dispose(); this.bitCrusherNode = null; }
    if (this.analyser) { this.analyser.dispose(); this.analyser = null; }
    if (this.recorder) { this.recorder.dispose(); this.recorder = null; }
  }
  
  cleanup() {
      this.stop();
  }
}
