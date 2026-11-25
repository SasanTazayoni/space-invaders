const CONFIG = {
  canvas: {
    width: 1024,
    height: 576,
  },
  controls: {
    left: ["KeyA", "ArrowLeft", "Numpad4"],
    right: ["KeyD", "ArrowRight", "Numpad6"],
    fire: ["Space"],
  },
  images: {
    ship: "./assets/images/spaceship.png",
    alien1: "./assets/images/alien1.png",
    alien2: "./assets/images/alien2.png",
    alien3: "./assets/images/alien3.png",
    alien4: "./assets/images/alien4.png",
    alien5: "./assets/images/alien5.png",
  },
  colors: {
    // shared with the page via the --color-background CSS variable
    background: getComputedStyle(document.documentElement)
      .getPropertyValue("--color-background")
      .trim(),
    star: "white",
    debris: "white",
    explosion: "#feffe8",
    loadError: "white",
  },
  player: {
    speed: 6,
    scale: 0.4,
    attackDelay: 2000,
  },
  projectiles: {
    player: {
      shape: "rect",
      width: 4,
      height: 16,
      speed: -10,
      color: "white",
      sound: "shipFire",
    },
    green: {
      shape: "circle",
      radius: 4,
      speed: 3,
      color: "lightgreen",
      sound: "smallLaser",
    },
    yellow: {
      shape: "rect",
      width: 4,
      height: 20,
      speed: 5,
      color: "yellow",
      sound: "mediumLaser",
    },
    orange: {
      shape: "rect",
      width: 6,
      height: 32,
      speed: 7,
      color: "orange",
      sound: "bigLaser",
    },
    red: {
      shape: "rect",
      width: 9,
      height: 180,
      speed: 10,
      color: "crimson",
      sound: "enormousLaser",
    },
  },
  // Same order as invaderFrequencies: a roll below the nth threshold picks the
  // nth type, and a roll above every threshold picks the last one.
  invaders: [
    { image: "alien1", projectile: "green", points: 200 },
    { image: "alien2", projectile: "green", points: 200 },
    { image: "alien3", projectile: "yellow", points: 400 },
    { image: "alien4", projectile: "orange", points: 600 },
    { image: "alien5", projectile: "red", points: 1000 },
  ],
  sounds: {
    shipFire: { src: "./assets/sounds/ship-fire.mp3", volume: 0.3 },
    smallLaser: { src: "./assets/sounds/small-laser.mp3", volume: 0.3 },
    mediumLaser: { src: "./assets/sounds/medium-laser.mp3", volume: 0.2 },
    bigLaser: { src: "./assets/sounds/big-laser.mp3", volume: 0.2 },
    enormousLaser: { src: "./assets/sounds/enormous-laser.mp3", volume: 0.1 },
    alienDestroyed: { src: "./assets/sounds/alien-destroyed.mp3", volume: 0.2 },
    shipDestroyed: { src: "./assets/sounds/ship-destroyed.mp3", volume: 0.8 },
  },
  grid: {
    velocity: 1.8,
    rows: 4,
    minColumns: 5,
    maxColumns: 7,
    columnSpacing: 40,
    rowSpacing: 30,
    dropDistance: 30,
    minShootingInterval: 20,
    maxShootingInterval: 300,
  },
  invaderFrequencies: [0.3, 0.55, 0.75, 0.9],
  frequencyDecreases: [0.03, 0.025, 0.02, 0.015],
  scoring: {
    waveClear: 10000,
  },
  scoreThresholds: [
    100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000,
    1000000,
  ],
  spawnRate: {
    initial: 600,
    decreasePerStage: 30,
  },
  particles: {
    backgroundCount: 100,
    backgroundSpeed: 0.3,
    backgroundMaxRadius: 2,
    backgroundMinOpacity: 0.5,
    explosionCount: 15,
    explosionMaxRadius: 8,
    alienDeathCount: 15,
    alienDeathMaxRadius: 3,
    burstSpeed: 1,
    fadeRate: 0.01,
  },
  timing: {
    gameOverDelay: 1000,
    stageClearDuration: 2000,
  },
};

const canvas = document.querySelector("[data-canvas]");
const gameScore = document.querySelector("[data-score]");
const context = canvas.getContext("2d");
let projectileInterval = null;
let gameOverTimeout = null;
let stageClearTimeout = null;
let frames = 0;
let spawnRate = CONFIG.spawnRate.initial;
let randomInterval = nextSpawnInterval();
let invaderFrequencies = [...CONFIG.invaderFrequencies];
let thresholdsTriggered = Array(CONFIG.scoreThresholds.length).fill(false);
const stageClearModal = document.querySelector("[data-stage-clear-modal]");
const stageClearMessage = document.querySelector("[data-message]");
const endGameModal = document.querySelector("[data-end-game-modal]");
const animation = document.querySelector("[data-animation]");
const modalScore = document.querySelector("[data-end-score]");
const playBtn = document.querySelector("[data-play-btn]");

// Image preloading — every sprite is loaded once before the game starts, so
// objects always have their image, size and position from the moment they exist

const images = {};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function loadImages() {
  return Promise.all(
    Object.entries(CONFIG.images).map(([name, src]) =>
      loadImage(src).then((image) => {
        images[name] = image;
      }),
    ),
  );
}

function showLoadError() {
  context.fillStyle = CONFIG.colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = CONFIG.colors.loadError;
  context.font = '20px "Exo 2", Arial, sans-serif';
  context.textAlign = "center";
  context.fillText(
    "The game couldn't load. Please refresh the page.",
    canvas.width / 2,
    canvas.height / 2,
  );
}

// Sound — playAudio (shared.js) handles pooling and the sound setting

function playSound(name) {
  const { src, volume } = CONFIG.sounds[name];
  playAudio(src, volume);
}

// Collision helpers

function boxBounds({ position, width, height }) {
  return {
    left: position.x,
    right: position.x + width,
    top: position.y,
    bottom: position.y + height,
  };
}

function overlaps(a, b) {
  return (
    a.left <= b.right &&
    a.right >= b.left &&
    a.top <= b.bottom &&
    a.bottom >= b.top
  );
}

// Reset game

playBtn.addEventListener("click", () => {
  closeModal();
  clearCanvas();
  resetGame();
  animate();
});

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function resetGame() {
  clearTimeout(gameOverTimeout);
  gameOverTimeout = null;
  clearTimeout(stageClearTimeout);
  stageClearTimeout = null;
  stageClearModal.classList.remove("open");
  stageClearMessage.textContent = "";
  stopFiring();
  thresholdsTriggered = Array(CONFIG.scoreThresholds.length).fill(false);

  game.over = false;
  game.active = true;
  score = 0;
  gameScore.innerHTML = score;
  spawnRate = CONFIG.spawnRate.initial;
  randomInterval = nextSpawnInterval();
  invaderFrequencies = [...CONFIG.invaderFrequencies];

  player = new Player();
  particles = [];
  projectiles = [];
  grids = [];
  invaderProjectiles = [];

  const minOpacity = CONFIG.particles.backgroundMinOpacity;
  for (let i = 0; i < CONFIG.particles.backgroundCount; i++) {
    particles.push(
      new Particle({
        position: {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
        },
        velocity: {
          x: 0,
          y: CONFIG.particles.backgroundSpeed,
        },
        radius: Math.random() * CONFIG.particles.backgroundMaxRadius,
        color: CONFIG.colors.star,
        opacity: minOpacity + Math.random() * (1 - minOpacity),
      }),
    );
  }

  frames = 0;

  animation.classList.remove("visible");
}

// Canvas properties

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// Player generator

class Player {
  constructor() {
    this.image = images.ship;
    this.width = this.image.width * CONFIG.player.scale;
    this.height = this.image.height * CONFIG.player.scale;
    this.position = {
      x: canvas.width / 2 - this.width / 2,
      y: canvas.height - this.height,
    };
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.opacity = 1;
  }

  getBounds() {
    return boxBounds(this);
  }

  draw() {
    context.save();
    context.globalAlpha = this.opacity;

    context.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );

    context.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
  }
}

// Projectiles — position.x is the horizontal centre; position.y is the top
// edge of a rectangle or the centre of a circle

class Projectile {
  constructor({ kind, position }) {
    this.spec = CONFIG.projectiles[kind];
    this.position = position;
    this.velocity = {
      x: 0,
      y: this.spec.speed,
    };
  }

  getBounds() {
    const { x, y } = this.position;
    if (this.spec.shape === "circle") {
      const { radius } = this.spec;
      return {
        left: x - radius,
        right: x + radius,
        top: y - radius,
        bottom: y + radius,
      };
    }
    const { width, height } = this.spec;
    return {
      left: x - width / 2,
      right: x + width / 2,
      top: y,
      bottom: y + height,
    };
  }

  draw() {
    context.beginPath();
    if (this.spec.shape === "circle") {
      context.arc(
        this.position.x,
        this.position.y,
        this.spec.radius,
        0,
        Math.PI * 2,
      );
    } else {
      const { left, top } = this.getBounds();
      context.rect(left, top, this.spec.width, this.spec.height);
    }
    context.fillStyle = this.spec.color;
    context.fill();
    context.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

// Particles — background stars and explosion debris

class Particle {
  constructor({
    position,
    velocity,
    radius,
    color,
    opacity = 1,
    fades = false,
  }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = opacity;
    this.fades = fades;
  }

  draw() {
    context.save();
    context.globalAlpha = this.opacity;
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
    context.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.fades) this.opacity -= CONFIG.particles.fadeRate;
  }
}

function spawnBurst({ x, y, count, maxRadius, color }) {
  const spread = () => (Math.random() - 0.5) * 2 * CONFIG.particles.burstSpeed;
  for (let i = 0; i < count; i++) {
    particles.push(
      new Particle({
        position: { x, y },
        velocity: { x: spread(), y: spread() },
        radius: Math.random() * maxRadius,
        color,
        fades: true,
      }),
    );
  }
}

// Alien generator

function pickInvaderType() {
  const roll = Math.random();
  const index = invaderFrequencies.findIndex((threshold) => roll < threshold);
  return CONFIG.invaders[index === -1 ? CONFIG.invaders.length - 1 : index];
}

class Invader {
  constructor({ position, type }) {
    this.type = type;
    this.image = images[type.image];
    this.width = this.image.width;
    this.height = this.image.height;
    this.position = {
      x: position.x,
      y: position.y,
    };
  }

  getBounds() {
    return boxBounds(this);
  }

  draw() {
    context.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );
  }

  update({ velocity }) {
    this.draw();
    this.position.x += velocity.x;
    this.position.y += velocity.y;
  }

  shoot() {
    return new Projectile({
      kind: this.type.projectile,
      position: {
        x: this.position.x + this.width / 2,
        y: this.position.y + this.height,
      },
    });
  }
}

// Alien group spawn

class Grid {
  constructor() {
    this.position = {
      x: 0,
      y: 0,
    };

    this.velocity = {
      x: CONFIG.grid.velocity,
      y: 0,
    };

    this.invaders = [];

    const columns = Math.floor(
      Math.random() * (CONFIG.grid.maxColumns - CONFIG.grid.minColumns + 1) +
        CONFIG.grid.minColumns,
    );
    const rows = CONFIG.grid.rows;

    this.width = columns * CONFIG.grid.columnSpacing;

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        this.invaders.push(
          new Invader({
            position: {
              x: x * CONFIG.grid.columnSpacing,
              y: y * CONFIG.grid.rowSpacing,
            },
            type: pickInvaderType(),
          }),
        );
      }
    }
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.velocity.y = 0;

    if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
      this.velocity.x = -this.velocity.x;
      this.velocity.y = CONFIG.grid.dropDistance;
    }
  }
}

// Player movement

let player;
let projectiles = [];
let grids = [];
let invaderProjectiles = [];
let particles = [];

const heldKeys = new Set();

function isHeld(action) {
  return CONFIG.controls[action].some((code) => heldKeys.has(code));
}

let game = {
  over: false,
  active: true,
};

let score = 0;

// Game loop

function animate() {
  if (!game.active) return;
  requestAnimationFrame(animate);
  context.fillStyle = CONFIG.colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    if (particle.position.y - particle.radius >= canvas.height) {
      particle.position.x = Math.random() * canvas.width;
      particle.position.y = -particle.radius;
    }

    if (particle.opacity <= 0) {
      particles.splice(i, 1);
    } else {
      particle.update();
    }
  }

  player.update();

  for (let index = invaderProjectiles.length - 1; index >= 0; index--) {
    const invaderProjectile = invaderProjectiles[index];
    const bounds = invaderProjectile.getBounds();

    // projectile hits player — only the first hit counts; once the ship has
    // exploded, later projectiles pass through while the explosion plays out
    if (!game.over && overlaps(bounds, player.getBounds())) {
      invaderProjectiles.splice(index, 1);
      destroyPlayer();
      continue;
    }

    if (bounds.top >= canvas.height) {
      invaderProjectiles.splice(index, 1);
    } else {
      invaderProjectile.update();
    }
  }

  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    if (projectile.getBounds().bottom <= 0) {
      projectiles.splice(index, 1);
    } else {
      projectile.update();
    }
  }

  grids.forEach((grid) => {
    grid.update();
    // spawn projectiles
    const minShootingInterval = CONFIG.grid.minShootingInterval;
    const maxShootingInterval = CONFIG.grid.maxShootingInterval;
    // Generate a random shooting interval within the specified range
    const randomShootingInterval =
      Math.floor(
        Math.random() * (maxShootingInterval - minShootingInterval + 1),
      ) + minShootingInterval;
    // Check if the current frame matches the random interval
    if (frames % randomShootingInterval === 0 && grid.invaders.length > 0) {
      // Select random invaders to shoot
      const shooter =
        grid.invaders[Math.floor(Math.random() * grid.invaders.length)];
      const projectile = shooter.shoot();
      invaderProjectiles.push(projectile);
      playSound(projectile.spec.sound);
    }

    const hitInvaders = new Set();
    const hitProjectiles = new Set();

    grid.invaders.forEach((invader) => {
      invader.update({ velocity: grid.velocity });
      const invaderBounds = invader.getBounds();

      // an alien reaching the ship's row is an invasion — game over
      if (!game.over && invaderBounds.bottom >= player.position.y) {
        destroyPlayer();
      }

      // projectiles hit alien
      projectiles.forEach((projectile) => {
        // no scoring after the ship is destroyed
        if (
          game.over ||
          hitInvaders.has(invader) ||
          hitProjectiles.has(projectile)
        )
          return;

        if (overlaps(projectile.getBounds(), invaderBounds)) {
          hitInvaders.add(invader);
          hitProjectiles.add(projectile);

          score += invader.type.points;
          gameScore.innerHTML = score;

          spawnBurst({
            x: invader.position.x + invader.width / 2,
            y: invader.position.y + invader.height / 2,
            count: CONFIG.particles.alienDeathCount,
            maxRadius: CONFIG.particles.alienDeathMaxRadius,
            color: CONFIG.colors.debris,
          });
          playSound("alienDestroyed");
        }
      });
    });

    if (hitInvaders.size > 0) {
      grid.invaders = grid.invaders.filter((inv) => !hitInvaders.has(inv));
      projectiles = projectiles.filter((proj) => !hitProjectiles.has(proj));

      if (grid.invaders.length > 0) {
        const firstInvader = grid.invaders[0];
        const lastInvader = grid.invaders[grid.invaders.length - 1];
        grid.width =
          lastInvader.position.x - firstInvader.position.x + lastInvader.width;
        grid.position.x = firstInvader.position.x;
      }

      if (grid.invaders.length === 0) {
        score += CONFIG.scoring.waveClear;
      }

      gameDifficultyIncrease(score);
      gameScore.innerHTML = score;
    }
  });

  grids = grids.filter((grid) => grid.invaders.length > 0);

  if (isHeld("left")) {
    player.velocity.x = -CONFIG.player.speed;
  } else if (isHeld("right")) {
    player.velocity.x = CONFIG.player.speed;
  } else {
    player.velocity.x = 0;
  }
  player.position.x = Math.min(
    Math.max(player.position.x, 0),
    canvas.width - player.width,
  );

  // spawn aliens
  if (frames % randomInterval === 0) {
    grids.push(new Grid());
    frames = 0;
    randomInterval = nextSpawnInterval();
  }

  frames++;
}

loadImages()
  .then(() => {
    resetGame();
    animate();
  })
  .catch((error) => {
    console.error(error);
    showLoadError();
  });

function nextSpawnInterval() {
  return Math.floor(Math.random() * spawnRate + spawnRate);
}

// Increase difficulty function

function gameDifficultyIncrease(score) {
  for (let i = 0; i < CONFIG.scoreThresholds.length; i++) {
    if (score >= CONFIG.scoreThresholds[i] && !thresholdsTriggered[i]) {
      for (let j = 0; j < invaderFrequencies.length; j++) {
        const newFrequency = (invaderFrequencies[j] -=
          CONFIG.frequencyDecreases[j]);
        invaderFrequencies[j] = parseFloat(newFrequency.toFixed(3));
      }
      spawnRate -= CONFIG.spawnRate.decreasePerStage;

      thresholdsTriggered[i] = true;

      stageClearMessage.textContent = `Stage ${i + 1} cleared`;
      stageClearModal.classList.add("open");
      clearTimeout(stageClearTimeout);
      stageClearTimeout = setTimeout(function () {
        stageClearTimeout = null;
        stageClearModal.classList.remove("open");
        stageClearMessage.textContent = "";
      }, CONFIG.timing.stageClearDuration);
    }
  }
}

// Game over

function destroyPlayer() {
  player.opacity = 0;
  game.over = true;
  stopFiring();

  gameOverTimeout = setTimeout(() => {
    gameOverTimeout = null;
    game.active = false;
    if (score > getHighScore()) {
      animation.classList.add("visible");
      saveHighScore(score);
    }
    openModal();
  }, CONFIG.timing.gameOverDelay);

  spawnBurst({
    x: player.position.x + player.width / 2,
    y: player.position.y + player.height / 2,
    count: CONFIG.particles.explosionCount,
    maxRadius: CONFIG.particles.explosionMaxRadius,
    color: CONFIG.colors.explosion,
  });
  playSound("shipDestroyed");
}

// Open/close modal

function openModal() {
  modalScore.textContent = `Your score: ${score}`;
  endGameModal.showModal();
}

function closeModal() {
  endGameModal.close();
  modalScore.textContent = "";
}

// The player has to pick "Play again" or "Main menu", so Escape is blocked.
// Some browsers force the dialog shut on a repeated Escape; if that happens
// while the game is still over, open it again so the page isn't left frozen.
endGameModal.addEventListener("cancel", (e) => {
  e.preventDefault();
});

endGameModal.addEventListener("close", () => {
  if (!game.active) endGameModal.showModal();
});

// Key controls

function firePlayerProjectile() {
  if (!player) return;
  const projectile = new Projectile({
    kind: "player",
    position: {
      x: player.position.x + player.width / 2,
      y: player.position.y,
    },
  });
  projectiles.push(projectile);
  playSound(projectile.spec.sound);
}

function startFiring() {
  if (projectileInterval !== null) return;
  firePlayerProjectile();
  projectileInterval = setInterval(
    firePlayerProjectile,
    CONFIG.player.attackDelay,
  );
}

function stopFiring() {
  clearInterval(projectileInterval);
  projectileInterval = null;
}

window.addEventListener("keydown", (e) => {
  const isFireKey = CONFIG.controls.fire.includes(e.code);
  if (game.over) {
    // stop Space scrolling the page during the explosion, but let it press
    // the dialog's buttons once the game-over dialog is open
    if (isFireKey && !endGameModal.open) e.preventDefault();
    return;
  }
  if (isFireKey) e.preventDefault();

  heldKeys.add(e.code);
  if (isFireKey) startFiring();
});

window.addEventListener("keyup", (e) => {
  heldKeys.delete(e.code);
  if (CONFIG.controls.fire.includes(e.code)) stopFiring();
});

window.addEventListener("blur", () => {
  heldKeys.clear();
  stopFiring();
});
