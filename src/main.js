// main.js - Application bootstrap, animation loop, and UI event orchestration
import { CosmosScene } from './graphics/CosmosScene.js';
import { ArenaMesh } from './graphics/ArenaMesh.js';
import { SerpentMesh } from './graphics/SerpentMesh.js';
import { CoreEntities } from './graphics/CoreEntities.js';
import { ParticleSystem } from './graphics/ParticleSystem.js';

import { GameEngine, GAME_MODES } from './game/GameEngine.js';
import { InputController } from './game/InputController.js';
import { storage } from './game/Storage.js';
import { soundEngine } from './audio/SoundEngine.js';

// DOM Elements
const canvas = document.getElementById('webgl-canvas');
const menuScreen = document.getElementById('menu-screen');
const gameHud = document.getElementById('game-hud');
const pauseScreen = document.getElementById('pause-screen');
const gameoverScreen = document.getElementById('gameover-screen');

// Modals
const modalModes = document.getElementById('modal-modes');
const modalHangar = document.getElementById('modal-hangar');
const modalCredits = document.getElementById('modal-credits');
const modalSettings = document.getElementById('modal-settings');

// HUD Elements
const hudScoreVal = document.getElementById('hud-score-val');
const hudBestVal = document.getElementById('hud-best-val');
const hudModeText = document.getElementById('hud-mode-text');
const hudComboVal = document.getElementById('hud-combo-val');
const hudComboBar = document.getElementById('hud-combo-bar');
const hudCoresVal = document.getElementById('hud-cores-val');
const hudTimeContainer = document.getElementById('hud-time-container');
const hudTimeVal = document.getElementById('hud-time-val');
const hudDashStatus = document.getElementById('hud-dash-status');
const hudDashCdRing = document.getElementById('hud-dash-cd-ring');
const bannerNotice = document.getElementById('banner-notice');

// Menu Shards
const menuShardsVal = document.getElementById('menu-shards-val');
const hangarShardsVal = document.getElementById('hangar-shards-val');

// Game Over Elements
const goReasonTitle = document.getElementById('go-reason-title');
const goFinalScore = document.getElementById('go-final-score');
const goRecordHigh = document.getElementById('go-record-high');
const goCores = document.getElementById('go-cores');
const goMaxCombo = document.getElementById('go-max-combo');
const goTime = document.getElementById('go-time');
const goShardsEarned = document.getElementById('go-shards-earned');
const goRankName = document.getElementById('go-rank-name');
const goRecordBadge = document.getElementById('go-record-badge');

// 1. Initialize Graphics Engine
const cosmos = new CosmosScene(canvas);
const arena = new ArenaMesh(cosmos.scene);
const serpent = new SerpentMesh(cosmos.scene, storage.data.selectedSkin);
const entities = new CoreEntities(cosmos.scene);
const particles = new ParticleSystem(cosmos.scene);

let currentMode = GAME_MODES.CLASSIC;
let bannerTimer = null;

// Banner announcement helper
function showBanner(text, color = '#00f0ff') {
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerNotice.textContent = text;
  bannerNotice.style.borderColor = color;
  bannerNotice.style.boxShadow = `0 0 25px ${color}`;
  bannerNotice.classList.add('active');

  bannerTimer = setTimeout(() => {
    bannerNotice.classList.remove('active');
  }, 2200);
}

// 2. Initialize Game Engine with Callbacks
const engine = new GameEngine(cosmos, arena, serpent, entities, particles, {
  onScoreUpdate: ({ score, bestScore, combo, comboRatio, cores, mode, timeLeft }) => {
    hudScoreVal.textContent = score.toLocaleString();
    hudBestVal.textContent = bestScore.toLocaleString();
    hudCoresVal.textContent = cores;
    hudComboVal.textContent = `x${combo}`;
    hudComboBar.style.width = `${Math.min(100, comboRatio * 100)}%`;

    if (mode === GAME_MODES.TIME_ATTACK) {
      hudTimeContainer.classList.remove('hidden');
      hudTimeVal.textContent = `${timeLeft}s`;
    } else {
      hudTimeContainer.classList.add('hidden');
    }
  },

  onAbilityUpdate: ({ dashCooldownRatio, dashReady, isDashing }) => {
    hudDashCdRing.style.height = `${(1 - dashCooldownRatio) * 100}%`;
    if (dashReady) {
      hudDashStatus.textContent = 'ONLINE';
      hudDashStatus.className = 'ability-status ready';
    } else if (isDashing) {
      hudDashStatus.textContent = 'HYPER';
      hudDashStatus.className = 'ability-status hyper';
    } else {
      hudDashStatus.textContent = 'RECHARGING';
      hudDashStatus.className = 'ability-status charging';
    }
  },

  onBannerNotice: (text, color) => {
    showBanner(text, color);
  },

  onPauseChange: (isPaused) => {
    if (isPaused) {
      pauseScreen.classList.remove('hidden');
    } else {
      pauseScreen.classList.add('hidden');
    }
  },

  onGameOver: ({ reason, score, bestScore, coresCollected, maxCombo, timeSurvived, isNewHigh, shardsEarned }) => {
    gameHud.classList.add('hidden');
    gameoverScreen.classList.remove('hidden');

    goReasonTitle.textContent = reason;
    goFinalScore.textContent = score.toLocaleString();
    goRecordHigh.textContent = bestScore.toLocaleString();
    goCores.textContent = coresCollected;
    goMaxCombo.textContent = `x${maxCombo}`;
    goTime.textContent = `${timeSurvived}s`;
    goShardsEarned.textContent = `+${shardsEarned} 💎`;

    if (isNewHigh) {
      goRecordBadge.classList.remove('hidden');
    } else {
      goRecordBadge.classList.add('hidden');
    }

    // Determine Pilot Rank
    let rank = 'NOVICE CADET';
    if (score >= 2500) rank = 'COSMIC SOVEREIGN';
    else if (score >= 1500) rank = 'SINGULARITY MASTER';
    else if (score >= 800) rank = 'ECLIPSE VANGUARD';
    else if (score >= 300) rank = 'VOID DRIFTER';
    goRankName.textContent = rank;

    updateCurrencyDisplays();
  }
});

// 3. Initialize Input Controller
new InputController(
  (dir) => engine.queueDirection(dir),
  () => engine.triggerDash(),
  () => engine.togglePause()
);

// 4. Update UI Currency Displays
function updateCurrencyDisplays() {
  menuShardsVal.textContent = storage.data.voidShards;
  hangarShardsVal.textContent = storage.data.voidShards;
}
updateCurrencyDisplays();

// 5. Setup Menu & Modal Events

// Start Game
function launchGame(mode) {
  soundEngine.resume();
  soundEngine.playUIClick();

  menuScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  closeAllModals();

  gameHud.classList.remove('hidden');
  currentMode = mode;

  const modeLabels = {
    classic: 'CLASSIC ECLIPSE',
    survival: 'COSMIC SURVIVAL',
    timeattack: 'TIME ATTACK',
    endless: 'ENDLESS ECLIPSE',
    tutorial: 'FLIGHT ACADEMY',
  };
  hudModeText.textContent = modeLabels[mode] || 'ECLIPSE';

  engine.start(mode);
}

document.getElementById('btn-menu-play').addEventListener('click', () => {
  launchGame(currentMode);
});

// Spacebar in Menu starts game
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' && !menuScreen.classList.contains('hidden')) {
    launchGame(currentMode);
  }
});

// Game Modes Modal
document.getElementById('btn-menu-modes').addEventListener('click', () => {
  soundEngine.playUIClick();
  document.getElementById('record-classic').textContent = storage.getHighScore('classic');
  document.getElementById('record-survival').textContent = storage.getHighScore('survival');
  document.getElementById('record-timeattack').textContent = storage.getHighScore('timeattack');
  document.getElementById('record-endless').textContent = storage.getHighScore('endless');
  modalModes.classList.remove('hidden');
});

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    const selected = card.getAttribute('data-mode');
    currentMode = selected;
    launchGame(selected);
  });
});

// Hangar Modal & Skin Selector
document.getElementById('btn-menu-hangar').addEventListener('click', () => {
  soundEngine.playUIClick();
  updateHangarUI();
  modalHangar.classList.remove('hidden');
});

function updateHangarUI() {
  hangarShardsVal.textContent = storage.data.voidShards;
  document.querySelectorAll('.skin-card').forEach(card => {
    const skinId = card.getAttribute('data-skin');
    const isUnlocked = storage.data.unlockedSkins.includes(skinId);
    const isSelected = storage.data.selectedSkin === skinId;
    const btn = card.querySelector('.btn-skin-action');

    card.classList.toggle('active-skin', isSelected);

    if (isSelected) {
      btn.textContent = 'EQUIPPED';
      btn.style.background = '#00f0ff';
      btn.style.color = '#000';
    } else if (isUnlocked) {
      btn.textContent = 'EQUIP';
      btn.style.background = 'rgba(0, 240, 255, 0.2)';
      btn.style.color = '#fff';
    } else {
      const cost = btn.getAttribute('data-cost') || 100;
      btn.textContent = `UNLOCK (💎 ${cost})`;
      btn.style.background = 'rgba(255, 183, 3, 0.2)';
      btn.style.color = '#ffb703';
    }
  });
}

document.querySelectorAll('.btn-skin-action').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const skinId = btn.getAttribute('data-skin');
    const cost = parseInt(btn.getAttribute('data-cost') || '0', 10);

    if (storage.data.unlockedSkins.includes(skinId)) {
      storage.setSkin(skinId);
      serpent.setSkin(skinId);
      soundEngine.playUIClick();
      showBanner(`SKIN EQUIPPED: ${skinId.toUpperCase()}`, '#00f0ff');
    } else {
      if (storage.unlockSkin(skinId, cost)) {
        serpent.setSkin(skinId);
        soundEngine.playPickup(5, 'solar');
        showBanner(`UNLOCKED: ${skinId.toUpperCase()}`, '#ffb703');
      } else {
        soundEngine.playHazard();
        showBanner('INSUFFICIENT VOID SHARDS!', '#ff1e42');
      }
    }
    updateHangarUI();
    updateCurrencyDisplays();
  });
});

// Tutorial / Academy
document.getElementById('btn-menu-tutorial').addEventListener('click', () => {
  launchGame(GAME_MODES.TUTORIAL);
});

// Settings Modal
document.getElementById('btn-menu-settings').addEventListener('click', () => {
  soundEngine.playUIClick();
  modalSettings.classList.remove('hidden');
});

const sliderMaster = document.getElementById('slider-master');
const sliderSfx = document.getElementById('slider-sfx');
const sliderMusic = document.getElementById('slider-music');

sliderMaster.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  soundEngine.setVolumes({ master: val });
  storage.updateSetting('masterVolume', val);
});

sliderSfx.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  soundEngine.setVolumes({ sfx: val });
  storage.updateSetting('sfxVolume', val);
});

sliderMusic.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  soundEngine.setVolumes({ music: val });
  storage.updateSetting('musicVolume', val);
});

// Credits & Manual Modal
document.getElementById('btn-menu-credits').addEventListener('click', () => {
  soundEngine.playUIClick();
  modalCredits.classList.remove('hidden');
});

// Modal Close Handlers
function closeAllModals() {
  [modalModes, modalHangar, modalCredits, modalSettings].forEach(m => {
    if (m) m.classList.add('hidden');
  });
}
document.getElementById('btn-close-modes').addEventListener('click', closeAllModals);
document.getElementById('btn-close-hangar').addEventListener('click', closeAllModals);
document.getElementById('btn-close-credits').addEventListener('click', closeAllModals);
document.getElementById('btn-close-settings').addEventListener('click', closeAllModals);

// Close modals when clicking backdrop
[modalModes, modalHangar, modalCredits, modalSettings].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  }
});

// Close modals on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
});

// Ensure all modals are closed on startup
closeAllModals();

// HUD Audio Toggle
const btnHudAudio = document.getElementById('btn-hud-audio');
btnHudAudio.addEventListener('click', () => {
  const isMuted = soundEngine.toggleMute();
  btnHudAudio.textContent = isMuted ? '🔇' : '🔊';
});

// HUD Navigation: Return to Menu
const btnHudBack = document.getElementById('btn-hud-back');
if (btnHudBack) {
  btnHudBack.addEventListener('click', () => {
    engine.abortToMenu();
    pauseScreen.classList.add('hidden');
    gameHud.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    soundEngine.playUIClick();
    showBanner('RETURNED TO HANGAR', '#00f0ff');
  });
}

// HUD Speed Control & Toggle
const btnHudSpeed = document.getElementById('btn-hud-speed');
const hudSpeedText = document.getElementById('hud-speed-text');
const selectSpeed = document.getElementById('select-speed');

function updateSpeedUI(spd) {
  const labels = {
    slow: 'SPEED: SLOW',
    normal: 'SPEED: NORM',
    fast: 'SPEED: FAST',
  };
  if (hudSpeedText) hudSpeedText.textContent = labels[spd] || 'SPEED: NORM';
  if (selectSpeed) selectSpeed.value = spd;
}

if (btnHudSpeed) {
  btnHudSpeed.addEventListener('click', () => {
    const nextSpd = engine.cycleSpeed();
    updateSpeedUI(nextSpd);
    soundEngine.playUIClick();
  });
}

if (selectSpeed) {
  selectSpeed.value = engine.speedSetting;
  selectSpeed.addEventListener('change', (e) => {
    engine.setSpeed(e.target.value);
    updateSpeedUI(e.target.value);
  });
}

// Initial speed text
updateSpeedUI(engine.speedSetting);

// Keyboard Speed Shortcuts: 1 (Slow), 2 (Normal), 3 (Fast), or [ / ]
window.addEventListener('keydown', (e) => {
  if (engine.state === 'running') {
    if (e.key === '1' || e.key === '[') {
      engine.setSpeed('slow');
      updateSpeedUI('slow');
    } else if (e.key === '2') {
      engine.setSpeed('normal');
      updateSpeedUI('normal');
    } else if (e.key === '3' || e.key === ']') {
      engine.setSpeed('fast');
      updateSpeedUI('fast');
    }
  }
});

// HUD Pause Button
document.getElementById('btn-hud-pause').addEventListener('click', () => {
  engine.togglePause();
});

// Pause Screen Actions
document.getElementById('btn-pause-resume').addEventListener('click', () => {
  engine.togglePause();
});
document.getElementById('btn-pause-restart').addEventListener('click', () => {
  launchGame(currentMode);
});
document.getElementById('btn-pause-menu').addEventListener('click', () => {
  pauseScreen.classList.add('hidden');
  gameHud.classList.add('hidden');
  menuScreen.classList.remove('hidden');
  cosmos.setCameraMode('menu');
  soundEngine.stopBGM();
});

// Game Over Actions
document.getElementById('btn-go-retry').addEventListener('click', () => {
  launchGame(currentMode);
});
document.getElementById('btn-go-menu').addEventListener('click', () => {
  gameoverScreen.classList.add('hidden');
  menuScreen.classList.remove('hidden');
  cosmos.setCameraMode('menu');
  soundEngine.stopBGM();
});

// Mobile Dash Touch Button & HUD Dash Card
document.getElementById('btn-mobile-dash').addEventListener('click', () => {
  engine.triggerDash();
});
document.getElementById('btn-hud-dash').addEventListener('click', () => {
  engine.triggerDash();
});

// 6. Main Animation & Render Loop
let lastTime = performance.now();
let menuSerpentAngle = 0;

function animate(now) {
  requestAnimationFrame(animate);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Scene entities update
  arena.update(delta);
  entities.update(delta);
  particles.update(delta);

  // In Menu: Automated Ambient Serpent Slither around Black Hole
  if (menuScreen.classList.contains('hidden') === false) {
    menuSerpentAngle += delta * 0.8;
    const path = [];
    const radius = 12;
    for (let i = 0; i < 9; i++) {
      const a = menuSerpentAngle - i * 0.22;
      path.push({
        x: Math.cos(a) * radius,
        y: 0.6 + Math.sin(a * 2) * 0.5,
        z: Math.sin(a) * radius,
      });
    }
    serpent.update(path, false, delta);
    cosmos.update(delta, path[0]);
  } else {
    // In Game: Run engine logic and pass head position to camera
    engine.update(delta);
    const headWorld = engine.body[0] ? engine.gridToWorld(engine.body[0]) : null;
    cosmos.update(delta, headWorld);
  }
}

requestAnimationFrame(animate);
