// Storage.js - Persistent state for Snake: Eclipse
const STORAGE_KEY = 'SNAKE_ECLIPSE_SAVE_V1';

const DEFAULT_DATA = {
  highScores: {
    classic: 0,
    survival: 0,
    timeattack: 0,
    endless: 0,
  },
  voidShards: 100, // starting currency
  selectedSkin: 'white',
  unlockedSkins: ['white', 'cyan'],
  selectedArenaTheme: 'void',
  settings: {
    snakeSpeed: 'normal', // 'slow', 'normal', 'fast'
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.6,
    screenShake: true,
    bloomQuality: 'high', // 'high', 'medium', 'off'
    joystickEnabled: true,
  },
  achievements: {
    firstCore: false,
    comboX3: false,
    comboX5: false,
    warpTraveler: false,
    phaseMaster: false,
    score500: false,
    score1000: false,
  },
  stats: {
    totalCoresCollected: 0,
    totalGamesPlayed: 0,
    totalDashesUsed: 0,
    totalPortalsTraveled: 0,
  }
};

export class Storage {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
      const parsed = JSON.parse(raw);
      const unlocked = parsed.unlockedSkins || ['white', 'cyan'];
      if (!unlocked.includes('white')) unlocked.unshift('white');

      return {
        ...DEFAULT_DATA,
        ...parsed,
        selectedSkin: parsed.selectedSkin === 'cyan' ? 'white' : (parsed.selectedSkin || 'white'),
        unlockedSkins: unlocked,
        highScores: { ...DEFAULT_DATA.highScores, ...(parsed.highScores || {}) },
        settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
        achievements: { ...DEFAULT_DATA.achievements, ...(parsed.achievements || {}) },
        stats: { ...DEFAULT_DATA.stats, ...(parsed.stats || {}) },
      };
    } catch (e) {
      console.warn('Storage load failed, using defaults', e);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }

  getHighScore(mode) {
    return this.data.highScores[mode] || 0;
  }

  setHighScore(mode, score) {
    if (score > (this.data.highScores[mode] || 0)) {
      this.data.highScores[mode] = score;
      this.save();
      return true; // new record!
    }
    return false;
  }

  addShards(amount) {
    this.data.voidShards = (this.data.voidShards || 0) + amount;
    this.save();
    return this.data.voidShards;
  }

  unlockSkin(skinId, cost = 0) {
    if (this.data.unlockedSkins.includes(skinId)) return true;
    if (this.data.voidShards >= cost) {
      this.data.voidShards -= cost;
      this.data.unlockedSkins.push(skinId);
      this.data.selectedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  setSkin(skinId) {
    if (this.data.unlockedSkins.includes(skinId)) {
      this.data.selectedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  unlockAchievement(id) {
    if (!this.data.achievements[id]) {
      this.data.achievements[id] = true;
      this.addShards(50);
      this.save();
      return true;
    }
    return false;
  }

  updateSetting(key, val) {
    this.data.settings[key] = val;
    this.save();
  }
}

export const storage = new Storage();
