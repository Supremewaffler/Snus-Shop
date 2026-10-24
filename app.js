(function () {
  "use strict";

  var CFG = Object.assign({ brandName: "Snus Shop 24", refreshSeconds: 60, defaultLang: "pl", instagram: "snus.shop24", products: [] }, window.TRACK_CONFIG || {});
  var API = "https://api-shipx-pl.easypack24.net/v1";
  var SVGNS = "http://www.w3.org/2000/svg";

  // ---------- UI text ----------
  var T = {
    pl: {
      status: "Status InPost", live: "NA ŻYWO", done: "ZAKOŃCZONO", number: "Numer przesyłki", updated: "Ostatnia aktualizacja",
      dest: "Miejsce odbioru", history: "Historia przesyłki", source: "Dane na żywo z InPost", checked: "sprawdzono",
      approx: "Pozycja kuriera na mapie jest orientacyjna — przesuwa się z każdą aktualizacją InPost.",
      hint: "Użyj dwóch palców, aby przesuwać mapę", zoomIn: "Przybliż", zoomOut: "Oddal",
      shopTitle: "Popularne smaki", all: "Wszystkie",
      igNote: "Wiadomość zostanie skopiowana — po otwarciu czatu wklej ją i wyślij.", prev: "Poprzedni", next: "Następny",
      orderMsg: "Cześć! Chcę zamówić {product} 🙂", orderRef: "Numer mojej ostatniej przesyłki: {number}",
      refresh: "Odśwież", refreshing: "Sprawdzam…", refreshed: "Aktualne ✓", refreshFail: "Brak połączenia",
      map: "Mapa ↗", hours: "Godziny otwarcia: ", follow: "Śledź", fit: "Trasa", tag: "Twoja paczka",
      pins: ["Magazyn — wysyłka", "Sortownia InPost", "Oddział lokalny"],
      destPin: { locker: "Twój Paczkomat", home: "Twój dom" },
      steps: ["Magazyn", "Sortownia", "Oddział", { locker: "Paczkomat", home: "Twój dom" }],
      hud: {
        at0: "Magazyn — pakujemy i przygotowujemy wysyłkę", mov0: "Wyjechało z magazynu — jedzie do sortowni",
        at1: "Paczka jest w sortowni InPost", mov1: "W trasie do Twojego miasta",
        at2: "Paczka w oddziale lokalnym — zaraz ruszamy do Ciebie", mov2: "Kurier jedzie do Ciebie!",
        at3locker: "Czeka na Ciebie w Paczkomacie — możesz odebrać!", at3home: "Kurier jest pod Twoim domem!",
        delivered: "Dostarczone. Smacznego! ✅", problem: "Mamy mały postój — szczegóły poniżej"
      },
      errTitle: "Jeszcze nie ruszyliśmy", errNotFound: "InPost nie ma jeszcze informacji o tej przesyłce. Zwykle pojawiają się kilka godzin po nadaniu — strona sama się odświeży.",
      errNet: "Nie udało się połączyć z InPost. Spróbujemy ponownie za chwilę.", errBad: "Ten link wygląda na niepełny. Poproś sprzedawcę o nowy.",
      menuTitle: "Menu", menuText: "Dodaj smaki do koszyka i wyślij zamówienie — wiadomość skopiuje się sama, a Instagram otworzy czat. Wklej ją i wyślij.",
      add: "Dodaj do koszyka", soldOut: "Wyprzedane", added: "Dodano {q}× {product} do koszyka", basket: "Koszyk", seeBasket: "Zobacz koszyk",
      send: "Wyślij zamówienie na Instagramie", clear: "Wyczyść koszyk", cleared: "Koszyk wyczyszczony", less: "Mniej", more: "Więcej",
      remove: "Usuń", close: "Zamknij", pcs: "szt.", total: "Razem: {n} szt.",
      basketHead: "Cześć! Chcę zamówić:", basketTotal: "Razem: {n} szt. 🙂",
      gTitle: "Zamówienie skopiowane", gText: "Instagram nie pozwala wpisać wiadomości za Ciebie, więc ją skopiowaliśmy. Po otwarciu czatu:",
      gS1: "Dotknij pola „Wiadomość…”", gS2: "Wybierz „Wklej”", gS3: "Naciśnij „Wyślij”", gPaste: "Wklej", gPh: "Wiadomość…",
      gOpen: "Otwórz Instagram", gCopy: "Skopiuj ponownie", gDone: "Wysłane? Wyczyść koszyk", gRecopied: "Skopiowano ponownie",
      menuBtn: "Menu", menuCopy: "Kopiuj link do menu", menuCopied: "Link do menu skopiowany",
      mkTitle: "Utwórz link śledzenia", mkText: "Wklej numer przesyłki InPost. Otrzymasz link, który możesz wysłać klientowi.",
      mkBtn: "Utwórz link", mkCopy: "Kopiuj", mkCopied: "Skopiowano!", mkOpen: "Podgląd ↗", mkDemo: "Chcesz zobaczyć, jak to wygląda?",
      mkPh: "np. 6800 1234 5678 9012 3456 7890", demo: "Tryb demo — kliknij etap:"
    },
    en: {
      status: "InPost status", live: "LIVE", done: "COMPLETE", number: "Tracking number", updated: "Last update",
      dest: "Pickup point", history: "Parcel history", source: "Live data from InPost", checked: "checked",
      approx: "The courier's position on the map is approximate — it moves with every InPost update.",
      hint: "Use two fingers to move the map", zoomIn: "Zoom in", zoomOut: "Zoom out",
      shopTitle: "Popular flavours", all: "All",
      igNote: "The message is copied for you — paste it in the chat and send.", prev: "Previous", next: "Next",
      orderMsg: "Hi! I'd like to order {product} 🙂", orderRef: "My last parcel number: {number}",
      refresh: "Refresh", refreshing: "Checking…", refreshed: "Up to date ✓", refreshFail: "No connection",
      map: "Map ↗", hours: "Opening hours: ", follow: "Follow", fit: "Route", tag: "Your parcel",
      pins: ["Warehouse — dispatch", "InPost sorting hub", "Local depot"],
      destPin: { locker: "Your Paczkomat", home: "Your home" },
      steps: ["Warehouse", "Sorting", "Depot", { locker: "Paczkomat", home: "Your home" }],
      hud: {
        at0: "Warehouse — packing and dispatching your order", mov0: "Left the warehouse — heading to the sorting hub",
        at1: "Your parcel is at the InPost sorting hub", mov1: "On the road to your city",
        at2: "At the local depot — heading your way soon", mov2: "The courier is on the way to you!",
        at3locker: "Waiting for you in the Paczkomat — go collect it!", at3home: "The courier is at your door!",
        delivered: "Delivered. Enjoy! ✅", problem: "Quick pit stop — details below"
      },
      errTitle: "Not on the road yet", errNotFound: "InPost has no information about this parcel yet. It usually appears a few hours after it is sent — this page refreshes by itself.",
      errNet: "Couldn't reach InPost. Trying again shortly.", errBad: "This link looks incomplete. Ask the seller for a new one.",
      menuTitle: "Menu", menuText: "Add flavours to your basket and send the order — the message is copied for you and Instagram opens the chat. Paste it and send.",
      add: "Add to basket", soldOut: "Sold out", added: "Added {q}× {product} to the basket", basket: "Basket", seeBasket: "View basket",
      send: "Send order on Instagram", clear: "Empty basket", cleared: "Basket emptied", less: "Fewer", more: "More",
      remove: "Remove", close: "Close", pcs: "pcs", total: "Total: {n} pcs",
      basketHead: "Hi! I'd like to order:", basketTotal: "Total: {n} pcs 🙂",
      gTitle: "Order copied", gText: "Instagram doesn't let websites type the message for you, so we copied it. When the chat opens:",
      gS1: "Tap the “Message…” box", gS2: "Choose “Paste”", gS3: "Tap “Send”", gPaste: "Paste", gPh: "Message…",
      gOpen: "Open Instagram", gCopy: "Copy again", gDone: "Sent? Empty the basket", gRecopied: "Copied again",
      menuBtn: "Menu", menuCopy: "Copy menu link", menuCopied: "Menu link copied",
      mkTitle: "Create a tracking link", mkText: "Paste an InPost tracking number to get a link you can send to the customer.",
      mkBtn: "Create link", mkCopy: "Copy", mkCopied: "Copied!", mkOpen: "Preview ↗", mkDemo: "Want to see what it looks like?",
      mkPh: "e.g. 6800 1234 5678 9012 3456 7890", demo: "Demo mode — tap a stage:"
    }
  };

  // ---------- InPost status -> where the moped is ----------
  // Stops: 0 warehouse, 1 sorting hub, 2 local depot, 3 customer.
  // "at N" = parked at stop N, "mov N" = driving from stop N towards N+1.
  var POS = {};
  function pos(key, names) { names.split(" ").forEach(function (n) { POS[n] = key; }); }
  pos("at0", "created offers_prepared offer_selected confirmed");
  pos("mov0", "dispatched_by_sender dispatched_by_sender_to_pok collected_from_sender taken_by_courier taken_by_courier_from_pok adopted_at_source_branch sent_from_source_branch");
  pos("at1", "adopted_at_sorting_center");
  pos("mov1", "sent_from_sorting_center redirect_to_box canceled_redirect_to_box readdressed");
  pos("at2", "adopted_at_target_branch unstack_from_customer_service_point unstack_from_box_machine");
  pos("mov2", "out_for_delivery out_for_delivery_to_address pickup_reminder_sent_address");
  pos("at3", "ready_to_pickup ready_to_pickup_from_pok ready_to_pickup_from_pok_registered pickup_reminder_sent stack_in_box_machine stack_in_customer_service_point courier_avizo_in_customer_service_point ready_to_pickup_from_branch delivered");
  var PROBLEM = /^(pickup_time_expired|avizo|claimed|returned_to_sender|canceled|rejected_by_receiver|undelivered.*|missing|oversized|stack_.*expired|taken_by_courier_from_customer_service_point|return_pickup_confirmation_to_sender)$/;
  var LEG_HOURS = [6, 10, 5]; // typical time per leg, used to creep the moped forward between updates

  // ---------- helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  var lang = (function () {
    // Every visit opens in the default language (Polish). Tapping EN only switches the open page.
    try { localStorage.removeItem("trk-lang"); } catch (e) {}   // forget choices saved by older versions
    try { var s = sessionStorage.getItem("trk-lang"); if (s === "pl" || s === "en") return s; } catch (e) {}
    return CFG.defaultLang === "en" ? "en" : "pl";
  })();
  var params = new URLSearchParams(location.search);
  var MAP_STYLES = ["neon", "noir", "night", "day", "blueprint"];
  var number = (params.get("p") || params.get("n") || "").replace(/[^0-9A-Za-z]/g, "");
  var isDemo = number.toLowerCase() === "demo";
  // the menu: snusshop.pl/menu (or ?menu for testing)
  var isMenu = !number && (params.has("menu") || /^\/menu\/?$/.test(location.pathname));
  var MENU_URL = location.origin + "/menu";
  var statusDict = {};
  var lastData = null;
  var timer = null;

  // Extra features live in extras.js. It only loads when switched on in config.js (extras: true)
  // or when previewing with ?preview=1, so customers download nothing extra until then.
  var PREVIEW = params.get("preview") === "1";
  var EXTRAS = PREVIEW || CFG.extras === true ||
    (!!CFG.extras && typeof CFG.extras === "object" && Object.keys(CFG.extras).some(function (k) { return CFG.extras[k]; }));
  var hookFns = {}, hookLast = {};
  function emit(evt, payload) {
    hookLast[evt] = payload;
    (hookFns[evt] || []).forEach(function (fn) { try { fn(payload); } catch (e) { if (window.console) console.error(e); } });
  }

  function t() { return T[lang]; }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }); // Polish time, like InPost
  }
  function prettyNumber(n) { return n.replace(/(.{4})/g, "$1 ").trim(); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function loadStatuses() {
    var key = "trk-statuses-" + lang;
    try {
      var c = JSON.parse(sessionStorage.getItem(key) || "null");
      if (c) { statusDict = c; return Promise.resolve(); }
    } catch (e) {}
    return fetch(API + "/statuses?lang=" + (lang === "pl" ? "pl_PL" : "en_GB"))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var d = {};
        (j.items || []).forEach(function (i) { d[i.name] = { title: i.title, description: i.description }; });
        statusDict = d;
        try { sessionStorage.setItem(key, JSON.stringify(d)); } catch (e) {}
      })
      .catch(function () { statusDict = {}; });
  }
  function statusText(name) {
    var s = statusDict[name];
    if (s && s.title && s.title.indexOf("translation missing") !== 0) return s;
    return { title: name ? name.replace(/_/g, " ") : "—", description: "" };
  }

  // =====================================================================
  //  MAP
  // =====================================================================
  // The city drawing and the route come from layouts.js; pick one with mapLayout in config.js or ?layout=.
  var LAYOUTS = window.MapLayouts || {};
  var LAYOUT_NAME = (params.get("layout") || CFG.mapLayout || "grid").toLowerCase();
  if (!LAYOUTS[LAYOUT_NAME]) LAYOUT_NAME = "grid";
  var LAYOUT = LAYOUTS[LAYOUT_NAME];
  var CX = 700, CY = 700, ANGLE = LAYOUT.angles[0]; // ANGLE is picked per screen shape in setAngle
  var ROUTE = LAYOUT.route, STOP_VERTEX = LAYOUT.stops;
  var routeLen = [0];
  for (var i = 1; i < ROUTE.length; i++) {
    routeLen.push(routeLen[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]));
  }
  var TOTAL = routeLen[routeLen.length - 1];
  var STOP_DIST = STOP_VERTEX.map(function (v) { return routeLen[v]; });

  function rot(p) {
    var a = ANGLE * Math.PI / 180, dx = p[0] - CX, dy = p[1] - CY;
    return [CX + dx * Math.cos(a) - dy * Math.sin(a), CY + dx * Math.sin(a) + dy * Math.cos(a)];
  }
  function pointAt(d) {
    d = Math.max(0, Math.min(TOTAL, d));
    for (var i = 1; i < ROUTE.length; i++) {
      if (d <= routeLen[i]) {
        var f = (d - routeLen[i - 1]) / ((routeLen[i] - routeLen[i - 1]) || 1);
        return [ROUTE[i - 1][0] + f * (ROUTE[i][0] - ROUTE[i - 1][0]), ROUTE[i - 1][1] + f * (ROUTE[i][1] - ROUTE[i - 1][1])];
      }
    }
    return ROUTE[ROUTE.length - 1];
  }
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5;
      var x = Math.imul(h ^ (h >>> 15), 1 | h);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildCity(seed) {
    var rnd = seeded(seed);
    $("city").innerHTML = "<g>" + LAYOUT.build(rnd, { angle: ANGLE }) + "</g>";

    // route
    var d = "M" + ROUTE.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L");
    $("routeLayer").innerHTML =
      '<path class="route-glow" d="' + d + '"/>' +
      '<path class="route-todo" d="' + d + '"/>' +
      '<path id="routeDone" class="route-done" d="' + d + '" stroke-dasharray="0 ' + (TOTAL + 50) + '"/>';

    // decorative points of interest, like a game map
    var poiLayer = $("poiLayer");
    poiLayer.innerHTML = "";
    var kinds = ["coffee", "tree", "bag", "star", "gym", "music"];
    var colors = ["#4ee08a", "#5ef2ff", "#b06cff", "#ff8a3d", "#ff4f7a", "#58c8ff"];
    var placed = 0, tries = 0, pois = [];
    var maxPois = LAYOUT.pois == null ? 18 : LAYOUT.pois;
    var tryLimit = maxPois * 40;
    while (placed < maxPois && tries++ < tryLimit) {
      var pt = LAYOUT.randPoint(rnd), px = pt[0], py = pt[1];
      if (LAYOUT.isWater(px, py) || LAYOUT.isWater(px + 40, py) || LAYOUT.isWater(px - 40, py) || LAYOUT.isWater(px, py + 40) || LAYOUT.isWater(px, py - 40)) continue;
      var near = false;
      for (var q = 0; q <= 40; q++) { var rp = pointAt(TOTAL * q / 40); if (Math.hypot(rp[0] - px, rp[1] - py) < 110) { near = true; break; } }
      for (q = 0; q < pois.length && !near; q++) if (Math.hypot(pois[q][0] - px, pois[q][1] - py) < 140) near = true;
      if (near) continue;
      pois.push([px, py]);
      var k = Math.floor(rnd() * kinds.length);
      var g = el("g", { "class": "marker poi", "data-x": px, "data-y": py }, poiLayer);
      drawPin(g, colors[k], ICONS[kinds[k]], 0.72);
      placed++;
    }
  }

  var ICONS = {
    warehouse: "M3 11l9-6 9 6v9H3z M7 20v-6h10v6 M7 17h10",
    sort: "M4 8h13l-3-3 M20 16H7l3 3",
    depot: "M5 20V5h14v15 M9 9h2 M13 9h2 M9 13h2 M13 13h2 M10 20v-3h4v3",
    home: "M3 11l9-7 9 7 M6 9.5V20h12V9.5 M10 20v-5h4v5",
    locker: "M5 3h14v18H5z M12 3v18 M5 9h7 M5 15h7 M12 12h7",
    coffee: "M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z M16 10h2a2 2 0 0 1 0 4h-2 M8 4v2 M12 4v2",
    tree: "M12 3l6 10H6z M12 13v7",
    bag: "M5 8h14l-1 12H6z M9 8a3 3 0 0 1 6 0",
    star: "M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9-4.3-4.1 5.9-.8z",
    gym: "M3 12h18 M6 7v10 M18 7v10 M3 9v6 M21 9v6",
    music: "M9 18V6l10-2v12 M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0"
  };

  // Teardrop pin, drawn in screen pixels with its tip at (0,0).
  function drawPin(g, color, icon, size) {
    var s = el("g", { transform: "scale(" + size + ")", "class": "pin-body", style: "color:" + color }, g);
    el("circle", { "class": "ring", cx: 0, cy: -27, r: 18 }, s);
    el("path", { d: "M0 0C-4-10-15-16-15-27a15 15 0 1 1 30 0C15-16 4-10 0 0z", fill: color, stroke: "rgba(0,0,0,.35)", "stroke-width": 1.5 }, s);
    el("path", { d: icon, transform: "translate(-9 -36) scale(.75)", fill: "none", stroke: "#fff", "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" }, s);
    return s;
  }
  function drawLabel(g, text, y) {
    var w = Math.round(text.length * 6.3 + 18);
    var lg = el("g", { "class": "pin-label", transform: "translate(0 " + y + ")" }, g);
    el("rect", { x: -w / 2, y: -11, width: w, height: 22, rx: 11 }, lg);
    var tx = el("text", { x: 0, y: 4, "text-anchor": "middle" }, lg);
    tx.textContent = text;
    return lg;
  }

  var STOP_COLORS = ["#ff8a3d", "#b06cff", "#58c8ff", "#4ee08a"];
  function buildPins(dest) {
    var layer = $("pinLayer"), labels = $("labelLayer");
    layer.innerHTML = ""; labels.innerHTML = "";
    var x = t();
    var names = x.pins.concat([x.destPin[dest]]);
    var icons = [ICONS.warehouse, ICONS.sort, ICONS.depot, dest === "locker" ? ICONS.locker : ICONS.home];
    STOP_VERTEX.forEach(function (v, idx) {
      var p = ROUTE[v];
      var g = el("g", { "class": "marker pin", id: "stop" + idx, "data-x": p[0], "data-y": p[1] }, layer);
      drawPin(g, STOP_COLORS[idx], icons[idx], idx === 3 ? 1.35 : 1.1);
      // names live in a layer above the rider so they are never covered
      drawLabel(el("g", { "class": "marker", "data-x": p[0], "data-y": p[1] }, labels), names[idx], 18);
    });
  }

  // Branded rider sprite, drawn in screen pixels with the wheels on the route point.
  var MOPED_SVG =
    '<ellipse class="moped-pulse" rx="42" ry="12"/>' +
    '<ellipse class="rider-shadow" rx="34" ry="6"/>' +
    '<g class="mp-bob">' +
      '<image href="assets/rider.webp" x="-44" y="-82" width="88" height="84" filter="url(#riderGlow)"/>' +
    '</g>';

  function buildMoped() {
    var layer = $("mopedLayer");
    layer.innerHTML = "";
    var g = el("g", { "class": "marker", id: "moped", "data-x": 0, "data-y": 0 }, layer);
    g.innerHTML = MOPED_SVG;
    var tag = drawLabel(g, t().tag, -96);
    tag.setAttribute("class", "mp-tag");
    tag.id = "mopedTag";
  }

  // ---------- camera ----------
  var cam = { x: 0, y: 0, w: 1000, h: 1000 }, camTarget = null, follow = false;
  var shown = { d: 0, ox: 0 }, want = { d: 0, ox: 0 };
  var PAD = { top: 96, bottom: 128, side: 90 };

  function fitBox(minX, minY, maxX, maxY) {
    var wrap = $("mapWrap"), W = wrap.clientWidth || 1, H = wrap.clientHeight || 1;
    var aw = Math.max(50, W - PAD.side * 2), ah = Math.max(50, H - PAD.top - PAD.bottom);
    var k = Math.max((maxX - minX) / aw, (maxY - minY) / ah);
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return { x: cx - k * W / 2, y: cy - k * (PAD.top + ah / 2), w: k * W, h: k * H };
  }
  function routeView() {
    var xs = [], ys = [];
    ROUTE.forEach(function (p) { var r = rot(p); xs.push(r[0]); ys.push(r[1]); });
    return fitBox(Math.min.apply(0, xs) - 20, Math.min.apply(0, ys) - 60, Math.max.apply(0, xs) + 20, Math.max.apply(0, ys) + 40);
  }
  function followView() {
    var p = rot(pointAt(shown.d));
    return fitBox(p[0] - 260, p[1] - 200, p[0] + 260, p[1] + 200);
  }
  // Camera modes: "follow" the moped, show the whole "route", or "free" after the user moves the map.
  var mode = "route";
  function setMode(m) {
    if (m !== "free") endGesture();
    mode = m;
    follow = m === "follow";
    $("btnFollow").classList.toggle("on", m === "follow");
    $("btnFit").classList.toggle("on", m === "route");
    camTarget = m === "follow" ? followView() : m === "route" ? routeView() : camTarget;
  }
  function setFollow(on) { setMode(on ? "follow" : "route"); }

  // Keep the camera over the city and within sensible zoom levels.
  function mapSize() { var w = $("mapWrap"); return [w.clientWidth || 1, w.clientHeight || 1]; }
  function clampBox(b) {
    var sz = mapSize(), rv = routeView();
    var minW = sz[0] * 0.3, maxW = rv.w * 2.8; // zoom out far enough to see the whole island
    var w = Math.max(minW, Math.min(maxW, b.w)), h = w * sz[1] / sz[0];
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    var rcx = rv.x + rv.w / 2, rcy = rv.y + rv.h / 2, slackX = rv.w * 1.25, slackY = rv.h * 1.25;
    cx = Math.max(rcx - slackX, Math.min(rcx + slackX, cx));
    cy = Math.max(rcy - slackY, Math.min(rcy + slackY, cy));
    return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
  }
  // Zoom by factor f (>1 = closer) keeping screen point (px, py) fixed.
  function zoomBox(b, f, px, py) {
    var sz = mapSize(), unit = b.w / sz[0];
    var wx = b.x + px * unit, wy = b.y + py * unit;
    var w = b.w / f, u2 = w / sz[0];
    return { x: wx - px * u2, y: wy - py * u2, w: w, h: w * sz[1] / sz[0] };
  }
  // While a finger or mouse is moving the map, slide the already-drawn picture with a CSS
  // transform (cheap, done by the graphics chip) and only redraw the city when the gesture ends.
  var gesture = null, gestureTimer = null;
  function moveCam(box) {
    if (!gesture) { setMode("free"); camTarget = null; gesture = { start: Object.assign({}, cam), cur: Object.assign({}, cam) }; }
    gesture.cur = clampBox(box);
    var u = gesture.cur.w / mapSize()[0], k = gesture.start.w / gesture.cur.w;
    $("map").style.transform = "translate(" + ((gesture.start.x - gesture.cur.x) / u) + "px," + ((gesture.start.y - gesture.cur.y) / u) + "px) scale(" + k + ")";
  }
  function endGesture() {
    clearTimeout(gestureTimer);
    if (!gesture) return;
    cam = gesture.cur;
    gesture = null;
    writeFrame();                     // redraw at the new position, then drop the temporary slide
    $("map").style.transform = "";
  }
  function liveCam() { return gesture ? gesture.cur : cam; }
  function zoomButton(f) {          // animated, for the +/- buttons
    endGesture();
    var base = camTarget || cam, sz = mapSize();
    setMode("free");
    camTarget = clampBox(zoomBox(base, f, sz[0] / 2, sz[1] / 2));
  }

  var rafOn = false, last = {};
  function tick() {
    // ease moped along the route
    shown.d += (want.d - shown.d) * 0.06;
    shown.ox += (want.ox - shown.ox) * 0.08;
    if (Math.abs(want.d - shown.d) < 0.3) shown.d = want.d;
    if (Math.abs(want.ox - shown.ox) < 0.1) shown.ox = want.ox;
    if (follow) camTarget = followView();
    if (camTarget) {
      var done = true;
      ["x", "y", "w", "h"].forEach(function (k) {
        cam[k] += (camTarget[k] - cam[k]) * 0.08;
        if (Math.abs(camTarget[k] - cam[k]) > 0.05) done = false;
      });
      if (done && !follow) { cam = camTarget; camTarget = null; }
    }
    // Only touch the DOM when something actually moved, so an idle map costs nothing.
    var W = $("mapWrap").clientWidth || 1;
    if (cam.x !== last.x || cam.y !== last.y || cam.w !== last.w || cam.h !== last.h ||
        shown.d !== last.d || shown.ox !== last.ox || W !== last.W || ANGLE !== last.A || last.dirty) writeFrame();
    requestAnimationFrame(tick);
  }
  function writeFrame() {
    var W = $("mapWrap").clientWidth || 1;
    last = { x: cam.x, y: cam.y, w: cam.w, h: cam.h, d: shown.d, ox: shown.ox, W: W, A: ANGLE };
    $("map").setAttribute("viewBox", cam.x + " " + cam.y + " " + cam.w + " " + cam.h);
    var unit = cam.w / W;
    // decorative pins fade out when zoomed out further than the whole-route view
    $("mapWrap").classList.toggle("far", unit > routeUnit * 1.35);
    // The rider always faces right so the logo on the box stays readable.
    // while driving, stop the rider a little short of the next pin so the pin stays visible
    var d = shown.d;
    if (nextStop > 0) d = Math.max(STOP_DIST[nextStop - 1], Math.min(d, STOP_DIST[nextStop] - 95 * unit));
    var raw = pointAt(d);
    var m = $("moped");
    m.setAttribute("data-x", raw[0]);
    m.setAttribute("data-y", raw[1]);
    document.querySelectorAll("#map .marker").forEach(function (g) {
      var p = rot([+g.getAttribute("data-x"), +g.getAttribute("data-y")]);
      if (g === m) p[0] += shown.ox * unit;
      g.setAttribute("transform", "translate(" + p[0] + " " + p[1] + ") scale(" + unit + ")");
    });
    $("routeDone").setAttribute("stroke-dasharray", d + " " + (TOTAL + 50));
  }
  function redraw() { last.dirty = true; }
  var routeUnit = 1;
  function measureRouteUnit() { routeUnit = routeView().w / mapSize()[0]; }

  // ---------- map gestures ----------
  // Mouse: drag to pan, wheel to zoom, double-click to zoom in.
  // Touch: two fingers pan and pinch-zoom; one finger keeps scrolling the page (with a hint).
  function setupGestures() {
    var wrap = $("mapWrap"), svg = $("map");
    function local(e) { var r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    var drag = null;
    svg.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      drag = { p: local(e), box: Object.assign({}, liveCam()) };
      wrap.classList.add("dragging");
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!drag) return;
      var p = local(e), unit = drag.box.w / mapSize()[0];
      moveCam({ x: drag.box.x - (p[0] - drag.p[0]) * unit, y: drag.box.y - (p[1] - drag.p[1]) * unit, w: drag.box.w, h: drag.box.h });
    });
    window.addEventListener("mouseup", function () { if (drag) endGesture(); drag = null; wrap.classList.remove("dragging"); });
    svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var p = local(e);
      moveCam(zoomBox(liveCam(), Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0015)), p[0], p[1]));
      clearTimeout(gestureTimer);
      gestureTimer = setTimeout(endGesture, 160);
    }, { passive: false });
    svg.addEventListener("dblclick", function (e) {
      var p = local(e);
      endGesture();
      setMode("free");
      camTarget = clampBox(zoomBox(cam, 1.8, p[0], p[1]));
    });

    var pinch = null, hintTimer = null, oneStart = null;
    function mid(t) { var r = wrap.getBoundingClientRect(); return [(t[0].clientX + t[1].clientX) / 2 - r.left, (t[0].clientY + t[1].clientY) / 2 - r.top]; }
    function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
    function hideHint() { clearTimeout(hintTimer); wrap.classList.remove("show-hint"); }
    svg.addEventListener("touchstart", function (e) {
      if (e.touches.length >= 2) hideHint();     // they've got it: two fingers are down
      if (e.touches.length === 2) {
        pinch = { m: mid(e.touches), d: dist(e.touches), box: Object.assign({}, liveCam()) };
        e.preventDefault();
      } else if (e.touches.length === 1) {
        oneStart = [e.touches[0].clientX, e.touches[0].clientY];
      }
    }, { passive: false });
    svg.addEventListener("touchmove", function (e) {
      if (e.touches.length === 2 && pinch) {
        e.preventDefault();
        hideHint();
        var m = mid(e.touches), f = dist(e.touches) / pinch.d, b = pinch.box;
        var z = zoomBox(b, f, pinch.m[0], pinch.m[1]);           // zoom around where the pinch started
        var unit = z.w / mapSize()[0];
        moveCam({ x: z.x - (m[0] - pinch.m[0]) * unit, y: z.y - (m[1] - pinch.m[1]) * unit, w: z.w, h: z.h });
      } else if (e.touches.length === 1 && oneStart && !pinch) {
        var dx = e.touches[0].clientX - oneStart[0], dy = e.touches[0].clientY - oneStart[1];
        if (Math.hypot(dx, dy) > 12) {
          wrap.classList.add("show-hint");
          clearTimeout(hintTimer);
          hintTimer = setTimeout(hideHint, 1200);
          oneStart = null;
        }
      }
    }, { passive: false });
    svg.addEventListener("touchend", function (e) { if (e.touches.length < 2) { if (pinch) endGesture(); pinch = null; } });

    $("btnZoomIn").addEventListener("click", function () { zoomButton(1.6); });
    $("btnZoomOut").addEventListener("click", function () { zoomButton(1 / 1.6); });
  }

  var mapReady = false;
  // Pick the rotation (from the layout's candidates) that shows the route biggest on this screen.
  function bestAngle() {
    var sz = mapSize(), aw = Math.max(50, sz[0] - PAD.side * 2), ah = Math.max(50, sz[1] - PAD.top - PAD.bottom);
    var best = LAYOUT.angles[0], bestScore = Infinity, keep = ANGLE;
    LAYOUT.angles.forEach(function (cand) {
      ANGLE = cand;
      var xs = [], ys = [];
      ROUTE.forEach(function (p) { var r = rot(p); xs.push(r[0]); ys.push(r[1]); });
      var k = Math.max((Math.max.apply(0, xs) - Math.min.apply(0, xs) + 40) / aw, (Math.max.apply(0, ys) - Math.min.apply(0, ys) + 100) / ah);
      var score = k * (1 + Math.abs(cand - LAYOUT.angles[0]) / 300);
      if (score < bestScore) { bestScore = score; best = cand; }
    });
    ANGLE = keep;
    return best;
  }
  function setAngle() {
    var next = bestAngle(), changed = next !== ANGLE;
    ANGLE = next;
    var tf = "rotate(" + ANGLE + " " + CX + " " + CY + ")";
    $("city").setAttribute("transform", tf);
    $("routeLayer").setAttribute("transform", tf);
    if (changed && mapReady && LAYOUT.dependsOnAngle) buildCity(number || "x"); // 3D buildings lean "up" the screen
  }
  function initMap(dest) {
    if (!mapReady) {
      ANGLE = bestAngle();
      measureRouteUnit();
      buildCity(number || "x");
      setAngle();
      mapReady = true;
      $("mapWrap").dataset.layout = LAYOUT_NAME;
    }
    buildPins(dest);
    buildMoped();
    redraw();
    if (!rafOn) {
      rafOn = true;
      var rv = routeView();
      cam = { x: rv.x - rv.w * 0.15, y: rv.y - rv.h * 0.15, w: rv.w * 1.3, h: rv.h * 1.3 };
      setFollow(false);
      setupGestures();
      requestAnimationFrame(tick);
    }
  }

  // =====================================================================
  //  RENDER
  // =====================================================================
  var placement = null; // {key, since}
  var nextStop = -1;     // index of the stop the rider is driving towards, or -1 when parked
  function applyStaticText() {
    var x = t();
    document.documentElement.lang = lang;
    $("langBtn").textContent = lang === "pl" ? "EN" : "PL";
    setText("brandName", CFG.brandName);
    setText("lblStatus", x.status); setText("lblNumber", x.number); setText("lblUpdated", x.updated);
    setText("lblDest", x.dest); setText("lblHistory", x.history); setText("lblSource", x.source); setText("lblChecked", x.checked);
    setText("lblApprox", x.approx); setText("lblRefresh", x.refresh); setText("lblHint", x.hint);
    setText("lblShopTitle", x.shopTitle); setText("igNote", x.igNote);
    setText("lblBasket", x.basket); setText("lblBasketCta", x.seeBasket); setText("igLabel", x.send); setText("basketClear", x.clear);
    $("qtyMinus").setAttribute("aria-label", x.less); $("qtyPlus").setAttribute("aria-label", x.more); $("basketClose").setAttribute("aria-label", x.close);
    if (shopList.length) updateAddState(); else setText("lblAdd", x.add);
    Array.prototype.forEach.call(document.querySelectorAll(".sold-sticker"), function (s2) { s2.textContent = x.soldOut; });
    renderBasket();
    ["gTitle", "gText", "gS1", "gS2", "gS3", "gCopy", "gDone"].forEach(function (k) { setText(k, x[k]); });
    setText("gPasteLbl", x.gPaste); setText("gPh", x.gPh); setText("gOpenLbl", x.gOpen); $("gClose").setAttribute("aria-label", x.close);
    $("carPrev").setAttribute("aria-label", x.prev); $("carNext").setAttribute("aria-label", x.next);
    updateOrderButton();
    if ($("shopFilters").children.length) buildFilters();
    $("btnZoomIn").setAttribute("aria-label", x.zoomIn); $("btnZoomOut").setAttribute("aria-label", x.zoomOut); setText("lblFollow", x.follow); setText("lblFit", x.fit);
    setText("destMap", x.map);
    setText("mkTitle", x.mkTitle); setText("mkText", x.mkText); setText("mkBtn", x.mkBtn); setText("mkCopy", x.mkCopy);
    setText("mkOpen", x.mkOpen); setText("mkDemo", x.mkDemo); $("mkInput").placeholder = x.mkPh;
    setText("menuTitle", x.menuTitle); setText("menuText", x.menuText); setText("lblMenuBtn", x.menuBtn); setText("lblMenuCopy", x.menuCopy);
  }

  // Where along the route the moped should be right now.
  function updateMopedTarget() {
    if (!placement) return;
    var key = placement.key, idx = +key.slice(-1);
    if (key.indexOf("mov") === 0) {
      var hours = (Date.now() - placement.since) / 3600e3;
      var f = 0.06 + 0.86 * (1 - Math.exp(-1.5 * hours / LEG_HOURS[idx]));
      if (placement.stopped) f = Math.min(f, 0.5);
      want.d = STOP_DIST[idx] + f * (STOP_DIST[idx + 1] - STOP_DIST[idx]);
      nextStop = idx + 1;
      want.ox = 0;
    } else {
      want.d = STOP_DIST[idx];
      nextStop = -1;
      want.ox = 66; // park next to the pin rather than on top of it
    }
  }

  function render(data) {
    var first = !lastData;
    lastData = data;
    var x = t();
    var details = (data.tracking_details || []).slice().sort(function (a, b) { return new Date(b.datetime) - new Date(a.datetime); });
    var current = data.status || (details[0] && details[0].status) || "created";
    var problem = PROBLEM.test(current);
    var delivered = current === "delivered";

    // most recent event we can place on the map
    var key = POS[current], since = details[0] ? new Date(details[0].datetime).getTime() : Date.now();
    if (!key) {
      for (var i = 0; i < details.length; i++) {
        if (POS[details[i].status]) { key = POS[details[i].status]; since = new Date(details[i].datetime).getTime(); break; }
      }
    }
    key = key || "at0";
    var idx = +key.slice(-1), moving = key.indexOf("mov") === 0;

    var attrs = data.custom_attributes || {};
    var machine = attrs.target_machine_detail;
    var dest = machine || /locker|paczkomat/i.test(data.service || data.type || "") ? "locker" : "home";

    show("trackView");
    initMap(dest);
    placement = { key: key, since: since, stopped: problem };
    if (first) { shown.d = moving ? STOP_DIST[idx] : Math.max(0, STOP_DIST[idx] - 60); }
    updateMopedTarget();

    var wrap = $("mapWrap");
    wrap.dataset.state = problem ? "problem" : delivered ? "done" : moving ? "riding" : "parked";
    $("mopedTag").style.display = moving ? "" : "none";

    // pins: done / target
    for (var s = 0; s < 4; s++) {
      var pin = $("stop" + s);
      pin.classList.toggle("done", s < idx || (s === idx && !moving));
      pin.classList.toggle("target", !delivered && !problem && (moving ? s === idx + 1 : s === idx));
    }

    // step bar
    var route = $("route");
    route.innerHTML = "";
    route.classList.toggle("problem", problem);
    x.steps.forEach(function (label, s) {
      var li = document.createElement("li");
      li.textContent = typeof label === "string" ? label : label[dest];
      var cls = [];
      if (s <= idx) cls.push("done");
      if (!moving && s === idx) cls.push("current");
      if (moving && s === idx + 1) cls.push(problem ? "current" : "leg");
      li.className = cls.join(" ");
      route.appendChild(li);
    });

    // HUD
    var hudKey = problem ? "problem" : delivered ? "delivered" : key === "at3" ? "at3" + dest : key;
    setText("hudHead", x.hud[hudKey]);
    var st = statusText(current);
    setText("hudSub", st.title + (details[0] ? " · " + fmtDate(details[0].datetime) : ""));
    var icon = $("hudIcon");
    if (moving && !problem) icon.innerHTML = '<img src="assets/rider.webp" alt="">';
    else icon.textContent = problem ? "⚠️" : delivered ? "✅" : ["🏭", "🔀", "📍", dest === "locker" ? "📦" : "🏠"][idx];

    // status card — InPost's own wording
    setText("statusTitle", st.title);
    setText("statusDesc", st.description);
    setText("trkNumber", prettyNumber(data.tracking_number || number));
    var upd = details[0] ? details[0].datetime : data.updated_at;
    setText("trkUpdated", fmtDate(upd));
    $("factUpdated").hidden = !upd;

    if (machine) {
      $("dest").hidden = false;
      setText("destName", machine.name || attrs.target_machine_id || "");
      var a = machine.address || {};
      setText("destAddr", [a.line1, a.line2].filter(Boolean).join(", "));
      setText("destDesc", machine.location_description || "");
      setText("destHours", machine.opening_hours ? x.hours + machine.opening_hours : "");
      var loc = machine.location;
      if (loc && loc.latitude && loc.longitude) {
        $("destMap").href = "https://www.google.com/maps/search/?api=1&query=" + loc.latitude + "," + loc.longitude;
        $("destMap").hidden = false;
      } else $("destMap").hidden = true;
    } else {
      $("dest").hidden = true;
    }

    $("shopCard").hidden = !(CFG.products && CFG.products.length);
    renderBasket();

    var ol = $("history");
    ol.innerHTML = "";
    details.forEach(function (d) {
      var s2 = statusText(d.status);
      var li = document.createElement("li");
      var time = document.createElement("div"); time.className = "h-time"; time.textContent = fmtDate(d.datetime);
      var title = document.createElement("div"); title.className = "h-title"; title.textContent = s2.title;
      li.appendChild(time); li.appendChild(title);
      if (s2.description) { var desc = document.createElement("div"); desc.className = "h-desc"; desc.textContent = s2.description; li.appendChild(desc); }
      ol.appendChild(li);
    });

    var finished = delivered || /^(returned_to_sender|canceled)$/.test(current);
    $("liveChip").classList.toggle("stale", finished);
    setText("lblLive", finished ? x.done : x.live);
    setText("checkedAt", new Date().toLocaleTimeString(lang === "pl" ? "pl-PL" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }));
    document.title = st.title + " · " + CFG.brandName;
    emit("render", { data: data, first: first, current: current, details: details, delivered: delivered, problem: problem,
                     key: key, idx: idx, moving: moving, dest: dest, machine: machine, finished: finished, title: st.title });
    return finished;
  }

  function showError(kind) {
    var x = t();
    setText("errTitle", x.errTitle);
    setText("errText", kind === "notfound" ? x.errNotFound : kind === "bad" ? x.errBad : x.errNet);
    show("errorView");
  }
  function show(id) {
    ["trackView", "errorView", "makeView", "menuView"].forEach(function (v) { $(v).hidden = v !== id; });
  }

  // ---------- data ----------
  // The first tracking request starts right away, alongside the status wording, instead of after it.
  var prefetched = null;
  function fetchTracking() {
    if (prefetched) { var p = prefetched; prefetched = null; return p; }
    if (isDemo) return Promise.resolve(demoData(demoStep));
    return fetch(API + "/tracking/" + encodeURIComponent(number), { cache: "no-store" }).then(function (r) {
      if (r.status === 404) { var e = new Error("notfound"); e.kind = "notfound"; throw e; }
      if (!r.ok) throw new Error("net");
      return r.json();
    });
  }
  // Resolves true when fresh data came back from InPost, false otherwise.
  function refresh() {
    clearTimeout(timer);
    return fetchTracking()
      .then(function (data) { if (!render(data)) schedule(); return true; })
      .catch(function (e) {
        if (lastData && e.kind !== "notfound") render(lastData);
        else showError(e.kind || "net");
        schedule();
        return false;
      });
  }

  // "Refresh" button next to the last-update time: ask InPost right now.
  $("refreshBtn").addEventListener("click", function () {
    var btn = this;
    if (btn.disabled) return;
    btn.disabled = true;
    btn.className = "refresh-btn spinning";
    setText("lblRefresh", t().refreshing);
    var minSpin = new Promise(function (r) { setTimeout(r, 700); });
    Promise.all([refresh(), minSpin]).then(function (res) {
      btn.className = "refresh-btn " + (res[0] ? "ok" : "err");
      setText("lblRefresh", res[0] ? t().refreshed : t().refreshFail);
      setTimeout(function () {
        btn.className = "refresh-btn";
        btn.disabled = false;
        setText("lblRefresh", t().refresh);
      }, 2000);
    });
  });
  function schedule() { timer = setTimeout(refresh, Math.max(15, CFG.refreshSeconds) * 1000); }

  // ---------- demo ----------
  var DEMO_FLOW = ["confirmed", "dispatched_by_sender", "adopted_at_source_branch", "adopted_at_sorting_center",
    "sent_from_sorting_center", "adopted_at_target_branch", "out_for_delivery", "ready_to_pickup", "delivered"];
  var DEMO_STEPS = [0, 1, 3, 4, 5, 6, 7, 8];
  var demoStep = 5;
  function demoData(step, problem) {
    var upto = DEMO_STEPS[step];
    var now = Date.now();
    var details = DEMO_FLOW.slice(0, upto + 1).map(function (s, i) {
      return { status: s, datetime: new Date(now - (2 + (upto - i) * 3) * 3600e3).toISOString() };
    });
    var status = DEMO_FLOW[upto];
    if (problem) { status = "undelivered_wrong_address"; details.push({ status: status, datetime: new Date(now - 600e3).toISOString() }); }
    return {
      tracking_number: "680000000000000000000000",
      service: "inpost_locker_standard",
      status: status,
      custom_attributes: {
        target_machine_id: "WAW01M",
        target_machine_detail: {
          name: "WAW01M", opening_hours: "24/7", location_description: "Przy sklepie spożywczym",
          address: { line1: "ul. Przykładowa 1", line2: "00-001 Warszawa" },
          location: { latitude: 52.2297, longitude: 21.0122 }
        }
      },
      tracking_details: details
    };
  }
  function buildDemoBar() {
    var bar = document.createElement("div");
    bar.className = "card small demo-bar";
    bar.id = "demoBar";
    var label = document.createElement("span");
    label.className = "muted";
    label.textContent = t().demo + " ";
    bar.appendChild(label);
    ["🏭", "🛵", "🔀", "🛵", "📍", "🛵", "📦", "✅", "⚠️"].forEach(function (e, i) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = e; b.className = "chip-btn";
      b.onclick = function () {
        if (i === 8) { render(demoData(5, true)); return; }
        demoStep = i; render(demoData(i));
      };
      bar.appendChild(b);
    });
    $("app").insertBefore(bar, $("trackView"));
  }

  // ---------- flavour carousel + Instagram order button ----------
  var activeProduct = 0, shopFilter = "all", shopList = [], scrollLock = 0;
  function lineOf(p) { return (CFG.lines || {})[p.line] || { name: "", short: "", strength: "" }; }
  function productTitle(p) { var l = lineOf(p); return (l.name ? l.name + " – " : "") + p.name; }

  function setupShop() {
    var car = $("carousel"), raf = 0;
    // the card nearest the middle of the strip becomes the active one while swiping
    car.addEventListener("scroll", function () {
      cancelAnimationFrame(raf);
      if (Date.now() < scrollLock) return; // our own animated scroll, not a swipe
      raf = requestAnimationFrame(function () {
        var mid = car.scrollLeft + car.clientWidth / 2, best = 0, bestD = Infinity;
        Array.prototype.forEach.call(car.children, function (c, i) {
          var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (best !== activeProduct) selectProduct(best, false);
      });
    });
    $("carPrev").addEventListener("click", function () { selectProduct(Math.max(0, activeProduct - 1), true); });
    $("carNext").addEventListener("click", function () { selectProduct(Math.min(shopList.length - 1, activeProduct + 1), true); });
    $("igBtn").href = "https://ig.me/m/" + encodeURIComponent(CFG.instagram);
    setupBasket();
    buildFilters();
    buildShop();
  }

  function buildFilters() {
    var box = $("shopFilters"), lines = CFG.lines || {}, used = {};
    (CFG.products || []).forEach(function (p) { used[p.line] = true; });
    var keys = Object.keys(lines).filter(function (k) { return used[k]; });
    box.innerHTML = "";
    if (keys.length < 2) { box.hidden = true; return; }
    box.hidden = false;
    ["all"].concat(keys).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "filter-chip" + (k === shopFilter ? " on" : "");
      b.textContent = k === "all" ? t().all : lines[k].name;
      b.addEventListener("click", function () {
        shopFilter = k;
        Array.prototype.forEach.call(box.children, function (c) { c.classList.toggle("on", c === b); });
        buildShop();
      });
      box.appendChild(b);
    });
  }

  function drawTin(p) {
    var l = lineOf(p);
    var tin = document.createElement("div");
    tin.className = "tin" + (p.name.length > 14 ? " tin-long" : ""); // long names get smaller text
    tin.style.setProperty("--rim", l.rim || "#d9d9de");
    tin.style.setProperty("--tint", p.color || "#555");
    [["tin-brand", l.short || l.name], ["tin-emoji", p.emoji || ""], ["tin-flavour", p.name], ["tin-mg", l.strength]].forEach(function (part) {
      if (!part[1]) return;
      var e = document.createElement("span");
      e.className = part[0]; e.textContent = part[1];
      tin.appendChild(e);
    });
    return tin;
  }

  function buildShop() {
    shopList = (CFG.products || []).filter(function (p) { return shopFilter === "all" || p.line === shopFilter; });
    // sold-out flavours stay visible (with a sticker) but move to the end so the menu opens on something in stock
    shopList = shopList.filter(function (p) { return !p.soldOut; }).concat(shopList.filter(function (p) { return p.soldOut; }));
    var car = $("carousel"), dots = $("carDots");
    car.innerHTML = ""; dots.innerHTML = "";
    car.classList.toggle("single", shopList.length === 1);
    shopList.forEach(function (p, i) {
      var l = lineOf(p);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "flavour";
      var art = document.createElement("div");
      art.className = "flavour-img";
      if (p.image) {
        var img = document.createElement("img");
        img.src = p.image; img.alt = productTitle(p); img.loading = "lazy";
        art.appendChild(img);
      } else {
        art.appendChild(drawTin(p));
      }
      var name = document.createElement("div"); name.className = "flavour-name"; name.textContent = p.name;
      var note = document.createElement("div"); note.className = "flavour-note";
      note.textContent = [l.name, l.strength].filter(Boolean).join(" · ");
      var badge = document.createElement("span"); badge.className = "in-basket"; badge.setAttribute("data-slug", slugOf(p));
      card.appendChild(badge);
      if (p.soldOut) {
        card.classList.add("sold-out");
        var sticker = document.createElement("span"); sticker.className = "sold-sticker"; sticker.textContent = t().soldOut;
        card.appendChild(sticker);
      }
      card.appendChild(art); card.appendChild(name); card.appendChild(note);
      card.addEventListener("click", function () { selectProduct(i, true); });
      car.appendChild(card);
      if (shopList.length > 1 && shopList.length <= 12) {
        var dot = document.createElement("button");
        dot.type = "button"; dot.setAttribute("aria-label", productTitle(p));
        dot.addEventListener("click", function () { selectProduct(i, true); });
        dots.appendChild(dot);
      }
    });
    $("carPrev").parentNode.hidden = shopList.length < 2;
    setText("shopCount", shopList.length > 1 ? (activeProduct + 1) + " / " + shopList.length : "");
    car.scrollLeft = 0;
    activeProduct = 0;
    selectProduct(0, false);
    renderBasket();
  }
  function selectProduct(i, scroll) {
    var car = $("carousel"), cards = car.children;
    if (!cards.length) return;
    activeProduct = i;
    Array.prototype.forEach.call(cards, function (c, k) { c.classList.toggle("active", k === i); });
    Array.prototype.forEach.call($("carDots").children, function (d, k) { d.classList.toggle("on", k === i); });
    $("carPrev").disabled = i === 0;
    $("carNext").disabled = i === cards.length - 1;
    if (shopList.length > 1) setText("shopCount", (i + 1) + " / " + shopList.length);
    if (scroll) {
      scrollLock = Date.now() + 700;
      car.scrollTo({ left: cards[i].offsetLeft - (car.clientWidth - cards[i].offsetWidth) / 2 });
    }
    updateOrderButton();
  }
  function currentProduct() { return shopList[activeProduct]; }
  function updateOrderButton() { setQty(1); }   // each newly picked flavour starts at 1
  // a sold-out flavour can be looked at but not added
  function updateAddState() {
    var p = currentProduct(), out = !!(p && p.soldOut);
    $("addBtn").disabled = out;
    $("qtyPlus").disabled = out;
    $("qtyMinus").disabled = out || pickQty <= 1;
    setText("lblAdd", out ? t().soldOut : t().add);
    $("addBtn").classList.toggle("is-sold-out", out);
  }
  function orderMessageFor(p) {
    var x = t(), l = p ? lineOf(p) : {};
    var what = p ? productTitle(p) + (l.strength ? " (" + l.strength + ")" : "") : "";
    var msg = x.orderMsg.replace("{product}", what);
    if (number && !isDemo) msg += "\n" + x.orderRef.replace("{number}", prettyNumber(number));
    return msg;
  }
  // Instagram can't pre-fill a DM, so copy the message and open the chat; the customer just pastes it.
  function copyText(text) {
    var done = false;
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      done = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) {}
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(function () {});
    return done;
  }
  // ---------- basket ----------
  // Saved on the customer's phone so it survives closing the page. Items: [{ slug, qty }].
  var BASKET_KEY = "snus-basket", basket = [], pickQty = 1;
  function productBySlug(slug) {
    var list = CFG.products || [];
    for (var i = 0; i < list.length; i++) if (slugOf(list[i]) === slug) return list[i];
    return null;
  }
  function loadBasket() {
    try { basket = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]"); } catch (e) { basket = []; }
    // drop flavours no longer on the menu or sold out, so they can't be ordered
    basket = basket.filter(function (it) { var p = it && productBySlug(it.slug); return p && !p.soldOut && it.qty > 0; });
  }
  function saveBasket() { try { localStorage.setItem(BASKET_KEY, JSON.stringify(basket)); } catch (e) {} }
  function basketCount() { return basket.reduce(function (n, it) { return n + it.qty; }, 0); }
  function plFlavours(n) {
    if (lang !== "pl") return n + (n === 1 ? " flavour" : " flavours");
    var last = n % 10, teen = n % 100 >= 12 && n % 100 <= 14;
    return n + (n === 1 ? " smak" : last >= 2 && last <= 4 && !teen ? " smaki" : " smaków");
  }
  function setQty(q) { pickQty = Math.max(1, Math.min(99, q)); setText("qtyVal", pickQty); updateAddState(); }
  function changeItem(slug, delta) {
    for (var i = 0; i < basket.length; i++) if (basket[i].slug === slug) {
      basket[i].qty = Math.min(99, basket[i].qty + delta);
      if (basket[i].qty <= 0) basket.splice(i, 1);
      break;
    }
    saveBasket(); renderBasket();
  }
  function addToBasket() {
    var p = currentProduct();
    if (!p || p.soldOut) return;
    var slug = slugOf(p), found = false;
    basket.forEach(function (it) { if (it.slug === slug) { it.qty = Math.min(99, it.qty + pickQty); found = true; } });
    if (!found) basket.push({ slug: slug, qty: pickQty });
    saveBasket(); renderBasket();
    toast(t().added.replace("{q}", pickQty).replace("{product}", p.name));
    var bar = $("basketBar");
    bar.classList.remove("bump"); void bar.offsetWidth; bar.classList.add("bump");
    setQty(1);
  }
  function basketMessage() {
    var x = t();
    var lines = [x.basketHead];
    basket.forEach(function (it) {
      var p = productBySlug(it.slug), l = lineOf(p);
      if (!p || p.soldOut) return;
      lines.push("• " + it.qty + "× " + productTitle(p) + (l.strength ? " (" + l.strength + ")" : ""));
    });
    lines.push(x.basketTotal.replace("{n}", basketCount()));
    if (number && !isDemo) lines.push(x.orderRef.replace("{number}", prettyNumber(number)));
    return lines.join("\n");
  }
  function renderBasket() {
    if (!$("basketBar")) return;
    var x = t(), n = basketCount(), shopShown = !$("shopCard").hidden;
    // bar
    $("basketBar").hidden = !n || !shopShown;
    document.body.classList.toggle("has-basket", !!n && shopShown);
    setText("basketSummary", n + " " + x.pcs + " · " + plFlavours(basket.length));
    // badges on the flavour cards
    Array.prototype.forEach.call(document.querySelectorAll("#carousel .in-basket"), function (b) {
      var q = 0;
      basket.forEach(function (it) { if (it.slug === b.getAttribute("data-slug")) q = it.qty; });
      b.textContent = q ? "×" + q : "";
      b.hidden = !q;
    });
    // panel
    var ul = $("basketList");
    ul.innerHTML = "";
    basket.forEach(function (it) {
      var p = productBySlug(it.slug), l = lineOf(p);
      var li = document.createElement("li"); li.className = "basket-item";
      var art = document.createElement("div"); art.className = "basket-art"; art.appendChild(p.image ? Object.assign(document.createElement("img"), { src: p.image, alt: "" }) : drawTin(p));
      var txt = document.createElement("div"); txt.className = "basket-txt";
      var nm = document.createElement("div"); nm.className = "basket-name"; nm.textContent = p.name;
      var sub = document.createElement("div"); sub.className = "muted small"; sub.textContent = [l.name, l.strength].filter(Boolean).join(" · ");
      txt.appendChild(nm); txt.appendChild(sub);
      var q = document.createElement("div"); q.className = "qty qty-sm";
      var minus = document.createElement("button"); minus.type = "button"; minus.textContent = it.qty > 1 ? "−" : "✕";
      minus.setAttribute("aria-label", it.qty > 1 ? x.less : x.remove);
      minus.addEventListener("click", function () { changeItem(it.slug, -1); });
      var val = document.createElement("span"); val.textContent = it.qty;
      var plus = document.createElement("button"); plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", x.more);
      plus.addEventListener("click", function () { changeItem(it.slug, 1); });
      q.appendChild(minus); q.appendChild(val); q.appendChild(plus);
      li.appendChild(art); li.appendChild(txt); li.appendChild(q);
      ul.appendChild(li);
    });
    setText("basketTotal", x.total.replace("{n}", n));
    if (!n) closeBasket();
  }
  function openBasket() { if (!basket.length) return; $("basketSheet").hidden = false; document.body.classList.add("sheet-open"); }
  function closeBasket() { $("basketSheet").hidden = true; document.body.classList.remove("sheet-open"); }
  // ---------- "order copied" guide ----------
  // Instagram can't pre-fill a DM. Copy the order, explain the 3 taps, then open the chat.
  var guideMsg = "", guideFromBasket = false;
  function startOrder(message, fromBasket) {
    guideMsg = message; guideFromBasket = !!fromBasket;
    copyText(message);
    $("gMsg").textContent = message;
    $("gDone").hidden = !fromBasket;
    $("gOpen").href = "https://ig.me/m/" + encodeURIComponent(CFG.instagram);
    closeBasket();
    if ($("toast")) $("toast").classList.remove("show");   // don't cover the guide
    $("guide").hidden = false;
    document.body.classList.add("sheet-open");
  }
  function closeGuide() { $("guide").hidden = true; document.body.classList.remove("sheet-open"); }
  function setupGuide() {
    $("gClose").addEventListener("click", closeGuide);
    $("gOpen").addEventListener("click", function () { copyText(guideMsg); });   // copy once more right before leaving
    $("gCopy").addEventListener("click", function () { copyText(guideMsg); toast(t().gRecopied); });
    $("gDone").addEventListener("click", function () { basket = []; saveBasket(); renderBasket(); closeGuide(); toast(t().cleared); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("guide").hidden) closeGuide(); });
  }

  function setupBasket() {
    loadBasket();
    saveBasket();      // store the cleaned basket (sold-out / removed flavours gone)
    $("qtyMinus").addEventListener("click", function () { setQty(pickQty - 1); });
    $("qtyPlus").addEventListener("click", function () { setQty(pickQty + 1); });
    $("addBtn").addEventListener("click", addToBasket);
    $("basketOpen").addEventListener("click", openBasket);
    $("basketClose").addEventListener("click", closeBasket);
    $("basketBackdrop").addEventListener("click", closeBasket);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeBasket(); });
    $("basketClear").addEventListener("click", function () { basket = []; saveBasket(); renderBasket(); toast(t().cleared); });
    // Instagram can't pre-fill a DM: copy the whole order and open the chat; the customer pastes it.
    $("igBtn").addEventListener("click", function (e) {
      e.preventDefault();
      if (window.va) window.va("event", { name: "Instagram order", data: { items: basket.length, pieces: basketCount() } });
      startOrder(basketMessage(), true);
    });
    setupGuide();
    window.addEventListener("storage", function (e) { if (e.key === BASKET_KEY) { loadBasket(); renderBasket(); } });   // other open tabs
    setQty(1);
    renderBasket();
  }
  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3500);
  }

  // ---------- menu page ----------
  function setupMenu() {
    show("menuView");
    Array.prototype.forEach.call(document.querySelectorAll("#menuView img[data-src]"), function (img) { img.src = img.getAttribute("data-src"); });
    var shop = $("shopCard");
    $("menuView").appendChild(shop);         // same flavour section as on the tracking page
    shop.hidden = false;
    setupShop();
    renderBasket();
    document.title = t().menuTitle + " · " + CFG.brandName;
  }

  // ---------- link maker ----------
  function setupMaker() {
    $("mkMenuCopy").addEventListener("click", function () {
      copyText(MENU_URL);
      toast(t().menuCopied);
    });
    show("makeView");
    emit("makerReady", {});
    Array.prototype.forEach.call(document.querySelectorAll("#makeView img[data-src]"), function (img) { img.src = img.getAttribute("data-src"); });
    $("mkForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = $("mkInput").value.replace(/[^0-9A-Za-z]/g, "");
      if (!n) return;
      var made = { number: n, url: location.origin + location.pathname + "?p=" + n };
      emit("makeLink", made);                 // extras can add the flavour / remember the link
      var url = made.url;
      $("mkLink").value = url;
      $("mkOpen").href = url;
      $("mkOut").hidden = false;
    });
    $("mkCopy").addEventListener("click", function () {
      var v = $("mkLink").value;
      var done = function () { setText("mkCopy", t().mkCopied); setTimeout(function () { setText("mkCopy", t().mkCopy); }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function () { $("mkLink").select(); });
      else { $("mkLink").select(); document.execCommand("copy"); done(); }
    });
  }

  // ---------- hooks for extras.js ----------
  function slugOf(p) { return (p.line + "-" + p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  window.SnusTrack = {
    on: function (evt, fn) { (hookFns[evt] = hookFns[evt] || []).push(fn); if (hookLast[evt]) fn(hookLast[evt]); },
    CFG: CFG, API: API, params: params, number: number, isDemo: isDemo, preview: PREVIEW,
    t: function () { return t(); }, lang: function () { return lang; },
    fmtDate: fmtDate, prettyNumber: prettyNumber, statusText: statusText, loadStatuses: loadStatuses,
    toast: function (m) { toast(m); }, copyText: copyText,
    products: function () { return CFG.products || []; }, slugOf: slugOf, productTitle: productTitle, lineOf: lineOf, drawTin: drawTin,
    orderMessageFor: orderMessageFor, startOrder: function (msg) { startOrder(msg, false); },
    igUrl: function () { return "https://ig.me/m/" + encodeURIComponent(CFG.instagram); },
    selectProductBySlug: function (slug) {
      var list = CFG.products || [], found = -1;
      for (var i = 0; i < list.length; i++) if (slugOf(list[i]) === slug) found = i;
      if (found < 0) return null;
      shopFilter = "all"; buildFilters(); buildShop();
      selectProduct(shopList.indexOf(list[found]), true);
      return list[found];
    },
    baseMapStyle: function () { return baseStyle; },
    setMapStyle: function (name) { if (MAP_STYLES.indexOf(name) >= 0) $("mapWrap").dataset.map = name; }
  };
  // Visitor stats (Vercel Web Analytics) — switch on in the Vercel dashboard first, then set analytics: true.
  if (CFG.analytics) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var va = document.createElement("script");
    va.defer = true; va.src = "/_vercel/insights/script.js";
    document.head.appendChild(va);
  }
  if (EXTRAS) {
    var xs = document.createElement("script");
    xs.src = "extras.js";
    document.head.appendChild(xs);
  }

  // ---------- boot ----------
  $("langBtn").addEventListener("click", function () {
    lang = lang === "pl" ? "en" : "pl";
    try { sessionStorage.setItem("trk-lang", lang); } catch (e) {}
    applyStaticText();
    if (!number) return;
    loadStatuses().then(function () { if (lastData) render(lastData); else refresh(); });
  });
  $("btnFollow").addEventListener("click", function () { setFollow(true); });
  $("btnFit").addEventListener("click", function () { setFollow(false); });
  window.addEventListener("resize", function () {
    if (!mapReady) return;
    setAngle();
    measureRouteUnit();
    if (mode === "free") cam = clampBox(cam); else camTarget = follow ? followView() : routeView();
    redraw();
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && number && !isDemo) refresh();
  });
  setInterval(updateMopedTarget, 5000); // keep creeping closer between InPost updates

  var mapStyle = (params.get("map") || CFG.mapStyle || "neon").toLowerCase();
  var baseStyle = MAP_STYLES.indexOf(mapStyle) >= 0 ? mapStyle : "neon";
  $("mapWrap").dataset.map = baseStyle;
  // Optional route colour on top of the map style: "red", "cyan", "gold", "green" or "white".
  var ROUTE_COLORS = { red: "#ff4d4d", cyan: "#4fd8ff", gold: "#ffc857", green: "#3ee08a", white: "#ffffff" };
  var routeColor = ROUTE_COLORS[(params.get("route") || CFG.routeColor || "").toLowerCase()];
  if (routeColor) ["--r-done", "--r-todo", "--r-glow"].forEach(function (v) { $("mapWrap").style.setProperty(v, routeColor); });

  applyStaticText();
  if (isMenu) { setupMenu(); return; }
  if (!number) { setupMaker(); return; }
  if (number.length < 6 && !isDemo) { showError("bad"); return; }
  if (isDemo) buildDemoBar();
  setupShop();
  if (!isDemo) { prefetched = fetchTracking(); prefetched.catch(function () {}); }
  loadStatuses().then(refresh);
})();
