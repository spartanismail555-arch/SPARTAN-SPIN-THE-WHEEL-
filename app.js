/* =========================================================
   SPARTAN 💎 LUCKY WHEEL
   Supabase-powered shared wheel
   ========================================================= */


/* ---------------- SUPABASE ---------------- */

const SUPABASE_URL =
  "https://eejexypuzxlhgyhkqyeu.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_jkaUkbf1HTVS5q46LJVbrQ_Nt6PWojL";


/* ---------------- ELEMENTS ---------------- */

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const nameInput = document.getElementById("name");

const spinBtn = document.getElementById("spin");

const resetBtn = document.getElementById("resetBtn");

const message = document.getElementById("message");

const historyEl = document.getElementById("history");

const countEl = document.getElementById("count");


/* ---------------- STATE ---------------- */

let history = [];

let available = [
  2, 3, 4, 5, 6, 7, 8, 9, 10
];

let angle = 0;

let spinning = false;


/* ---------------- COLORS ---------------- */

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


/* =========================================================
   SUPABASE REQUEST HELPER
   ========================================================= */

async function api(path, options = {}) {

  const response = await fetch(
    SUPABASE_URL + "/rest/v1/" + path,
    {
      ...options,

      headers: {
        "apikey": SUPABASE_ANON_KEY,

        "Authorization":
          "Bearer " + SUPABASE_ANON_KEY,

        "Content-Type":
          "application/json",

        "Prefer":
          "return=representation",

        ...(options.headers || {})
      }
    }
  );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(errorText);
  }


  if (response.status === 204) {
    return [];
  }


  return response.json();
}


/* =========================================================
   LOAD SHARED HISTORY
   ========================================================= */

async function load() {

  try {

    history = await api(
      "spins?select=display_name,number,created_at&order=created_at.asc"
    );


    const usedNumbers =
      new Set(
        history.map(
          item => Number(item.number)
        )
      );


    available = [
      2, 3, 4, 5, 6, 7, 8, 9, 10
    ].filter(
      number => !usedNumbers.has(number)
    );


    draw();

    renderHistory();


    if (history.length === 10) {

      message.textContent =
        "🏆 All numbers have been claimed!";

    } else if (!spinning) {

      message.textContent =
        "Enter your name and spin.";

    }

  } catch (error) {

    console.error(error);

    message.textContent =
      "⚠️ Could not load shared history.";
  }
}


/* =========================================================
   RENDER HISTORY
   ========================================================= */

function renderHistory() {

  historyEl.innerHTML = "";


  if (history.length === 0) {

    historyEl.innerHTML =
      '<div class="empty">No spins yet. You could be first!</div>';

  } else {

    history.forEach(item => {

      const row =
        document.createElement("div");

      row.className = "row";


      row.innerHTML = `
        <span class="name">
          ${escapeHtml(item.display_name)}
        </span>

        <span class="num">
          #${Number(item.number)}
        </span>
      `;


      historyEl.appendChild(row);

    });

  }


  countEl.textContent =
    history.length + "/10";
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

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


/* =========================================================
   DRAW WHEEL
   ========================================================= */

function draw() {

  const size = 700;

  const dpr =
    window.devicePixelRatio || 1;


  canvas.width =
    size * dpr;

  canvas.height =
    size * dpr;


  canvas.style.width =
    "100%";

  canvas.style.height =
    "auto";


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  const centerX = 350;

  const centerY = 350;

  const radius = 310;


  const numbers =
    available.length > 0
      ? available
      : [2,3,4,5,6,7,8,9,10];


  const n = numbers.length;

  const step =
    (Math.PI * 2) / n;


  ctx.clearRect(
    0,
    0,
    size,
    size
  );


  ctx.save();


  ctx.translate(
    centerX,
    centerY
  );


  ctx.rotate(angle);


  for (
    let i = 0;
    i < n;
    i++
  ) {

    const start =
      i * step;

    const end =
      start + step;


    /* Slice */

    ctx.beginPath();

    ctx.moveTo(
      0,
      0
    );

    ctx.arc(
      0,
      0,
      radius,
      start,
      end
    );

    ctx.closePath();


    ctx.fillStyle =
      colors[i % colors.length];

    ctx.fill();


    ctx.strokeStyle =
      "#ffffff";

    ctx.lineWidth =
      5;

    ctx.stroke();


    /* Number */

    ctx.save();

    ctx.rotate(
      start + step / 2
    );


    ctx.fillStyle =
      "#111111";

    ctx.font =
      "900 42px system-ui";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";


    ctx.fillText(
      numbers[i],
      radius * 0.68,
      0
    );


    ctx.restore();
  }


  /* Center */

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    53,
    0,
    Math.PI * 2
  );


  ctx.fillStyle =
    "#ffffff";

  ctx.fill();


  ctx.strokeStyle =
    "#111111";

  ctx.lineWidth =
    5;

  ctx.stroke();


  ctx.font =
    "900 25px system-ui";

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "#111111";


  ctx.fillText(
    "💎",
    0,
    9
  );


  ctx.restore();
}


/* =========================================================
   SPIN
   ========================================================= */

async function spin() {

  if (spinning) {
    return;
  }


  const name =
    nameInput.value.trim();


  if (!name) {

    message.textContent =
      "Please enter your WhatsApp display name.";

    nameInput.focus();

    return;
  }


  if (available.length === 0) {

    message.textContent =
      "🏆 All numbers have been claimed!";

    return;
  }


  spinning = true;

  spinBtn.disabled = true;

  message.textContent =
    "🎡 Spinning...";


  try {

    /*
      Supabase randomly chooses
      and permanently reserves the number.
    */

    const result =
      await api(
        "rpc/spin_wheel",
        {
          method: "POST",

          body:
            JSON.stringify({
              p_name: name
            })
        }
      );


    const winner =
      Number(result[0].number);


    const index =
      available.indexOf(winner);


    const n =
      available.length;


    const step =
      (Math.PI * 2) / n;


    const current =
      (
        angle %
        (Math.PI * 2)
      + Math.PI * 2
      ) %
      (Math.PI * 2);


    /*
      The pointer is at the TOP.

      TOP = -PI / 2

      Rotate the center of the
      winning slice to the pointer.
    */

    const winningCenter =
      index * step +
      step / 2;


    let delta =
      (-Math.PI / 2) -
      winningCenter -
      current;


    while (delta < 0) {

      delta +=
        Math.PI * 2;
    }


    /*
      Extra rotations.
    */

    delta +=
      Math.PI * 2 * 6;


    const startAngle =
      angle;


    const endAngle =
      angle + delta;


    const duration =
      4500;


    const startTime =
      performance.now();


    await new Promise(
      resolve => {

        function animate(time) {

          const progress =
            Math.min(
              1,
              (time - startTime) /
              duration
            );


          const easing =
            1 -
            Math.pow(
              1 - progress,
              4
            );


          angle =
            startAngle +
            (endAngle -
             startAngle) *
            easing;


          draw();


          if (
            progress < 1
          ) {

            requestAnimationFrame(
              animate
            );

          } else {

            resolve();
          }
        }


        requestAnimationFrame(
          animate
        );
      }
    );


    angle =
      endAngle;


    draw();


    message.textContent =
      `🏆 ${name} won Number ${winner}!`;


    /*
      Reload shared history.
    */

    await load();


  } catch (error) {

    console.error(error);


    const text =
      String(error).toLowerCase();


    if (
      text.includes("already") ||
      text.includes("participant")
    ) {

      message.textContent =
        "⚠️ This name has already used its spin.";

    } else {

      message.textContent =
        "❌ Spin failed. Please try again.";
    }

  } finally {

    spinning = false;

    spinBtn.disabled = false;
  }
}


/* =========================================================
   RESET WHEEL
   ========================================================= */

async function resetWheel() {

  if (spinning) {
    return;
  }


  const password =
    prompt(
      "🔐 Enter the administrator password:"
    );


  if (password === null) {
    return;
  }


  if (!password) {

    alert(
      "Please enter a password."
    );

    return;
  }


  const confirmed =
    confirm(
      "⚠️ This will erase EVERY previous spin.\n\n" +
      "Are you sure you want to reset the wheel?"
    );


  if (!confirmed) {
    return;
  }


  resetBtn.disabled = true;

  resetBtn.textContent =
    "🔄 RESETTING...";


  try {

    await api(
      "rpc/reset_wheel",
      {
        method: "POST",

        body:
          JSON.stringify({
            p_password:
              password
          })
      }
    );


    history = [];


    available = [
      2,3,4,5,6,7,8,9,10
    ];


    angle = 0;


    draw();

    renderHistory();


    message.textContent =
      "🎡 Fresh round! All numbers are available.";


    alert(
      "✅ Wheel reset successfully!"
    );


  } catch (error) {

    console.error(error);


    alert(
      "❌ Reset failed.\n\n" +
      "Make sure the password is correct."
    );

  } finally {

    resetBtn.disabled = false;

    resetBtn.textContent =
      "🔐 RESET WHEEL";
  }
}


/* =========================================================
   EVENTS
   ========================================================= */

spinBtn.addEventListener(
  "click",
  spin
);


resetBtn.addEventListener(
  "click",
  resetWheel
);


window.addEventListener(
  "resize",
  draw
);


/* =========================================================
   START
   ========================================================= */

draw();

load();
