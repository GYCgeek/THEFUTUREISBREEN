/* Ask the Graph — in-browser, grounded assistant for the New Alignment IGS.
 *
 * Classic script (no build step). Exposes window.IGS_ASK and auto-mounts into
 * #ask-root. WebLLM is loaded lazily (dynamic import from CDN) only when the
 * user chooses to load the on-device model, so the widget — retrieval, prompt,
 * citations, and the no-WebGPU handoff fallback — works even if the model or
 * its CDN is unavailable.
 *
 * Depends on (loaded before this, as classic scripts):
 *   graph-index.js  -> window.IGS_ASK_INDEX
 *   retriever.js    -> window.IGS_RETRIEVER.search(query, k)
 */
(function () {
  "use strict";

  /* Prefer the discrete / high-performance GPU when the browser exposes a choice.
     Many dual-GPU machines default WebGPU to the low-power integrated GPU, whose
     small memory budget can't hold a 1B+ model (the device is then "lost"). This
     only helps when the browser actually surfaces the discrete GPU to WebGPU; if
     it doesn't, route the browser to it at the OS level (Windows Graphics
     settings) — see the GPU-memory error card below. */
  (function preferHighPerfGPU() {
    try {
      var g = (typeof navigator !== "undefined") && navigator.gpu;
      if (g && g.requestAdapter && !g.__igsHighPerf) {
        var orig = g.requestAdapter.bind(g);
        g.requestAdapter = function (opts) {
          opts = opts || {};
          if (!opts.powerPreference) opts.powerPreference = "high-performance";
          return orig(opts);
        };
        g.__igsHighPerf = true;
      }
    } catch (e) {}
  })();

  /* ---- config (ASK_MODEL_ID is the single swap point → MiniCPM later) ---- */
  var _params = (function () {
    try { return new URLSearchParams(location.search); }
    catch (e) { return { get: function () { return null; } }; }
  })();
  var ASK_MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"; // interim prebuilt model
  /* Lighter model for GPUs that can't hold the default (e.g. low-VRAM integrated GPUs). */
  var FALLBACK_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
  /* ?model=<id> overrides the model (also accepts ?model=small for the fallback),
     handy for A/B testing models or pointing at a self-hosted build. */
  var _modelParam = _params.get("model");
  if (_modelParam === "small") ASK_MODEL_ID = FALLBACK_MODEL_ID;
  else if (_modelParam) ASK_MODEL_ID = _modelParam;
  var USING_FALLBACK_MODEL = ASK_MODEL_ID === FALLBACK_MODEL_ID;
  /* For a self-hosted model (e.g. compiled MiniCPM5-1B) set ASK_APP_CONFIG to
     { model_list: [ {model, model_id, model_lib, vram_required_MB, ...} ] } and
     point ASK_MODEL_ID at that model_id. Prebuilt models stay available.
     See ask/minicpm-appconfig.md. Null = use WebLLM's prebuilt list only. */
  var ASK_APP_CONFIG = null;
  var WEBLLM_CDN = "https://esm.run/@mlc-ai/web-llm";
  var TOP_K = 6;
  var GRAPH_HREF = "./graph.html";
  var MCP_URL = "https://new-alignment-igs-production.up.railway.app/mcp";
  var HANDOFF_URL = "https://new-alignment-igs-production.up.railway.app/handoff";
  var NODE_TYPES = { person: 1, org: 1, work: 1, theme: 1, hub: 1, wg: 1, network: 1 };

  var SYSTEM_PROMPT =
    "You are the research assistant for The New Alignment \"Intergenerational Justice and Solidarity\" " +
    "working group. Answer the user's question using ONLY the numbered CONTEXT provided. " +
    "Every factual claim must come from the context — do not use outside knowledge and do not guess. " +
    "Cite the context you use inline with bracketed numbers like [1] or [2]. " +
    "If the answer is not in the context, say plainly that the graph doesn't cover it. " +
    "Prefer documented ties (marked with evidence and a confidence like high/medium) over thematic " +
    "adjacency, and make clear which is which. Be concise and specific; name people and institutions.";

  /* ---- utilities ---- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function detectWebGPU() {
    return typeof navigator !== "undefined" && !!navigator.gpu;
  }
  /* Real capability check: navigator.gpu can exist as a stub with no working
     adapter (some headless/embedded browsers), so actually request one. */
  function supportsWebGPU() {
    if (typeof navigator === "undefined" || !navigator.gpu) return Promise.resolve(false);
    try {
      return navigator.gpu.requestAdapter().then(function (a) { return !!a; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  function retrieve(query, k) {
    var R = window.IGS_RETRIEVER;
    return R && R.search ? R.search(query, k || TOP_K) : [];
  }
  function buildContext(cards) {
    return cards.map(function (c, i) {
      var src = (c.sources || []).map(function (s) { return s.title; }).filter(Boolean).join("; ");
      return "[" + (i + 1) + "] " + c.text + (src ? " (sources: " + src + ")" : "");
    }).join("\n\n");
  }
  function buildMessages(query, cards) {
    return [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content:
        "CONTEXT:\n" + buildContext(cards) +
        "\n\nQUESTION: " + query +
        "\n\nAnswer using only the context above, citing sources inline as [n]." }
    ];
  }

  /* ---- WebLLM engine (lazy) ---- */
  var engine = null;
  function loadEngine(onProgress) {
    if (engine) return Promise.resolve(engine);
    return import(WEBLLM_CDN).then(function (webllm) {
      var cfg = { initProgressCallback: onProgress };
      if (ASK_APP_CONFIG && ASK_APP_CONFIG.model_list) {
        var prebuilt = (webllm.prebuiltAppConfig && webllm.prebuiltAppConfig.model_list) || [];
        cfg.appConfig = { model_list: prebuilt.concat(ASK_APP_CONFIG.model_list) };
      }
      return webllm.CreateMLCEngine(ASK_MODEL_ID, cfg);
    }).then(function (eng) { engine = eng; return eng; });
  }
  function generate(messages, onToken) {
    return engine.chat.completions.create({
      messages: messages, temperature: 0.2, stream: true
    }).then(function (stream) {
      return (async function () {
        var full = "";
        for await (var chunk of stream) {
          var d = (chunk.choices && chunk.choices[0] && chunk.choices[0].delta.content) || "";
          if (d) { full += d; onToken(full); }
        }
        return full;
      })();
    });
  }

  /* ---- rendering ---- */
  function graphLink(card) {
    if (card.type === "bridge") return GRAPH_HREF + "#view=bridges";
    if (NODE_TYPES[card.type]) return GRAPH_HREF + "#node=" + encodeURIComponent(card.id);
    return null;
  }
  function sourcesHtml(cards, jump) {
    var rows = cards.map(function (c, i) {
      var links = (c.sources || []).map(function (s) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title || s.url) + "</a>";
      });
      /* jump = the host page can select nodes in-place (e.g. inside graph.html):
         render a button that calls opts.onNode instead of linking to a new tab. */
      if (jump && NODE_TYPES[c.type]) {
        links.unshift('<button class="ask-graphjump" data-id="' + esc(c.id) + '">view in graph →</button>');
      } else {
        var gl = graphLink(c);
        if (gl) links.unshift('<a href="' + gl + '" target="_blank" rel="noopener">view in graph ↗</a>');
      }
      return '<li id="ask-src-' + (i + 1) + '"><span class="n">[' + (i + 1) + ']</span> ' +
        '<span class="lbl">' + esc(c.label) + '</span> <span class="ty">' + esc(c.type) + '</span>' +
        (links.length ? '<div class="lk">' + links.join(" · ") + "</div>" : "") + "</li>";
    });
    return '<div class="ask-sources"><div class="ask-sources-h">Grounded in</div><ol>' + rows.join("") + "</ol></div>";
  }
  function linkifyCitations(answerText) {
    return esc(answerText).replace(/\[(\d+)\]/g, function (m, n) {
      return '<a class="ask-cite" href="#ask-src-' + n + '">[' + n + "]</a>";
    });
  }

  /* ---- widget ---- */
  function mount(root, opts) {
    opts = opts || {};
    root.classList.add("ask-widget");
    root.innerHTML =
      '<div class="ask-head">' +
        '<div class="ask-title">Ask the graph</div>' +
        '<div class="ask-sub">On-device AI over the Intergenerational Justice &amp; Solidarity network. ' +
          'Answers are grounded in the graph and cite their sources.</div>' +
      "</div>" +
      '<div class="ask-transcript" id="ask-transcript"></div>' +
      '<div class="ask-foot" id="ask-foot"></div>';

    var transcript = root.querySelector("#ask-transcript");
    var foot = root.querySelector("#ask-foot");
    transcript.innerHTML = '<div class="ask-intro"><p style="color:var(--dim)">Checking your browser for WebGPU…</p></div>';

    supportsWebGPU().then(function (ok) {
      if (!ok) {
        transcript.innerHTML = handoffCard();
        foot.innerHTML = "";
        wireHandoff(root);
        return;
      }
      renderChat();
    });

    function renderChat() {
    /* intro + examples */
    transcript.innerHTML =
      '<div class="ask-intro">' +
        "<p>Ask a question about the members, their ties, works, themes, or the latent bridges " +
        "between them. The model runs entirely in your browser — nothing is sent to a server.</p>" +
        '<div class="ask-chips">' +
          chip("Who are the co-chairs and what do they bring?") +
          chip("How is Ledama Olekina connected to the others?") +
          chip("Which members have no ties in the group yet?") +
          chip("Who could Byeongwon Park work with, and why?") +
          chip("Where is the group thin on coverage?") +
        "</div>" +
      "</div>";

    foot.innerHTML =
      '<div class="ask-note" id="ask-note">First question loads the on-device model once ' +
        '(~1&nbsp;GB, then cached &amp; offline). Chrome or Edge on desktop recommended.</div>' +
      '<div class="ask-progress" id="ask-progress" hidden><div class="bar"><i id="ask-bar"></i></div>' +
        '<span id="ask-progress-t"></span></div>' +
      '<div class="ask-composer">' +
        '<textarea id="ask-input" rows="1" placeholder="Ask about the network…"></textarea>' +
        '<button id="ask-send" aria-label="Send">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        "</button>" +
      "</div>";

    var input = root.querySelector("#ask-input");
    var sendBtn = root.querySelector("#ask-send");
    var busy = false;

    root.querySelectorAll(".ask-chip").forEach(function (c) {
      c.addEventListener("click", function () { input.value = c.textContent; input.focus(); });
    });
    input.addEventListener("input", function () {
      input.style.height = "auto"; input.style.height = Math.min(120, input.scrollHeight) + "px";
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    sendBtn.addEventListener("click", send);

    function progress(p) {
      var wrap = root.querySelector("#ask-progress");
      var bar = root.querySelector("#ask-bar");
      var t = root.querySelector("#ask-progress-t");
      wrap.hidden = false;
      var pct = Math.round((p && p.progress ? p.progress : 0) * 100);
      bar.style.width = pct + "%";
      t.textContent = (p && p.text ? p.text : "Loading model…") + (pct ? " (" + pct + "%)" : "");
    }

    function send() {
      if (busy) return;
      var q = (input.value || "").trim();
      if (!q) return;
      var intro = root.querySelector(".ask-intro");
      if (intro) intro.remove();
      addMsg("user", esc(q));
      input.value = ""; input.style.height = "auto";
      busy = true; sendBtn.disabled = true;

      var cards = retrieve(q);
      var ansEl = addMsg("assistant", '<span class="ask-typing">…</span>');
      var body = ansEl.querySelector(".ask-md");

      var ready = engine ? Promise.resolve(engine) : (function () {
        root.querySelector("#ask-note").hidden = true;
        return loadEngine(progress).then(function (e) {
          root.querySelector("#ask-progress").hidden = true;
          return e;
        });
      })();

      ready.then(function () {
        var messages = buildMessages(q, cards);
        return generate(messages, function (full) { body.textContent = full; scroll(); });
      }).then(function (full) {
        body.innerHTML = linkifyCitations(full) + sourcesHtml(cards, !!opts.onNode);
        if (opts.onNode) body.querySelectorAll(".ask-graphjump").forEach(function (b) {
          b.addEventListener("click", function () { opts.onNode(b.getAttribute("data-id")); });
        });
        scroll();
      }).catch(function (err) {
        var msg = (err && err.message) || String(err);
        /* Device-loss / OOM surfaces under many messages (device lost, disposed,
           DEVICE_REMOVED, mapAsync/GPUBuffer unmapped, createBuffer, adapter…). */
        if (/lost|dispose|out of memory|device[_ ]?removed|createbuffer|requestdevice|oom|\bgpu|mapasync|unmapped|webgpu|adapter|d3d12|dxgi/i.test(msg)) {
          body.innerHTML = gpuMemoryHtml(msg);
          wireHandoff(root);
          var rb = body.querySelector(".ask-retry-small");
          if (rb) rb.addEventListener("click", function () {
            try { var u = new URL(location.href); u.searchParams.set("model", "small"); location.href = u.toString(); }
            catch (e) { location.search = "?model=small"; }
          });
        } else {
          body.innerHTML = '<span class="ask-err">Could not run the model: ' + esc(msg) + ".</span> " + inlineHandoff();
          wireHandoff(root);
        }
      }).then(function () {
        busy = false; sendBtn.disabled = false; input.focus();
      });
    }

    function addMsg(role, html) {
      var el = document.createElement("div");
      el.className = "ask-msg ask-" + role;
      el.innerHTML = role === "assistant"
        ? '<div class="ask-avatar">IGS</div><div class="ask-md">' + html + "</div>"
        : '<div class="ask-md">' + html + "</div>";
      transcript.appendChild(el); scroll();
      return el;
    }
    function scroll() { transcript.scrollTop = transcript.scrollHeight; }
    } /* renderChat */
  }

  function chip(q) { return '<button class="ask-chip">' + esc(q) + "</button>"; }

  function gpuMemoryHtml(detail) {
    return '<div class="ask-handoff">' +
      '<div class="ask-handoff-h">The GPU ran out of memory</div>' +
      "<p>The on-device model was too large for the GPU your browser used" +
      (USING_FALLBACK_MODEL ? ""
        : " — often a low-memory <em>integrated</em> GPU on a machine that also has a faster discrete GPU") +
      ".</p>" +
      (detail ? '<p class="hint">Technical detail: ' + esc(detail) + "</p>" : "") +
      (USING_FALLBACK_MODEL ? ""
        : '<p><button class="ask-copy ask-retry-small">Reload with a smaller model</button></p>' +
          '<p class="hint">Or route your browser to the discrete GPU: Windows → Settings → System → ' +
          'Display → Graphics → add your browser → <b>High performance</b>, then fully restart the browser. ' +
          "Confirm it took at <code>chrome://gpu</code> (look for the NVIDIA/AMD discrete adapter).</p>") +
      "<p>You can also hand this network to your own AI agent instead:</p>" +
      inlineHandoff() + "</div>";
  }

  function handoffCard() {
    return '<div class="ask-handoff">' +
      '<div class="ask-handoff-h">Your browser can’t run the on-device model</div>' +
      "<p>The in-browser assistant needs WebGPU (Chrome or Edge on desktop). " +
      "Instead, hand this network to your own AI agent — it connects to the live " +
      "IGS knowledge server and can read the graph <em>and</em> contribute to it.</p>" +
      inlineHandoff() + "</div>";
  }
  function inlineHandoff() {
    return '<div class="ask-handoff-box">' +
      '<div class="row"><span class="k">MCP</span><code id="ask-mcp">' + esc(MCP_URL) + "</code>" +
        '<button class="ask-copy" data-copy="' + esc(MCP_URL) + '">Copy</button></div>' +
      '<div class="row"><a href="' + esc(HANDOFF_URL) + '" target="_blank" rel="noopener">Open the full connection handoff ↗</a></div>' +
      '<div class="hint">Works with Claude Desktop, Claude Code, Cursor, or any Streamable-HTTP MCP client (Bearer token required).</div>' +
      "</div>";
  }
  function wireHandoff(root) {
    root.querySelectorAll(".ask-copy").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-copy");
        if (navigator.clipboard) navigator.clipboard.writeText(v).then(function () {
          var t = b.textContent; b.textContent = "Copied"; setTimeout(function () { b.textContent = t; }, 1400);
        });
      });
    });
  }

  window.IGS_ASK = {
    ASK_MODEL_ID: ASK_MODEL_ID,
    detectWebGPU: detectWebGPU,
    retrieve: retrieve,
    buildContext: buildContext,
    buildMessages: buildMessages,
    linkifyCitations: linkifyCitations,
    mount: mount
  };

  if (document.readyState !== "loading") tryMount();
  else document.addEventListener("DOMContentLoaded", tryMount);
  function tryMount() {
    var el = document.getElementById("ask-root");
    if (el) mount(el, {});
  }
})();
