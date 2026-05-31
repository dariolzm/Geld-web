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

const isReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(pointer: coarse)").matches;

function setBodyHeight() {
  if (isReduced || innerWidth <= 860) {
    document.body.style.height = "";
    return;
  }

  const height = wrapper.getBoundingClientRect().height;
  maxScroll = Math.max(0, height - innerHeight);
  document.body.style.height = `${height}px`;
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
}

function smoothScroll() {
  if (isReduced || innerWidth <= 860) {
    updateReveals();
    requestAnimationFrame(smoothScroll);
    return;
  }

  targetScroll = clamp(scrollY, 0, maxScroll);
  currentScroll += (targetScroll - currentScroll) * 0.075;
  wrapper.style.transform = `translate3d(0, ${-currentScroll}px, 0)`;

  parallaxLayers.forEach((layer) => {
    const scene = layer.closest(".scene");
    const rect = scene.getBoundingClientRect();
    const sceneTop = rect.top - targetScroll + currentScroll;
    const progress = (innerHeight - sceneTop) / (innerHeight + rect.height);
    layer.style.setProperty("--parallax", `${(progress - 0.5) * 72}px`);
  });

  updateReveals(currentScroll);
  requestAnimationFrame(smoothScroll);
}

function animateCursor() {
  if (isTouch) return;

  cursorX += (pointerX - cursorX) * 0.18;
  cursorY += (pointerY - cursorY) * 0.18;
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;
  cursorDot.style.left = `${pointerX}px`;
  cursorDot.style.top = `${pointerY}px`;

  requestAnimationFrame(animateCursor);
}

function resizeCanvas() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * ratio);
  canvas.height = Math.floor(innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawParticles() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const count = Math.round(Math.min(90, innerWidth / 18));
  const time = performance.now() * 0.00008;

  for (let index = 0; index < count; index += 1) {
    const seed = index * 91.7;
    const x = (Math.sin(seed + time * 13) * 0.5 + 0.5) * innerWidth;
    const y = (Math.cos(seed * 0.7 + time * 9) * 0.5 + 0.5) * innerHeight;
    const alpha = 0.04 + (Math.sin(seed + time * 80) + 1) * 0.035;

    ctx.beginPath();
    ctx.fillStyle = `rgba(240, 231, 216, ${alpha})`;
    ctx.arc(x, y, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawParticles);
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
  finalScene.classList.add("is-locked");
  currentScroll = 0;
  targetScroll = 0;
  wrapper.style.transform = "translate3d(0, 0, 0)";
  setBodyHeight();
}

accessGate.addEventListener("click", () => {
  document.body.classList.add("access-mode");
  finalScene.classList.remove("is-locked");
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
  form.reset();
});

addEventListener("resize", () => {
  setBodyHeight();
  resizeCanvas();
});

addEventListener("load", () => {
  setBodyHeight();
  updateReveals();
  setTimeout(() => preloader.classList.add("is-hidden"), 650);
});

setBodyHeight();
resizeCanvas();
setupMagnetic();
smoothScroll();
animateCursor();
drawParticles();
