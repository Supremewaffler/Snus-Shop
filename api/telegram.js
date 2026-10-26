// Snus Shop 24 Telegram bot: lets the seller update the website menu from Telegram.
//
// Telegram sends every message to https://www.snusshop.pl/api/telegram. The bot changes menu.js
// in the GitHub repository; Vercel then redeploys the site (about 30 s).
//
// Vercel environment variables (Settings → Environment Variables), never put them in the code:
//   TELEGRAM_BOT_TOKEN  token from @BotFather
//   GITHUB_TOKEN        fine-grained GitHub token, this repository only, "Contents: Read and write"
//   ALLOWED_USERS       Telegram user IDs allowed to change the menu, comma separated (send /id to the bot)
//   GITHUB_REPO         optional, default "supremewaffler/Snus-Shop"
//
// One-time setup after deploying: open https://www.snusshop.pl/api/telegram?setup in a browser.
"use strict";
var crypto = require("crypto");
var M = require("./_menu.js");

var TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
var GH_TOKEN = process.env.GITHUB_TOKEN || "";
var REPO = process.env.GITHUB_REPO || "supremewaffler/Snus-Shop";
var ALLOWED = (process.env.ALLOWED_USERS || "").split(/[,\s]+/).filter(Boolean);
var FILE = "menu.js";
// webhook secret derived from the bot token, so there is one less setting to manage
var SECRET = TOKEN ? crypto.createHash("sha256").update("snus-webhook:" + TOKEN).digest("hex").slice(0, 48) : "";

var HELP = [
  "🛵 Snus Shop 24 — menu na stronie",
  "",
  "/menu + Twoje menu w kolejnych liniach — podmienia całe menu (najpierw pokażę podgląd do zatwierdzenia)",
  "   📍 CUBA — 66 mg/g",
  "   🍒 Cherry",
  "   🍇 Grape",
  "   📍 KILLA — 12 mg/g",
  "   🍇 Grape Ice",
  "   (dopisz „wyprzedane” albo ❌ przy smaku, którego chwilowo brak)",
  "/wyprzedane cherry — oznacz smak jako wyprzedany",
  "/dostepne cherry — smak znów dostępny",
  "/pokaz — aktualne menu na stronie",
  "/cofnij — przywróć poprzednie menu",
  "/id — Twój numer ID w Telegramie",
  "",
  "Zmiany pojawiają się na snusshop.pl/menu po ok. 30 sekundach."
].join("\n");

// ---------- Telegram ----------
function tg(method, payload) {
  return fetch("https://api.telegram.org/bot" + TOKEN + "/" + method, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }).then(function (r) { return r.json(); });
}
function reply(msg, text, markup) {
  var p = { chat_id: msg.chat.id, text: text, reply_to_message_id: msg.message_id, allow_sending_without_reply: true, disable_web_page_preview: true };
  if (markup) p.reply_markup = { inline_keyboard: markup };
  return tg("sendMessage", p);
}
function edit(msg, text) { return tg("editMessageText", { chat_id: msg.chat.id, message_id: msg.message_id, text: text, disable_web_page_preview: true }); }
function who(u) { return u ? (u.username ? "@" + u.username : [u.first_name, u.last_name].filter(Boolean).join(" ")) : "?"; }

// ---------- GitHub (menu.js) ----------
function gh(path, opts) {
  opts = opts || {};
  return fetch("https://api.github.com/repos/" + REPO + path, {
    method: opts.method || "GET",
    headers: { "Authorization": "Bearer " + GH_TOKEN, "Accept": "application/vnd.github+json", "User-Agent": "snus-shop-bot", "X-GitHub-Api-Version": "2022-11-28" },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  }).then(function (r) {
    return r.json().then(function (j) { if (!r.ok) throw new Error("GitHub " + r.status + ": " + (j.message || "")); return j; });
  });
}
function readMenu(ref) {
  return gh("/contents/" + FILE + (ref ? "?ref=" + ref : "")).then(function (j) {
    return { menu: M.fromFile(Buffer.from(j.content, "base64").toString("utf8")), sha: j.sha };
  });
}
function writeMenu(menu, sha, message) {
  return gh("/contents/" + FILE, { method: "PUT", body: { message: message, content: Buffer.from(M.toFile(menu), "utf8").toString("base64"), sha: sha } });
}

// ---------- commands ----------
function previewText(cur, parsed) {
  var d = M.diff(cur, parsed.menu), out = ["📋 Podgląd nowego menu — sprawdź i zatwierdź:", "", M.formatMenu(parsed.menu), ""];
  var list = function (arr, m) { return arr.map(function (p) { return M.title(m, p); }).join(", "); };
  if (d.added.length) out.push("➕ Nowe: " + list(d.added, parsed.menu));
  if (d.removed.length) out.push("➖ Znikną: " + list(d.removed, cur));
  if (d.restocked.length) out.push("✅ Znów dostępne: " + list(d.restocked, parsed.menu));
  if (d.soldOut.length) out.push("❌ Wyprzedane: " + list(d.soldOut, parsed.menu));
  if (!d.added.length && !d.removed.length && !d.restocked.length && !d.soldOut.length) out.push("Bez zmian w smakach.");
  parsed.warnings.forEach(function (w) { out.push("⚠️ " + w); });
  return out.join("\n");
}

function menuCommand(msg, text) {
  var body = text.replace(/^\/\w+(@\w+)?/, "").trim();
  if (!body) return showMenu(msg);
  return readMenu().then(function (cur) {
    var parsed = M.parseMenu(text, cur.menu);
    if (!parsed.menu.products.length) {
      return reply(msg, "Nie rozpoznałem menu 🤔 Każda marka w osobnej linii z mocą, np. „📍 CUBA — 66 mg/g”, a pod nią smaki — jeden w linii.\n\n" + HELP);
    }
    // the preview replies to the seller's message, so "Publish" can read the menu from it again (no storage needed)
    return reply(msg, previewText(cur.menu, parsed), [[{ text: "✅ Opublikuj", callback_data: "pub" }, { text: "❌ Anuluj", callback_data: "x" }]]);
  });
}

function showMenu(msg) {
  return readMenu().then(function (cur) {
    return reply(msg, "Aktualne menu na stronie:\n\n" + M.formatMenu(cur.menu) + "\n\nsnusshop.pl/menu");
  });
}

function stockCommand(msg, text, soldOut) {
  var q = text.replace(/^\/\w+(@\w+)?/, "").trim();
  return readMenu().then(function (cur) {
    var m = cur.menu;
    var candidates = function (p) { return soldOut ? !p.soldOut : !!p.soldOut; };
    var hits = q ? M.find(m, q, candidates) : m.products.filter(candidates);
    var verb = soldOut ? "wyprzedane" : "dostępne";
    if (!hits.length) {
      var other = q ? M.find(m, q) : [];
      if (other.length) return reply(msg, M.title(m, other[0]) + " jest już " + (soldOut ? "wyprzedane" : "dostępne") + ".");
      return reply(msg, q ? "Nie znalazłem smaku „" + q + "”. Sprawdź nazwę w /pokaz." : (soldOut ? "Wszystkie smaki są już wyprzedane." : "Nie ma wyprzedanych smaków."));
    }
    if (hits.length === 1 && q) return setStock(msg, m, cur.sha, hits[0], soldOut, msg.from, false);
    var buttons = hits.slice(0, 24).map(function (p) { return [{ text: M.title(m, p), callback_data: (soldOut ? "so:" : "av:") + M.slugOf(p).slice(0, 60) }]; });
    return reply(msg, "Który smak oznaczyć jako " + verb + "?", buttons);
  });
}

function setStock(msg, m, sha, p, soldOut, user, editInstead) {
  if (soldOut) p.soldOut = true; else delete p.soldOut;
  var label = M.title(m, p);
  return writeMenu(m, sha, "Telegram: " + label + (soldOut ? " sold out" : " back in stock") + " (" + who(user) + ")").then(function () {
    var text = (soldOut ? "❌ " + label + ": wyprzedane." : "✅ " + label + ": znów dostępne.") + "\nStrona zaktualizuje się za ok. 30 s.";
    return editInstead ? edit(msg, text) : reply(msg, text);
  });
}

function undo(msg) {
  return gh("/commits?path=" + FILE + "&per_page=2").then(function (commits) {
    if (commits.length < 2) return reply(msg, "Nie ma poprzedniej wersji menu do przywrócenia.");
    return Promise.all([readMenu(), readMenu(commits[1].sha)]).then(function (r) {
      return writeMenu(r[1].menu, r[0].sha, "Telegram: undo last menu change (" + who(msg.from) + ")").then(function () {
        return reply(msg, "↩️ Przywróciłem poprzednie menu:\n\n" + M.formatMenu(r[1].menu) + "\n\nStrona zaktualizuje się za ok. 30 s.");
      });
    });
  });
}

// ---------- updates ----------
function allowed(user) { return user && ALLOWED.indexOf(String(user.id)) >= 0; }

var me = null;   // this bot's @username, to ignore commands meant for other bots in the group
function myName() { if (!me) me = tg("getMe", {}).then(function (r) { return ((r.result && r.result.username) || "").toLowerCase(); }); return me; }

function onMessage(msg) {
  var text = (msg.text || "").trim();
  if (text[0] !== "/") return null;                    // only commands
  var at = (text.split(/\s/)[0].split("@")[1] || "").toLowerCase();
  if (at) return myName().then(function (name) { return at === name ? handleCommand(msg, text) : null; });
  return handleCommand(msg, text);
}
function handleCommand(msg, text) {
  var cmd = text.split(/[\s@]/)[0].toLowerCase();
  if (cmd === "/id") return reply(msg, "Twój ID w Telegramie: " + msg.from.id + (allowed(msg.from) ? " ✅ (masz dostęp)" : "\nDodaj go w Vercel do ALLOWED_USERS, żeby móc zmieniać menu."));
  if (cmd === "/start" || cmd === "/pomoc" || cmd === "/help") return reply(msg, HELP);
  if (!ALLOWED.length) return reply(msg, "Bot nie ma jeszcze ustawionych osób z dostępem (ALLOWED_USERS w Vercel). Wyślij /id, żeby poznać swój numer.");
  if (!allowed(msg.from)) return reply(msg, "Nie masz dostępu do zmiany menu.");
  if (cmd === "/menu") return menuCommand(msg, text);
  if (cmd === "/pokaz" || cmd === "/pokaż") return showMenu(msg);
  if (cmd === "/wyprzedane" || cmd === "/wyprzedany") return stockCommand(msg, text, true);
  if (cmd === "/dostepne" || cmd === "/dostępne" || cmd === "/dostepny") return stockCommand(msg, text, false);
  if (cmd === "/cofnij") return undo(msg);
  return null;                                         // someone else's command in the group
}

function onCallback(cq) {
  var msg = cq.message, data = cq.data || "";
  if (!allowed(cq.from)) return tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Nie masz dostępu do zmiany menu.", show_alert: true });
  var done = tg("answerCallbackQuery", { callback_query_id: cq.id });
  if (data === "x") return done.then(function () { return edit(msg, "Anulowano — menu bez zmian."); });
  if (data === "pub") {
    var orig = msg.reply_to_message;
    if (!orig || !orig.text) return done.then(function () { return edit(msg, "Nie widzę już wiadomości z menu — wyślij /menu jeszcze raz."); });
    return done.then(readMenu).then(function (cur) {
      var parsed = M.parseMenu(orig.text, cur.menu);
      if (!parsed.menu.products.length) return edit(msg, "Nie rozpoznałem menu — wyślij /menu jeszcze raz.");
      return writeMenu(parsed.menu, cur.sha, "Telegram: new menu (" + who(cq.from) + ")").then(function () {
        return edit(msg, "✅ Opublikowane przez " + who(cq.from) + " — " + parsed.menu.products.length + " smaków.\nStrona zaktualizuje się za ok. 30 s: snusshop.pl/menu");
      });
    });
  }
  var m = data.match(/^(so|av):(.+)$/);
  if (m) {
    return done.then(readMenu).then(function (cur) {
      var p = cur.menu.products.filter(function (x) { return M.slugOf(x).slice(0, 60) === m[2]; })[0];
      if (!p) return edit(msg, "Tego smaku nie ma już w menu.");
      return setStock(msg, cur.menu, cur.sha, p, m[1] === "so", cq.from, true);
    });
  }
  return done;
}

function setup(req) {
  var url = "https://" + (req.headers["x-forwarded-host"] || req.headers.host) + "/api/telegram";
  return Promise.all([
    tg("setWebhook", { url: url, secret_token: SECRET, allowed_updates: ["message", "callback_query"], drop_pending_updates: true }),
    tg("setMyCommands", { commands: [
      { command: "menu", description: "Nowe menu (wklej je pod komendą)" },
      { command: "wyprzedane", description: "Oznacz smak jako wyprzedany" },
      { command: "dostepne", description: "Smak znów dostępny" },
      { command: "pokaz", description: "Aktualne menu na stronie" },
      { command: "cofnij", description: "Przywróć poprzednie menu" },
      { command: "id", description: "Twój numer ID" },
      { command: "pomoc", description: "Jak używać bota" }
    ] })
  ]).then(function (r) { return { webhook: url, telegram: r[0], commands: r[1].ok, allowedUsers: ALLOWED.length, github: !!GH_TOKEN }; });
}

module.exports = async function (req, res) {
  if (!TOKEN) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN is not set in Vercel" });
  if (req.method === "GET") {
    if (req.query && "setup" in req.query) {
      try { return res.status(200).json(await setup(req)); } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
    }
    return res.status(200).send("Snus Shop 24 bot is running.");
  }
  if (req.headers["x-telegram-bot-api-secret-token"] !== SECRET) return res.status(401).send("unauthorized");
  var update = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  try {
    if (update.message) await onMessage(update.message);
    else if (update.callback_query) await onCallback(update.callback_query);
  } catch (e) {
    console.error(e);
    var target = update.message || (update.callback_query && update.callback_query.message);
    if (target) { try { await reply(target, "⚠️ Coś poszło nie tak: " + String(e.message || e).slice(0, 300) + "\nMenu nie zostało zmienione."); } catch (e2) {} }
  }
  return res.status(200).send("ok");   // always 200 so Telegram doesn't resend the same message
};
