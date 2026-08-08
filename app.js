/**
 * Snake Trail Race - Enterprise Game Engine
 */
"use strict";

/* ==========================================================================
   CONSTANTS & CONFIGURATION
   ========================================================================== */
const FINISH = 43;
const specials = {
  5: { type: "bonus", label: "⚡ +10", effect: 10, color: "#10e394" },
  10: { type: "bonus", label: "⚡ +5", effect: 5, color: "#10e394" },
  17: { type: "trap", label: "💀 -2", effect: -2, color: "#ff7e36" },
  22: { type: "reset", label: "💥 RESET", effect: -22, color: "#ff4760" },
  25: { type: "trap", label: "💀 -5", effect: -5, color: "#ff7e36" },
  39: { type: "trap", label: "💀 -10", effect: -10, color: "#ff7e36" }
};

// 6 Available Avatars
const AVATARS = [
  { emoji: "🐍", label: "Neon Cobra", color: "#ff4760" },
  { emoji: "🐉", label: "Cyber Dragon", color: "#2893ff" },
  { emoji: "🦎", label: "Astro Lizard", color: "#10e394" },
  { emoji: "🦂", label: "Bio Scorpion", color: "#ff7e36" },
  { emoji: "🐙", label: "Deepwater Hydra", color: "#ffc93c" },
  { emoji: "🦅", label: "Space Phoenix", color: "#c026d3" }
];

/* ==========================================================================
   GAME STATE
   ========================================================================== */
let gameState = {
  mode: "ai", // "ai" or "pvp"
  players: [
    {
      name: "RED PLAYER",
      emoji: "🐍",
      color: "#ff4760",
      position: 0,
      visualX: 35,
      visualY: 42,
      targetX: 35,
      targetY: 42
    },
    {
      name: "BLUE PLAYER",
      emoji: "🐉",
      color: "#2893ff",
      position: 0,
      visualX: 35,
      visualY: 42,
      targetX: 35,
      targetY: 42
    }
  ],
  currentPlayer: 0,
  busy: false,
  gameOver: false,
  spaces: [],
  screenShake: 0,
  particles: [],
  highestClearedLevel: 0,
  currentLevel: 1,
  selectedShapeLevel: 1,
  levelSpecials: {},
  stats: {
    games: 0,
    wins: 0,
    kos: 0,
    traps: 0
  }
};

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Screens
const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");

// Setup DOM elements
const modeAi = document.getElementById("modeAi");
const modePvp = document.getElementById("modePvp");
const redNameInput = document.getElementById("redNameInput");
const blueNameInput = document.getElementById("blueNameInput");
const redAvatarsContainer = document.getElementById("redAvatars");
const blueAvatarsContainer = document.getElementById("blueAvatars");
const startGameBtn = document.getElementById("startGameBtn");

// Game HUD elements
const redCard = document.getElementById("redCard");
const blueCard = document.getElementById("blueCard");
const redAvatarBadge = document.getElementById("redAvatarBadge");
const blueAvatarBadge = document.getElementById("blueAvatarBadge");
const redNameCard = document.getElementById("redNameCard");
const blueNameCard = document.getElementById("blueNameCard");
const redPosition = document.getElementById("redPosition");
const bluePosition = document.getElementById("bluePosition");
const redProgress = document.getElementById("redProgress");
const blueProgress = document.getElementById("blueProgress");

const turnBullet = document.getElementById("turnBullet");
const turnName = document.getElementById("turnName");
const turnStatus = document.getElementById("turnStatus");

const rollButton = document.getElementById("roll");
const diceFace = document.getElementById("dice");
const diceLabel = document.getElementById("diceLabel");

const mainMessage = document.getElementById("mainMessage");
const hint = document.getElementById("hint");
const toast = document.getElementById("toast");

// Logging and stats elements
const logContainer = document.getElementById("logContainer");
const statGames = document.getElementById("statGames");
const statWins = document.getElementById("statWins");
const statKos = document.getElementById("statKos");
const statTraps = document.getElementById("statTraps");

// Headers and Modals
const muteBtn = document.getElementById("muteBtn");
const restartBtn = document.getElementById("restart");
const modal = document.getElementById("modal");
const winnerTitle = document.getElementById("winner");
const playAgainBtn = document.getElementById("playAgain");

// Stats sliding drawer elements
const statsToggleBtn = document.getElementById("statsToggleBtn");
const statsDrawer = document.getElementById("statsDrawer");
const drawerCloseBtn = document.getElementById("drawerCloseBtn");
const drawerOverlay = document.getElementById("drawerOverlay");

// Level and Shape Selectors
const levelSelectorGroup = document.getElementById("levelSelectorGroup");
const shapeSelectorGroup = document.getElementById("shapeSelectorGroup");
const prevLevelBtn = document.getElementById("prevLevelBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const levelValue = document.getElementById("levelValue");
const levelHint = document.getElementById("levelHint");
const prevShapeBtn = document.getElementById("prevShapeBtn");
const nextShapeBtn = document.getElementById("nextShapeBtn");
const shapeValue = document.getElementById("shapeValue");
const shapeHint = document.getElementById("shapeHint");

/* ==========================================================================
   SETUP SCREEN HANDLERS
   ========================================================================== */
let selectedRedAvatarIdx = 0;
let selectedBlueAvatarIdx = 1;

function getShapeName(level) {
  const algos = ["Serpentine Grid", "Helix Spiral", "Sine Wave", "Hourglass Loop", "Canyon Zigzag"];
  return `${algos[(level - 1) % 5]} (L${level})`;
}

function initSetupScreen() {
  // Render avatars choices
  renderAvatarGrid(redAvatarsContainer, "red", selectedRedAvatarIdx, (idx) => {
    selectedRedAvatarIdx = idx;
    updateAvatarSelection("red", idx);
  });
  
  renderAvatarGrid(blueAvatarsContainer, "blue", selectedBlueAvatarIdx, (idx) => {
    selectedBlueAvatarIdx = idx;
    updateAvatarSelection("blue", idx);
  });

  function updateLobbySelectors() {
    // Solo Level Selector Refresh
    levelValue.textContent = `Level ${gameState.currentLevel}`;
    levelHint.textContent = `Board Shape: ${getShapeName(gameState.currentLevel)}`;
    
    // PVP Shape Selector Refresh
    const maxShapeUnlocked = Math.max(1, gameState.highestClearedLevel);
    shapeValue.textContent = getShapeName(gameState.selectedShapeLevel);
    shapeHint.textContent = `Cleared level shapes unlocked: 1 to ${maxShapeUnlocked}`;
  }

  // Bind selector buttons click events
  prevLevelBtn.addEventListener("click", () => {
    if (gameState.currentLevel > 1) {
      gameState.currentLevel--;
      updateLobbySelectors();
    }
  });

  nextLevelBtn.addEventListener("click", () => {
    // Max level 500, locked to highestClearedLevel + 1
    const maxLvl = Math.min(500, gameState.highestClearedLevel + 1);
    if (gameState.currentLevel < maxLvl) {
      gameState.currentLevel++;
      updateLobbySelectors();
    } else {
      showToast(`🔒 Win Level ${gameState.currentLevel} to unlock the next level!`);
    }
  });

  prevShapeBtn.addEventListener("click", () => {
    if (gameState.selectedShapeLevel > 1) {
      gameState.selectedShapeLevel--;
      updateLobbySelectors();
    }
  });

  nextShapeBtn.addEventListener("click", () => {
    const maxShapeUnlocked = Math.max(1, gameState.highestClearedLevel);
    if (gameState.selectedShapeLevel < maxShapeUnlocked) {
      gameState.selectedShapeLevel++;
      updateLobbySelectors();
    } else {
      showToast(`🔒 Clear Level ${gameState.selectedShapeLevel} in Solo Mode to unlock this shape!`);
    }
  });

  // Mode Selection
  modeAi.addEventListener("click", () => {
    gameState.mode = "ai";
    modeAi.classList.add("active");
    modePvp.classList.remove("active");
    document.getElementById("bluePlayerConfig").style.opacity = "0.5";
    document.getElementById("bluePlayerConfig").style.pointerEvents = "none";
    blueNameInput.value = "AI COMP";

    levelSelectorGroup.style.display = "flex";
    shapeSelectorGroup.style.display = "none";
    updateLobbySelectors();
  });

  modePvp.addEventListener("click", () => {
    gameState.mode = "pvp";
    modePvp.classList.add("active");
    modeAi.classList.remove("active");
    document.getElementById("bluePlayerConfig").style.opacity = "1";
    document.getElementById("bluePlayerConfig").style.pointerEvents = "auto";
    if (blueNameInput.value === "AI COMP") blueNameInput.value = "BLUE PLAYER";

    levelSelectorGroup.style.display = "none";
    shapeSelectorGroup.style.display = "flex";
    updateLobbySelectors();
  });

  startGameBtn.addEventListener("click", () => {
    // Save configurations
    gameState.players[0].name = redNameInput.value.trim() || "RED PLAYER";
    gameState.players[0].emoji = AVATARS[selectedRedAvatarIdx].emoji;
    gameState.players[0].color = AVATARS[selectedRedAvatarIdx].color;

    gameState.players[1].name = blueNameInput.value.trim() || (gameState.mode === "ai" ? "AI COMP" : "BLUE PLAYER");
    gameState.players[1].emoji = AVATARS[selectedBlueAvatarIdx].emoji;
    gameState.players[1].color = AVATARS[selectedBlueAvatarIdx].color;

    // Load sound system
    GameSFX.init();

    // Toggle screens
    setupScreen.style.display = "none";
    gameScreen.classList.remove("shake"); // Clean shake class
    
    // Animate transition into game screen
    gameScreen.style.opacity = "0";
    gameScreen.style.display = "flex";
    setTimeout(() => {
      gameScreen.style.transition = "opacity 0.4s ease";
      gameScreen.style.opacity = "1";
    }, 50);

    // Initial game launch
    loadStats();
    resetGame();
  });

  // Run initial lobby selectors update
  updateLobbySelectors();
}

function renderAvatarGrid(container, playerKey, selectedIdx, onSelect) {
  container.innerHTML = "";
  AVATARS.forEach((av, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `avatar-option ${idx === selectedIdx ? "selected" : ""}`;
    btn.textContent = av.emoji;
    btn.title = av.label;
    btn.addEventListener("click", () => onSelect(idx));
    container.appendChild(btn);
  });
}

function updateAvatarSelection(playerKey, selectedIdx) {
  const container = playerKey === "red" ? redAvatarsContainer : blueAvatarsContainer;
  const options = container.querySelectorAll(".avatar-option");
  options.forEach((opt, idx) => {
    opt.classList.toggle("selected", idx === selectedIdx);
  });
}

/* ==========================================================================
   BOARD GENERATION
   ========================================================================== */
function buildBoard() {
  const lvl = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
  buildBoardForLevel(lvl);
}

function buildBoardForLevel(level) {
  gameState.spaces = [];
  const cols = 5 + ((level - 1) % 4); // 5, 6, 7, or 8 columns
  const rows = 7;
  const left = 35;
  const right = 35;
  const top = 35;
  const bottom = 35;
  const width = canvas.width;
  const height = canvas.height;

  // 1. Generate Specials deterministically based on Level seed
  gameState.levelSpecials = {};
  let seed = level * 17;
  function nextRand() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  const numBonuses = Math.max(1, 4 - Math.floor(level / 150));
  const numTraps = Math.min(6, 2 + Math.floor(level / 70));
  const numResets = 1;

  const takenIndices = new Set([0, FINISH]); // Reserve start & finish

  function getUniqueIdx() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const idx = 3 + Math.floor(nextRand() * (FINISH - 5)); // 3 to 38
      if (!takenIndices.has(idx)) {
        takenIndices.add(idx);
        return idx;
      }
    }
    return -1;
  }

  // Generate bonuses
  for (let b = 0; b < numBonuses; b++) {
    const idx = getUniqueIdx();
    if (idx !== -1) {
      const val = nextRand() < 0.5 ? 5 : 10;
      gameState.levelSpecials[idx] = {
        type: "bonus",
        label: `⚡ +${val}`,
        effect: val,
        color: "#10e394"
      };
    }
  }

  // Generate traps
  for (let t = 0; t < numTraps; t++) {
    const idx = getUniqueIdx();
    if (idx !== -1) {
      const possibleEffects = [-2, -3, -5, -8, -10];
      const trapStrength = Math.min(4, Math.floor(level / 100)); // index 0 to 4
      const effIdx = Math.floor(nextRand() * (trapStrength + 1));
      const val = possibleEffects[effIdx];
      gameState.levelSpecials[idx] = {
        type: "trap",
        label: `💀 ${val}`,
        effect: val,
        color: "#ff7e36"
      };
    }
  }

  // Generate reset
  for (let r = 0; r < numResets; r++) {
    const idx = getUniqueIdx();
    if (idx !== -1) {
      gameState.levelSpecials[idx] = {
        type: "reset",
        label: "💥 RESET",
        effect: -idx,
        color: "#ff4760"
      };
    }
  }

  // 2. Map coordinates based on dynamic Level Algorithms
  const algo = (level - 1) % 5;

  for (let i = 0; i <= FINISH; i++) {
    let px, py;
    if (algo === 0) {
      // Algorithm 0: Bottom-up Grid serpentine
      const gapX = (width - left - right) / (cols - 1);
      const gapY = (height - top - bottom) / (rows - 1);
      const r = Math.floor(i / cols);
      const idx = i % cols;
      const col = r % 2 === 0 ? idx : cols - 1 - idx;
      const row = rows - 1 - r;
      px = left + col * gapX;
      py = top + row * gapY;

    } else if (algo === 1) {
      // Algorithm 1: Helix Spiral (inward spiral)
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 2 - 28;
      const angle = (i * 0.44) + 0.55;
      const radius = maxRadius * (1 - (i / (FINISH + 8)));
      px = centerX + Math.cos(angle) * radius;
      py = centerY + Math.sin(angle) * radius;

    } else if (algo === 2) {
      // Algorithm 2: Sine Wave winding upwards
      const startY = height - bottom;
      const endY = top;
      const gapY = (startY - endY) / FINISH;
      py = startY - i * gapY;
      const waveAmp = 65 + (level % 3) * 15;
      const waveFreq = 0.04 + ((level - 1) % 2) * 0.025;
      px = width / 2 + waveAmp * Math.sin(waveFreq * (py - startY));

    } else if (algo === 3) {
      // Algorithm 3: Hourglass figure-8 Loop
      const centerX = width / 2;
      const centerY = height / 2;
      const scaleX = width / 2 - 32;
      const scaleY = height / 2 - 40;
      const t = (i / FINISH) * Math.PI * 2.1;
      px = centerX + scaleX * Math.sin(t);
      py = centerY + scaleY * Math.sin(2 * t);

    } else {
      // Algorithm 4: Vertical serpentine cols
      const vCols = 6;
      const gapX = (width - left - right) / (vCols - 1);
      const gapY = (height - top - bottom) / (vCols - 1);
      const colIdx = Math.floor(i / vCols);
      const cellIdx = i % vCols;
      const rowIdx = colIdx % 2 === 0 ? vCols - 1 - cellIdx : cellIdx;
      px = left + colIdx * gapX;
      py = top + rowIdx * gapY;
    }

    let type = "normal";
    let label = "";
    let color = "#1e293b";

    if (i === 0) {
      type = "start";
      label = "START";
      color = "#10e394";
    } else if (i === FINISH) {
      type = "finish";
      label = "🏆 FINISH";
      color = "#ffc93c";
    } else if (gameState.levelSpecials[i]) {
      type = gameState.levelSpecials[i].type;
      label = gameState.levelSpecials[i].label;
      color = gameState.levelSpecials[i].color;
    }

    gameState.spaces.push({
      x: px,
      y: py,
      type: type,
      label: label,
      color: color
    });
  }
}

/* ==========================================================================
   PARTICLES & SCREEN SHAKE ENGINE
   ========================================================================== */
function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    gameState.particles.push({
      x: x,
      y: y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 0.5, // Drift slightly up
      color: color,
      radius: 2 + Math.random() * 4,
      alpha: 1,
      decay: 0.02 + Math.random() * 0.02
    });
  }
}

function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  gameState.particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.restore();
  });
}

function triggerScreenShake(intensity = 12) {
  gameState.screenShake = intensity;
}

/* ==========================================================================
   RENDER SYSTEM (requestAnimationFrame loop)
   ========================================================================== */
function renderLoop() {
  // Clear with background color matching visual container
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Apply Screen Shake
  if (gameState.screenShake > 0.1) {
    const dx = (Math.random() - 0.5) * gameState.screenShake;
    const dy = (Math.random() - 0.5) * gameState.screenShake;
    ctx.translate(dx, dy);
    gameState.screenShake *= 0.88; // decay
  }

  // Draw board background decor grid
  drawBoardBackgroundDecor();

  // Draw path trails
  drawTrail();

  // Draw board tile spaces
  drawSpaces();

  // Update & Draw player visual tokens
  updateAndDrawTokens();

  // Update & Draw particles
  updateParticles();
  drawParticles();

  ctx.restore();

  requestAnimationFrame(renderLoop);
}

function drawBoardBackgroundDecor() {
  // Ambient grid dots/stars inside canvas
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  for (let x = 20; x < canvas.width; x += 40) {
    for (let y = 20; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTrail() {
  if (gameState.spaces.length === 0) return;

  // Draw glowing outer track line
  ctx.save();
  ctx.beginPath();
  gameState.spaces.forEach((sp, idx) => {
    if (idx === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  });
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(40, 147, 255, 0.15)";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "rgba(40, 147, 255, 0.3)";
  ctx.stroke();

  // Draw inner track line
  ctx.beginPath();
  gameState.spaces.forEach((sp, idx) => {
    if (idx === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  });
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.stroke();
  ctx.restore();
}

function drawSpaces() {
  gameState.spaces.forEach((space, index) => {
    // Glass inner style
    ctx.save();
    
    // Glass Shadow
    ctx.beginPath();
    ctx.arc(space.x, space.y + 2, 19, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // Glow accent for special tiles
    const isSpecial = space.type !== "normal";
    if (isSpecial) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = space.color;
    }

    // Glass Base
    ctx.beginPath();
    ctx.arc(space.x, space.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = isSpecial ? space.color : "rgba(22, 28, 45, 0.8)";
    ctx.fill();

    // Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = isSpecial ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.08)";
    ctx.stroke();
    
    ctx.restore();

    // Text Label/Index drawing
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isSpecial ? "#080a11" : "#9ca3af";
    ctx.font = isSpecial ? "bold 9px 'Plus Jakarta Sans'" : "600 11px 'Outfit'";

    if (space.type === "start") {
      ctx.font = "bold 8px 'Outfit'";
      ctx.fillText("START", space.x, space.y);
    } else if (space.type === "finish") {
      ctx.font = "bold 8px 'Outfit'";
      ctx.fillText("GOAL", space.x, space.y);
    } else if (space.type === "bonus" || space.type === "trap" || space.type === "reset") {
      ctx.fillText(space.label.replace(/[^\d+-]/g, ""), space.x, space.y);
    } else {
      ctx.fillText(index.toString(), space.x, space.y);
    }
    ctx.restore();
  });
}

function updateAndDrawTokens() {
  const p1 = gameState.players[0];
  const p2 = gameState.players[1];
  
  const targetSpace1 = gameState.spaces[p1.position];
  const targetSpace2 = gameState.spaces[p2.position];

  if (targetSpace1) {
    p1.targetX = targetSpace1.x;
    p1.targetY = targetSpace1.y;
  }
  if (targetSpace2) {
    p2.targetX = targetSpace2.x;
    p2.targetY = targetSpace2.y;
  }

  // Visual offsets if they occupy the same tile
  const samePos = p1.position === p2.position && p1.position !== 0;
  if (samePos) {
    p1.targetX -= 10;
    p1.targetY -= 6;
    p2.targetX += 10;
    p2.targetY += 6;
  }

  // Smooth slide lerping
  gameState.players.forEach((player, idx) => {
    player.visualX = player.visualX * 0.82 + player.targetX * 0.18;
    player.visualY = player.visualY * 0.82 + player.targetY * 0.18;

    // Draw Token glow & shape
    ctx.save();
    
    // Token Shadow
    ctx.beginPath();
    ctx.arc(player.visualX, player.visualY + 4, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // Glow aura
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;

    // Draw radial gradient 3D sphere
    const grad = ctx.createRadialGradient(
      player.visualX - 4, player.visualY - 4, 2,
      player.visualX, player.visualY, 15
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, player.color);
    grad.addColorStop(1, adjustColorBrightness(player.color, -30));

    ctx.beginPath();
    ctx.arc(player.visualX, player.visualY, 14, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // White rim
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.stroke();

    // Render Emoji/Icon inside Token
    ctx.restore();
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px Arial";
    ctx.fillText(player.emoji, player.visualX, player.visualY + 1);
    ctx.restore();

    // Embers spawned at token when player is active
    if (gameState.currentPlayer === idx && !gameState.gameOver && Math.random() < 0.12) {
      gameState.particles.push({
        x: player.visualX,
        y: player.visualY,
        dx: (Math.random() - 0.5) * 1.5,
        dy: -1 - Math.random() * 1.5,
        color: player.color,
        radius: 1 + Math.random() * 2,
        alpha: 0.8,
        decay: 0.03
      });
    }
  });
}

// Help helper to darken color
function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = (R > 0) ? R : 0;
  G = (G > 0) ? G : 0;
  B = (B > 0) ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/* ==========================================================================
   UI SYNCHRONIZATION
   ========================================================================== */
function updateHUD() {
  const p1 = gameState.players[0];
  const p2 = gameState.players[1];

  // Cards state toggle
  redCard.classList.toggle("active", gameState.currentPlayer === 0 && !gameState.gameOver);
  blueCard.classList.toggle("active", gameState.currentPlayer === 1 && !gameState.gameOver);

  // Position label updates
  redPosition.textContent = p1.position === 0 ? "START" : p1.position === FINISH ? "GOAL" : `#${p1.position}`;
  bluePosition.textContent = p2.position === 0 ? "START" : p2.position === FINISH ? "GOAL" : `#${p2.position}`;

  // Progress Bar width calculations
  redProgress.style.width = `${(p1.position / FINISH) * 100}%`;
  blueProgress.style.width = `${(p2.position / FINISH) * 100}%`;

  // Text values
  redNameCard.textContent = p1.name;
  blueNameCard.textContent = p2.name;
  redAvatarBadge.textContent = p1.emoji;
  blueAvatarBadge.textContent = p2.emoji;

  // Turn status banner
  const activePlayer = gameState.players[gameState.currentPlayer];
  turnBullet.style.color = activePlayer.color;
  turnName.textContent = `${activePlayer.emoji} ${activePlayer.name}'S TURN`;

  if (gameState.gameOver) {
    turnStatus.textContent = "GAME OVER";
  } else if (gameState.busy) {
    turnStatus.textContent = "MOVING...";
  } else {
    turnStatus.textContent = gameState.mode === "ai" && gameState.currentPlayer === 1 ? "COMPUTER THINKING..." : "AWAITING ROLL";
  }
}

function logAction(text, type = "normal") {
  const el = document.createElement("div");
  el.className = `log-entry ${type}`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  el.innerHTML = `<span style="color: var(--text-muted)">[${time}]</span> ${text}`;
  
  logContainer.appendChild(el);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function floatingText(text, color, x, y) {
  const el = document.createElement("div");
  el.className = "floater";
  el.textContent = text;
  el.style.color = color;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 1200);
}

/* ==========================================================================
   LOCAL STORAGE STATS ENGINE
   ========================================================================== */
function loadStats() {
  const loaded = localStorage.getItem("trail_race_stats");
  if (loaded) {
    gameState.stats = JSON.parse(loaded);
  } else {
    gameState.stats = { games: 0, wins: 0, kos: 0, traps: 0 };
  }
  
  const loadedCleared = localStorage.getItem("trail_race_highest_cleared");
  gameState.highestClearedLevel = loadedCleared ? parseInt(loadedCleared) : 0;
  
  updateStatsDisplay();
}

function saveStats() {
  localStorage.setItem("trail_race_stats", JSON.stringify(gameState.stats));
  updateStatsDisplay();
}

function updateStatsDisplay() {
  statGames.textContent = gameState.stats.games;
  statWins.textContent = gameState.stats.wins;
  statKos.textContent = gameState.stats.kos;
  statTraps.textContent = gameState.stats.traps;
}

let baseRotationX = -20;
let baseRotationY = 30;

function getFaceRotationX(face) {
  switch (face) {
    case 2: return -90;
    case 5: return 90;
    default: return 0;
  }
}

function getFaceRotationY(face) {
  switch (face) {
    case 1: return 0;
    case 6: return 180;
    case 3: return -90;
    case 4: return 90;
    default: return 0;
  }
}

async function triggerRoll() {
  if (gameState.busy || gameState.gameOver) return;
  gameState.busy = true;

  const cube = document.getElementById("cube");
  rollButton.classList.add("disabled");
  rollButton.classList.add("dice-shake");
  diceLabel.textContent = "ROLLING...";

  mainMessage.textContent = "Rolling the dice...";
  hint.textContent = "Fingers crossed!";

  const finalResult = Math.floor(Math.random() * 6) + 1;

  // Cumulative rotation for continuous forward spin
  baseRotationX += 720 + Math.floor(Math.random() * 2) * 360;
  baseRotationY += 720 + Math.floor(Math.random() * 2) * 360;

  const targetX = baseRotationX + getFaceRotationX(finalResult);
  const targetY = baseRotationY + getFaceRotationY(finalResult);

  if (cube) {
    cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;
  }

  // Play tick SFX ticks aligned with the spin duration (800ms)
  const tickCount = 7;
  for (let i = 0; i < tickCount; i++) {
    GameSFX.play("tick");
    await wait(90 + i * 15);
  }

  rollButton.classList.remove("dice-shake");
  diceLabel.textContent = "TAP ROLL";
  
  // Wait for transition to settle
  await wait(300);

  // Execute movement
  await executeMovement(finalResult);
}

async function executeMovement(roll) {
  const player = gameState.players[gameState.currentPlayer];
  const startPos = player.position;
  const targetPos = startPos + roll;

  logAction(`${player.emoji} <strong>${player.name}</strong> rolled a <strong>${roll}</strong>`, gameState.currentPlayer === 0 ? "red" : "blue");

  // Check overflow finish rule
  if (targetPos > FINISH) {
    mainMessage.textContent = "Too far!";
    hint.textContent = `Need exactly ${FINISH - player.position} to reach the Goal.`;
    showToast("🎯 Exact roll required to Finish!");
    
    GameSFX.play("trap");
    triggerScreenShake(4);
    
    await wait(1000);
    switchTurn();
    return;
  }

  mainMessage.textContent = `Moving ${roll} tiles`;
  hint.textContent = "Charging forward...";

  // Step-by-step token navigation
  for (let i = 1; i <= roll; i++) {
    player.position++;
    GameSFX.play("move");
    updateHUD();
    
    // Wait for the slide LERP animation to align
    await wait(220);
  }

  // Resolve collision attacks
  const opponentIdx = gameState.currentPlayer === 0 ? 1 : 0;
  const opponent = gameState.players[opponentIdx];

  if (player.position === opponent.position && player.position !== 0) {
    await resolveKnockout(player, opponent);
  }

  // Resolve Goal Win
  if (player.position === FINISH) {
    triggerVictory(player);
    return;
  }

  // Resolve landing on Special spaces
  if (gameState.levelSpecials[player.position]) {
    await resolveSpecialTile(player);
  }

  // Check goal win post-special tile slide
  if (player.position === FINISH) {
    triggerVictory(player);
    return;
  }

  await wait(500);
  switchTurn();
}

async function resolveKnockout(attacker, victim) {
  mainMessage.textContent = "KNOCKOUT! 💥";
  hint.textContent = `${victim.name} is blasted back to START!`;
  showToast(`💥 ${attacker.name} KO'd ${victim.name}!`);
  logAction(`💥 <strong>${attacker.name}</strong> knocked out <strong>${victim.name}</strong>!`, "knockout");

  // Cumulative statistics updates
  gameState.stats.kos++;
  saveStats();

  // Screen shake and explosions
  triggerScreenShake(24);
  GameSFX.play("knockout");
  
  // Confetti particles at current slot
  const victimSpace = gameState.spaces[victim.position];
  spawnParticles(victimSpace.x, victimSpace.y, attacker.color, 35);
  
  // Custom Floating alert
  const middleX = window.innerWidth / 2;
  const middleY = window.innerHeight / 2;
  floatingText("KNOCKOUT! 💥", "#ffc93c", middleX, middleY - 60);

  await wait(600);

  // Send opponent sliding backwards all the way to START
  while (victim.position > 0) {
    victim.position--;
    GameSFX.play("move");
    updateHUD();
    await wait(90);
  }
}

async function resolveSpecialTile(player) {
  const spec = gameState.levelSpecials[player.position];
  await wait(350);

  if (spec.effect > 0) {
    // BONUS TILE
    mainMessage.textContent = "BONUS! ⚡";
    hint.textContent = `Propelling forward +${spec.effect} spaces!`;
    showToast(`⚡ BONUS! +${spec.effect}`);
    logAction(`⚡ ${player.name} hit a BONUS: moved forward <strong>${spec.effect}</strong> tiles.`, "bonus");

    triggerScreenShake(6);
    GameSFX.play("bonus");

    const playerSpace = gameState.spaces[player.position];
    spawnParticles(playerSpace.x, playerSpace.y, "#10e394", 15);
    floatingText(`+${spec.effect} SPACES! 🚀`, "#10e394", window.innerWidth / 2, window.innerHeight / 2);

  } else {
    // TRAP / RESET
    gameState.stats.traps++;
    saveStats();

    if (spec.type === "reset") {
      mainMessage.textContent = "POWER RESET! 🚨";
      hint.textContent = "Sliding back to START!";
      showToast("🚨 RESET TRIGGERED!");
      logAction(`🚨 ${player.name} hit the RESET tile: sent back to START.`, "trap");
      
      triggerScreenShake(18);
      GameSFX.play("reset");
      floatingText(`RESET! 😱`, "#ff4760", window.innerWidth / 2, window.innerHeight / 2);
    } else {
      mainMessage.textContent = "ENERGY TRAP! 💀";
      hint.textContent = `Dragging back ${Math.abs(spec.effect)} spaces!`;
      showToast(`💀 TRAP! -${Math.abs(spec.effect)}`);
      logAction(`💀 ${player.name} triggered a TRAP: fell back <strong>${Math.abs(spec.effect)}</strong> tiles.`, "trap");

      triggerScreenShake(10);
      GameSFX.play("trap");
      floatingText(`-${Math.abs(spec.effect)} SPACES! 💀`, "#ff7e36", window.innerWidth / 2, window.innerHeight / 2);
    }
  }

  await wait(600);

  // Compute slide destination
  let destination = player.position + spec.effect;
  if (destination < 0) destination = 0;
  if (destination > FINISH) destination = FINISH;

  // Visual slide loops
  while (player.position !== destination) {
    if (player.position < destination) {
      player.position++;
    } else {
      player.position--;
    }
    GameSFX.play("move");
    updateHUD();
    await wait(180);
  }

  // Evaluate collisions post-special slide
  const opponentIdx = gameState.currentPlayer === 0 ? 1 : 0;
  const opponent = gameState.players[opponentIdx];

  if (player.position === opponent.position && player.position !== 0) {
    await resolveKnockout(player, opponent);
  }
}

/* ==========================================================================
   TURN ROTATION
   ========================================================================== */
function switchTurn() {
  gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
  gameState.busy = false;
  
  diceFace.textContent = "?";
  
  const activePlayer = gameState.players[gameState.currentPlayer];
  mainMessage.textContent = `${activePlayer.name}'s Turn`;
  hint.textContent = "Roll the dice to navigate.";

  updateHUD();

  // If AI Mode and CPU's turn, trigger computer choice
  if (gameState.mode === "ai" && gameState.currentPlayer === 1) {
    triggerComputerTurn();
  } else {
    rollButton.classList.remove("disabled");
  }
}

async function triggerComputerTurn() {
  rollButton.classList.add("disabled");
  
  mainMessage.textContent = "Computer thinking...";
  hint.textContent = "Calculating vectors...";
  
  // Artificial thinking delay
  await wait(1200 + Math.random() * 800);
  
  if (!gameState.gameOver) {
    await triggerRoll();
  }
}

/* ==========================================================================
   VICTORY GAME OVER
   ========================================================================== */
function triggerVictory(winner) {
  gameState.gameOver = true;
  gameState.busy = false;
  
  rollButton.classList.add("disabled");
  
  mainMessage.textContent = "🏆 VICTORY!";
  hint.textContent = `${winner.name} wins the match!`;
  
  winnerTitle.textContent = `${winner.name} WINS!`;
  winnerTitle.style.color = winner.color;

  logAction(`🏆 <strong>${winner.name}</strong> reached the GOAL and won the game!`, gameState.currentPlayer === 0 ? "red" : "blue");

  // Cumulative statistics updates
  gameState.stats.games++;
  if (gameState.currentPlayer === 0) {
    gameState.stats.wins++; // User wins tracking
    
    // NPC Level advancement check
    if (gameState.mode === "ai") {
      const activeLvl = gameState.currentLevel;
      if (activeLvl > gameState.highestClearedLevel) {
        gameState.highestClearedLevel = activeLvl;
        localStorage.setItem("trail_race_highest_cleared", activeLvl);
        
        logAction(`🏆 <strong>LEVEL UNLOCKED!</strong> Cleared Level ${activeLvl}! Shape is now unlocked for Local PVP.`, "knockout");
        showToast(`🏆 Level ${activeLvl} Cleared! Shape Unlocked!`);
        
        // Custom text inside modal
        winnerTitle.innerHTML = `${winner.name} WINS!<br><span style="font-size:11px;color:var(--green);font-weight:800;letter-spacing:0.02em;">🏆 LEVEL ${activeLvl} CLEARED! PVP SHAPE UNLOCKED!</span>`;
      }
    }
  }
  saveStats();

  GameSFX.play("win");

  // Show winning modal
  modal.classList.add("show");

  // Fire celebratory fireworks / sparks across the screen
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const colors = ["#ffc93c", "#ff4760", "#2893ff", "#10e394", "#c026d3"];
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height * 0.7;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      spawnParticles(rx, ry, randomColor, 12);
      triggerScreenShake(2);
    }, i * 150);
  }
}

/* ==========================================================================
   RESET & SYSTEM HELPERS
   ========================================================================== */
function resetGame() {
  // Set players position
  gameState.players[0].position = 0;
  gameState.players[1].position = 0;

  // Clean visual coordinate positions
  const startSpace = gameState.spaces[0];
  gameState.players.forEach(p => {
    p.visualX = startSpace.x;
    p.visualY = startSpace.y;
    p.targetX = startSpace.x;
    p.targetY = startSpace.y;
  });

  gameState.currentPlayer = 0;
  gameState.busy = false;
  gameState.gameOver = false;
  gameState.particles = [];

  const cube = document.getElementById("cube");
  if (cube) {
    baseRotationX = -20;
    baseRotationY = 30;
    cube.style.transform = "rotateX(-20deg) rotateY(30deg)";
  }

  diceFace.textContent = "?";
  mainMessage.textContent = "Tap the dice to roll";
  hint.textContent = "Land on your opponent to knock them back!";

  rollButton.classList.remove("disabled");
  modal.classList.remove("show");

  // Clean logs and post init log
  logContainer.innerHTML = "";
  logAction(`🎮 New Game started in <strong>${gameState.mode === "ai" ? "VS AI" : "PVP"} Mode</strong>!`);
  
  updateHUD();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ==========================================================================
   EVENT LISTENERS INITIALIZATION
   ========================================================================== */
function initEvents() {
  // Dice Button Click
  rollButton.addEventListener("click", () => {
    // Only allow human rolling
    if (gameState.mode === "ai" && gameState.currentPlayer === 1) return;
    triggerRoll();
  });

  // Header and modal buttons
  restartBtn.addEventListener("click", () => {
    if (confirm("Reset current game? Progress will be lost.")) {
      resetGame();
    }
  });

  playAgainBtn.addEventListener("click", () => {
    resetGame();
  });

  // Mute audio Toggle
  muteBtn.addEventListener("click", () => {
    const isMuted = GameSFX.toggleMute();
    muteBtn.innerHTML = isMuted ? "🔈" : "🔊";
    showToast(isMuted ? "Audio Muted" : "Audio Unmuted");
  });

  // Initialize Audio icon
  muteBtn.innerHTML = GameSFX.isMuted() ? "🔈" : "🔊";

  // Sliding Drawer toggles
  statsToggleBtn.addEventListener("click", () => {
    statsDrawer.classList.add("open");
  });

  drawerCloseBtn.addEventListener("click", () => {
    statsDrawer.classList.remove("open");
  });

  drawerOverlay.addEventListener("click", () => {
    statsDrawer.classList.remove("open");
  });
}

/* ==========================================================================
   INITIALIZATION LAUNCHER
   ========================================================================== */
window.addEventListener("DOMContentLoaded", () => {
  // Initial elements sizing
  canvas.width = 380;
  canvas.height = 460;

  loadStats(); // Load stats first to get cleared levels!
  buildBoard();
  initSetupScreen();
  initEvents();
  
  // Kick off render loop
  requestAnimationFrame(renderLoop);
});
