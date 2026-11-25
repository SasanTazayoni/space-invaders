const storedHighScore = getHighScore();
const currentHighScore = document.querySelector("[data-current-high-score]");
const resetBtn = document.querySelector("[data-reset-button]");
const instructionsBtn = document.querySelector("[data-instructions-button]");
const startGameModal = document.querySelector("[data-start-game-modal]");
const closeBtn = document.querySelector("[data-close-btn]");

// High score text — the visible digits are spaced out like the letters
// before them; screen readers get the plain number from the hidden label

if (storedHighScore > 0) {
  currentHighScore.querySelector("[data-high-score-label]").textContent =
    `Highest score: ${storedHighScore}`;
  currentHighScore.querySelector("[data-high-score-digits]").textContent =
    storedHighScore.toString().split("").join(" ");
} else {
  currentHighScore.classList.remove("visible");
}

// Reset button

resetBtn.addEventListener("click", () => {
  clearHighScore();

  // restart the wobble animation: remove the class, force the browser to
  // notice (reading offsetWidth), then add it back — no timer to keep in
  // sync with the animation's length in the CSS
  resetBtn.classList.remove("explode");
  void resetBtn.offsetWidth;
  resetBtn.classList.add("explode");

  currentHighScore.classList.remove("visible");

  playAudio("assets/sounds/ship-destroyed.mp3", 1);
});

// Modal open and close

// showModal() moves focus into the dialog, keeps Tab inside it, closes it on
// Escape and returns focus to the Instructions button afterwards

instructionsBtn.addEventListener("click", () => {
  startGameModal.showModal();
});

closeBtn.addEventListener("click", () => {
  startGameModal.close();
});

// clicks on the dimmed backdrop land on the dialog itself, outside its box
startGameModal.addEventListener("click", (e) => {
  if (e.target !== startGameModal) return;
  const box = startGameModal.getBoundingClientRect();
  const outside =
    e.clientX < box.left ||
    e.clientX > box.right ||
    e.clientY < box.top ||
    e.clientY > box.bottom;
  if (outside) startGameModal.close();
});

// Prevent scrolling with spacebar — only when nothing is focused, so Space
// still presses buttons for keyboard users

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
  }
});
