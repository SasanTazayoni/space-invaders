const soundToggler = document.querySelector("[data-sound-toggler]");

soundToggler.addEventListener("click", () => {
  setSoundEnabled(!isSoundEnabled());
  updateSoundButton();
  soundToggler.blur();
});

function updateSoundButton() {
  if (!isSoundEnabled()) {
    soundToggler.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    soundToggler.classList.remove("active");
  } else {
    soundToggler.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    soundToggler.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateSoundButton();
});
