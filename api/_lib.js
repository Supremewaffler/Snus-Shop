// Shared helpers for the Telegram bot (telegram.js) and website orders (order.js):
// Telegram, GitHub (menu.js + the private stock file) and settings.
// (Files starting with "_" in /api are not deployed as their own endpoints by Vercel.)
"use strict";
var crypto = require("crypto");
var M = require("./_menu.js");

var TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
var GH_TOKEN = process.env.GITHUB_TOKEN || "";
var REPO = process.env.GITHUB_REPO || "supremewaffler/Snus-Shop";
var ALLOWED = (process.env.ALLOWED_USERS || "").split(/[,\s]+/).filter(Boolean);
// optional: a group chat that also gets website orders (the allowed users always get them privately)
var ORDER_CHAT = (process.env.ORDER_CHAT_ID || "").trim();
var MENU_FILE = "menu.js";
// Stock levels are private: the repository is public, so they are stored encrypted with a key
// made from the bot token. Only the bot can read them; they never reach the website.
var STOCK_FILE = "data/stock.enc";

function derive(label) { return crypto.createHash("sha256").update(label + ":" + TOKEN).digest(); }
var SECRET = TOKEN ? derive("snus-webhook").toString("hex").slice(0, 48) : "";

// ---------- Telegram ----------
function tg(method, payload) {
  return fetch("https://api.telegram.org/bot" + TOKEN + "/" + method, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }).then(function (r) { return r.json(); });
}
function who(u) { return u ? (u.username ? "@" + u.username : [u.first_name, u.last_name].filter(Boolean).join(" ")) : "?"; }
function allowed(user) { return !!user && ALLOWED.indexOf(String(user.id)) >= 0; }
// everyone who should hear about website orders: each allowed user privately, plus the optional group
function orderChats() { var c = ALLOWED.slice(); if (ORDER_CHAT && c.indexOf(ORDER_CHAT) < 0) c.push(ORDER_CHAT); return c; }

// ---------- GitHub ----------
function gh(path, opts) {
  opts = opts || {};
  return fetch("https://api.github.com/repos/" + REPO + path, {
    method: opts.method || "GET",
    headers: { "Authorization": "Bearer " + GH_TOKEN, "Accept": "application/vnd.github+json", "User-Agent": "snus-shop-bot", "X-GitHub-Api-Version": "2022-11-28" },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  }).then(function (r) {
    return r.json().then(function (j) { if (!r.ok) { var e = new Error("GitHub " + r.status + ": " + (j.message || "")); e.status = r.status; throw e; } return j; });
  });
}
function readFile(path, ref) {
  return gh("/contents/" + path + (ref ? "?ref=" + ref : "")).then(function (j) {
    return { text: Buffer.from(j.content, "base64").toString("utf8"), sha: j.sha };
  });
}
function writeFile(path, text, sha, message) {
  var body = { message: message, content: Buffer.from(text, "utf8").toString("base64") };
  if (sha) body.sha = sha;
  return gh("/contents/" + path, { method: "PUT", body: body });
}

function readMenu(ref) {
  return readFile(MENU_FILE, ref).then(function (f) { return { menu: M.fromFile(f.text), sha: f.sha }; });
}
function writeMenu(menu, sha, message) { return writeFile(MENU_FILE, M.toFile(menu), sha, message); }

// ---------- private stock file ----------
// { stock: { "<line>-<flavour>": count }, done: [order ids already confirmed or rejected] }
function encrypt(obj) {
  var iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", derive("snus-stock"), iv);
  var data = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return "snus-stock-v1\n" + Buffer.concat([iv, c.getAuthTag(), data]).toString("base64") + "\n";
}
function decrypt(text) {
  var raw = Buffer.from(String(text).split("\n")[1] || "", "base64");
  var d = crypto.createDecipheriv("aes-256-gcm", derive("snus-stock"), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8"));
}
function readStock() {
  return readFile(STOCK_FILE).then(function (f) {
    var s;
    try { s = decrypt(f.text); } catch (e) { s = {}; }   // e.g. the bot token was changed: start again
    return { state: { stock: s.stock || {}, done: s.done || [] }, sha: f.sha };
  }, function (e) {
    if (e.status === 404) return { state: { stock: {}, done: [] }, sha: null };   // no stock saved yet
    throw e;
  });
}
function writeStock(state, sha, message) {
  state.done = (state.done || []).slice(-200);
  return writeFile(STOCK_FILE, encrypt(state), sha, message);
}

module.exports = {
  M: M, TOKEN: TOKEN, GH_TOKEN: GH_TOKEN, ALLOWED: ALLOWED, SECRET: SECRET,
  tg: tg, who: who, allowed: allowed, orderChats: orderChats, gh: gh,
  MENU_FILE: MENU_FILE, readMenu: readMenu, writeMenu: writeMenu, readStock: readStock, writeStock: writeStock
};
