/* Publication-safe foresight knowledge graph. Expects window.INTEL_GRAPH. */
(function () {
  "use strict";
  var G = window.INTEL_GRAPH || { nodes: [], edges: [], presets: [] };
  var nodes = G.nodes || [];
  var edges = G.edges || [];
  var byId = {};
  var adj = {};
  var edgeById = {};
  nodes.forEach(function (node) {
    node.type = String(node.type || node.neoLabel || "node").toLowerCase();
    node.text = node.text || node.summary || "";
    node.href = node.href || node.canonical_uri || "";
    byId[node.id] = node;
    adj[node.id] = [];
  });
  edges.forEach(function (edge) {
    edgeById[edge.id] = edge;
    if (!adj[edge.source] || !adj[edge.target]) return;
    adj[edge.source].push({ to: edge.target, edge: edge, forward: true });
    adj[edge.target].push({ to: edge.source, edge: edge, forward: false });
  });

  var LABELS = {
    signal: "Signals", claim: "Claims", source: "Sources", actor: "Actors",
    org: "Organizations", trend: "Trends", thread: "Threads", country: "Countries",
    funder: "Funders", pact: "Pact", lens: "IE lenses", moment: "Moments",
    world: "Worlds"
  };
  var COLORS = {
    signal: "#3B68F6", claim: "#7C3AED", source: "#64748B", actor: "#0369A1",
    org: "#0369A1", trend: "#0F766E", thread: "#0858F7", country: "#B45309",
    funder: "#15803D", pact: "#BE123C", lens: "#6D28D9", moment: "#C2410C",
    world: "#9333EA"
  };
  var counts = {};
  nodes.forEach(function (node) { counts[node.type] = (counts[node.type] || 0) + 1; });
  var TYPES = Object.keys(counts).sort(function (a, b) {
    return counts[b] - counts[a] || a.localeCompare(b);
  }).map(function (type) {
    return { id: type, label: LABELS[type] || type.replace(/_/g, " "), count: counts[type] };
  });

  var enabled = {};
  TYPES.forEach(function (type) { enabled[type.id] = true; });
  var selected = null;
  var query = "";
  var pathNodeIds = {};
  var pathEdgeIds = {};
  var activeIds = {};
  var simulation = [];
  var simulationById = {};
  var activeEdges = [];
  var NAMED_VERBS = {
    SUPPORTS: true, CONTRADICTS: true, PRECEDES: true,
    ILLUSTRATES: true, EVIDENCE_EXAMPLE: true
  };
  var showProvisional = /(?:^|[?#&])provisional=1(?:&|$)/.test(location.hash + location.search);

  function isNamedVerb(type) {
    return Boolean(NAMED_VERBS[String(type || "").toUpperCase()]);
  }

  function prettyType(type) {
    var key = String(type || "").toUpperCase();
    if (VERB_LABELS[key]) return VERB_LABELS[key];
    return key.replace(/_/g, " ").toLowerCase();
  }

  function edgeAllowed(edge) {
    if (!edge || edge.review_status === "rejected") return false;
    if (!isNamedVerb(edge.type)) return true;
    if (showProvisional) return true;
    return edge.review_status === "human_reviewed";
  }

  function trustRank(item) {
    var edge = item.edge;
    if (edge.review_status === "human_reviewed" || edge.confidence === "high") return 0;
    if (edge.review_status === "ai_provisional" || edge.confidence === "medium") return 1;
    return 2;
  }

  function neighbourhood(rootId, depth, limit) {
    var ids = {};
    if (!byId[rootId]) return ids;
    ids[rootId] = true;
    var queue = [{ id: rootId, depth: 0 }];
    for (var index = 0; index < queue.length && Object.keys(ids).length < limit; index++) {
      var current = queue[index];
      if (current.depth >= depth) continue;
      var neighbours = (adj[current.id] || []).slice().sort(function (a, b) {
        return trustRank(a) - trustRank(b) || a.to.localeCompare(b.to);
      });
      for (var i = 0; i < neighbours.length && Object.keys(ids).length < limit; i++) {
        if (!edgeAllowed(neighbours[i].edge)) continue;
        var next = neighbours[i].to;
        if (ids[next]) continue;
        ids[next] = true;
        queue.push({ id: next, depth: current.depth + 1 });
      }
    }
    return ids;
  }

  function initialIds() {
    var ids = {};
    var seeds = nodes.filter(function (node) {
      return ["trend", "thread", "pact", "lens", "moment"].indexOf(node.type) !== -1;
    }).slice(0, 18);
    seeds.forEach(function (node) {
      Object.keys(neighbourhood(node.id, 1, 9)).forEach(function (id) {
        if (Object.keys(ids).length < 76) ids[id] = true;
      });
    });
    return ids;
  }

  function searchRank(node, needle) {
    var label = String(node.label || "").toLowerCase();
    var typeOrder = {
      country: 0, actor: 1, org: 1, trend: 2, thread: 2, funder: 3,
      pact: 3, lens: 3, signal: 4, source: 5, claim: 6
    };
    var matchRank = label === needle ? 0 : label.indexOf(needle) === 0 ? 1 :
      label.indexOf(needle) !== -1 ? 2 : 3;
    return matchRank * 10 + (typeOrder[node.type] == null ? 5 : typeOrder[node.type]);
  }

  function searchIds(value) {
    var needle = String(value || "").trim().toLowerCase();
    if (!needle) return initialIds();
    var matches = nodes.filter(function (node) {
      return (node.label + " " + node.text + " " + node.type).toLowerCase().indexOf(needle) !== -1;
    }).sort(function (a, b) {
      return searchRank(a, needle) - searchRank(b, needle) ||
        String(a.label).localeCompare(String(b.label));
    }).slice(0, 24);
    var ids = {};
    matches.forEach(function (node) {
      Object.keys(neighbourhood(node.id, 1, 18)).forEach(function (id) {
        if (Object.keys(ids).length < 90) ids[id] = true;
      });
    });
    return ids;
  }

  var canvas = document.getElementById("gCanvas");
  var context = canvas.getContext("2d");
  var stage = document.getElementById("gStage");
  var width = 800;
  var height = 560;
  var pixelRatio = 1;
  var camera = { scale: 1 };
  var ty = 0.38;
  var tx = 0.24;
  var spin = true;
  var dragging = false;
  var moved = false;
  var lx = 0;
  var ly = 0;
  var hovered = null;
  var hoveredEdge = null;
  var pointerIn = false;
  var lastFrame = 0;
  var ticks = 0;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var VERB_LABELS = {
    SUPPORTS: "supports",
    CONTRADICTS: "contradicts",
    PRECEDES: "precedes",
    ILLUSTRATES: "illustrates",
    EVIDENCE_EXAMPLE: "example of",
    ALIGNED_TO: "aligned to",
    IN_TREND: "in trend",
    IN_THREAD: "in thread",
    MENTIONS_COUNTRY: "mentions",
    HAS_CLAIM: "has claim",
    FUNDED_BY: "funded by",
    SOURCE_FOR: "source of",
    CITES: "cites",
    HOSTS: "hosts",
    ADVANCES: "advances",
    REPORTS: "reports",
    CONTEXTUALIZES: "contextualizes",
    AUTHORED: "authored",
    MEMBER_OF: "member of",
    PARTNERS_WITH: "partners with",
    ENGAGES_WITH: "engages",
    WORKS_ON: "works on",
    IMPLEMENTS: "implements",
    COMMITS_TO: "commits to",
    COVERS_THEME: "covers",
    AFFILIATED_WITH: "affiliated with",
    EXTRACTED_FROM: "extracted from",
    COLLABORATES_WITH: "collaborates",
    LINKED_TO_HUB: "linked to"
  };
  var FOV = 760;
  var RING = { trend: 70, thread: 78, lens: 86, pact: 94, world: 100, moment: 108, actor: 128, org: 128, country: 140, funder: 148, signal: 168, claim: 198, source: 218 };
  var EDGE_STYLE = {
    SUPPORTS: { color: [59, 104, 246], width: 1.8, dash: [], pulse: true },
    ILLUSTRATES: { color: [59, 104, 246], width: 1.6, dash: [], pulse: true },
    EVIDENCE_EXAMPLE: { color: [59, 104, 246], width: 1.4, dash: [], pulse: false },
    CONTRADICTS: { color: [190, 18, 60], width: 1.8, dash: [5, 4], pulse: false },
    PRECEDES: { color: [15, 118, 110], width: 1.5, dash: [], pulse: true },
    HAS_CLAIM: { color: [100, 116, 139], width: 1.1, dash: [], pulse: false },
    FUNDED_BY: { color: [21, 128, 61], width: 1.2, dash: [], pulse: false },
    ALIGNED_TO: { color: [109, 40, 217], width: 1.15, dash: [], pulse: false },
    IN_TREND: { color: [15, 118, 110], width: 1.15, dash: [], pulse: false },
    IN_THREAD: { color: [8, 88, 247], width: 1.15, dash: [], pulse: false },
    MENTIONS_COUNTRY: { color: [180, 83, 9], width: 1.1, dash: [], pulse: false },
    SOURCE_FOR: { color: [100, 116, 139], width: 1.05, dash: [], pulse: false }
  };
  var DEFAULT_EDGE = { color: [100, 116, 139], width: 1, dash: [], pulse: false };

  if (reduced) spin = false;

  function seed(n) {
    var s = Math.sin(n * 127.1 + 3.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function hexToRgb(hex) {
    var value = String(hex || "").replace("#", "");
    if (value.length === 3) value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
    var n = parseInt(value, 16);
    if (isNaN(n)) return [71, 85, 105];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(rgb, a) {
    return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";
  }

  function nodeDegree(id) {
    return (adj[id] || []).length;
  }

  function resize() {
    pixelRatio = window.devicePixelRatio || 1;
    width = Math.max(280, stage.clientWidth);
    height = Math.max(360, stage.clientHeight);
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function rebuild(ids) {
    activeIds = ids;
    simulation = nodes.filter(function (node) {
      return activeIds[node.id] && enabled[node.type];
    }).map(function (node, index) {
      var ring = RING[node.type] || 160;
      var u = seed(index + 1) * Math.PI * 2;
      var w = seed(index + 17) * 2 - 1;
      var q = Math.sqrt(Math.max(0, 1 - w * w));
      var rr = ring + seed(index + 31) * 28;
      return {
        node: node,
        px: Math.cos(u) * q * rr,
        py: w * rr * 0.72,
        pz: Math.sin(u) * q * rr,
        vx: 0,
        vy: 0,
        vz: 0,
        sx: 0,
        sy: 0,
        sz: 0,
        ss: 1
      };
    });
    simulationById = {};
    simulation.forEach(function (point) { simulationById[point.node.id] = point; });
    activeEdges = edges.filter(function (edge) {
      return simulationById[edge.source] && simulationById[edge.target] && edgeAllowed(edge);
    });
    var settle = reduced ? 90 : 160;
    for (var pre = 0; pre < settle; pre++) tick();
    ticks = reduced ? 80 : 140;
    var status = document.getElementById("gViewCount");
    if (status) status.textContent = simulation.length + " nodes · " + activeEdges.length + " relationships in view — drag to rotate";
    var loading = document.getElementById("gLoading");
    if (loading) loading.classList.toggle("is-hidden", simulation.length > 0);
  }

  function fitView() {
    ty = 0.38;
    tx = 0.24;
    camera.scale = 1;
  }

  function tick() {
    var i;
    var j;
    var a;
    var b;
    var dx;
    var dy;
    var dz;
    var d2;
    var d;
    var force;
    for (i = 0; i < simulation.length; i++) {
      a = simulation[i];
      for (j = i + 1; j < simulation.length; j++) {
        b = simulation[j];
        dx = a.px - b.px;
        dy = a.py - b.py;
        dz = a.pz - b.pz;
        d2 = dx * dx + dy * dy + dz * dz + 0.01;
        if (d2 < 22000) {
          force = Math.min(2.2, 380 / d2);
          dx *= force;
          dy *= force;
          dz *= force;
          a.vx += dx;
          a.vy += dy;
          a.vz += dz;
          b.vx -= dx;
          b.vy -= dy;
          b.vz -= dz;
        }
      }
    }
    activeEdges.forEach(function (edge) {
      a = simulationById[edge.source];
      b = simulationById[edge.target];
      dx = b.px - a.px;
      dy = b.py - a.py;
      dz = b.pz - a.pz;
      d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
      var rest = isNamedVerb(edge.type) ? 118 : 138;
      force = (d - rest) / d * 0.045;
      dx *= force;
      dy *= force;
      dz *= force;
      a.vx += dx;
      a.vy += dy;
      a.vz += dz;
      b.vx -= dx;
      b.vy -= dy;
      b.vz -= dz;
    });
    simulation.forEach(function (point) {
      point.vx *= 0.82;
      point.vy *= 0.82;
      point.vz *= 0.82;
      point.px += Math.max(-7, Math.min(7, point.vx));
      point.py += Math.max(-7, Math.min(7, point.vy));
      point.pz += Math.max(-7, Math.min(7, point.vz));
    });
  }

  function project() {
    var cy = Math.cos(ty);
    var sy = Math.sin(ty);
    var cx = Math.cos(tx);
    var sx = Math.sin(tx);
    var base = Math.min(width, height) / 520 * camera.scale;
    simulation.forEach(function (point) {
      var x1 = point.px * cy + point.pz * sy;
      var z1 = point.pz * cy - point.px * sy;
      var y1 = point.py * cx - z1 * sx;
      var z2 = z1 * cx + point.py * sx;
      var s = FOV / (FOV + z2) * base;
      point.sx = width / 2 + x1 * s;
      point.sy = height / 2 + y1 * s;
      point.sz = z2;
      point.ss = s;
    });
  }

  function depth(z) {
    var t = 1 - (z + 260) / 520;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return 0.34 + 0.66 * t;
  }

  function nodeRadius(point) {
    var extra = Math.sqrt(nodeDegree(point.node.id) + 1);
    var base = point.node.type === "signal" ? 4.2 : point.node.type === "claim" || point.node.type === "source" ? 3.6 : 6.2;
    return (base + extra * 0.55) * point.ss;
  }

  function edgeStyle(type) {
    return EDGE_STYLE[String(type || "").toUpperCase()] || DEFAULT_EDGE;
  }

  function focusSet() {
    var focus = selected || hovered;
    if (!focus) return null;
    var set = {};
    set[focus] = true;
    (adj[focus] || []).forEach(function (item) {
      if (edgeAllowed(item.edge)) set[item.to] = true;
    });
    return set;
  }

  function screenLen(from, to) {
    var dx = to.sx - from.sx;
    var dy = to.sy - from.sy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function drawArrow(from, to, rgb, alp, size) {
    var dx = to.sx - from.sx;
    var dy = to.sy - from.sy;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var t = 0.62;
    var ax = from.sx + dx * t;
    var ay = from.sy + dy * t;
    var ux = dx / len;
    var uy = dy / len;
    var px = -uy;
    var py = ux;
    context.beginPath();
    context.moveTo(ax + ux * size, ay + uy * size);
    context.lineTo(ax - ux * size * 0.6 + px * size * 0.7, ay - uy * size * 0.6 + py * size * 0.7);
    context.lineTo(ax - ux * size * 0.6 - px * size * 0.7, ay - uy * size * 0.6 - py * size * 0.7);
    context.closePath();
    context.fillStyle = rgba(rgb, alp);
    context.fill();
  }

  function drawRelLabel(from, to, text, rgb, alp, occupied, force) {
    var dx = to.sx - from.sx;
    var dy = to.sy - from.sy;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 54) return false;
    var mx = (from.sx + to.sx) / 2;
    var my = (from.sy + to.sy) / 2;
    var angle = Math.atan2(dy, dx);
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
    context.save();
    context.translate(mx, my);
    context.rotate(angle);
    context.font = "700 11px ui-sans-serif,system-ui,sans-serif";
    var tw = context.measureText(text).width;
    var boxW = tw + 14;
    var boxH = 16;
    var i;
    if (!force) {
      for (i = 0; i < occupied.length; i++) {
        var u = occupied[i];
        if (Math.abs(u.x - mx) < (u.w + boxW) / 2 && Math.abs(u.y - my) < 16) {
          context.restore();
          return false;
        }
      }
    }
    occupied.push({ x: mx, y: my, w: boxW });
    context.beginPath();
    if (context.roundRect) context.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 7);
    else {
      context.rect(-boxW / 2, -boxH / 2, boxW, boxH);
    }
    context.fillStyle = "rgba(246,248,251,0.92)";
    context.fill();
    context.strokeStyle = rgba(rgb, Math.min(0.7, alp + 0.15));
    context.lineWidth = 1;
    context.stroke();
    context.fillStyle = rgba(rgb, 0.55 + 0.45 * alp);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 0, 0.5);
    context.restore();
    return true;
  }

  function draw(now) {
    context.clearRect(0, 0, width, height);
    if (!simulation.length) return;
    project();
    var focus = selected || hovered;
    var set = focusSet();
    var order = simulation.slice().sort(function (a, b) { return b.sz - a.sz; });
    var hoverId = hoveredEdge && hoveredEdge.id;

    activeEdges.forEach(function (edge) {
      var from = simulationById[edge.source];
      var to = simulationById[edge.target];
      var highlighted = Boolean(pathEdgeIds[edge.id] || edge.source === focus || edge.target === focus || edge.id === hoverId);
      var dim = set && !set[edge.source] && !set[edge.target];
      var style = edgeStyle(edge.type);
      var alp = (depth(from.sz) + depth(to.sz)) / 2 * (dim ? 0.08 : highlighted ? 1 : 0.55);
      context.beginPath();
      context.moveTo(from.sx, from.sy);
      context.lineTo(to.sx, to.sy);
      context.strokeStyle = rgba(style.color, alp);
      context.lineWidth = (highlighted ? style.width + 0.8 : style.width) * (from.ss + to.ss) / 2;
      context.setLineDash(style.dash);
      context.stroke();
      context.setLineDash([]);
      if (!dim && (highlighted || isNamedVerb(edge.type)) && screenLen(from, to) > 48) {
        drawArrow(from, to, style.color, alp, highlighted ? 7 : 5.5);
      }
    });
    context.setLineDash([]);

    if (!reduced) {
      activeEdges.forEach(function (edge, ei) {
        var style = edgeStyle(edge.type);
        if (!style.pulse) return;
        var from = simulationById[edge.source];
        var to = simulationById[edge.target];
        if (set && !set[edge.source] && !set[edge.target]) return;
        var t = (now * 0.00006 + ei * 0.17) % 1;
        var mx = from.sx + (to.sx - from.sx) * t;
        var my = from.sy + (to.sy - from.sy) * t;
        var ms = from.ss + (to.ss - from.ss) * t;
        context.beginPath();
        context.arc(mx, my, 1.7 * ms, 0, Math.PI * 2);
        context.fillStyle = rgba(style.color, 0.85);
        context.fill();
      });
    }

    order.forEach(function (point) {
      var node = point.node;
      var rgb = hexToRgb(COLORS[node.type] || "#475569");
      var r = nodeRadius(point);
      var da = depth(point.sz);
      var dim = set && !set[node.id];
      var hot = node.id === selected || node.id === hovered || pathNodeIds[node.id];
      context.beginPath();
      context.arc(point.sx, point.sy, r * 2.1, 0, Math.PI * 2);
      context.fillStyle = rgba(rgb, 0.14 * (dim ? 0.2 : da));
      context.fill();
      context.beginPath();
      context.arc(point.sx, point.sy, r, 0, Math.PI * 2);
      context.fillStyle = rgba(rgb, (0.55 + 0.45 * da) * (dim ? 0.22 : 1));
      context.fill();
      if (hot) {
        context.beginPath();
        context.arc(point.sx, point.sy, r + 2.4, 0, Math.PI * 2);
        context.strokeStyle = rgba([59, 104, 246], node.id === selected ? 0.95 : 0.55);
        context.lineWidth = node.id === selected ? 2 : 1.2;
        context.stroke();
      }
      var showLabel = hot || (!set && (node.type !== "signal" || camera.scale > 1.15 || nodeDegree(node.id) >= 8));
      if (showLabel && !dim && point.ss > 0.45) {
        var label = String(node.label || "").slice(0, 28);
        context.font = "600 " + Math.round(10 * Math.max(0.85, Math.min(1.2, point.ss))) + "px ui-sans-serif,system-ui,sans-serif";
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        context.lineWidth = 3;
        context.strokeStyle = "rgba(246,248,251,.82)";
        context.strokeText(label, point.sx, point.sy - r - 6);
        context.fillStyle = rgba([15, 23, 42], 0.55 + 0.45 * da);
        context.fillText(label, point.sx, point.sy - r - 6);
        context.textAlign = "start";
      }
    });

    var occupied = [];
    var ranked = activeEdges.slice().sort(function (a, b) {
      function rank(edge) {
        if (isNamedVerb(edge.type)) return 0;
        if (edge.id === hoverId || pathEdgeIds[edge.id]) return 1;
        if (focus && (edge.source === focus || edge.target === focus)) return 1;
        return 2;
      }
      var na = rank(a);
      var nb = rank(b);
      if (na !== nb) return na - nb;
      var fa = simulationById[a.source];
      var ta = simulationById[a.target];
      var fb = simulationById[b.source];
      var tb = simulationById[b.target];
      return screenLen(fb, tb) - screenLen(fa, ta);
    });
    var drawn = 0;
    ranked.forEach(function (edge) {
      var from = simulationById[edge.source];
      var to = simulationById[edge.target];
      var dim = set && !set[edge.source] && !set[edge.target];
      if (dim) return;
      var named = isNamedVerb(edge.type);
      var incident = Boolean(focus && (edge.source === focus || edge.target === focus));
      var hotEdge = edge.id === hoverId || pathEdgeIds[edge.id];
      var longEnough = screenLen(from, to) > (named || incident || hotEdge ? 48 : 68);
      if (!longEnough) return;
      if (!named && !incident && !hotEdge && drawn >= 36) return;
      var style = edgeStyle(edge.type);
      var alp = (depth(from.sz) + depth(to.sz)) / 2 * (hotEdge || incident ? 1 : 0.85);
      if (drawRelLabel(from, to, prettyType(edge.type), style.color, alp, occupied, named || hotEdge)) drawn++;
    });
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    var dt = lastFrame ? Math.min(50, now - lastFrame) : 16;
    lastFrame = now || 0;
    if (ticks < (reduced ? 80 : 140)) {
      tick();
      ticks++;
    }
    if (spin && !pointerIn && !dragging && !selected && !hovered && !reduced) ty += dt * 0.00007;
    draw(now || 0);
  }

  function hit(x, y) {
    var best = null;
    var bestScore = 1e9;
    simulation.forEach(function (point) {
      var r = nodeRadius(point) + 6;
      var dx = point.sx - x;
      var dy = point.sy - y;
      var d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        var score = d2 + point.sz * 2;
        if (score < bestScore) {
          bestScore = score;
          best = point.node.id;
        }
      }
    });
    return best;
  }

  function hitEdge(x, y) {
    var best = null;
    var bestD = 8;
    activeEdges.forEach(function (edge) {
      var from = simulationById[edge.source];
      var to = simulationById[edge.target];
      var vx = to.sx - from.sx;
      var vy = to.sy - from.sy;
      var len2 = vx * vx + vy * vy || 1;
      var t = ((x - from.sx) * vx + (y - from.sy) * vy) / len2;
      if (t < 0.08 || t > 0.92) return;
      var px = from.sx + vx * t;
      var py = from.sy + vy * t;
      var d = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      if (d < bestD) {
        bestD = d;
        best = edge;
      }
    });
    return best;
  }

  function placeTip(tip, mx, my) {
    var left = mx + 14;
    var top = my + 12;
    if (left > width - 250) left = mx - 250;
    if (top > height - 80) top = my - 70;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.max(8, top) + "px";
  }

  function updateTip(mx, my) {
    var tip = document.getElementById("gTip");
    if (!tip) return;
    if (hovered && hovered !== selected) {
      var node = byId[hovered];
      if (!node) {
        tip.hidden = true;
        return;
      }
      var links = (adj[hovered] || []).filter(function (item) { return edgeAllowed(item.edge); }).length;
      tip.innerHTML = "<div class=\"g-tip-name\">" + escapeHtml(node.label) + "</div><div class=\"g-tip-meta\">" +
        escapeHtml(node.type) + " · " + links + " relationship" + (links === 1 ? "" : "s") + "</div>";
      tip.hidden = false;
      placeTip(tip, mx, my);
      return;
    }
    if (hoveredEdge) {
      var fromNode = byId[hoveredEdge.source];
      var toNode = byId[hoveredEdge.target];
      tip.innerHTML = "<div class=\"g-tip-name\">" + escapeHtml(prettyType(hoveredEdge.type)) + "</div><div class=\"g-tip-meta\">" +
        escapeHtml(fromNode ? fromNode.label : hoveredEdge.source) + " → " +
        escapeHtml(toNode ? toNode.label : hoveredEdge.target) + "</div>";
      tip.hidden = false;
      placeTip(tip, mx, my);
      return;
    }
    tip.hidden = true;
  }

  function shortestPath(from, to) {
    if (!from || !to || from === to) return null;
    var queue = [from];
    var previous = {};
    var previousEdge = {};
    previous[from] = null;
    for (var index = 0; index < queue.length && index < 12000; index++) {
      var current = queue[index];
      if (current === to) break;
      var neighbours = adj[current] || [];
      for (var i = 0; i < neighbours.length; i++) {
        if (!edgeAllowed(neighbours[i].edge)) continue;
        var next = neighbours[i].to;
        if (previous[next] !== undefined) continue;
        previous[next] = current;
        previousEdge[next] = neighbours[i].edge.id;
        queue.push(next);
      }
    }
    if (previous[to] === undefined) return null;
    var nodeIds = [];
    var edgeIds = [];
    var cursor = to;
    while (cursor) {
      nodeIds.unshift(cursor);
      if (previousEdge[cursor]) edgeIds.unshift(previousEdge[cursor]);
      cursor = previous[cursor];
    }
    return { nodes: nodeIds, edges: edgeIds };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
    });
  }

  function relationLabel(item) {
    return (item.forward ? "→ " : "← ") + prettyType(item.edge.type);
  }

  function renderDetail(id) {
    var panel = document.getElementById("gDetail");
    var content = document.getElementById("gDetailContent");
    var node = byId[id];
    if (!node) {
      panel.classList.remove("is-open");
      content.innerHTML = "";
      return;
    }
    var neighbours = (adj[id] || []).filter(function (item) {
      return edgeAllowed(item.edge);
    }).slice().sort(function (a, b) {
      return trustRank(a) - trustRank(b) || a.to.localeCompare(b.to);
    }).slice(0, 18).map(function (item) {
      var other = byId[item.to];
      if (!other) return "";
      return "<li><button type=\"button\" class=\"g-jump\" data-id=\"" + escapeHtml(other.id) + "\">" +
        escapeHtml(other.label) + "</button> <span class=\"g-ty\">" + escapeHtml(relationLabel(item)) + "</span></li>";
    }).join("");
    var trust = [node.review_status, node.confidence, node.source_graph].filter(Boolean).join(" · ");
    content.innerHTML =
      "<div class=\"g-k\">" + escapeHtml(node.type) + (trust ? " · " + escapeHtml(trust) : "") + "</div>" +
      "<h3>" + escapeHtml(node.label) + "</h3>" +
      "<p>" + escapeHtml(node.text || "") + "</p>" +
      (node.href ? "<p><a href=\"" + escapeHtml(node.href) + "\">Open source record →</a></p>" : "") +
      (neighbours ? "<h4>Directed relationships</h4><ul class=\"g-nbr\">" + neighbours + "</ul>" : "");
    panel.classList.add("is-open");
  }

  function select(id, updateHistory) {
    if (!byId[id]) return;
    selected = id;
    var tip = document.getElementById("gTip");
    if (tip) tip.hidden = true;
    rebuild(neighbourhood(id, 2, 90));
    renderDetail(id);
    if (updateHistory !== false) {
      try { history.replaceState(null, "", "#node=" + encodeURIComponent(id)); } catch (error) {}
    }
  }

  function closeDetail() {
    selected = null;
    document.getElementById("gDetail").classList.remove("is-open");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (error) {}
  }

  function renderSearchResults(value) {
    var list = document.getElementById("gResults");
    var needle = String(value || "").trim().toLowerCase();
    if (!needle) {
      list.innerHTML = "";
      list.classList.remove("has-results");
      return;
    }
    var matches = nodes.filter(function (node) {
      return (node.label + " " + node.text + " " + node.type).toLowerCase().indexOf(needle) !== -1;
    }).sort(function (a, b) {
      return searchRank(a, needle) - searchRank(b, needle) ||
        String(a.label).localeCompare(String(b.label));
    }).slice(0, 7);
    list.innerHTML = matches.map(function (node) {
      return "<li><button type=\"button\" class=\"g-jump\" data-id=\"" + escapeHtml(node.id) + "\">" +
        "<span class=\"g-result-dot\" style=\"--dot:" + (COLORS[node.type] || "#64748B") + "\"></span>" +
        "<span>" + escapeHtml(node.label) + "<small>" + escapeHtml(LABELS[node.type] || node.type) +
        "</small></span></button></li>";
    }).join("");
    list.classList.toggle("has-results", matches.length > 0);
  }

  function fillSelects() {
    var options = nodes.filter(function (node) {
      return ["signal", "actor", "org", "trend", "thread", "country", "funder", "pact", "lens"].indexOf(node.type) !== -1;
    }).sort(function (a, b) {
      return String(a.label).localeCompare(String(b.label));
    }).map(function (node) {
      return "<option value=\"" + escapeHtml(node.id) + "\">" + escapeHtml(node.type) + " · " +
        escapeHtml(node.label).slice(0, 58) + "</option>";
    }).join("");
    document.getElementById("gFrom").innerHTML = "<option value=\"\">From…</option>" + options;
    document.getElementById("gTo").innerHTML = "<option value=\"\">To…</option>" + options;
  }

  function runPath(from, to) {
    pathNodeIds = {};
    pathEdgeIds = {};
    var path = shortestPath(from, to);
    var chain = document.getElementById("gChain");
    if (!path) {
      chain.innerHTML = "<p class=\"g-empty\">No path exists in the publication-safe projection.</p>";
      return;
    }
    path.nodes.forEach(function (id) { pathNodeIds[id] = true; });
    path.edges.forEach(function (id) { pathEdgeIds[id] = true; });
    var ids = {};
    path.nodes.forEach(function (id) { ids[id] = true; });
    path.nodes.forEach(function (id) {
      Object.keys(neighbourhood(id, 1, 10)).forEach(function (neighbourId) {
        if (Object.keys(ids).length < 90) ids[neighbourId] = true;
      });
    });
    rebuild(ids);
    chain.innerHTML = path.nodes.map(function (id, index) {
      var relation = "";
      if (index > 0) {
        var edge = edgeById[path.edges[index - 1]];
        relation = edge ? "<span class=\"g-rel\">" + escapeHtml(prettyType(edge.type)) + "</span>" : "";
      }
      return relation + "<button type=\"button\" class=\"g-jump\" data-id=\"" + escapeHtml(id) + "\">" +
        escapeHtml(byId[id] ? byId[id].label : id) + "</button>";
    }).join("");
    selected = to;
    renderDetail(to);
  }

  function boot() {
    resize();
    rebuild(initialIds());
    fillSelects();
    document.getElementById("gTypes").innerHTML = TYPES.map(function (type) {
      return "<label><input type=\"checkbox\" data-type=\"" + escapeHtml(type.id) + "\" checked>" +
        "<i class=\"g-type-dot\" style=\"--dot:" + (COLORS[type.id] || "#64748B") + "\"></i>" +
        escapeHtml(type.label) + "<span>" + type.count + "</span></label>";
    }).join("");
    document.getElementById("gLegend").innerHTML = TYPES.slice(0, 5).map(function (type) {
      return "<span><i class=\"g-type-dot\" style=\"--dot:" + (COLORS[type.id] || "#64748B") +
        "\"></i>" + escapeHtml(type.label) + "</span>";
    }).join("") +
      "<span>supports</span><span>precedes</span><span>contradicts</span><span>aligned to · in trend · mentions</span>";
    document.getElementById("gPresets").innerHTML =
      "<button type=\"button\" id=\"gReset\">Overview</button>" +
      "<button type=\"button\" id=\"gTrust\">Reviewed only</button>" +
      "<button type=\"button\" id=\"gProvisional\" aria-pressed=\"" + (showProvisional ? "true" : "false") + "\">" +
      (showProvisional ? "Hide AI-provisional verbs" : "Show AI-provisional verbs") + "</button>";
    document.getElementById("gReset").addEventListener("click", function () {
      selected = null;
      pathNodeIds = {};
      pathEdgeIds = {};
      rebuild(initialIds());
      renderDetail(null);
      setTimeout(fitView, 450);
    });
    document.getElementById("gTrust").addEventListener("click", function () {
      var ids = {};
      edges.filter(function (edge) {
        return edge.review_status === "human_reviewed";
      }).slice(0, 90).forEach(function (edge) {
        ids[edge.source] = true;
        ids[edge.target] = true;
      });
      rebuild(ids);
      setTimeout(fitView, 450);
    });
    document.getElementById("gProvisional").addEventListener("click", function () {
      showProvisional = !showProvisional;
      var button = document.getElementById("gProvisional");
      button.setAttribute("aria-pressed", showProvisional ? "true" : "false");
      button.textContent = showProvisional ? "Hide AI-provisional verbs" : "Show AI-provisional verbs";
      if (showProvisional) {
        if (!/[?#&]provisional=1/.test(location.hash)) {
          location.hash = (location.hash ? location.hash.replace(/#$/, "") + "&" : "#") + "provisional=1";
        }
      } else {
        location.hash = location.hash.replace(/&?provisional=1/, "").replace(/^#&/, "#");
      }
      rebuild(activeIds);
      setTimeout(fitView, 450);
    });
    document.getElementById("gSearch").addEventListener("input", function (event) {
      query = event.target.value;
      selected = null;
      rebuild(searchIds(query));
      renderSearchResults(query);
    });
    document.getElementById("gTypes").addEventListener("change", function (event) {
      if (!event.target.dataset.type) return;
      enabled[event.target.dataset.type] = event.target.checked;
      rebuild(activeIds);
    });
    document.getElementById("gGo").addEventListener("click", function () {
      runPath(document.getElementById("gFrom").value, document.getElementById("gTo").value);
    });
    document.getElementById("gDetailClose").addEventListener("click", closeDetail);
    document.getElementById("gFit").addEventListener("click", fitView);
    var spinBtn = document.getElementById("gSpin");
    function setSpin(on) {
      spin = on && !reduced;
      if (!spinBtn) return;
      spinBtn.textContent = spin ? "Pause spin" : "Resume spin";
      spinBtn.setAttribute("aria-pressed", spin ? "true" : "false");
    }
    if (spinBtn) {
      setSpin(spin);
      spinBtn.addEventListener("click", function () { setSpin(!spin); });
    }
    document.getElementById("gZoomIn").addEventListener("click", function () {
      camera.scale = Math.min(2.6, camera.scale * 1.18);
    });
    document.getElementById("gZoomOut").addEventListener("click", function () {
      camera.scale = Math.max(0.5, camera.scale / 1.18);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && !/input|select|textarea/i.test(document.activeElement.tagName)) {
        event.preventDefault();
        document.getElementById("gSearch").focus();
      }
      if (event.key === "Escape") closeDetail();
    });
    document.body.addEventListener("click", function (event) {
      var button = event.target.closest(".g-jump");
      if (button) select(button.dataset.id, true);
    });
    canvas.addEventListener("pointerenter", function () { pointerIn = true; });
    canvas.addEventListener("pointerdown", function (event) {
      dragging = true;
      moved = false;
      lx = event.clientX;
      ly = event.clientY;
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", function (event) {
      pointerIn = true;
      var box = canvas.getBoundingClientRect();
      var mx = event.clientX - box.left;
      var my = event.clientY - box.top;
      if (dragging) {
        var dx = event.clientX - lx;
        var dy = event.clientY - ly;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        ty += dx * 0.005;
        tx = Math.max(-1.2, Math.min(1.2, tx + dy * 0.004));
        lx = event.clientX;
        ly = event.clientY;
        var tip = document.getElementById("gTip");
        if (tip) tip.hidden = true;
        return;
      }
      hovered = hit(mx, my);
      hoveredEdge = hovered ? null : hitEdge(mx, my);
      canvas.style.cursor = hovered || hoveredEdge ? "pointer" : "grab";
      updateTip(mx, my);
    });
    canvas.addEventListener("pointerup", function (event) {
      dragging = false;
      canvas.style.cursor = "grab";
      if (!moved) {
        var box = canvas.getBoundingClientRect();
        var id = hit(event.clientX - box.left, event.clientY - box.top);
        if (id) select(id, true);
      }
    });
    canvas.addEventListener("pointerleave", function () {
      pointerIn = false;
      hovered = null;
      hoveredEdge = null;
      var tip = document.getElementById("gTip");
      if (tip) tip.hidden = true;
      if (!dragging) canvas.style.cursor = "grab";
    });
    canvas.addEventListener("wheel", function (event) {
      event.preventDefault();
      camera.scale = Math.max(0.5, Math.min(2.6, camera.scale * (event.deltaY < 0 ? 1.1 : 0.9)));
    }, { passive: false });
    window.addEventListener("resize", function () {
      resize();
      rebuild(activeIds);
    });
    var hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (hash.get("node")) select(hash.get("node"), false);
    else renderDetail(null);
    setTimeout(fitView, 550);
    loop();
  }

  boot();
})();
