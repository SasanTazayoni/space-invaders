const CONFIG = {
  canvas: {
    width: 1024,
    height: 576,
  },
  player: {
    speed: 6,
    scale: 0.4,
    projectileSpeed: -10,
    attackDelay: 2000,
    projectile: { width: 4, height: 16 },
  },
  invaderProjectiles: {
    green:  { radius: 4, speed: 3   },
    yellow: { width: 4, height: 20,  speed: 5  },
    orange: { width: 6, height: 32,  speed: 7  },
    red:    { width: 9, height: 180, speed: 10 },
  },
  sounds: {
    shipFire:       0.3,
    smallLaser:     0.3,
    mediumLaser:    0.2,
    bigLaser:       0.2,
    enormousLaser:  0.1,
    alienDestroyed: 0.2,
    shipDestroyed:  0.8,
  },
  grid: {
    velocity:            1.8,
    rows:                4,
    minColumns:          5,
    maxColumns:          7,
    columnSpacing:       40,
    rowSpacing:          30,
    dropDistance:        30,
    minShootingInterval: 20,
    maxShootingInterval: 300,
  },
  invaderFrequencies: [0.3, 0.55, 0.75, 0.9],
  frequencyDecreases: [0.03, 0.025, 0.02, 0.015],
  scoring: {
    invaderType1: 200,
    invaderType2: 200,
    invaderType3: 400,
    invaderType4: 600,
    invaderType5: 1000,
    waveClear:    10000,
  },
  scoreThresholds: [
    100000, 200000, 300000, 400000, 500000,
    600000, 700000, 800000, 900000, 1000000,
  ],
  spawnRate: {
    initial:          600,
    decreasePerStage: 30,
  },
  particles: {
    backgroundCount:     100,
    backgroundSpeed:     0.3,
    backgroundMaxRadius: 2,
    explosionCount:      15,
    explosionMaxRadius:  8,
    alienDeathCount:     15,
    alienDeathMaxRadius: 3,
  },
  timing: {
    gameOverDelay:      1000,
    stageClearDuration: 2000,
  },
};

const canvas = document.querySelector("[data-canvas]");
const gameScore = document.querySelector("[data-score]");
const context = canvas.getContext("2d");
let projectileInterval = null;
let firstProjectile = true;
let frames = 0;
let spawnRate = CONFIG.spawnRate.initial;
let randomInterval = Math.floor(Math.random() * spawnRate + spawnRate);
let invaderFrequencies = [...CONFIG.invaderFrequencies];
let thresholdsTriggered = Array(CONFIG.scoreThresholds.length).fill(false);
const stageClearModal = document.querySelector("[data-stage-clear-modal]");
const stageClearMessage = document.querySelector("[data-message]");
const endGameModal = document.querySelector("[data-end-game-modal]");
const animation = document.querySelector("[data-animation]");
const modalScore = document.querySelector("[data-end-score]");
const playBtn = document.querySelector("[data-play-btn]");
const overlay = document.querySelector("[data-overlay]");

// Audio pool — reuses Audio objects instead of creating new ones per sound

const audioPools = {};

function playPooledSound(src, volume) {
  if (!audioPools[src]) audioPools[src] = [];
  const pool = audioPools[src];
  let audio = pool.find((a) => a.ended || a.paused);
  if (!audio) {
    audio = new Audio(src);
    audio.onerror = () => {
      console.error("Failed to load audio:", src);
      pool.splice(pool.indexOf(audio), 1);
    };
    pool.push(audio);
  } else {
    audio.currentTime = 0;
  }
  audio.volume = volume;
  audio.play().catch(() => {});
}

// Reset game

document.addEventListener("DOMContentLoaded", () => {
  resetGame();
});

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
  thresholdsTriggered = Array(CONFIG.scoreThresholds.length).fill(false);

  game.over = false;
  game.active = true;
  score = 0;
  gameScore.innerHTML = score;
  spawnRate = CONFIG.spawnRate.initial;
  invaderFrequencies = [...CONFIG.invaderFrequencies];

  if (player) {
    player = null;
  }

  player = new Player();
  particles = [];
  projectiles = [];
  grids = [];
  invaderProjectiles = [];

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
        color: "white",
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
    this.velocity = {
      x: 0,
      y: 0,
    };

    this.opacity = 1;

    const image = new Image();
    image.src = "./assets/images/spaceship.png";
    image.onload = () => {
      const scale = CONFIG.player.scale;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = {
        x: canvas.width / 2 - this.width / 2,
        y: canvas.height - this.height,
      };
    };
    image.onerror = () => {
      console.error("Failed to load player image:", image.src);
    };
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
    if (this.image) {
      this.draw();
      this.position.x += this.velocity.x;
    }
  }
}

// Projectiles

class Projectile {
  constructor({ position, velocity, soundEnabled }) {
    this.position = position;
    this.velocity = velocity;
    this.soundEnabled = soundEnabled;
    this.height = CONFIG.player.projectile.height;
    this.width = CONFIG.player.projectile.width;
    this.playSound();
  }

  draw() {
    context.beginPath();
    context.rect(
      this.position.x - this.width / 2,
      this.position.y,
      this.width,
      this.height,
    );
    context.fillStyle = "white";
    context.fill();
    context.closePath();
  }

  playSound() {
    if (this.soundEnabled) {
      playPooledSound("./assets/sounds/ship-fire.mp3", CONFIG.sounds.shipFire);
    }
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class GreenProjectile extends Projectile {
  constructor({ position, velocity, soundEnabled }) {
    super({ position, velocity, soundEnabled });
    this.radius = CONFIG.invaderProjectiles.green.radius;
  }

  draw() {
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = "lightgreen";
    context.fill();
    context.closePath();
  }

  playSound() {
    if (this.soundEnabled) {
      playPooledSound("./assets/sounds/small-laser.mp3", CONFIG.sounds.smallLaser);
    }
  }
}

class YellowProjectile extends Projectile {
  constructor({ position, velocity, soundEnabled }) {
    super({ position, velocity, soundEnabled });
    this.height = CONFIG.invaderProjectiles.yellow.height;
    this.width = CONFIG.invaderProjectiles.yellow.width;
  }

  draw() {
    context.beginPath();
    context.rect(
      this.position.x - this.width / 2,
      this.position.y,
      this.width,
      this.height,
    );
    context.fillStyle = "yellow";
    context.fill();
    context.closePath();
  }

  playSound() {
    if (this.soundEnabled) {
      playPooledSound("./assets/sounds/medium-laser.mp3", CONFIG.sounds.mediumLaser);
    }
  }
}

class OrangeProjectile extends Projectile {
  constructor({ position, velocity, soundEnabled }) {
    super({ position, velocity, soundEnabled });
    this.height = CONFIG.invaderProjectiles.orange.height;
    this.width = CONFIG.invaderProjectiles.orange.width;
  }

  draw() {
    context.beginPath();
    context.rect(
      this.position.x - this.width / 2,
      this.position.y,
      this.width,
      this.height,
    );
    context.fillStyle = "orange";
    context.fill();
    context.closePath();
  }

  playSound() {
    if (this.soundEnabled) {
      playPooledSound("./assets/sounds/big-laser.mp3", CONFIG.sounds.bigLaser);
    }
  }
}

class RedProjectile extends Projectile {
  constructor({ position, velocity, soundEnabled }) {
    super({ position, velocity, soundEnabled });
    this.height = CONFIG.invaderProjectiles.red.height;
    this.width = CONFIG.invaderProjectiles.red.width;
  }

  draw() {
    context.beginPath();
    context.rect(
      this.position.x - this.width / 2,
      this.position.y,
      this.width,
      this.height,
    );
    context.fillStyle = "crimson";
    context.fill();
    context.closePath();
  }

  playSound() {
    if (this.soundEnabled) {
      playPooledSound("./assets/sounds/enormous-laser.mp3", CONFIG.sounds.enormousLaser);
    }
  }
}

// Explosion animations

class AnimatedParticle {
  constructor({ position, velocity, radius, color, fades, soundEnabled }) {
    this.position = position;
    this.velocity = velocity;
    this.soundEnabled = soundEnabled;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
    this.playSound();
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

  playSound() {
    if (this.soundEnabled) {
      playPooledSound(this.getSoundFilePath(), this.getSoundVolume());
    }
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.fades) this.opacity -= 0.01;
  }
}

class Particle extends AnimatedParticle {
  constructor({ position, velocity, radius, color, fades, soundEnabled }) {
    super({
      position,
      velocity,
      radius,
      color,
      fades,
      soundEnabled,
    });
  }

  getSoundFilePath() {
    return "./assets/sounds/alien-destroyed.mp3";
  }

  getSoundVolume() {
    return CONFIG.sounds.alienDestroyed;
  }
}

class Explosion extends AnimatedParticle {
  constructor({ position, velocity, radius, color, fades, soundEnabled }) {
    super({
      position,
      velocity,
      radius,
      color,
      fades,
      soundEnabled,
    });
  }

  getSoundFilePath() {
    return "./assets/sounds/ship-destroyed.mp3";
  }

  getSoundVolume() {
    return CONFIG.sounds.shipDestroyed;
  }
}

// Alien generator

class Invader {
  constructor({ position }) {
    this.velocity = {
      x: 0,
      y: 0,
    };

    const alienImages = [
      ["./assets/images/alien1.png", "invaderType1"],
      ["./assets/images/alien2.png", "invaderType2"],
      ["./assets/images/alien3.png", "invaderType3"],
      ["./assets/images/alien4.png", "invaderType4"],
      ["./assets/images/alien5.png", "invaderType5"],
    ];

    const image = new Image();
    const randomValue = Math.random();
    if (randomValue < invaderFrequencies[0]) {
      image.src = alienImages[0][0];
      this.type = alienImages[0][1];
    } else if (randomValue < invaderFrequencies[1]) {
      image.src = alienImages[1][0];
      this.type = alienImages[1][1];
    } else if (randomValue < invaderFrequencies[2]) {
      image.src = alienImages[2][0];
      this.type = alienImages[2][1];
    } else if (randomValue < invaderFrequencies[3]) {
      image.src = alienImages[3][0];
      this.type = alienImages[3][1];
    } else {
      image.src = alienImages[4][0];
      this.type = alienImages[4][1];
    }

    image.onload = () => {
      const scale = 1;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = {
        x: position.x,
        y: position.y,
      };
    };
    image.onerror = () => {
      console.error("Failed to load invader image:", image.src);
    };
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
    if (this.image) {
      this.draw();
      this.position.x += velocity.x;
      this.position.y += velocity.y;
    }
  }

  shoot(invaderProjectiles) {
    if (this.type === "invaderType3") {
      invaderProjectiles.push(
        new YellowProjectile({
          position: {
            x: this.position?.x + this.width / 2,
            y: this.position.y + this.height,
          },
          velocity: {
            x: 0,
            y: CONFIG.invaderProjectiles.yellow.speed,
          },
          soundEnabled,
        }),
      );
    } else if (this.type === "invaderType4") {
      invaderProjectiles.push(
        new OrangeProjectile({
          position: {
            x: this.position?.x + this.width / 2,
            y: this.position.y + this.height,
          },
          velocity: {
            x: 0,
            y: CONFIG.invaderProjectiles.orange.speed,
          },
          soundEnabled,
        }),
      );
    } else if (this.type === "invaderType5") {
      invaderProjectiles.push(
        new RedProjectile({
          position: {
            x: this.position?.x + this.width / 2,
            y: this.position.y + this.height,
          },
          velocity: {
            x: 0,
            y: CONFIG.invaderProjectiles.red.speed,
          },
          soundEnabled,
        }),
      );
    } else {
      invaderProjectiles.push(
        new GreenProjectile({
          position: {
            x: this.position?.x + this.width / 2,
            y: this.position.y + this.height,
          },
          velocity: {
            x: 0,
            y: CONFIG.invaderProjectiles.green.speed,
          },
          soundEnabled,
        }),
      );
    }
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

let player = new Player();
let projectiles = [];
let grids = [];
let invaderProjectiles = [];
let particles = [];

const keys = {
  a: {
    pressed: false,
  },
  ArrowLeft: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  ArrowRight: {
    pressed: false,
  },
  space: {
    pressed: false,
  },
};

let game = {
  over: false,
  active: true,
};

let score = 0;

// Background animation

for (let i = 0; i < 100; i++) {
  particles.push(
    new Particle({
      position: {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      },
      velocity: {
        x: 0,
        y: 0.3,
      },
      radius: Math.random() * 2,
      color: "white",
    }),
  );
}

// Game loop

function animate() {
  if (!game.active) return;
  requestAnimationFrame(animate);
  context.fillStyle = "#14011f";
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

    // projectile hits player
    if (
      (invaderProjectile.position.y + invaderProjectile.radius >=
        player.position.y &&
        invaderProjectile.position.x + invaderProjectile.radius >=
          player.position.x &&
        invaderProjectile.position.x <= player.position.x + player.width) ||
      (invaderProjectile.position.y + invaderProjectile.height >=
        player.position.y &&
        invaderProjectile.position.x + invaderProjectile.width >=
          player.position.x &&
        invaderProjectile.position.x <= player.position.x + player.width)
    ) {
      invaderProjectiles.splice(index, 1);
      player.opacity = 0;
      game.over = true;

      setTimeout(() => {
        game.active = false;
        const storedHighScore =
          parseInt(localStorage.getItem("High score")) || 0;
        if (score > storedHighScore) {
          animation.classList.add("visible");
          localStorage.setItem("High score", score);
        }
        openModal();
      }, CONFIG.timing.gameOverDelay);

      for (let i = 0; i < CONFIG.particles.explosionCount; i++) {
        particles.push(
          new Explosion({
            position: {
              x: player.position.x + player.width / 2,
              y: player.position.y + player.height / 2,
            },
            velocity: {
              x: (Math.random() - 0.5) * 2,
              y: (Math.random() - 0.5) * 2,
            },
            radius: Math.random() * CONFIG.particles.explosionMaxRadius,
            color: "#feffe8",
            fades: true,
            soundEnabled: !soundEnabled ? false : i === 0,
          }),
        );
      }
      continue;
    }

    if (
      invaderProjectile.position.y + invaderProjectile.radius >=
        canvas.height ||
      invaderProjectile.position.y + invaderProjectile.height >= canvas.height
    ) {
      invaderProjectiles.splice(index, 1);
    } else {
      invaderProjectile.update();
    }
  }

  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    if (projectile.position.y + projectile.height <= 0) {
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
      grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(
        invaderProjectiles,
      );
    }

    const hitInvaders = new Set();
    const hitProjectiles = new Set();

    grid.invaders.forEach((invader) => {
      invader.update({ velocity: grid.velocity });
      // projectiles hit alien
      projectiles.forEach((projectile) => {
        if (
          hitInvaders.has(invader) ||
          hitProjectiles.has(projectile)
        ) return;

        if (
          projectile.position.y - projectile.height / 2 <=
            invader.position?.y + invader.height &&
          projectile.position.y + projectile.height / 2 >= invader.position.y &&
          projectile.position.x + projectile.width / 2 >= invader.position.x &&
          projectile.position.x - projectile.width / 2 <=
            invader.position.x + invader.width
        ) {
          hitInvaders.add(invader);
          hitProjectiles.add(projectile);

          score += CONFIG.scoring[invader.type] ?? CONFIG.scoring.invaderType1;
          gameScore.innerHTML = score;

          for (let i = 0; i < CONFIG.particles.alienDeathCount; i++) {
            particles.push(
              new Particle({
                position: {
                  x: invader.position.x + invader.width / 2,
                  y: invader.position.y + invader.height / 2,
                },
                velocity: {
                  x: (Math.random() - 0.5) * 2,
                  y: (Math.random() - 0.5) * 2,
                },
                radius: Math.random() * CONFIG.particles.alienDeathMaxRadius,
                color: "white",
                fades: true,
                soundEnabled: !soundEnabled ? false : i === 0,
              }),
            );
          }
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
          lastInvader.position.x -
          firstInvader.position.x +
          lastInvader.width;
        grid.position.x = firstInvader.position.x;
      }

      if (grid.invaders.length === 0) {
        score += CONFIG.scoring.waveClear;
      }

      gameDifficultyIncrease(score);
      gameScore.innerHTML = score;
    }
  });

  if (
    (keys.a.pressed || keys.ArrowLeft.pressed) &&
    player.position?.x - player.width / 2 >= 0
  ) {
    player.velocity.x = -CONFIG.player.speed;
  } else if (
    (keys.d.pressed || keys.ArrowRight.pressed) &&
    player.position.x + 1.5 * player.width <= canvas.width
  ) {
    player.velocity.x = CONFIG.player.speed;
  } else {
    player.velocity.x = 0;
  }

  // spawn aliens
  if (frames % randomInterval === 0) {
    grids.push(new Grid());
    frames = 0;
    randomInterval = Math.floor(Math.random() * spawnRate + spawnRate);
  }

  frames++;
}

animate();

// Increase difficulty function

function gameDifficultyIncrease(score) {
  for (let i = 0; i < CONFIG.scoreThresholds.length; i++) {
    if (score >= CONFIG.scoreThresholds[i] && !thresholdsTriggered[i]) {
      for (let j = 0; j < invaderFrequencies.length; j++) {
        const newFrequency = (invaderFrequencies[j] -= CONFIG.frequencyDecreases[j]);
        invaderFrequencies[j] = parseFloat(newFrequency.toFixed(3));
        spawnRate -= CONFIG.spawnRate.decreasePerStage;
      }

      thresholdsTriggered[i] = true;

      stageClearMessage.textContent = `Stage ${i + 1} cleared`;
      stageClearModal.classList.add("open");
      setTimeout(function () {
        stageClearModal.classList.remove("open");
        stageClearMessage.textContent = "";
      }, CONFIG.timing.stageClearDuration);
    }
  }
}

// Open/close modal

function openModal() {
  endGameModal.classList.add("open");
  overlay.classList.add("open");
  modalScore.textContent = `Your score: ${score}`;
}

function closeModal() {
  endGameModal.classList.remove("open");
  overlay.classList.remove("open");
  modalScore.textContent = "";
}

// Key controls

window.addEventListener("keydown", (e) => {
  if (game.over) {
    if (e.key === " ") {
      e.preventDefault();
    }
    return;
  }

  switch (e.key) {
    case "a":
      keys.a.pressed = true;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = true;
      break;
    case "d":
      keys.d.pressed = true;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = true;
      break;
    case " ":
      e.preventDefault();
      if (projectileInterval === null) {
        projectiles.push(
          new Projectile({
            position: {
              x: player.position.x + player.width / 2,
              y: player.position.y,
            },
            velocity: {
              x: 0,
              y: CONFIG.player.projectileSpeed,
            },
            soundEnabled,
          }),
        );

        firstProjectile = false;

        projectileInterval = setInterval(
          () => {
            projectiles.push(
              new Projectile({
                position: {
                  x: player.position.x + player.width / 2,
                  y: player.position.y,
                },
                velocity: {
                  x: 0,
                  y: attackSpeed,
                },
                soundEnabled,
              }),
            );
          },
          firstProjectile ? 0 : CONFIG.player.attackDelay,
        );
      }
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "a":
      keys.a.pressed = false;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case " ":
      clearInterval(projectileInterval);
      projectileInterval = null;
      firstProjectile = true;
      break;
  }
});
