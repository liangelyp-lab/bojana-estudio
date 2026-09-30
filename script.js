// ============================================
// Bojana Estudio — Interactions v2
// Custom cursor · Canvas lines · Mouse parallax
// Language toggle · Magnetic buttons
// ============================================

/* ---- Translations ---- */
const T = {
  es: {
    discipline: "Arquitectura &amp; Ingeniería Civil",
    headline:   "Próximamente",
    body:       'Estamos construyendo algo con la misma dedicación<br class="br-d"/> que ponemos en cada proyecto.',
    progress:   "En construcción",
    scope:      "Trabajo remoto global &nbsp;·&nbsp; Presencial en Argentina",
    footer:     "© 2026 Bojana Estudio",
    langLabel:  "EN",
  },
  en: {
    discipline: "Architecture &amp; Civil Engineering",
    headline:   "Coming Soon",
    body:       'We\'re building something with the same dedication<br class="br-d"/> we bring to every project.',
    progress:   "Under construction",
    scope:      "Remote worldwide &nbsp;·&nbsp; On-site in Argentina",
    footer:     "© 2026 Bojana Estudio",
    langLabel:  "ES",
  }
};

let lang = "es";

function toggleLang() {
  lang = lang === "es" ? "en" : "es";
  applyLang(lang);
}

function applyLang(l) {
  const t = T[l];
  const $ = id => document.getElementById(id);
  $("txt-discipline").innerHTML = t.discipline;
  $("txt-headline").innerHTML   = `<span class="word">${t.headline}</span>`;
  $("txt-body").innerHTML       = t.body;
  $("txt-progress").textContent = t.progress;
  $("txt-scope").innerHTML      = t.scope;
  $("txt-footer").textContent   = t.footer;
  $("lang-label").textContent   = t.langLabel;
  document.documentElement.lang = l;
}

// Detect browser language
window.addEventListener("DOMContentLoaded", () => {
  if (navigator.language?.startsWith("en")) {
    lang = "en";
    applyLang("en");
  }
});

/* ---- Custom cursor ---- */
const cursor     = document.getElementById("cursor");
const cursorInner = cursor?.querySelector(".cursor-inner");
const cursorRing  = cursor?.querySelector(".cursor-ring");

let mx = -100, my = -100;
let rx = -100, ry = -100;

document.addEventListener("mousemove", e => {
  mx = e.clientX;
  my = e.clientY;
  if (cursorInner) {
    cursorInner.style.left = mx + "px";
    cursorInner.style.top  = my + "px";
  }
});

function lerp(a, b, t) { return a + (b - a) * t; }

function animateCursor() {
  rx = lerp(rx, mx, 0.12);
  ry = lerp(ry, my, 0.12);
  if (cursorRing) {
    cursorRing.style.left = rx + "px";
    cursorRing.style.top  = ry + "px";
  }
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover state for interactive elements
document.querySelectorAll("a, button, .logo").forEach(el => {
  el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
  el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
});

/* ---- Canvas: animated architectural lines ---- */
const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");

let W, H;
let mouseX = 0.5, mouseY = 0.5;
let lines   = [];
let nodes   = [];
let tick    = 0;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", () => { resize(); initCanvas(); });

document.addEventListener("mousemove", e => {
  mouseX = e.clientX / W;
  mouseY = e.clientY / H;
});

/* Grid nodes */
function initCanvas() {
  nodes = [];
  lines = [];

  const cols = Math.ceil(W / 120) + 1;
  const rows = Math.ceil(H / 120) + 1;

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      nodes.push({
        bx: c * 120,
        by: r * 120,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        ox: (Math.random() - 0.5) * 12,
        oy: (Math.random() - 0.5) * 12,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Horizontal + vertical lines from grid
  const cols1 = Math.ceil(W / 120) + 1;
  for (let r = 0; r <= Math.ceil(H / 120); r++) {
    for (let c = 0; c < cols1; c++) {
      const i = r * (cols1) + c;
      if (c < cols1 - 1) lines.push([i, i + 1]);           // horizontal
      if (r < Math.ceil(H / 120)) lines.push([i, i + cols1]); // vertical
    }
  }
}

function drawCanvas() {
  ctx.clearRect(0, 0, W, H);
  tick += 0.004;

  // Parallax influence from mouse
  const px = (mouseX - 0.5) * 30;
  const py = (mouseY - 0.5) * 20;

  // Update nodes
  nodes.forEach(n => {
    n.ox += n.vx;
    n.oy += n.vy;
    if (Math.abs(n.ox) > 14) n.vx *= -1;
    if (Math.abs(n.oy) > 14) n.vy *= -1;
  });

  // Draw lines
  ctx.lineWidth = 0.5;
  lines.forEach(([ai, bi]) => {
    const a = nodes[ai], b = nodes[bi];
    if (!a || !b) return;

    const ax = a.bx + a.ox + px;
    const ay = a.by + a.oy + py;
    const bx = b.bx + b.ox + px;
    const by_ = b.by + b.oy + py;

    // Fade lines near center (where content lives)
    const cx = (ax + bx) / 2 / W;
    const cy_ = (ay + by_) / 2 / H;
    const distCenter = Math.hypot(cx - 0.5, cy_ - 0.5);
    const alpha = Math.max(0, Math.min(0.07, (distCenter - 0.1) * 0.35));

    ctx.strokeStyle = `rgba(200,184,154,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by_);
    ctx.stroke();
  });

  // Glowing nodes at intersections (sparse, random)
  nodes.forEach((n, i) => {
    if (i % 9 !== 0) return;
    const nx = n.bx + n.ox + px;
    const ny_ = n.by + n.oy + py;
    const pulse = (Math.sin(tick * 2 + n.phase) + 1) / 2;
    const cx = nx / W, cy_ = ny_ / H;
    const dist = Math.hypot(cx - 0.5, cy_ - 0.5);
    const alpha = Math.max(0, (dist - 0.12) * 0.4) * pulse;

    ctx.fillStyle = `rgba(200,184,154,${alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(nx, ny_, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(drawCanvas);
}

initCanvas();
drawCanvas();

/* ---- Magnetic contact button ---- */
const magnet = document.querySelector(".magnetic");
if (magnet) {
  magnet.addEventListener("mousemove", e => {
    const r  = magnet.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width  / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    magnet.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
  });
  magnet.addEventListener("mouseleave", () => {
    magnet.style.transform = "";
  });
}

/* ---- Parallax on logo with mouse ---- */
const logoWrap = document.querySelector(".logo-wrap");
document.addEventListener("mousemove", e => {
  if (!logoWrap) return;
  const dx = (e.clientX / window.innerWidth  - 0.5) * 12;
  const dy = (e.clientY / window.innerHeight - 0.5) * 6;
  logoWrap.style.transform = `translate(${dx}px, ${dy}px)`;
});
