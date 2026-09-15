// Generates abstract, on-brand SVG cover art for games/products.
// No external image sources — everything here is procedurally drawn
// so there's zero copyright/trademark risk and zero network dependency.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const BG = "#07070a";
const SURFACE = "#0e0e14";
const BORDER = "#2a2a38";

function grid(w, h, id) {
  return `
    <defs>
      <pattern id="${id}" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="${BORDER}" stroke-width="1" opacity="0.35"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>
  `;
}

function glow(cx, cy, r, color, id) {
  return `
    <defs>
      <radialGradient id="${id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>
  `;
}

function xAccent(w, h, color) {
  const s = Math.min(w, h) * 0.22;
  return `
    <g opacity="0.5" stroke="${color}" stroke-width="2.5" stroke-linecap="round">
      <path d="M ${w - s - 30} 30 L ${w - 30} 30 L ${w - 30} ${s + 30}" fill="none"/>
      <path d="M 30 ${h - s - 30} L 30 ${h - 30} L ${s + 30} ${h - 30}" fill="none"/>
    </g>
  `;
}

function rays(cx, cy, count, len, color, seed) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let out = `<g opacity="0.4" stroke="${color}" stroke-width="2" stroke-linecap="round">`;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.25;
    const r1 = len * 0.32;
    const r2 = len * (0.75 + rand() * 0.35);
    const x1 = cx + Math.cos(angle) * r1;
    const y1 = cy + Math.sin(angle) * r1;
    const x2 = cx + Math.cos(angle) * r2;
    const y2 = cy + Math.sin(angle) * r2;
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" opacity="${(0.25 + rand() * 0.5).toFixed(2)}"/>`;
  }
  out += "</g>";
  return out;
}

function energySlashes(w, h, color, seed, id) {
  // Bold diagonal action-lines, like an impact/power-up flash.
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let out = `
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${color}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${color}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g>
  `;
  for (let i = 0; i < 4; i++) {
    const yOff = h * (0.08 + i * 0.26) + rand() * 30;
    const barH = 10 + rand() * 16;
    out += `<rect x="${-w * 0.25}" y="${yOff.toFixed(1)}" width="${(w * 1.5).toFixed(1)}" height="${barH.toFixed(1)}" fill="url(#${id})" transform="rotate(-16 ${w / 2} ${yOff.toFixed(1)})"/>`;
  }
  out += "</g>";
  return out;
}

function particles(w, h, color, count, seed) {
  let out = "";
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 1.5 + rand() * 2.5;
    const o = 0.2 + rand() * 0.5;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

function svgWrap(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  ${inner}
</svg>`;
}

// ---- game emblems (abstract, not trademarked) ----

function emblemCubes(cx, cy, size, color) {
  // Interlocking rounded squares — generic "blocky world" motif.
  const s = size * 0.55;
  return `
    <g transform="translate(${cx} ${cy})" opacity="0.9">
      <rect x="${-s}" y="${-s * 0.3}" width="${s}" height="${s}" rx="14" fill="none" stroke="${color}" stroke-width="4" transform="rotate(-8)"/>
      <rect x="${-s * 0.2}" y="${-s * 0.75}" width="${s}" height="${s}" rx="14" fill="${color}" opacity="0.85" transform="rotate(6)"/>
      <rect x="${-s * 0.55}" y="${s * 0.05}" width="${s * 0.7}" height="${s * 0.7}" rx="12" fill="none" stroke="${color}" stroke-width="3" opacity="0.7" transform="rotate(-14)"/>
    </g>
  `;
}

function emblemBlob(cx, cy, size, color) {
  // Organic rounded blob with a small stem — abstract "fruit" vibe.
  const r = size * 0.42;
  return `
    <g transform="translate(${cx} ${cy})" opacity="0.9">
      <path d="M0 ${-r} C ${r * 1.1} ${-r} ${r * 1.15} ${r * 0.9} 0 ${r} C ${-r * 1.15} ${r * 0.9} ${-r * 1.1} ${-r} 0 ${-r} Z"
        fill="${color}" opacity="0.85"/>
      <path d="M0 ${-r * 1.05} C 6 ${-r * 1.35}, 18 ${-r * 1.4}, 22 ${-r * 1.55}"
        fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    </g>
  `;
}

function emblemBlade(cx, cy, size, color) {
  // Angular triangle cluster — sharp/competitive vibe.
  const s = size * 0.55;
  return `
    <g transform="translate(${cx} ${cy})" opacity="0.9">
      <path d="M0 ${-s} L ${s * 0.55} ${s * 0.3} L 0 ${s * 0.05} L ${-s * 0.55} ${s * 0.3} Z" fill="${color}" opacity="0.85"/>
      <path d="M0 ${-s * 0.5} L ${s * 0.85} ${s * 0.55} L 0 ${s * 0.7} L ${-s * 0.85} ${s * 0.55} Z" fill="none" stroke="${color}" stroke-width="3" opacity="0.6"/>
    </g>
  `;
}

function emblemGem(cx, cy, size, color) {
  const s = size * 0.5;
  return `
    <g transform="translate(${cx} ${cy})" opacity="0.95">
      <path d="M ${-s} ${-s * 0.35} L 0 ${-s} L ${s} ${-s * 0.35} L ${s * 0.6} ${s * 0.75} L 0 ${s} L ${-s * 0.6} ${s * 0.75} Z"
        fill="${color}" opacity="0.85"/>
      <path d="M ${-s} ${-s * 0.35} L 0 ${-s * 0.1} L ${s} ${-s * 0.35} M 0 ${-s * 0.1} L 0 ${s}"
        fill="none" stroke="${BG}" stroke-width="3" opacity="0.5"/>
    </g>
  `;
}

function emblemCoin(cx, cy, size, color) {
  // Round point/coin token — the countable "unit" for point-based
  // currencies (Valorant Points) in a pile().
  const r = size * 0.42;
  return `
    <g transform="translate(${cx} ${cy})" opacity="0.92">
      <circle cx="0" cy="0" r="${r}" fill="${color}" opacity="0.85"/>
      <circle cx="0" cy="0" r="${r * 0.7}" fill="none" stroke="${BG}" stroke-width="${(r * 0.12).toFixed(1)}" opacity="0.5"/>
      <path d="M ${(-r * 0.3).toFixed(1)} ${(-r * 0.12).toFixed(1)} L 0 ${(r * 0.3).toFixed(1)} L ${(r * 0.3).toFixed(1)} ${(-r * 0.12).toFixed(1)}"
        fill="none" stroke="${BG}" stroke-width="${(r * 0.14).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    </g>
  `;
}

function treasureChest(cx, cy, size, color) {
  // Abstract treasure-chest silhouette for the top price tier — domed
  // lid, strap band, keyhole.
  const w = size * 0.85;
  const h = size * 0.62;
  return `
    <g transform="translate(${cx} ${cy})" opacity="0.95">
      <path d="M ${(-w / 2).toFixed(1)} ${(-h * 0.05).toFixed(1)} Q 0 ${(-h * 0.68).toFixed(1)} ${(w / 2).toFixed(1)} ${(-h * 0.05).toFixed(1)} Z" fill="${color}" opacity="0.85"/>
      <rect x="${(-w / 2).toFixed(1)}" y="${(-h * 0.05).toFixed(1)}" width="${w.toFixed(1)}" height="${(h * 0.6).toFixed(1)}" rx="6" fill="${color}" opacity="0.85"/>
      <rect x="${(-w / 2).toFixed(1)}" y="${(-h * 0.08).toFixed(1)}" width="${w.toFixed(1)}" height="${(h * 0.1).toFixed(1)}" fill="${BG}" opacity="0.4"/>
      <circle cx="0" cy="${(h * 0.24).toFixed(1)}" r="${(h * 0.12).toFixed(1)}" fill="${BG}" opacity="0.6"/>
      <rect x="${(-h * 0.03).toFixed(1)}" y="${(h * 0.24).toFixed(1)}" width="${(h * 0.06).toFixed(1)}" height="${(h * 0.18).toFixed(1)}" fill="${BG}" opacity="0.6"/>
    </g>
  `;
}

// Scatters `count` copies of a unit emblem around (cx, cy) — a "pile" of
// the countable currency, flattened vertically so it reads as resting
// on a surface rather than floating.
function pile(cx, cy, unitFn, color, count, spread, unitSize, seed) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let out = "";
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = rand() * spread;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist * 0.55;
    const sizeVar = unitSize * (0.72 + rand() * 0.5);
    out += unitFn(x, y, sizeVar, color);
  }
  return out;
}

function emblemTicket(cx, cy, size, color) {
  // Coupon/voucher silhouette — rounded bar with punched notches and a
  // tear-line, reads unambiguously as "coupon" at a glance.
  const w = size * 0.9;
  const h = size * 0.42;
  const notchR = h * 0.22;
  return `
    <g transform="translate(${cx} ${cy})" opacity="0.95">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="${color}" opacity="0.85"/>
      <circle cx="${-w * 0.12}" cy="${-h / 2}" r="${notchR}" fill="${BG}"/>
      <circle cx="${-w * 0.12}" cy="${h / 2}" r="${notchR}" fill="${BG}"/>
      <line x1="${-w * 0.12}" y1="${-h / 2 + notchR}" x2="${-w * 0.12}" y2="${h / 2 - notchR}" stroke="${BG}" stroke-width="2.5" stroke-dasharray="5 5" opacity="0.6"/>
      <circle cx="${w * 0.3}" cy="0" r="${h * 0.16}" fill="none" stroke="${BG}" stroke-width="2.5" opacity="0.55"/>
      <path d="M ${w * 0.22} 0 L ${w * 0.28} ${h * 0.08} L ${w * 0.38} ${-h * 0.08}" fill="none" stroke="${BG}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    </g>
  `;
}

// Accent + emblem per game matches src/lib/game-theme.ts and what's
// actually being sold — keep in sync. Roblox = blocky cubes (brand),
// Free Fire = diamond (เพชร), RoV = coupon (คูปอง), Valorant = blade
// (tactical shooter).
const GAMES = [
  { file: "roblox.svg", accent: "#8b5cf6", emblem: emblemCubes, seed: 11 },
  { file: "free-fire.svg", accent: "#f97316", emblem: emblemGem, seed: 22 },
  { file: "rov.svg", accent: "#38bdf8", emblem: emblemTicket, seed: 33 },
  { file: "valorant.svg", accent: "#fb7185", emblem: emblemBlade, seed: 44 },
];

function renderGameCover({ accent, emblem, seed }) {
  const w = 800, h = 1000;
  const inner = `
    ${grid(w, h, "grid")}
    ${energySlashes(w, h, accent, seed, `slash${seed}`)}
    ${glow(w * 0.5, h * 0.42, 520, accent, "glow0")}
    ${glow(w * 0.75, h * 0.2, 380, accent, "glow1")}
    ${glow(w * 0.15, h * 0.85, 320, accent, "glow2")}
    ${rays(w / 2, h * 0.42, 16, 420, accent, seed)}
    ${particles(w, h, accent, 34, seed)}
    ${emblem(w / 2, h * 0.42, 400, accent)}
    ${xAccent(w, h, accent)}
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="${BORDER}" stroke-width="2"/>
  `;
  return svgWrap(w, h, inner);
}

const PRODUCTS = [
  // Roblox — general Robux (blocky cubes, matches the game's own brand emblem)
  { file: "roblox-gift-card-100.svg", accent: "#8b5cf6", scale: 0.7, particleCount: 8, seed: 101, emblem: emblemCubes },
  { file: "roblox-gift-card-250.svg", accent: "#9370f5", scale: 0.8, particleCount: 12, seed: 102, emblem: emblemCubes },
  { file: "roblox-gift-card-500.svg", accent: "#a78bfa", scale: 0.9, particleCount: 16, seed: 103, emblem: emblemCubes },
  { file: "roblox-gift-card-800.svg", accent: "#b7a3fc", scale: 1.0, particleCount: 22, seed: 104, emblem: emblemCubes },
  { file: "roblox-gift-card-1700.svg", accent: "#c4b5fd", scale: 1.15, particleCount: 30, seed: 105, emblem: emblemCubes },

  // Roblox — "Blox Fruits" category (still Robux, themed cyan to stand out)
  { file: "roblox-bloxfruits-robux-400.svg", accent: "#22d3ee", scale: 0.75, particleCount: 10, seed: 201, emblem: emblemBlob },
  { file: "roblox-bloxfruits-robux-800.svg", accent: "#45dcf0", scale: 0.9, particleCount: 16, seed: 202, emblem: emblemBlob },
  { file: "roblox-bloxfruits-robux-1700.svg", accent: "#6ce4f3", scale: 1.0, particleCount: 22, seed: 203, emblem: emblemBlob },
  { file: "roblox-bloxfruits-robux-4500.svg", accent: "#93ecf6", scale: 1.2, particleCount: 30, seed: 204, emblem: emblemBlob },

  // Free Fire — เพชร (diamonds) — faceted gem, reads as "diamond" at a glance
  { file: "freefire-diamond-58.svg", accent: "#f97316", scale: 0.7, particleCount: 8, seed: 301, emblem: emblemGem },
  { file: "freefire-diamond-172.svg", accent: "#fa8a3f", scale: 0.85, particleCount: 12, seed: 302, emblem: emblemGem },
  { file: "freefire-diamond-310.svg", accent: "#fb9d5f", scale: 0.95, particleCount: 18, seed: 303, emblem: emblemGem },
  { file: "freefire-diamond-517.svg", accent: "#fcb080", scale: 1.05, particleCount: 24, seed: 304, emblem: emblemGem },
  { file: "freefire-diamond-1052.svg", accent: "#fdc3a0", scale: 1.15, particleCount: 28, seed: 305, emblem: emblemGem },
  { file: "freefire-diamond-3698.svg", accent: "#fed7c0", scale: 1.3, particleCount: 34, seed: 306, emblem: emblemGem },

  // RoV — คูปอง (coupons) — ticket/voucher shape, reads as "coupon" at a glance
  { file: "rov-coupon-60.svg", accent: "#38bdf8", scale: 0.7, particleCount: 8, seed: 501, emblem: emblemTicket },
  { file: "rov-coupon-110.svg", accent: "#5cc9fa", scale: 0.85, particleCount: 12, seed: 502, emblem: emblemTicket },
  { file: "rov-coupon-185.svg", accent: "#80d5fb", scale: 0.95, particleCount: 18, seed: 503, emblem: emblemTicket },
  { file: "rov-coupon-370.svg", accent: "#a3e0fc", scale: 1.05, particleCount: 24, seed: 504, emblem: emblemTicket },
  { file: "rov-coupon-620.svg", accent: "#c7ecfd", scale: 1.15, particleCount: 28, seed: 505, emblem: emblemTicket },
  { file: "rov-coupon-1240.svg", accent: "#eaf8fe", scale: 1.3, particleCount: 34, seed: 506, emblem: emblemTicket },

  // Valorant — Valorant Points (coin/point token — blade stays on the
  // game-cover banner only, a pile of blades wouldn't read as "points")
  { file: "valorant-vp-475.svg", accent: "#fb7185", scale: 0.75, particleCount: 10, seed: 401, emblem: emblemCoin },
  { file: "valorant-vp-1000.svg", accent: "#fc8b9c", scale: 0.9, particleCount: 16, seed: 402, emblem: emblemCoin },
  { file: "valorant-vp-2050.svg", accent: "#fda5b3", scale: 1.0, particleCount: 22, seed: 403, emblem: emblemCoin },
  { file: "valorant-vp-3650.svg", accent: "#fdbfc9", scale: 1.15, particleCount: 28, seed: 404, emblem: emblemCoin },
  { file: "valorant-vp-5350.svg", accent: "#fed9e0", scale: 1.3, particleCount: 34, seed: 405, emblem: emblemCoin },
];

// The cheapest denomination gets a small handful of the unit emblem;
// the priciest gets a treasure chest overflowing with them — visually
// encodes "how much you get", matching how real top-up shops do it.
function renderProductCover({ accent, scale, particleCount, seed, emblem = emblemGem }) {
  const w = 800, h = 800;
  const cx = w / 2;
  const cy = h / 2 + 15;

  let contents;
  if (scale >= 1.2) {
    contents = `
      ${treasureChest(cx, cy + 55, 430, accent)}
      ${pile(cx, cy - 55, emblem, accent, 9, 165, 85, seed)}
    `;
  } else if (scale >= 1.05) {
    contents = pile(cx, cy, emblem, accent, 6, 135, 92, seed);
  } else if (scale >= 0.95) {
    contents = pile(cx, cy, emblem, accent, 4, 95, 98, seed);
  } else if (scale >= 0.8) {
    contents = pile(cx, cy, emblem, accent, 3, 65, 104, seed);
  } else {
    contents = pile(cx, cy, emblem, accent, 2, 38, 112, seed);
  }

  const inner = `
    ${grid(w, h, "grid")}
    ${glow(w / 2, h / 2, 360 * scale, accent, "glow1")}
    ${rays(w / 2, h / 2, 12, 320 * scale, accent, seed)}
    ${particles(w, h, accent, particleCount, seed)}
    ${contents}
    ${xAccent(w, h, accent)}
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="${BORDER}" stroke-width="2"/>
  `;
  return svgWrap(w, h, inner);
}

mkdirSync(path.join(ROOT, "public/games"), { recursive: true });
mkdirSync(path.join(ROOT, "public/products"), { recursive: true });

for (const game of GAMES) {
  const svg = renderGameCover(game);
  writeFileSync(path.join(ROOT, "public/games", game.file), svg, "utf8");
  console.log("wrote", game.file);
}

for (const product of PRODUCTS) {
  const svg = renderProductCover(product);
  writeFileSync(path.join(ROOT, "public/products", product.file), svg, "utf8");
  console.log("wrote", product.file);
}
