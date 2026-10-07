/**
 * Critter Rainbow Brick Breaker! (100% Zero-Text Visual Edition)
 * Features all 8 Smiling Critters, bouncy Rainbow Cloud Trampoline Paddle,
 * Trapped Critter Bubble Cages, 3 Giant Star Bricks per stage,
 * Falling Power-Up Capsules (Multi-Ball, Fireball Comet, Wide Cloud, Star Lasers),
 * Pinball Bell Bumpers, and a Rainbow Safety Net!
 */

const CRITTERS = [
  {
    id: 'dogday',
    icon: 'icons/dogday.jpg',
    badge: '☀️',
    brickEmoji: '🦴',
    themeTop: '#1a3c6e',
    themeMid: '#29629c',
    themeBot: '#142d52',
    accent: '#ffb300',
    glow: '#ffe082',
    cagesCount: 3,
    hasBumpers: false,
    movingBricks: false
  },
  {
    id: 'catnap',
    icon: 'icons/catnap.jpg',
    badge: '🌙',
    brickEmoji: '🔮',
    themeTop: '#1f1138',
    themeMid: '#371f63',
    themeBot: '#160b29',
    accent: '#b388ff',
    glow: '#e1bee7',
    cagesCount: 3,
    hasBumpers: false,
    movingBricks: false
  },
  {
    id: 'craftycorn',
    icon: 'icons/craftycorn.jpg',
    badge: '🎨',
    brickEmoji: '🌈',
    themeTop: '#103b54',
    themeMid: '#1f648a',
    themeBot: '#0d2c40',
    accent: '#4dd0e1',
    glow: '#b2ebf2',
    cagesCount: 4,
    hasBumpers: false,
    movingBricks: false
  },
  {
    id: 'hoppy',
    icon: 'icons/hoppy.jpg',
    badge: '⚡',
    brickEmoji: '🥕',
    themeTop: '#133d28',
    themeMid: '#236946',
    themeBot: '#0d2b1c',
    accent: '#69f0ae',
    glow: '#b9f6ca',
    cagesCount: 4,
    hasBumpers: true,
    movingBricks: false
  },
  {
    id: 'pickypiggy',
    icon: 'icons/picky.jpg',
    badge: '🍎',
    brickEmoji: '🍓',
    themeTop: '#4a1530',
    themeMid: '#78244d',
    themeBot: '#330d20',
    accent: '#ff80ab',
    glow: '#f8bbd0',
    cagesCount: 5,
    hasBumpers: true,
    movingBricks: false
  },
  {
    id: 'bubba',
    icon: 'icons/bubba.jpg',
    badge: '❄️',
    brickEmoji: '💎',
    themeTop: '#0f2f4a',
    themeMid: '#1b5380',
    themeBot: '#091f33',
    accent: '#40c4ff',
    glow: '#b3e5fc',
    cagesCount: 5,
    hasBumpers: true,
    movingBricks: true
  },
  {
    id: 'bobby',
    icon: 'icons/bobby.jpg',
    badge: '💖',
    brickEmoji: '🍒',
    themeTop: '#4d1424',
    themeMid: '#82223d',
    themeBot: '#360b17',
    accent: '#ff5252',
    glow: '#ffcdd2',
    cagesCount: 6,
    hasBumpers: true,
    movingBricks: true
  },
  {
    id: 'kickinchicken',
    icon: 'icons/kickin.jpg',
    badge: '🔥',
    brickEmoji: '🌟',
    themeTop: '#45240c',
    themeMid: '#784016',
    themeBot: '#2e1606',
    accent: '#ffd740',
    glow: '#ffecb3',
    cagesCount: 6,
    hasBumpers: true,
    movingBricks: true
  }
];

const BRICK_PALETTE = [
  { fill: '#ff6b8b', border: '#ffccd5', shine: '#fff0f3' },
  { fill: '#ffb74d', border: '#ffe0b2', shine: '#fff8e1' },
  { fill: '#ffd54f', border: '#fff9c4', shine: '#ffffff' },
  { fill: '#66bb6a', border: '#c8e6c9', shine: '#e8f5e9' },
  { fill: '#4fc3f7', border: '#b3e5fc', shine: '#e1f5fe' },
  { fill: '#ba68c8', border: '#e1bee7', shine: '#f3e5f5' }
];

const CANVAS_W = 820;
const CANVAS_H = 540;
const PADDLE_Y = 484;
const PADDLE_BASE_W = 152;
const PADDLE_WIDE_W = 236;
const PADDLE_H = 26;
const BALL_R = 11;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let soundEnabled = true;
let audioCtx = null;

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.14, gainVal = 0.14, slideTo = null) {
  const actx = ensureAudio();
  if (!actx) return;
  try {
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, actx.currentTime + duration);
    }
    gain.gain.setValueAtTime(gainVal, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + duration);
  } catch (_) {}
}

function playBounceSfx(pitchBoost = 0) {
  playTone(360 + pitchBoost * 45, 'sine', 0.12, 0.14, 520 + pitchBoost * 50);
}

function playBrickPopSfx(combo = 1) {
  const base = Math.min(880, 440 + combo * 38);
  playTone(base, 'triangle', 0.13, 0.15, base * 1.35);
}

function playRescueSfx() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
    setTimeout(() => playTone(f, 'triangle', 0.18, 0.16, f * 1.06), idx * 65);
  });
}

function playStarSfx() {
  [587.33, 880, 1174.66].forEach((f, idx) => {
    setTimeout(() => playTone(f, 'sine', 0.18, 0.16, f * 1.12), idx * 55);
  });
}

function playPowerupSfx() {
  [440, 554.37, 659.25, 880].forEach((f, idx) => {
    setTimeout(() => playTone(f, 'sine', 0.14, 0.14), idx * 45);
  });
}

function playWinFanfare() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, idx) => {
    setTimeout(() => playTone(f, 'triangle', 0.24, 0.18, f * 1.05), idx * 90);
  });
}

// Preload Critter portrait images
const critterImages = {};
CRITTERS.forEach((c) => {
  const img = new Image();
  img.src = c.icon;
  critterImages[c.id] = img;
});

// Game State
let currentLevel = 0;
let levelStars = new Array(CRITTERS.length).fill(0);
try {
  const saved = JSON.parse(localStorage.getItem('critters_breaker_stars_v1') || 'null');
  if (Array.isArray(saved) && saved.length === CRITTERS.length) {
    levelStars = saved;
  }
} catch (_) {}

function saveProgress() {
  try {
    localStorage.setItem('critters_breaker_stars_v1', JSON.stringify(levelStars));
  } catch (_) {}
}

let paddle = {
  x: CANVAS_W / 2,
  targetX: CANVAS_W / 2,
  y: PADDLE_Y,
  w: PADDLE_BASE_W,
  h: PADDLE_H,
  wideTimer: 0,
  laserTimer: 0,
  laserShotCooldown: 0,
  bounceSquish: 0
};

let balls = [];
let bricks = [];
let cages = [];
let bumpers = [];
let capsules = [];
let lasers = [];
let particles = [];
let floatingCritters = [];
let bgStars = [];

let starsEarned = [false, false, false];
let rescuedCount = 0;
let totalCages = 3;
let rainbowShieldActive = true;
let rainbowShieldRecharge = 0;
let fireballTimer = 0;
let aimAngle = -Math.PI / 2;
let aimDir = 1;
let showHandGuide = true;
let levelWon = false;
let comboCount = 0;
let keysPressed = { left: false, right: false };

// Initialize twinkling background stars
for (let i = 0; i < 42; i++) {
  bgStars.push({
    x: Math.random() * CANVAS_W,
    y: Math.random() * (CANVAS_H - 90),
    r: 1.2 + Math.random() * 2.2,
    phase: Math.random() * Math.PI * 2
  });
}

function showToast(emojiText) {
  const toast = document.getElementById('floatingToast');
  if (!toast) return;
  toast.textContent = emojiText;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 1300);
}

function spawnBallOnPaddle() {
  balls.push({
    x: paddle.x,
    y: paddle.y - PADDLE_H / 2 - BALL_R - 2,
    vx: 0,
    vy: 0,
    r: BALL_R,
    stuck: true,
    hue: 45,
    trail: []
  });
}

function buildStageLayout(levelIdx) {
  const cfg = CRITTERS[levelIdx];
  bricks = [];
  cages = [];
  bumpers = [];
  capsules = [];
  lasers = [];
  particles = [];
  floatingCritters = [];
  balls = [];

  starsEarned = [false, false, false];
  rescuedCount = 0;
  totalCages = cfg.cagesCount;
  rainbowShieldActive = true;
  rainbowShieldRecharge = 0;
  fireballTimer = 0;
  paddle.x = CANVAS_W / 2;
  paddle.targetX = CANVAS_W / 2;
  paddle.w = PADDLE_BASE_W;
  paddle.wideTimer = 0;
  paddle.laserTimer = 0;
  paddle.bounceSquish = 0;
  levelWon = false;
  comboCount = 0;
  showHandGuide = levelIdx === 0;

  // Place Trapped Smiling Critter Bubble Cages
  const cagePositions = [];
  if (totalCages === 3) {
    cagePositions.push(
      { x: 205, y: 128 },
      { x: 410, y: 106 },
      { x: 615, y: 128 }
    );
  } else if (totalCages === 4) {
    cagePositions.push(
      { x: 170, y: 120 },
      { x: 330, y: 102 },
      { x: 490, y: 102 },
      { x: 650, y: 120 }
    );
  } else if (totalCages === 5) {
    cagePositions.push(
      { x: 145, y: 118 },
      { x: 278, y: 98 },
      { x: 410, y: 128 },
      { x: 542, y: 98 },
      { x: 675, y: 118 }
    );
  } else {
    cagePositions.push(
      { x: 145, y: 102 },
      { x: 265, y: 152 },
      { x: 365, y: 96 },
      { x: 455, y: 96 },
      { x: 555, y: 152 },
      { x: 675, y: 102 }
    );
  }

  const cageHp = levelIdx < 2 ? 1 : 2;
  cagePositions.forEach((pos, idx) => {
    const critterObj = CRITTERS[(levelIdx + idx) % CRITTERS.length];
    cages.push({
      index: idx,
      x: pos.x,
      baseX: pos.x,
      y: pos.y,
      r: 28,
      hp: cageHp,
      maxHp: cageHp,
      critter: critterObj,
      rescued: false,
      hitFlash: 0,
      bobPhase: idx * 1.1
    });
  });

  // Build colorful brick grid around the Critter Cages
  const cols = 10;
  const rows = 5;
  const brickW = 68;
  const brickH = 28;
  const gapX = 6;
  const gapY = 7;
  const totalGridW = cols * brickW + (cols - 1) * gapX;
  const startX = (CANVAS_W - totalGridW) / 2 + brickW / 2;
  const startY = 58;

  const candidateCoords = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = startX + c * (brickW + gapX);
      const by = startY + r * (brickH + gapY);

      // Skip only bricks that directly intersect any Critter Cage bubble
      let overlapsCage = false;
      for (const cage of cages) {
        const dx = Math.abs(bx - cage.x);
        const dy = Math.abs(by - cage.y);
        if (dx < brickW * 0.45 + cage.r && dy < brickH * 0.45 + cage.r) {
          overlapsCage = true;
          break;
        }
      }
      if (overlapsCage) continue;

      candidateCoords.push({ r, c, bx, by });
    }
  }

  // Pick 3 positions for the 3 Giant Star Bricks (left, center, right)
  const starIndices = new Set();
  if (candidateCoords.length >= 6) {
    const leftPool = candidateCoords.map((item, i) => ({ item, i })).filter((x) => x.item.c <= 2);
    const midPool = candidateCoords.map((item, i) => ({ item, i })).filter((x) => x.item.c >= 3 && x.item.c <= 6);
    const rightPool = candidateCoords.map((item, i) => ({ item, i })).filter((x) => x.item.c >= 7);
    if (leftPool.length) starIndices.add(leftPool[Math.floor(leftPool.length / 2)].i);
    if (midPool.length) starIndices.add(midPool[Math.floor(midPool.length / 2)].i);
    if (rightPool.length) starIndices.add(rightPool[Math.floor(rightPool.length / 2)].i);
  }

  const powerupTypes = ['multiball', 'fireball', 'wide', 'laser'];
  let starCounter = 0;

  candidateCoords.forEach((coord, idx) => {
    const palette = BRICK_PALETTE[(coord.r + coord.c + levelIdx) % BRICK_PALETTE.length];
    let type = 'normal';
    let hp = 1;
    let starSlot = -1;
    let capsuleType = null;

    if (starIndices.has(idx) && starCounter < 3) {
      type = 'star';
      starSlot = starCounter++;
    } else if ((idx + levelIdx) % 5 === 1) {
      type = 'gift';
      capsuleType = powerupTypes[(idx + levelIdx) % powerupTypes.length];
    } else if (levelIdx >= 2 && coord.r === rows - 1 && (coord.c % 3 === 1)) {
      type = 'armor';
      hp = 2;
    }

    bricks.push({
      x: coord.bx,
      baseX: coord.bx,
      y: coord.by,
      w: brickW,
      h: brickH,
      row: coord.r,
      col: coord.c,
      palette,
      type,
      hp,
      maxHp: hp,
      starSlot,
      capsuleType,
      alive: true,
      hitScale: 0
    });
  });

  // Add Pinball Bell Bumpers in Stages 4..8
  if (cfg.hasBumpers) {
    bumpers.push(
      { x: 245, y: 278, r: 22, scale: 0, emoji: '🔔' },
      { x: 575, y: 278, r: 22, scale: 0, emoji: '🔔' }
    );
    if (levelIdx >= 5) {
      bumpers.push({ x: 410, y: 252, r: 22, scale: 0, emoji: '🍄' });
    }
  }

  spawnBallOnPaddle();
  renderTopNav();
  renderVisualHud();
  updateBoosterButtons();
}

function renderTopNav() {
  const nav = document.getElementById('levelNavBar');
  if (!nav) return;
  nav.innerHTML = '';
  CRITTERS.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'level-pill' + (idx === currentLevel ? ' active' : '');
    const starsCount = levelStars[idx] || 0;
    const starsStr = starsCount > 0 ? '⭐'.repeat(starsCount) : '🐾';
    btn.innerHTML = `
      <img src="${c.icon}" alt="" />
      <span class="pill-stars">${starsStr}</span>
    `;
    btn.addEventListener('click', () => {
      ensureAudio();
      currentLevel = idx;
      buildStageLayout(currentLevel);
    });
    nav.appendChild(btn);
  });
}

function renderVisualHud() {
  const cfg = CRITTERS[currentLevel];
  const sideImg = document.getElementById('sideCritterImg');
  const badgeEl = document.getElementById('critterPowerBadge');
  if (sideImg) sideImg.src = cfg.icon;
  if (badgeEl) badgeEl.textContent = cfg.badge;

  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`starSlot${i}`);
    if (slot) {
      slot.classList.toggle('collected', !!starsEarned[i]);
    }
  }

  const targetRow = document.getElementById('targetSlotsRow');
  if (targetRow) {
    targetRow.innerHTML = '';
    cages.forEach((cage) => {
      const pill = document.createElement('div');
      pill.className = 'hud-target-pill' + (cage.rescued ? ' popped' : '');
      pill.innerHTML = `<img src="${cage.critter.icon}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover;opacity:${cage.rescued ? '1' : '0.45'};" />`;
      targetRow.appendChild(pill);
    });
  }
}

function updateBoosterButtons() {
  const btnFire = document.getElementById('btnFireComet');
  const btnWide = document.getElementById('btnWidePaddle');
  if (btnFire) {
    btnFire.classList.toggle('mega-on', fireballTimer > 0);
  }
  if (btnWide) {
    btnWide.classList.toggle('active', paddle.wideTimer > 0);
  }
}

function spawnParticles(x, y, color, count = 12, emoji = null) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.6 + Math.random() * 4.8;
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 1.0,
      r: 3 + Math.random() * 4,
      color,
      emoji: i === 0 ? emoji : null,
      life: 1.0,
      decay: 0.024 + Math.random() * 0.02
    });
  }
}

function launchStuckBalls() {
  ensureAudio();
  let launchedAny = false;
  const speed = 6.9;
  balls.forEach((b) => {
    if (b.stuck) {
      b.stuck = false;
      b.vx = Math.cos(aimAngle) * speed;
      b.vy = Math.sin(aimAngle) * speed;
      if (b.vy > -3.5) b.vy = -5.8;
      launchedAny = true;
    }
  });
  if (launchedAny) {
    showHandGuide = false;
    paddle.bounceSquish = 1.0;
    playBounceSfx(2);
  }
  return launchedAny;
}

function triggerMultiBall() {
  ensureAudio();
  launchStuckBalls();
  if (balls.length === 0) {
    spawnBallOnPaddle();
    launchStuckBalls();
  }
  const sourceBalls = balls.slice(0, 3);
  const newBalls = [];
  sourceBalls.forEach((b) => {
    if (balls.length + newBalls.length >= 9) return;
    const spd = Math.hypot(b.vx, b.vy) || 6.8;
    const baseAng = Math.atan2(b.vy, b.vx);
    [-0.32, 0.32].forEach((offset, idx) => {
      newBalls.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(baseAng + offset) * spd,
        vy: Math.min(-3.4, Math.sin(baseAng + offset) * spd),
        r: BALL_R,
        stuck: false,
        hue: (b.hue + 90 * (idx + 1)) % 360,
        trail: []
      });
    });
  });
  balls.push(...newBalls);
  playPowerupSfx();
  showToast('⚽⚽⚽✨');
}

function triggerFireComet() {
  ensureAudio();
  launchStuckBalls();
  fireballTimer = 7.5;
  playPowerupSfx();
  updateBoosterButtons();
  showToast('☄️🔥✨');
}

function triggerWidePaddle() {
  ensureAudio();
  paddle.wideTimer = 10.0;
  paddle.w = PADDLE_WIDE_W;
  rainbowShieldActive = true;
  paddle.bounceSquish = 1.0;
  playPowerupSfx();
  updateBoosterButtons();
  showToast('🛸🌈✨');
}

function triggerLaserBurst() {
  ensureAudio();
  const launched = launchStuckBalls();
  paddle.laserTimer = Math.max(paddle.laserTimer, 6.0);
  lasers.push(
    { x: paddle.x - paddle.w * 0.34, y: paddle.y - 16, vy: -10.5 },
    { x: paddle.x + paddle.w * 0.34, y: paddle.y - 16, vy: -10.5 }
  );
  if (!launched) {
    playTone(740, 'square', 0.09, 0.1, 1180);
  }
}

function applyCapsulePowerup(type, x, y) {
  spawnParticles(x, y, '#ffd54f', 14, '✨');
  if (type === 'multiball') {
    triggerMultiBall();
  } else if (type === 'fireball') {
    triggerFireComet();
  } else if (type === 'wide') {
    triggerWidePaddle();
  } else if (type === 'laser') {
    paddle.laserTimer = 7.5;
    triggerLaserBurst();
    showToast('🚀🌟✨');
  }
}

function collectStarSlot(slotIdx, x, y) {
  if (slotIdx < 0 || slotIdx > 2) return;
  if (!starsEarned[slotIdx]) {
    starsEarned[slotIdx] = true;
    playStarSfx();
    spawnParticles(x, y, '#ffd54f', 18, '⭐');
    renderVisualHud();
  }
}

function rescueCage(cage) {
  if (cage.rescued) return;
  cage.rescued = true;
  rescuedCount++;
  playRescueSfx();
  spawnParticles(cage.x, cage.y, '#69f0ae', 24, '💖');
  floatingCritters.push({
    x: cage.x,
    y: cage.y,
    vy: -1.8,
    scale: 1.0,
    alpha: 1.0,
    critter: cage.critter
  });
  showToast('🐾💖✨');
  renderVisualHud();

  if (rescuedCount >= totalCages && !levelWon) {
    completeStage();
  }
}

function destroyBrick(brick) {
  if (!brick.alive) return;
  brick.alive = false;
  comboCount++;
  playBrickPopSfx(comboCount);
  spawnParticles(brick.x, brick.y, brick.palette.fill, 12, brick.type === 'star' ? '⭐' : null);

  if (brick.type === 'star' && brick.starSlot >= 0) {
    collectStarSlot(brick.starSlot, brick.x, brick.y);
  } else if (brick.type === 'gift' && brick.capsuleType) {
    capsules.push({
      x: brick.x,
      y: brick.y,
      vy: 2.35,
      r: 18,
      type: brick.capsuleType,
      pulse: 0
    });
  }

  // If every single brick in the stage is broken, auto-rescue any remaining cages
  const anyBricksLeft = bricks.some((b) => b.alive);
  if (!anyBricksLeft) {
    cages.forEach((cage) => {
      if (!cage.rescued) rescueCage(cage);
    });
  }
}

function completeStage() {
  levelWon = true;
  // Auto-collect any remaining stars during celebration cascade
  for (let i = 0; i < 3; i++) {
    starsEarned[i] = true;
  }
  bricks.forEach((b) => {
    if (b.alive) {
      b.alive = false;
      spawnParticles(b.x, b.y, b.palette.fill, 6, '✨');
    }
  });
  const earnedCount = starsEarned.filter(Boolean).length || 3;
  levelStars[currentLevel] = Math.max(levelStars[currentLevel] || 0, earnedCount);
  saveProgress();
  renderTopNav();
  renderVisualHud();
  playWinFanfare();

  setTimeout(() => {
    const cfg = CRITTERS[currentLevel];
    const winImg = document.getElementById('winCritterImg');
    const winBadge = document.getElementById('winPowerBadge');
    const winStars = document.getElementById('winStarsDisplay');
    if (winImg) winImg.src = cfg.icon;
    if (winBadge) winBadge.textContent = cfg.badge;
    if (winStars) {
      winStars.innerHTML = [0, 1, 2]
        .map((i) => `<div class="win-star-big ${starsEarned[i] ? 'earned' : ''}">⭐</div>`)
        .join('');
    }
    document.getElementById('winModal').classList.remove('hidden');
  }, 650);
}

function clampBallVelocity(b) {
  const targetSpd = fireballTimer > 0 ? 7.6 : 6.9;
  let spd = Math.hypot(b.vx, b.vy);
  if (spd < 0.01) {
    b.vx = 2.5;
    b.vy = -6.4;
    spd = Math.hypot(b.vx, b.vy);
  }
  // Prevent flat horizontal bouncing loops
  if (Math.abs(b.vy) < 2.4) {
    b.vy = (b.vy < 0 ? -1 : 1) * 2.6;
  }
  const scale = targetSpd / Math.hypot(b.vx, b.vy);
  b.vx *= scale;
  b.vy *= scale;
}

function updatePhysics(dt, timeSec) {
  const cfg = CRITTERS[currentLevel];

  // Keyboard paddle movement
  if (keysPressed.left) paddle.targetX -= 9.5;
  if (keysPressed.right) paddle.targetX += 9.5;

  const halfW = paddle.w / 2;
  paddle.targetX = Math.max(halfW + 12, Math.min(CANVAS_W - halfW - 12, paddle.targetX));
  paddle.x += (paddle.targetX - paddle.x) * 0.28;

  if (paddle.bounceSquish > 0) {
    paddle.bounceSquish = Math.max(0, paddle.bounceSquish - dt * 4.5);
  }

  // Power-up timers
  if (paddle.wideTimer > 0) {
    paddle.wideTimer = Math.max(0, paddle.wideTimer - dt);
    if (paddle.wideTimer === 0) {
      paddle.w = PADDLE_BASE_W;
      updateBoosterButtons();
    }
  }
  if (fireballTimer > 0) {
    fireballTimer = Math.max(0, fireballTimer - dt);
    if (fireballTimer === 0) updateBoosterButtons();
  }
  if (paddle.laserTimer > 0) {
    paddle.laserTimer = Math.max(0, paddle.laserTimer - dt);
    paddle.laserShotCooldown -= dt;
    if (paddle.laserShotCooldown <= 0 && !levelWon) {
      paddle.laserShotCooldown = 0.42;
      lasers.push(
        { x: paddle.x - paddle.w * 0.34, y: paddle.y - 16, vy: -10.5 },
        { x: paddle.x + paddle.w * 0.34, y: paddle.y - 16, vy: -10.5 }
      );
      playTone(760, 'sine', 0.06, 0.06, 1120);
    }
  }

  // Recharge rainbow floor shield automatically
  if (!rainbowShieldActive) {
    rainbowShieldRecharge += dt;
    if (rainbowShieldRecharge >= 9.0) {
      rainbowShieldActive = true;
      rainbowShieldRecharge = 0;
    }
  }

  // Swing aim line smoothly
  aimAngle += aimDir * dt * 1.15;
  if (aimAngle > -0.42) {
    aimAngle = -0.42;
    aimDir = -1;
  } else if (aimAngle < -Math.PI + 0.42) {
    aimAngle = -Math.PI + 0.42;
    aimDir = 1;
  }

  // Gentle swaying bricks in stages 6..8
  if (cfg.movingBricks) {
    const sway = Math.sin(timeSec * 1.55) * 18;
    bricks.forEach((b) => {
      const dir = b.row % 2 === 0 ? 1 : -1;
      b.x = b.baseX + sway * dir;
    });
    cages.forEach((c, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      c.x = c.baseX + sway * 0.65 * dir;
    });
  }

  // Update upward star lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.y += l.vy;
    if (l.y < 10) {
      lasers.splice(i, 1);
      continue;
    }
    let hit = false;
    for (const brick of bricks) {
      if (!brick.alive) continue;
      if (
        Math.abs(l.x - brick.x) <= brick.w / 2 + 5 &&
        Math.abs(l.y - brick.y) <= brick.h / 2 + 6
      ) {
        brick.hp--;
        brick.hitScale = 1.0;
        if (brick.hp <= 0) {
          destroyBrick(brick);
        } else {
          playBounceSfx(1);
          spawnParticles(l.x, l.y, '#ffffff', 6);
        }
        hit = true;
        break;
      }
    }
    if (!hit) {
      for (const cage of cages) {
        if (cage.rescued) continue;
        if (Math.hypot(l.x - cage.x, l.y - cage.y) <= cage.r + 6) {
          cage.hp--;
          cage.hitFlash = 1.0;
          if (cage.hp <= 0) {
            rescueCage(cage);
          } else {
            playBounceSfx(2);
          }
          hit = true;
          break;
        }
      }
    }
    if (hit) lasers.splice(i, 1);
  }

  // Update falling power-up capsules
  for (let i = capsules.length - 1; i >= 0; i--) {
    const cap = capsules[i];
    cap.y += cap.vy;
    cap.pulse += dt * 5;
    if (
      Math.abs(cap.x - paddle.x) <= paddle.w / 2 + cap.r &&
      Math.abs(cap.y - paddle.y) <= paddle.h / 2 + cap.r
    ) {
      applyCapsulePowerup(cap.type, cap.x, cap.y);
      capsules.splice(i, 1);
      continue;
    }
    if (cap.y > CANVAS_H + 30) {
      capsules.splice(i, 1);
    }
  }

  // Update balls
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    if (b.stuck) {
      b.x = paddle.x;
      b.y = paddle.y - PADDLE_H / 2 - b.r - 2;
      continue;
    }

    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 7) b.trail.shift();
    b.hue = (b.hue + 4) % 360;

    b.x += b.vx;
    b.y += b.vy;

    // Wall collisions
    if (b.x - b.r < 12) {
      b.x = 12 + b.r;
      b.vx = Math.abs(b.vx);
      playBounceSfx(0);
    } else if (b.x + b.r > CANVAS_W - 12) {
      b.x = CANVAS_W - 12 - b.r;
      b.vx = -Math.abs(b.vx);
      playBounceSfx(0);
    }
    if (b.y - b.r < 12) {
      b.y = 12 + b.r;
      b.vy = Math.abs(b.vy);
      playBounceSfx(0);
    }

    // Paddle bounce
    if (
      b.vy > 0 &&
      b.y + b.r >= paddle.y - paddle.h / 2 &&
      b.y - b.r <= paddle.y + paddle.h / 2 + 6 &&
      Math.abs(b.x - paddle.x) <= paddle.w / 2 + b.r * 0.85
    ) {
      const hitOffset = (b.x - paddle.x) / (paddle.w / 2);
      const clampedOffset = Math.max(-0.88, Math.min(0.88, hitOffset));
      const bounceAngle = -Math.PI / 2 + clampedOffset * 0.98;
      const spd = fireballTimer > 0 ? 7.6 : 6.9;
      b.vx = Math.cos(bounceAngle) * spd;
      b.vy = Math.sin(bounceAngle) * spd;
      b.y = paddle.y - paddle.h / 2 - b.r - 1;
      paddle.bounceSquish = 1.0;
      comboCount = 0;
      playBounceSfx(1);
      spawnParticles(b.x, paddle.y - 10, '#ffe082', 6);
    }

    // Brick collisions
    for (const brick of bricks) {
      if (!brick.alive) continue;
      const halfBW = brick.w / 2;
      const halfBH = brick.h / 2;
      const closestX = Math.max(brick.x - halfBW, Math.min(b.x, brick.x + halfBW));
      const closestY = Math.max(brick.y - halfBH, Math.min(b.y, brick.y + halfBH));
      const dx = b.x - closestX;
      const dy = b.y - closestY;

      if (dx * dx + dy * dy <= b.r * b.r) {
        if (fireballTimer > 0) {
          brick.hp = 0;
          destroyBrick(brick);
        } else {
          const overlapX = halfBW + b.r - Math.abs(b.x - brick.x);
          const overlapY = halfBH + b.r - Math.abs(b.y - brick.y);
          if (overlapX < overlapY) {
            b.vx = -b.vx;
          } else {
            b.vy = -b.vy;
          }
          brick.hp--;
          brick.hitScale = 1.0;
          if (brick.hp <= 0) {
            destroyBrick(brick);
          } else {
            playBounceSfx(2);
            spawnParticles(closestX, closestY, '#ffffff', 7);
          }
          clampBallVelocity(b);
        }
        break;
      }
    }

    // Trapped Critter Bubble Cage collisions
    for (const cage of cages) {
      if (cage.rescued) continue;
      const dx = b.x - cage.x;
      const dy = b.y - cage.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= b.r + cage.r && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        if (fireballTimer <= 0) {
          const spd = Math.hypot(b.vx, b.vy) || 6.9;
          b.vx = nx * spd;
          b.vy = ny * spd;
          b.x = cage.x + nx * (cage.r + b.r + 2);
          b.y = cage.y + ny * (cage.r + b.r + 2);
          clampBallVelocity(b);
        }
        cage.hp = fireballTimer > 0 ? 0 : cage.hp - 1;
        cage.hitFlash = 1.0;
        if (cage.hp <= 0) {
          rescueCage(cage);
        } else {
          playBounceSfx(3);
          spawnParticles(cage.x + nx * cage.r, cage.y + ny * cage.r, '#ffe082', 10, '✨');
        }
      }
    }

    // Pinball Bell Bumper collisions
    for (const bmp of bumpers) {
      const dx = b.x - bmp.x;
      const dy = b.y - bmp.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= b.r + bmp.r && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const spd = 7.4;
        b.vx = nx * spd;
        b.vy = ny * spd;
        b.x = bmp.x + nx * (bmp.r + b.r + 2);
        b.y = bmp.y + ny * (bmp.r + b.r + 2);
        bmp.scale = 1.0;
        clampBallVelocity(b);
        playBounceSfx(4);
        spawnParticles(bmp.x, bmp.y, '#ffd54f', 8, '✨');
      }
    }

    // Rainbow Safety Net at bottom (y = 524)
    if (b.y + b.r >= 522 && b.vy > 0) {
      if (rainbowShieldActive) {
        b.y = 520 - b.r;
        b.vy = -Math.abs(b.vy);
        clampBallVelocity(b);
        rainbowShieldActive = false;
        rainbowShieldRecharge = 0;
        playBounceSfx(3);
        spawnParticles(b.x, 522, '#ff80ab', 14, '🌈');
      } else if (b.y - b.r > CANVAS_H + 12) {
        balls.splice(i, 1);
      }
    }
  }

  // Never punish the player with game-over: if all balls dropped, spawn a fresh ball on paddle!
  if (balls.length === 0 && !levelWon) {
    rainbowShieldActive = true;
    spawnBallOnPaddle();
  }

  // Update visual decay animations
  bricks.forEach((b) => {
    if (b.hitScale > 0) b.hitScale = Math.max(0, b.hitScale - dt * 5);
  });
  cages.forEach((c) => {
    if (c.hitFlash > 0) c.hitFlash = Math.max(0, c.hitFlash - dt * 4);
  });
  bumpers.forEach((bmp) => {
    if (bmp.scale > 0) bmp.scale = Math.max(0, bmp.scale - dt * 5);
  });
  for (let i = floatingCritters.length - 1; i >= 0; i--) {
    const fc = floatingCritters[i];
    fc.y += fc.vy;
    fc.scale += dt * 0.35;
    fc.alpha -= dt * 0.9;
    if (fc.alpha <= 0) floatingCritters.splice(i, 1);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function renderScene(timeSec) {
  const cfg = CRITTERS[currentLevel];

  // Sky / World Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgGrad.addColorStop(0, cfg.themeTop);
  bgGrad.addColorStop(0.55, cfg.themeMid);
  bgGrad.addColorStop(1, cfg.themeBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Twinkling background stars
  bgStars.forEach((st) => {
    const alpha = 0.25 + 0.35 * Math.sin(timeSec * 2.2 + st.phase);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Soft decorative clouds in background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  [140, 410, 680].forEach((cx, i) => {
    const cy = 220 + (i % 2) * 55;
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.arc(cx - 34, cy + 10, 32, 0, Math.PI * 2);
    ctx.arc(cx + 34, cy + 10, 32, 0, Math.PI * 2);
    ctx.fill();
  });

  // Rainbow Floor Safety Net (y = 524)
  if (rainbowShieldActive) {
    const rGrad = ctx.createLinearGradient(20, 524, CANVAS_W - 20, 524);
    rGrad.addColorStop(0, '#ff5252');
    rGrad.addColorStop(0.2, '#ffb74d');
    rGrad.addColorStop(0.4, '#ffd54f');
    rGrad.addColorStop(0.6, '#69f0ae');
    rGrad.addColorStop(0.8, '#40c4ff');
    rGrad.addColorStop(1, '#e040fb');
    ctx.save();
    ctx.strokeStyle = rGrad;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(18, 524);
    ctx.lineTo(CANVAS_W - 18, 524);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 524);
    ctx.lineTo(CANVAS_W - 18, 524);
    ctx.stroke();
    ctx.restore();
  }

  // Draw Bricks
  bricks.forEach((b) => {
    if (!b.alive) return;
    const scale = 1 + b.hitScale * 0.14;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(scale, scale);

    const bx = -b.w / 2;
    const by = -b.h / 2;

    if (b.type === 'star') {
      ctx.fillStyle = '#ffb300';
      ctx.strokeStyle = '#fff8e1';
    } else if (b.type === 'gift') {
      ctx.fillStyle = '#ab47bc';
      ctx.strokeStyle = '#f3e5f5';
    } else if (b.type === 'armor') {
      ctx.fillStyle = b.hp === 2 ? '#78909c' : '#b0bec5';
      ctx.strokeStyle = '#eceff1';
    } else {
      ctx.fillStyle = b.palette.fill;
      ctx.strokeStyle = b.palette.border;
    }

    ctx.lineWidth = 2.5;
    drawRoundedRect(bx, by, b.w, b.h, 9);
    ctx.fill();
    ctx.stroke();

    // Glossy top highlight bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    drawRoundedRect(bx + 5, by + 3, b.w - 10, 6, 4);
    ctx.fill();

    // Brick center icon (100% opaque emoji)
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (b.type === 'star') {
      ctx.fillText('⭐', 0, 1);
    } else if (b.type === 'gift') {
      ctx.fillText('🎁', 0, 1);
    } else if (b.type === 'armor') {
      ctx.fillText(b.hp === 2 ? '🛡️' : '💥', 0, 1);
    } else {
      ctx.fillText(cfg.brickEmoji, 0, 1);
    }

    ctx.restore();
  });

  // Draw Trapped Smiling Critter Bubble Cages
  cages.forEach((cage) => {
    if (cage.rescued) return;
    const bobY = Math.sin(timeSec * 3.0 + cage.bobPhase) * 3.5;
    const scale = 1 + cage.hitFlash * 0.18;

    ctx.save();
    ctx.translate(cage.x, cage.y + bobY);
    ctx.scale(scale, scale);

    // Outer glowing bubble aura
    const aura = ctx.createRadialGradient(0, 0, cage.r * 0.4, 0, 0, cage.r + 10);
    aura.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    aura.addColorStop(1, 'rgba(79, 195, 247, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, cage.r + 10, 0, Math.PI * 2);
    ctx.fill();

    // Circular clipped Critter portrait inside bubble cage
    const img = critterImages[cage.critter.id];
    if (img && img.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, cage.r - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -(cage.r - 4), -(cage.r - 4), (cage.r - 4) * 2, (cage.r - 4) * 2);
      ctx.restore();
    }

    // Crystal bubble rim
    ctx.strokeStyle = cage.hp === 2 ? '#ffd54f' : '#80d8ff';
    ctx.lineWidth = cage.hp === 2 ? 4 : 3;
    ctx.beginPath();
    ctx.arc(0, 0, cage.r, 0, Math.PI * 2);
    ctx.stroke();

    // Bubble glass reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.beginPath();
    ctx.ellipse(-9, -11, 8, 4.5, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Small badge showing lock or sparkle
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cage.hp === 2 ? '🔒' : '🫧', cage.r - 4, -cage.r + 5);

    ctx.restore();
  });

  // Draw Pinball Bell Bumpers
  bumpers.forEach((bmp) => {
    const s = 1 + bmp.scale * 0.25;
    ctx.save();
    ctx.translate(bmp.x, bmp.y);
    ctx.scale(s, s);

    ctx.fillStyle = '#ff7043';
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, bmp.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bmp.emoji, 0, 1);
    ctx.restore();
  });

  // Draw Falling Power-Up Capsules
  const capEmojiMap = {
    multiball: '⚽',
    fireball: '☄️',
    wide: '🛸',
    laser: '🚀'
  };
  capsules.forEach((cap) => {
    const s = 1 + Math.sin(cap.pulse) * 0.08;
    ctx.save();
    ctx.translate(cap.x, cap.y);
    ctx.scale(s, s);

    ctx.fillStyle = 'rgba(255, 213, 79, 0.92)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, cap.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(capEmojiMap[cap.type] || '🎁', 0, 1);
    ctx.restore();
  });

  // Draw Upward Star Lasers
  lasers.forEach((l) => {
    ctx.save();
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - 8);
    ctx.lineTo(l.x, l.y + 10);
    ctx.stroke();
    ctx.restore();
  });

  // Draw Aim Line if a ball is stuck on the paddle
  const stuckBall = balls.find((b) => b.stuck);
  if (stuckBall && !levelWon) {
    ctx.save();
    ctx.strokeStyle = '#ffe082';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(stuckBall.x, stuckBall.y);
    ctx.lineTo(
      stuckBall.x + Math.cos(aimAngle) * 135,
      stuckBall.y + Math.sin(aimAngle) * 135
    );
    ctx.stroke();
    ctx.restore();

    if (showHandGuide) {
      const bounceY = Math.sin(timeSec * 5) * 6;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '34px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👆', stuckBall.x + 42, stuckBall.y - 36 + bounceY);
      ctx.restore();
    }
  }

  // Draw Rainbow Cloud Trampoline Paddle + Smiling Critter Pilot
  ctx.save();
  const squishX = 1 + paddle.bounceSquish * 0.08;
  const squishY = 1 - paddle.bounceSquish * 0.14;
  ctx.translate(paddle.x, paddle.y);
  ctx.scale(squishX, squishY);

  const pGrad = ctx.createLinearGradient(-paddle.w / 2, 0, paddle.w / 2, 0);
  pGrad.addColorStop(0, '#ff6b8b');
  pGrad.addColorStop(0.25, '#ffb74d');
  pGrad.addColorStop(0.5, '#ffd54f');
  pGrad.addColorStop(0.75, '#4fc3f7');
  pGrad.addColorStop(1, '#ba68c8');

  ctx.fillStyle = pGrad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  drawRoundedRect(-paddle.w / 2, -paddle.h / 2, paddle.w, paddle.h, 14);
  ctx.fill();
  ctx.stroke();

  // Inner bouncy trampoline cushion stripe
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  drawRoundedRect(-paddle.w / 2 + 10, -paddle.h / 2 + 4, paddle.w - 20, 7, 4);
  ctx.fill();

  // Twin Star Blaster Turrets when Laser mode is active
  if (paddle.laserTimer > 0) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀', -paddle.w * 0.36, -paddle.h / 2 - 6);
    ctx.fillText('🚀', paddle.w * 0.36, -paddle.h / 2 - 6);
  }

  // Smiling Critter Pilot Avatar sitting in center of paddle
  const pilotImg = critterImages[cfg.id];
  if (pilotImg && pilotImg.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 2, 18, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(pilotImg, -18, -16, 36, 36);
    ctx.restore();

    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 2, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Draw Balls & Rainbow/Fire Comet Trails
  balls.forEach((b) => {
    b.trail.forEach((pt, idx) => {
      const ratio = (idx + 1) / b.trail.length;
      ctx.fillStyle =
        fireballTimer > 0
          ? `rgba(255, 112, 67, ${(ratio * 0.55).toFixed(2)})`
          : `hsla(${(b.hue + idx * 15) % 360}, 90%, 65%, ${(ratio * 0.42).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, b.r * ratio * 0.85, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    ctx.translate(b.x, b.y);
    const ballGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, b.r);
    if (fireballTimer > 0) {
      ballGrad.addColorStop(0, '#fff8e1');
      ballGrad.addColorStop(0.5, '#ffca28');
      ballGrad.addColorStop(1, '#ff3d00');
    } else {
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.55, '#ffe082');
      ballGrad.addColorStop(1, '#ff8f00');
    }
    ctx.fillStyle = ballGrad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Draw Rescued Floating Critters
  floatingCritters.forEach((fc) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fc.alpha);
    ctx.translate(fc.x, fc.y);
    ctx.scale(fc.scale, fc.scale);
    const img = critterImages[fc.critter.id];
    if (img && img.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -24, -24, 48, 48);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', 22, -20);
    ctx.restore();
  });

  // Draw Sparkle Particles
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.emoji) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

// Pointer & Touch Controls
function updatePaddleFromClientX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const canvasX = (clientX - rect.left) * scaleX;
  const halfW = paddle.w / 2;
  paddle.targetX = Math.max(halfW + 12, Math.min(CANVAS_W - halfW - 12, canvasX));
}

canvas.addEventListener('pointermove', (e) => {
  updatePaddleFromClientX(e.clientX);
});

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
  updatePaddleFromClientX(e.clientX);
  launchStuckBalls();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keysPressed.left = true;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keysPressed.right = true;
  } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
    e.preventDefault();
    triggerLaserBurst();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keysPressed.left = false;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keysPressed.right = false;
  }
});

// Left Toy Dock Buttons
document.getElementById('btnLaunchOrLaser').addEventListener('click', () => {
  triggerLaserBurst();
});

document.getElementById('btnMultiBall').addEventListener('click', () => {
  triggerMultiBall();
});

document.getElementById('btnFireComet').addEventListener('click', () => {
  triggerFireComet();
});

document.getElementById('btnWidePaddle').addEventListener('click', () => {
  triggerWidePaddle();
});

document.getElementById('btnResetLevel').addEventListener('click', () => {
  ensureAudio();
  buildStageLayout(currentLevel);
});

document.getElementById('btnSoundToggle').addEventListener('click', (e) => {
  soundEnabled = !soundEnabled;
  e.currentTarget.textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) ensureAudio();
});

// Win & Finale Modal Actions
document.getElementById('btnWinReplay').addEventListener('click', () => {
  document.getElementById('winModal').classList.add('hidden');
  buildStageLayout(currentLevel);
});

document.getElementById('btnWinNext').addEventListener('click', () => {
  document.getElementById('winModal').classList.add('hidden');
  if (currentLevel < CRITTERS.length - 1) {
    currentLevel++;
    buildStageLayout(currentLevel);
  } else {
    showFinaleModal();
  }
});

function showFinaleModal() {
  const grid = document.getElementById('finaleCrittersGrid');
  if (grid) {
    grid.innerHTML = CRITTERS.map(
      (c) => `
      <div class="finale-critter-tile">
        <img src="${c.icon}" alt="" />
        <span>⭐⭐⭐ ${c.badge}</span>
      </div>
    `
    ).join('');
  }
  document.getElementById('finaleModal').classList.remove('hidden');
}

document.getElementById('btnFinaleClose').addEventListener('click', () => {
  document.getElementById('finaleModal').classList.add('hidden');
  currentLevel = 0;
  buildStageLayout(0);
});

// Main Animation Loop
let lastTime = performance.now();
function animate(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  updatePhysics(dt, now / 1000);
  renderScene(now / 1000);
  requestAnimationFrame(animate);
}

buildStageLayout(0);
requestAnimationFrame(animate);
