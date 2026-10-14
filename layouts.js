// Map layouts for the tracking page. Each layout draws its own city and defines the
// delivery route: route = road polyline, stops = indices of the 4 stops on it
// (warehouse, sorting hub, depot, customer). Everything is in map units around (700, 700).
//
//   angles       candidate map rotations; the page picks the one that fits the screen best,
//                preferring the first
//   build(rnd, ctx)  returns SVG markup for the city (ctx.angle = current rotation in degrees)
//   isWater(x,y) used to keep decorative pins out of the water
//   randPoint(rnd)   a random spot for a decorative pin
//   dependsOnAngle   true when the drawing changes with rotation (3D buildings)
//   pois         how many decorative pins to scatter (default 18)
//   routeDots    draw a small dot at every turn of the route
(function () {
  "use strict";
  var CX = 700, CY = 700;

  function pts(list) { return list.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }
  function pathD(list) { return "M" + list.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L"); }
  function water(list) { var p = pts(list); return '<polygon class="water" points="' + p + '"/><polygon class="water-edge" points="' + p + '"/>'; }

  // Draws a bridge wherever a road polyline runs over water (spans longer than maxSpan are skipped).
  function bridges(line, isWater, maxSpan) {
    var out = [], run = [];
    function flush() {
      if (run.length > 1) {
        var span = Math.hypot(run[run.length - 1][0] - run[0][0], run[run.length - 1][1] - run[0][1]);
        if (span <= maxSpan) {
          var d = pathD(run);
          out.push('<path class="bridge-edge" d="' + d + '"/><path class="bridge-deck" d="' + d + '"/>');
        }
      }
      run = [];
    }
    for (var i = 1; i < line.length; i++) {
      var a = line[i - 1], b = line[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
      for (var k = 0; k <= n; k++) {
        var p = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n];
        if (isWater(p[0], p[1])) {
          if (!run.length) run.push([p[0] - (b[0] - a[0]) / n * 4, p[1] - (b[1] - a[1]) / n * 4]);
          run.push(p);
        } else if (run.length) { run.push([p[0] + (b[0] - a[0]) / n * 3, p[1] + (b[1] - a[1]) / n * 3]); flush(); }
      }
    }
    flush();
    return out.join("");
  }

  // Convex hull (monotone chain) — the silhouette of a 3D building.
  function hull(p) {
    p = p.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }

  // ===================================================================
  //  GRID — avenues, a river and an island coast (the original map)
  // ===================================================================
  var GRID = 44, AVE = 132;
  function riverX(y) { return 820 + 55 * Math.sin(y / 190); }
  function coastX(y) { return -180 + 40 * Math.sin(y / 150); }
  function southY(x) { return 1560 + 40 * Math.sin(x / 170); }
  function eastX(y) { return 1660 + 45 * Math.sin(y / 160); }
  function northY(x) { return -520 + 35 * Math.sin(x / 140); }
  function gridWater(x, y) {
    return Math.abs(x - riverX(y)) < 62 || x < coastX(y) || y > southY(x) || x > eastX(y) || y < northY(x);
  }
  function gridParks(rnd) {
    var parks = [[5, 1, 3, 3]];
    for (var p = 0; p < 7; p++) parks.push([Math.floor(rnd() * 34) - 6, Math.floor(rnd() * 34) - 6, 1 + Math.floor(rnd() * 3), 1 + Math.floor(rnd() * 3)]);
    return parks;
  }
  function inPark(parks, i, j) {
    for (var k = 0; k < parks.length; k++) {
      var q = parks[k];
      if (i >= q[0] * 3 && i < (q[0] + q[2]) * 3 && j >= q[1] * 3 && j < (q[1] + q[3]) * 3) return true;
    }
    return false;
  }
  function gridGround(rnd, parks, out) {
    out.push('<rect class="land" x="-800" y="-800" width="3000" height="3000"/>');
    for (var a = -6; a <= 16; a++) {
      out.push('<line class="avenue" x1="' + a * AVE + '" y1="-800" x2="' + a * AVE + '" y2="2200"/>');
      out.push('<line class="avenue" x1="-800" y1="' + a * AVE + '" x2="2200" y2="' + a * AVE + '"/>');
    }
    parks.forEach(function (q) {
      out.push('<rect class="park" x="' + (q[0] * AVE + 4) + '" y="' + (q[1] * AVE + 4) + '" width="' + (q[2] * AVE - 8) + '" height="' + (q[3] * AVE - 8) + '" rx="6"/>');
      for (var n = 0; n < q[2] * q[3] * 9; n++) {
        out.push('<circle class="tree" cx="' + (q[0] * AVE + 12 + rnd() * (q[2] * AVE - 24)).toFixed(0) + '" cy="' + (q[1] * AVE + 12 + rnd() * (q[3] * AVE - 24)).toFixed(0) + '" r="' + (4 + rnd() * 6).toFixed(1) + '"/>');
      }
    });
  }
  function gridWaterShapes(out) {
    var L = [], R = [], yy, xx;
    for (yy = -900; yy <= 2300; yy += 20) { L.push([riverX(yy) - 62, yy]); R.unshift([riverX(yy) + 62, yy]); }
    var west = [[-3000, -900]], south = [[-900, 3000]], east = [[3000, -900]], north = [[-900, -3000]];
    for (yy = -900; yy <= 2300; yy += 20) { west.push([coastX(yy), yy]); east.push([eastX(yy), yy]); }
    for (xx = -900; xx <= 2300; xx += 20) { south.push([xx, southY(xx)]); north.push([xx, northY(xx)]); }
    west.push([-3000, 2300]); south.push([2300, 3000]); east.push([3000, 2300]); north.push([2300, -3000]);
    [L.concat(R), west, south, east, north].forEach(function (w) { out.push(water(w)); });
    [264, 660, 1188].forEach(function (by) {
      out.push(bridges([[riverX(by) - 120, by], [riverX(by) + 120, by]], gridWater, 400));
    });
  }
  // Each city block split into 1, 2 or 4 buildings.
  function gridBuildings(rnd, parks, each, splitMore) {
    var gap = 7;
    for (var i = -14; i < 40; i++) {
      for (var j = -14; j < 40; j++) {
        var x = i * GRID, y = j * GRID, cxm = x + GRID / 2;
        if (inPark(parks, i, j)) continue;
        if (Math.abs(cxm - riverX(y + GRID / 2)) < 62 + GRID / 2) continue;
        if (x < coastX(y) || y + GRID > southY(cxm) || x + GRID > eastX(y + GRID / 2) || y < northY(cxm)) continue;
        var bx = x + gap / 2, by = y + gap / 2, s = GRID - gap, r = rnd();
        if (r < 0.35) each(bx, by, s, s);
        else if (r < 0.7 || !splitMore) {
          var w = Math.round(s * (0.35 + rnd() * 0.3));
          each(bx, by, w - 1, s); each(bx + w + 1, by, s - w - 1, s);
        } else {
          var h2 = s / 2;
          each(bx, by, h2 - 1, h2 - 1); each(bx + h2 + 1, by, h2 - 1, h2 - 1);
          each(bx, by + h2 + 1, h2 - 1, h2 - 1); each(bx + h2 + 1, by + h2 + 1, h2 - 1, h2 - 1);
        }
      }
    }
  }
  var CLS = ["b1", "b2", "b3", "b4"];
  var GRID_ROUTE = [[264, 396], [528, 396], [528, 660], [1056, 660], [1188, 660], [1188, 1056]];
  function gridRand(rnd) { return [-300 + rnd() * 1900, -300 + rnd() * 1800]; }

  var grid = {
    route: GRID_ROUTE, stops: [0, 2, 3, 5], angles: [-12, 38],
    isWater: gridWater, randPoint: gridRand,
    build: function (rnd) {
      var out = [], parks = gridParks(rnd);
      gridGround(rnd, parks, out);
      gridBuildings(rnd, parks, function (x, y, w, h) {
        out.push('<rect class="' + CLS[Math.floor(rnd() * 4)] + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>');
      }, true);
      gridWaterShapes(out);
      return out.join("");
    }
  };

  // ===================================================================
  //  CITY 3D — the grid city with raised buildings, taller downtown
  // ===================================================================
  var city3d = {
    route: GRID_ROUTE, stops: [0, 2, 3, 5], angles: [-12, 38], dependsOnAngle: true,
    isWater: gridWater, randPoint: gridRand,
    build: function (rnd, ctx) {
      var out = [], parks = gridParks(rnd), list = [];
      gridGround(rnd, parks, out);
      gridWaterShapes(out);
      var a = ctx.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      // "up" on screen (tilted a little to the right) expressed in map coordinates
      var ux = 0.3 * ca - sa, uy = -0.3 * sa - ca;
      gridBuildings(rnd, parks, function (x, y, w, h) {
        var d = Math.hypot(x - 760, y - 640);
        var H = 8 + rnd() * 14 + Math.max(0, 80 - d / 9) * (0.4 + rnd() * 0.6);
        if (rnd() < 0.03) H += 40 + rnd() * 50;
        var key = (x + w / 2 - CX) * sa + (y + h / 2 - CY) * ca;
        list.push({ x: x, y: y, w: w, h: h, H: H, key: key, cls: CLS[Math.floor(rnd() * 4)] });
      }, false);
      list.sort(function (p, q) { return p.key - q.key; });
      list.forEach(function (b) {
        var base = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
        var roof = base.map(function (p) { return [p[0] + ux * b.H, p[1] + uy * b.H]; });
        out.push('<polygon class="side" points="' + pts(hull(base.concat(roof))) + '"/>');
        out.push('<polygon class="' + b.cls + '" points="' + pts(roof) + '"/>');
      });
      return out.join("");
    }
  };

  // ===================================================================
  //  OLD TOWN — ring roads around a market square, a ring park, a river
  // ===================================================================
  var RINGS = [110, 160, 240, 330, 420, 520, 620, 720, 820, 920, 1020];
  function polar(r, deg) { var a = deg * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; }
  // river running diagonally south-east of the centre
  function rivOff(t) { return 40 * Math.sin(t / 180); }
  function oldWater(x, y) {
    var t = ((x - 825) - (y - 825)) / Math.SQRT2, s = ((x - 825) + (y - 825)) / Math.SQRT2;
    return Math.abs(s - rivOff(t)) < 48;
  }
  function oldRiver() {
    var L = [], R = [];
    for (var t = -1700; t <= 1700; t += 20) {
      var cx = 825 + t / Math.SQRT2, cy = 825 - t / Math.SQRT2, o = rivOff(t);
      L.push([cx + (o - 48) / Math.SQRT2, cy + (o - 48) / Math.SQRT2]);
      R.unshift([cx + (o + 48) / Math.SQRT2, cy + (o + 48) / Math.SQRT2]);
    }
    return L.concat(R);
  }
  // route built along the rings and radial streets
  var oldRoute = (function () {
    var line = [], stops = [], r = 820, a = 200;
    function add() { line.push(polar(r, a)); }
    function stop() { stops.push(line.length - 1); }
    function radialTo(r2) { r = r2; add(); }
    function arcTo(a2) { var step = a2 > a ? 4 : -4; while (Math.abs(a2 - a) > 4) { a += step; add(); } a = a2; add(); }
    add(); stop();                    // warehouse, outskirts
    radialTo(520); arcTo(250); stop(); // sorting hub
    arcTo(300); radialTo(330); stop(); // local depot, just outside the old town
    arcTo(380); radialTo(520); stop(); // customer, across the river
    return { line: line, stops: stops };
  })();
  var oldtown = {
    route: oldRoute.line, stops: oldRoute.stops, angles: [0, 30, -30, 60, -60, 90, -90],
    isWater: oldWater,
    randPoint: function (rnd) { var p = polar(200 + rnd() * 800, rnd() * 360); return p; },
    build: function (rnd) {
      var out = [];
      out.push('<rect class="land" x="-1000" y="-1000" width="3400" height="3400"/>');
      // fields outside the city
      for (var f = 0; f < 60; f++) {
        var fp = polar(1060 + rnd() * 500, rnd() * 360);
        out.push('<rect class="park" opacity=".55" x="' + fp[0].toFixed(0) + '" y="' + fp[1].toFixed(0) + '" width="' + (60 + rnd() * 120).toFixed(0) + '" height="' + (40 + rnd() * 90).toFixed(0) + '" rx="4" transform="rotate(' + (rnd() * 90).toFixed(0) + ' ' + fp[0].toFixed(0) + ' ' + fp[1].toFixed(0) + ')"/>');
      }
      // streets: rings and radials
      var radials = [];
      RINGS.forEach(function (r) { out.push('<circle class="avenue" cx="' + CX + '" cy="' + CY + '" r="' + r + '"/>'); });
      for (var deg = 0; deg < 360; deg += 10) {
        var inner = deg % 20 === 0 ? 160 : 520, line = [polar(inner, deg), polar(1020, deg)];
        out.push('<line class="avenue" x1="' + line[0][0].toFixed(1) + '" y1="' + line[0][1].toFixed(1) + '" x2="' + line[1][0].toFixed(1) + '" y2="' + line[1][1].toFixed(1) + '"/>');
        radials.push(line);
      }
      // a few small parks
      var parkCells = {};
      for (var pk = 0; pk < 5; pk++) parkCells[(3 + Math.floor(rnd() * 6)) + ":" + Math.floor(rnd() * 18)] = true;
      // buildings in each ring segment
      for (var i = 1; i < RINGS.length - 1; i++) {
        var r0 = RINGS[i], r1 = RINGS[i + 1], step = r0 >= 520 ? 10 : 20;
        for (var a0 = 0; a0 < 360; a0 += step) {
          var cellPark = parkCells[i + ":" + Math.floor(a0 / 20)];
          var ri = r0 + 5, ro = r1 - 5, ins = 5 / ((r0 + r1) / 2) * 180 / Math.PI;
          var A0 = a0 + ins, A1 = a0 + step - ins;
          if (cellPark) {
            var poly = [];
            for (var q = 0; q <= 4; q++) poly.push(polar(ri, A0 + (A1 - A0) * q / 4));
            for (q = 4; q >= 0; q--) poly.push(polar(ro, A0 + (A1 - A0) * q / 4));
            out.push('<polygon class="park" points="' + pts(poly) + '"/>');
            for (var tr = 0; tr < 6; tr++) { var tp = polar(ri + 8 + rnd() * (ro - ri - 16), A0 + rnd() * (A1 - A0)); out.push('<circle class="tree" cx="' + tp[0].toFixed(0) + '" cy="' + tp[1].toFixed(0) + '" r="' + (4 + rnd() * 5).toFixed(1) + '"/>'); }
            continue;
          }
          var arc = (r0 + r1) / 2 * (A1 - A0) * Math.PI / 180;
          var na = Math.max(1, Math.round(arc / (34 + rnd() * 26))), nr = rnd() < 0.6 ? 2 : 1;
          for (var u = 0; u < na; u++) {
            for (var v = 0; v < nr; v++) {
              var g = 1.2 / ((r0 + r1) / 2) * 180 / Math.PI;
              var b0 = A0 + (A1 - A0) * u / na + (u ? g : 0), b1 = A0 + (A1 - A0) * (u + 1) / na - (u < na - 1 ? g : 0);
              var q0 = ri + (ro - ri) * v / nr + (v ? 1.2 : 0), q1 = ri + (ro - ri) * (v + 1) / nr - (v < nr - 1 ? 1.2 : 0);
              var mid = polar((q0 + q1) / 2, (b0 + b1) / 2);
              if (oldWater(mid[0], mid[1]) || oldWater(polar(q0, b0)[0], polar(q0, b0)[1]) || oldWater(polar(q1, b1)[0], polar(q1, b1)[1])) continue;
              var shape = [polar(q0, b0), polar(q0, (b0 + b1) / 2), polar(q0, b1), polar(q1, b1), polar(q1, (b0 + b1) / 2), polar(q1, b0)];
              out.push('<polygon class="' + CLS[Math.floor(rnd() * 4)] + '" points="' + pts(shape) + '"/>');
            }
          }
        }
      }
      // ring park around the old town, and the market square with its hall
      out.push('<circle cx="' + CX + '" cy="' + CY + '" r="135" fill="none" class="park-ring"/>');
      for (var t2 = 0; t2 < 70; t2++) { var pp = polar(118 + rnd() * 34, rnd() * 360); out.push('<circle class="tree" cx="' + pp[0].toFixed(0) + '" cy="' + pp[1].toFixed(0) + '" r="' + (3 + rnd() * 4).toFixed(1) + '"/>'); }
      out.push('<circle class="plaza" cx="' + CX + '" cy="' + CY + '" r="104"/>');
      out.push('<rect class="b4" x="' + (CX - 40) + '" y="' + (CY - 13) + '" width="80" height="26" rx="2"/>');
      out.push('<rect class="b2" x="' + (CX + 30) + '" y="' + (CY + 34) + '" width="16" height="16"/>');
      out.push('<rect class="b1" x="' + (CX - 70) + '" y="' + (CY - 60) + '" width="22" height="34"/>');
      // river and bridges (for the route and the radial streets)
      out.push(water(oldRiver()));
      radials.forEach(function (l, n) { if (n % 6 === 0) out.push(bridges(l, oldWater, 160)); }); // a few street bridges
      out.push(bridges(oldRoute.line, oldWater, 400));
      return out.join("");
    }
  };

  // ===================================================================
  //  METRO — a clean transit-map look; the route is the main line
  // ===================================================================
  var METRO_ROUTE = [[200, 300], [420, 300], [620, 500], [940, 500], [1140, 700], [1140, 1000]];
  var METRO_RIVER = [[500, -700], [500, 100], [780, 380], [780, 800], [1000, 1020], [1000, 1900]];
  var METRO_LINES = [
    { color: "#d8b45a", line: [[-400, 700], [300, 700], [500, 900], [1600, 900]] },
    { color: "#e5484d", line: [[350, -400], [350, 520], [640, 810], [640, 1600]] },
    { color: "#4b8bd8", line: [[-400, 150], [900, 150], [1100, 350], [1700, 350]] },
    { color: "#3fae7a", line: [[1320, -400], [1320, 620], [1060, 880], [1060, 1600]] },
    { color: "#a07be0", line: [[-400, 1180], [700, 1180], [880, 1000], [1700, 1000]] }
  ];
  function distSeg(px, py, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    var t = l ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)) : 0;
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
  }
  function metroWater(x, y) {
    for (var i = 1; i < METRO_RIVER.length; i++) if (distSeg(x, y, METRO_RIVER[i - 1], METRO_RIVER[i]) < 46) return true;
    return false;
  }
  var metro = {
    route: METRO_ROUTE, stops: [0, 2, 3, 5], angles: [0, 90, -90, 45, -45], pois: 0,
    isWater: metroWater,
    randPoint: function (rnd) { return [-200 + rnd() * 1700, -200 + rnd() * 1500]; },
    build: function (rnd) {
      var out = [];
      out.push('<defs><pattern id="metroDots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1.6" class="metro-dot"/></pattern></defs>');
      out.push('<rect class="land" x="-1000" y="-1000" width="3400" height="3400"/>');
      out.push('<rect x="-1000" y="-1000" width="3400" height="3400" fill="url(#metroDots)"/>');
      // parks as soft rounded blocks
      [[60, 420, 200, 150], [880, 160, 180, 120], [1180, 1060, 220, 160], [180, 900, 160, 200], [700, 1250, 240, 120]].forEach(function (p) {
        out.push('<rect class="park" x="' + p[0] + '" y="' + p[1] + '" width="' + p[2] + '" height="' + p[3] + '" rx="28"/>');
      });
      // river as a smooth band
      var rd = pathD(METRO_RIVER);
      out.push('<path class="metro-river-edge" d="' + rd + '"/><path class="metro-river" d="' + rd + '"/>');
      // other lines with their stations
      METRO_LINES.forEach(function (m) {
        out.push('<path class="metro-line" stroke="' + m.color + '" d="' + pathD(m.line) + '"/>');
      });
      METRO_LINES.forEach(function (m) {
        for (var i = 1; i < m.line.length; i++) {
          var a = m.line[i - 1], b = m.line[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(len / 150);
          for (var k = 0; k <= n; k++) {
            if (k === 0 && i > 1) continue;
            var p = [a[0] + (b[0] - a[0]) * k / Math.max(1, n), a[1] + (b[1] - a[1]) * k / Math.max(1, n)];
            out.push('<circle class="metro-station" cx="' + p[0].toFixed(0) + '" cy="' + p[1].toFixed(0) + '" r="7"/>');
          }
        }
      });
      return out.join("");
    }
  };

  // ===================================================================
  //  ORGANIC — irregular streets, a winding river, roundabouts and parks
  //  (like a real European city map). The route follows the streets.
  // ===================================================================
  var ORG = (function () {
    var SP = 140, I0 = -6, I1 = 17, J0 = -6, J1 = 17;
    // fixed jitter so the streets (and therefore the route) never change
    var seed = 9137;
    function frand() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var nodes = {};
    for (var i = I0; i <= I1; i++) for (var j = J0; j <= J1; j++) {
      var x = i * SP + 46 * Math.sin(j * 0.55 + i * 0.21) + (frand() - 0.5) * 50;
      var y = j * SP + 40 * Math.sin(i * 0.47 - j * 0.18) + (frand() - 0.5) * 50;
      nodes[i + ":" + j] = [x, y];
    }
    function N(i, j) { return nodes[i + ":" + j]; }
    function riverX(y) { return 900 + 120 * Math.sin(y / 260) + 40 * Math.sin(y / 97); }
    function isWater(x, y) { return Math.abs(x - riverX(y)) < 66; }
    function mainH(j) { return j % 3 === 0; }   // east-west main roads
    function mainV(i) { return i % 3 === 0; }   // north-south main roads
    function edgeWet(a, b) {
      for (var k = 0; k <= 8; k++) if (isWater(a[0] + (b[0] - a[0]) * k / 8, a[1] + (b[1] - a[1]) * k / 8)) return true;
      return false;
    }
    // shortest path over the street grid; main roads are preferred and only they cross the river
    function path(from, to) {
      var dist = {}, prev = {}, done = {}, key0 = from.join(":"), keyT = to.join(":");
      dist[key0] = 0;
      while (true) {
        var best = null, bd = Infinity;
        for (var k in dist) if (!done[k] && dist[k] < bd) { bd = dist[k]; best = k; }
        if (best === null || best === keyT) break;
        done[best] = true;
        var ij = best.split(":").map(Number);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var ni = ij[0] + d[0], nj = ij[1] + d[1];
          if (ni < I0 || ni > I1 || nj < J0 || nj > J1) return;
          var a = N(ij[0], ij[1]), b = N(ni, nj), main = d[0] ? mainH(ij[1]) : mainV(ij[0]);
          if (!main && edgeWet(a, b)) return;
          var w = Math.hypot(b[0] - a[0], b[1] - a[1]) * (main ? 0.7 : 1), nk = ni + ":" + nj;
          if (dist[nk] === undefined || bd + w < dist[nk]) { dist[nk] = bd + w; prev[nk] = best; }
        });
      }
      var out = [], cur = keyT;
      while (cur) { out.unshift(N.apply(null, cur.split(":").map(Number))); cur = prev[cur]; }
      return out;
    }
    var STOPS = [[1, 9], [3, 6], [8, 5], [10, 2]];
    var line = [N(1, 9)], stops = [0];
    for (var s = 1; s < STOPS.length; s++) {
      var seg = path(STOPS[s - 1], STOPS[s]);
      line = line.concat(seg.slice(1));
      stops.push(line.length - 1);
    }
    return { SP: SP, I0: I0, I1: I1, J0: J0, J1: J1, N: N, riverX: riverX, isWater: isWater, mainH: mainH, mainV: mainV, line: line, stops: stops };
  })();

  function shrink(poly, by) {
    var cx = 0, cy = 0;
    poly.forEach(function (p) { cx += p[0]; cy += p[1]; });
    cx /= poly.length; cy /= poly.length;
    return poly.map(function (p) {
      var dx = cx - p[0], dy = cy - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(by, l * 0.45) / l;
      return [p[0] + dx * k, p[1] + dy * k];
    });
  }
  function bilerp(A, B, C, D, u, v) {
    return [(1 - u) * (1 - v) * A[0] + u * (1 - v) * B[0] + u * v * C[0] + (1 - u) * v * D[0],
            (1 - u) * (1 - v) * A[1] + u * (1 - v) * B[1] + u * v * C[1] + (1 - u) * v * D[1]];
  }

  var organic = {
    route: ORG.line, stops: ORG.stops, angles: [0, -20, 20, 45, -45, 70, -70, 90], routeDots: true, pois: 8,
    isWater: ORG.isWater,
    randPoint: function (rnd) { return [-300 + rnd() * 2000, -300 + rnd() * 1900]; },
    build: function (rnd) {
      var O = ORG, out = [], i, j;
      out.push('<rect class="land" x="-1200" y="-1200" width="4000" height="4000"/>');
      // blocks: parks, or buildings split from the block shape
      for (i = O.I0; i < O.I1; i++) for (j = O.J0; j < O.J1; j++) {
        var A = O.N(i, j), B = O.N(i + 1, j), C = O.N(i + 1, j + 1), D = O.N(i, j + 1);
        var blk = shrink([A, B, C, D], 13), cen = bilerp(A, B, C, D, 0.5, 0.5);
        if ([A, B, C, D, cen].some(function (p) { return O.isWater(p[0], p[1]); })) continue;
        var r = rnd();
        if (r < 0.07) {
          out.push('<polygon class="park" points="' + pts(shrink([A, B, C, D], 12)) + '"/>');
          for (var t = 0; t < 7; t++) { var tp = bilerp(blk[0], blk[1], blk[2], blk[3], 0.15 + rnd() * 0.7, 0.15 + rnd() * 0.7); out.push('<circle class="tree" cx="' + tp[0].toFixed(0) + '" cy="' + tp[1].toFixed(0) + '" r="' + (5 + rnd() * 6).toFixed(1) + '"/>'); }
          continue;
        }
        if (r < 0.1) { out.push('<polygon class="plaza" points="' + pts(blk) + '"/>'); continue; }
        var nu = 2 + Math.floor(rnd() * 2), nv = 2 + Math.floor(rnd() * 2);
        for (var u = 0; u < nu; u++) for (var v = 0; v < nv; v++) {
          if (rnd() < 0.08) continue; // courtyard
          var cell = [bilerp(blk[0], blk[1], blk[2], blk[3], u / nu, v / nv), bilerp(blk[0], blk[1], blk[2], blk[3], (u + 1) / nu, v / nv),
                      bilerp(blk[0], blk[1], blk[2], blk[3], (u + 1) / nu, (v + 1) / nv), bilerp(blk[0], blk[1], blk[2], blk[3], u / nu, (v + 1) / nv)];
          out.push('<polygon class="' + CLS[Math.floor(rnd() * 4)] + '" points="' + pts(shrink(cell, 2.2)) + '"/>');
        }
      }
      // streets: minor first, then main roads on top
      var minor = [], major = [];
      for (i = O.I0; i <= O.I1; i++) for (j = O.J0; j <= O.J1; j++) {
        var p = O.N(i, j);
        if (i < O.I1) (O.mainH(j) ? major : minor).push([p, O.N(i + 1, j)]);
        if (j < O.J1) (O.mainV(i) ? major : minor).push([p, O.N(i, j + 1)]);
      }
      minor.forEach(function (e) { out.push('<path class="road-minor" d="' + pathD(e) + '"/>'); });
      major.forEach(function (e) { out.push('<path class="road-main" d="' + pathD(e) + '"/>'); });
      // roundabouts on some main crossings
      for (i = O.I0; i <= O.I1; i += 3) for (j = O.J0; j <= O.J1; j += 3) {
        var c = O.N(i, j);
        if (O.isWater(c[0], c[1]) || ((i * 7 + j * 3) % 4)) continue;
        out.push('<circle class="roundabout" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="26"/>');
        out.push('<circle class="park" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="13"/>');
      }
      // river, then bridges where main roads cross it
      var L = [], R = [];
      for (var yy = -1200; yy <= 2800; yy += 16) { L.push([O.riverX(yy) - 66, yy]); R.unshift([O.riverX(yy) + 66, yy]); }
      out.push(water(L.concat(R)));
      major.forEach(function (e) { out.push(bridges(e, O.isWater, 260)); });
      return out.join("");
    }
  };

  window.MapLayouts = { grid: grid, city3d: city3d, oldtown: oldtown, metro: metro, organic: organic };
})();
