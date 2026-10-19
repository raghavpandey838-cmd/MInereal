/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockType } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Generate white noise buffer
  private createNoiseBuffer(duration: number): AudioBuffer {
    this.initCtx();
    const bufferSize = this.ctx!.sampleRate * duration;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Play walking footstep sound based on block walked on
  public playStep(block: BlockType) {
    if (this.isMuted) return;
    this.initCtx();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.12);

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

  // Peaceful C418-inspired generative ambient melody
  public startAmbientMusic() {
    if (this.musicInterval) return;

    const playAmbientChord = () => {
      if (this.isMuted) return;
      this.initCtx();
      const ctx = this.ctx!;
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

  public stopAmbientMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sounds = new SoundEngine();
