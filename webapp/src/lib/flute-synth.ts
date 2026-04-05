// Raw Web Audio API flute synth — no Tone.js scheduler overhead.
// Oscillators run continuously; sound is controlled by gain only (instant on/off).

export class FluteSynth {
  private ctx: AudioContext;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private masterGain: GainNode;
  private noiseGain: GainNode;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode;
  private isPlaying = false;
  private currentFreq = 0;

  // Harmonic weights for flute timbre
  private static PARTIALS = [1, 0.4, 0.1, 0.02];

  constructor() {
    this.ctx = new AudioContext({ latencyHint: "interactive" });

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 3500;
    this.filter.Q.value = 0.5;
    this.filter.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.filter);

    // Create persistent oscillators for each partial
    for (let i = 0; i < FluteSynth.PARTIALS.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 440 * (i + 1);

      const gain = this.ctx.createGain();
      gain.gain.value = FluteSynth.PARTIALS[i];

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.oscillators.push(osc);
      this.gains.push(gain);
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

  noteOn(frequency: number) {
    if (this.isPlaying && this.currentFreq === frequency) return;

    const now = this.ctx.currentTime;

    // Set oscillator frequencies immediately
    for (let i = 0; i < this.oscillators.length; i++) {
      this.oscillators[i].frequency.setValueAtTime(
        frequency * (i + 1),
        now
      );
    }

    if (!this.isPlaying) {
      // Attack: ramp gain up fast
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(0.5, now + 0.03);

      // Brief breath noise on attack
      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.setValueAtTime(0.08, now);
      this.noiseGain.gain.linearRampToValueAtTime(0.015, now + 0.08);

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
