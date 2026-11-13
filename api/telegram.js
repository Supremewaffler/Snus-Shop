// Snus Shop 24 Telegram bot: lets the seller update the website menu and private stock from Telegram.
//
// Telegram sends every message to https://www.snusshop.pl/api/telegram. The bot changes menu.js
// in the GitHub repository; Vercel then redeploys the site (about 30 s). Stock levels are kept in
// data/stock.enc, encrypted, so they never appear on the website or in the public repository.
//
// Vercel environment variables (Settings → Environment Variables), never put them in the code:
//   TELEGRAM_BOT_TOKEN  token from @BotFather
//   GITHUB_TOKEN        fine-grained GitHub token, this repository only, "Contents: Read and write"
//   ALLOWED_USERS       Telegram user IDs allowed to change the menu, comma separated (send /id to the bot)
//   ORDER_CHAT_ID       optional, a group chat that also gets website orders
//   GITHUB_REPO         optional, default "supremewaffler/Snus-Shop"
//
// One-time setup after deploying: open https://www.snusshop.pl/api/telegram?setup in a browser.
"use strict";
var L = require("./_lib.js");
var M = L.M, tg = L.tg, who = L.who, allowed = L.allowed;

var HELP = [
  "🛵 Snus Shop 24 — menu na stronie",
  "",
  "/nowemenu — wklej nowe menu (tak jak na Instagramie), pokażę podgląd do zatwierdzenia",
  "   albo od razu: /menu + menu w kolejnych liniach",
  "   📍 CUBA — 66 mg/g",
  "   🍒 Cherry 20",
  "   🍇 Grape 15",
  "   (liczba na końcu = ile sztuk na stanie; NIE pojawia się na stronie)",
  "   (dopisz „wyprzedane” albo ❌ przy smaku, którego chwilowo brak)",
  "/stan — ile sztuk zostało (widzisz tylko Ty, nie klienci)",
  "/stan cherry 20 — ustaw stan smaku",
  "/odejmij cherry 2 — sprzedane poza stroną (np. w DM)",
  "/wyprzedane cherry — oznacz smak jako wyprzedany",
  "/dostepne cherry — smak znów dostępny",
  "/pokaz — aktualne menu na stronie",
  "/cofnij — przywróć poprzednie menu",
  "/id — Twój numer ID w Telegramie",
  "",
  "🧺 Zamówienia ze strony przychodzą tutaj z przyciskiem ✅ Sprzedane — po potwierdzeniu odejmę je ze stanu.",
  "Gdy smak dojdzie do 0, zapytam, czy oznaczyć go jako wyprzedany.",
  "",
  "Zmiany pojawiają się na snusshop.pl/menu po ok. 30 sekundach."
].join("\n");

function reply(msg, text, markup) {
  var p = { chat_id: msg.chat.id, text: text, reply_to_message_id: msg.message_id, allow_sending_without_reply: true, disable_web_page_preview: true };
  if (markup) p.reply_markup = { inline_keyboard: markup };
  return tg("sendMessage", p);
}
function send(chatId, text, markup) {
  var p = { chat_id: chatId, text: text, disable_web_page_preview: true };
  if (markup) p.reply_markup = { inline_keyboard: markup };
  return tg("sendMessage", p);
}
function edit(msg, text) { return tg("editMessageText", { chat_id: msg.chat.id, message_id: msg.message_id, text: text, disable_web_page_preview: true }); }

// ---------- stock helpers ----------
function key60(p) { return M.slugOf(p).slice(0, 60); }
function stockList(menu, stock, onlyTracked) {
  return menu.products.filter(function (p) { return !onlyTracked || stock[M.slugOf(p)] != null; })
    .map(function (p) { var n = stock[M.slugOf(p)]; return M.title(menu, p) + ": " + (n == null ? "—" : n + " szt.") + (p.soldOut ? " ❌" : ""); }).join("\n");
}
// after a sale: ask about every flavour that reached 0 but is still for sale on the site
function askSoldOut(chatId, menu, stock, items) {
  var empty = items.filter(function (p) { return !p.soldOut && stock[M.slugOf(p)] != null && stock[M.slugOf(p)] <= 0; });
  return empty.reduce(function (chain, p) {
    return chain.then(function () {
      return send(chatId, "📉 " + M.title(menu, p) + ": 0 szt. na stanie.\nOznaczyć jako wyprzedane na stronie?",
        [[{ text: "✅ Tak, wyprzedane", callback_data: "sx:" + key60(p) }, { text: "Jeszcze nie", callback_data: "sk" }]]);
    });
  }, Promise.resolve());
}

// ---------- commands ----------
function previewText(cur, parsed, stock) {
  var d = M.diff(cur, parsed.menu), out = ["📋 Podgląd nowego menu — sprawdź i zatwierdź:", "", M.formatMenu(parsed.menu, stock), ""];
  var list = function (arr, m) { return arr.map(function (p) { return M.title(m, p); }).join(", "); };
  if (d.added.length) out.push("➕ Nowe: " + list(d.added, parsed.menu));
  if (d.removed.length) out.push("➖ Znikną: " + list(d.removed, cur));
  if (d.restocked.length) out.push("✅ Znów dostępne: " + list(d.restocked, parsed.menu));
  if (d.soldOut.length) out.push("❌ Wyprzedane: " + list(d.soldOut, parsed.menu));
  if (!d.added.length && !d.removed.length && !d.restocked.length && !d.soldOut.length) out.push("Bez zmian w smakach.");
  if (Object.keys(parsed.stock).length) out.push("🔒 Stany magazynowe zapiszę tylko w bocie — klienci ich nie zobaczą.");
  parsed.warnings.forEach(function (w) { out.push("⚠️ " + w); });
  return out.join("\n");
}
// stock after publishing a pasted menu: numbers from the paste win; flavours pasted without a number
// keep their old count; flavours no longer on the menu are forgotten
function mergeStock(old, menu, pasted) {
  var out = {};
  menu.products.forEach(function (p) {
    var k = M.slugOf(p);
    if (pasted[k] != null) out[k] = pasted[k];
    else if (old[k] != null) out[k] = old[k];
  });
  return out;
}

// "New menu": ask for the menu as a reply, so it can be pasted in a separate message
var PROMPT = "📝 Wklej nowe menu";
function askForMenu(msg) {
  return L.readMenu().then(function (cur) {
    return tg("sendMessage", {
      chat_id: msg.chat.id, reply_to_message_id: msg.message_id, allow_sending_without_reply: true,
      text: PROMPT + " w odpowiedzi na tę wiadomość — tak jak je wrzucasz na Instagram.\n" +
        "Możesz dopisać liczbę sztuk na końcu linii (np. „🍒 Cherry 20”) — zapiszę ją tylko w bocie, nie na stronie.\n" +
        "Pokażę, co się zmieni (nowe, usunięte, wyprzedane smaki), zanim cokolwiek trafi na stronę.\n\n" +
        "Teraz na stronie: " + cur.menu.products.length + " smaków (/pokaz).",
      reply_markup: { force_reply: true, selective: true, input_field_placeholder: "Wklej tutaj menu…" }
    });
  });
}
function isMenuPrompt(m) { return !!(m && m.from && m.from.is_bot && (m.text || "").indexOf(PROMPT) === 0); }

function menuCommand(msg, text, pasted) {
  var body = text.replace(/^\/\w+(@\w+)?/, "").trim();
  if (!body) return askForMenu(msg);
  return L.readMenu().then(function (cur) {
    var parsed = M.parseMenu(text, cur.menu);
    if (!parsed.menu.products.length) {
      if (pasted === "quiet") return null;            // ordinary chat in private, not a menu
      return reply(msg, "Nie rozpoznałem menu 🤔 Każda marka w osobnej linii z mocą, np. „📍 CUBA — 66 mg/g”, a pod nią smaki — jeden w linii.\n\n" + HELP);
    }
    // the preview replies to the seller's message, so "Publish" can read the menu from it again (no storage needed)
    return L.readStock().then(function (st) {
      var shown = mergeStock(st.state.stock, parsed.menu, parsed.stock);
      return reply(msg, previewText(cur.menu, parsed, shown), [[{ text: "✅ Opublikuj", callback_data: "pub" }, { text: "❌ Anuluj", callback_data: "x" }]]);
    });
  });
}

function showMenu(msg) {
  return L.readMenu().then(function (cur) {
    return reply(msg, "Aktualne menu na stronie:\n\n" + M.formatMenu(cur.menu) + "\n\nsnusshop.pl/menu\n(stany magazynowe: /stan)");
  });
}

// /stan                → list stock
// /stan cherry 20      → set a flavour's stock
function stockCommand(msg, text) {
  var q = text.replace(/^\/\w+(@\w+)?/, "").trim();
  return Promise.all([L.readMenu(), L.readStock()]).then(function (r) {
    var m = r[0].menu, st = r[1];
    if (!q) {
      return reply(msg, "🔒 Stan magazynowy (tylko dla Ciebie, nie na stronie):\n\n" + stockList(m, st.state.stock) +
        "\n\nUstaw: /stan cherry 20 · Sprzedane poza stroną: /odejmij cherry 2");
    }
    var nm = q.match(/^(.*?)\s+(\d{1,4})$/);
    if (!nm) return reply(msg, "Napisz smak i liczbę, np. /stan cherry 20");
    var hits = M.find(m, nm[1]);
    if (hits.length !== 1) return reply(msg, hits.length ? "Pasuje kilka smaków: " + hits.map(function (p) { return M.title(m, p); }).join(", ") + ". Napisz dokładniej, np. /stan cuba grape 15" : "Nie znalazłem smaku „" + nm[1] + "”. Sprawdź nazwę w /stan.");
    var p = hits[0], n = +nm[2];
    st.state.stock[M.slugOf(p)] = n;
    return L.writeStock(st.state, st.sha, "Telegram: stock update (" + who(msg.from) + ")").then(function () {
      var tip = p.soldOut && n > 0 ? "\nNa stronie nadal jest wyprzedane — wyślij /dostepne " + p.name.toLowerCase() + ", żeby znów było w sprzedaży." : "";
      return reply(msg, "🔒 " + M.title(m, p) + ": " + n + " szt." + tip).then(function () { return askSoldOut(msg.chat.id, m, st.state.stock, [p]); });
    });
  });
}

// /odejmij cherry 2 → a sale made outside the website
function subtractCommand(msg, text) {
  var q = text.replace(/^\/\w+(@\w+)?/, "").trim(), nm = q.match(/^(.*?)(?:\s+(\d{1,4}))?$/);
  if (!q || !nm[1]) return reply(msg, "Napisz smak i ile sztuk sprzedano, np. /odejmij cherry 2");
  return Promise.all([L.readMenu(), L.readStock()]).then(function (r) {
    var m = r[0].menu, st = r[1], hits = M.find(m, nm[1]);
    if (hits.length !== 1) return reply(msg, hits.length ? "Pasuje kilka smaków: " + hits.map(function (p) { return M.title(m, p); }).join(", ") + ". Napisz dokładniej." : "Nie znalazłem smaku „" + nm[1] + "”.");
    var p = hits[0], k = M.slugOf(p), n = +(nm[2] || 1);
    if (st.state.stock[k] == null) return reply(msg, "Nie znam stanu dla " + M.title(m, p) + ". Ustaw go najpierw: /stan " + p.name.toLowerCase() + " 20");
    st.state.stock[k] = Math.max(0, st.state.stock[k] - n);
    return L.writeStock(st.state, st.sha, "Telegram: stock update (" + who(msg.from) + ")").then(function () {
      return reply(msg, "➖ " + M.title(m, p) + ": −" + n + " → zostało " + st.state.stock[k] + " szt.").then(function () { return askSoldOut(msg.chat.id, m, st.state.stock, [p]); });
    });
  });
}

function availabilityCommand(msg, text, soldOut) {
  var q = text.replace(/^\/\w+(@\w+)?/, "").trim();
  return L.readMenu().then(function (cur) {
    var m = cur.menu;
    var candidates = function (p) { return soldOut ? !p.soldOut : !!p.soldOut; };
    var hits = q ? M.find(m, q, candidates) : m.products.filter(candidates);
    var verb = soldOut ? "wyprzedane" : "dostępne";
    if (!hits.length) {
      var other = q ? M.find(m, q) : [];
      if (other.length) return reply(msg, M.title(m, other[0]) + " jest już " + verb + ".");
      return reply(msg, q ? "Nie znalazłem smaku „" + q + "”. Sprawdź nazwę w /pokaz." : (soldOut ? "Wszystkie smaki są już wyprzedane." : "Nie ma wyprzedanych smaków."));
    }
    if (hits.length === 1 && q) return setAvailability(msg, m, cur.sha, hits[0], soldOut, msg.from, false);
    var buttons = hits.slice(0, 24).map(function (p) { return [{ text: M.title(m, p), callback_data: (soldOut ? "so:" : "av:") + key60(p) }]; });
    return reply(msg, "Który smak oznaczyć jako " + verb + "?", buttons);
  });
}

function setAvailability(msg, m, sha, p, soldOut, user, editInstead) {
  if (soldOut) p.soldOut = true; else delete p.soldOut;
  var label = M.title(m, p);
  return L.writeMenu(m, sha, "Telegram: " + label + (soldOut ? " sold out" : " back in stock") + " (" + who(user) + ")").then(function () {
    var text = (soldOut ? "❌ " + label + ": wyprzedane." : "✅ " + label + ": znów dostępne.") + "\nStrona zaktualizuje się za ok. 30 s.";
    return editInstead ? edit(msg, text) : reply(msg, text);
  });
}

function undo(msg) {
  return L.gh("/commits?path=" + L.MENU_FILE + "&per_page=2").then(function (commits) {
    if (commits.length < 2) return reply(msg, "Nie ma poprzedniej wersji menu do przywrócenia.");
    return Promise.all([L.readMenu(), L.readMenu(commits[1].sha)]).then(function (r) {
      return L.writeMenu(r[1].menu, r[0].sha, "Telegram: undo last menu change (" + who(msg.from) + ")").then(function () {
        return reply(msg, "↩️ Przywróciłem poprzednie menu:\n\n" + M.formatMenu(r[1].menu) + "\n\nStrona zaktualizuje się za ok. 30 s.");
      });
    });
  });
}

// ---------- website orders (sent by /api/order) ----------
// The order message lists "• 2× Cuba – Cherry" lines; the buttons carry the order id.
function orderItems(text, menu) {
  var items = [];
  String(text || "").split("\n").forEach(function (line) {
    var mm = line.match(/^• (\d+)× (.+)$/);
    if (!mm) return;
    var p = menu.products.filter(function (x) { return M.title(menu, x) === mm[2].trim(); })[0];
    items.push({ qty: +mm[1], title: mm[2].trim(), p: p });
  });
  return items;
}
function confirmOrder(cq, id, accept) {
  var msg = cq.message, base = (msg.text || "").split("\n\n👉")[0];
  return Promise.all([L.readMenu(), L.readStock()]).then(function (r) {
    var m = r[0].menu, st = r[1];
    if (st.state.done.indexOf(id) >= 0) return edit(msg, base + "\n\nℹ️ To zamówienie zostało już potwierdzone albo odrzucone.");
    st.state.done.push(id);
    if (!accept) {
      return L.writeStock(st.state, st.sha, "Telegram: order rejected (" + who(cq.from) + ")").then(function () {
        return edit(msg, base + "\n\n❌ Odrzucone przez " + who(cq.from) + " — stan bez zmian.");
      });
    }
    var items = orderItems(msg.text, m), lines = [], touched = [];
    items.forEach(function (it) {
      if (!it.p) { lines.push(it.title + ": nie ma już w menu"); return; }
      var k = M.slugOf(it.p);
      if (st.state.stock[k] == null) { lines.push(M.title(m, it.p) + ": stan nieznany (/stan)"); return; }
      st.state.stock[k] = Math.max(0, st.state.stock[k] - it.qty);
      lines.push(M.title(m, it.p) + ": zostało " + st.state.stock[k] + " szt.");
      touched.push(it.p);
    });
    return L.writeStock(st.state, st.sha, "Telegram: website order confirmed (" + who(cq.from) + ")").then(function () {
      return edit(msg, base + "\n\n✅ Sprzedane — potwierdził " + who(cq.from) + ".\n🔒 " + lines.join("\n🔒 "));
    }).then(function () { return askSoldOut(msg.chat.id, m, st.state.stock, touched); });
  });
}

// ---------- updates ----------
var me = null;   // this bot's @username, to ignore commands meant for other bots in the group
function myName() { if (!me) me = tg("getMe", {}).then(function (r) { return ((r.result && r.result.username) || "").toLowerCase(); }); return me; }

function onMessage(msg) {
  var text = (msg.text || "").trim();
  if (text && text[0] !== "/") {
    // a pasted menu: a reply to "Wklej nowe menu", or (in a private chat) any message with a menu in it
    var prompted = isMenuPrompt(msg.reply_to_message);
    if (!prompted && msg.chat.type !== "private") return null;
    if (!allowed(msg.from)) return prompted ? reply(msg, "Nie masz dostępu do zmiany menu.") : null;
    if (/^📝?\s*nowe\s+menu\s*$/iu.test(text)) return askForMenu(msg);
    return menuCommand(msg, text, prompted ? "prompted" : "quiet");
  }
  if (!text) return null;
  var at = (text.split(/\s/)[0].split("@")[1] || "").toLowerCase();
  if (at) return myName().then(function (name) { return at === name ? handleCommand(msg, text) : null; });
  return handleCommand(msg, text);
}
function handleCommand(msg, text) {
  var cmd = text.split(/[\s@]/)[0].toLowerCase();
  if (cmd === "/id") return reply(msg, "Twój ID w Telegramie: " + msg.from.id + (allowed(msg.from) ? " ✅ (masz dostęp)" : "\nDodaj go w Vercel do ALLOWED_USERS, żeby móc zmieniać menu.") + (msg.chat.type !== "private" ? "\nID tego czatu: " + msg.chat.id : ""));
  if (cmd === "/start" || cmd === "/pomoc" || cmd === "/help") return reply(msg, HELP);
  if (!L.ALLOWED.length) return reply(msg, "Bot nie ma jeszcze ustawionych osób z dostępem (ALLOWED_USERS w Vercel). Wyślij /id, żeby poznać swój numer.");
  if (!allowed(msg.from)) return reply(msg, "Nie masz dostępu do zmiany menu.");
  if (cmd === "/menu") return menuCommand(msg, text);
  if (cmd === "/nowemenu" || cmd === "/nowe") return askForMenu(msg);
  if (cmd === "/pokaz" || cmd === "/pokaż") return showMenu(msg);
  if (cmd === "/stan") return stockCommand(msg, text);
  if (cmd === "/odejmij") return subtractCommand(msg, text);
  if (cmd === "/wyprzedane" || cmd === "/wyprzedany") return availabilityCommand(msg, text, true);
  if (cmd === "/dostepne" || cmd === "/dostępne" || cmd === "/dostepny") return availabilityCommand(msg, text, false);
  if (cmd === "/cofnij") return undo(msg);
  return null;                                         // someone else's command in the group
}

function onCallback(cq) {
  var msg = cq.message, data = cq.data || "";
  if (!allowed(cq.from)) return tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Nie masz dostępu do zmiany menu.", show_alert: true });
  var done = tg("answerCallbackQuery", { callback_query_id: cq.id });
  if (data === "x") return done.then(function () { return edit(msg, "Anulowano — menu bez zmian."); });
  if (data === "sk") return done.then(function () { return edit(msg, (msg.text || "").split("\n")[0] + "\nOK — zostaje w sprzedaży na stronie."); });
  if (data === "pub") {
    var orig = msg.reply_to_message;
    if (!orig || !orig.text) return done.then(function () { return edit(msg, "Nie widzę już wiadomości z menu — wyślij /menu jeszcze raz."); });
    return done.then(function () { return Promise.all([L.readMenu(), L.readStock()]); }).then(function (r) {
      var cur = r[0], st = r[1], parsed = M.parseMenu(orig.text, cur.menu);
      if (!parsed.menu.products.length) return edit(msg, "Nie rozpoznałem menu — wyślij /menu jeszcze raz.");
      var newStock = mergeStock(st.state.stock, parsed.menu, parsed.stock);
      return L.writeMenu(parsed.menu, cur.sha, "Telegram: new menu (" + who(cq.from) + ")").then(function () {
        if (JSON.stringify(newStock) === JSON.stringify(st.state.stock)) return null;
        st.state.stock = newStock;
        return L.writeStock(st.state, st.sha, "Telegram: stock update (" + who(cq.from) + ")");
      }).then(function () {
        return edit(msg, "✅ Opublikowane przez " + who(cq.from) + " — " + parsed.menu.products.length + " smaków.\nStrona zaktualizuje się za ok. 30 s: snusshop.pl/menu" +
          (Object.keys(newStock).length ? "\n🔒 Stany zapisane w bocie (/stan) — nie ma ich na stronie." : ""));
      });
    });
  }
  var o = data.match(/^(ok|no):([\w-]{4,40})$/);
  if (o) return done.then(function () { return confirmOrder(cq, o[2], o[1] === "ok"); });
  var mm = data.match(/^(so|av|sx):(.+)$/);
  if (mm) {
    return done.then(function () { return L.readMenu(); }).then(function (cur) {
      var p = cur.menu.products.filter(function (x) { return key60(x) === mm[2]; })[0];
      if (!p) return edit(msg, "Tego smaku nie ma już w menu.");
      if (mm[1] === "sx" && p.soldOut) return edit(msg, "❌ " + M.title(cur.menu, p) + " jest już wyprzedane na stronie.");
      return setAvailability(msg, cur.menu, cur.sha, p, mm[1] !== "av", cq.from, true);
    });
  }
  return done;
}

function setup(req) {
  var url = "https://" + (req.headers["x-forwarded-host"] || req.headers.host) + "/api/telegram";
  return Promise.all([
    tg("setWebhook", { url: url, secret_token: L.SECRET, allowed_updates: ["message", "callback_query"], drop_pending_updates: true }),
    tg("setMyCommands", { commands: [
      { command: "nowemenu", description: "📝 Nowe menu — wklej je, pokażę podgląd" },
      { command: "stan", description: "🔒 Stan magazynowy (tylko w bocie)" },
      { command: "odejmij", description: "Sprzedane poza stroną, np. /odejmij cherry 2" },
      { command: "wyprzedane", description: "Oznacz smak jako wyprzedany" },
      { command: "dostepne", description: "Smak znów dostępny" },
      { command: "pokaz", description: "Aktualne menu na stronie" },
      { command: "menu", description: "Nowe menu w tej samej wiadomości" },
      { command: "cofnij", description: "Przywróć poprzednie menu" },
      { command: "id", description: "Twój numer ID" },
      { command: "pomoc", description: "Jak używać bota" }
    ] })
  ]).then(function (r) { return { webhook: url, telegram: r[0], commands: r[1].ok, allowedUsers: L.ALLOWED.length, github: !!L.GH_TOKEN }; });
}

module.exports = async function (req, res) {
  if (!L.TOKEN) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN is not set in Vercel" });
  if (req.method === "GET") {
    if (req.query && "setup" in req.query) {
      try { return res.status(200).json(await setup(req)); } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
    }
    return res.status(200).send("Snus Shop 24 bot is running.");
  }
  if (req.headers["x-telegram-bot-api-secret-token"] !== L.SECRET) return res.status(401).send("unauthorized");
  var update = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  try {
    if (update.message) await onMessage(update.message);
    else if (update.callback_query) await onCallback(update.callback_query);
  } catch (e) {
    console.error(e);
    var target = update.message || (update.callback_query && update.callback_query.message);
    if (target) { try { await reply(target, "⚠️ Coś poszło nie tak: " + String(e.message || e).slice(0, 300) + "\nNic nie zostało zmienione."); } catch (e2) {} }
  }
  return res.status(200).send("ok");   // always 200 so Telegram doesn't resend the same message
};
