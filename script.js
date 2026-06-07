const wrapper = document.querySelector("#smooth-wrapper");
const reveals = [...document.querySelectorAll(".reveal")];
const parallaxLayers = [...document.querySelectorAll(".scene-video, .scene-image")];
const cursor = document.querySelector(".cursor");
const cursorDot = document.querySelector(".cursor-dot");
const preloader = document.querySelector(".preloader");
const audioButton = document.querySelector(".audio-toggle");
const form = document.querySelector(".access-form");
const formNote = document.querySelector(".form-note");
const accessGate = document.querySelector("[data-unlock-access]");
const finalScene = document.querySelector("#invitation");
const secretScene = document.querySelector("#secret");
const secretForm = document.querySelector("#secret-form");
const secretNote = document.querySelector(".secret-note");
const navDots = document.querySelector("#nav-dots");
const prevButton = document.querySelector("[data-nav-prev]");
const nextButton = document.querySelector("[data-nav-next]");
const canvas = document.querySelector(".noise-field");
const ctx = canvas.getContext("2d");

let targetScroll = 0;
let currentScroll = 0;
let maxScroll = 0;
let pointerX = innerWidth / 2;
let pointerY = innerHeight / 2;
let cursorX = pointerX;
let cursorY = pointerY;
let audioContext;
let droneGain;
let oscillatorA;
let oscillatorB;
let noiseTimer;
let activeSectionIndex = 0;

const isReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(pointer: coarse)").matches;
const navigableScenes = [...document.querySelectorAll("#smooth-wrapper > .scene:not(.final-scene)")];

function setBodyHeight() {
  document.body.style.height = "";
  maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateReveals(scrollPosition = scrollY) {
  const trigger = innerHeight * 0.82;

  reveals.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const top = isReduced || innerWidth <= 860 ? rect.top : rect.top - scrollPosition + currentScroll;

    if (top < trigger) {
      element.classList.add("is-visible");
    }
  });

  updateActiveDot(scrollPosition);
}

function sceneOffset(scene) {
  return scene.offsetTop;
}

function goToScene(index) {
  if (document.body.classList.contains("access-mode") || !navigableScenes.length) return;

  const safeIndex = clamp(index, 0, navigableScenes.length - 1);
  activeSectionIndex = safeIndex;
  scrollTo({ top: sceneOffset(navigableScenes[safeIndex]), behavior: "smooth" });
  updateActiveDot();
}

function updateActiveDot(scrollPosition = currentScroll || scrollY) {
  if (!navDots || document.body.classList.contains("access-mode")) return;

  let closestIndex = 0;
  let closestDistance = Infinity;

  navigableScenes.forEach((scene, index) => {
    const distance = Math.abs(sceneOffset(scene) - scrollPosition);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  activeSectionIndex = closestIndex;
  [...navDots.children].forEach((dot, index) => {
    dot.classList.toggle("active", index === activeSectionIndex);
  });
  navigableScenes.forEach((scene, index) => {
    scene.classList.toggle("is-active", index === activeSectionIndex);
  });
}

function setupSectionNav() {
  if (!navDots) return;

  navigableScenes.forEach((scene, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir a ${scene.id}`);
    dot.addEventListener("click", () => goToScene(index));
    navDots.appendChild(dot);
  });

  prevButton?.addEventListener("click", () => goToScene(activeSectionIndex - 1));
  nextButton?.addEventListener("click", () => goToScene(activeSectionIndex + 1));
  updateActiveDot();
}

function smoothScroll() {
  updateReveals(scrollY);
}

function animateCursor() {
  return;
}

function resizeCanvas() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * ratio);
  canvas.height = Math.floor(innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawParticles() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
}

function createDrone() {
  audioContext = new AudioContext();
  droneGain = audioContext.createGain();
  oscillatorA = audioContext.createOscillator();
  oscillatorB = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();

  oscillatorA.type = "sine";
  oscillatorB.type = "triangle";
  oscillatorA.frequency.value = 54;
  oscillatorB.frequency.value = 81;
  filter.type = "lowpass";
  filter.frequency.value = 420;
  droneGain.gain.value = 0;

  oscillatorA.connect(filter);
  oscillatorB.connect(filter);
  filter.connect(droneGain);
  droneGain.connect(audioContext.destination);
  oscillatorA.start();
  oscillatorB.start();
}

function toggleAudio() {
  if (!audioContext) createDrone();

  const isOn = audioButton.getAttribute("aria-pressed") === "true";
  const nextGain = isOn ? 0 : 0.045;

  audioContext.resume();
  droneGain.gain.cancelScheduledValues(audioContext.currentTime);
  droneGain.gain.linearRampToValueAtTime(nextGain, audioContext.currentTime + 1.2);
  audioButton.setAttribute("aria-pressed", String(!isOn));
  audioButton.querySelector("span:last-child").textContent = isOn ? "Silencio" : "Señal";

  clearInterval(noiseTimer);
  if (!isOn) {
    noiseTimer = setInterval(() => {
      oscillatorA.frequency.linearRampToValueAtTime(52 + Math.random() * 6, audioContext.currentTime + 2.6);
      oscillatorB.frequency.linearRampToValueAtTime(77 + Math.random() * 8, audioContext.currentTime + 2.6);
    }, 2600);
  }
}

function setupMagnetic() {
  document.querySelectorAll(".magnetic").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * 0.16}px, ${y * 0.22}px)`;
    });

    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
    });
  });
}

addEventListener("pointermove", (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
});

document.querySelectorAll("a, button, input").forEach((element) => {
  element.addEventListener("pointerenter", () => cursor?.classList.add("is-active"));
  element.addEventListener("pointerleave", () => cursor?.classList.remove("is-active"));
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();

    if (link.getAttribute("href") === "#intro") {
      closeAccessRoom();
    }

    const offset = target.offsetTop;
    scrollTo({ top: offset, behavior: "smooth" });
  });
});

audioButton.addEventListener("click", toggleAudio);

function closeAccessRoom() {
  document.body.classList.remove("access-mode");
  document.documentElement.classList.remove("crash");
  finalScene.classList.add("is-locked");
  secretScene?.setAttribute("aria-hidden", "true");
  currentScroll = 0;
  targetScroll = 0;
  wrapper.style.transform = "translate3d(0, 0, 0)";
  setBodyHeight();
}

accessGate.addEventListener("click", () => {
  document.body.classList.add("access-mode");
  finalScene.classList.remove("is-locked");
  finalScene.classList.add("is-active");
  finalScene.querySelectorAll(".reveal").forEach((element) => element.classList.remove("is-visible"));
  currentScroll = 0;
  targetScroll = 0;
  wrapper.style.transform = "translate3d(0, 0, 0)";
  scrollTo({ top: 0, behavior: "auto" });
  setBodyHeight();

  requestAnimationFrame(() => {
    setTimeout(() => updateReveals(), 500);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = new FormData(form).get("email") || form.querySelector("input").value;
  formNote.textContent = value ? "Señal recibida. Espera el silencio." : "La Red Espera";
  if (value && secretScene) {
    document.documentElement.classList.add("crash");
    setTimeout(() => {
      secretScene.setAttribute("aria-hidden", "false");
      document.documentElement.classList.remove("crash");
    }, 420);
  }
  form.reset();
});

secretForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  secretNote.textContent = "Recibido. La primera ola se mueve en silencio.";
  secretForm.reset();
});

addEventListener("resize", () => {
  setBodyHeight();
  resizeCanvas();
});

addEventListener(
  "scroll",
  () => {
    updateReveals(scrollY);
  },
  { passive: true }
);

addEventListener("load", () => {
  setBodyHeight();
  updateReveals();
  setTimeout(() => preloader.classList.add("is-hidden"), 650);
});

setBodyHeight();
resizeCanvas();
setupMagnetic();
setupSectionNav();
smoothScroll();
animateCursor();
drawParticles();
