(function () {
  "use strict";

  var CFG = Object.assign({ brandName: "Snus Express", boxLabel: "SNUS", refreshSeconds: 60, defaultLang: "pl" }, window.TRACK_CONFIG || {});
  var API = "https://api-shipx-pl.easypack24.net/v1";

  // ---------- UI text ----------
  var T = {
    pl: {
      status: "Status", live: "Na żywo", paused: "Wstrzymano", number: "Numer przesyłki", updated: "Ostatnia aktualizacja",
      dest: "Miejsce odbioru", history: "Historia przesyłki", source: "Dane na żywo z InPost", checked: "sprawdzono",
      map: "Mapa ↗", hours: "Godziny otwarcia: ",
      stages: ["Przygotowana", "Nadana", "W drodze", "W doręczeniu", "Gotowe"],
      bubbles: {
        waiting: "Pakujemy i czekamy na kuriera…", riding: "Jadę do Ciebie! 🛵", fast: "Już prawie u Ciebie! 💨",
        arrived: "Dojechałem — czekam na Ciebie! 📦", done: "Dostarczone. Smacznego! ✅", problem: "Mamy mały postój…"
      },
      lastStage: { locker: "Do odbioru", home: "Doręczona" },
      errTitle: "Jeszcze nie ruszyliśmy", errNotFound: "InPost nie ma jeszcze informacji o tej przesyłce. Zwykle pojawiają się kilka godzin po nadaniu — strona sama się odświeży.",
      errNet: "Nie udało się połączyć z InPost. Spróbujemy ponownie za chwilę.", errBad: "Ten link wygląda na niepełny. Poproś sprzedawcę o nowy.",
      mkTitle: "Utwórz link śledzenia", mkText: "Wklej numer przesyłki InPost. Otrzymasz link, który możesz wysłać klientowi.",
      mkBtn: "Utwórz link", mkCopy: "Kopiuj", mkCopied: "Skopiowano!", mkOpen: "Podgląd ↗", mkDemo: "Chcesz zobaczyć, jak to wygląda?",
      mkPh: "np. 6800 1234 5678 9012 3456 7890", demo: "Tryb demo — kliknij etap:"
    },
    en: {
      status: "Status", live: "Live", paused: "Paused", number: "Tracking number", updated: "Last update",
      dest: "Pickup point", history: "Parcel history", source: "Live data from InPost", checked: "checked",
      map: "Map ↗", hours: "Opening hours: ",
      stages: ["Prepared", "Sent", "On the way", "Out for delivery", "Ready"],
      bubbles: {
        waiting: "Packing up, waiting for the courier…", riding: "On my way to you! 🛵", fast: "Almost there! 💨",
        arrived: "Arrived — waiting for you! 📦", done: "Delivered. Enjoy! ✅", problem: "Quick pit stop…"
      },
      lastStage: { locker: "Ready to collect", home: "Delivered" },
      errTitle: "Not on the road yet", errNotFound: "InPost has no information about this parcel yet. It usually appears a few hours after it is sent — this page refreshes by itself.",
      errNet: "Couldn't reach InPost. Trying again shortly.", errBad: "This link looks incomplete. Ask the seller for a new one.",
      mkTitle: "Create a tracking link", mkText: "Paste an InPost tracking number to get a link you can send to the customer.",
      mkBtn: "Create link", mkCopy: "Copy", mkCopied: "Copied!", mkOpen: "Preview ↗", mkDemo: "Want to see what it looks like?",
      mkPh: "e.g. 6800 1234 5678 9012 3456 7890", demo: "Demo mode — tap a stage:"
    }
  };

  // ---------- InPost status -> stage on the route ----------
  // 0 prepared, 1 sent, 2 on the way, 3 out for delivery, 4 ready/delivered
  var STAGE = {
    created: 0, offers_prepared: 0, offer_selected: 0, confirmed: 0,
    dispatched_by_sender: 1, dispatched_by_sender_to_pok: 1, collected_from_sender: 1, taken_by_courier: 1, taken_by_courier_from_pok: 1,
    adopted_at_source_branch: 2, sent_from_source_branch: 2, adopted_at_sorting_center: 2, sent_from_sorting_center: 2,
    adopted_at_target_branch: 2, redirect_to_box: 2, canceled_redirect_to_box: 2, readdressed: 2, delay_in_delivery: 2,
    unstack_from_customer_service_point: 2, unstack_from_box_machine: 2,
    out_for_delivery: 3, out_for_delivery_to_address: 3, pickup_reminder_sent_address: 3,
    ready_to_pickup: 4, ready_to_pickup_from_pok: 4, ready_to_pickup_from_pok_registered: 4, pickup_reminder_sent: 4,
    stack_in_box_machine: 4, stack_in_customer_service_point: 4, courier_avizo_in_customer_service_point: 4, ready_to_pickup_from_branch: 4,
    delivered: 4
  };
  var PROBLEM = /^(pickup_time_expired|avizo|claimed|returned_to_sender|canceled|rejected_by_receiver|undelivered.*|missing|oversized|stack_.*expired|taken_by_courier_from_customer_service_point|return_pickup_confirmation_to_sender)$/;

  // ---------- helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  var lang = (function () {
    try { var s = localStorage.getItem("trk-lang"); if (s === "pl" || s === "en") return s; } catch (e) {}
    return CFG.defaultLang === "en" ? "en" : "pl";
  })();
  var params = new URLSearchParams(location.search);
  var number = (params.get("p") || params.get("n") || "").replace(/[^0-9A-Za-z]/g, "");
  var statusDict = {};      // name -> {title, description} in current language
  var lastData = null;
  var timer = null;
  var demoStep = 4;

  function t() { return T[lang]; }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  }
  function prettyNumber(n) { return n.replace(/(.{4})/g, "$1 ").trim(); }

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

  // ---------- rendering ----------
  function applyStaticText() {
    var x = t();
    document.documentElement.lang = lang;
    $("langBtn").textContent = lang === "pl" ? "EN" : "PL";
    setText("brandName", CFG.brandName);
    setText("tinLabel", CFG.boxLabel);
    setText("shopLabel", CFG.boxLabel);
    setText("lblStatus", x.status); setText("lblNumber", x.number); setText("lblUpdated", x.updated);
    setText("lblDest", x.dest); setText("lblHistory", x.history); setText("lblSource", x.source); setText("lblChecked", x.checked);
    setText("destMap", x.map);
    setText("mkTitle", x.mkTitle); setText("mkText", x.mkText); setText("mkBtn", x.mkBtn); setText("mkCopy", x.mkCopy);
    setText("mkOpen", x.mkOpen); setText("mkDemo", x.mkDemo); $("mkInput").placeholder = x.mkPh;
  }

  function sceneState(stage, problem, delivered) {
    if (problem) return "problem";
    if (delivered) return "done";
    return ["waiting", "riding", "riding", "fast", "arrived"][stage];
  }

  // On narrow screens the scene is cropped at the sides, so pull the props inwards.
  function placeProps(state) {
    var scene = $("scene");
    var narrow = scene.clientWidth / Math.max(1, scene.clientHeight) < 2.4;
    var pos = narrow
      ? { shop: 150, waiting: 300, riding: 300, arrived: 290, locker: 480, home: 500 }
      : { shop: 70, waiting: 230, riding: 300, arrived: 340, locker: 560, home: 590 };
    var x = state === "waiting" ? pos.waiting : (state === "arrived" || state === "done") ? pos.arrived : pos.riding;
    $("moped").setAttribute("transform", "translate(" + x + " 150)");
    document.querySelector(".prop-shop").setAttribute("transform", "translate(" + pos.shop + " 214)");
    document.querySelector(".prop-locker").setAttribute("transform", "translate(" + pos.locker + " 214)");
    document.querySelector(".prop-home").setAttribute("transform", "translate(" + pos.home + " 214)");
  }
  window.addEventListener("resize", function () { var st = $("scene").dataset.state; if (st && lastData) placeProps(st); });

  function render(data) {
    lastData = data;
    var x = t();
    var details = (data.tracking_details || []).slice().sort(function (a, b) { return new Date(b.datetime) - new Date(a.datetime); });
    var current = data.status || (details[0] && details[0].status) || "created";

    // stage = furthest known stage from the history, so odd statuses don't jump backwards
    var stage = STAGE[current];
    if (stage === undefined) {
      stage = 0;
      details.forEach(function (d) { if (STAGE[d.status] > stage) stage = STAGE[d.status]; });
    }
    var problem = PROBLEM.test(current);
    var delivered = current === "delivered";

    var attrs = data.custom_attributes || {};
    var machine = attrs.target_machine_detail;
    var dest = machine || /locker|paczkomat/i.test(data.service || data.type || "") ? "locker" : "home";

    // scene
    var scene = $("scene");
    var state = sceneState(stage, problem, delivered);
    scene.dataset.state = state;
    scene.dataset.dest = dest;
    placeProps(state);
    setText("sceneBubble", x.bubbles[state]);

    // route
    var labels = x.stages.slice();
    labels[4] = x.lastStage[dest];
    var route = $("route");
    route.innerHTML = "";
    route.classList.toggle("problem", problem);
    labels.forEach(function (label, i) {
      var li = document.createElement("li");
      li.textContent = label;
      if (i < stage || (i === stage && delivered)) li.className = "done";
      if (i === stage) {
        li.className = delivered ? "done current" : "current";
        var m = document.createElement("span");
        m.className = "mini";
        m.textContent = problem ? "⚠️" : (i === 4 ? "📦" : "🛵");
        li.appendChild(m);
      }
      route.appendChild(li);
    });

    // status card — InPost's own wording
    var s = statusText(current);
    setText("statusTitle", s.title);
    setText("statusDesc", s.description);
    setText("trkNumber", prettyNumber(data.tracking_number || number));
    var upd = details[0] ? details[0].datetime : data.updated_at;
    setText("trkUpdated", fmtDate(upd));
    $("factUpdated").hidden = !upd;

    // destination
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

    // history — every event InPost lists, newest first
    var ol = $("history");
    ol.innerHTML = "";
    details.forEach(function (d) {
      var st = statusText(d.status);
      var li = document.createElement("li");
      var time = document.createElement("div"); time.className = "h-time"; time.textContent = fmtDate(d.datetime);
      var title = document.createElement("div"); title.className = "h-title"; title.textContent = st.title;
      li.appendChild(time); li.appendChild(title);
      if (st.description) { var desc = document.createElement("div"); desc.className = "h-desc"; desc.textContent = st.description; li.appendChild(desc); }
      ol.appendChild(li);
    });

    var finished = delivered || /^(returned_to_sender|canceled)$/.test(current);
    var live = $("liveDot");
    live.classList.toggle("stale", finished);
    setText("lblLive", finished ? "✓" : x.live);
    setText("checkedAt", new Date().toLocaleTimeString(lang === "pl" ? "pl-PL" : "en-GB", { hour: "2-digit", minute: "2-digit" }));
    document.title = s.title + " · " + CFG.brandName;

    show("trackView");
    return finished;
  }

  function showError(kind) {
    var x = t();
    setText("errTitle", x.errTitle);
    setText("errText", kind === "notfound" ? x.errNotFound : kind === "bad" ? x.errBad : x.errNet);
    show("errorView");
  }

  function show(id) {
    ["trackView", "errorView", "makeView"].forEach(function (v) { $(v).hidden = v !== id; });
  }

  // ---------- data ----------
  function fetchTracking() {
    if (number.toLowerCase() === "demo") return Promise.resolve(demoData(demoStep));
    return fetch(API + "/tracking/" + encodeURIComponent(number), { cache: "no-store" }).then(function (r) {
      if (r.status === 404) { var e = new Error("notfound"); e.kind = "notfound"; throw e; }
      if (!r.ok) throw new Error("net");
      return r.json();
    });
  }

  function refresh() {
    clearTimeout(timer);
    fetchTracking()
      .then(function (data) {
        var finished = render(data);
        if (!finished) schedule();
      })
      .catch(function (e) {
        if (lastData && e.kind !== "notfound") render(lastData); // keep showing what we had
        else showError(e.kind || "net");
        schedule();
      });
  }
  function schedule() {
    timer = setTimeout(refresh, Math.max(15, CFG.refreshSeconds) * 1000);
  }

  // ---------- demo ----------
  var DEMO_FLOW = ["confirmed", "dispatched_by_sender", "adopted_at_source_branch", "sent_from_source_branch",
    "adopted_at_sorting_center", "sent_from_sorting_center", "adopted_at_target_branch", "out_for_delivery", "ready_to_pickup", "delivered"];
  var DEMO_STEPS = [0, 1, 4, 7, 8, 9];
  function demoData(step) {
    var upto = DEMO_STEPS[step];
    var now = Date.now();
    var details = DEMO_FLOW.slice(0, upto + 1).map(function (s, i) {
      return { status: s, datetime: new Date(now - (upto - i) * 3.1 * 3600e3).toISOString() };
    });
    return {
      tracking_number: "680000000000000000000000",
      service: "inpost_locker_standard",
      status: DEMO_FLOW[upto],
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
    bar.className = "card small";
    bar.id = "demoBar";
    var label = document.createElement("span");
    label.className = "muted";
    label.textContent = t().demo + " ";
    bar.appendChild(label);
    ["📦", "🚚", "🏭", "🛵", "🔒", "✅", "⚠️"].forEach(function (e, i) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = e; b.className = "lang"; b.style.margin = "4px";
      b.onclick = function () {
        if (i === 6) { var d = demoData(3); d.status = "undelivered_wrong_address"; d.tracking_details.push({ status: d.status, datetime: new Date(Date.now() + 60e3).toISOString() }); render(d); return; }
        demoStep = i; render(demoData(i));
      };
      bar.appendChild(b);
    });
    $("app").insertBefore(bar, $("trackView"));
  }

  // ---------- link maker ----------
  function setupMaker() {
    show("makeView");
    $("mkForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = $("mkInput").value.replace(/[^0-9A-Za-z]/g, "");
      if (!n) return;
      var url = location.origin + location.pathname + "?p=" + n;
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

  // ---------- boot ----------
  $("langBtn").addEventListener("click", function () {
    lang = lang === "pl" ? "en" : "pl";
    try { localStorage.setItem("trk-lang", lang); } catch (e) {}
    applyStaticText();
    if (!number) return;
    loadStatuses().then(function () { if (lastData) render(lastData); else refresh(); });
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && number && number.toLowerCase() !== "demo") refresh();
  });

  applyStaticText();
  if (!number) { setupMaker(); return; }
  if (number.length < 6 && number.toLowerCase() !== "demo") { showError("bad"); return; }
  if (number.toLowerCase() === "demo") buildDemoBar();
  loadStatuses().then(refresh);
})();
