/* =================================================
   JEU 1 — Dodge Racer (Canvas)
   ================================================= */

// CONSTANTES
const CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 360,
  CAR_WIDTH: 90,
  CAR_HEIGHT: 160,
  CAR_SPEED: 620,
  ROAD_MARGIN: 90,
  INVUL_TIME: 0.8,
  SPAWN_DELAY_BASE: 0.9,
  OBSTACLE_PADDING: 4,
  HIT_THRESHOLD: 8,
  MAX_LIVES: 3,
  LEVEL_UP_SCORE: 120
};

// États du jeu
const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'gameover',
  HIGH_SCORES: 'highscores'
};

// Niveaux : vitesse, spawn delay, multi-spawn chance
const LEVELS = [
  { speed: 220, spawnDelay: 1.05, multiSpawnChance: 0.00 },
  { speed: 260, spawnDelay: 0.95, multiSpawnChance: 0.08 },
  { speed: 310, spawnDelay: 0.85, multiSpawnChance: 0.12 },
  { speed: 380, spawnDelay: 0.75, multiSpawnChance: 0.18 },
  { speed: 460, spawnDelay: 0.65, multiSpawnChance: 0.25 },
  { speed: 560, spawnDelay: 0.55, multiSpawnChance: 0.35 }
];

const MAX_LEVEL = 6;

// =====================================================
// PLAYER CLASS
// =====================================================
class Player {
  constructor(x, y, canvasHeight) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.CAR_WIDTH;
    this.height = CONFIG.CAR_HEIGHT;
    this.speed = CONFIG.CAR_SPEED;
    this.lives = CONFIG.MAX_LIVES;
    this.image = new Image();
    this.image.src = "../../assets/img/F1audi.png";
    this.imageLoaded = false;
    this.canvasHeight = canvasHeight;
    
    // Charger l'image et ajuster les dimensions selon le ratio
    this.image.onload = () => {
      this.imageLoaded = true;
      
      // Conserver le ratio original de l'image (Largeur/Hauteur)
      const ratio = this.image.naturalWidth / this.image.naturalHeight;
      
      // Faire la voiture à environ 28% de la hauteur du canvas
      this.height = Math.round(this.canvasHeight * 0.28);
      this.width = Math.round(this.height * ratio);
    };
  }

  update(dt, canvasWidth, keys) {
    // Déplacement horizontal
    if (keys.left) this.x -= this.speed * dt;
    if (keys.right) this.x += this.speed * dt;

    // Limiter à l'intérieur de la route
    const roadMargin = CONFIG.ROAD_MARGIN;
    const minX = roadMargin + 12;
    const maxX = canvasWidth - roadMargin - this.width - 12;
    this.x = Math.max(minX, Math.min(maxX, this.x));
  }

  resetPosition(canvasWidth, canvasHeight) {
    // Repositionner le joueur au centre-bas après chargement image
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = canvasHeight - this.height - 18;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.imageLoaded) {
      ctx.drawImage(this.image, 0, 0, this.width, this.height);
    } else {
      // Placeholder rectangle
      ctx.fillStyle = "rgba(255,0,60,0.85)";
      ctx.fillRect(0, 0, this.width, this.height);
    }
    
    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x + this.width * 0.18,
      y: this.y + this.height * 0.12,
      w: this.width * 0.64,
      h: this.height * 0.78
    };
  }

  takeDamage() {
    this.lives = Math.max(0, this.lives - 1);
  }

  isAlive() {
    return this.lives > 0;
  }
}

class Obstacle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  update(dt, speed, canvasHeight) {
    this.y += speed * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Contour blanc semi-transparent
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(0, 0, this.width, this.height);

    // Border rouge
    ctx.strokeStyle = "rgba(255,0,60,0.65)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);
    
    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x + CONFIG.OBSTACLE_PADDING,
      y: this.y + CONFIG.OBSTACLE_PADDING,
      w: this.width - CONFIG.OBSTACLE_PADDING * 2,
      h: this.height - CONFIG.OBSTACLE_PADDING * 2
    };
  }

  isOffScreen(canvasHeight) {
    return this.y > canvasHeight + 80;
  }
}

class RoadRenderer {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.roadScroll = 0;
  }

  update(dt, speed) {
    this.roadScroll -= dt * speed * 0.6;
  }

  draw(ctx) {
    const margin = CONFIG.ROAD_MARGIN;
    const roadW = this.canvasWidth - margin * 2;

    ctx.save();
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(margin, 0, roadW, this.canvasHeight);

    for (let i = 0; i < 140; i++) {
      const x = margin + Math.random() * roadW;
      const y = Math.random() * this.canvasHeight;
      const a = 0.02 + Math.random() * 0.05;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Bordures rouges + lueur
    ctx.strokeStyle = "rgba(255,0,60,0.75)";
    ctx.lineWidth = 4;
    ctx.strokeRect(margin, 0, roadW, this.canvasHeight);

    // Lignes latérales claires
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin + 16, 0);
    ctx.lineTo(margin + 16, this.canvasHeight);
    ctx.moveTo(margin + roadW - 16, 0);
    ctx.lineTo(margin + roadW - 16, this.canvasHeight);
    ctx.stroke();

    // Ligne centrale en pointillés (défilement)
    this.drawCenterLine(ctx, margin, roadW);

    // Vignette sur les bords pour le contraste
    this.drawVignette(ctx);

    ctx.restore();
  }

  drawCenterLine(ctx, margin, roadW) {
    const dashH = 26;
    const gap = 22;
    const total = dashH + gap;
    const centerX = this.canvasWidth / 2;

    let y = -(this.roadScroll % total);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    while (y < this.canvasHeight) {
      ctx.fillRect(centerX - 2, y, 4, dashH);
      y += total;
    }
  }

  drawVignette(ctx) {
    const grd = ctx.createLinearGradient(0, 0, this.canvasWidth, 0);
    grd.addColorStop(0, "rgba(0,0,0,0.55)");
    grd.addColorStop(0.18, "rgba(0,0,0,0)");
    grd.addColorStop(0.82, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }
}

// SPAWNER CLASS
class ObstacleSpawner {
  constructor() {
    this.spawnTimer = 0;
    this.spawnDelay = CONFIG.SPAWN_DELAY_BASE;
    this.obstacles = [];
  }

  update(dt, spawnDelay, level, canvasWidth) {
    this.spawnDelay = spawnDelay;
    this.spawnTimer += dt;

    if (this.spawnTimer > this.spawnDelay) {
      this.spawnTimer = 0;

      // Spawn de base
      this.spawn(canvasWidth);

      // Spawn multiple basé sur le niveau
      const chance = LEVELS[Math.min(level - 1, MAX_LEVEL - 1)].multiSpawnChance;
      if (Math.random() < chance) {
        this.spawn(canvasWidth);
      }

      // Triple spawn rare à haut niveau
      if (level >= 5 && Math.random() < chance * 0.35) {
        this.spawn(canvasWidth);
      }
    }
  }

  spawn(canvasWidth) {
    const obstacleW = 60 + Math.random() * 90;
    const obstacleH = 24 + Math.random() * 26;
    const x = CONFIG.ROAD_MARGIN + Math.random() * (canvasWidth - CONFIG.ROAD_MARGIN * 2 - obstacleW);

    this.obstacles.push(new Obstacle(x, -50, obstacleW, obstacleH));
  }

  getObstacles() {
    return this.obstacles;
  }

  removeObstacle(index) {
    this.obstacles.splice(index, 1);
  }

  clear() {
    this.obstacles.length = 0;
  }
}

// GAME STATE MANAGER
class GameStateManager {
  constructor() {
    this.currentState = GAME_STATES.MENU;
    this.previousState = null;
  }

  setState(newState) {
    this.previousState = this.currentState;
    this.currentState = newState;
  }

  getState() {
    return this.currentState;
  }

  isState(state) {
    return this.currentState === state;
  }
}

// GAME MANAGER CLASS (Moteur du jeu)
class GameManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    // Managers
    this.stateManager = new GameStateManager();

    // Entités
    this.player = new Player(
      canvas.width / 2 - CONFIG.CAR_WIDTH / 2,
      canvas.height - CONFIG.CAR_HEIGHT - 18,
      canvas.height
    );
    this.spawner = new ObstacleSpawner();
    this.roadRenderer = new RoadRenderer(canvas.width, canvas.height);

    // État du jeu
    this.score = 0;
    this.level = 1;
    this.bestScore = this.loadBestScore();
    this.invulnerable = 0;
    this.gameOverScore = 0;

    // Contrôles
    this.keys = { left: false, right: false };

    // Boucle
    this.lastTime = performance.now();

    // Setup
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Événements centralisés
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("keyup", (e) => this.handleKeyUp(e));

    // Bouton démarrer du menu
    const menuStartBtn = document.getElementById("menu-start");
    if (menuStartBtn) {
      menuStartBtn.addEventListener("click", () => this.startGame());
    }

    // Bouton restart
    const restartBtn = document.getElementById("restart");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => this.startGame());
    }
  }

  handleKeyDown(e) {
    if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") this.keys.right = true;

    // ESPACE : démarrer le jeu ou rejouer
    if (e.code === "Space") {
      if (this.stateManager.isState(GAME_STATES.MENU)) {
        this.startGame();
      } else if (this.stateManager.isState(GAME_STATES.GAME_OVER)) {
        // Vérifier l'utilisateur
        const user = this.getCurrentUser();
        if (user?.email) {
          this.startGame();
        } else {
          alert("Connecte-toi pour jouer");
        }
      }
    }

    // Échap : retour au menu
    if (e.code === "Escape") {
      if (this.stateManager.isState(GAME_STATES.PLAYING) ||
          this.stateManager.isState(GAME_STATES.GAME_OVER)) {
        this.gotoMenu();
      }
    }
  }

  handleKeyUp(e) {
    if (e.key === "ArrowLeft" || e.key === "a") this.keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") this.keys.right = false;
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch {
      return null;
    }
  }

  loadBestScore() {
    const user = this.getCurrentUser();
    if (!user?.email) return 0;

    try {
      const scores = JSON.parse(localStorage.getItem(`scores_${user.email}`)) || {};
      return scores.game1 || 0;
    } catch {
      return 0;
    }
  }

  saveBestScore(score) {
    const user = this.getCurrentUser();
    if (!user?.email) return;

    try {
      const key = `scores_${user.email}`;
      const scores = JSON.parse(localStorage.getItem(key)) || { game1: 0, game2: 0, game3: 0 };
      scores.game1 = Math.max(scores.game1, score);
      localStorage.setItem(key, JSON.stringify(scores));
      this.bestScore = scores.game1;
    } catch (e) {
      console.error("Erreur sauvegarde score:", e);
    }
  }

  startGame() {
    const user = this.getCurrentUser();
    if (!user) {
      alert("Connecte-toi pour jouer");
      return;
    }

    this.score = 0;
    this.level = 1;
    this.player.lives = CONFIG.MAX_LIVES;
    this.player.resetPosition(this.canvas.width, this.canvas.height);
    this.invulnerable = CONFIG.INVUL_TIME;
    this.spawner.clear();

    this.stateManager.setState(GAME_STATES.PLAYING);
    document.getElementById("score").textContent = "0";
    document.getElementById("lives").textContent = this.player.lives;

    const menuEl = document.querySelector(".menu");
    if (menuEl) menuEl.classList.add("hidden");
  }

  gotoMenu() {
    this.stateManager.setState(GAME_STATES.MENU);
    const menuEl = document.querySelector(".menu");
    if (menuEl) menuEl.classList.remove("hidden");
  }

  endGame() {
    this.gameOverScore = Math.floor(this.score);
    this.saveBestScore(this.gameOverScore);
    document.getElementById("best").textContent = this.bestScore;

    this.stateManager.setState(GAME_STATES.GAME_OVER);
  }

  update(dt) {
    if (this.stateManager.isState(GAME_STATES.PLAYING)) {
      this.updateGameplay(dt);
    }
  }

  updateGameplay(dt) {
    // Décrémenter invulnérabilité
    if (this.invulnerable > 0) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
    }

    // Mettre à jour le joueur
    this.player.update(dt, this.canvas.width, this.keys);

    // Mettre à jour la route
    const levelConfig = LEVELS[Math.min(this.level - 1, MAX_LEVEL - 1)];
    this.roadRenderer.update(dt, levelConfig.speed);

    // Mettre à jour spawner
    this.spawner.update(dt, levelConfig.spawnDelay, this.level, this.canvas.width);

    // Mettre à jour les obstacles
    const obstacles = this.spawner.getObstacles();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].update(dt, levelConfig.speed, this.canvas.height);

      // Supprimer si hors écran
      if (obstacles[i].isOffScreen(this.canvas.height)) {
        this.spawner.removeObstacle(i);
        continue;
      }

      // Collision
      if (this.invulnerable <= 0) {
        if (this.checkCollision(this.player, obstacles[i])) {
          this.player.takeDamage();
          document.getElementById("lives").textContent = this.player.lives;

          if (!this.player.isAlive()) {
            this.endGame();
            return;
          }

          // Reset invulnérabilité après hit
          this.invulnerable = CONFIG.INVUL_TIME;
          this.spawner.removeObstacle(i);
        }
      }
    }

    // Actualiser le score
    this.score += dt * 10;
    document.getElementById("score").textContent = Math.floor(this.score);

    // Passage de niveau
    const newLevel = Math.min(MAX_LEVEL, Math.floor(this.score / CONFIG.LEVEL_UP_SCORE) + 1);
    if (newLevel !== this.level) {
      this.level = newLevel;
    }
  }

  checkCollision(player, obstacle) {
    const playerHit = player.getHitbox();
    const obstacleHit = obstacle.getHitbox();

    // Calcul de l'intersection
    const ix = Math.max(0, Math.min(playerHit.x + playerHit.w, obstacleHit.x + obstacleHit.w) - Math.max(playerHit.x, obstacleHit.x));
    const iy = Math.max(0, Math.min(playerHit.y + playerHit.h, obstacleHit.y + obstacleHit.h) - Math.max(playerHit.y, obstacleHit.y));

    // Vérifier si intersection > seuil
    return ix > CONFIG.HIT_THRESHOLD && iy > CONFIG.HIT_THRESHOLD;
  }

  draw() {
    // Fond noir
    this.ctx.fillStyle = "#050505";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.roadRenderer.draw(this.ctx);

    const obstacles = this.spawner.getObstacles();
    obstacles.forEach(o => o.draw(this.ctx));

    this.player.draw(this.ctx);

    this.ctx.fillStyle = "rgba(255,255,255,0.75)";
    this.ctx.font = "12px Orbitron, sans-serif";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`NIVEAU ${this.level}/6`, 14, 22);

    if (this.stateManager.isState(GAME_STATES.PLAYING)) {

    } else if (this.stateManager.isState(GAME_STATES.GAME_OVER)) {
      this.drawGameOverMessage();
    }
  }

  drawGameOverMessage() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "14px Orbitron, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText("GAME OVER — ESPACE pour rejouer", this.canvas.width / 2, this.canvas.height / 2);
  }

  loop(now) {
    const dt = Math.min(0.033, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }
}

// INITIALISATION
let gameManager;

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game");
  if (canvas) {
    gameManager = new GameManager(canvas);
    gameManager.start();
  }
});