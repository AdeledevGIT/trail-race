/**
 * Snake Trail Race - Enterprise Game Engine
 */
"use strict";

/* ==========================================================================
   CONSTANTS & CONFIGURATION
   ========================================================================== */
function getFinishForLevel(level) {
  const lvl = Math.max(1, parseInt(level) || 1);
  // Level 1 starts with 20 tiles, and increases by 10 per level as you advance:
  // L1: 20, L2: 30, L3: 40, L4: 50, L5: 60... (capped at 120 for smooth mobile camera)
  return Math.min(120, 20 + (lvl - 1) * 10);
}

function getActiveFinish() {
  const lvl = (typeof gameState !== 'undefined' && gameState.mode === "pvp")
    ? gameState.selectedShapeLevel
    : (typeof gameState !== 'undefined' ? gameState.currentLevel : 1);
  return getFinishForLevel(lvl);
}

if (typeof window !== "undefined") {
  Object.defineProperty(window, 'FINISH', {
    get: function() {
      return getActiveFinish();
    },
    configurable: true
  });
}

const specials = {
  5: { type: "bonus", label: "⚡ +10", effect: 10, color: "#10e394" },
  10: { type: "bonus", label: "⚡ +5", effect: 5, color: "#10e394" },
  17: { type: "trap", label: "💀 -2", effect: -2, color: "#ff7e36" },
  22: { type: "reset", label: "💥 RESET", effect: -22, color: "#ff4760" },
  25: { type: "trap", label: "💀 -5", effect: -5, color: "#ff7e36" },
  39: { type: "trap", label: "💀 -10", effect: -10, color: "#ff7e36" }
};

// 6 Available Avatars using FontAwesome
const AVATARS = [
  { emoji: "\uf135", html: '<i class="fa-solid fa-rocket"></i>', label: "Neon Rocket",   color: "#ff3a5c" },
  { emoji: "\uf753", html: '<i class="fa-solid fa-meteor"></i>', label: "Cyber Meteor",  color: "#00b8ff" },
  { emoji: "\uf0e7", html: '<i class="fa-solid fa-bolt"></i>',   label: "Astro Bolt",    color: "#0dffb0" },
  { emoji: "\uf6e2", html: '<i class="fa-solid fa-ghost"></i>',  label: "Bio Ghost",     color: "#ff6b00" },
  { emoji: "\uf544", html: '<i class="fa-solid fa-robot"></i>',  label: "Mecha Robot",   color: "#c850ff" },
  { emoji: "\uf714", html: '<i class="fa-solid fa-skull"></i>',  label: "Space Skull",   color: "#ffcc00" }
];

/* ==========================================================================
   GAME STATE
   ========================================================================== */
let gameState = {
  mode: "ai", // "ai" or "pvp"
  players: [
    {
      name: "RED RACER",
      emoji: "\uf135",
      html: '<i class="fa-solid fa-rocket"></i>',
      color: "#ff4058",
      position: 0,
      visualX: 35,
      visualY: 42,
      targetX: 35,
      targetY: 42,
      frozenTurns: 0,
      hasShield: false
    },
    {
      name: "AI COMP",
      emoji: "\uf753",
      html: '<i class="fa-solid fa-robot"></i>',
      color: "#00d9ff",
      position: 0,
      visualX: 35,
      visualY: 42,
      targetX: 35,
      targetY: 42,
      frozenTurns: 0,
      hasShield: false
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
  matchStartTime: 0,
  shieldsCollected: 0,
  coinsEarned: 0,
  stats: {
    games: 0,
    wins: 0,
    kos: 0,
    traps: 0
  }
};

// Global Camera state (X, Y, Zoom)
let camera = {
  x: 0,
  y: 0,
  zoom: 1,
  targetX: 0,
  targetY: 0,
  targetZoom: 1
};

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Screens
const homeScreen = document.getElementById("homeScreen");
const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");

// Home Screen Elements
const homePlayBtn = document.getElementById("homePlayBtn");
const homeVsAiBtn = document.getElementById("homeVsAiBtn");
const homePassPlayBtn = document.getElementById("homePassPlayBtn");
const homeMoreModesBtn = document.getElementById("homeMoreModesBtn");
const homeSettingsBtn = document.getElementById("homeSettingsBtn");
const homeMuteBtn = document.getElementById("homeMuteBtn");
const setupBackHomeBtn = document.getElementById("setupBackHomeBtn");

// Setup DOM elements
const modeAi = document.getElementById("modeAi");
const modePvp = document.getElementById("modePvp");
const redNameInput = document.getElementById("redNameInput");
const blueNameInput = document.getElementById("blueNameInput");
const redAvatarsContainer = document.getElementById("redAvatars");
const blueAvatarsContainer = document.getElementById("blueAvatars");
const startGameBtn = document.getElementById("startGameBtn");

// Game HUD elements
const btnPauseGame = document.getElementById("btnPauseGame");
const gameHudLevel = document.getElementById("gameHudLevel");
const hudShieldCount = document.getElementById("hudShieldCount");
const pinRedRacer = document.getElementById("pinRedRacer");
const pinBlueRacer = document.getElementById("pinBlueRacer");
const raceTrackFill = document.getElementById("raceTrackFill");

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
const btnSetTrap = document.getElementById("btnSetTrap");
const trapChargesBadge = document.getElementById("trapChargesBadge");

const mainMessage = document.getElementById("mainMessage");
const hint = document.getElementById("hint");
const toast = document.getElementById("toast");

// Modals & Pause Menu
const pauseModal = document.getElementById("pauseModal");
const btnResumeGame = document.getElementById("btnResumeGame");
const btnRestartGame = document.getElementById("btnRestartGame");
const btnPauseSettings = document.getElementById("btnPauseSettings");
const btnQuitToMenu = document.getElementById("btnQuitToMenu");

const settingsModal = document.getElementById("settingsModal");
const modalSoundToggle = document.getElementById("modalSoundToggle");
const btnCloseSettings = document.getElementById("btnCloseSettings");

const muteBtn = document.getElementById("muteBtn");
const restartBtn = document.getElementById("restart");
const backBtn = document.getElementById("backBtn");
const modal = document.getElementById("modal");
const winnerTitle = document.getElementById("winner");
const playAgainBtn = document.getElementById("playAgain");
const btnReturnHome = document.getElementById("btnReturnHome");

// Punish Modal
const punishModal = document.getElementById("punishModal");
const btnPunishKo = document.getElementById("btnPunishKo");
const btnPunishPush = document.getElementById("btnPunishPush");
const btnPunishForgive = document.getElementById("btnPunishForgive");

// Level and Shape Selectors
const levelSelectorGroup = document.getElementById("levelSelectorGroup");
const shapeSelectorGroup = document.getElementById("shapeSelectorGroup");
const prevLevelBtn = document.getElementById("prevLevelBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const levelValue = document.getElementById("levelValue");
const levelHint = document.getElementById("levelHint");
const levelDiffBadge = document.getElementById("levelDiffBadge");

const prevShapeBtn = document.getElementById("prevShapeBtn");
const nextShapeBtn = document.getElementById("nextShapeBtn");
const shapeValue = document.getElementById("shapeValue");
const shapeHint = document.getElementById("shapeHint");
const levelPreviewCanvas = document.getElementById("levelPreviewCanvas");
const shapePreviewCanvas = document.getElementById("shapePreviewCanvas");

/* ==========================================================================
   SETUP SCREEN HANDLERS
   ========================================================================== */
let selectedRedAvatarIdx = 0;
let selectedBlueAvatarIdx = 1;

function getShapeName(level) {
  const families = [
    "Horizontal Serpentine", "Vertical Serpentine",
    "CW Square Spiral",     "CCW Square Spiral",
    "Diagonal Staircase",   "U-Shape Comb",
    "Zigzag Columns",       "Expanding L-Shapes",
    "Brick-Layer Grid",     "Diamond Serpentine",
    "Cross Winding",        "Triangle Stack",
    "Wave-Step",            "Tall Rectangle Spiral",
    "Figure-8 Loop",        "Maze Corridors",
    "Caterpillar",          "Tall Column Snake",
    "Double-Back Snake",    "Stacked Arches"
  ];
  const family = (level - 1) % 20;
  const variation = Math.floor((level - 1) / 20) % 10;
  return `${families[family]} v${variation + 1} (L${level})`;
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
    const soloFinish = getFinishForLevel(gameState.currentLevel);
    const lvl = gameState.currentLevel;
    levelValue.textContent = `Level ${lvl}`;

    // Feature progression indicator
    let unlockBadge = "NORMAL";
    let unlockSummary = "⚡ Speed Rush (Bonuses)";
    if (lvl >= 50) {
      unlockBadge = "COSMIC";
      unlockSummary = "🌌 Wormholes & All Hazards";
    } else if (lvl >= 40) {
      unlockBadge = "LEGEND";
      unlockSummary = "🛡️ Shields & Hazards";
    } else if (lvl >= 30) {
      unlockBadge = "ICE AGE";
      unlockSummary = "❄️ Freezes, Resets & Traps";
    } else if (lvl >= 20) {
      unlockBadge = "CHAOS";
      unlockSummary = "💥 Resets & Traps";
    } else if (lvl >= 10) {
      unlockBadge = "HAZARD";
      unlockSummary = "💀 Traps & Sabotage Ability";
    }

    if (levelDiffBadge) {
      levelDiffBadge.textContent = unlockBadge;
    }

    levelHint.textContent = `${getShapeName(lvl)} • ${unlockSummary} (${soloFinish} Tiles)`;
    drawMiniBoard("levelPreviewCanvas", gameState.currentLevel);
    
    // PVP Shape Selector Refresh
    const maxShapeUnlocked = Math.max(1, gameState.highestClearedLevel);
    const pvpFinish = getFinishForLevel(gameState.selectedShapeLevel);
    shapeValue.textContent = `L${gameState.selectedShapeLevel} (${pvpFinish} Tiles)`;
    shapeHint.textContent = `${getShapeName(gameState.selectedShapeLevel)} (Unlocked: 1 to ${maxShapeUnlocked})`;
    drawMiniBoard("shapePreviewCanvas", gameState.selectedShapeLevel);
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

  // Top Game Hub Switcher
  const tabHazardRush = document.getElementById("tabHazardRush");
  const tabCrossCaps = document.getElementById("tabCrossCaps");
  const tabArcadeMore = document.getElementById("tabArcadeMore");
  const panelHazardRush = document.getElementById("panelHazardRush");
  const panelCrossCaps = document.getElementById("panelCrossCaps");
  const panelArcadeMore = document.getElementById("panelArcadeMore");

  function switchGameTab(selectedTab, targetPanel) {
    [tabHazardRush, tabCrossCaps, tabArcadeMore].forEach(t => t && t.classList.remove("active"));
    [panelHazardRush, panelCrossCaps, panelArcadeMore].forEach(p => {
      if (p) {
        p.classList.remove("active");
        p.style.display = "none";
      }
    });

    if (selectedTab) selectedTab.classList.add("active");
    if (targetPanel) {
      targetPanel.classList.add("active");
      targetPanel.style.display = "flex";
    }
  }

  if (tabHazardRush) tabHazardRush.addEventListener("click", () => switchGameTab(tabHazardRush, panelHazardRush));
  if (tabCrossCaps) tabCrossCaps.addEventListener("click", () => switchGameTab(tabCrossCaps, panelCrossCaps));
  if (tabArcadeMore) tabArcadeMore.addEventListener("click", () => switchGameTab(tabArcadeMore, panelArcadeMore));

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
    gameState.players[0].html = AVATARS[selectedRedAvatarIdx].html;
    gameState.players[0].color = AVATARS[selectedRedAvatarIdx].color;

    gameState.players[1].name = blueNameInput.value.trim() || (gameState.mode === "ai" ? "AI COMP" : "BLUE PLAYER");
    gameState.players[1].emoji = AVATARS[selectedBlueAvatarIdx].emoji;
    gameState.players[1].html = AVATARS[selectedBlueAvatarIdx].html;
    gameState.players[1].color = AVATARS[selectedBlueAvatarIdx].color;

    // Load sound system
    GameSFX.init();

    // Toggle screens
    setupScreen.style.display = "none";
    backBtn.style.display = "flex";
    restartBtn.style.display = "flex";
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

  // Home Screen Navigations
  if (homePlayBtn) {
    homePlayBtn.addEventListener("click", () => {
      // Save configurations
      gameState.players[0].name = redNameInput.value.trim() || "RED RACER";
      gameState.players[0].emoji = AVATARS[selectedRedAvatarIdx].emoji;
      gameState.players[0].html = AVATARS[selectedRedAvatarIdx].html;
      gameState.players[0].color = AVATARS[selectedRedAvatarIdx].color;

      gameState.players[1].name = blueNameInput.value.trim() || (gameState.mode === "ai" ? "AI COMP" : "BLUE PLAYER");
      gameState.players[1].emoji = AVATARS[selectedBlueAvatarIdx].emoji;
      gameState.players[1].html = AVATARS[selectedBlueAvatarIdx].html;
      gameState.players[1].color = AVATARS[selectedBlueAvatarIdx].color;

      GameSFX.init();
      homeScreen.style.display = "none";
      gameScreen.style.opacity = "0";
      gameScreen.style.display = "flex";
      setTimeout(() => {
        gameScreen.style.transition = "opacity 0.4s ease";
        gameScreen.style.opacity = "1";
      }, 50);

      loadStats();
      resetGame();
    });
  }

  if (homeVsAiBtn) {
    homeVsAiBtn.addEventListener("click", () => {
      homeScreen.style.display = "none";
      setupScreen.style.display = "flex";
      switchGameTab(tabHazardRush, panelHazardRush);
      modeAi.click();
    });
  }

  if (homePassPlayBtn) {
    homePassPlayBtn.addEventListener("click", () => {
      homeScreen.style.display = "none";
      setupScreen.style.display = "flex";
      switchGameTab(tabHazardRush, panelHazardRush);
      modePvp.click();
    });
  }

  if (homeMoreModesBtn) {
    homeMoreModesBtn.addEventListener("click", () => {
      homeScreen.style.display = "none";
      setupScreen.style.display = "flex";
      switchGameTab(tabArcadeMore, panelArcadeMore);
    });
  }

  if (setupBackHomeBtn) {
    setupBackHomeBtn.addEventListener("click", () => {
      setupScreen.style.display = "none";
      homeScreen.style.display = "flex";
    });
  }

  // Run initial lobby selectors update
  updateLobbySelectors();
}

function renderAvatarGrid(container, playerKey, selectedIdx, onSelect) {
  container.innerHTML = "";
  AVATARS.forEach((av, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `avatar-option ${idx === selectedIdx ? "selected" : ""}`;
    btn.innerHTML = av.html;
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

function drawMiniBoard(canvasId, level) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctxMini = c.getContext("2d");
  
  const w = c.width;
  const h = c.height;
  ctxMini.clearRect(0, 0, w, h);
  
  const lvlFinish = getFinishForLevel(level);
  const gridData = generateGridShape(level, lvlFinish);
  const left = 20; const top = 20; const right = 20; const bottom = 20;
  
  const gridW = Math.max(1, gridData.maxX - gridData.minX);
  const gridH = Math.max(1, gridData.maxY - gridData.minY);
  
  ctxMini.beginPath();
  for (let i = 0; i <= lvlFinish; i++) {
    // Map grid points to mini canvas dimensions
    const normX = (gridData.pts[i].x - gridData.minX) / gridW;
    const normY = (gridData.pts[i].y - gridData.minY) / gridH;
    const px = left + normX * (w - left - right);
    const py = top + normY * (h - top - bottom);
    
    if (i === 0) ctxMini.moveTo(px, py);
    else ctxMini.lineTo(px, py);
  }
  ctxMini.lineWidth = 3;
  ctxMini.lineCap = "round";
  ctxMini.lineJoin = "round";
  ctxMini.strokeStyle = "rgba(0, 217, 255, 0.85)";
  ctxMini.stroke();
}

/* ==========================================================================
   BOARD GENERATION
   ========================================================================== */
function buildBoard() {
  const lvl = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
  buildBoardForLevel(lvl);
}

function generateGridShape(level, totalPoints) {
  let pts = [];
  const family = (level - 1) % 20;
  const variation = Math.floor((level - 1) / 20) % 10;

  if (family === 0) {
    // HORIZONTAL SERPENTINE (4-8 cols)
    const cols = 4 + (variation % 5);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / cols);
      const c = r % 2 === 0 ? (i % cols) : cols - 1 - (i % cols);
      pts.push({ x: c, y: -r });
    }
  } else if (family === 1) {
    // VERTICAL SERPENTINE (4-8 rows)
    const rows = 4 + (variation % 5);
    for (let i = 0; i <= totalPoints; i++) {
      const c = Math.floor(i / rows);
      const r = c % 2 === 0 ? (i % rows) : rows - 1 - (i % rows);
      pts.push({ x: c, y: -r });
    }
  } else if (family === 2) {
    // OUTWARD SQUARE SPIRAL (clockwise)
    let x = 0, y = 0, dx = 1, dy = 0, seg = 1, passed = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      x += dx; y += dy; passed++;
      if (passed === seg) {
        passed = 0;
        const tmp = dx; dx = dy; dy = -tmp;
        if (dy === 0) seg++;
      }
    }
  } else if (family === 3) {
    // INWARD/OUTWARD SQUARE SPIRAL (counter-clockwise)
    let x = 0, y = 0, dx = 1, dy = 0, seg = 1, passed = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      x += dx; y += dy; passed++;
      if (passed === seg) {
        passed = 0;
        const tmp = dx; dx = -dy; dy = tmp;
        if (dy === 0) seg++;
      }
    }
  } else if (family === 4) {
    // DIAGONAL STAIRCASE (alternates right and up without backtrack)
    const stepX = 1 + (variation % 3);
    const stepY = 1 + ((variation + 1) % 3);
    let x = 0, y = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      const phase = i % (stepX + stepY);
      if (phase < stepX) x += 1;
      else y -= 1;
    }
  } else if (family === 5) {
    // U-SHAPE COMB (progressive columns rising and dipping without overlapping)
    const armH = 3 + (variation % 4);
    let x = 0, y = 0, goingUp = true;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (goingUp) {
        y -= 1;
        if (Math.abs(y) >= armH) {
          goingUp = false;
          x += 1;
        }
      } else {
        y += 1;
        if (y >= 0) {
          goingUp = true;
          x += 1;
        }
      }
    }
  } else if (family === 6) {
    // ZIGZAG COLUMNS (progressive downward-upward serpent without backtrack)
    const colH = 3 + (variation % 5);
    let x = 0, y = 0, down = true;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (down) {
        y -= 1;
        if (-y >= colH) { down = false; x += 1; }
      } else {
        y += 1;
        if (y >= 0) { down = true; x += 1; }
      }
    }
  } else if (family === 7) {
    // EXPANDING L-SHAPES (Staircase blocks extending right and up progressively)
    const span = 3 + (variation % 4);
    let x = 0, y = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if ((i % (span * 2)) < span) {
        x += 1;
      } else {
        y -= 1;
      }
    }
  } else if (family === 8) {
    // BRICK-LAYER OFFSET ROWS
    const cols = 5 + (variation % 4);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / cols);
      const c = r % 2 === 0 ? (i % cols) : cols - 1 - (i % cols);
      pts.push({ x: c * 2, y: -r * 2 });
    }
  } else if (family === 9) {
    // DIAMOND GRID SERPENTINE
    const cols = 4 + (variation % 4);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / cols);
      const c = r % 2 === 0 ? (i % cols) : cols - 1 - (i % cols);
      pts.push({ x: c * 2 + (r % 2), y: -r * 2 });
    }
  } else if (family === 10) {
    // CROSS WINDING PATH (advances rightwards with up/down wings)
    const wingH = 2 + (variation % 3);
    let x = 0, y = 0, mode = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (mode === 0) {
        y -= 1;
        if (-y >= wingH) { mode = 1; x += 1; }
      } else if (mode === 1) {
        y += 1;
        if (y >= 0) { mode = 2; x += 1; }
      } else if (mode === 2) {
        y += 1;
        if (y >= wingH) { mode = 3; x += 1; }
      } else {
        y -= 1;
        if (y <= 0) { mode = 0; x += 1; }
      }
    }
  } else if (family === 11) {
    // TRIANGLE STACKING SERPENTINE
    const cols = 5 + (variation % 3);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / cols);
      const c = r % 2 === 0 ? (i % cols) : cols - 1 - (i % cols);
      pts.push({ x: c + Math.floor(r / 2), y: -r });
    }
  } else if (family === 12) {
    // WAVE-STEP (progressive horizontal sine wave without backtracking)
    const waveH = 2 + (variation % 3);
    let x = 0, y = 0, goingDown = false;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      x += 1;
      if (goingDown) {
        y += 1;
        if (y >= waveH) goingDown = false;
      } else {
        y -= 1;
        if (y <= -waveH) goingDown = true;
      }
    }
  } else if (family === 13) {
    // TALL RECTANGULAR EXPANDING SPIRAL
    let x = 0, y = 0, dx = 1, dy = 0, w = 1, h = 2, seg = w, passed = 0, isW = true;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      x += dx; y += dy; passed++;
      if (passed >= seg) {
        passed = 0;
        const tmp = dx; dx = dy; dy = -tmp;
        isW = !isW;
        if (isW) { w++; h++; }
        seg = isW ? w : h;
      }
    }
  } else if (family === 14) {
    // FIGURE-8 DOUBLE ARCH CHAIN (moves progressive rightward in dual loops)
    const loopH = 2 + (variation % 3);
    let x = 0, y = 0, state = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (state === 0) {
        y -= 1; if (-y >= loopH) { state = 1; x += 1; }
      } else if (state === 1) {
        x += 1; state = 2;
      } else if (state === 2) {
        y += 1; if (y >= 0) { state = 3; x += 1; }
      } else if (state === 3) {
        y += 1; if (y >= loopH) { state = 4; x += 1; }
      } else if (state === 4) {
        x += 1; state = 5;
      } else {
        y -= 1; if (y <= 0) { state = 0; x += 1; }
      }
    }
  } else if (family === 15) {
    // MAZE CORRIDORS (horizontal runways linked by vertical shifts)
    const runW = 4 + (variation % 4);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / runW);
      const c = r % 2 === 0 ? (i % runW) : (runW - 1 - (i % runW));
      pts.push({ x: c, y: -r * 2 });
    }
  } else if (family === 16) {
    // CATERPILLAR (wavy inchworm moving forward)
    const humpW = 3 + (variation % 3);
    let x = 0, y = 0, upward = true;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      x += 1;
      if (upward) {
        y -= 1;
        if (-y >= humpW) upward = false;
      } else {
        y += 1;
        if (y >= 0) upward = true;
      }
    }
  } else if (family === 17) {
    // TALL COLUMNS SERPENTINE (narrow vertical climbs)
    const colH = 6 + (variation % 5);
    for (let i = 0; i <= totalPoints; i++) {
      const c = Math.floor(i / colH);
      const r = c % 2 === 0 ? (i % colH) : (colH - 1 - (i % colH));
      pts.push({ x: c, y: -r });
    }
  } else if (family === 18) {
    // DOUBLE-BACK SNAKE (progressive stepped ramp without overlapping)
    const rampW = 4 + (variation % 4);
    let x = 0, y = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (i % rampW === rampW - 1) {
        y -= 1;
        x += 1;
      } else {
        x += 1;
      }
    }
  } else {
    // family === 19: STACKED ARCHES
    const archW = 4 + (variation % 4);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / archW);
      const c = r % 2 === 0 ? (i % archW) : archW - 1 - (i % archW);
      pts.push({ x: c, y: -r * 2 });
    }
  }

  // --- STRICT SELF-AVOIDING COLLISION RESOLUTION ---
  // Guarantees 100% that no two spaces ever share the same (x, y) coordinate
  const resolvedPts = [];
  const occupied = new Set();

  pts.forEach((pt, idx) => {
    let curX = pt.x;
    let curY = pt.y;
    let key = `${curX},${curY}`;

    if (!occupied.has(key)) {
      occupied.add(key);
      resolvedPts.push({ x: curX, y: curY });
      return;
    }

    // Coordinate collision detected! Find the nearest unoccupied neighbor
    const prevPt = resolvedPts[idx - 1] || { x: curX, y: curY };
    const candidates = [
      { x: curX + 1, y: curY },
      { x: curX, y: curY - 1 },
      { x: curX - 1, y: curY },
      { x: curX, y: curY + 1 },
      { x: curX + 1, y: curY - 1 },
      { x: curX - 1, y: curY - 1 }
    ];

    let found = false;
    for (const cand of candidates) {
      const candKey = `${cand.x},${cand.y}`;
      if (!occupied.has(candKey)) {
        occupied.add(candKey);
        resolvedPts.push({ x: cand.x, y: cand.y });
        found = true;
        break;
      }
    }

    if (!found) {
      let radius = 2;
      while (!found && radius < 20) {
        for (let dx = -radius; dx <= radius && !found; dx++) {
          for (let dy = -radius; dy <= radius && !found; dy++) {
            const candKey = `${curX + dx},${curY + dy}`;
            if (!occupied.has(candKey)) {
              occupied.add(candKey);
              resolvedPts.push({ x: curX + dx, y: curY + dy });
              found = true;
            }
          }
        }
        radius++;
      }
    }
  });

  // Find bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  resolvedPts.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  return { pts: resolvedPts, minX, maxX, minY, maxY };
}

function buildBoardForLevel(level) {
  gameState.spaces = [];
  const width = canvas.width;
  const finish = getFinishForLevel(level);
  
  // Generate clean non-overlapping grid path
  const gridData = generateGridShape(level, finish);
  const gridPts = gridData.pts;
  
  // 1. Generate Specials deterministically with Gradual Level Progression:
  // L1-9:   Beginner Rush (Bonuses only)
  // L10+:   Traps & "Set Trap" Sabotage unlocked
  // L20+:   Resets unlocked
  // L30+:   Freezes unlocked
  // L40+:   Shields unlocked
  // L50+:   Portals/Wormholes unlocked
  gameState.levelSpecials = {};
  let seed = level * 17;
  const nextRand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const numBonuses = Math.max(1, 4 - Math.floor(level / 150));
  const numTraps = level >= 10 ? Math.min(6, 2 + Math.floor((level - 10) / 40)) : 0;
  const numResets = level >= 20 ? Math.min(4, 1 + Math.floor((level - 20) / 30)) : 0;
  const numFreezes = level >= 30 ? Math.min(3, 1 + Math.floor((level - 30) / 50)) : 0;
  const numShields = level >= 40 ? Math.min(3, 1 + Math.floor((level - 40) / 50)) : 0;
  const numWormholes = level >= 50 ? Math.min(2, 1 + Math.floor((level - 50) / 60)) : 0;

  const takenIndices = new Set([0, finish]);

  function getUniqueIdx() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const idx = 3 + Math.floor(nextRand() * (finish - 5));
      if (!takenIndices.has(idx)) {
        takenIndices.add(idx);
        return idx;
      }
    }
    return -1;
  }

  // Generate bonuses, traps, resets, freezes, shields, wormholes based on unlock level
  for (let b = 0; b < numBonuses; b++) {
    const idx = getUniqueIdx();
    if (idx !== -1) {
      const bonusVal = nextRand() < 0.5 ? 5 : 10;
      gameState.levelSpecials[idx] = { type: "bonus", label: `⚡ +${bonusVal}`, effect: bonusVal, color: "#10e394" };
    }
  }
  for (let t = 0; t < numTraps; t++) { 
    const idx = getUniqueIdx(); 
    if (idx !== -1) { 
      const vals = [-2, -3, -5, -8, -10]; 
      const val = vals[Math.floor(nextRand() * Math.min(5, 1 + Math.floor(level / 50)))]; 
      gameState.levelSpecials[idx] = { type: "trap", label: `💀 ${val}`, effect: val, color: "#ff7e36" }; 
    } 
  }
  for (let r = 0; r < numResets; r++) { 
    const idx = getUniqueIdx(); 
    if (idx !== -1) gameState.levelSpecials[idx] = { type: "reset", label: "💥 RESET", effect: -idx, color: "#ff3a5c" }; 
  }
  for (let f = 0; f < numFreezes; f++) { 
    const idx = getUniqueIdx(); 
    if (idx !== -1) gameState.levelSpecials[idx] = { type: "freeze", label: "❄️ FREEZE", effect: 0, color: "#00b8ff" }; 
  }
  for (let s = 0; s < numShields; s++) { 
    const idx = getUniqueIdx(); 
    if (idx !== -1) gameState.levelSpecials[idx] = { type: "shield", label: "🛡️ SHIELD", effect: 0, color: "#00e1ff" }; 
  }
  for (let w = 0; w < numWormholes; w++) { 
    const idx = getUniqueIdx(); 
    if (idx !== -1) gameState.levelSpecials[idx] = { type: "wormhole", label: "🌌 WORMHOLE", effect: 0, color: "#9d00ff" }; 
  }

  // Auto-Scale to prevent cramping using perfect grid distances
  const TILE_SPACING = 85;
  const paddingX = 80;
  const paddingY = 80;
  
  const gridWidth = gridData.maxX - gridData.minX;
  const gridHeight = gridData.maxY - gridData.minY;
  
  gameState.virtualWidth = (gridWidth * TILE_SPACING) + paddingX * 2;
  gameState.virtualHeight = (gridHeight * TILE_SPACING) + paddingY * 2;
  
  for (let i = 0; i <= finish; i++) {
    const px = paddingX + (gridPts[i].x - gridData.minX) * TILE_SPACING;
    const py = paddingY + (gridPts[i].y - gridData.minY) * TILE_SPACING;
    
    let type = "normal";
    let label = "";
    let color = "#1e293b";

    if (gameState.levelSpecials[i]) {
      type = gameState.levelSpecials[i].type;
      label = gameState.levelSpecials[i].label;
      color = gameState.levelSpecials[i].color;
    } else if (i === 0) {
      type = "start";
      label = "START";
      color = "#00b8ff";
    } else if (i === finish) {
      type = "finish";
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
function updateCamera() {
  const active = gameState.players[gameState.currentPlayer];
  if (!active || gameState.spaces.length === 0) return;

  const W = canvas.width;
  const H = canvas.height;
  
  // Calculate scaled viewport size
  const viewW = W;
  const viewH = H;
  
  // We want to center the player
  let desiredX = active.visualX - viewW / 2;
  let desiredY = active.visualY - viewH / 2;
  
  // Clamp camera so we don't expose too much black void
  const maxScrollX = Math.max(0, (gameState.virtualWidth || W) - viewW);
  const maxScrollY = Math.max(0, (gameState.virtualHeight || H) - viewH);
  
  desiredX = Math.max(0, Math.min(desiredX, maxScrollX));
  desiredY = Math.max(0, Math.min(desiredY, maxScrollY));

  camera.targetX = desiredX;
  camera.targetY = desiredY;

  // Smooth lerp camera pan
  camera.x += (camera.targetX - camera.x) * 0.08;
  camera.y += (camera.targetY - camera.y) * 0.08;
}

function renderLoop() {
  resizeCanvasToContainer();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update camera first
  updateCamera();

  ctx.save();

  // Apply Screen Shake
  if (gameState.screenShake > 0.1) {
    const dx = (Math.random() - 0.5) * gameState.screenShake;
    const dy = (Math.random() - 0.5) * gameState.screenShake;
    ctx.translate(dx, dy);
    gameState.screenShake *= 0.88;
  }

  // Apply Camera Panning
  ctx.translate(-camera.x, -camera.y);

  // Expand clipping region to draw a larger virtual canvas
  const OVERFLOW = 200; // extra pixels drawn above/below for panning headroom
  drawBoardBackgroundDecor(OVERFLOW);

  drawTrail();
  drawSpaces();
  updateAndDrawTokens();
  updateParticles();
  drawParticles();

  ctx.restore();

  requestAnimationFrame(renderLoop);
}

function resizeCanvasToContainer() {
  const boardWrapper = document.getElementById("boardWrapper");
  if (!boardWrapper) return;
  const rect = boardWrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const newW = Math.max(320, Math.floor(rect.width || 380));
  const newH = Math.max(320, Math.floor(rect.height || 460));
  if (canvas.width !== newW || canvas.height !== newH) {
    canvas.width = newW;
    canvas.height = newH;
  }
}

function getLevelTheme(level) {
  const lvl = Math.max(1, parseInt(level) || 1);
  if (lvl < 10) {
    // Level 1-9: Emerald Dawn (Relaxing Cyan & Deep Emerald)
    return {
      name: "Emerald Dawn",
      bgGrad: ["#020c12", "#051e24", "#03282c", "#010e14"],
      nebula1: { r: 16, g: 185, b: 129, a1: 0.16, a2: 0.05 },
      nebula2: { r: 0, g: 217, b: 255, a1: 0.14, a2: 0.04 },
      nebula3: { r: 52, g: 211, b: 153, a1: 0.10, a2: 0.03 },
      starTint: [140, 240, 220]
    };
  } else if (lvl < 20) {
    // Level 10-19: Amber Solar (Warm Relaxing Amber Nebula)
    return {
      name: "Amber Solar",
      bgGrad: ["#120703", "#220e06", "#2a1508", "#0f0502"],
      nebula1: { r: 255, g: 140, b: 0, a1: 0.17, a2: 0.05 },
      nebula2: { r: 255, g: 201, b: 40, a1: 0.13, a2: 0.04 },
      nebula3: { r: 217, g: 119, b: 6, a1: 0.09, a2: 0.03 },
      starTint: [255, 225, 170]
    };
  } else if (lvl < 30) {
    // Level 20-29: Crimson Chaos / Nebula (Ruby & Rose Velvet)
    return {
      name: "Crimson Aurora",
      bgGrad: ["#13040a", "#260814", "#2c0a1a", "#0e0308"],
      nebula1: { r: 255, g: 64, b: 88, a1: 0.16, a2: 0.05 },
      nebula2: { r: 236, g: 72, b: 153, a1: 0.14, a2: 0.04 },
      nebula3: { r: 180, g: 30, b: 90, a1: 0.10, a2: 0.03 },
      starTint: [255, 190, 210]
    };
  } else if (lvl < 40) {
    // Level 30-39: Ice Aurora (Glacial Cobalt & Crystal Blue)
    return {
      name: "Ice Aurora",
      bgGrad: ["#020914", "#06182c", "#08203a", "#020712"],
      nebula1: { r: 22, g: 139, b: 255, a1: 0.18, a2: 0.06 },
      nebula2: { r: 125, g: 211, b: 252, a1: 0.15, a2: 0.05 },
      nebula3: { r: 14, g: 165, b: 233, a1: 0.11, a2: 0.03 },
      starTint: [190, 235, 255]
    };
  } else if (lvl < 50) {
    // Level 40-49: Violet Cosmos (Royal Amethyst & Deep Indigo)
    return {
      name: "Violet Cosmos",
      bgGrad: ["#090314", "#150826", "#1c0b33", "#06020f"],
      nebula1: { r: 139, g: 77, b: 255, a1: 0.18, a2: 0.06 },
      nebula2: { r: 192, g: 132, b: 252, a1: 0.14, a2: 0.04 },
      nebula3: { r: 99, g: 102, b: 241, a1: 0.11, a2: 0.03 },
      starTint: [220, 195, 255]
    };
  } else {
    // Level 50+: Starlight Abyss (Prismatic Galaxy)
    return {
      name: "Starlight Abyss",
      bgGrad: ["#02040b", "#090d1f", "#11142e", "#03040c"],
      nebula1: { r: 0, g: 217, b: 255, a1: 0.18, a2: 0.06 },
      nebula2: { r: 168, g: 85, b: 247, a1: 0.16, a2: 0.05 },
      nebula3: { r: 234, g: 179, b: 8, a1: 0.10, a2: 0.03 },
      starTint: [255, 255, 255]
    };
  }
}

function drawBoardBackgroundDecor(overflow = 0) {
  // Ensure full coverage across camera coordinates and screen viewport
  const minDrawX = -200;
  const maxDrawX = Math.max(canvas.width, (gameState.virtualWidth || canvas.width)) + 200;
  const W = maxDrawX - minDrawX;
  const minDrawY = -overflow;
  const maxDrawY = Math.max(canvas.height, (gameState.virtualHeight || canvas.height)) + overflow;
  const H = maxDrawY - minDrawY;
  const offX = minDrawX;
  const offY = minDrawY;
  const time = Date.now() * 0.0008;

  const currentLevel = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
  const theme = getLevelTheme(currentLevel);

  ctx.save();

  // 1. Dynamic Level Atmosphere Gradient
  const bgGrad = ctx.createLinearGradient(offX, offY, offX + W, offY + H);
  bgGrad.addColorStop(0, theme.bgGrad[0]);
  bgGrad.addColorStop(0.35, theme.bgGrad[1]);
  bgGrad.addColorStop(0.7, theme.bgGrad[2]);
  bgGrad.addColorStop(1, theme.bgGrad[3]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(offX, offY, W, H);

  // 2. Primary Flowing Aurora Nebulae
  const n1 = theme.nebula1;
  const neb1 = ctx.createRadialGradient(
    offX + W * 0.72 + Math.sin(time * 0.45) * 40, 
    offY + H * 0.25 + Math.cos(time * 0.55) * 35, 
    30, 
    offX + W * 0.72, 
    offY + H * 0.25, 
    W * 0.65
  );
  neb1.addColorStop(0, `rgba(${n1.r}, ${n1.g}, ${n1.b}, ${n1.a1})`);
  neb1.addColorStop(0.55, `rgba(${n1.r}, ${n1.g}, ${n1.b}, ${n1.a2})`);
  neb1.addColorStop(1, "transparent");
  ctx.fillStyle = neb1;
  ctx.fillRect(offX, offY, W, H);

  // Calming Secondary Nebula
  const n2 = theme.nebula2;
  const neb2 = ctx.createRadialGradient(
    offX + W * 0.28 + Math.cos(time * 0.38) * 45, 
    offY + H * 0.6 + Math.sin(time * 0.48) * 35, 
    25, 
    offX + W * 0.28, 
    offY + H * 0.6, 
    W * 0.6
  );
  neb2.addColorStop(0, `rgba(${n2.r}, ${n2.g}, ${n2.b}, ${n2.a1})`);
  neb2.addColorStop(0.55, `rgba(${n2.r}, ${n2.g}, ${n2.b}, ${n2.a2})`);
  neb2.addColorStop(1, "transparent");
  ctx.fillStyle = neb2;
  ctx.fillRect(offX, offY, W, H);

  // Deep Ambient Glow
  const n3 = theme.nebula3;
  const neb3 = ctx.createRadialGradient(
    offX + W * 0.6 + Math.sin(time * 0.3) * 30, 
    offY + H * 0.88, 
    20, 
    offX + W * 0.6, 
    offY + H * 0.88, 
    W * 0.55
  );
  neb3.addColorStop(0, `rgba(${n3.r}, ${n3.g}, ${n3.b}, ${n3.a1})`);
  neb3.addColorStop(0.6, `rgba(${n3.r}, ${n3.g}, ${n3.b}, ${n3.a2})`);
  neb3.addColorStop(1, "transparent");
  ctx.fillStyle = neb3;
  ctx.fillRect(offX, offY, W, H);

  // 3. Subtle Relaxing Silk Grid / Constellation Guide Lines
  ctx.strokeStyle = `rgba(${n2.r}, ${n2.g}, ${n2.b}, 0.025)`;
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = offX; x < offX + W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, offY);
    ctx.lineTo(x, offY + H);
    ctx.stroke();
  }
  for (let y = offY; y < offY + H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(offX, y);
    ctx.lineTo(offX + W, y);
    ctx.stroke();
  }

  // 4. Undulating Aurora Ribbons (Silky ambient glow across full width)
  ctx.save();
  for (let r = 0; r < 2; r++) {
    ctx.beginPath();
    const ribbonBaseY = offY + H * (0.32 + r * 0.34);
    ctx.moveTo(offX, ribbonBaseY);
    for (let px = offX; px <= offX + W; px += 25) {
      const waveY = Math.sin(((px - offX) * 0.007) + (time * 1.1) + (r * 2.2)) * 22 +
                    Math.cos(((px - offX) * 0.013) - (time * 0.75)) * 12;
      ctx.lineTo(px, ribbonBaseY + waveY);
    }
    ctx.lineTo(offX + W, offY + H);
    ctx.lineTo(offX, offY + H);
    ctx.closePath();

    const ribbonGrad = ctx.createLinearGradient(offX, ribbonBaseY - 25, offX, ribbonBaseY + 70);
    const cr = r === 0 ? n2 : n1;
    ribbonGrad.addColorStop(0, `rgba(${cr.r}, ${cr.g}, ${cr.b}, 0.05)`);
    ribbonGrad.addColorStop(1, "transparent");
    ctx.fillStyle = ribbonGrad;
    ctx.fill();
  }
  ctx.restore();

  // 5. Gentle Floating Stardust & Shimmering Constellations
  const tint = theme.starTint;
  for (let i = 0; i < 54; i++) {
    const seedX = offX + (((i * 83 + 29) % W + W) % W);
    const driftY = (time * 11 * ((i % 3) + 1)) % H;
    const seedY = offY + (((i * 149 + driftY) % H + H) % H);
    const pulse = 0.35 + 0.65 * Math.sin(time * 2.3 + i * 1.6);
    const starR = (i % 6 === 0) ? 1.7 : (i % 4 === 0 ? 1.2 : 0.75);

    ctx.beginPath();
    ctx.arc(seedX, seedY, starR, 0, Math.PI * 2);
    if (i % 3 === 0) {
      ctx.fillStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${pulse * 0.85})`;
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.75})`;
    }
    ctx.fill();

    // Occasional soft cross shimmer
    if (i % 9 === 0) {
      ctx.strokeStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${pulse * 0.4})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(seedX - 3.5, seedY);
      ctx.lineTo(seedX + 3.5, seedY);
      ctx.moveTo(seedX, seedY - 3.5);
      ctx.lineTo(seedX, seedY + 3.5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawTrail() {
  if (gameState.spaces.length === 0) return;

  // Outer fat glow track
  ctx.save();
  ctx.beginPath();
  gameState.spaces.forEach((sp, idx) => {
    if (idx === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  });
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(200,80,255,0.07)";
  ctx.shadowBlur = 28;
  ctx.shadowColor = "rgba(200,80,255,0.2)";
  ctx.stroke();

  // Mid glow track
  ctx.beginPath();
  gameState.spaces.forEach((sp, idx) => {
    if (idx === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  });
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(0,184,255,0.08)";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(0,184,255,0.2)";
  ctx.stroke();

  // Crisp inner white track
  ctx.beginPath();
  gameState.spaces.forEach((sp, idx) => {
    if (idx === 0) ctx.moveTo(sp.x, sp.y);
    else ctx.lineTo(sp.x, sp.y);
  });
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();
}

function drawSpaces() {
  const TILE_W = 38;
  const TILE_H = 38;
  const CORNER_R = 9;

  gameState.spaces.forEach((space, index) => {
    ctx.save();
    const isSpecial = space.type !== "normal";

    // 1. Ground soft drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(space.x, space.y + 10, TILE_W / 2 + 2, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fill();
    ctx.restore();

    // 2. Tile colors & glowing style
    let mainColor, rimColor, glowColor;
    if (space.type === "start") {
      mainColor = "#20E878"; rimColor = "#77FFAE"; glowColor = "rgba(32, 232, 120, 0.7)";
    } else if (space.type === "finish") {
      mainColor = "#FFC928"; rimColor = "#FFF385"; glowColor = "rgba(255, 201, 40, 0.8)";
    } else if (space.type === "bonus") {
      mainColor = "#00D9FF"; rimColor = "#9EFAFF"; glowColor = "rgba(0, 217, 255, 0.75)";
    } else if (space.type === "trap") {
      mainColor = "#FF7A00"; rimColor = "#FFA856"; glowColor = "rgba(255, 122, 0, 0.75)";
    } else if (space.type === "reset") {
      mainColor = "#FF4058"; rimColor = "#FFA4B0"; glowColor = "rgba(255, 64, 88, 0.8)";
    } else if (space.type === "freeze") {
      mainColor = "#168BFF"; rimColor = "#82C3FF"; glowColor = "rgba(22, 139, 255, 0.7)";
    } else if (space.type === "shield") {
      mainColor = "#00D9FF"; rimColor = "#FFFFFF"; glowColor = "rgba(0, 217, 255, 0.85)";
    } else if (space.type === "wormhole") {
      mainColor = "#8B4DFF"; rimColor = "#D4B0FF"; glowColor = "rgba(139, 77, 255, 0.8)";
    } else {
      mainColor = "#101A32"; rimColor = "rgba(0, 217, 255, 0.2)"; glowColor = null;
    }

    const x = space.x - TILE_W / 2;
    const y = space.y - TILE_H / 2;
    const depth = 5;

    // Bottom bevel depth block
    ctx.beginPath();
    ctx.roundRect(x, y + depth, TILE_W, TILE_H, CORNER_R);
    ctx.fillStyle = isSpecial ? darken(mainColor, 60) : "#080E1C";
    ctx.fill();

    // Top face with neon glow if special
    ctx.beginPath();
    ctx.roundRect(x, y, TILE_W, TILE_H, CORNER_R);
    if (isSpecial) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = glowColor;
    } else {
      ctx.shadowBlur = 0;
    }

    // Top face gradient
    const topGrad = ctx.createLinearGradient(x, y, x, y + TILE_H);
    if (isSpecial) {
      topGrad.addColorStop(0, lighten(mainColor, 40));
      topGrad.addColorStop(0.5, mainColor);
      topGrad.addColorStop(1, darken(mainColor, 25));
    } else {
      topGrad.addColorStop(0, "#19284D");
      topGrad.addColorStop(0.5, "#101A32");
      topGrad.addColorStop(1, "#0B1224");
    }
    ctx.fillStyle = topGrad;
    ctx.fill();

    // Glowing border rim
    ctx.lineWidth = isSpecial ? 2 : 1.2;
    ctx.strokeStyle = rimColor;
    ctx.stroke();
    ctx.restore();

    // 3. Icons / Numbers rendering
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (space.type === "start") {
      ctx.font = "900 8px 'Outfit', sans-serif";
      ctx.fillStyle = "#050816";
      ctx.fillText("START", space.x, space.y);
    } else if (space.type === "finish") {
      ctx.font = "900 13px 'Font Awesome 6 Free'";
      ctx.fillStyle = "#050816";
      ctx.fillText("\uf091", space.x, space.y); // Trophy
    } else if (space.type === "bonus") {
      const val = (space.label.match(/\d+/) || [""])[0];
      ctx.font = "900 10px 'Fredoka One', cursive";
      ctx.fillStyle = "#050816";
      ctx.fillText("+" + val, space.x, space.y);
    } else if (space.type === "trap") {
      const val = (space.label.match(/-?\d+/) || [""])[0];
      ctx.font = "900 10px 'Fredoka One', cursive";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(val, space.x, space.y);
    } else if (space.type === "reset") {
      ctx.font = "900 7.5px 'Fredoka One', cursive";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("RESET", space.x, space.y);
    } else if (space.type === "shield") {
      ctx.font = "900 13px 'Font Awesome 6 Free'";
      ctx.fillStyle = "#050816";
      ctx.fillText("\uf3ed", space.x, space.y); // shield-halved
    } else if (space.type === "wormhole") {
      ctx.font = "900 13px 'Font Awesome 6 Free'";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("\uf5d2", space.x, space.y); // atom / portal swirl
    } else if (space.type === "freeze") {
      ctx.font = "900 12px 'Font Awesome 6 Free'";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("\uf2dc", space.x, space.y); // snowflake
    } else {
      ctx.font = "800 10px 'Outfit', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(index.toString(), space.x, space.y);
    }
    ctx.restore();
  });
}

// Color helpers
function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `rgb(${r},${g},${b})`;
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
    player.visualX = player.visualX * 0.78 + player.targetX * 0.22;
    player.visualY = player.visualY * 0.78 + player.targetY * 0.22;

    const isActive = gameState.currentPlayer === idx && !gameState.gameOver;
    const TOKEN_R = 16;
    const bob = Math.sin((Date.now() / 250) + (idx * Math.PI)) * 2;
    const drawY = player.visualY + bob;

    ctx.save();

    // Big outer glow ring for active player
    if (isActive) {
      ctx.beginPath();
      ctx.arc(player.visualX, drawY, TOKEN_R + 7, 0, Math.PI * 2);
      ctx.strokeStyle = player.color + "55";
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = player.color;
      ctx.stroke();
    }
    
    // Shield Aura
    if (player.hasShield) {
      ctx.beginPath();
      ctx.arc(player.visualX, drawY, TOKEN_R + 10, 0, Math.PI * 2);
      ctx.strokeStyle = "#00d9ff";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#00d9ff";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Drop shadow
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(player.visualX, player.visualY + 12, TOKEN_R, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();

    // Token glow aura
    ctx.shadowBlur = isActive ? 28 : 14;
    ctx.shadowColor = player.color;

    // 3D sphere gradient
    const grad = ctx.createRadialGradient(
      player.visualX - 5, drawY - 5, 1,
      player.visualX, drawY, TOKEN_R
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.25, lighten(player.color, 50));
    grad.addColorStop(0.7, player.color);
    grad.addColorStop(1, darken(player.color, 60));

    ctx.beginPath();
    ctx.arc(player.visualX, drawY, TOKEN_R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Bright rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.restore();

    // FontAwesome Icon
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '900 13px "Font Awesome 6 Free"';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(player.emoji, player.visualX, drawY + 1);
    ctx.restore();

    // Embers spawned at token when player is active
    if (gameState.currentPlayer === idx && !gameState.gameOver && Math.random() < 0.12) {
      gameState.particles.push({
        x: player.visualX,
        y: drawY,
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

  // Progress Bar calculations
  const p1Pct = (p1.position / FINISH) * 100;
  const p2Pct = (p2.position / FINISH) * 100;
  if (redProgress) redProgress.style.width = `${p1Pct}%`;
  if (blueProgress) blueProgress.style.width = `${p2Pct}%`;

  if (pinRedRacer) pinRedRacer.style.left = `${Math.min(92, (p1.position / FINISH) * 92)}%`;
  if (pinBlueRacer) pinBlueRacer.style.left = `${Math.min(92, (p2.position / FINISH) * 92)}%`;
  if (raceTrackFill) raceTrackFill.style.width = `${(Math.max(p1.position, p2.position) / FINISH) * 100}%`;

  // Active shields in HUD
  if (hudShieldCount) {
    hudShieldCount.textContent = (p1.hasShield ? 1 : 0) + (p2.hasShield ? 1 : 0);
  }

  // Level badge and HUD level title
  const activeLevel = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
  if (gameHudLevel) {
    gameHudLevel.textContent = gameState.mode === "ai" ? `Level ${activeLevel}` : `Arena L${activeLevel}`;
  }
  const lvlBadge = document.getElementById("levelBadge");
  if (lvlBadge) lvlBadge.textContent = `LVL ${activeLevel}`;

  // Text values
  redNameCard.textContent = p1.name;
  blueNameCard.textContent = p2.name;
  redAvatarBadge.innerHTML = p1.html;
  blueAvatarBadge.innerHTML = p2.html;
  
  // Shield badges
  const redShield = document.getElementById("redShieldBadge");
  if (redShield) redShield.style.display = p1.hasShield ? "inline-block" : "none";
  const blueShield = document.getElementById("blueShieldBadge");
  if (blueShield) blueShield.style.display = p2.hasShield ? "inline-block" : "none";

  // Turn status banner
  const activePlayer = gameState.players[gameState.currentPlayer];
  if (turnBullet) {
    turnBullet.style.background = activePlayer.color;
    turnBullet.style.boxShadow = `0 0 8px ${activePlayer.color}`;
  }
  if (turnName) {
    turnName.innerHTML = `${activePlayer.html} ${activePlayer.name}'S TURN`;
  }

  if (gameState.gameOver) {
    if (turnStatus) turnStatus.textContent = "GAME OVER";
  } else if (gameState.busy) {
    if (turnStatus) turnStatus.textContent = "MOVING...";
  } else {
    if (turnStatus) {
      turnStatus.textContent = gameState.mode === "ai" && gameState.currentPlayer === 1 ? "AI THINKING..." : "TAP DICE";
    }
  }

  // Tactical "SET TRAP" button state
  if (btnSetTrap) {
    const activeLevel = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
    const isHuman = (gameState.currentPlayer === 0) || (gameState.mode === "pvp");
    
    // Feature unlocks at Level 10+
    if (activeLevel >= 10 && !gameState.gameOver) {
      btnSetTrap.style.display = "flex";
      const charges = activePlayer.trapCharges || 0;
      if (trapChargesBadge) trapChargesBadge.textContent = charges;
      
      const canUse = isHuman && charges > 0 && !gameState.busy && !activePlayer.hasUsedTrapThisTurn;
      btnSetTrap.classList.toggle("disabled", !canUse);
    } else {
      btnSetTrap.style.display = "none";
    }
  }
}

async function activateSetTrap(isAi = false) {
  if (gameState.busy || gameState.gameOver) return;
  const activeLevel = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
  if (activeLevel < 10) return;

  const player = gameState.players[gameState.currentPlayer];
  const opponentIdx = gameState.currentPlayer === 0 ? 1 : 0;
  const opponent = gameState.players[opponentIdx];

  if ((player.trapCharges || 0) <= 0 || player.hasUsedTrapThisTurn) return;

  // Decide target tile: place right behind opponent, or at opponent's next step
  let targetTile = Math.max(1, opponent.position - 1);
  if (targetTile === 0) targetTile = Math.min(FINISH - 1, opponent.position + 1);
  if (targetTile >= FINISH) targetTile = FINISH - 1;

  // If tile already has a finish or start, nudge
  if (targetTile === 0 || targetTile === FINISH) targetTile = Math.max(1, FINISH - 2);

  // Consume charge
  player.trapCharges--;
  player.hasUsedTrapThisTurn = true;

  // Place Trap on board
  const trapVal = -3;
  gameState.levelSpecials[targetTile] = {
    type: "trap",
    label: `💀 ${trapVal}`,
    effect: trapVal,
    color: "#ff7a00"
  };

  if (gameState.spaces[targetTile]) {
    gameState.spaces[targetTile].type = "trap";
    gameState.spaces[targetTile].label = `💀 ${trapVal}`;
    gameState.spaces[targetTile].color = "#ff7a00";
    
    // Spawn burst effects at target tile
    spawnParticles(gameState.spaces[targetTile].x, gameState.spaces[targetTile].y, "#ff7a00", 25);
  }

  GameSFX.play("trap");
  triggerScreenShake(8);

  const actorName = isAi ? "AI" : player.name;
  showToast(`💥 ${actorName} deployed a trap at tile #${targetTile}!`);
  floatingText(`TRAP DEPLOYED! 💀`, "#ff7a00", window.innerWidth / 2, window.innerHeight / 2 - 40);

  mainMessage.textContent = `${actorName} Set a Trap!`;
  hint.textContent = `Hazard dropped at space #${targetTile}`;

  updateHUD();
}

function logAction(text, type = "normal") {
  // Logic replaced by visual popups and toast
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
  const loaded = localStorage.getItem("hazard_rush_stats");
  if (loaded) {
    gameState.stats = JSON.parse(loaded);
  } else {
    gameState.stats = { games: 0, wins: 0, kos: 0, traps: 0 };
  }
  
  const loadedCleared = localStorage.getItem("hazard_rush_highest_cleared");
  gameState.highestClearedLevel = loadedCleared ? parseInt(loadedCleared) : 0;
  
  // Restore the last played level so players resume where they left off
  const savedLevel = localStorage.getItem("hazard_rush_current_level");
  if (savedLevel) {
    gameState.currentLevel = Math.max(1, Math.min(500, parseInt(savedLevel)));
  }
  
  updateStatsDisplay();
}

function saveStats() {
  localStorage.setItem("hazard_rush_stats", JSON.stringify(gameState.stats));
  localStorage.setItem("hazard_rush_current_level", String(gameState.currentLevel));
  updateStatsDisplay();
}

function updateStatsDisplay() {
  // Stat counters removed from UI
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
  const diceScene = document.getElementById("diceScene");
  rollButton.classList.add("disabled");
  rollButton.classList.add("dice-shake");
  if (diceScene) {
    diceScene.classList.remove("rolling-across");
    // Force reflow to re-trigger animation
    void diceScene.offsetWidth;
    diceScene.classList.add("rolling-across");
  }
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
  if (diceScene) {
    diceScene.classList.remove("rolling-across");
  }
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

  // Chained resolution loop
  let chains = 0;
  let keepResolving = true;
  
  while (keepResolving && chains < 3) {
    keepResolving = false;

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
      const moved = await resolveSpecialTile(player);
      if (moved) {
        keepResolving = true;
        chains++;
      }
    }
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
  if (victim.hasShield) {
    victim.hasShield = false;
    updateHUD();
    mainMessage.textContent = "SHIELD BROKEN! 🛡️";
    hint.textContent = `${victim.name}'s shield blocked the attack!`;
    showToast(`🛡️ ${victim.name} blocked the knockout!`);
    triggerScreenShake(10);
    GameSFX.play("trap"); // Re-use trap sound for shield break
    floatingText("BLOCKED! 🛡️", "#00e1ff", window.innerWidth / 2, window.innerHeight / 2);
    await wait(1000);
    return;
  }

  mainMessage.textContent = "KNOCKOUT! 💥";
  hint.textContent = `Caught ${victim.name}!`;
  
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
  floatingText("CAUGHT! ⚔️", "#ffc93c", middleX, middleY - 60);

  await wait(600);

  // If Attacker is human, show modal. If AI, decide randomly.
  const isHuman = (gameState.currentPlayer === 0) || (gameState.mode === "pvp");
  
  if (isHuman) {
    // Show Punish Modal and wait for choice
    const choice = await showPunishModal();
    await applyPunishment(victim, choice);
  } else {
    // AI Choice
    // AI leans heavily towards Knockout (60% KO, 30% Push, 10% Forgive)
    const rand = Math.random();
    let choice = "ko";
    if (rand > 0.6 && rand <= 0.9) choice = "push";
    else if (rand > 0.9) choice = "forgive";
    
    await applyPunishment(victim, choice);
  }
}

function showPunishModal() {
  return new Promise((resolve) => {
    punishModal.classList.add("show");
    
    const onKo = () => { cleanup(); resolve("ko"); };
    const onPush = () => { cleanup(); resolve("push"); };
    const onForgive = () => { cleanup(); resolve("forgive"); };
    
    btnPunishKo.addEventListener("click", onKo);
    btnPunishPush.addEventListener("click", onPush);
    btnPunishForgive.addEventListener("click", onForgive);
    
    function cleanup() {
      punishModal.classList.remove("show");
      btnPunishKo.removeEventListener("click", onKo);
      btnPunishPush.removeEventListener("click", onPush);
      btnPunishForgive.removeEventListener("click", onForgive);
    }
  });
}

async function applyPunishment(victim, choice) {
  if (choice === "ko") {
    showToast(`💥 Sent back to START!`);
    while (victim.position > 0) {
      victim.position--;
      GameSFX.play("move");
      updateHUD();
      await wait(90);
    }
  } else if (choice === "push") {
    showToast(`👈 Pushed back 2 steps!`);
    const dest = Math.max(0, victim.position - 2);
    while (victim.position > dest) {
      victim.position--;
      GameSFX.play("move");
      updateHUD();
      await wait(90);
    }
  } else if (choice === "forgive") {
    showToast(`😇 Forgiven! No punishment.`);
    await wait(400);
  }
}

async function resolveSpecialTile(player) {
  const spec = gameState.levelSpecials[player.position];
  await wait(350);

  if (spec.type === "shield") {
    player.hasShield = true;
    gameState.shieldsCollected++;
    updateHUD();
    mainMessage.textContent = "SHIELD EQUIPPED! 🛡️";
    hint.textContent = "You are protected from the next trap or knockout.";
    showToast("🛡️ Shield Equipped!");
    GameSFX.play("bonus");
    floatingText("SHIELD UP! 🛡️", "#00e1ff", window.innerWidth / 2, window.innerHeight / 2);
    await wait(800);
    return false; // Did not move
  }

  if (spec.type === "wormhole") {
    mainMessage.textContent = "WORMHOLE! 🌌";
    hint.textContent = "Teleporting through space-time!";
    showToast("🌌 Teleporting...");
    triggerScreenShake(8);
    GameSFX.play("reset");
    
    // Pick random valid space (not start or finish)
    let dest = 1 + Math.floor(Math.random() * (FINISH - 1));
    player.position = dest;
    updateHUD();
    floatingText("TELEPORTED! 🌌", "#9d00ff", window.innerWidth / 2, window.innerHeight / 2);
    await wait(800);
    return true; // Moved
  }

  if (spec.effect > 0) {
    // BONUS TILE
    gameState.coinsEarned += (spec.effect * 5);
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
    // TRAP / RESET / FREEZE
    
    // Check Shield block first
    if (player.hasShield) {
      player.hasShield = false;
      updateHUD();
      mainMessage.textContent = "SHIELD CONSUMED! 🛡️";
      hint.textContent = "Your shield absorbed the hazard!";
      showToast("🛡️ Shield blocked the trap!");
      GameSFX.play("trap");
      floatingText("ABSORBED! 🛡️", "#00e1ff", window.innerWidth / 2, window.innerHeight / 2);
      await wait(800);
      return false; // Did not move, hazard cancelled
    }

    gameState.stats.traps++;
    saveStats();

    if (spec.type === "reset") {
      mainMessage.textContent = "POWER RESET! 🚨";
      hint.textContent = "Sliding back to START!";
      showToast("🚨 RESET TRIGGERED!");
      
      triggerScreenShake(18);
      GameSFX.play("reset");
      floatingText(`RESET! 😱`, "#ff3a5c", window.innerWidth / 2, window.innerHeight / 2);
    } else if (spec.type === "freeze") {
      mainMessage.textContent = "FROZEN! ❄️";
      hint.textContent = "Miss your next 2 turns!";
      showToast("❄️ FROZEN! Miss 2 turns.");
      
      triggerScreenShake(6);
      GameSFX.play("trap");
      floatingText(`FREEZE! ❄️`, "#00b8ff", window.innerWidth / 2, window.innerHeight / 2);
      
      player.frozenTurns = 2; // Apply freeze
      return false; // Skip sliding logic for freeze
    } else {
      mainMessage.textContent = "ENERGY TRAP! 💀";
      hint.textContent = `Dragging back ${Math.abs(spec.effect)} spaces!`;
      showToast(`💀 TRAP! -${Math.abs(spec.effect)}`);

      triggerScreenShake(10);
      GameSFX.play("trap");
      floatingText(`-${Math.abs(spec.effect)} SPACES! 💀`, "#ff6b00", window.innerWidth / 2, window.innerHeight / 2);
    }
  }

  await wait(600);

  // Compute slide destination
  let destination = player.position + spec.effect;
  if (destination < 0) destination = 0;
  if (destination > FINISH) destination = FINISH;
  
  if (destination === player.position) return false;

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

  return true; // Moved, allowing chain to continue
}

/* ==========================================================================
   EPHEMERAL TURN ANNOUNCEMENT (No Box, Bare Animated Words, Puffs Away)
   ========================================================================== */
function triggerTurnPuffAnnouncement(playerIdx) {
  const el = document.getElementById("turnPuffAnnouncement");
  if (!el) return;
  const player = gameState.players[playerIdx];
  if (!player) return;

  const colorClass = playerIdx === 0 ? "puff-red" : "puff-blue";
  const icon = playerIdx === 0 ? "🔴" : "🔵";
  el.className = `turn-puff-announcement ${colorClass}`;
  el.textContent = `${icon} ${player.name} TURN`;

  // Force DOM restart of CSS keyframe
  void el.offsetWidth;
  el.classList.add("puff-anim");
}

/* ==========================================================================
   TURN ROTATION
   ========================================================================== */
function switchTurn() {
  // Move to next player
  gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
  
  // Reset turn-specific action limits
  const activePlayer = gameState.players[gameState.currentPlayer];
  activePlayer.hasUsedTrapThisTurn = false;

  // Check if they are frozen
  if (activePlayer.frozenTurns > 0) {
    activePlayer.frozenTurns--;
    showToast(`❄️ ${activePlayer.name} is frozen. Skipping turn.`);
    floatingText(`FROZEN!`, "#00b8ff", window.innerWidth / 2, window.innerHeight / 2);
    
    // Immediately skip this turn and switch again
    setTimeout(() => {
      switchTurn();
    }, 1000);
    return;
  }

  gameState.busy = false;
  
  diceFace.textContent = "?";
  
  mainMessage.textContent = `${activePlayer.name}'s Turn`;
  hint.textContent = "Roll the dice to navigate.";

  updateHUD();

  // Trigger container-free typography puff: "🔴 RED TURN" / "🔵 BLUE TURN"
  triggerTurnPuffAnnouncement(gameState.currentPlayer);

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
  await wait(900 + Math.random() * 500);

  // AI Tactical Trap Placement: if level >= 10 and player 0 is ahead, deploy trap with 65% chance
  const aiPlayer = gameState.players[1];
  const humanPlayer = gameState.players[0];
  const activeLevel = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;

  if (activeLevel >= 10 && (aiPlayer.trapCharges || 0) > 0 && humanPlayer.position > aiPlayer.position && Math.random() < 0.65) {
    await activateSetTrap(true);
    await wait(600);
  }
  
  if (!gameState.gameOver) {
    await triggerRoll();
  }
}

/* ==========================================================================
   VICTORY & GAME OVER PRESENTATION (Visual Reference Panels 4, 5, 6)
   ========================================================================== */
function triggerVictory(winner) {
  gameState.gameOver = true;
  gameState.busy = false;
  
  rollButton.classList.add("disabled");
  
  mainMessage.textContent = "🏆 VICTORY!";
  hint.textContent = `${winner.name} wins the match!`;
  
  // Cumulative statistics updates
  gameState.stats.games++;
  if (gameState.currentPlayer === 0) {
    gameState.stats.wins++; // User wins tracking
    
    // NPC Level advancement check
    if (gameState.mode === "ai") {
      const activeLvl = gameState.currentLevel;
      if (activeLvl > gameState.highestClearedLevel) {
        gameState.highestClearedLevel = activeLvl;
        localStorage.setItem("hazard_rush_highest_cleared", activeLvl);
        
        logAction(`🏆 <strong>LEVEL UNLOCKED!</strong> Cleared Level ${activeLvl}! Shape is now unlocked for Local PVP.`, "knockout");
        showToast(`🏆 Level ${activeLvl} Cleared! Shape Unlocked!`);
      }
    }
  }
  saveStats();

  GameSFX.play("win");

  // Calculate elapsed match time
  const elapsedSecs = Math.max(1, Math.floor((Date.now() - (gameState.matchStartTime || Date.now())) / 1000));
  const mins = Math.floor(elapsedSecs / 60).toString().padStart(2, "0");
  const secs = (elapsedSecs % 60).toString().padStart(2, "0");
  const timeStr = `${mins}:${secs}`;

  const statValTime = document.getElementById("statValTime");
  if (statValTime) statValTime.textContent = timeStr;

  const statValLevel = document.getElementById("statValLevel");
  if (statValLevel) statValLevel.textContent = (gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel);

  const statValShields = document.getElementById("statValShields");
  if (statValShields) statValShields.textContent = gameState.shieldsCollected;

  gameState.coinsEarned = (gameState.coinsEarned || 0) + 100;
  const statValCoins = document.getElementById("statValCoins");
  if (statValCoins) statValCoins.textContent = gameState.coinsEarned;

  const victoryHeader = document.getElementById("victoryHeader");
  const defeatHeader = document.getElementById("defeatHeader");
  const pvpVsHeader = document.getElementById("pvpVsHeader");
  const winSub = document.getElementById("winSub");
  const playAgainLabel = document.getElementById("playAgainLabel");
  const nextLevelGameBtn = document.getElementById("nextLevelGameBtn");

  const isHumanWinner = (gameState.currentPlayer === 0);
  const isAiMode = (gameState.mode === "ai");
  const isNewLevelClear = isHumanWinner && isAiMode && (gameState.currentLevel >= gameState.highestClearedLevel);

  if (isAiMode) {
    if (isHumanWinner) {
      // Panel 4: Solo Victory
      if (victoryHeader) victoryHeader.style.display = "flex";
      if (defeatHeader) defeatHeader.style.display = "none";
      if (pvpVsHeader) pvpVsHeader.style.display = "none";

      winnerTitle.className = "win-title gold-glow";
      winnerTitle.textContent = "YOU WIN!";
      if (winSub) winSub.textContent = "Great job! You completed the race!";

      if (playAgainBtn) playAgainBtn.classList.remove("red-mode");
      if (playAgainLabel) playAgainLabel.textContent = isNewLevelClear ? "TRY SAME LEVEL" : "PLAY AGAIN";
      if (nextLevelGameBtn) {
        nextLevelGameBtn.style.display = (isNewLevelClear && gameState.currentLevel < 500) ? "flex" : "none";
      }
    } else {
      // Panel 5: Defeat / Game Over
      if (victoryHeader) victoryHeader.style.display = "none";
      if (defeatHeader) defeatHeader.style.display = "flex";
      if (pvpVsHeader) pvpVsHeader.style.display = "none";

      const defeatTitle = document.getElementById("defeatTitle");
      if (defeatTitle) defeatTitle.textContent = "GAME OVER";
      const defeatSub = document.getElementById("defeatSub");
      if (defeatSub) defeatSub.textContent = "Better luck next time!";

      if (playAgainBtn) playAgainBtn.classList.add("red-mode");
      if (playAgainLabel) playAgainLabel.textContent = "TRY AGAIN";
      if (nextLevelGameBtn) nextLevelGameBtn.style.display = "none";
    }
  } else {
    // Panel 6: Local PVP Winner
    if (victoryHeader) victoryHeader.style.display = "flex";
    if (defeatHeader) defeatHeader.style.display = "none";
    if (pvpVsHeader) pvpVsHeader.style.display = "flex";

    const pvpAvatarLeft = document.getElementById("pvpAvatarLeft");
    const pvpLabelLeft = document.getElementById("pvpLabelLeft");
    const pvpAvatarRight = document.getElementById("pvpAvatarRight");
    const pvpLabelRight = document.getElementById("pvpLabelRight");
    if (pvpAvatarLeft) pvpAvatarLeft.innerHTML = gameState.players[0].html;
    if (pvpLabelLeft) pvpLabelLeft.textContent = gameState.players[0].name;
    if (pvpAvatarRight) pvpAvatarRight.innerHTML = gameState.players[1].html;
    if (pvpLabelRight) pvpLabelRight.textContent = gameState.players[1].name;

    winnerTitle.className = "win-title gold-glow";
    winnerTitle.textContent = `${winner.name} WINS!`;
    if (winSub) winSub.textContent = "Well played! You're the champion!";

    if (playAgainBtn) playAgainBtn.classList.remove("red-mode");
    if (playAgainLabel) playAgainLabel.textContent = "PLAY AGAIN";
    if (nextLevelGameBtn) nextLevelGameBtn.style.display = "none";
  }

  // Show winning modal
  modal.classList.add("show");

  // Celebratory particles
  for (let i = 0; i < 35; i++) {
    setTimeout(() => {
      const colors = ["#ffc928", "#ff4058", "#168bff", "#20e878", "#8b4dff"];
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height * 0.7;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      spawnParticles(rx, ry, randomColor, 10);
      triggerScreenShake(2);
    }, i * 140);
  }
}

/* ==========================================================================
   RESET & SYSTEM HELPERS
   ========================================================================== */
function resetGame(advanceLevel = false) {
  if (advanceLevel && gameState.mode === "ai") {
    gameState.currentLevel = Math.min(500, gameState.currentLevel + 1);
  }

  // Rebuild board for level
  buildBoard();

  // Set players position
  gameState.players[0].position = 0;
  gameState.players[1].position = 0;

  // Clean visual coordinate positions
  const startSpace = gameState.spaces[0];
  const activeLevel = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
  const initialTrapCharges = activeLevel >= 10 ? 1 : 0;
  
  gameState.players.forEach(p => {
    p.visualX = startSpace.x;
    p.visualY = startSpace.y;
    p.targetX = startSpace.x;
    p.targetY = startSpace.y;
    p.hasShield = false;
    p.trapCharges = initialTrapCharges;
    p.hasUsedTrapThisTurn = false;
  });

  // Reset telemetry
  gameState.matchStartTime = Date.now();
  gameState.shieldsCollected = 0;
  gameState.coinsEarned = 0;

  // Reset camera to bottom of board
  camera.y = canvas.height;
  camera.targetY = canvas.height;

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
  if (pauseModal) pauseModal.classList.remove("show");

  logAction(`🎮 New Game started in <strong>${gameState.mode === "ai" ? "VS AI" : "PVP"} Mode</strong>! Level: ${gameState.currentLevel}`);
  
  resizeCanvasToContainer();
  updateHUD();
  triggerTurnPuffAnnouncement(0);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ==========================================================================
   EVENT LISTENERS INITIALIZATION
   ========================================================================== */
function syncAudioUI() {
  const isMuted = GameSFX.isMuted();
  const icon = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
  if (muteBtn) muteBtn.innerHTML = icon;
  if (homeMuteBtn) homeMuteBtn.innerHTML = icon;
  if (modalSoundToggle) {
    modalSoundToggle.innerHTML = icon;
    modalSoundToggle.classList.toggle("active", !isMuted);
  }
}

function handleToggleAudio() {
  const isMuted = GameSFX.toggleMute();
  syncAudioUI();
  showToast(isMuted ? "Audio Muted" : "Audio Unmuted");
}

function initEvents() {
  // Dice Button Click
  rollButton.addEventListener("click", () => {
    // Only allow human rolling
    if (gameState.mode === "ai" && gameState.currentPlayer === 1) return;
    triggerRoll();
  });

  // Tactical Set Trap Button Click
  if (btnSetTrap) {
    btnSetTrap.addEventListener("click", () => {
      if (gameState.mode === "ai" && gameState.currentPlayer === 1) return;
      activateSetTrap(false);
    });
  }

  // Header and modal buttons
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      if (confirm("Reset current game? Progress will be lost.")) {
        resetGame();
      }
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      resetGame(false); // Same level
    });
  }

  // Next Level button
  const nextLevelGameBtn = document.getElementById("nextLevelGameBtn");
  if (nextLevelGameBtn) {
    nextLevelGameBtn.addEventListener("click", () => {
      resetGame(true); // Advance to next level
    });
  }

  // Audio Toggles
  if (muteBtn) muteBtn.addEventListener("click", handleToggleAudio);
  if (homeMuteBtn) homeMuteBtn.addEventListener("click", handleToggleAudio);
  if (modalSoundToggle) modalSoundToggle.addEventListener("click", handleToggleAudio);
  syncAudioUI();

  // Pause Modal Triggers (Visual Reference Panel 3)
  if (btnPauseGame) {
    btnPauseGame.addEventListener("click", () => {
      if (pauseModal) pauseModal.classList.add("show");
    });
  }
  if (btnResumeGame) {
    btnResumeGame.addEventListener("click", () => {
      if (pauseModal) pauseModal.classList.remove("show");
    });
  }
  if (btnRestartGame) {
    btnRestartGame.addEventListener("click", () => {
      if (pauseModal) pauseModal.classList.remove("show");
      resetGame();
    });
  }
  if (btnPauseSettings) {
    btnPauseSettings.addEventListener("click", () => {
      if (pauseModal) pauseModal.classList.remove("show");
      if (settingsModal) settingsModal.classList.add("show");
    });
  }
  if (btnQuitToMenu) {
    btnQuitToMenu.addEventListener("click", () => {
      if (pauseModal) pauseModal.classList.remove("show");
      if (gameScreen) gameScreen.style.display = "none";
      if (homeScreen) homeScreen.style.display = "flex";
    });
  }

  // Settings Modal Close
  if (homeSettingsBtn) {
    homeSettingsBtn.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.add("show");
    });
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.remove("show");
    });
  }

  // Return to Main Menu from Winner/Defeat Modal
  if (btnReturnHome) {
    btnReturnHome.addEventListener("click", () => {
      if (modal) modal.classList.remove("show");
      if (gameScreen) gameScreen.style.display = "none";
      if (homeScreen) homeScreen.style.display = "flex";
    });
  }
  
  // Back button functionality
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (confirm("Return to setup? Current game progress will be lost.")) {
        gameScreen.style.display = "none";
        backBtn.style.display = "none";
        setupScreen.style.display = "flex";
        setupScreen.style.opacity = "1";
      }
    });
  }
}

/* ==========================================================================
   INITIALIZATION LAUNCHER
   ========================================================================== */
window.addEventListener("DOMContentLoaded", () => {
  resizeCanvasToContainer();
  window.addEventListener("resize", resizeCanvasToContainer);
  window.addEventListener("orientationchange", () => {
    setTimeout(resizeCanvasToContainer, 150);
  });

  loadStats(); // Load stats first to get cleared levels!
  buildBoard();
  initSetupScreen();
  initEvents();
  
  // Kick off render loop
  requestAnimationFrame(renderLoop);

  // Register Service Worker for PWA (offline play & installation)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("[PWA] Service Worker Registered!"))
      .catch((err) => console.error("[PWA] Service Worker Registration Failed", err));
  }
});

// PWA Custom Installation Flow
let deferredPrompt;
const pwaInstallBtn = document.getElementById("pwaInstallBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent browser's automatic prompt banner
  e.preventDefault();
  // Save the event to trigger it on user request
  deferredPrompt = e;
  // Show our custom Install button in the header
  if (pwaInstallBtn) {
    pwaInstallBtn.style.display = "flex";
  }
});

if (pwaInstallBtn) {
  pwaInstallBtn.addEventListener("click", () => {
    // Hide our custom install button
    pwaInstallBtn.style.display = "none";
    // Trigger install prompt dialog
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("[PWA] User installed the app.");
        } else {
          console.log("[PWA] User dismissed the installation.");
        }
        deferredPrompt = null;
      });
    }
  });
}

window.addEventListener("appinstalled", () => {
  console.log("[PWA] App installed successfully!");
  if (pwaInstallBtn) {
    pwaInstallBtn.style.display = "none";
  }
  showToast("🎉 Added to Home Screen successfully!");
});
