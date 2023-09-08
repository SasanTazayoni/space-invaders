const soundToggler = document.querySelector('[data-sound-toggler');
let soundEnabled = sessionStorage.getItem('soundEnabled') === 'false' ? false : true;
const canvas = document.querySelector('[data-canvas]');
const gameScore = document.querySelector('[data-score]');
const context = canvas.getContext('2d');
let speed = 6;
let attackDelay = 2000;
let attackSpeed = -10;
let projectileInterval = null;
let firstProjectile = true;
let frames = 0;
let spawnRate = 500;
let randomInterval = Math.floor((Math.random() * spawnRate) + spawnRate);
let whiteFrequency = 0.3;
let greenFrequency = 0.55;
let yellowFrequency = 0.75;
let orangeFrequency = 0.9;
const invaderFrequencies = [whiteFrequency, greenFrequency, yellowFrequency, orangeFrequency];
const percentageDecreases = [0.03, 0.025, 0.02, 0.015];
const scoreThresholds = [
        100000,
        200000,
        300000,
        400000,
        500000,
        600000,
        700000,
        800000,
        900000,
        1000000
];
let thresholdsTriggered = Array(scoreThresholds.length).fill(false);
const stageClearModal = document.querySelector('[data-stage-clear-modal]');
const stageClearMessage = document.querySelector('[data-message]');
const endGameModal = document.querySelector('[data-end-game-modal]');
const animation = document.querySelector('[data-animation]');
const modalScore = document.querySelector('[data-end-score]');
const playBtn = document.querySelector('[data-play-btn]');
const overlay = document.querySelector('[data-overlay]');

soundToggler.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    soundToggler.blur();
    sessionStorage.setItem('soundEnabled', soundEnabled);
});

function updateSoundButton() {
    if (!soundEnabled) {
        soundToggler.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        soundToggler.classList.remove('active');
    } else {
        soundToggler.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        soundToggler.classList.add('active');
    }
    console.log(soundEnabled);
}

document.addEventListener('DOMContentLoaded', () => {
    resetGame();
    updateSoundButton();
});

playBtn.addEventListener('click', () => {
    closeModal();
    clearCanvas();
    resetGame();
    animate();
});

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function resetGame() {
    thresholdsTriggered = Array(scoreThresholds.length).fill(false);

    game.over = false;
    game.active = true;
    score = 0;
    gameScore.innerHTML = score;
    spawnRate = 600;
    whiteFrequency = 0.3;
    greenFrequency = 0.55;
    yellowFrequency = 0.75;
    orangeFrequency = 0.9;

    if (player) {
        player = null;
    }

    player = new Player();
    particles = [];
    projectiles = [];
    grids = [];
    invaderProjectiles = [];

    for (let i = 0; i < 100; i++) {
        particles.push(new Particle({
            position: {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height
            },
            velocity: {
                x: 0,
                y: 0.3
            },
            radius: Math.random() * 2,
            color: 'white',
        }));
    }

    frames = 0;

    animation.classList.remove('visible');
}

canvas.width = 1024;
canvas.height = 576;

// Player

class Player {
    constructor() {
        this.velocity = {
            x: 0,
            y: 0
        }

        this.opacity = 1;

        const image = new Image();
        image.src = './assets/images/spaceship.png';
        image.onload = () => {
            const scale = 0.4;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = {
                x: (canvas.width / 2) - (this.width / 2),
                y: canvas.height - (this.height )
            }
        }
    }

    draw() {
        context.save();
        context.globalAlpha = this.opacity;

        context.drawImage(
            this.image, 
            this.position.x, 
            this.position.y, 
            this.width, 
            this.height
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

// Player projectiles

class Projectile {
    constructor({ position, velocity, soundEnabled }) {
        this.position = position;
        this.velocity = velocity;
        this.soundEnabled = soundEnabled;
        this.height = 16;
        this.width = 4;
        this.playSound();
    }

    draw() {
        context.beginPath();
        context.rect(this.position.x - (this.width / 2), this.position.y, this.width, this.height); 
        context.fillStyle = "white";
        context.fill();
        context.closePath();
    }

    playSound() {
        if (this.soundEnabled) {
            const sound = new Audio("./assets/sounds/ship-fire.mp3");
            sound.volume = 0.3;
            sound.play();
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
        this.radius = 4;
        this.playSound();
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
            const sound = new Audio("./assets/sounds/small-laser.mp3");
            sound.volume = 0.3;
            sound.play();
        }
    }
}

class YellowProjectile extends Projectile {
    constructor({ position, velocity, soundEnabled }) {
        super({ position, velocity, soundEnabled });
        this.height = 20;
        this.width = 4;
        this.playSound();
    }

    draw() {
        context.beginPath();
        context.rect(this.position.x - (this.width / 2), this.position.y, this.width, this.height);
        context.fillStyle = "yellow";
        context.fill();
        context.closePath();
    }

    playSound() {
        if (this.soundEnabled) {
            const sound = new Audio("./assets/sounds/medium-laser.mp3");
            sound.volume = 0.2;
            sound.play();
        }
    }
}

class OrangeProjectile extends Projectile {
    constructor({ position, velocity, soundEnabled }) {
        super({ position, velocity, soundEnabled });
        this.height = 32;
        this.width = 6;
        this.playSound();
    }

    draw() {
        context.beginPath();
        context.rect(this.position.x - (this.width / 2), this.position.y, this.width, this.height);
        context.fillStyle = "orange";
        context.fill();
        context.closePath();
    }

    playSound() {
        if (this.soundEnabled) {
            const sound = new Audio("./assets/sounds/big-laser.mp3");
            sound.volume = 0.2;
            sound.play();
        }
    }
}

class RedProjectile extends Projectile {
    constructor({ position, velocity, soundEnabled }) {
        super({ position, velocity, soundEnabled });
        this.height = 180;
        this.width = 9;
        this.playSound();
    }

    draw() {
        context.beginPath();
        context.rect(this.position.x - (this.width / 2), this.position.y, this.width, this.height);
        context.fillStyle = "crimson";
        context.fill();
        context.closePath();
    }

    playSound() {
        if (this.soundEnabled) {
            const sound = new Audio("./assets/sounds/enormous-laser.mp3");
            sound.volume = 0.1;
            sound.play();
        }
    }
}

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
            const sound = new Audio(this.getSoundFilePath());
            sound.volume = this.getSoundVolume();
            sound.volume = 0.8;
            sound.play();
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
            soundEnabled
        });
    }

    getSoundFilePath() {
        return "./assets/sounds/alien-destroyed.mp3";
    }

    getSoundVolume() {
        return 0.2;
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
            soundEnabled
        });
    }

    getSoundFilePath() {
        return "./assets/sounds/ship-destroyed.mp3";
    }

    getSoundVolume() {
        return 0.8;
    }
}

class Invader {
    constructor({position}) {
        this.velocity = {
            x: 0,
            y: 0
        }

        const alienImages = [
            ['./assets/images/alien1.png', 'invaderType1'],
            ['./assets/images/alien2.png', 'invaderType2'],
            ['./assets/images/alien3.png', 'invaderType3'],
            ['./assets/images/alien4.png', 'invaderType4'],
            ['./assets/images/alien5.png', 'invaderType5']
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
                y: position.y
            };
        };
    }

    draw() {
        context.drawImage(
            this.image, 
            this.position.x, 
            this.position.y, 
            this.width, 
            this.height
        );
    }

    update({velocity}) {
        if (this.image) {
            this.draw();
            this.position.x += velocity.x;
            this.position.y += velocity.y;
        }
    }

    shoot(invaderProjectiles) {
        if (this.type === 'invaderType3') {
            invaderProjectiles.push(new YellowProjectile({
                position: {
                    x: this.position?.x + this.width / 2,
                    y: this.position.y + this.height
                },
                velocity: {
                    x: 0,
                    y: 5
                },
                soundEnabled
            }));
        } else if (this.type === 'invaderType4') {
            invaderProjectiles.push(new OrangeProjectile({
                position: {
                    x: this.position?.x + this.width / 2,
                    y: this.position.y + this.height
                },
                velocity: {
                    x: 0,
                    y: 8
                },
                soundEnabled
            }));
        } else if (this.type === 'invaderType5') {
            invaderProjectiles.push(new RedProjectile({
                position: {
                    x: this.position?.x + this.width / 2,
                    y: this.position.y + this.height
                },
                velocity: {
                    x: 0,
                    y: 11
                },
                soundEnabled
            }));
        } else {
            invaderProjectiles.push(new GreenProjectile({
                position: {
                    x: this.position?.x + this.width / 2,
                    y: this.position.y + this.height
                },
                velocity: {
                    x: 0,
                    y: 3
                },
                soundEnabled
            }));
        }
    }
}

class Grid {
    constructor() {
        this.position = {
            x: 0,
            y: 0
        }

        this.velocity = {
            x: 1.2,
            y: 0
        }

        this.invaders = [];

        const columns = Math.floor(Math.random() * 4 + 5);
        const rows = 4;   

        this.width = columns * 40;
        
        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                this.invaders.push(
                    new Invader({
                        position: {
                            x: x * 40,
                            y: y * 30
                        }
                    })
                )
            }
        }
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        this.velocity.y = 0;

        if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
            this.velocity.x = -this.velocity.x;
            this.velocity.y = 30;
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
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    },
    d: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    space: {
        pressed: false
    }
}

let game = {
    over: false,
    active: true
}

let score = 0;

for (let i = 0; i < 100; i++) {
    particles.push(new Particle({
        position: {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        },
        velocity: {
            x: 0,
            y: 0.3
        },
        radius: Math.random() * 2,
        color: 'white',
    }));
}

function animate() {
    if (!game.active) return;
    requestAnimationFrame(animate);
    context.fillStyle = '#14011f';
    context.fillRect(0, 0, canvas.width, canvas.height);     

    particles.forEach((particle, i) => {
        if (particle.position.y - particle.radius >= canvas.height) {
            particle.position.x = Math.random() * canvas.width;
            particle.position.y = -particle.radius;
        }

        if (particle.opacity <= 0) {
            setTimeout(() => {
                particles.splice(i, 1);
            }, 0);
        } else {
            particle.update();
        }
    });

    player.update();

    invaderProjectiles.forEach((invaderProjectile, index) => {
        if ((invaderProjectile.position.y + invaderProjectile.radius >= canvas.height)
        || (invaderProjectile.position.y + invaderProjectile.height >= canvas.height)) {
            setTimeout(() => {
                invaderProjectiles.splice(index, 1);
            }, 0);
        } else {
            invaderProjectile.update();
        }
        // projectile hits player
        if ((invaderProjectile.position.y + invaderProjectile.radius >= player.position.y
            && invaderProjectile.position.x + invaderProjectile.radius >= player.position.x
            && invaderProjectile.position.x <= player.position.x + player.width) || 
            (invaderProjectile.position.y + invaderProjectile.height >= player.position.y
            && invaderProjectile.position.x + invaderProjectile.width >= player.position.x
            && invaderProjectile.position.x <= player.position.x + player.width)) {
                
            setTimeout(() => {
                invaderProjectiles.splice(index, 1);
                player.opacity = 0;
                game.over = true;
            }, 0);

            setTimeout(() => {
                game.active = false;
                const storedHighScore = parseInt(localStorage.getItem('High score')) || 0;
                if (score > storedHighScore) {
                    animation.classList.add('visible');
                    localStorage.setItem('High score', score);
                }
                openModal();
            }, 1000);

            for (let i = 0; i < 15; i++) {
                particles.push(new Explosion({
                    position: {
                        x: player.position.x + player.width / 2,
                        y: player.position.y + player.height / 2
                    },
                    velocity: {
                        x: (Math.random() - 0.5) * 2,
                        y: (Math.random() - 0.5) * 2
                    },
                    radius: Math.random() * 8,
                    color: '#feffe8',
                    fades: true,
                    soundEnabled: !soundEnabled ? false : i === 0
                }));
            }
        }
    });

    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.height <= 0) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        } else {
            projectile.update();
        }
    });

    grids.forEach(grid => {
        grid.update();
        // spawn projectiles
        const minShootingInterval = 20;
        const maxShootingInterval = 140;
        // Generate a random shooting interval within the specified range
        const randomShootingInterval = Math.floor(Math.random() * (maxShootingInterval - minShootingInterval + 1)) + minShootingInterval;
        // Check if the current frame matches the random interval
        if (frames % randomShootingInterval === 0 && grid.invaders.length > 0) {
            // Select random invaders to shoot
            grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles);
        }

        grid.invaders.forEach((invader, i) => {
            invader.update({velocity: grid.velocity});
            // projectiles hit alien
            projectiles.forEach((projectile, j) => {
                if (projectile.position.y - (projectile.height / 2) <= invader.position?.y + invader.height 
                && projectile.position.y + (projectile.height / 2) >= invader.position.y
                && projectile.position.x + (projectile.width / 2) >= invader.position.x
                && projectile.position.x - (projectile.width / 2) <= invader.position.x + invader.width) {
                    setTimeout(() => {
                        const invaderFound = grid.invaders.find(
                            (invader2) => invader2 === invader);
                        const projectileFound = projectiles.find(
                            (projectile2) => projectile2 === projectile);

                        // remove invader and projectile
                        if (invaderFound && projectileFound) {
                            if (invader.type === 'invaderType1' || invader.type === 'invaderType2') {
                                score += 200;
                            } else if (invader.type === 'invaderType3') {
                                score += 400;
                            } else if (invader.type === 'invaderType4') {
                                score += 600;
                            } else {
                                score += 1000;
                            }
                            gameScore.innerHTML = score;

                            for (let i = 0; i < 15; i++) {
                                particles.push(new Particle({
                                    position: {
                                        x: invader.position.x + invader.width / 2,
                                        y: invader.position.y + invader.height / 2
                                    },
                                    velocity: {
                                        x: (Math.random() - 0.5) * 2,
                                        y: (Math.random() - 0.5) * 2
                                    },
                                    radius: Math.random() * 3,
                                    color: 'white',
                                    fades: true,
                                    soundEnabled: !soundEnabled ? false : i === 0
                                }));
                            }

                            grid.invaders.splice(i, 1);
                            projectiles.splice(j, 1);

                            if (grid.invaders.length > 0) {
                                const firstInvader = grid.invaders[0];
                                const lastInvader = grid.invaders[grid.invaders.length - 1];

                                grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width;
                                grid.position.x = firstInvader.position.x;
                            }

                            if (grid.invaders.length === 0) {
                                score += 10000;
                            }

                            gameDifficultyIncrease(score);
                            gameScore.innerHTML = score;
                        }
                    }, 0);
                }
            });
        });
    });

    if ((keys.a.pressed || keys.ArrowLeft.pressed) && player.position?.x - (player.width / 2) >= 0) {
        player.velocity.x = -speed;
    } else if ((keys.d.pressed || keys.ArrowRight.pressed) && player.position.x + 1.5 * player.width <= canvas.width) {
        player.velocity.x = speed;
    } else {
        player.velocity.x = 0;
    }

    // spawn aliens
    if (frames % randomInterval === 0) {
        grids.push(new Grid());
        frames = 0;
        Math.floor((Math.random() * spawnRate) + spawnRate);
    }

    frames++;
}

animate();

function gameDifficultyIncrease(score) {
    for (let i = 0; i < scoreThresholds.length; i++) {
        if (score >= scoreThresholds[i] && !thresholdsTriggered[i]) {
            for (let j = 0; j < invaderFrequencies.length; j++) {
                const newFrequency = invaderFrequencies[j] -= percentageDecreases[j];
                invaderFrequencies[j] = parseFloat(newFrequency.toFixed(3));
                spawnRate -= 30;
            }

            thresholdsTriggered[i] = true;
            console.log(`Checkpoint ${i + 1} reached!`);
            stageClearMessage.textContent = `Stage ${i + 1} cleared`;
            stageClearModal.classList.add('open');
            setTimeout(function() {
                stageClearModal.classList.remove('open');
                stageClearMessage.textContent = '';
            }, 2000);
        }
    }
}

function openModal() {
    endGameModal.classList.add('open');
    overlay.classList.add('open');
    modalScore.textContent = `Your score: ${score}`;
}

function closeModal() {
    endGameModal.classList.remove('open');
    overlay.classList.remove('open');
    modalScore.textContent = '';
}

window.addEventListener('keydown', (e) => {
    if (game.over) return;

    switch (e.key) {
        case 'a':
            keys.a.pressed = true;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            break;
        case 'd':
            keys.d.pressed = true;
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            break;
        case ' ':
            if (projectileInterval === null) {  
                projectiles.push(new Projectile({
                    position: {
                        x: player.position.x + (player.width / 2),
                        y: player.position.y
                    },
                    velocity: {
                        x: 0,
                        y: attackSpeed
                    },
                    soundEnabled
                }));

                firstProjectile = false;

                projectileInterval = setInterval(() => {
                    projectiles.push(new Projectile({
                        position: {
                            x: player.position.x + (player.width / 2),
                            y: player.position.y
                        },
                        velocity: {
                            x: 0,
                            y: attackSpeed
                        },
                        soundEnabled
                    }));
                }, firstProjectile ? 0 : attackDelay);
            }
        break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'a':
            keys.a.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case ' ':
            clearInterval(projectileInterval);
            projectileInterval = null;
            firstProjectile = true;
            break;
    }
});