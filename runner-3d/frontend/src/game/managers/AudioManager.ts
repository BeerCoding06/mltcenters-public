/** Lightweight procedural SFX — no asset files */
class AudioManager {
  private ctx: AudioContext | null = null;

  private ensure() {
    if (!this.ctx && typeof window !== "undefined") {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  unlock() {
    const c = this.ensure();
    if (!c) return;
    if (c.state === "suspended") void c.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
    const c = this.ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  playSuccess() {
    this.tone(523, 0.08, "sine", 0.1);
    window.setTimeout(() => this.tone(784, 0.12, "sine", 0.09), 60);
  }

  playHit() {
    this.tone(120, 0.2, "square", 0.06);
    window.setTimeout(() => this.tone(80, 0.15, "sawtooth", 0.05), 40);
  }

  playJump() {
    this.tone(300, 0.06, "triangle", 0.05);
  }

  playLand() {
    this.tone(180, 0.1, "triangle", 0.04);
  }
}

export const audioManager = new AudioManager();
