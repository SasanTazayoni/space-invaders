// Helpers shared by the menu and game pages. This file must be the first
// script on each page: the scripts after it (all loaded with defer, so they
// run in order) call these functions.

// Storage — browsers that block site data throw on any storage access, so
// every read and write is wrapped: the game still runs, it just can't save

const HIGH_SCORE_KEY = "High score";
const SOUND_ENABLED_KEY = "soundEnabled";

function getHighScore() {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score);
  } catch {
    // storage blocked: the score just isn't kept
  }
}

function clearHighScore() {
  try {
    localStorage.removeItem(HIGH_SCORE_KEY);
  } catch {
    // storage blocked: there's nothing saved to clear
  }
}

// Sound setting — kept for the browser session so both pages stay in sync

let soundEnabled = loadSoundEnabled();

function loadSoundEnabled() {
  try {
    return sessionStorage.getItem(SOUND_ENABLED_KEY) !== "false";
  } catch {
    return true;
  }
}

function isSoundEnabled() {
  return soundEnabled;
}

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  try {
    sessionStorage.setItem(SOUND_ENABLED_KEY, enabled);
  } catch {
    // storage blocked: the setting lasts until the page is left
  }
}

// Audio pool — reuses Audio objects instead of creating new ones per sound

const audioPools = {};

function playAudio(src, volume) {
  if (!isSoundEnabled()) return;
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
