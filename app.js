/* =========================================================
   SPARTAN 💎 LUCKY WHEEL
   ========================================================= */

const SUPABASE_URL =
  "https://eejexypuzxlhgyhkqyeu.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_jkaUkbf1HTVS5q46LJVbrQ_Nt6PWojL";


/* =========================
   ELEMENTS
   ========================= */

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const nameInput = document.getElementById("name");
const spinBtn = document.getElementById("spin");
const resetBtn = document.getElementById("resetBtn");

const message = document.getElementById("message");
const historyEl = document.getElementById("history");
const countEl = document.getElementById("count");


/* =========================
   VARIABLES
   ========================= */

let history = [];

let available = [
  2, 3, 4, 5, 6, 7, 8, 9, 10
];

let angle = 0;
let spinning = false;


/* =========================
   COLORS
   ========================= */

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


/* =========================
   SUPABASE API
   ========================= */

async function supabaseRequest(endpoint, options = {}) {

  try {

    const response = await fetch(
      SUPABASE_URL + endpoint,
      {
        method: options.method || "GET",

        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization":
            "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(options.headers || {})
        },

        body: options.body || undefined
      }
    );


    const text = await response.text();

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }


    if (!response.ok) {

      console.error(
        "Supabase error:",
        response.status,
        data
      );

      throw new Error(
        typeof data === "string"
          ? data
          : JSON.stringify(data)
      );
    }


    return data;

  } catch (error) {

    console.error(
      "Request failed:",
      error
    );

    throw error;
  }
}


/* =========================
   LOAD SHARED HISTORY
   ========================= */

async function loadHistory() {

  try {

    history = await supabaseRequest(
      "/rest/v1/spins?select=display_name,number,created_at&order=created_at.asc"
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


    drawWheel();

    renderHistory();


    if (history.length >= 9) {

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


/* =========================
   HISTORY DISPLAY
   ========================= */

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


      const name =
        document.createElement("span");

      name.className = "name";

      name.textContent =
        item.display_name;


      const number =
        document.createElement("span");

      number.className = "num";

      number.textContent =
        "#" + Number(item.number);


      row.appendChild(name);

      row.appendChild(number);

      historyEl.appendChild(row);

    });

  }


  countEl.textContent =
    history.length + "/10";
}


/* =========================
   DRAW WHEEL
   ========================= */

function drawWheel() {

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


  const slice =
    (Math.PI * 2) / numbers.length;


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


  numbers.forEach(
    (number, index) => {

      const start =
        index * slice;

      const end =
        start + slice;


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
        colors[index % colors.length];

      ctx.fill();


      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth =
        5;

      ctx.stroke();


      ctx.save();

      ctx.rotate(
        start + slice / 2
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
        number,
        radius * 0.68,
        0
      );


      ctx.restore();

    }
  );


  /* CENTER */

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


/* =========================
   SPIN
   ========================= */

async function spinWheel() {

  if (spinning)
    return;


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
      "🏆 All numbers have been claimed.";

    return;
  }


  spinning = true;

  spinBtn.disabled = true;

  resetBtn.disabled = true;

  message.textContent =
    "🎡 Spinning...";


  try {

    /* Ask Supabase for a random unused number */

    const result =
      await supabaseRequest(
        "/rest/v1/rpc/spin_wheel",
        {
          method: "POST",

          body: JSON.stringify({
            p_name: name
          })
        }
      );


    const winner =
      Number(result[0].number);


    const index =
      available.indexOf(winner);


    if (index === -1) {

      throw new Error(
        "Winning number was not available on the wheel."
      );

    }


    const slice =
      (Math.PI * 2) /
      available.length;


    const current =
      ((angle % (Math.PI * 2))
        + Math.PI * 2)
      % (Math.PI * 2);


    const winningCenter =
      index * slice +
      slice / 2;


    let delta =
      (-Math.PI / 2)
      - winningCenter
      - current;


    while (delta < 0) {

      delta +=
        Math.PI * 2;

    }


    /* Several full rotations */

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


          /* Smooth slowdown */

          const easing =
            1 -
            Math.pow(
              1 - progress,
              4
            );


          angle =
            startAngle +
            (endAngle - startAngle)
            * easing;


          drawWheel();


          if (progress < 1) {

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


    drawWheel();


    message.textContent =
      `🏆 ${name} won Number ${winner}!`;


    /* Refresh shared results */

    await loadHistory();


  } catch (error) {

    console.error(
      "SPIN ERROR:",
      error
    );


    const errorText =
      String(error).toLowerCase();


    if (
      errorText.includes("already") ||
      errorText.includes("participant")
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

    resetBtn.disabled = false;

  }
}


/* =========================
   RESET WHEEL
   ========================= */

async function resetWheel() {

  console.log(
    "RESET BUTTON CLICKED"
  );


  if (spinning) {

    alert(
      "Please wait until the wheel stops spinning."
    );

    return;
  }


  /* PASSWORD BOX */

  const password =
    window.prompt(
      "🔐 Enter the administrator password:"
    );


  if (password === null) {

    return;

  }


  if (
    password.trim() !== "SPARTAN"
  ) {

    alert(
      "❌ Incorrect password."
    );

    return;
  }


  /* CONFIRMATION */

  const confirmed =
    window.confirm(
      "⚠️ This will erase EVERY previous spin.\n\n" +
      "Are you sure you want to reset the wheel?"
    );


  if (!confirmed)
    return;


  resetBtn.disabled =
    true;


  resetBtn.textContent =
    "🔄 RESETTING...";


  try {

    console.log(
      "Sending reset request..."
    );


    await supabaseRequest(
      "/rest/v1/rpc/reset_wheel",
      {
        method: "POST",

        body: JSON.stringify({
          p_password: "SPARTAN"
        })
      }
    );


    /* Clear local data */

    history = [];

    available = [
      2,3,4,5,6,7,8,9,10
    ];

    angle = 0;


    drawWheel();

    renderHistory();


    message.textContent =
      "🎡 Fresh round! All numbers are available.";


    alert(
      "✅ Wheel reset successfully!"
    );


  } catch (error) {

    console.error(
      "RESET ERROR:",
      error
    );


    alert(
      "❌ Reset failed.\n\n" +
      "Check that the Supabase reset function was created correctly."
    );


  } finally {

    resetBtn.disabled =
      false;

    resetBtn.textContent =
      "🔐 RESET WHEEL";

  }
}


/* =========================
   BUTTONS
   ========================= */

spinBtn.addEventListener(
  "click",
  spinWheel
);


resetBtn.addEventListener(
  "click",
  resetWheel
);


/* =========================
   ENTER KEY
   ========================= */

nameInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      spinWheel();

    }

  }
);


/* =========================
   RESIZE
   ========================= */

window.addEventListener(
  "resize",
  drawWheel
);


/* =========================
   START
   ========================= */

drawWheel();

loadHistory();

console.log(
  "🎡 SPARTAN 💎 Lucky Wheel loaded successfully."
);
