// Website order → Telegram. When a customer taps "Send order on Instagram", the page posts the basket
// here and the bot sends it to the sellers with ✅ Sold / ❌ Reject buttons. Stock only changes when a
// seller confirms (in telegram.js), because the customer may still not send the Instagram message.
// Nothing about stock is returned to the page.
"use strict";
var L = require("./_lib.js");
var M = L.M;

// light protection against someone spamming the sellers' Telegram (per server instance)
var hits = {};
function tooMany(ip) {
  var now = Date.now(), list = (hits[ip] || []).filter(function (t) { return now - t < 10 * 60e3; });
  list.push(now); hits[ip] = list;
  return list.length > 8;
}

module.exports = async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!L.TOKEN || !L.GH_TOKEN || !L.orderChats().length) return res.status(503).json({ ok: false });
  var ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (tooMany(ip)) return res.status(429).json({ ok: false });

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; } }
  body = body || {};
  var id = String(body.id || "");
  var items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
  var ref = String(body.ref || "").replace(/[^0-9A-Za-z]/g, "").slice(0, 32);
  if (!/^[a-z0-9]{6,24}$/.test(id) || !items.length) return res.status(400).json({ ok: false });

  try {
    var r = await Promise.all([L.readMenu(), L.readStock()]);
    var m = r[0].menu, stock = r[1].state.stock;
    var lines = [], now = [], short = [], total = 0;
    items.forEach(function (it) {
      var qty = Math.floor(+(it && it.qty));
      if (!(qty >= 1 && qty <= 99)) return;
      var p = m.products.filter(function (x) { return M.webSlug(x) === String(it.slug || ""); })[0];
      if (!p || p.soldOut) return;
      total += qty;
      lines.push("• " + qty + "× " + M.title(m, p));
      var n = stock[M.slugOf(p)];
      if (n != null) {
        now.push(p.name + " " + n);
        if (qty > n) short.push(p.name + " (na stanie " + n + ", zamówiono " + qty + ")");
      }
    });
    if (!lines.length) return res.status(400).json({ ok: false });

    var text = ["🧺 Nowe zamówienie ze strony", "", lines.join("\n"), "", "Razem: " + total + " szt."];
    if (ref) text.push("📦 Paczka klienta: " + ref.replace(/(.{4})/g, "$1 ").trim());
    if (now.length) text.push("🔒 Na stanie teraz: " + now.join(", "));
    if (short.length) text.push("⚠️ Za mało: " + short.join(", "));
    text.push("", "👉 Klient skopiował tę wiadomość na Instagram. Gdy faktycznie zamówi, potwierdź — odejmę to ze stanu.");
    var markup = { inline_keyboard: [[{ text: "✅ Sprzedane", callback_data: "ok:" + id }, { text: "❌ Odrzuć", callback_data: "no:" + id }]] };

    var sent = await Promise.all(L.orderChats().map(function (chat) {
      return L.tg("sendMessage", { chat_id: chat, text: text.join("\n"), reply_markup: markup, disable_web_page_preview: true })
        .then(function (j) { return !!j.ok; }, function () { return false; });
    }));
    return res.status(200).json({ ok: sent.some(Boolean) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
};
