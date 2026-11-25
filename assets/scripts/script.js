const storedHighScore = getHighScore();
const currentHighScore = document.querySelector("[data-current-high-score]");
const resetBtn = document.querySelector("[data-reset-button]");
const instructionsBtn = document.querySelector("[data-instructions-button]");
const startGameModal = document.querySelector("[data-start-game-modal]");
const closeBtn = document.querySelector("[data-close-btn]");

// High score text

function addLetterSpacingToText(text) {
  return text
    .split("")
    .map((letter) => `<span>${letter}</span>`)
    .join("&nbsp;");
}

if (storedHighScore > 0) {
  const lastSpan = currentHighScore.querySelector("span:last-child");
  if (lastSpan) {
    const spacedText = addLetterSpacingToText(storedHighScore.toString());
    lastSpan.innerHTML = spacedText;
  }
} else {
  currentHighScore.classList.remove("visible");
}

// Reset button

resetBtn.addEventListener("click", () => {
  clearHighScore();

  resetBtn.classList.add("explode");

  setTimeout(() => {
    resetBtn.classList.remove("explode");
  }, 300);

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
