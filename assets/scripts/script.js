const storedHighScore = parseInt(localStorage.getItem('High score')) || 0;
const currentHighScore = document.querySelector('[data-current-high-score]');
const soundToggler = document.querySelector('[data-sound-toggler]');
let soundEnabled = sessionStorage.getItem('soundEnabled') === 'false' ? false : true;
const resetBtn = document.querySelector('[data-reset-button]');
const instructionsBtn = document.querySelector('[data-instructions-button]');
const startGameModal = document.querySelector('[data-start-game-modal]');
const overlay = document.querySelector('[data-overlay]');
const closeBtn = document.querySelector('[data-close-btn]');

// High score text

function addLetterSpacingToText(text) {
  return text.split('').map(letter => `<span class="letter">${letter}</span>`).join('&nbsp;');
}

if (storedHighScore > 0) {
    const lastSpan = currentHighScore.querySelector('span:last-child');
    if (lastSpan) {
        lastSpan.textContent = storedHighScore;
        const spacedText = addLetterSpacingToText(storedHighScore.toString());
        lastSpan.innerHTML = spacedText;
    }
} else {
    currentHighScore.classList.remove('visible');
}

// Sound

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
}

document.addEventListener('DOMContentLoaded', () => {
    updateSoundButton();
});

// Reset button

function playResetSound() {
    if (soundEnabled) {
        const sound = new Audio("assets/sounds/ship-destroyed.mp3"); 
        sound.volume = 1;
        sound.play();
    }
}

resetBtn.addEventListener('click', () => {
    localStorage.removeItem('High score');

    resetBtn.classList.add('explode');

    setTimeout(() => {
        resetBtn.classList.remove('explode');
    }, 300);

    currentHighScore.classList.remove('visible');

    playResetSound();
});

// Modal open and close

instructionsBtn.addEventListener('click', () => {
    startGameModal.classList.add('open');
    overlay.classList.add('open');
});

closeBtn.addEventListener('click', () => {
    startGameModal.classList.remove('open');
    overlay.classList.remove('open');
});

// Prevent scrolling with spacebar

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
    }
});