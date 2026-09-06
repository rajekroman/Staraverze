import { MUSIC_TRACKS, SFX } from "./data.js";

export class AudioManager {
  constructor() {
    this.enabled = true;
    this.musicVolume = .34;
    this.sfxVolume = .62;
    this.current = null;
    this.currentKey = "";
    this.unlocked = false;
    this.sfx = new Map();
    for (const [key, src] of Object.entries(SFX)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = this.sfxVolume;
      this.sfx.set(key, audio);
    }
  }

  async unlock() {
    if (this.unlocked) return;
    const silent = this.sfx.get("menu");
    if (silent) {
      silent.volume = 0;
      try {
        await silent.play();
        silent.pause();
        silent.currentTime = 0;
      } catch {}
      silent.volume = this.sfxVolume;
    }
    this.unlocked = true;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (!this.enabled && this.current) this.current.pause();
    if (this.enabled && this.current && this.currentKey) {
      this.current.play().catch(() => {});
    }
  }

  setMusicVolume(value) {
    this.musicVolume = Math.max(0, Math.min(1, value));
    if (this.current) this.current.volume = this.musicVolume;
  }

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, value));
    for (const sound of this.sfx.values()) sound.volume = this.sfxVolume;
  }

  async playMusic(key) {
    if (!MUSIC_TRACKS[key]) return;
    await this.unlock();
    if (this.currentKey === key && this.current) {
      if (this.enabled && this.current.paused) this.current.play().catch(() => {});
      return;
    }
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
    }
    const audio = new Audio(MUSIC_TRACKS[key]);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = this.musicVolume;
    this.current = audio;
    this.currentKey = key;
    if (this.enabled) audio.play().catch(() => {});
  }

  stopMusic() {
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
    }
    this.current = null;
    this.currentKey = "";
  }

  play(key, volume = 1, rate = 1) {
    if (!this.enabled) return;
    const base = this.sfx.get(key);
    if (!base) return;
    const sound = base.cloneNode();
    sound.volume = Math.max(0, Math.min(1, this.sfxVolume * volume));
    sound.playbackRate = rate;
    sound.play().catch(() => {});
  }
}
