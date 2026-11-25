const soundToggler = document.querySelector("[data-sound-toggler]");

// aria-pressed is the single source of the button's state: screen readers
// announce it ("Sound, toggle button, pressed") and the CSS uses it to pick
// the icon and colour

soundToggler.addEventListener("click", () => {
  setSoundEnabled(!isSoundEnabled());
  updateSoundButton();
});

function updateSoundButton() {
  soundToggler.setAttribute("aria-pressed", String(isSoundEnabled()));
}

updateSoundButton();
