// Menu helpers for the Telegram bot: read the menu text the seller sends, compare it with the
// current menu, find flavours by name, and write menu.js. (Files starting with "_" in /api are
// not deployed as their own endpoints by Vercel.)
"use strict";

// colour for a flavour's tin, picked from its first emoji
var EMOJI_COLORS = {
  "🍒": "#c2183c", "🍓": "#e0314b", "🫐": "#3f51b5", "🍇": "#8e44ad", "🍏": "#6fb83a", "🍎": "#d63031",
  "🍋": "#e8c547", "🥭": "#ffa726", "🍍": "#f2a93b", "🍌": "#e8c547", "🥝": "#7cc242", "🍉": "#ff5d73",
  "🍑": "#ff9a76", "🍊": "#ff8c1a", "🥥": "#cfa77a", "🌿": "#2ec4b6", "🌱": "#3fbf7f", "🍃": "#2ec4b6",
  "❄️": "#7fd3ff", "❄": "#7fd3ff", "🧊": "#59606b", "🖤": "#5a2160", "🥤": "#b5651d", "🌴": "#2e9d63",
  "🌲": "#b0306b", "🔥": "#e8b923", "🍬": "#ff6fb5", "☕": "#7b4a2e", "🍫": "#6b3e26", "🌸": "#ff8fc7"
};
var SPARE_COLORS = ["#b06cff", "#ff6f61", "#3d7bff", "#26c6a6", "#ffb347", "#9b59b6", "#5b6cff", "#c2183c"];
var RIM_COLORS = ["#d9d9de", "#ff5fa2", "#8fd8ff", "#d8b45a", "#7cdc9b", "#b39cff", "#ff9f43", "#e5484d"];

var EMOJI_RUN = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator}|‍|️|[\u{1F3FB}-\u{1F3FF}])+)\s*/u;
var SOLD_MARK = /\s*(\(?\s*(wyprzedane|wyprzedany|wyprzedana|sold\s*out)\s*\)?|❌)\s*/gi;

function slugify(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function plain(s) {   // for matching: lower case, no accents, no emoji/punctuation
  return slugify(s).replace(/-/g, " ").trim();
}
function slugOf(p) { return slugify(p.line + "-" + p.name); }
function words(s) { return s.replace(/\s+/g, " ").trim().split(" ").map(function (w) { return w ? w[0].toUpperCase() + w.slice(1) : w; }).join(" "); }
function niceBrand(s) {   // "CUBA" → "Cuba", "K#RWA MAX" → "K#rwa Max", "PABLO Exclusive" → "Pablo Exclusive"
  return s.replace(/\s+/g, " ").trim().split(" ").map(function (w) {
    return /[A-ZĄĆĘŁŃÓŚŹŻ]{2,}/.test(w) && w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w;
  }).join(" ");
}
function hashColor(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return SPARE_COLORS[h % SPARE_COLORS.length]; }
function colorFor(emoji, name) {
  var chars = Array.from(emoji || "");
  for (var i = 0; i < chars.length; i++) if (EMOJI_COLORS[chars[i]]) return EMOJI_COLORS[chars[i]];
  return hashColor(name);
}

// "📍 CUBA — 66 mg/g" → { name: "CUBA", strength: "66 mg/g" }; null if the line isn't a brand header
function header(line) {
  var hasPin = line.indexOf("📍") >= 0;
  var clean = line.replace(/📍/g, "").trim();
  var m = clean.match(/^(.*?)[\s:—–-]*(\d+(?:[.,]\d+)?)\s*mg\s*(?:\/\s*g)?\s*$/i);
  if (m && m[1].trim()) return { name: m[1].replace(/[\s:—–-]+$/, "").trim(), strength: m[2].replace(",", ".") + " mg/g" };
  if (hasPin && clean) return { name: clean.replace(/[\s:—–-]+$/, ""), strength: "" };
  return null;
}

// Read the seller's menu text (the same format they post on Instagram).
// current = the menu now on the site, so existing lines/flavours keep their colours.
function parseMenu(text, current) {
  current = current || { lines: {}, products: [] };
  var raw = String(text || "").replace(/\r/g, "").split("\n");
  if (raw.length && /^\/\w+(@\w+)?/.test(raw[0].trim())) raw[0] = raw[0].trim().replace(/^\/\w+(@\w+)?\s*/, "");
  // join lines that were only wrapped: "50 mg/" + "g", or "K#RWA MAX" + "– 64 mg/g"
  var rows = [];
  raw.forEach(function (r) {
    var t = r.trim();
    if (!t) { rows.push(""); return; }
    var prev = rows.length ? rows[rows.length - 1] : "";
    if (prev && (/^\/?\s*g$/i.test(t) || /^[—–-]\s*\d+(?:[.,]\d+)?\s*mg/i.test(t))) rows[rows.length - 1] = prev + " " + t;
    else rows.push(t);
  });

  var lines = {}, products = [], warnings = [], cur = null, usedRims = [];
  var oldLineByName = {};
  Object.keys(current.lines || {}).forEach(function (k) { oldLineByName[plain(current.lines[k].name)] = k; });
  function oldProduct(lineKey, name) {
    var n = plain(name);
    return (current.products || []).filter(function (p) { return p.line === lineKey && plain(p.name) === n; })[0];
  }

  rows.forEach(function (row) {
    if (!row) return;
    var hd = header(row);
    if (hd) {
      var display = niceBrand(hd.name);
      var key = oldLineByName[plain(display)] || slugify(display);
      var old = (current.lines || {})[key];
      var rim = old && old.rim;
      if (!rim) rim = RIM_COLORS.filter(function (c) { return usedRims.indexOf(c) < 0; })[0] || hashColor(key);
      usedRims.push(rim);
      var short = old && old.short;
      if (!short) { short = display.toUpperCase(); if (short.length > 10) short = short.split(" ")[0]; }
      lines[key] = { name: old ? old.name : display, short: short, strength: hd.strength || (old && old.strength) || "", rim: rim };
      cur = key;
      return;
    }
    if (!cur) return;                                   // greetings before the first brand ("cześć, na stocku mamy…")
    var t = row.replace(/^[*•·\-–—]+\s*/, "");
    var soldOut = SOLD_MARK.test(t); SOLD_MARK.lastIndex = 0;
    t = t.replace(SOLD_MARK, " ").trim();
    var em = t.match(EMOJI_RUN), emoji = em ? em[1] : "";
    var name = words(t.slice(em ? em[0].length : 0).replace(/^[*•·\-–—\s]+/, ""));
    if (!name || !/[a-ząćęłńóśźż0-9]/i.test(name)) return;
    if (products.some(function (p) { return p.line === cur && plain(p.name) === plain(name); })) { warnings.push("Powtórzony smak: " + name); return; }
    var op = oldProduct(cur, name);
    var p = { line: cur, name: op ? op.name : name, emoji: emoji || (op && op.emoji) || "", color: (op && op.color) || colorFor(emoji, name) };
    if (op && op.image) p.image = op.image;
    if (soldOut) p.soldOut = true;
    products.push(p);
  });

  // drop brands with no flavours
  Object.keys(lines).forEach(function (k) { if (!products.some(function (p) { return p.line === k; })) { warnings.push("Marka bez smaków pominięta: " + lines[k].name); delete lines[k]; } });
  return { menu: { lines: lines, products: products }, warnings: warnings };
}

// what changed between two menus, for the preview message
function diff(oldM, newM) {
  var key = function (p) { return slugOf(p); };
  var oldKeys = (oldM.products || []).map(key), newKeys = (newM.products || []).map(key);
  var oldBy = {};
  (oldM.products || []).forEach(function (p) { oldBy[key(p)] = p; });
  return {
    added: newM.products.filter(function (p) { return oldKeys.indexOf(key(p)) < 0; }),
    removed: (oldM.products || []).filter(function (p) { return newKeys.indexOf(key(p)) < 0; }),
    restocked: newM.products.filter(function (p) { var o = oldBy[key(p)]; return o && o.soldOut && !p.soldOut; }),
    soldOut: newM.products.filter(function (p) { var o = oldBy[key(p)]; return p.soldOut && !(o && o.soldOut); })
  };
}

function formatMenu(m) {
  var out = [];
  Object.keys(m.lines).forEach(function (k) {
    var l = m.lines[k], items = m.products.filter(function (p) { return p.line === k; });
    out.push("📍 " + l.name + (l.strength ? " — " + l.strength : "") + " (" + items.length + ")");
    items.forEach(function (p) { out.push("   " + (p.emoji ? p.emoji + " " : "") + p.name + (p.soldOut ? "  ❌ wyprzedane" : "")); });
    out.push("");
  });
  return out.join("\n").trim();
}

// find flavours by a few words ("cherry", "cuba cherry", "grape ice")
function find(m, query, filter) {
  var q = plain(query).split(" ").filter(Boolean);
  return m.products.filter(function (p) {
    if (filter && !filter(p)) return false;
    var hay = " " + plain((m.lines[p.line] || {}).name + " " + p.name) + " ";
    return q.every(function (w) { return hay.indexOf(" " + w) >= 0; });
  });
}

function title(m, p) { var l = m.lines[p.line] || {}; return (l.name ? l.name + " – " : "") + p.name; }

function toFile(m) {
  return "// Snus Shop 24 menu. Edited by hand or by the Telegram bot (/menu, /wyprzedane, /dostepne, /cofnij).\n" +
    "// Keep everything after window.MENU = valid JSON (double quotes, no comments, no trailing commas).\n" +
    "window.MENU = " + JSON.stringify(m, null, 2) + ";\n";
}
function fromFile(text) {
  var a = text.indexOf("{", text.indexOf("window.MENU")), b = text.lastIndexOf("}");
  return JSON.parse(text.slice(a, b + 1));
}

module.exports = { parseMenu: parseMenu, diff: diff, formatMenu: formatMenu, find: find, title: title, slugOf: slugOf, toFile: toFile, fromFile: fromFile };
