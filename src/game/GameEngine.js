// GameEngine.js - Core gameplay loop, movement, collisions, abilities, and game modes.
import { storage } from './Storage.js';
import { soundEngine } from '../audio/SoundEngine.js';

export const GAME_MODES = {
  CLASSIC: 'classic',
  SURVIVAL: 'survival',
  TIME_ATTACK: 'timeattack',
  ENDLESS: 'endless',
  TUTORIAL: 'tutorial',
};

export class GameEngine {
  constructor(cosmosScene, arenaMesh, serpentMesh, coreEntities, particleSystem, callbacks) {
    this.cosmos = cosmosScene;
    this.arena = arenaMesh;
    this.serpent = serpentMesh;
    this.entities = coreEntities;
    this.particles = particleSystem;
    this.cb = callbacks || {};

    // Grid Configuration
    this.gridSize = 20; // -10 to +9
    this.tileSize = 1.6;
    this.bounds = 10;

    // State
    this.mode = GAME_MODES.CLASSIC;
    this.state = 'idle'; // 'idle', 'countdown', 'running', 'paused', 'gameover'
    
    // Snake State
    this.body = []; // Array of {x, z} in grid units
    this.direction = { x: 0, z: -1 };
    this.nextDirection = { x: 0, z: -1 };
    this.turnQueue = [];

    // Movement & Speed Configurations
    this.speedRates = {
      slow: 0.18,   // Relaxed & forgiving
      normal: 0.12, // Balanced
      fast: 0.08,   // Turbo adrenaline
    };
    this.speedSetting = storage.data.settings.snakeSpeed || 'normal';
    this.baseTickInterval = this.speedRates[this.speedSetting] || 0.12;
    this.tickTimer = 0;
    this.stepProgress = 0;

    // Abilities & Powers
    this.dashCooldown = 3.5;
    this.dashTimer = 0;
    this.isDashing = false;
    this.dashDuration = 0.45;
    this.dashActiveTimer = 0;

    this.frenzyTimer = 0;
    this.chronoTimer = 0;

    // Portals
    this.portals = [];
    this.portalCooldown = 0;

    // Scoring & Multiplier
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.comboDuration = 4.5;
    this.coresCollected = 0;
    this.gameTime = 0;
    this.modeTimeLeft = 90; // For time attack

    // Hazards & Boss
    this.hazards = [];
    this.hazardSpawnTimer = 0;
    this.bossMilestone = 500;
    this.bossWarningTimer = 0;

    // Gravity Shift
    this.gravityShiftTimer = 0;

    // Tutorial phase
    this.tutorialStep = 0;
  }

  start(mode = GAME_MODES.CLASSIC) {
    this.mode = mode;
    this.state = 'running';
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.coresCollected = 0;
    this.gameTime = 0;
    this.modeTimeLeft = 90;
    this.dashTimer = 0;
    this.isDashing = false;
    this.frenzyTimer = 0;
    this.chronoTimer = 0;
    this.bossMilestone = 500;

    // Initialize Snake Body
    this.body = [
      { x: 0, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: 2 },
      { x: 0, z: 3 },
    ];
    this.direction = { x: 0, z: -1 };
    this.nextDirection = { x: 0, z: -1 };
    this.turnQueue = [];

    // Clear graphics
    this.entities.clearHazards();
    this.entities.clearPortals();

    // Setup Portals for non-tutorial modes
    if (this.mode !== GAME_MODES.TUTORIAL) {
      this.setupPortals();
    }

    // Spawn First Core
    this.spawnCore('quantum');

    // Setup Camera
    this.cosmos.setCameraMode('gameplay');

    soundEngine.startBGM();

    if (this.cb.onBannerNotice) {
      const modeTitles = {
        classic: 'CLASSIC ECLIPSE — ENGAGED',
        survival: 'COSMIC SURVIVAL — AVOID SINGULARITIES',
        timeattack: 'TIME ATTACK — 90 SECONDS REMAINING',
        endless: 'ENDLESS ECLIPSE — ZEN VOID ACTIVATED',
        tutorial: 'COSMIC FLIGHT ACADEMY',
      };
      this.cb.onBannerNotice(modeTitles[this.mode] || 'ENGAGE', '#00f0ff');
    }

    this.notifyHUD();
  }

  setupPortals() {
    const portalA = { x: -8 * this.tileSize, z: 0 };
    const portalB = { x: 8 * this.tileSize, z: 0 };
    this.portals = [
      { gridX: -8, gridZ: 0, targetX: 7, targetZ: 0, dir: { x: -1, z: 0 } },
      { gridX: 8, gridZ: 0, targetX: -7, targetZ: 0, dir: { x: 1, z: 0 } },
    ];
    this.entities.createPortals(portalA, portalB);
  }

  queueDirection(dir) {
    if (this.state !== 'running') return;

    // Prevent direct 180-degree reversal
    const lastDir = this.turnQueue.length > 0 ? this.turnQueue[this.turnQueue.length - 1] : this.direction;
    if (dir.x !== -lastDir.x || dir.z !== -lastDir.z) {
      if (dir.x !== lastDir.x || dir.z !== lastDir.z) {
        if (this.turnQueue.length < 2) {
          this.turnQueue.push(dir);
        }
      }
    }
  }

  triggerDash() {
    if (this.state !== 'running' || this.dashTimer > 0 || this.isDashing) return;

    this.isDashing = true;
    this.dashTimer = this.dashCooldown;
    this.dashActiveTimer = this.dashDuration;

    this.cosmos.setDashFov(true);
    this.cosmos.addScreenShake(0.5);
    soundEngine.playDash();

    // Dash particle burst at head
    const headWorld = this.gridToWorld(this.body[0]);
    this.particles.emitBurst(headWorld, 0x00f0ff, 25, 6.0);

    storage.data.stats.totalDashesUsed = (storage.data.stats.totalDashesUsed || 0) + 1;
    storage.unlockAchievement('phaseMaster');

    if (this.cb.onBannerNotice) {
      this.cb.onBannerNotice('PHASE DASH ACTIVE!', '#00f0ff');
    }
  }

  togglePause() {
    if (this.state === 'running') {
      this.state = 'paused';
      if (this.cb.onPauseChange) this.cb.onPauseChange(true);
    } else if (this.state === 'paused') {
      this.state = 'running';
      if (this.cb.onPauseChange) this.cb.onPauseChange(false);
    }
  }

  setSpeed(speedKey) {
    if (this.speedRates[speedKey]) {
      this.speedSetting = speedKey;
      this.baseTickInterval = this.speedRates[speedKey];
      storage.updateSetting('snakeSpeed', speedKey);
      if (this.cb.onBannerNotice) {
        const labels = {
          slow: 'SPEED: SLOW (RELAXED)',
          normal: 'SPEED: NORMAL (BALANCED)',
          fast: 'SPEED: FAST (TURBO)',
        };
        this.cb.onBannerNotice(labels[speedKey] || 'SPEED UPDATED', '#00f0ff');
      }
      return this.speedSetting;
    }
    return this.speedSetting;
  }

  cycleSpeed() {
    const order = ['slow', 'normal', 'fast'];
    const nextIdx = (order.indexOf(this.speedSetting) + 1) % order.length;
    return this.setSpeed(order[nextIdx]);
  }

  abortToMenu() {
    this.state = 'idle';
    this.cosmos.setCameraMode('menu');
    soundEngine.stopBGM();
    this.entities.clearHazards();
    this.entities.clearPortals();
    this.entities.removeCore();
  }

  spawnCore(forcedType = null) {
    let type = forcedType;
    if (!type) {
      const rand = Math.random();
      if (rand < 0.15) {
        type = 'solar'; // 15% solar flare
      } else if (rand < 0.25) {
        type = 'darkmatter'; // 10% dark matter
      } else if (rand < 0.35) {
        type = 'chrono'; // 10% chrono
      } else {
        type = 'quantum'; // 65% standard
      }
    }

    // Pick random empty grid cell
    let attempts = 0;
    let gx, gz;
    const padding = 2;
    do {
      gx = Math.floor(Math.random() * (this.bounds * 2 - padding * 2)) - (this.bounds - padding);
      gz = Math.floor(Math.random() * (this.bounds * 2 - padding * 2)) - (this.bounds - padding);
      attempts++;
    } while (this.isOccupied(gx, gz) && attempts < 100);

    this.activeCore = { type, x: gx, z: gz };
    const worldPos = this.gridToWorld({ x: gx, z: gz });
    this.entities.createCore(type, worldPos);
  }

  isOccupied(gx, gz) {
    // Check snake body
    for (const seg of this.body) {
      if (seg.x === gx && seg.z === gz) return true;
    }
    // Check hazards
    for (const h of this.hazards) {
      if (h.x === gx && h.z === gz) return true;
    }
    return false;
  }

  gridToWorld(coord) {
    return {
      x: coord.x * this.tileSize,
      z: coord.z * this.tileSize,
      y: 0.6,
    };
  }

  update(delta) {
    if (this.state !== 'running') return;

    this.gameTime += delta;

    // 1. Time Attack Countdown
    if (this.mode === GAME_MODES.TIME_ATTACK) {
      this.modeTimeLeft -= delta;
      if (this.modeTimeLeft <= 0) {
        this.modeTimeLeft = 0;
        this.triggerGameOver('TIME HORIZON REACHED');
        return;
      }
    }

    // 2. Dash & Ability Timers
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - delta);
    }
    if (this.isDashing) {
      this.dashActiveTimer -= delta;
      const headWorld = this.gridToWorld(this.body[0]);
      this.particles.emitDashTrail(headWorld, 0x00f0ff, 4);

      if (this.dashActiveTimer <= 0) {
        this.isDashing = false;
        this.cosmos.setDashFov(false);
      }
    }

    if (this.frenzyTimer > 0) {
      this.frenzyTimer = Math.max(0, this.frenzyTimer - delta);
    }
    if (this.chronoTimer > 0) {
      this.chronoTimer = Math.max(0, this.chronoTimer - delta);
    }

    // 3. Combo Decay
    if (this.combo > 1) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // 4. Portal Cooldown
    if (this.portalCooldown > 0) {
      this.portalCooldown -= delta;
    }

    // 5. Survival Mode Hazards & Gravity Shift
    if (this.mode === GAME_MODES.SURVIVAL) {
      this.updateSurvivalMechanics(delta);
    }

    // 6. Movement Step Ticking
    let currentInterval = this.baseTickInterval;
    // Speed modifiers
    if (this.isDashing) currentInterval *= 0.45; // ultra fast
    else if (this.frenzyTimer > 0) currentInterval *= 0.7; // frenzy speed
    else if (this.chronoTimer > 0) currentInterval *= 1.45; // bullet-time slow

    // Progressive speed scaling based on score
    const speedBoost = Math.min(0.045, (this.score / 2000) * 0.045);
    currentInterval = Math.max(0.07, currentInterval - speedBoost);

    this.tickTimer += delta;
    this.stepProgress = Math.min(1.0, this.tickTimer / currentInterval);

    if (this.tickTimer >= currentInterval) {
      this.tickTimer -= currentInterval;
      this.step();
    }

    // 7. Interpolate Body for 60fps Smooth Rendering
    this.updateRenderMesh();
    this.notifyHUD();
  }

  step() {
    // Consume queued turn
    if (this.turnQueue.length > 0) {
      this.direction = this.turnQueue.shift();
    }

    // Calculate new head position
    const currentHead = this.body[0];
    let newHead = {
      x: currentHead.x + this.direction.x,
      z: currentHead.z + this.direction.z,
    };

    // Endless Mode / Wall Wrap
    if (this.mode === GAME_MODES.ENDLESS) {
      if (newHead.x >= this.bounds) newHead.x = -this.bounds;
      else if (newHead.x < -this.bounds) newHead.x = this.bounds - 1;
      if (newHead.z >= this.bounds) newHead.z = -this.bounds;
      else if (newHead.z < -this.bounds) newHead.z = this.bounds - 1;
    } else {
      // Wall Collision (if not dashing)
      if (
        newHead.x >= this.bounds ||
        newHead.x < -this.bounds ||
        newHead.z >= this.bounds ||
        newHead.z < -this.bounds
      ) {
        if (!this.isDashing) {
          this.triggerGameOver('SINGULARITY PERIMETER BREACH');
          return;
        } else {
          // Dash bounce back into arena
          newHead.x = Math.max(-this.bounds + 1, Math.min(this.bounds - 2, newHead.x));
          newHead.z = Math.max(-this.bounds + 1, Math.min(this.bounds - 2, newHead.z));
        }
      }
    }

    // Portal Traversal
    if (this.portalCooldown <= 0 && this.portals.length > 0) {
      for (const p of this.portals) {
        if (newHead.x === p.gridX && newHead.z === p.gridZ) {
          newHead.x = p.targetX;
          newHead.z = p.targetZ;
          this.portalCooldown = 1.0;
          soundEngine.playPortal();
          this.particles.emitBurst(this.gridToWorld(newHead), 0x00f0ff, 30, 5.0);
          storage.data.stats.totalPortalsTraveled = (storage.data.stats.totalPortalsTraveled || 0) + 1;
          storage.unlockAchievement('warpTraveler');
          if (this.cb.onBannerNotice) {
            this.cb.onBannerNotice('QUANTUM GATE WARP!', '#9d00ff');
          }
          break;
        }
      }
    }

    // Self-Tail Collision
    if (!this.isDashing && this.mode !== GAME_MODES.ENDLESS) {
      for (let i = 0; i < this.body.length - 1; i++) {
        const seg = this.body[i];
        if (seg.x === newHead.x && seg.z === newHead.z) {
          this.triggerGameOver('TEMPORAL TAIL COLLAPSE');
          return;
        }
      }
    }

    // Hazard Collisions
    if (!this.isDashing) {
      for (const h of this.hazards) {
        if (h.x === newHead.x && h.z === newHead.z) {
          this.triggerGameOver('COSMIC SINGULARITY IMPACT');
          return;
        }
      }
    }

    // Near-Miss Detection (Close Call bonus)
    this.checkNearMiss(newHead);

    // Advance Body
    this.body.unshift(newHead);

    // Core Collection Check
    if (this.activeCore && newHead.x === this.activeCore.x && newHead.z === this.activeCore.z) {
      this.collectCore(this.activeCore);
    } else {
      // Normal step: pop tail
      this.body.pop();
    }
  }

  collectCore(core) {
    this.coresCollected++;
    storage.data.stats.totalCoresCollected = (storage.data.stats.totalCoresCollected || 0) + 1;
    storage.unlockAchievement('firstCore');

    // Combo escalation
    this.combo = Math.min(5, this.combo + 1);
    this.comboTimer = this.comboDuration;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    if (this.combo >= 3) storage.unlockAchievement('comboX3');
    if (this.combo >= 5) storage.unlockAchievement('comboX5');

    // Visual & Sound Feedback
    const headWorld = this.gridToWorld(this.body[0]);
    this.serpent.triggerFeedPulse();
    this.cosmos.addScreenShake(0.2);

    let basePoints = 100;
    let burstColor = 0x00f0ff;

    switch (core.type) {
      case 'solar':
        basePoints = 300;
        burstColor = 0xffb703;
        this.frenzyTimer = 6.0;
        if (this.cb.onBannerNotice) this.cb.onBannerNotice('SOLAR FRENZY — 2X POINTS!', '#ffb703');
        break;

      case 'darkmatter':
        basePoints = 200;
        burstColor = 0x9d00ff;
        // Compress snake (trim 2 segments)
        if (this.body.length > 4) {
          this.body.pop();
          if (this.body.length > 4) this.body.pop();
        }
        if (this.cb.onBannerNotice) this.cb.onBannerNotice('DARK MATTER — BODY COMPRESSED!', '#9d00ff');
        break;

      case 'chrono':
        basePoints = 150;
        burstColor = 0x00ff88;
        this.chronoTimer = 6.5;
        if (this.cb.onBannerNotice) this.cb.onBannerNotice('CHRONO CORE — TIME DILATED!', '#00ff88');
        break;

      case 'quantum':
      default:
        basePoints = 100;
        burstColor = 0x00f0ff;
        break;
    }

    const pointsEarned = basePoints * this.combo * (this.frenzyTimer > 0 ? 2 : 1);
    this.score += pointsEarned;

    // Check boss encounter trigger
    if (this.score >= this.bossMilestone) {
      this.triggerBossEncounter();
      this.bossMilestone += 500;
    }

    soundEngine.playPickup(this.combo, core.type);
    this.particles.emitBurst(headWorld, burstColor, 35, 5.0);

    // Spawn next core
    this.spawnCore();
  }

  checkNearMiss(head) {
    // Near miss with self tail
    if (this.body.length > 5) {
      for (let i = 4; i < this.body.length; i++) {
        const seg = this.body[i];
        const dist = Math.abs(seg.x - head.x) + Math.abs(seg.z - head.z);
        if (dist === 1) {
          soundEngine.playNearMiss();
          this.score += 25;
          return;
        }
      }
    }
  }

  updateSurvivalMechanics(delta) {
    // Spawn shifting hazards
    this.hazardSpawnTimer += delta;
    if (this.hazardSpawnTimer > 12.0 && this.hazards.length < 6) {
      this.hazardSpawnTimer = 0;
      const hx = Math.floor(Math.random() * 16) - 8;
      const hz = Math.floor(Math.random() * 16) - 8;
      if (!this.isOccupied(hx, hz)) {
        this.hazards.push({ x: hx, z: hz });
        this.entities.createHazard(this.gridToWorld({ x: hx, z: hz }));
        soundEngine.playHazard();
        if (this.cb.onBannerNotice) {
          this.cb.onBannerNotice('COSMIC SINGULARITY DETECTED!', '#ff1e42');
        }
      }
    }

    // Periodic Gravity Shift
    this.gravityShiftTimer += delta;
    if (this.gravityShiftTimer > 25.0) {
      this.gravityShiftTimer = 0;
      const tiltX = (Math.random() - 0.5) * 0.12;
      const tiltZ = (Math.random() - 0.5) * 0.12;
      this.arena.setTilt(tiltX, tiltZ);
      this.cosmos.addScreenShake(0.6);
      if (this.cb.onBannerNotice) {
        this.cb.onBannerNotice('GRAVITY SHIFT OCCURRED', '#ff007f');
      }
    }
  }

  triggerBossEncounter() {
    soundEngine.playHazard();
    this.cosmos.addScreenShake(0.8);
    const target = this.gridToWorld(this.body[0]);
    this.entities.triggerBossBeam(target.x, target.z, 2.5);
    if (this.cb.onBannerNotice) {
      this.cb.onBannerNotice('VOID TITAN BEAM CONVERGING!', '#ff0055');
    }
  }

  updateRenderMesh() {
    const interpolated = [];
    for (let i = 0; i < this.body.length; i++) {
      const cur = this.gridToWorld(this.body[i]);
      interpolated.push(cur);
    }
    this.serpent.update(interpolated, this.isDashing);
  }

  notifyHUD() {
    if (this.cb.onScoreUpdate) {
      this.cb.onScoreUpdate({
        score: this.score,
        bestScore: storage.getHighScore(this.mode),
        combo: this.combo,
        comboRatio: this.combo > 1 ? this.comboTimer / this.comboDuration : 0,
        cores: this.coresCollected,
        mode: this.mode,
        timeLeft: Math.ceil(this.modeTimeLeft),
      });
    }

    if (this.cb.onAbilityUpdate) {
      this.cb.onAbilityUpdate({
        dashCooldownRatio: this.dashTimer > 0 ? (this.dashCooldown - this.dashTimer) / this.dashCooldown : 1.0,
        dashReady: this.dashTimer <= 0,
        isDashing: this.isDashing,
        frenzyActive: this.frenzyTimer > 0,
        chronoActive: this.chronoTimer > 0,
      });
    }
  }

  triggerGameOver(reason = 'VOID ENTROPY CONSUMPTION') {
    this.state = 'gameover';
    this.cosmos.setCameraMode('gameover');
    this.cosmos.addScreenShake(1.2);
    soundEngine.playGameOver();
    soundEngine.stopBGM();

    const headWorld = this.gridToWorld(this.body[0]);
    this.particles.emitBurst(headWorld, 0xff0055, 60, 8.0);

    const isNewHigh = storage.setHighScore(this.mode, this.score);
    const shardsEarned = Math.max(10, Math.floor(this.score / 15));
    storage.addShards(shardsEarned);

    storage.data.stats.totalGamesPlayed = (storage.data.stats.totalGamesPlayed || 0) + 1;
    if (this.score >= 500) storage.unlockAchievement('score500');
    if (this.score >= 1000) storage.unlockAchievement('score1000');
    storage.save();

    if (this.cb.onGameOver) {
      this.cb.onGameOver({
        reason,
        score: this.score,
        bestScore: storage.getHighScore(this.mode),
        coresCollected: this.coresCollected,
        maxCombo: this.maxCombo,
        timeSurvived: Math.floor(this.gameTime),
        isNewHigh,
        shardsEarned,
      });
    }
  }
}
