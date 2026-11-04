/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockType } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private weatherGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private natureGain: GainNode | null = null;
  private musicInterval: number | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGainNode: GainNode | null = null;
  private windNode: AudioBufferSourceNode | null = null;
  private windGainNode: GainNode | null = null;
  private masterVol: number = 0.8;
  private musicVol: number = 0.5;
  private weatherVol: number = 0.7;
  private sfxVol: number = 0.8;
  private natureVol: number = 0.6;

  private initCtx(): boolean {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : this.masterVol;
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVol;
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVol;
        this.musicGain.connect(this.masterGain);

        this.weatherGain = this.ctx.createGain();
        this.weatherGain.gain.value = this.weatherVol;
        this.weatherGain.connect(this.masterGain);

        this.natureGain = this.ctx.createGain();
        this.natureGain.gain.value = this.natureVol;
        this.natureGain.connect(this.masterGain);
      } catch {
        return false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return !!(this.ctx && this.masterGain);
  }

  public setMasterVolume(v: number) {
    this.masterVol = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx!.currentTime);
    }
  }

  public setMusicVolume(v: number) {
    this.musicVol = Math.max(0, Math.min(1, v));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
    }
  }

  public setWeatherVolume(v: number) {
    this.weatherVol = Math.max(0, Math.min(1, v));
    if (this.weatherGain && this.ctx) {
      this.weatherGain.gain.setValueAtTime(this.weatherVol, this.ctx.currentTime);
    }
  }

  public setSfxVolume(v: number) {
    this.sfxVol = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  public setNatureVolume(v: number) {
    this.natureVol = Math.max(0, Math.min(1, v));
    if (this.natureGain && this.ctx) {
      this.natureGain.gain.setValueAtTime(this.natureVol, this.ctx.currentTime);
    }
  }

  public getVolumes() {
    return {
      master: this.masterVol,
      music: this.musicVol,
      weather: this.weatherVol,
      sfx: this.sfxVol,
      nature: this.natureVol,
    };
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVol;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Generate white noise buffer
  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.initCtx()) return null;
    try {
      const bufferSize = this.ctx!.sampleRate * duration;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    } catch {
      return null;
    }
  }

  // Play walking footstep sound based on block walked on
  public playStep(block: BlockType) {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.12);
    if (!noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (block === BlockType.GRASS || block === BlockType.OAK_LEAVES) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(2, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (block === BlockType.STONE || block === BlockType.COBBLESTONE) {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else if (block === BlockType.SAND || block === BlockType.GRAVEL) {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else if (block === BlockType.WATER) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  // Block hit sound
  public playBlockHit(block: BlockType) {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(block === BlockType.STONE ? 1200 : 700, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.08);
  }

  // Block break sound
  public playBlockBreak(block: BlockType) {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Crunch noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.22);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(block === BlockType.GLASS ? 2400 : 850, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Pop tonal component
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.22);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Block place sound
  public playBlockPlace() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Classic Player Hurt Sound
  public playPlayerHurt() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Classic low retro pitch drop "Oof"
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Weapon swing whoosh
  public playSwing() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  // Mob hurt thud
  public playMobHurt() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Zombie groan
  public playZombieGroan() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.3);
    osc.frequency.linearRampToValueAtTime(80, now + 0.7);

    // Vibrato
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(7, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(12, now);
    lfo.connect(osc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.75);
    osc.stop(now + 0.75);
  }

  // Cow deep moo
  public playCowMoo() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(135, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.9);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.95);
  }

  // Sheep bleat / baa
  public playSheepBaa() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(210, now + 0.6);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(14, now); // Rapid goat/sheep vibrato
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(18, now);
    lfo.connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.65);
    osc.stop(now + 0.65);
  }

  // Pig oink
  public playPigOink() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.Q.setValueAtTime(3, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Chicken cluck
  public playChickenCluck() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    [0, 0.08].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 460 : 380, now + offset);
      osc.frequency.exponentialRampToValueAtTime(260, now + offset + 0.06);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  // Crunchy food eating bite sound
  public playEat() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.08);
    if (!noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.08);
  }

  // Critical hit sparkle chimes
  public playCrit() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.15);
    });
  }

  // Creeper fuse hiss
  public playCreeperHiss() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.4);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 1.4);
  }

  // Explosion boom
  public playExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Sub-bass thump
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Heavy noise blast
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 1.1);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.8);
    noise.stop(now + 1.2);
  }

  // Item pickup pop
  public playPop() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Level Up Fanfare
  public playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  // Crafting success click
  public playCraft() {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.setValueAtTime(560, now + 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Realistic Minecraft water splash
  public playSplash() {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.25);
    if (!noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(680, now + 0.15);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.25);
  }

  // Underwater bubble pop
  public playBubble() {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 300, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Peaceful C418-inspired generative ambient melody
  public startAmbientMusic() {
    if (this.musicInterval) return;

    const playAmbientChord = () => {
      if (this.isMuted) return;
      if (!this.initCtx()) return;
      const ctx = this.ctx;
      if (!ctx || !this.masterGain) return;
      const chords = [
        [261.63, 329.63, 392.0, 523.25], // C Major
        [220.0, 261.63, 329.63, 440.0],  // A Minor
        [174.61, 220.0, 261.63, 349.23], // F Major
        [196.0, 246.94, 293.66, 392.0],  // G Major
      ];

      const chosenChord = chords[Math.floor(Math.random() * chords.length)];
      const startTime = ctx.currentTime;

      chosenChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + i * 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, startTime + i * 0.3);
        gain.gain.linearRampToValueAtTime(0.06, startTime + i * 0.3 + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + i * 0.3 + 4.5);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(startTime + i * 0.3);
        osc.stop(startTime + i * 0.3 + 4.6);
      });
    };

    // Play initial gentle chord, then periodic ambient intervals
    setTimeout(playAmbientChord, 2000);
    this.musicInterval = window.setInterval(playAmbientChord, 45000);
  }

  // Thunder strike: sharp crack followed by low-frequency resonant rumble
  public playThunder(distanceRatio: number = 0.5) {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // A. Crack (high-impact sharp transient)
    const crackNoise = this.createNoiseBuffer(0.2);
    if (crackNoise) {
      const crackSource = ctx.createBufferSource();
      crackSource.buffer = crackNoise;
      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'highpass';
      crackFilter.frequency.setValueAtTime(600, now);
      const crackGain = ctx.createGain();
      const peakVol = Math.max(0.1, 0.45 * (1 - distanceRatio * 0.5));
      crackGain.gain.setValueAtTime(peakVol, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      crackSource.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(this.weatherGain || this.masterGain!);
      crackSource.start(now);
      crackSource.stop(now + 0.2);
    }

    // B. Low-frequency rolling rumble (sub-bass 40Hz - 90Hz)
    const rumbleNoise = this.createNoiseBuffer(2.4);
    if (rumbleNoise) {
      const rumbleSource = ctx.createBufferSource();
      rumbleSource.buffer = rumbleNoise;
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(140, now);
      rumbleFilter.frequency.exponentialRampToValueAtTime(50, now + 2.2);
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.01, now);
      rumbleGain.gain.linearRampToValueAtTime(0.4, now + 0.15);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
      rumbleSource.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.weatherGain || this.masterGain!);
      rumbleSource.start(now);
      rumbleSource.stop(now + 2.5);
    }
  }

  // Dynamic Rain Soundscape loop
  public updateRainSound(intensity: number) {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;

    if (intensity <= 0.02) {
      if (this.rainGainNode) {
        this.rainGainNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
      }
      return;
    }

    if (!this.rainNode) {
      const buffer = this.createNoiseBuffer(3.0);
      if (!buffer) return;
      this.rainNode = ctx.createBufferSource();
      this.rainNode.buffer = buffer;
      this.rainNode.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      this.rainGainNode = ctx.createGain();
      this.rainGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);

      this.rainNode.connect(filter);
      filter.connect(this.rainGainNode);
      this.rainGainNode.connect(this.weatherGain || this.masterGain!);
      try {
        this.rainNode.start();
      } catch {
        // ignore
      }
    }

    if (this.rainGainNode) {
      const targetGain = Math.min(0.35, intensity * 0.32);
      this.rainGainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.5);
    }
  }

  // Dynamic Wind Soundscape loop
  public updateWindSound(intensity: number) {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;

    if (intensity <= 0.05) {
      if (this.windGainNode) {
        this.windGainNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5);
      }
      return;
    }

    if (!this.windNode) {
      const buffer = this.createNoiseBuffer(3.0);
      if (!buffer) return;
      this.windNode = ctx.createBufferSource();
      this.windNode.buffer = buffer;
      this.windNode.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      this.windGainNode = ctx.createGain();
      this.windGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);

      this.windNode.connect(filter);
      filter.connect(this.windGainNode);
      this.windGainNode.connect(this.weatherGain || this.masterGain!);
      try {
        this.windNode.start();
      } catch {
        // ignore
      }
    }

    if (this.windGainNode) {
      const targetGain = Math.min(0.25, intensity * 0.22);
      this.windGainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.5);
    }
  }

  // Morning songbird chirp
  public playBirdChirp() {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 2600 + Math.random() * 400;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq + 600, now + 0.04);
    osc.frequency.linearRampToValueAtTime(baseFreq - 200, now + 0.09);
    osc.frequency.linearRampToValueAtTime(baseFreq + 400, now + 0.14);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.natureGain || this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Evening cricket chirp
  public playCricket() {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4500, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.natureGain || this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Falling sand/gravel impact thud
  public playBlockFall() {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.18);
    if (!noise.buffer) return;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.masterGain!);
    noise.start(now);
    noise.stop(now + 0.18);
  }

  // Arrow shoot twang & hit thud
  public playArrowShoot() {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playArrowHit() {
    if (this.isMuted || !this.initCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public stopAmbientMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sounds = new SoundEngine();
