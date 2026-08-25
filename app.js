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
      name: "RED PLAYER",
      emoji: "\uf135",
      html: '<i class="fa-solid fa-rocket"></i>',
      color: "#ff3a5c",
      position: 0,
      visualX: 35,
      visualY: 42,
      targetX: 35,
      targetY: 42,
      frozenTurns: 0
    },
    {
      name: "BLUE PLAYER",
      emoji: "\uf753",
      html: '<i class="fa-solid fa-meteor"></i>',
      color: "#00b8ff",
      position: 0,
      visualX: 35,
      visualY: 42,
      targetX: 35,
      targetY: 42,
      frozenTurns: 0
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

// Headers and Modals
const muteBtn = document.getElementById("muteBtn");
const restartBtn = document.getElementById("restart");
const backBtn = document.getElementById("backBtn");
const modal = document.getElementById("modal");
const winnerTitle = document.getElementById("winner");
const playAgainBtn = document.getElementById("playAgain");

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
    levelValue.textContent = `Level ${gameState.currentLevel}`;
    levelHint.textContent = `Board Shape: ${getShapeName(gameState.currentLevel)}`;
    drawMiniBoard("levelPreviewCanvas", gameState.currentLevel);
    
    // PVP Shape Selector Refresh
    const maxShapeUnlocked = Math.max(1, gameState.highestClearedLevel);
    shapeValue.textContent = getShapeName(gameState.selectedShapeLevel);
    shapeHint.textContent = `Cleared level shapes unlocked: 1 to ${maxShapeUnlocked}`;
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
  
  const gridData = generateGridShape(level, FINISH);
  const left = 20; const top = 20; const right = 20; const bottom = 20;
  
  const gridW = Math.max(1, gridData.maxX - gridData.minX);
  const gridH = Math.max(1, gridData.maxY - gridData.minY);
  
  ctxMini.beginPath();
  for (let i = 0; i <= FINISH; i++) {
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
  ctxMini.strokeStyle = "rgba(200,80,255,0.8)";
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
  // 20 families × 10 variations = 200 shapes
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
    // INWARD SQUARE SPIRAL (counter-clockwise)
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
    // DIAGONAL STAIRCASE (right then up, varied step)
    const step = 2 + (variation % 4);
    let x = 0, y = 0, right = true;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (i % step === step - 1) right = !right;
      if (right) x += 1; else y -= 1;
    }
  } else if (family === 5) {
    // U-SHAPE COMB (teeth going up)
    const armH = 3 + (variation % 4);
    const gap = 2 + (variation % 3);
    let x = 0, y = 0, goingUp = true;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (goingUp) {
        y -= 1;
        if (Math.abs(y) >= armH) { goingUp = false; x += gap > 1 ? 1 : 1; }
      } else {
        y += 1;
        if (y >= 0) { goingUp = true; x += 1; }
      }
    }
  } else if (family === 6) {
    // ZIGZAG COLUMNS (down-right-up-right pattern)
    const colH = 3 + (variation % 5);
    let x = 0, y = 0, down = true;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (down) {
        y += 1;
        if (y >= colH) { down = false; x += 1; }
      } else {
        y -= 1;
        if (y <= 0) { down = true; x += 1; }
      }
    }
  } else if (family === 7) {
    // EXPANDING L-SHAPES
    let x = 0, y = 0, armLen = 2 + (variation % 3);
    for (let i = 0; i <= totalPoints; ) {
      for (let j = 0; j < armLen && i <= totalPoints; j++, i++) pts.push({ x: x + j, y });
      x += armLen - 1; armLen++;
      for (let j = 1; j < armLen && i <= totalPoints; j++, i++) pts.push({ x, y: y - j });
      y -= armLen - 1;
    }
  } else if (family === 8) {
    // BRICK-LAYER OFFSET ROWS
    const cols = 5 + (variation % 4);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / cols);
      const c = r % 2 === 0 ? (i % cols) : cols - 1 - (i % cols);
      const offset = (r % 2) * 0; // no offset in grid coords
      pts.push({ x: c * 2, y: -r * 2 }); // double-spaced
    }
  } else if (family === 9) {
    // DIAMOND GRID SERPENTINE (rotated 45°)
    const cols = 4 + (variation % 4);
    for (let i = 0; i <= totalPoints; i++) {
      const r = Math.floor(i / cols);
      const c = r % 2 === 0 ? (i % cols) : cols - 1 - (i % cols);
      pts.push({ x: c - r, y: -(c + r) });
    }
  } else if (family === 10) {
    // CROSS/PLUS WINDING PATH
    const arm = 3 + (variation % 4);
    const dirs = [[1,0],[0,-1],[-1,0],[0,1]];
    let x = 0, y = 0, i = 0, di = 0;
    while (i <= totalPoints) {
      for (let s = 0; s < arm && i <= totalPoints; s++, i++) {
        pts.push({ x, y });
        x += dirs[di % 4][0]; y += dirs[di % 4][1];
      }
      di++;
    }
  } else if (family === 11) {
    // TRIANGLE STACKING (row gets shorter each level)
    const base = 6 + (variation % 5);
    let x = 0, y = 0, rowW = base, rowStart = 0, col = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x: rowStart + col, y });
      col++;
      if (col >= rowW) {
        col = 0; y -= 1;
        rowStart += Math.floor((base - rowW + 1) / 2);
        rowW = Math.max(1, rowW - 1);
      }
    }
  } else if (family === 12) {
    // WAVE-STEP (sine-like but grid-snapped)
    const period = 4 + (variation % 4);
    let x = 0, y = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      const phase = i % (period * 2);
      if (phase < period / 2) y -= 1;
      else if (phase < period) x += 1;
      else if (phase < period + period / 2) y += 1;
      else x += 1;
    }
  } else if (family === 13) {
    // OUTWARD RECTANGULAR SPIRAL (taller than wide)
    let x = 0, y = 0, w = 1, h = 2;
    const dirs = [[1,0],[0,-1],[-1,0],[0,1]];
    let di = 0, i = 0;
    while (i <= totalPoints) {
      const dist = di % 2 === 0 ? w : h;
      for (let s = 0; s < dist && i <= totalPoints; s++, i++) {
        pts.push({ x, y });
        x += dirs[di % 4][0]; y += dirs[di % 4][1];
      }
      if (di % 2 === 0) h++; else w++;
      di++;
    }
  } else if (family === 14) {
    // FIGURE-8 / BOWTIE GRID LOOPS
    const halfW = 3 + (variation % 3);
    const halfH = 2 + (variation % 3);
    let x = 0, y = 0, phase = 0;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      const seg = i % (halfW * 2 + halfH * 2);
      if (seg < halfW) x += 1;
      else if (seg < halfW + halfH) y -= 1;
      else if (seg < halfW * 2 + halfH) x -= 1;
      else y += 1;
    }
  } else if (family === 15) {
    // MAZE CORRIDORS (alternating long runs)
    const runH = 4 + (variation % 5);
    const runW = 3 + (variation % 4);
    let x = 0, y = 0, di = 0;
    const dirs = [[1,0],[0,-1],[-1,0],[0,-1]]; // right, up, left, up pattern
    const lens = [runW, runH, runW, 1];
    for (let i = 0; i <= totalPoints; ) {
      const len = lens[di % 4];
      for (let s = 0; s < len && i <= totalPoints; s++, i++) {
        pts.push({ x, y });
        x += dirs[di % 4][0]; y += dirs[di % 4][1];
      }
      di++;
    }
  } else if (family === 16) {
    // CATERPILLAR (horizontal run with vertical spur every N)
    const runLen = 3 + (variation % 4);
    const spurH = 2 + (variation % 3);
    let x = 0, y = 0, i = 0;
    while (i <= totalPoints) {
      for (let s = 0; s < runLen && i <= totalPoints; s++, i++) { pts.push({ x, y }); x += 1; }
      for (let s = 0; s < spurH && i <= totalPoints; s++, i++) { pts.push({ x, y }); y -= 1; }
      for (let s = 0; s < runLen && i <= totalPoints; s++, i++) { pts.push({ x, y }); x -= 1; }
      for (let s = 0; s < spurH && i <= totalPoints; s++, i++) { pts.push({ x, y }); y -= 1; }
    }
  } else if (family === 17) {
    // TALL COLUMNS SERPENTINE (very narrow, tall columns)
    const colH = 6 + (variation % 6);
    let x = 0, y = 0, down = false;
    for (let i = 0; i <= totalPoints; i++) {
      pts.push({ x, y });
      if (down) { y += 1; if (y >= 0) { down = false; x += 1; } }
      else { y -= 1; if (-y >= colH) { down = true; x += 1; } }
    }
  } else if (family === 18) {
    // DOUBLE-BACK SNAKE (goes right, doubles back partially)
    const fwd = 5 + (variation % 5);
    const back = 2 + (variation % 3);
    let x = 0, y = 0, i = 0;
    while (i <= totalPoints) {
      for (let s = 0; s < fwd && i <= totalPoints; s++, i++) { pts.push({ x, y }); x += 1; }
      y -= 1;
      for (let s = 0; s < back && i <= totalPoints; s++, i++) { pts.push({ x, y }); x -= 1; }
      y -= 1;
    }
  } else {
    // family === 19: STACKED ARCHES (flat bottom, arched top)
    const archW = 4 + (variation % 4);
    const archH = 2 + (variation % 3);
    let x = 0, y = 0, i = 0;
    while (i <= totalPoints) {
      // bottom run
      for (let s = 0; s < archW && i <= totalPoints; s++, i++) { pts.push({ x, y }); x += 1; }
      // up
      for (let s = 0; s < archH && i <= totalPoints; s++, i++) { pts.push({ x, y }); y -= 1; }
      // top run back
      for (let s = 0; s < archW && i <= totalPoints; s++, i++) { pts.push({ x, y }); x -= 1; }
      // move up to next arch
      for (let s = 0; s < archH && i <= totalPoints; s++, i++) { pts.push({ x, y }); y -= 1; }
    }
  }

  // Find bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  return { pts, minX, maxX, minY, maxY };
}

function buildBoardForLevel(level) {
  gameState.spaces = [];
  const width = canvas.width;
  
  // Generate clean grid path
  const gridData = generateGridShape(level, FINISH);
  const gridPts = gridData.pts;
  
  // 1. Generate Specials deterministically
  gameState.levelSpecials = {};
  let seed = level * 17;
  const nextRand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const numBonuses = Math.max(1, 4 - Math.floor(level / 150));
  const numTraps = Math.min(6, 2 + Math.floor(level / 70));
  const numResets = 1 + Math.floor(level / 20); // Scale resets
  const numFreezes = Math.min(3, 1 + Math.floor(level / 100));
  const numShields = level >= 3 ? Math.min(3, 1 + Math.floor(level / 50)) : 0;
  const numWormholes = level >= 10 ? Math.min(2, 1 + Math.floor(level / 150)) : 0;

  const takenIndices = new Set([0, FINISH]);

  function getUniqueIdx() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const idx = 3 + Math.floor(nextRand() * (FINISH - 5));
      if (!takenIndices.has(idx)) {
        takenIndices.add(idx);
        return idx;
      }
    }
    return -1;
  }

  // Generate bonuses, traps, resets, freezes, shields, wormholes
  for (let b = 0; b < numBonuses; b++) {
    const idx = getUniqueIdx();
    if (idx !== -1) {
      const bonusVal = nextRand() < 0.5 ? 5 : 10; // ONE call, used for both label AND effect
      gameState.levelSpecials[idx] = { type: "bonus", label: `⚡ +${bonusVal}`, effect: bonusVal, color: "#10e394" };
    }
  }
  for (let t = 0; t < numTraps; t++) { const idx = getUniqueIdx(); if (idx !== -1) { const vals = [-2, -3, -5, -8, -10]; const val = vals[Math.floor(nextRand() * Math.min(5, 1+Math.floor(level/100)))]; gameState.levelSpecials[idx] = { type: "trap", label: `💀 ${val}`, effect: val, color: "#ff7e36" }; } }
  for (let r = 0; r < numResets; r++) { const idx = getUniqueIdx(); if (idx !== -1) gameState.levelSpecials[idx] = { type: "reset", label: "💥 RESET", effect: -idx, color: "#ff3a5c" }; }
  for (let f = 0; f < numFreezes; f++) { const idx = getUniqueIdx(); if (idx !== -1) gameState.levelSpecials[idx] = { type: "freeze", label: "❄️ FREEZE", effect: 0, color: "#00b8ff" }; }
  for (let s = 0; s < numShields; s++) { const idx = getUniqueIdx(); if (idx !== -1) gameState.levelSpecials[idx] = { type: "shield", label: "🛡️ SHIELD", effect: 0, color: "#00e1ff" }; }
  for (let w = 0; w < numWormholes; w++) { const idx = getUniqueIdx(); if (idx !== -1) gameState.levelSpecials[idx] = { type: "wormhole", label: "🌌 WORMHOLE", effect: 0, color: "#9d00ff" }; }

  // Auto-Scale to prevent cramping using perfect grid distances
  const TILE_SPACING = 85;
  const paddingX = 80;
  const paddingY = 80;
  
  const gridWidth = gridData.maxX - gridData.minX;
  const gridHeight = gridData.maxY - gridData.minY;
  
  gameState.virtualWidth = (gridWidth * TILE_SPACING) + paddingX * 2;
  gameState.virtualHeight = (gridHeight * TILE_SPACING) + paddingY * 2;
  
  for (let i = 0; i <= FINISH; i++) {
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
    } else if (i === FINISH) {
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

function drawBoardBackgroundDecor(overflow = 0) {
  const W = canvas.width;
  const H = canvas.height + overflow * 2;
  const offY = -overflow;

  // Deep background (covers panning area)
  ctx.save();
  const bgGrad = ctx.createLinearGradient(0, offY, W, H + offY);
  bgGrad.addColorStop(0, "#07080f");
  bgGrad.addColorStop(0.5, "#0a0c18");
  bgGrad.addColorStop(1, "#07080f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, offY, W, H);

  // Ambient purple radial glow top-right
  ctx.save();
  const p1 = ctx.createRadialGradient(W * 0.8, H * 0.1 + offY, 0, W * 0.8, H * 0.1 + offY, W * 0.6);
  p1.addColorStop(0, "rgba(200,80,255,0.1)");
  p1.addColorStop(1, "transparent");
  ctx.fillStyle = p1;
  ctx.fillRect(0, offY, W, H);
  ctx.restore();

  // Ambient blue radial glow bottom-left
  ctx.save();
  const p2 = ctx.createRadialGradient(W * 0.15, H * 0.85 + offY, 0, W * 0.15, H * 0.85 + offY, W * 0.5);
  p2.addColorStop(0, "rgba(0,184,255,0.08)");
  p2.addColorStop(1, "transparent");
  ctx.fillStyle = p2;
  ctx.fillRect(0, offY, W, H);
  ctx.restore();

  // Dot grid
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let x = 20; x < W; x += 36) {
    for (let y = offY + 20; y < H + offY; y += 36) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
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
  const R = 17; // tile radius

  gameState.spaces.forEach((space, index) => {
    ctx.save();
    const isSpecial = space.type !== "normal";

    // --- Drop shadow ---
    ctx.beginPath();
    ctx.arc(space.x, space.y + 3, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();

    // --- Glow for specials ---
    if (isSpecial) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = space.color;
    } else {
      ctx.shadowBlur = 0;
    }

    // --- Tile fill ---
    let fillColor;
    if (space.type === "start")  fillColor = "#0dffb0";
    else if (space.type === "finish") fillColor = "#ffcc00";
    else if (space.type === "bonus")  fillColor = "#0dffb0";
    else if (space.type === "trap")   fillColor = "#ff6b00";
    else if (space.type === "reset")  fillColor = "#ff3a5c";
    else if (space.type === "freeze") fillColor = "#00b8ff";
    else fillColor = null;

    if (fillColor) {
      // Filled arcade tile
      ctx.beginPath();
      ctx.arc(space.x, space.y, R, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(space.x - 4, space.y - 5, 1, space.x, space.y, R);
      g.addColorStop(0, lighten(fillColor, 60));
      g.addColorStop(0.5, fillColor);
      g.addColorStop(1, darken(fillColor, 40));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.stroke();
      
      // Draw freeze snowflake (if it's a freeze tile)
      if (space.type === "freeze") {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 14px 'Font Awesome 6 Free'";
        ctx.fillStyle = "#fff";
        ctx.fillText("\uf2dc", space.x, space.y); // snowflake
        ctx.restore();
      }
    } else {
      // Normal tile
      ctx.beginPath();
      ctx.arc(space.x, space.y, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(18,20,38,0.92)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.065)";
      ctx.stroke();
    }

    ctx.restore();

    // --- Label text ---
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (space.type === "start") {
      ctx.font = "bold 7.5px Nunito";
      ctx.fillStyle = "#07080f";
      ctx.fillText("START", space.x, space.y);
    } else if (space.type === "finish") {
      ctx.font = "bold 8px Nunito";
      ctx.fillStyle = "#07080f";
      ctx.fillText("GOAL", space.x, space.y);
    } else if (space.type === "bonus") {
      const val = (space.label.match(/\d+/) || [""])[0];
      ctx.font = "bold 10px Nunito";
      ctx.fillStyle = "#07080f";
      ctx.fillText("+" + val, space.x, space.y);
    } else if (space.type === "trap") {
      const val = (space.label.match(/-?\d+/) || [""])[0];
      ctx.font = "bold 10px Nunito";
      ctx.fillStyle = "#fff";
      ctx.fillText(val, space.x, space.y);
    } else if (space.type === "reset") {
      ctx.font = "bold 7px Nunito";
      ctx.fillStyle = "#fff";
      ctx.fillText("BACK", space.x, space.y);
    } else if (space.type === "shield") {
      ctx.font = "12px FontAwesome";
      ctx.fillStyle = "#07080f";
      ctx.fillText("🛡️", space.x, space.y + 1); // Slight offset for emoji
    } else if (space.type === "wormhole") {
      ctx.font = "12px FontAwesome";
      ctx.fillStyle = "#fff";
      ctx.fillText("🌌", space.x, space.y + 1);
    } else if (space.type !== "freeze") {
      ctx.font = "600 10px Nunito";
      ctx.fillStyle = "rgba(255,255,255,0.18)";
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

    ctx.save();

    // Big outer glow ring for active player
    if (isActive) {
      ctx.beginPath();
      ctx.arc(player.visualX, player.visualY, TOKEN_R + 7, 0, Math.PI * 2);
      ctx.strokeStyle = player.color + "55";
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = player.color;
      ctx.stroke();
    }
    
    // Shield Aura
    if (player.hasShield) {
      ctx.beginPath();
      ctx.arc(player.visualX, player.visualY, TOKEN_R + 10, 0, Math.PI * 2);
      ctx.strokeStyle = "#00e1ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00e1ff";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Drop shadow
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(player.visualX, player.visualY + 5, TOKEN_R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();

    // Token glow aura
    ctx.shadowBlur = isActive ? 28 : 14;
    ctx.shadowColor = player.color;

    // 3D sphere gradient
    const grad = ctx.createRadialGradient(
      player.visualX - 5, player.visualY - 5, 1,
      player.visualX, player.visualY, TOKEN_R
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.25, lighten(player.color, 50));
    grad.addColorStop(0.7, player.color);
    grad.addColorStop(1, darken(player.color, 60));

    ctx.beginPath();
    ctx.arc(player.visualX, player.visualY, TOKEN_R, 0, Math.PI * 2);
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
  redAvatarBadge.innerHTML = p1.html;
  blueAvatarBadge.innerHTML = p2.html;
  
  // Shield badges
  document.getElementById("redShieldBadge").style.display = p1.hasShield ? "inline-block" : "none";
  document.getElementById("blueShieldBadge").style.display = p2.hasShield ? "inline-block" : "none";

  // Turn status banner
  const activePlayer = gameState.players[gameState.currentPlayer];
  turnBullet.style.color = activePlayer.color;
  turnName.innerHTML = `${activePlayer.html} ${activePlayer.name}'S TURN`;

  if (gameState.gameOver) {
    turnStatus.textContent = "GAME OVER";
  } else if (gameState.busy) {
    turnStatus.textContent = "MOVING...";
  } else {
    turnStatus.textContent = gameState.mode === "ai" && gameState.currentPlayer === 1 ? "COMPUTER THINKING..." : "AWAITING ROLL";
  }

  // Level badge
  const lvlBadge = document.getElementById("levelBadge");
  if (lvlBadge) {
    const lvl = gameState.mode === "ai" ? gameState.currentLevel : gameState.selectedShapeLevel;
    lvlBadge.textContent = `LVL ${lvl}`;
  }
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
   TURN ROTATION
   ========================================================================== */
function switchTurn() {
  // Move to next player
  gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
  
  // Check if they are frozen
  const nextPlayer = gameState.players[gameState.currentPlayer];
  if (nextPlayer.frozenTurns > 0) {
    nextPlayer.frozenTurns--;
    showToast(`❄️ ${nextPlayer.name} is frozen. Skipping turn.`);
    floatingText(`FROZEN!`, "#00b8ff", window.innerWidth / 2, window.innerHeight / 2);
    
    // Immediately skip this turn and switch again
    setTimeout(() => {
      switchTurn();
    }, 1000);
    return;
  }

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
        localStorage.setItem("hazard_rush_highest_cleared", activeLvl);
        
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

  // Build context-sensitive modal buttons
  const isHumanWinner = (gameState.currentPlayer === 0);
  const isAiMode = (gameState.mode === "ai");
  const isNewLevelClear = isHumanWinner && isAiMode && (gameState.currentLevel >= gameState.highestClearedLevel);

  // Update win subtitle
  const winSub = document.getElementById("winSub");
  if (winSub) winSub.textContent = isHumanWinner ? "You won! What's next?" : `${winner.name} wins this round!`;

  // Show / hide next level button
  const nextLevelGameBtn = document.getElementById("nextLevelGameBtn");
  if (nextLevelGameBtn) {
    nextLevelGameBtn.style.display = (isNewLevelClear && gameState.currentLevel < 500) ? "flex" : "none";
  }

  // Update play again label based on context
  const playAgainLabel = document.getElementById("playAgainLabel");
  if (playAgainLabel) {
    playAgainLabel.textContent = isHumanWinner ? "🔄 Try Same Level" : "🔄 Try Again";
  }
}

/* ==========================================================================
   RESET & SYSTEM HELPERS
   ========================================================================== */
function resetGame(advanceLevel = false) {
  if (advanceLevel && gameState.mode === "ai") {
    gameState.currentLevel = Math.min(500, gameState.currentLevel + 1);
  }

  // Rebuild board for possibly new level
  buildBoard();

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
    p.hasShield = false;
  });

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

  // Clean logs and post init log
  logContainer.innerHTML = "";
  logAction(`🎮 New Game started in <strong>${gameState.mode === "ai" ? "VS AI" : "PVP"} Mode</strong>! Level: ${gameState.currentLevel}`);
  
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
    resetGame(false); // Same level
  });

  // Next Level button (shown after winning in AI mode)
  const nextLevelGameBtn = document.getElementById("nextLevelGameBtn");
  if (nextLevelGameBtn) {
    nextLevelGameBtn.addEventListener("click", () => {
      resetGame(true); // Advance to next level
    });
  }

  // Mute audio Toggle
  muteBtn.addEventListener("click", () => {
    const isMuted = GameSFX.toggleMute();
    muteBtn.innerHTML = isMuted ? "🔈" : "🔊";
    showToast(isMuted ? "Audio Muted" : "Audio Unmuted");
  });

  // Initialize Audio icon
  muteBtn.innerHTML = GameSFX.isMuted() ? "🔈" : "🔊";
  
  // Back button functionality
  backBtn.addEventListener("click", () => {
    if (confirm("Return to setup? Current game progress will be lost.")) {
      gameScreen.style.display = "none";
      backBtn.style.display = "none";
      setupScreen.style.display = "flex";
      setupScreen.style.opacity = "1";
    }
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
