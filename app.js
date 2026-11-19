"use strict";

const $ = (id) => document.getElementById(id);
const WIDTH = 600;
const HEIGHT = 1280;
const PHOTO = { x: 36, width: 528, height: 336 };
const PHOTO_Y = [36, 402, 768];

const frames = [
  { name: "Solid color", color: "#6F775E" },
  { name: "Photobomber", color: "#363F61", file: "photobomber", windowKey: [54, 63, 97] },
  { name: "Death Note", color: "#C4C2C0", file: "death-note", behindPhotos: true },
  { name: "Webcore", color: "#4773C4", file: "webcore", behindPhotos: true },
  { name: "2010s", color: "#AAA6A3", file: "2010s", behindPhotos: true },
  { name: "Chainsaw Man", color: "#CB9F36", file: "chainsaw-man", behindPhotos: true },
  { name: "PS2", color: "#262322", file: "ps2", behindPhotos: true },
  { name: "Polka Dots Gradient", color: "#F5BACD", file: "polka-dots-gradient", behindPhotos: true },
  { name: "Elegant", color: "#2B2242", file: "elegant", behindPhotos: true },
  { name: "Ribbon", color: "#8B3436", file: "ribbon", behindPhotos: true },
  { name: "Gradient", color: "#693353", file: "gradient", behindPhotos: true },
  { name: "Sample heart", color: "#FFFFFF", file: "sample-heart", behindPhotos: true, mark: "♥" },
  { name: "Hiyuki", color: "#A72C2C", file: "hiyuki", behindPhotos: true },
];
const presets = [
  ["Olive", "#6F775E"], ["Rose", "#D8A9AD"], ["Blue", "#AAB7D0"],
  ["Lilac", "#B9ABC8"], ["Clay", "#AC6449"], ["Sand", "#E3D3B3"],
];
const video = $("video");
const start = $("start");
const status = $("status");
const countdown = $("countdown");
const cameraLabel = $("camera-label");
const cameraPlaceholder = $("camera-placeholder");
const shotProgress = $("shot-progress");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let screen = "frame";
let selected = frames[0];
let solidColor = selected.color;
let stream;
let session = 0;

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = window.reshootAssets?.[path] || path;
  });
}

function cropPhoto(ctx, source, x, y, width, height, mirror = false) {
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  ctx.save();
  ctx.translate(x + (mirror ? width : 0), y);
  if (mirror) ctx.scale(-1, 1);
  ctx.drawImage(source, (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2,
    cropWidth, cropHeight, 0, 0, width, height);
  ctx.restore();
}

function frameColor(frame) {
  return frame.file ? frame.color : solidColor;
}

function drawBackground(ctx, frame) {
  ctx.fillStyle = frameColor(frame);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function maskPhotoWindows(image, [red, green, blue]) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  for (const y of PHOTO_Y) {
    const tile = ctx.getImageData(PHOTO.x, y, PHOTO.width, PHOTO.height);
    const pixels = tile.data;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] === red && pixels[i + 1] === green && pixels[i + 2] === blue) {
        pixels[i + 3] = 0;
      }
    }
    ctx.putImageData(tile, PHOTO.x, y);
  }
  return canvas;
}

function footerColor(frame) {
  if (frame.file) return "#2c3027";
  const channels = solidColor.slice(1).match(/../g).map((part) => {
    const value = parseInt(part, 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels;
  return .2126 * r + .7152 * g + .0722 * b > .179 ? "#000000" : "#ffffff";
}

function drawStrip(canvas, frame, photos = [], thumbnail = false) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (frame.overlay && frame.behindPhotos) {
    ctx.drawImage(frame.overlay, 0, 0);
  } else if (!frame.overlay) {
    drawBackground(ctx, frame);
  }
  PHOTO_Y.forEach((y, index) => {
    if (photos[index]) {
      cropPhoto(ctx, photos[index], PHOTO.x, y, PHOTO.width, PHOTO.height);
    } else if (!frame.overlay || !frame.behindPhotos) {
      ctx.fillStyle = "#f2eee5";
      ctx.fillRect(PHOTO.x, y, PHOTO.width, PHOTO.height);
    }
  });
  if (frame.overlay) {
    if (!frame.behindPhotos) ctx.drawImage(frame.overlay, 0, 0);
    return;
  }
  ctx.fillStyle = footerColor(frame);
  ctx.textAlign = "center";
  if (!thumbnail) {
    ctx.font = '64px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("Re:Booth", WIDTH / 2, 1212);
  }
  if (frame.mark) {
    ctx.font = "54px Georgia, serif";
    ctx.fillText(frame.mark, thumbnail ? WIDTH / 2 : 80, thumbnail ? 1220 : 1205);
  }
}

function drawSelection() {
  drawStrip($("frame-strip"), selected);
  for (const frame of frames) {
    frame.button.setAttribute("aria-pressed", frame === selected);
    drawStrip(frame.thumbnail, frame, [], true);
  }
  $("color-options").hidden = Boolean(selected.file);
  for (const button of $("presets").children) {
    button.setAttribute("aria-pressed", button.dataset.color === solidColor);
  }
}

function setColor(color) {
  solidColor = color.toUpperCase();
  $("hex").value = solidColor;
  $("hex").removeAttribute("aria-invalid");
  $("hex-hint").textContent = "A shade for every kind of day.";
  $("color").value = solidColor.toLowerCase();
  $("swatch").style.background = solidColor;
  drawSelection();
}

for (const frame of frames) {
  const button = document.createElement("button");
  const canvas = document.createElement("canvas");
  button.type = "button";
  button.className = "frame-option";
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.setAttribute("aria-hidden", "true");
  button.append(canvas, frame.name);
  $("frames").append(button);
  frame.button = button;
  frame.thumbnail = canvas;
  button.onclick = () => {
    selected = frame;
    drawSelection();
  };
  if (frame.file) {
    loadImage(`./frames/${frame.file}.png`).then((overlay) => {
      if (overlay.naturalWidth === WIDTH && overlay.naturalHeight === HEIGHT) {
        frame.overlay = frame.windowKey ? maskPhotoWindows(overlay, frame.windowKey) : overlay;
        drawStrip(frame.thumbnail, frame, [], true);
        if (frame === selected) drawStrip($("frame-strip"), frame);
      }
    }).catch(() => {});
  }
}

for (const [name, color] of presets) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = name;
  button.setAttribute("aria-label", name);
  button.style.background = color;
  button.dataset.color = color;
  button.onclick = () => setColor(color);
  $("presets").append(button);
}

$("color").oninput = (event) => setColor(event.target.value);
$("hex").setAttribute("aria-describedby", "hex-hint");
$("hex").onchange = () => {
  const value = $("hex").value.trim();
  if (/^#?[0-9a-f]{6}$/i.test(value)) {
    setColor("#" + value.replace(/^#/, ""));
  } else {
    $("hex").setAttribute("aria-invalid", "true");
    $("hex-hint").textContent = "Enter a six-digit hex color, such as #6F775E.";
  }
};
$("hex").onkeydown = (event) => {
  if (event.key === "Enter") $("hex").onchange();
};

function selectionName() {
  if (selected.file) return selected.name;
  const preset = presets.find(([, color]) => solidColor === color);
  return `Solid color · ${preset?.[0] || solidColor}`;
}

function resetCamera() {
  session += 1;
  stream?.getTracks().forEach((track) => track.stop());
  stream = undefined;
  video.srcObject = null;
  video.hidden = true;
  cameraPlaceholder.hidden = false;
  cameraPlaceholder.textContent = "Opening camera…";
  cameraLabel.hidden = true;
  countdown.hidden = true;
  countdown.classList.remove("shot-taken");
  shotProgress.hidden = true;
  shotProgress.textContent = "0 of 3 photos taken";
  start.disabled = false;
  start.innerHTML = 'Enable camera <span aria-hidden="true">→</span>';
  status.textContent = "";
}

function showScreen(next, moveFocus = true) {
  if (screen === "capture") resetCamera();
  screen = next;
  document.body.dataset.screen = next;
  ["frame", "capture", "keep"].forEach((name, index) => {
    $(name).hidden = name !== next;
    const step = document.querySelectorAll(".steps li")[index];
    if (name === next) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
  $("back").hidden = next === "frame";
  $("back").textContent = next === "keep" ? "← Back to camera" : "← Change frame";
  $("capture-frame").textContent = selectionName();
  $("capture-swatch").style.background = frameColor(selected);
  $("keep-frame").textContent = selectionName();
  $("download-status").textContent = "";
  if (next === "capture") void enableCamera();
  if (moveFocus) {
    $(next).querySelector("h1").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

async function enableCamera() {
  const attempt = ++session;
  start.disabled = true;
  start.textContent = "Opening camera…";
  cameraPlaceholder.textContent = "Opening camera…";
  status.textContent = "Waiting for camera permission…";
  try {
    if (!window.isSecureContext) {
      resetCamera();
      cameraPlaceholder.textContent = "Camera requires localhost or HTTPS";
      status.textContent = "On the computer running Streamlit, open http://localhost:8501. On another device, open the site over HTTPS.";
      start.disabled = true;
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera API unavailable");
    const camera = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
    });
    if (session !== attempt) {
      camera.getTracks().forEach((track) => track.stop());
      return;
    }
    stream = camera;
    video.srcObject = camera;
    video.hidden = false;
    await video.play();
    if (session !== attempt) return;
    cameraPlaceholder.hidden = true;
    cameraLabel.hidden = false;
    shotProgress.hidden = false;
    start.innerHTML = 'Start 3-photo session <span aria-hidden="true">→</span>';
    start.disabled = false;
    status.textContent = "";
  } catch {
    if (session !== attempt) return;
    resetCamera();
    cameraPlaceholder.textContent = "Camera unavailable";
    status.textContent = "Allow camera access in your browser and select Enable camera to retry.";
  }
}

async function takePhotos() {
  const attempt = ++session;
  start.disabled = true;
  countdown.hidden = false;
  const photos = [];
  for (let index = 0; index < 3; index += 1) {
    countdown.classList.remove("shot-taken");
    status.textContent = `Get ready for photo ${index + 1} of 3.`;
    for (let seconds = 3; seconds > 0; seconds -= 1) {
      countdown.textContent = seconds;
      await wait(1000);
      if (session !== attempt) return;
    }
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !stream?.active) {
      resetCamera();
      cameraPlaceholder.textContent = "Camera disconnected";
      status.textContent = "The camera stopped. Enable it again to restart your session.";
      return;
    }
    const photo = document.createElement("canvas");
    photo.width = PHOTO.width;
    photo.height = PHOTO.height;
    cropPhoto(photo.getContext("2d"), video, 0, 0, photo.width, photo.height, true);
    photos.push(photo);
    shotProgress.textContent = `${photos.length} of 3 photos taken`;
    countdown.classList.add("shot-taken");
    countdown.textContent = `Photo ${photos.length} taken ✓`;
    status.textContent = `Photo ${photos.length} of 3 taken.`;
    await wait(1200);
    if (session !== attempt) return;
  }
  finish(photos);
}

function finish(photos) {
  drawStrip($("result-strip"), selected, photos);
  showScreen("keep");
}

$("to-capture").onclick = () => showScreen("capture");
$("back").onclick = () => showScreen(screen === "keep" ? "capture" : "frame");
$("retake").onclick = () => showScreen("capture");
start.onclick = () => stream ? takePhotos() : enableCamera();
$("download").onclick = () => {
  $("result-strip").toBlob((blob) => {
    if (!blob) {
      $("download-status").textContent = "Could not create the PNG. Try downloading again.";
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "re-booth-photostrip.png";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }, "image/png");
};
window.addEventListener("pagehide", resetCamera);

setColor(solidColor);
showScreen("frame", false);
document.fonts?.load('64px "Cormorant Garamond"').then(drawSelection).catch(() => {});
