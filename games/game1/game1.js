/* =================================================
   GAME 1 — Dodge Racer (Canvas)
   ================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ---------- Canvas size ---------- */
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = 360;

  // Reposition car nicely after resize
  car.x = canvas.width / 2 - car.w / 2;
  car.y = canvas.height - car.h - 18;
}
window.addEventListener("resize", resizeCanvas);

/* ---------- Load car image ---------- */
const carImg = new Image();
carImg.src = "../../assets/img/F1audi.png";

let carImgLoaded = false;

/* ---------- LocalStorage helpers ---------- */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
}

function getScores(email) {
  const key = `scores_${email}`;
  try {
    return (
      JSON.parse(localStorage.getItem(key)) || { game1: 0, game2: 0, game3: 0 }
    );
  } catch {
    return { game1: 0, game2: 0, game3: 0 };
  }
}

function saveScore(email, value) {
  const key = `scores_${email}`;
  const scores = getScores(email);
  scores.game1 = Math.max(scores.game1, value);
  localStorage.setItem(key, JSON.stringify(scores));
}

/* ---------- Game state ---------- */
let running = false;
let gameOver = false;
let score = 0;
let best = 0;
let roadScroll = 0;

/* ---------- Player ---------- */
const car = {
  x: 0,
  y: 0,
  w: 90,     
  h: 160,
  speed: 620
};

/* ---------- Road ---------- */
const road = {
  margin: 90
};

/* ---------- Obstacles ---------- */
const obstacles = [];
let spawnTimer = 0;
let spawnDelay = 0.9;
let obstacleSpeed = 260;

// ---------- Levels (1 -> 6) ----------
const LEVELS = [
  { speed: 220, spawnDelay: 1.05, multiSpawnChance: 0.00 }, // 1: 
  { speed: 260, spawnDelay: 0.95, multiSpawnChance: 0.08 }, // 2
  { speed: 310, spawnDelay: 0.85, multiSpawnChance: 0.12 }, // 3
  { speed: 380, spawnDelay: 0.75, multiSpawnChance: 0.18 }, // 4
  { speed: 460, spawnDelay: 0.65, multiSpawnChance: 0.25 }, // 5
  { speed: 560, spawnDelay: 0.55, multiSpawnChance: 0.35 }, // 6: 
];

let level = 1;
const MAX_LEVEL = 6;

// score requis pour changer de niveau (ajuste comme tu veux)
const LEVEL_UP_SCORE = 120; 

/* ---------- Controls ---------- */
const keys = {
  left: false,
  right: false
};

/* ---------- Image onload: keep ratio + set ideal size ---------- */
carImg.onload = () => {
  carImgLoaded = true;

  // Keep the original image ratio (W/H)
  const ratio = carImg.naturalWidth / carImg.naturalHeight;

  // Make the car about 28% of canvas height
  car.h = Math.round(canvas.height * 0.28);
  car.w = Math.round(car.h * ratio);

  // Place it nicely
  car.x = canvas.width / 2 - car.w / 2;
  car.y = canvas.height - car.h - 18;
};

/* ---------- Init ---------- */
function init() {
  resizeCanvas();

  const user = getCurrentUser();
  if (user?.email) {
    best = getScores(user.email).game1 || 0;
    document.getElementById("best").textContent = best;
  }

  resetGame();
  loop();
}

function applyLevel(lv) {
  const cfg = LEVELS[lv - 1];
  obstacleSpeed = cfg.speed;
  spawnDelay = cfg.spawnDelay;
}

/* ---------- Reset ---------- */
function resetGame() {
  score = 0;
  obstacles.length = 0;
  spawnTimer = 0;
  level = 1;
  applyLevel(level);
  roadScroll = 0;

  running = false;
  gameOver = false;

  car.x = canvas.width / 2 - car.w / 2;
  car.y = canvas.height - car.h - 18;

  document.getElementById("score").textContent = "0";
}

/* ---------- Start / End ---------- */
function startGame() {
  const user = getCurrentUser();
  if (!user) {
    alert("Connecte-toi pour jouer");
    return;
  }
  resetGame();
  running = true;
}

function endGame() {
  running = false;
  gameOver = true;

  const finalScore = Math.floor(score);
  document.getElementById("score").textContent = finalScore;

  const user = getCurrentUser();
  if (user?.email) {
    saveScore(user.email, finalScore);
    best = Math.max(best, finalScore);
    document.getElementById("best").textContent = best;
  }
}

/* ---------- Obstacles ---------- */
function spawnObstacle() {
  const w = 60 + Math.random() * 90;
  obstacles.push({
    x: road.margin + Math.random() * (canvas.width - road.margin * 2 - w),
    y: -50,
    w,
    h: 24 + Math.random() * 26
  });
}

/* ---------- Collision ---------- */
function rectCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/* ---------- Draw highway background ---------- */
function drawHighway() {
  const margin = road.margin;
  const roadW = canvas.width - margin * 2;

  // asphalt
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(margin, 0, roadW, canvas.height);

  // subtle grain texture (fast)
  for (let i = 0; i < 140; i++) {
    const x = margin + Math.random() * roadW;
    const y = Math.random() * canvas.height;
    const a = 0.02 + Math.random() * 0.05;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // red borders + glow
  ctx.strokeStyle = "rgba(255,0,60,0.75)";
  ctx.lineWidth = 4;
  ctx.strokeRect(margin, 0, roadW, canvas.height);

  // light side lines
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin + 16, 0);
  ctx.lineTo(margin + 16, canvas.height);
  ctx.moveTo(margin + roadW - 16, 0);
  ctx.lineTo(margin + roadW - 16, canvas.height);
  ctx.stroke();

  // center dashed line (scrolling)
  const dashH = 26;
  const gap = 22;
  const total = dashH + gap;
  const centerX = canvas.width / 2;

  let y = -(roadScroll % total);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  while (y < canvas.height) {
    ctx.fillRect(centerX - 2, y, 4, dashH);
    y += total;
  }

  // vignette edges for contrast
  const grd = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grd.addColorStop(0, "rgba(0,0,0,0.55)");
  grd.addColorStop(0.18, "rgba(0,0,0,0)");
  grd.addColorStop(0.82, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/* ---------- Update ---------- */
function update(dt) {
  if (!running) return;

  // Score
  score += dt * 10;
  // Level up
  const newLevel = Math.min(MAX_LEVEL, Math.floor(score / LEVEL_UP_SCORE) + 1);
  if (newLevel !== level) {
     level = newLevel;
     applyLevel(level);

// petit feedback visuel (optionnel)
// showToast?.("info", "Niveau", `Niveau ${level}`);
  }
  document.getElementById("score").textContent = Math.floor(score);

  // Highway scroll based on speed
  roadScroll -= dt * obstacleSpeed * 0.6;

  // Controls
  if (keys.left) car.x -= car.speed * dt;
  if (keys.right) car.x += car.speed * dt;

  // Clamp inside road
  car.x = Math.max(
    road.margin + 12,
    Math.min(canvas.width - road.margin - car.w - 12, car.x)
  );

  // Spawning + difficulty
  spawnTimer += dt;
  if (spawnTimer > spawnDelay) {
    spawnTimer = 0;

  // spawn de base (toujours)
    spawnObstacle();

  // random : chance d'avoir 1 obstacle en plus (plus haut niveau => plus probable)
    const chance = LEVELS[level - 1].multiSpawnChance;
    if (Math.random() < chance) {
        spawnObstacle();
    }

  // rare : triple spawn à haut niveau
    if (level >= 5 && Math.random() < chance * 0.35) {
        spawnObstacle();
    }
}

  // Move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += obstacleSpeed * dt;

    if (o.y > canvas.height + 80) {
      obstacles.splice(i, 1);
      continue;
    }

    // Smaller hitbox for car (more fun)
    const hit = {
      x: car.x + car.w * 0.18,
      y: car.y + car.h * 0.12,
      w: car.w * 0.64,
      h: car.h * 0.78
    };

    const obHit = { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 };

    if (rectCollision(hit, obHit)) {
      endGame();
      break;
    }
  }
}

/* ---------- Draw ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background base
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // highway
  drawHighway();

  // obstacles
  obstacles.forEach((o) => {
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(o.x, o.y, o.w, o.h);

    ctx.strokeStyle = "rgba(255,0,60,0.65)";
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  });

  // car
  if (carImgLoaded) {
    ctx.drawImage(carImg, car.x, car.y, car.w, car.h);
  } else {
    ctx.fillStyle = "rgba(255,0,60,0.85)";
    ctx.fillRect(car.x, car.y, car.w, car.h);
  }

  // HUD niveau
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px Orbitron, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`NIVEAU ${level}/6`, 14, 22);

  // texts
  if (!running && !gameOver) {
    drawText("Appuie sur ESPACE pour jouer", canvas.height / 2);
  }
  if (gameOver) {
    drawText("GAME OVER — ESPACE pour rejouer", canvas.height / 2);
  }
}

function drawText(text, y) {
  ctx.fillStyle = "white";
  ctx.font = "14px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, y);
}

/* ---------- Loop ---------- */
let last = performance.now();
function loop(now = performance.now()) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

/* ---------- Events ---------- */
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;

  if (e.code === "Space") {
    if (!running) startGame();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

/* ---------- Start ---------- */
init();