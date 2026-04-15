const soundToggler = document.querySelector('[data-sound-toggler]');
let soundEnabled = sessionStorage.getItem('soundEnabled') === 'false' ? false : true;

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
