import { AudioSource } from '../types';

// 预设音频模式类型
export type DemoPreset = 
  | 'bass_pulse'      // 低频脉冲 - 模拟鼓点
  | 'treble_sparkle'  // 高频闪烁 - 模拟高音旋律
  | 'mid_wave'        // 中频波浪 - 模拟人声/吉他
  | 'balanced_music'  // 均衡音乐 - 三频均衡
  | 'frequency_sweep' // 频率扫描 - 从低到高循环
  | 'heartbeat';      // 心跳节奏 - 模拟心跳

// 预设配置
export const DEMO_PRESETS: Record<DemoPreset, { name: string; description: string; icon: string }> = {
  bass_pulse: {
    name: '低音鼓点',
    description: '强劲的低频脉冲，观察根部和主干的生长',
    icon: '🥁'
  },
  treble_sparkle: {
    name: '高音旋律',
    description: '明亮的高频音符，观察叶子和末端的绽放',
    icon: '✨'
  },
  mid_wave: {
    name: '中频人声',
    description: '温暖的中频波动，观察分支的扩展',
    icon: '🎤'
  },
  balanced_music: {
    name: '均衡音乐',
    description: '三频均衡的完整音乐，整体生长',
    icon: '🎵'
  },
  frequency_sweep: {
    name: '频率扫描',
    description: '从低频到高频循环，观察不同部位依次生长',
    icon: '🌊'
  },
  heartbeat: {
    name: '心跳节奏',
    description: '模拟心跳的节奏脉冲',
    icon: '💓'
  }
};

/**
 * 演示用音频源 - 生成真实可听的音频 + 频率数据
 */
export class DemoAudioService implements AudioSource {
  private preset: DemoPreset = 'balanced_music';
  private isPlaying: boolean = false;
  private startTime: number = 0;
  
  // Web Audio API
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private dataArray: Uint8Array | null = null;
  
  // 动画帧 ID
  private animationFrame: number | null = null;

  setPreset(preset: DemoPreset) {
    this.preset = preset;
    // 如果正在播放，重新启动以应用新预设
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  async start() {
    // 创建音频上下文
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.audioContext.resume();
    
    // 创建分析器
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    // 创建主增益节点
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3; // 音量控制
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    // 根据预设创建音频
    this.createPresetAudio();
    
    this.isPlaying = true;
    this.startTime = Date.now();
    
    // 开始更新循环
    this.updateLoop();
  }

  private createPresetAudio() {
    if (!this.audioContext || !this.masterGain) return;
    
    // 清理旧的振荡器
    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.gains.forEach(gain => gain.disconnect());
    this.oscillators = [];
    this.gains = [];

    switch (this.preset) {
      case 'bass_pulse':
        this.createBassPreset();
        break;
      case 'treble_sparkle':
        this.createTreblePreset();
        break;
      case 'mid_wave':
        this.createMidPreset();
        break;
      case 'balanced_music':
        this.createBalancedPreset();
        break;
      case 'frequency_sweep':
        this.createSweepPreset();
        break;
      case 'heartbeat':
        this.createHeartbeatPreset();
        break;
    }
  }

  private createOscillator(frequency: number, type: OscillatorType = 'sine'): { osc: OscillatorNode, gain: GainNode } {
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = 0;
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start();
    this.oscillators.push(osc);
    this.gains.push(gain);
    
    return { osc, gain };
  }

  private createBassPreset() {
    // 低频鼓点：50-80Hz 的低频振荡
    const { osc: bassOsc, gain: bassGain } = this.createOscillator(60, 'sine');
    const { osc: subOsc, gain: subGain } = this.createOscillator(40, 'sine');
    
    // 使用 LFO 控制增益来创建脉冲效果
    const lfo = this.audioContext!.createOscillator();
    const lfoGain = this.audioContext!.createGain();
    lfo.frequency.value = 2; // 每秒2次脉冲
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    lfoGain.connect(subGain.gain);
    lfo.start();
    this.oscillators.push(lfo);
    
    bassGain.gain.value = 0.5;
    subGain.gain.value = 0.3;
  }

  private createTreblePreset() {
    // 高频闪烁：多个高频振荡器快速变化
    const freqs = [2000, 3000, 4000, 5000];
    freqs.forEach((freq, i) => {
      const { osc, gain } = this.createOscillator(freq, 'sine');
      
      // 每个振荡器有不同的调制频率
      const lfo = this.audioContext!.createOscillator();
      const lfoGain = this.audioContext!.createGain();
      lfo.frequency.value = 3 + i * 2; // 不同的调制速度
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      this.oscillators.push(lfo);
      
      gain.gain.value = 0.1;
    });
  }

  private createMidPreset() {
    // 中频人声：300-800Hz 的温暖音调
    const freqs = [300, 500, 700];
    freqs.forEach((freq, i) => {
      const { osc, gain } = this.createOscillator(freq, 'triangle');
      
      // 缓慢的波动
      const lfo = this.audioContext!.createOscillator();
      const lfoGain = this.audioContext!.createGain();
      lfo.frequency.value = 0.5 + i * 0.3;
      lfoGain.gain.value = 0.2;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      this.oscillators.push(lfo);
      
      gain.gain.value = 0.2;
    });
  }

  private createBalancedPreset() {
    // 均衡音乐：低中高频都有
    // 低频
    const { gain: bassGain } = this.createOscillator(80, 'sine');
    bassGain.gain.value = 0.25;
    
    // 中频
    const { gain: midGain1 } = this.createOscillator(400, 'triangle');
    const { gain: midGain2 } = this.createOscillator(600, 'triangle');
    midGain1.gain.value = 0.15;
    midGain2.gain.value = 0.15;
    
    // 高频
    const { gain: trebleGain } = this.createOscillator(2500, 'sine');
    trebleGain.gain.value = 0.1;
    
    // 节奏 LFO
    const lfo = this.audioContext!.createOscillator();
    const lfoGain = this.audioContext!.createGain();
    lfo.frequency.value = 1.5;
    lfoGain.gain.value = 0.1;
    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    lfoGain.connect(midGain1.gain);
    lfo.start();
    this.oscillators.push(lfo);
  }

  private createSweepPreset() {
    // 频率扫描：一个振荡器频率从低到高循环
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 100;
    gain.gain.value = 0.2;
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    
    this.oscillators.push(osc);
    this.gains.push(gain);
    
    // 频率扫描将在 updateLoop 中处理
  }

  private createHeartbeatPreset() {
    // 心跳：低频双脉冲
    const { osc, gain } = this.createOscillator(50, 'sine');
    gain.gain.value = 0;
    
    // 心跳节奏将在 updateLoop 中处理
  }

  private updateLoop = () => {
    if (!this.isPlaying || !this.audioContext) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    
    // 根据预设更新振荡器参数
    if (this.preset === 'frequency_sweep' && this.oscillators[0]) {
      // 3秒一个周期的扫频
      const cycle = (elapsed % 3) / 3;
      const freq = 80 + cycle * 4000; // 80Hz -> 4080Hz
      this.oscillators[0].frequency.value = freq;
    }
    
    if (this.preset === 'heartbeat' && this.gains[0]) {
      // 心跳节奏
      const heartPhase = elapsed % 0.8;
      let volume = 0;
      if (heartPhase < 0.08) {
        volume = 0.6; // 第一次跳动
      } else if (heartPhase < 0.2) {
        volume = 0.1;
      } else if (heartPhase < 0.28) {
        volume = 0.4; // 第二次跳动
      } else {
        volume = 0.02;
      }
      this.gains[0].gain.value = volume;
    }
    
    this.animationFrame = requestAnimationFrame(this.updateLoop);
  };

  stop() {
    this.isPlaying = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // 停止所有振荡器
    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.gains.forEach(gain => gain.disconnect());
    this.oscillators = [];
    this.gains = [];
    
    // 关闭音频上下文
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.dataArray = null;
  }

  getFrequencyData(): { bass: number; mid: number; treble: number; raw: Uint8Array } {
    if (!this.isPlaying || !this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0, raw: new Uint8Array(256) };
    }

    // 从真实的分析器获取频率数据
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
    
    const bufferLength = this.dataArray.length;
    const third = Math.floor(bufferLength / 3);
    
    // 计算各频段平均值
    const getAvg = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += this.dataArray![i];
      }
      return sum / (end - start);
    };

    // 放大信号以获得更明显的效果
    const amplify = 2.5;
    const bass = Math.min(255, getAvg(0, third) * amplify);
    const mid = Math.min(255, getAvg(third, third * 2) * amplify);
    const treble = Math.min(255, getAvg(third * 2, bufferLength) * amplify);

    // 创建一个新的 Uint8Array 副本
    const rawCopy = new Uint8Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
      rawCopy[i] = this.dataArray![i];
    }
    
    return { 
      bass, 
      mid, 
      treble, 
      raw: rawCopy 
    };
  }

  cleanup() {
    this.stop();
  }
}

// 单例实例
export const demoAudioService = new DemoAudioService();
