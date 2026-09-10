/**
 * Web Audio API synthesizer for Discord-like sound effects
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Discord voice channel join chime (ascending melodic tones)
   */
  public playJoinVoice() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 440, time: 0, duration: 0.12 },
      { freq: 587.33, time: 0.11, duration: 0.14 },
      { freq: 880, time: 0.24, duration: 0.28 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.18, now + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration);
    });
  }

  /**
   * Discord voice channel leave chime (descending melodic tones)
   */
  public playLeaveVoice() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 880, time: 0, duration: 0.12 },
      { freq: 587.33, time: 0.11, duration: 0.14 },
      { freq: 440, time: 0.24, duration: 0.25 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.15, now + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration);
    });
  }

  /**
   * Mute toggle sound
   */
  public playMute(isMuted: boolean) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (isMuted) {
      // Downwards pitch
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    } else {
      // Upwards pitch
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
    }

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Discord incoming message ping
   */
  public playMessagePing() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Outgoing message click / tap
   */
  public playMessageSent() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playJoin() {
    this.playJoinVoice();
  }

  public playLeave() {
    this.playLeaveVoice();
  }

  public playMuteOff() {
    this.playMute(false);
  }

  /**
   * Role upgrade / promotion triumphal chime
   */
  public playRoleUpgrade() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.1 }, // C5
      { freq: 659.25, time: 0.09, duration: 0.1 }, // E5
      { freq: 783.99, time: 0.18, duration: 0.12 }, // G5
      { freq: 1046.5, time: 0.28, duration: 0.35 }, // C6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.18, now + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration);
    });
  }

  public play(name: string = 'upgrade') {
    if (name === 'upgrade') {
      this.playRoleUpgrade();
    } else {
      this.playMessagePing();
    }
  }
}

export const soundEffects = new SoundEffects();
