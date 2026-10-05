/* SPARTAN 💎 LUCKY WHEEL
   Shared online wheel powered by Supabase
*/

const SUPABASE_URL = "https://eejexypuzxlhgyhkqyeu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jkaUkbf1HTVS5q46LJVbrQ_Nt6PWojL";

// Elements
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const nameInput = document.getElementById("name");
const spinBtn = document.getElementById("spin");
const message = document.getElementById("message");
const historyEl = document.getElementById("history");
const countEl = document.getElementById("count");

// State
let history = [];
let available = [2, 3, 4, 5, 6, 7, 8, 9, 10];
let angle = 0;
let spinning = false;

const colors = [
  "#ff4d6d",
  "#ff9f1c",
  "#ffd166",
  "#06d6a0",
  "#00b4d8",
  "#4361ee",
  "#8b5cf6",
  "#f72585",
  "#4cc9f0"
];

function configured() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY.startsWith("sb_")
  );
}

async function api(path, options = {}) {
  const response = await fetch(
    SUPABASE_URL + "/rest/v1/" + path,
    {
      ...options,
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.status === 204 ? [] : response.json();
}

// Load shared history
async function load() {
  if (!configured()) {
    message.textContent = "Supabase is not configured.";
    draw();
    return;
  }

  try {
    history = await api(
      "spins?select=display_name,number,created_at&order=created_at.asc"
    );

    const used = new Set(
      history.map(item => Number(item.number))
    );

    available = [2,3,4,5,6,7,8,9,10].filter(
      number => !used.has(number)
    );

    draw();
    renderHistory();

    if (history.length === 0) {
      message.textContent = "Enter your name and spin.";
    }

  } catch (error) {
    console.error(error);
    message.textContent =
      "Could not load shared history. Check your Supabase setup.";
  }
}

// Display previous winners
function renderHistory() {
  historyEl.innerHTML = "";

  if (history.length === 0) {
    historyEl.innerHTML =
      '<div class="empty">No spins yet. You could be first!</div>';
  }

  history.forEach(item => {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML =
      `<span class="name">${escapeHtml(item.display_name)}</span>` +
      `<span class="num">#${item.number}</span>`;

    historyEl.appendChild(row);
  });

  countEl.textContent = history.length + "/10";
}

// Prevent HTML injection
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}

// Draw wheel
function draw() {
  const dpr = window.devicePixelRatio || 1;
  const size = 700;

  canvas.width = size * dpr;
  canvas.height = size * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const centerX = 350;
  const centerY = 350;
  const radius = 310;

  const numbers = available.length
    ? available
    : [2,3,4,5,6,7,8,9,10];

  const n = numbers.length;
  const step = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  for (let i = 0; i < n; i++) {

    const startAngle = i * step;
    const endAngle = startAngle + step;

    // Slice
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(
      0,
      0,
      radius,
      startAngle,
      endAngle
    );
    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Number
    ctx.save();

    ctx.rotate(startAngle + step / 2);

    ctx.fillStyle = "#111111";
    ctx.font = "900 42px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      numbers[i],
      radius * 0.68,
      0
    );

    ctx.restore();
  }

  // Center
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    53,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = "#111111";
  ctx.font = "900 25px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("💎", 0, 9);

  ctx.restore();
}

// Spin
async function spin() {

  if (spinning) return;

  const name = nameInput.value.trim();

  if (!name) {
    message.textContent =
      "Enter your WhatsApp display name first.";
    nameInput.focus();
    return;
  }

  if (!configured()) {
    message.textContent =
      "The site is not connected to its shared database yet.";
    return;
  }

  if (available.length === 0) {
    message.textContent =
      "All numbers have been claimed!";
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  message.textContent = "🎡 Spinning...";

  try {

    // Supabase chooses the winner atomically.
    const result = await api(
      "rpc/spin_wheel",
      {
        method: "POST",
        body: JSON.stringify({
          p_name: name
        })
      }
    );

    const winner = Number(result[0].number);

    const index = available.indexOf(winner);
    const n = available.length;
    const step = (Math.PI * 2) / n;

    /*
      IMPORTANT FIX:

      The pointer is at the TOP of the wheel (-PI/2).
      Therefore we rotate the winning slice center
      directly underneath the pointer.
    */

    const current =
      ((angle % (Math.PI * 2)) + Math.PI * 2) %
      (Math.PI * 2);

    const winningSliceCenter =
      index * step + step / 2;

    let delta =
      (-Math.PI / 2) -
      winningSliceCenter -
      current;

    // Make sure it always spins forward.
    while (delta < 0) {
      delta += Math.PI * 2;
    }

    // Six full rotations for a nice spin.
    delta += Math.PI * 2 * 6;

    const startAngle = angle;
    const endAngle = angle + delta;

    const duration = 4500;
    const startTime = performance.now();

    await new Promise(resolve => {

      function animate(time) {

        const progress = Math.min(
          1,
          (time - startTime) / duration
        );

        // Smooth deceleration
        const easing =
          1 - Math.pow(1 - progress, 4);

        angle =
          startAngle +
          (endAngle - startAngle) * easing;

        draw();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(animate);
    });

    // Make the final position exact.
    angle = endAngle;
    draw();

    message.textContent =
      `🏆 ${name} won Number ${winner}!`;

    // Reload shared history.
    await load();

  } catch (error) {

    console.error(error);

    const errorText =
      String(error).toLowerCase();

    if (
      errorText.includes("already") ||
      errorText.includes("participant")
    ) {
      message.textContent =
        "⚠️ You have already used your one spin.";
    } else {
      message.textContent =
        "That spin could not be completed. Please try again.";
    }

  } finally {

    spinning = false;
    spinBtn.disabled = false;
  }
}

// Events
spinBtn.addEventListener("click", spin);

window.addEventListener(
  "resize",
  draw
);

// Start
load();
