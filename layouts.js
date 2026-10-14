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

  // --- the island: an irregular coastline drawn around (700, 640) ---------------------
  var IC = [700, 640], IRY = 0.95;
  function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
  function bump(t, at, width, size) { var d = angDiff(t, at) / width; return size * Math.exp(-d * d); }
  function coastR(t) {
    var r = 1650 * (1 + 0.06 * Math.sin(3 * t + 0.5) + 0.04 * Math.sin(5 * t + 1.7) + 0.025 * Math.sin(9 * t + 0.3)
                      + 0.013 * Math.sin(17 * t + 2.1) + 0.007 * Math.sin(31 * t + 0.9) + 0.004 * Math.sin(53 * t + 1.1));
    return r - bump(t, 0.12, 0.17, 340)   // harbour bay (east)
             - bump(t, 2.45, 0.12, 230)   // south-west bay
             - bump(t, 4.35, 0.09, 170)   // small north cove
             + bump(t, 5.55, 0.08, 190)   // headland (north-east)
             + bump(t, 3.3, 0.1, 120);    // west point
  }
  function polarOf(x, y) { var dx = x - IC[0], dy = (y - IC[1]) / IRY; return [Math.atan2(dy, dx), Math.hypot(dx, dy)]; }
  function coastPoint(t, extra) { var r = coastR(t) + (extra || 0); return [IC[0] + r * Math.cos(t), IC[1] + r * IRY * Math.sin(t)]; }
  function inSea(x, y, margin) { var p = polarOf(x, y); return p[1] > coastR(p[0]) - (margin || 0); }
  function outline(extra) { var o = []; for (var k = 0; k < 720; k++) o.push(coastPoint(k / 720 * 2 * Math.PI, extra)); return o; }
  // small islands off the coast: centre, radius
  var ISLETS = [[2560, 760, 110], [2380, 1240, 60], [-1120, 260, 95], [-980, 1880, 70], [1480, -1080, 80]];
  function isletR(k, t) { return ISLETS[k][2] * (1 + 0.18 * Math.sin(3 * t + k) + 0.1 * Math.sin(7 * t + 2 * k)); }

  // --- the river: winding, changing width, widening towards its mouths --------------
  function riverX(y) { return 820 + 55 * Math.sin(y / 190) + 18 * Math.sin(y / 71 + 1.3); }
  function riverHalf(y) {
    var w = 50 + 15 * Math.sin(y / 240 + 0.7) + 7 * Math.sin(y / 53);
    var far = Math.abs(y - IC[1]) - 1250;
    return far > 0 ? w + far * 0.35 : w;
  }
  function inRiver(x, y, margin) { return Math.abs(x - riverX(y)) < riverHalf(y) + (margin || 0); }
  // a lake in the west park
  var LAKE = [-200, 920, 95, 62];
  function inLake(x, y, margin) { var dx = (x - LAKE[0]) / (LAKE[2] + (margin || 0)), dy = (y - LAKE[1]) / (LAKE[3] + (margin || 0)); return dx * dx + dy * dy < 1; }

  function gridWater(x, y) { return inSea(x, y) || inRiver(x, y) || inLake(x, y); }
  function nearWater(x, y, m) { return inSea(x, y, m) || inRiver(x, y, m) || inLake(x, y, m); }

  function gridParks(rnd) {
    var parks = [[5, 1, 3, 3], [-3, 6, 3, 2]];
    for (var p = 0; p < 14; p++) parks.push([Math.floor(rnd() * 34) - 12, Math.floor(rnd() * 32) - 12, 1 + Math.floor(rnd() * 3), 1 + Math.floor(rnd() * 3)]);
    return parks;
  }
  function inPark(parks, i, j) {
    for (var k = 0; k < parks.length; k++) {
      var q = parks[k];
      if (i >= q[0] * 3 && i < (q[0] + q[2]) * 3 && j >= q[1] * 3 && j < (q[1] + q[3]) * 3) return true;
    }
    return false;
  }
  // how far out from the centre a point is (0 = centre, 1 = coast); the edges become quieter suburbs
  function outskirts(x, y) { var p = polarOf(x, y); return p[1] / coastR(p[0]); }

  function gridGround(rnd, parks, out) {
    var land = pts(outline(0));
    out.push('<defs><clipPath id="landClip"><polygon points="' + land + '"/></clipPath></defs>');
    out.push('<polygon class="shallow" points="' + pts(outline(60)) + '"/>');
    out.push('<polygon class="shallow2" points="' + pts(outline(26)) + '"/>');
    out.push('<polygon class="shore" points="' + pts(outline(9)) + '"/>');
    out.push('<polygon class="land" points="' + land + '"/>');
    ISLETS.forEach(function (c, k) {
      var sh = [], ld = [];
      for (var q = 0; q < 48; q++) { var t = q / 48 * 2 * Math.PI, r = isletR(k, t); sh.push([c[0] + (r + 24) * Math.cos(t), c[1] + (r + 24) * Math.sin(t)]); ld.push([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]); }
      out.push('<polygon class="shallow" points="' + pts(sh) + '"/><polygon class="shore" points="' + pts(ld.map(function (p) { return [c[0] + (p[0] - c[0]) * 1.06, c[1] + (p[1] - c[1]) * 1.06]; })) + '"/><polygon class="park" points="' + pts(ld) + '"/>');
      for (var n = 0; n < c[2] / 6; n++) { var tt = rnd() * 2 * Math.PI, rr = rnd() * c[2] * 0.75; out.push('<circle class="tree" cx="' + (c[0] + rr * Math.cos(tt)).toFixed(0) + '" cy="' + (c[1] + rr * Math.sin(tt)).toFixed(0) + '" r="' + (5 + rnd() * 6).toFixed(1) + '"/>'); }
    });
    out.push('<g clip-path="url(#landClip)">');
    for (var a = -14; a <= 24; a++) {
      out.push('<line class="avenue" x1="' + a * AVE + '" y1="-1600" x2="' + a * AVE + '" y2="3000"/>');
      out.push('<line class="avenue" x1="-1600" y1="' + a * AVE + '" x2="3000" y2="' + a * AVE + '"/>');
    }
    parks.forEach(function (q) {
      out.push('<rect class="park" x="' + (q[0] * AVE + 4) + '" y="' + (q[1] * AVE + 4) + '" width="' + (q[2] * AVE - 8) + '" height="' + (q[3] * AVE - 8) + '" rx="6"/>');
      for (var n = 0; n < q[2] * q[3] * 9; n++) {
        var tx = q[0] * AVE + 12 + rnd() * (q[2] * AVE - 24), ty = q[1] * AVE + 12 + rnd() * (q[3] * AVE - 24);
        if (!inLake(tx, ty, 10)) out.push('<circle class="tree" cx="' + tx.toFixed(0) + '" cy="' + ty.toFixed(0) + '" r="' + (4 + rnd() * 6).toFixed(1) + '"/>');
      }
    });
    // trees along the shore
    for (var s2 = 0; s2 < 260; s2++) {
      var tp = coastPoint(rnd() * 2 * Math.PI, -(22 + rnd() * 60));
      if (!inRiver(tp[0], tp[1], 10)) out.push('<circle class="tree" cx="' + tp[0].toFixed(0) + '" cy="' + tp[1].toFixed(0) + '" r="' + (4 + rnd() * 6).toFixed(1) + '"/>');
    }
    out.push('</g>');
  }
  function gridWaterShapes(out) {
    var L = [], R = [], L2 = [], R2 = [], yy;
    for (yy = -1700; yy <= 3000; yy += 14) {
      var c = riverX(yy), h = riverHalf(yy);
      L.push([c - h, yy]); R.unshift([c + h, yy]);
      L2.push([c - h * 0.62, yy]); R2.unshift([c + h * 0.62, yy]);
    }
    out.push('<polygon class="river-bank" points="' + pts(L.map(function (p) { return [p[0] - 7, p[1]]; }).concat(R.map(function (p) { return [p[0] + 7, p[1]]; }))) + '"/>');
    out.push('<polygon class="shallow2" points="' + pts(L.concat(R)) + '"/>');
    out.push('<polygon class="water" points="' + pts(L2.concat(R2)) + '"/>');
    // lake
    var lk = [], lk2 = [];
    for (var q = 0; q < 40; q++) {
      var t = q / 40 * 2 * Math.PI, w = 1 + 0.08 * Math.sin(3 * t) + 0.05 * Math.sin(5 * t + 1);
      lk.push([LAKE[0] + LAKE[2] * w * Math.cos(t), LAKE[1] + LAKE[3] * w * Math.sin(t)]);
      lk2.push([LAKE[0] + LAKE[2] * w * 0.7 * Math.cos(t), LAKE[1] + LAKE[3] * w * 0.7 * Math.sin(t)]);
    }
    out.push('<polygon class="shore" points="' + pts(lk.map(function (p) { return [LAKE[0] + (p[0] - LAKE[0]) * 1.08, LAKE[1] + (p[1] - LAKE[1]) * 1.1]; })) + '"/><polygon class="shallow2" points="' + pts(lk) + '"/><polygon class="water" points="' + pts(lk2) + '"/>');
    // bridges over the river (the route uses the y=660 one)
    [-792, -264, 264, 660, 1188, 1716].forEach(function (by) {
      out.push(bridges([[riverX(by) - 220, by], [riverX(by) + 220, by]], function (x, y) { return inRiver(x, y); }, 400));
    });
    // harbour piers in the east bay
    for (var k = -2; k <= 2; k++) {
      var t0 = 0.12 + k * 0.045, a = coastPoint(t0, -4), b2 = coastPoint(t0, 95 + Math.abs(k) * -12);
      out.push('<path class="pier" d="' + pathD([a, b2]) + '"/>');
    }
  }
  // Each city block split into 1, 2 or 4 buildings; towards the coast, fewer and smaller (suburbs).
  function gridBuildings(rnd, parks, each, splitMore) {
    var gap = 7;
    function ok(x, y, w, h) { return !(nearWater(x, y, 9) || nearWater(x + w, y, 9) || nearWater(x, y + h, 9) || nearWater(x + w, y + h, 9)); }
    for (var i = -42; i < 66; i++) {
      for (var j = -40; j < 62; j++) {
        var x = i * GRID, y = j * GRID, cx = x + GRID / 2, cy = y + GRID / 2;
        if (inSea(cx, cy, -30) || inRiver(cx, cy, -10)) continue;
        if (inPark(parks, i, j)) continue;
        var o = outskirts(cx, cy), bx = x + gap / 2, by = y + gap / 2, s = GRID - gap, r = rnd();
        if (o > 0.7) {                                  // suburbs: a house or two, or nothing
          if (r < 0.16 + (o - 0.7) * 1.1) continue;
          var hw = s * (0.55 + rnd() * 0.3), hh = s * (0.5 + rnd() * 0.3);
          var hx = bx + rnd() * (s - hw), hy = by + rnd() * (s - hh);
          if (ok(hx, hy, hw, hh)) each(hx, hy, hw, hh, true);
          continue;
        }
        if (r < 0.35) { if (ok(bx, by, s, s)) each(bx, by, s, s, false); }
        else if (r < 0.7 || !splitMore) {
          var w = Math.round(s * (0.35 + rnd() * 0.3));
          if (ok(bx, by, w - 1, s)) each(bx, by, w - 1, s, false);
          if (ok(bx + w + 1, by, s - w - 1, s)) each(bx + w + 1, by, s - w - 1, s, false);
        } else {
          var h2 = s / 2;
          [[bx, by], [bx + h2 + 1, by], [bx, by + h2 + 1], [bx + h2 + 1, by + h2 + 1]].forEach(function (p) {
            if (ok(p[0], p[1], h2 - 1, h2 - 1)) each(p[0], p[1], h2 - 1, h2 - 1, false);
          });
        }
      }
    }
  }
  var CLS = ["b1", "b2", "b3", "b4"];
  var GRID_ROUTE = [[264, 396], [528, 396], [528, 660], [1056, 660], [1188, 660], [1188, 1056]];
  function gridRand(rnd) { var p = coastPoint(rnd() * 2 * Math.PI, 0); var f = Math.sqrt(rnd()) * 0.85; return [IC[0] + (p[0] - IC[0]) * f, IC[1] + (p[1] - IC[1]) * f]; }

  var grid = {
    route: GRID_ROUTE, stops: [0, 2, 3, 5], angles: [-12, 38], pois: 26,
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
    route: GRID_ROUTE, stops: [0, 2, 3, 5], angles: [-12, 38], dependsOnAngle: true, pois: 34,
    isWater: gridWater, randPoint: gridRand,
    build: function (rnd, ctx) {
      var out = [], parks = gridParks(rnd), list = [];
      gridGround(rnd, parks, out);
      gridWaterShapes(out);
      var a = ctx.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      // "up" on screen (tilted a little to the right) expressed in map coordinates
      var ux = 0.3 * ca - sa, uy = -0.3 * sa - ca;
      gridBuildings(rnd, parks, function (x, y, w, h, suburb) {
        var d = Math.hypot(x - 760, y - 640);
        var H = suburb ? 3 + rnd() * 4 : 4 + rnd() * 9 + Math.max(0, 52 - d / 13) * (0.4 + rnd() * 0.6);
        if (!suburb && rnd() < 0.025) H += 30 + rnd() * 30;
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

  window.MapLayouts = { grid: grid, city3d: city3d, oldtown: oldtown, metro: metro };
})();
