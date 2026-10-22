// Extra features for the tracking page and the link maker.
// Loaded by app.js only when config.js has extras: true, or when previewing with ?preview=1.
//
//  1. Directions to the Paczkomat         6. Live weather on the map
//  2. "Your order" + order again          7. Alert when the status changes
//  3. Celebration (+ thank-you code)      8. Share buttons + QR code on the link maker
//  4. Pickup countdown                    9. "My parcels" list for the seller
//  5. Day/night map
(function () {
  "use strict";
  var S = window.SnusTrack;
  if (!S) return;
  var CFG = S.CFG, params = S.params;
  var $ = function (id) { return document.getElementById(id); };
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function pl() { return S.lang() === "pl"; }
  function L(plText, enText) { return pl() ? plText : enText; }
  // Which features are on: everything in preview, otherwise what config.js switches on
  // (extras: true for all, or e.g. extras: { order: true, myParcels: true }).
  function on(name) { return S.preview || CFG.extras === true || !!(CFG.extras && CFG.extras[name]); }

  // styles for everything below
  var css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "extras.css";
  document.head.appendChild(css);

  if (S.preview) {
    var badge = h("div", "x-preview", L("PODGLĄD nowych funkcji", "PREVIEW of new features"));
    document.body.appendChild(badge);
  }

  var info = null;           // latest render info from app.js
  var dest = null;           // { lat, lng, city } of the pickup point

  // =====================================================================
  //  1. Directions to the Paczkomat
  // =====================================================================
  function directionsUrl(lat, lng) {
    var apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
    return apple ? "https://maps.apple.com/?daddr=" + lat + "," + lng + "&dirflg=d"
                 : "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng;
  }
  function updateDirections() {
    var box = $("dest");
    if (!box) return;
    var btn = $("xNav");
    if (!dest) { if (btn) btn.hidden = true; return; }
    if (!btn) {
      btn = h("a", "x-nav-btn");
      btn.id = "xNav"; btn.target = "_blank"; btn.rel = "noopener";
      box.appendChild(btn);
    }
    btn.hidden = false;
    btn.href = directionsUrl(dest.lat, dest.lng);
    btn.textContent = "🧭 " + L("Nawiguj do Paczkomatu", "Directions to the Paczkomat");
  }

  // =====================================================================
  //  2. "Your order" + order again   (link made with &f=<flavour>)
  // =====================================================================
  function findProduct(slug) {
    var list = S.products();
    for (var i = 0; i < list.length; i++) if (S.slugOf(list[i]) === slug) return list[i];
    return null;
  }
  var ordered = params.get("f") ? findProduct(params.get("f")) : null;
  var orderBox = null;
  function updateOrderBox() {
    if (!ordered) return;
    var shop = $("shopCard");
    if (!shop) return;
    if (!orderBox) {
      orderBox = h("div", "x-order");
      shop.insertBefore(orderBox, shop.firstChild);
      S.selectProductBySlug(S.slugOf(ordered));
    }
    orderBox.innerHTML = "";
    var art = h("div", "x-order-art");
    art.appendChild(S.drawTin(ordered));
    var txt = h("div", "x-order-txt");
    txt.appendChild(h("div", "eyebrow", L("Twoje zamówienie", "Your order")));
    txt.appendChild(h("div", "x-order-name", S.productTitle(ordered)));
    var l = S.lineOf(ordered);
    if (l.strength) txt.appendChild(h("div", "muted small", l.strength));
    var again = h("a", "x-again", "🔁 " + L("Zamów ponownie", "Order again"));
    again.href = S.igUrl(); again.target = "_blank"; again.rel = "noopener";
    again.addEventListener("click", function (e) {
      e.preventDefault();
      S.startOrder(S.orderMessageFor(ordered));      // same "order copied" guide as the basket
    });
    txt.appendChild(again);
    orderBox.appendChild(art); orderBox.appendChild(txt);
  }

  // =====================================================================
  //  3. Celebration when the parcel arrives / is collected
  // =====================================================================
  function celebrateKey(state) { return "x-cele-" + S.number + "-" + state; }
  function maybeCelebrate(state, force) {
    var key = celebrateKey(state);
    var seen = false;
    try { seen = !!localStorage.getItem(key); } catch (e) {}
    if (seen && !force) return;
    try { localStorage.setItem(key, "1"); } catch (e) {}
    confetti();
    var wrap = $("mapWrap");
    wrap.classList.remove("x-hop"); void wrap.offsetWidth; wrap.classList.add("x-hop");
    setTimeout(function () { wrap.classList.remove("x-hop"); }, 2600);
    if (navigator.vibrate) navigator.vibrate([90, 70, 90, 70, 160]);
  }
  function confetti() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = h("canvas", "x-confetti"), ctx = c.getContext("2d");
    var W = c.width = innerWidth * (devicePixelRatio || 1), H = c.height = innerHeight * (devicePixelRatio || 1);
    document.body.appendChild(c);
    var colors = ["#ffffff", "#e9e6df", "#d8b45a", "#4ee08a", "#ff5fa2", "#8fd8ff"];
    var bits = [];
    for (var i = 0; i < 140; i++) bits.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * W * 0.018, vy: -Math.random() * H * 0.022 - H * 0.006,
      s: (4 + Math.random() * 6) * (devicePixelRatio || 1), r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length] });
    var t0 = performance.now();
    (function frame(now) {
      var k = (now - t0) / 2600;
      ctx.clearRect(0, 0, W, H);
      bits.forEach(function (b) {
        b.vy += H * 0.0009; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(b.x, b.y); ctx.rotate(b.r);
        ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  var thanksBox = null;
  function updateThanks(show) {
    var code = CFG.thanksCode || (S.preview ? "DZIEKI10" : "");
    if (!show || !code) { if (thanksBox) thanksBox.hidden = true; return; }
    if (!thanksBox) {
      thanksBox = h("div", "x-thanks");
      var card = document.querySelector(".status-card");
      card.parentNode.insertBefore(thanksBox, card.nextSibling);
    }
    thanksBox.hidden = false;
    thanksBox.innerHTML = "";
    thanksBox.appendChild(h("div", "x-thanks-ico", "🎁"));
    var t = h("div", "x-thanks-txt");
    t.appendChild(h("div", "x-thanks-head", CFG.thanksText || L("Dziękujemy za zamówienie!", "Thanks for your order!")));
    t.appendChild(h("div", "muted small", L("Kod rabatowy na następne zamówienie:", "Discount code for your next order:")));
    var codeBtn = h("button", "x-code", code);
    codeBtn.type = "button";
    codeBtn.addEventListener("click", function () { S.copyText(code); S.toast(L("Kod skopiowany", "Code copied")); });
    t.appendChild(codeBtn);
    if (S.preview && !CFG.thanksCode) t.appendChild(h("div", "x-note", L("(przykładowy kod — ustaw własny w config.js)", "(example code — set your own in config.js)")));
    thanksBox.appendChild(t);
  }

  // =====================================================================
  //  4. Pickup countdown (InPost usually keeps parcels 48 h; the exact deadline is in their SMS/app)
  // =====================================================================
  var PICKUP_HOURS = CFG.pickupHours || 48;
  var countdownBox = null, readySince = null, countdownTimer = null;
  function updateCountdown() {
    if (!readySince) { if (countdownBox) countdownBox.hidden = true; return; }
    if (!countdownBox) {
      countdownBox = h("div", "x-countdown");
      var facts = document.querySelector(".status-card .facts");
      facts.parentNode.insertBefore(countdownBox, facts);
    }
    var deadline = readySince + PICKUP_HOURS * 3600e3, left = deadline - Date.now();
    countdownBox.hidden = false;
    countdownBox.innerHTML = "";
    countdownBox.appendChild(h("div", "x-cd-ico", "⏳"));
    var t = h("div");
    if (left > 0) {
      var hrs = Math.floor(left / 3600e3), mins = Math.floor(left % 3600e3 / 60e3);
      t.appendChild(h("div", "x-cd-head", L("Odbierz w ciągu ok. ", "Collect within about ") + (hrs ? hrs + " h " : "") + mins + " min"));
      t.appendChild(h("div", "muted small", L("do ok. ", "until about ") + S.fmtDate(new Date(deadline).toISOString())));
    } else {
      t.appendChild(h("div", "x-cd-head", L("Termin odbioru mógł minąć", "The pickup time may have passed")));
    }
    t.appendChild(h("div", "x-note", L("Zwykle " + PICKUP_HOURS + " h — dokładny termin jest w SMS-ie i aplikacji InPost.", "Usually " + PICKUP_HOURS + " h — the exact deadline is in the InPost SMS and app.")));
    countdownBox.appendChild(t);
    var bar = h("div", "x-cd-bar"), fill = h("div");
    fill.style.width = Math.max(0, Math.min(100, left / (PICKUP_HOURS * 3600e3) * 100)) + "%";
    bar.appendChild(fill); countdownBox.appendChild(bar);
  }

  // =====================================================================
  //  5 + 6. Weather on the map, and night mode after sunset
  // =====================================================================
  var weather = null, weatherFetched = 0, chip = null, fx = null;
  var WMO = function (c, day) {
    if (c === 0) return day ? "☀️" : "🌙";
    if (c <= 2) return day ? "⛅" : "☁️";
    if (c === 3) return "☁️";
    if (c === 45 || c === 48) return "🌫️";
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "❄️";
    if (c >= 95) return "⛈️";
    if (c >= 80) return "🌦️";
    if (c >= 51) return "🌧️";
    return "🌡️";
  };
  function precip(c) {
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "snow";
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95) return "rain";
    return null;
  }
  function fetchWeather() {
    if (!dest || Date.now() - weatherFetched < 15 * 60e3) return;
    weatherFetched = Date.now();
    var key = "x-wx-" + dest.lat + "," + dest.lng;
    try {                                   // reuse a recent answer (15 min) instead of asking again
      var c = JSON.parse(sessionStorage.getItem(key) || "null");
      if (c && Date.now() - c.at < 15 * 60e3) { weather = c.w; applyWeather(); return; }
    } catch (e) {}
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + dest.lat + "&longitude=" + dest.lng +
      "&current=temperature_2m,weather_code,is_day&daily=sunrise,sunset&timezone=Europe%2FWarsaw&forecast_days=1";
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.current) return;
      weather = { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code, day: j.current.is_day === 1,
                  sunrise: j.daily && j.daily.sunrise && j.daily.sunrise[0], sunset: j.daily && j.daily.sunset && j.daily.sunset[0] };
      try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), w: weather })); } catch (e) {}
      applyWeather();
    }).catch(function () { weatherFetched = 0; });
  }
  function forced() {
    var w = params.get("weather");
    return S.preview && w ? w : null;
  }
  function isNight() {
    var f = S.preview && params.get("time");
    if (f) return f === "night";
    if (weather) return !weather.day;
    var hr = +new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Warsaw" });
    return hr >= 19 || hr < 7;
  }
  function applyWeather() {
    // 5. night map — only for dark base styles; the day style stays as chosen
    var base = S.baseMapStyle();
    if (on("nightMap") && CFG.autoNight !== false && (base === "noir" || base === "neon")) S.setMapStyle(isNight() ? "night" : base);
    if (!on("weather")) return;

    // 6. weather chip + rain/snow
    var kind = forced() || (weather ? precip(weather.code) : null);
    if (kind === "clear") kind = null;
    if (weather || forced()) {
      if (!chip) {
        chip = h("span", "x-weather");
        var top = document.querySelector(".hud-top");
        top.insertBefore(chip, top.children[1]);
      }
      var icon = forced() === "rain" ? "🌧️" : forced() === "snow" ? "❄️" : forced() === "clear" ? "☀️" : WMO(weather.code, weather.day);
      chip.textContent = icon + (weather ? " " + weather.temp + "°C" : "");
      if (dest && dest.city) { var cty = h("span", "x-city", " · " + dest.city); chip.appendChild(cty); }
    }
    setFx(kind);
  }
  function setFx(kind) {
    if (fx && fx.kind === kind) return;
    if (fx) { fx.stop(); fx = null; }
    if (!kind || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    var wrap = $("mapWrap"), c = h("canvas", "x-fx"), ctx = c.getContext("2d"), running = true, dpr = devicePixelRatio || 1;
    wrap.insertBefore(c, wrap.querySelector(".hud"));
    var W, H, drops = [];
    function size() { W = c.width = wrap.clientWidth * dpr; H = c.height = wrap.clientHeight * dpr; }
    size();
    var n = kind === "snow" ? 90 : 120;
    for (var i = 0; i < n; i++) drops.push({ x: Math.random() * W, y: Math.random() * H, v: (kind === "snow" ? 0.6 + Math.random() * 0.8 : 9 + Math.random() * 6) * dpr, r: (1 + Math.random() * 2) * dpr, p: Math.random() * 6 });
    window.addEventListener("resize", size);
    (function frame() {
      if (!running) return;
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(200,220,255,.45)"; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.2 * dpr;
        drops.forEach(function (d) {
          if (kind === "snow") { d.p += 0.02; d.x += Math.sin(d.p) * 0.6 * dpr; d.y += d.v; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.3); ctx.fill(); }
          else { d.y += d.v; d.x -= d.v * 0.15; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.v * 0.15, d.y - d.v * 1.6); ctx.stroke(); }
          if (d.y > H + 10) { d.y = -10; d.x = Math.random() * W * 1.1; }
        });
      }
      requestAnimationFrame(frame);
    })();
    fx = { kind: kind, stop: function () { running = false; window.removeEventListener("resize", size); c.remove(); } };
  }

  // =====================================================================
  //  7. Alert when the status changes while the page is open
  // =====================================================================
  var lastStatus = null, flashTimer = null, plainTitle = document.title;
  function statusChanged(title) {
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    S.toast("🔔 " + L("Nowy status: ", "New status: ") + title);
    plainTitle = document.title;
    clearInterval(flashTimer);
    var on = false;
    flashTimer = setInterval(function () {
      on = !on;
      document.title = on ? "🔔 " + L("Nowy status!", "New status!") : plainTitle;
    }, 1000);
    var stop = function () { if (!document.hidden) { clearInterval(flashTimer); document.title = plainTitle; } };
    document.addEventListener("visibilitychange", stop);
    window.addEventListener("focus", stop);
    setTimeout(stop, 8000);
  }

  // =====================================================================
  //  On every render of the tracking page
  // =====================================================================
  S.on("render", function (r) {
    info = r;
    var m = r.machine, loc = m && m.location;
    if (loc && loc.latitude && loc.longitude) {
      var line2 = (m.address && m.address.line2) || "";
      dest = { lat: loc.latitude, lng: loc.longitude, city: line2.replace(/^\s*\d{2}-\d{3}\s*/, "").trim() };
    } else dest = null;

    if (on("directions")) updateDirections();             // 1
    if (on("order")) updateOrderBox();                    // 2

    var waiting = r.dest === "locker" && r.key === "at3" && !r.delivered && !r.problem;
    var replay = S.isDemo && lastStatus !== r.current;   // in the demo, celebrate each time you switch to it
    if (on("celebrate")) {                                // 3
      if (r.delivered) maybeCelebrate("delivered", replay);
      else if (waiting) maybeCelebrate("ready", replay);
      updateThanks(r.delivered || waiting);
    }

    readySince = null;                                     // 4
    if (waiting && on("countdown")) {
      for (var i = r.details.length - 1; i >= 0; i--) {
        if (/^ready_to_pickup/.test(r.details[i].status)) { readySince = new Date(r.details[i].datetime).getTime(); break; }
      }
      if (!readySince && r.details[0]) readySince = new Date(r.details[0].datetime).getTime();
    }
    updateCountdown();
    clearInterval(countdownTimer);
    if (readySince) countdownTimer = setInterval(updateCountdown, 60e3);

    if (on("weather") || on("nightMap")) { fetchWeather(); applyWeather(); }   // 5 + 6

    if (on("alerts") && lastStatus && lastStatus !== r.current) statusChanged(r.title);   // 7
    lastStatus = r.current;
  });
  if (on("weather") || on("nightMap")) setInterval(function () { fetchWeather(); applyWeather(); }, 5 * 60e3);

  // =====================================================================
  //  8 + 9. Link maker: flavour picker, share, QR code, "My parcels"
  // =====================================================================
  var SAVED = "x-my-parcels";
  function loadSaved() { try { return JSON.parse(localStorage.getItem(SAVED) || "[]"); } catch (e) { return []; } }
  function storeSaved(list) { try { localStorage.setItem(SAVED, JSON.stringify(list.slice(0, 60))); } catch (e) {} }
  function linkFor(n, f) { return location.origin + location.pathname + "?p=" + n + (f && on("order") ? "&f=" + f : "") + (S.preview ? "&preview=1" : ""); }

  S.on("makerReady", function () {
    var form = $("mkForm");
    // flavour picker (optional) so the customer sees "Your order"
    if (on("order")) addFlavourPicker(form);
    // share row + QR under the generated link
    if (on("share")) {
      var out = $("mkOut");
      var share = h("div", "x-share");
      share.id = "xShare";
      out.parentNode.insertBefore(share, out.nextSibling);
      var qr = h("div", "x-qr");
      qr.id = "xQr"; qr.hidden = true;
      share.parentNode.insertBefore(qr, share.nextSibling);
    }
    // my parcels
    if (on("myParcels")) {
      var mine = h("div", "x-mine");
      mine.id = "xMine";
      var demoP = document.querySelector("#makeView p.small");
      demoP.parentNode.insertBefore(mine, demoP);
      renderMine();
    }
  });

  function addFlavourPicker(form) {
    var sel = h("select", "x-flavour");
    sel.id = "xFlavour";
    var none = h("option", null, L("Smak (opcjonalnie) — pokaże się klientowi", "Flavour (optional) — shown to the customer"));
    none.value = ""; sel.appendChild(none);
    var groups = {};
    S.products().forEach(function (p) {
      var l = S.lineOf(p), g = groups[p.line];
      if (!g) { g = groups[p.line] = h("optgroup"); g.label = (l.name || p.line) + (l.strength ? " · " + l.strength : ""); sel.appendChild(g); }
      var o = h("option", null, p.name); o.value = S.slugOf(p); g.appendChild(o);
    });
    form.insertBefore(sel, $("mkBtn"));      // between the number and the "Create link" button
  }

  S.on("makeLink", function (made) {
    var f = $("xFlavour") ? $("xFlavour").value : "";
    made.url = linkFor(made.number, f);
    if (on("myParcels")) {
      var list = loadSaved().filter(function (x) { return x.n !== made.number; });
      list.unshift({ n: made.number, f: f, at: Date.now() });
      storeSaved(list);
    }
    setTimeout(function () { if (on("share")) buildShare(made.url); renderMine(); }, 0);
  });

  function buildShare(url) {
    var box = $("xShare");
    box.innerHTML = "";
    var msg = L("Twoja paczka jest w drodze 🛵 Śledź ją tutaj: ", "Your parcel is on its way 🛵 Track it here: ") + url;
    function btn(label, href, onClick) {
      var b = h(href ? "a" : "button", "chip-btn x-share-btn", label);
      if (href) { b.href = href; b.target = "_blank"; b.rel = "noopener"; } else b.type = "button";
      if (onClick) b.addEventListener("click", onClick);
      box.appendChild(b);
    }
    if (navigator.share) btn("📤 " + L("Udostępnij", "Share"), null, function () { navigator.share({ text: msg }).catch(function () {}); });
    btn("WhatsApp", "https://wa.me/?text=" + encodeURIComponent(msg));
    btn("SMS", "sms:?&body=" + encodeURIComponent(msg));
    btn("▦ " + L("Kod QR", "QR code"), null, function () { toggleQr(url); });
  }

  function loadQrLib(cb) {
    if (window.qrcode) return cb();
    var s = document.createElement("script");
    s.src = "assets/vendor/qrcode.js"; s.onload = cb;
    document.head.appendChild(s);
  }
  function toggleQr(url) {
    var box = $("xQr");
    if (!box.hidden && box.getAttribute("data-url") === url) { box.hidden = true; return; }
    loadQrLib(function () {
      var q = window.qrcode(0, "M");
      q.addData(url); q.make();
      var n = q.getModuleCount(), cell = 8, pad = 4 * cell, size = n * cell + pad * 2;
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size); ctx.fillStyle = "#000";
      for (var r = 0; r < n; r++) for (var col = 0; col < n; col++) if (q.isDark(r, col)) ctx.fillRect(pad + col * cell, pad + r * cell, cell, cell);
      box.innerHTML = "";
      box.setAttribute("data-url", url);
      c.className = "x-qr-img";
      box.appendChild(c);
      var dl = h("a", "btn-link", "⬇ " + L("Pobierz kod QR (PNG)", "Download QR code (PNG)"));
      dl.href = c.toDataURL("image/png"); dl.download = "sledzenie-paczki.png";
      box.appendChild(dl);
      box.appendChild(h("div", "x-note", L("Wydrukuj i włóż do paczki — klient zeskanuje go telefonem.", "Print it and put it in the parcel — the customer scans it with their phone.")));
      box.hidden = false;
    });
  }

  var statusCache = {};
  function renderMine() {
    var box = $("xMine");
    if (!box) return;
    var list = loadSaved();
    box.innerHTML = "";
    var head = h("div", "x-mine-head");
    head.appendChild(h("h2", null, L("Moje paczki", "My parcels")));
    if (list.length) {
      var rf = h("button", "chip-btn", "↻ " + L("Odśwież", "Refresh"));
      rf.type = "button";
      rf.addEventListener("click", function () { statusCache = {}; renderMine(); });
      head.appendChild(rf);
    }
    box.appendChild(head);
    if (!list.length) { box.appendChild(h("p", "muted small", L("Tu pojawią się linki, które utworzysz — z aktualnym statusem z InPost.", "Links you create will appear here, with their live InPost status."))); return; }
    var counts = h("div", "x-mine-counts");
    box.appendChild(counts);
    var ul = h("ul", "x-mine-list");
    box.appendChild(ul);
    var tally = { way: 0, wait: 0, done: 0, issue: 0 };
    S.loadStatuses().then(function () {
      list.forEach(function (it) {
        var li = h("li", "x-mine-item");
        var top = h("div", "x-mine-top");
        var dot = h("span", "x-dot");
        top.appendChild(dot);
        top.appendChild(h("span", "mono", S.prettyNumber(it.n)));
        li.appendChild(top);
        var p = it.f && findProduct(it.f);
        var st = h("div", "x-mine-status muted small", L("Sprawdzam…", "Checking…"));
        li.appendChild(st);
        if (p) li.appendChild(h("div", "small", "🛍 " + S.productTitle(p)));
        var actions = h("div", "x-mine-actions");
        var open = h("a", "btn-link", L("Otwórz", "Open")); open.href = linkFor(it.n, it.f); open.target = "_blank"; open.rel = "noopener";
        var copy = h("button", "btn-link x-linkbtn", L("Kopiuj link", "Copy link")); copy.type = "button";
        copy.addEventListener("click", function () { S.copyText(linkFor(it.n, it.f)); S.toast(L("Skopiowano", "Copied")); });
        var del = h("button", "btn-link x-linkbtn x-del", L("Usuń", "Remove")); del.type = "button";
        del.addEventListener("click", function () { storeSaved(loadSaved().filter(function (x) { return x.n !== it.n; })); renderMine(); });
        actions.appendChild(open); actions.appendChild(copy); actions.appendChild(del);
        li.appendChild(actions);
        ul.appendChild(li);
        lookup(it.n).then(function (d) {
          var s = d && d.status;
          var kind = !d ? "issue" : s === "delivered" ? "done" : /^(ready_to_pickup|pickup_reminder_sent|stack_in_box_machine|stack_in_customer_service_point|courier_avizo_in_customer_service_point|ready_to_pickup_from_branch)/.test(s) ? "wait"
                   : /^(pickup_time_expired|avizo|claimed|returned_to_sender|canceled|rejected_by_receiver|undelivered|missing|oversized)/.test(s) ? "issue" : "way";
          tally[kind]++;
          dot.className = "x-dot x-" + kind;
          st.textContent = d ? S.statusText(s).title + (d.updated ? " · " + S.fmtDate(d.updated) : "") : L("Brak danych w InPost (jeszcze)", "No InPost data (yet)");
          counts.textContent = [L("W drodze", "On the way") + " " + tally.way, L("W Paczkomacie", "In Paczkomat") + " " + tally.wait,
                                L("Odebrane", "Collected") + " " + tally.done, L("Do sprawdzenia", "Check") + " " + tally.issue].join(" · ");
        });
      });
    });
    box.appendChild(h("p", "x-note", L("Lista jest zapisana tylko na tym telefonie.", "This list is saved on this phone only.")));
  }
  function lookup(n) {
    if (statusCache[n]) return statusCache[n];
    statusCache[n] = fetch(S.API + "/tracking/" + encodeURIComponent(n), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return null;
        var det = (j.tracking_details || []).slice().sort(function (a, b) { return new Date(b.datetime) - new Date(a.datetime); });
        return { status: j.status || (det[0] && det[0].status), updated: det[0] && det[0].datetime };
      }).catch(function () { return null; });
    return statusCache[n];
  }
})();
