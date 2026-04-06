// Raw Web Audio API synth with switchable Flute/Clarinet modes.
// Oscillators run continuously; sound is controlled by gain only (instant on/off).

export type SynthMode = "flute" | "clarinet";

interface ModePreset {
  partials: number[];
  filterFreq: number;
  attackTime: number;
  noiseLevel: number;
  noiseSustain: number;
}

const PRESETS: Record<SynthMode, ModePreset> = {
  flute: {
    partials: [1, 0.4, 0.1, 0.02, 0, 0, 0],
    filterFreq: 3500,
    attackTime: 0.03,
    noiseLevel: 0.08,
    noiseSustain: 0.015,
  },
  clarinet: {
    // Odd harmonics only — hollow, woody sound
    partials: [1, 0, 0.6, 0, 0.3, 0, 0.1],
    filterFreq: 2500,
    attackTime: 0.01,
    noiseLevel: 0.03,
    noiseSustain: 0.005,
  },
};

const NUM_PARTIALS = 7;

export class FluteSynth {
  private ctx: AudioContext;
  private oscillators: OscillatorNode[] = [];
  private partialGains: GainNode[] = [];
  private masterGain: GainNode;
  private noiseGain: GainNode;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode;
  private isPlaying = false;
  private currentFreq = 0;
  private mode: SynthMode = "flute";

  constructor() {
    this.ctx = new AudioContext({ latencyHint: "interactive" });

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = PRESETS.flute.filterFreq;
    this.filter.Q.value = 0.5;
    this.filter.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.filter);

    // Create persistent oscillators for all partials
    for (let i = 0; i < NUM_PARTIALS; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 440 * (i + 1);

      const gain = this.ctx.createGain();
      gain.gain.value = PRESETS.flute.partials[i];

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.oscillators.push(osc);
      this.partialGains.push(gain);
    }

    // Persistent noise for breathiness
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseGain.connect(this.filter);
    this.startNoise();
  }

  private startNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.noiseGain);
    source.start();
    this.noiseSource = source;
  }

  setMode(mode: SynthMode) {
    if (mode === this.mode) return;
    this.mode = mode;

    const preset = PRESETS[mode];
    const now = this.ctx.currentTime;

    // Update partial gains
    for (let i = 0; i < NUM_PARTIALS; i++) {
      this.partialGains[i].gain.setValueAtTime(preset.partials[i], now);
    }

    // Update filter
    this.filter.frequency.setValueAtTime(preset.filterFreq, now);
  }

  getMode(): SynthMode {
    return this.mode;
  }

  noteOn(frequency: number) {
    if (this.isPlaying && this.currentFreq === frequency) return;

    const now = this.ctx.currentTime;
    const preset = PRESETS[this.mode];

    // Set oscillator frequencies immediately
    for (let i = 0; i < this.oscillators.length; i++) {
      this.oscillators[i].frequency.setValueAtTime(
        frequency * (i + 1),
        now
      );
    }

    if (!this.isPlaying) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(0.5, now + preset.attackTime);

      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.setValueAtTime(preset.noiseLevel, now);
      this.noiseGain.gain.linearRampToValueAtTime(preset.noiseSustain, now + 0.08);

      this.isPlaying = true;
    }

    this.currentFreq = frequency;
  }

  noteOff() {
    if (!this.isPlaying) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.08);

    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, now);
    this.noiseGain.gain.linearRampToValueAtTime(0, now + 0.05);

    this.isPlaying = false;
    this.currentFreq = 0;
  }

  dispose() {
    this.oscillators.forEach((o) => o.stop());
    this.noiseSource?.stop();
    this.ctx.close();
  }
}
