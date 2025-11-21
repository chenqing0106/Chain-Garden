import { AudioSource } from '../types';

export class AudioAnalyzer implements AudioSource {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioElement: HTMLAudioElement | null = null;

  async startMicrophone(): Promise<void> {
    this.cleanup();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.source = this.audioContext.createMediaStreamSource(stream);
      
      this.analyser.fftSize = 512; // Controls resolution
      this.source.connect(this.analyser);
      // Note: Mic source is NOT connected to destination to avoid feedback loop
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  }

  async startFile(file: File): Promise<void> {
    this.cleanup();
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioElement = new Audio(URL.createObjectURL(file));
      this.audioElement.loop = true; // Loop strictly for the garden ambience

      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;

      // Connect source -> analyser -> destination (speakers)
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      await this.audioElement.play();
    } catch (error) {
      console.error("Error playing audio file:", error);
      throw error;
    }
  }

  togglePlayback() {
    if (this.audioElement) {
      if (this.audioElement.paused) {
        this.audioElement.play();
      } else {
        this.audioElement.pause();
      }
    }
  }

  getFrequencyData(): { bass: number; mid: number; treble: number; raw: Uint8Array } {
    if (!this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0, raw: new Uint8Array(0) };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const bufferLength = this.dataArray.length;
    const third = Math.floor(bufferLength / 3);

    const getAvg = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += this.dataArray![i];
      }
      return sum / (end - start);
    };

    return {
      bass: getAvg(0, third),
      mid: getAvg(third, third * 2),
      treble: getAvg(third * 2, bufferLength),
      raw: this.dataArray
    };
  }

  cleanup() {
    if (this.audioElement) {
      this.audioElement.pause();
      URL.revokeObjectURL(this.audioElement.src);
      this.audioElement = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.source = null;
    this.analyser = null;
  }
}