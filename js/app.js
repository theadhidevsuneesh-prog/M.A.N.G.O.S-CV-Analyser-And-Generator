/* M.A.N.G.O.S — UI controller */
(function () {
  "use strict";
  const M = window.MANGOS, A = M.Analyzer, G = M.Generator;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = G.esc;
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const store = {
    get(k, d) { try { const v = localStorage.getItem("mangos." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("mangos." + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
    del(k) { try { localStorage.removeItem("mangos." + k); } catch (e) { /* ignore */ } }
  };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const scoreColor = (r) => (r >= 0.7 ? "var(--good)" : r >= 0.45 ? "var(--warn)" : "var(--bad)");

  function normalizeCv(o) {
    const d = G.empty();
    if (!o || typeof o !== "object") return d;
    const s = (v) => (typeof v === "string" ? v : "");
    Object.keys(d.basics).forEach((k) => (d.basics[k] = s(o.basics && o.basics[k])));
    d.summary = s(o.summary); d.certifications = s(o.certifications); d.achievements = s(o.achievements);
    ["experience", "projects", "education", "skills"].forEach((kind) => {
      d[kind] = (Array.isArray(o[kind]) ? o[kind] : []).map((it) => {
        const t = G.emptyItem[kind]();
        Object.keys(t).forEach((k) => (t[k] = s(it && it[k])));
        return t;
      });
    });
    return d;
  }

  const stored = store.get("cv", null);
  const state = {
    cv: stored ? normalizeCv(stored) : G.sample(),
    template: store.get("template", "classic"),
    accent: store.get("accent", "#d97706"),
    tailor: Object.assign({ company: "", role: "swe", apply: true, highlight: true }, store.get("tailor", {})),
    ats: store.get("ats", true),
    analysis: null, rankings: null, role: store.get("analyserRole", "swe"), aiKey: ""
  };
  const persist = () => {
    store.set("cv", state.cv);
    const s = $("#saveState");
    if (s) s.textContent = "Saved ✓ " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    meterSoon();
  };

  /* ---------- friendly feedback: toasts, confirm dialog, undo ---------- */
  function toast(msg, o = {}) {
    const el = document.createElement("div");
    el.className = "toast " + (o.type || "");
    el.innerHTML = `<span>${esc(msg)}</span>`;
    if (o.action) {
      const b = document.createElement("button");
      b.className = "btn small";
      b.textContent = o.action.label;
      b.addEventListener("click", () => { o.action.fn(); el.remove(); });
      el.appendChild(b);
    }
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), o.ms || (o.action ? 8000 : 3800));
  }
  function ask(message, o = {}) {
    return new Promise((resolve) => {
      const modal = $("#modal"), ok = $("#modalOk"), cancel = $("#modalCancel");
      $("#modalMsg").textContent = message;
      ok.textContent = o.ok || "Confirm";
      ok.className = "btn " + (o.danger ? "danger-solid" : "primary");
      modal.hidden = false;
      ok.focus();
      const done = (v) => {
        modal.hidden = true;
        ok.removeEventListener("click", yes); cancel.removeEventListener("click", no);
        modal.removeEventListener("click", bg); document.removeEventListener("keydown", key);
        resolve(v);
      };
      const yes = () => done(true), no = () => done(false);
      const bg = (e) => { if (e.target === modal) done(false); };
      const key = (e) => { if (e.key === "Escape") done(false); };
      ok.addEventListener("click", yes); cancel.addEventListener("click", no);
      modal.addEventListener("click", bg); document.addEventListener("keydown", key);
    });
  }
  /** snapshot the CV so a destructive action can be undone from a toast */
  function withUndo(label, fn) {
    const snap = JSON.stringify(state.cv);
    fn();
    persist(); renderForm(); renderPreview();
    toast(label, { action: { label: "Undo", fn: () => { state.cv = normalizeCv(JSON.parse(snap)); persist(); renderForm(); renderPreview(); toast("Restored."); } } });
  }

  /* ============================== tabs / theme ============================== */
  function showView(name) {
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    store.set("view", name);
    window.scrollTo({ top: 0 });
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));
  const setTheme = (t) => { document.documentElement.dataset.theme = t; store.set("theme", t); };
  setTheme(store.get("theme", window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  $("#themeBtn").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#cv-css").textContent = G.CSS;

  /* ============================== BUILDER: form ============================== */
  const inp = (label, path, val, o = {}) =>
    `<label class="f ${o.cls || ""}"><span>${label}</span><input type="${o.type || "text"}" data-path="${path}" value="${esc(val)}" placeholder="${esc(o.ph || "")}" autocomplete="off"></label>`;
  const area = (label, path, val, rows, ph) =>
    `<label class="f"><span>${label}</span><textarea rows="${rows}" data-path="${path}" placeholder="${esc(ph || "")}">${esc(val)}</textarea></label>`;
  const card = (kind, i, n, title, inner) =>
    `<div class="card-item"><div class="card-h"><b>${esc(title || "Untitled")}</b><span class="btns">
      <button class="btn small ghost" data-act="up" data-kind="${kind}" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Move up">↑</button>
      <button class="btn small ghost" data-act="down" data-kind="${kind}" data-i="${i}" ${i === n - 1 ? "disabled" : ""} title="Move down">↓</button>
      <button class="btn small ghost danger" data-act="del" data-kind="${kind}" data-i="${i}" title="Remove">✕</button></span></div>${inner}</div>`;
  const addBtn = (kind, label) => `<button class="btn" data-act="add" data-kind="${kind}">＋ ${label}</button>`;

  function renderForm() {
    const open = {};
    $$("#formRoot details.sec").forEach((d) => (open[d.dataset.sec] = d.open));
    const isOpen = (k, def) => (k in open ? open[k] : def);
    const c = state.cv, b = c.basics;
    const sec = (key, title, body, def) => `<details class="sec" data-sec="${key}" ${isOpen(key, def) ? "open" : ""}><summary>${title}</summary><div class="sec-body">${body}</div></details>`;

    const basics = `<div class="grid2">${inp("Full name", "basics.name", b.name, { ph: "Alex Morgan" })}${inp("Headline / target role", "basics.title", b.title, { ph: "Senior Backend Engineer" })}
      ${inp("Email", "basics.email", b.email, { type: "email" })}${inp("Phone", "basics.phone", b.phone)}
      ${inp("Location", "basics.location", b.location, { ph: "City, Country" })}${inp("LinkedIn", "basics.linkedin", b.linkedin, { ph: "linkedin.com/in/…" })}
      ${inp("GitHub", "basics.github", b.github, { ph: "github.com/…" })}${inp("Website / portfolio", "basics.website", b.website)}</div>`;
    const summary = area("2–3 lines: who you are, your strongest proof", "summary", c.summary, 4, "Backend engineer with N years building … Cut latency 60% …") +
      `<div class="hint">Tip: use the Tailor panel to generate a starter summary for your target company.</div>`;
    const exp = c.experience.map((e, i) => card("experience", i, c.experience.length, [e.role, e.company].filter(Boolean).join(" @ "),
      `<div class="grid2">${inp("Job title", `experience.${i}.role`, e.role)}${inp("Company", `experience.${i}.company`, e.company)}
       ${inp("Start", `experience.${i}.start`, e.start, { ph: "Jan 2021" })}${inp("End", `experience.${i}.end`, e.end, { ph: "Present" })}</div>
       ${inp("Location", `experience.${i}.location`, e.location)}
       ${area("Achievements (one per line)", `experience.${i}.bullets`, e.bullets, 6, "Reduced p99 latency 62% (480ms → 180ms) by …")}
       <div class="hint">${bulletHint(e.bullets)}</div>`)).join("") + addBtn("experience", "Add experience");
    const proj = c.projects.map((p, i) => card("projects", i, c.projects.length, p.name,
      `<div class="grid2">${inp("Project name", `projects.${i}.name`, p.name)}${inp("Link", `projects.${i}.link`, p.link, { ph: "github.com/you/repo" })}</div>
       ${inp("Stack", `projects.${i}.stack`, p.stack, { ph: "Go, Redis, Docker" })}
       ${area("What it does + proof (one per line)", `projects.${i}.bullets`, p.bullets, 4)}
       <div class="hint">${bulletHint(p.bullets)}</div>`)).join("") + addBtn("projects", "Add project");
    const edu = c.education.map((e, i) => card("education", i, c.education.length, e.degree || e.school,
      `<div class="grid2">${inp("Degree", `education.${i}.degree`, e.degree)}${inp("School", `education.${i}.school`, e.school)}
       ${inp("Start", `education.${i}.start`, e.start)}${inp("End", `education.${i}.end`, e.end)}</div>
       ${inp("Details (GPA, honours)", `education.${i}.detail`, e.detail)}`)).join("") + addBtn("education", "Add education");
    const skills = c.skills.map((s, i) => card("skills", i, c.skills.length, s.group,
      `${inp("Group", `skills.${i}.group`, s.group, { ph: "Languages" })}${inp("Skills (comma separated)", `skills.${i}.items`, s.items, { ph: "Java, Go, Python" })}`)).join("") + addBtn("skills", "Add skill group") +
      `<div class="hint">Group skills by area. Skip percentage bars and star ratings — ATS can't parse them and they say nothing.</div>`;
    const other = area("Certifications (one per line)", "certifications", c.certifications, 3) + area("Achievements / awards (one per line)", "achievements", c.achievements, 3);

    $("#formRoot").innerHTML =
      sec("basics", "👤 Basics", basics, true) + sec("summary", "📝 Summary", summary, true) + sec("exp", `💼 Experience (${c.experience.length})`, exp, true) +
      sec("proj", `🛠 Projects (${c.projects.length})`, proj, false) + sec("edu", `🎓 Education (${c.education.length})`, edu, false) +
      sec("skills", `⚙ Skills (${c.skills.length})`, skills, false) + sec("other", "🏅 Certifications & awards", other, false);
  }

  function bulletHint(text) {
    const l = String(text || "").split(/\n/).map((x) => x.trim()).filter(Boolean);
    if (!l.length) return "Start each line with a strong verb and end with a measurable result.";
    const m = l.filter((x) => A.hasMetric(x)).length;
    return `${l.length} bullet${l.length > 1 ? "s" : ""} · ${m} with numbers ${m / l.length >= 0.5 ? "✓" : "— aim for at least half"}`;
  }

  function setPath(obj, path, val) {
    const k = path.split(".");
    let o = obj;
    for (let i = 0; i < k.length - 1; i++) o = o[k[i]];
    o[k[k.length - 1]] = val;
  }

  $("#formRoot").addEventListener("input", (e) => {
    const p = e.target.dataset && e.target.dataset.path;
    if (!p) return;
    setPath(state.cv, p, e.target.value);
    persist();
    previewSoon();
    if (e.target.closest(".card-item")) {
      const h = e.target.closest(".card-item").querySelector(".hint");
      if (h && /bullets$/.test(p)) h.textContent = bulletHint(e.target.value);
    }
  });
  $("#formRoot").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const { act, kind } = btn.dataset, i = +btn.dataset.i;
    const arr = state.cv[kind];
    if (act === "del") { withUndo("Entry removed.", () => arr.splice(i, 1)); return; }
    if (act === "add") arr.push(G.emptyItem[kind]());
    if (act === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    if (act === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
    persist(); renderForm(); renderPreview();
    if (act === "add") {
      const cards = $$(`#formRoot [data-path^="${kind}.${arr.length - 1}."]`);
      if (cards[0]) cards[0].focus();
    }
  });

  /* ---------- completeness meter ---------- */
  function renderMeter() {
    const c = state.cv, b = c.basics;
    const bulletsOk = c.experience.some((e) => e.bullets.split("\n").filter((l) => l.trim()).length >= 2);
    const items = [
      ["Name", !!b.name.trim(), "basics"], ["Email & phone", !!(b.email.trim() && b.phone.trim()), "basics"],
      ["Headline", !!b.title.trim(), "basics"], ["Summary", c.summary.trim().length > 40, "summary"],
      ["Experience with 2+ bullets", bulletsOk, "exp"], ["Education", c.education.some((e) => e.school.trim() || e.degree.trim()), "edu"],
      ["6+ skills", c.skills.reduce((n, s) => n + s.items.split(",").filter((x) => x.trim()).length, 0) >= 6, "skills"],
      ["LinkedIn or GitHub", !!(b.linkedin.trim() || b.github.trim()), "basics"], ["A project", c.projects.some((p) => p.name.trim()), "proj"]
    ];
    const done = items.filter((x) => x[1]).length, pct = Math.round((done / items.length) * 100);
    const todo = items.filter((x) => !x[1]);
    $("#meter").innerHTML = `<div class="meter-h"><b>CV completeness</b><span style="color:${scoreColor(pct / 100)}"><b>${pct}%</b></span></div>
      <div class="bar"><i style="width:${pct}%;background:${scoreColor(pct / 100)}"></i></div>
      ${todo.length ? `<div class="hint" style="margin-bottom:6px">Still to add — click to jump:</div><div class="chips">${todo.map((x) => `<span class="chip warn" data-jump="${x[2]}">${esc(x[0])}</span>`).join("")}</div>` : '<div class="hint">All the essentials are in. Now polish the bullets and run the ATS check →</div>'}`;
  }
  const meterSoon = debounce(renderMeter, 150);
  $("#meter").addEventListener("click", (e) => {
    const j = e.target.closest("[data-jump]");
    if (!j) return;
    const d = $(`#formRoot details[data-sec="${j.dataset.jump}"]`);
    if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); const f = d.querySelector("input,textarea"); if (f) setTimeout(() => f.focus(), 250); }
  });

  /* ============================== BUILDER: preview / tailor ============================== */
  const currentTarget = () => {
    const company = M.COMPANIES.find((c) => c.id === state.tailor.company) || null;
    const terms = G.keywordTerms(company, company || state.tailor.role !== "swe" ? state.tailor.role : null);
    return { company, terms };
  };
  const currentCv = () => {
    const { terms } = currentTarget();
    return state.tailor.apply && terms.length ? G.tailor(state.cv, terms) : state.cv;
  };

  function renderPreview() {
    const { terms } = currentTarget();
    const hl = state.tailor.highlight && terms.length
      ? new RegExp(terms.map((t) => "(?:" + A.termSource(t) + ")").join("|"), "gi") : null;
    $("#cvPreview").innerHTML = G.render(currentCv(), Object.assign(renderOpts(), { highlight: hl }));
    const lock = state.ats;
    $("#tplSelect").disabled = lock; $("#accent").disabled = lock;
    $("#designHint").textContent = lock ? "🔒 Design is locked while ATS-friendly mode is on (plain, single-column, black on white)." : "Colour and layout look nicer to humans but are riskier for ATS parsers. Use ATS mode for online applications.";
    scoreSoon();
  }
  const previewSoon = debounce(renderPreview, 120);
  const renderOpts = () => ({ template: state.ats ? "ats" : state.template, accent: state.accent });

  const renderLiveScore = () => {
    const a = A.analyze(G.toText(state.cv));
    const chip = $("#liveScore");
    chip.textContent = `Honest score ${a.score}/100 · ${a.grade}`;
    chip.style.color = scoreColor(a.score / 100);
    renderTailor(a);
    renderAtsPanel(a);
  };
  const scoreSoon = debounce(renderLiveScore, 350);

  /* ---------- ATS panel ---------- */
  function renderAtsPanel(an) {
    const { company, terms } = currentTarget();
    let coverage = 0;
    if (company || terms.length) {
      const hit = terms.filter((t) => A.has(G.toText(state.cv).toLowerCase(), t)).length;
      coverage = terms.length ? hit / terms.length : 0;
    }
    const checks = G.atsCheck(state.cv, { atsMode: state.ats, hasTarget: terms.length > 0, coverage });
    const bad = checks.filter((c) => !c.ok), fixable = bad.filter((c) => c.fixable && c.id !== "layout");
    const p = $("#atsPanel");
    p.classList.toggle("off", !state.ats);
    p.innerHTML = `
      <div class="panel-h">
        <label class="switch"><input type="checkbox" id="atsToggle" ${state.ats ? "checked" : ""}><span class="track"></span><span>ATS-friendly mode</span></label>
        <span class="chip ${bad.length ? "warn" : "good"}" style="cursor:default">${checks.length - bad.length}/${checks.length} ATS checks passed</span>
      </div>
      <div class="hint">${state.ats ? "Plain single-column layout with standard headings — the format applicant-tracking systems parse most reliably." : "Switch this on before applying online: it removes colours, columns and decoration that confuse parsers."}</div>
      <ul class="checks">${checks.map((c) => `<li class="${c.ok ? "ok" : "no"}"><span class="ic">${c.ok ? "✓" : "!"}</span><span>${esc(c.title)}${c.ok || !c.detail ? "" : `<small>${esc(c.detail)}</small>`}</span></li>`).join("")}</ul>
      <div class="ats-actions">
        ${fixable.length ? `<button class="btn primary" id="atsFix">✨ Fix ${fixable.length} issue${fixable.length > 1 ? "s" : ""} automatically</button>` : ""}
        <button class="btn" id="atsDocx">⬇ Download ATS .docx</button>
        <span class="hint">Auto-fix only cleans formatting (dates, symbols, skill bars) — it never changes your wording.</span>
      </div>`;
  }
  $("#atsPanel").addEventListener("change", (e) => {
    if (e.target.id !== "atsToggle") return;
    state.ats = e.target.checked; store.set("ats", state.ats);
    renderPreview();
    toast(state.ats ? "ATS-friendly mode on — exports are now plain and parser-safe." : "ATS mode off — designed layouts are enabled.");
  });
  $("#atsPanel").addEventListener("click", (e) => {
    if (e.target.id === "atsDocx") exportDocx();
    if (e.target.id === "atsFix") {
      const r = G.atsFix(state.cv);
      if (!r.changes.length) { toast("Nothing to fix."); return; }
      withUndo("Fixed: " + r.changes.join("; ") + ".", () => { state.cv = r.cv; });
    }
  });

  function chipList(items, cls, clickAttr) {
    const seen = new Set();
    items = items.filter((t) => { const k = A.label(t).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    return `<div class="chips">${items.map((t) => `<span class="chip ${cls}" ${clickAttr ? `data-add="${esc(A.label(t))}" title="Click to add to your skills (only if you genuinely have it)"` : ""}>${esc(A.label(t))}</span>`).join("")}</div>`;
  }

  function renderTailor(an) {
    const out = $("#tailorOut");
    const { company } = currentTarget();
    if (!company) {
      out.className = "tailor-out muted";
      out.innerHTML = "Pick a company to see keyword coverage, gaps, and what they look for. Tailoring only <em>reorders</em> your content — it never invents anything.";
      return;
    }
    const m = A.matchCompany(an, company, state.tailor.role);
    out.className = "tailor-out";
    out.innerHTML = `
      <div class="badges"><span class="chip" style="color:${scoreColor(m.score / 100)}">Fit with ${esc(company.name)}: ${m.score}/100 — ${esc(m.fit)}</span></div>
      <p class="muted">${esc(company.looksFor)}</p>
      <h4>Keywords you already show</h4>${m.techHit.length || m.roleHit.length ? chipList([...m.techHit, ...m.roleHit], "good") : '<span class="muted">None yet.</span>'}
      <h4>Gaps (click to add — only if it's true)</h4>${m.techMiss.length || m.roleMiss.length ? chipList([...m.techMiss.slice(0, 10), ...m.roleMiss.slice(0, 6)], "warn", true) : '<span class="muted">No gaps in this list 🎉</span>'}
      <h4>Values &amp; signals they weigh</h4>
      <ul>${m.sigHit.map((s) => `<li>✅ ${esc(s.name)}</li>`).join("")}${m.sigMiss.map((s) => `<li>⚠️ <b>${esc(s.name)}</b> — not visible yet</li>`).join("")}</ul>
      <h4>How to write for ${esc(company.name)}</h4><ul>${company.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <h4>Avoid</h4><ul>${company.avoid.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <button class="btn" id="btnSummaryDraft">✨ Insert a tailored summary starter</button>
      <span class="hint">It adds [placeholders] you must fill with real numbers.</span>`;
  }

  $("#tailorOut").addEventListener("click", async (e) => {
    const chip = e.target.closest("[data-add]");
    if (chip) {
      const skill = chip.dataset.add;
      if (!(await ask(`Add "${skill}" to your skills?\n\nOnly do this if you can genuinely discuss it in an interview.`, { ok: "Yes, I have this skill" }))) return;
      withUndo(`Added "${skill}" to Skills.`, () => {
        let grp = state.cv.skills.find((s) => s.group.toLowerCase() === "additional");
        if (!grp) { grp = { group: "Additional", items: "" }; state.cv.skills.push(grp); }
        grp.items = grp.items ? grp.items + ", " + skill : skill;
      });
    }
    if (e.target.id === "btnSummaryDraft") {
      if (state.cv.summary.trim() && !(await ask("Replace your current summary with a starter draft?", { ok: "Replace" }))) return;
      withUndo("Summary starter inserted — fill in the [placeholders].", () => { state.cv.summary = G.summaryDraft(state.cv, currentTarget().company); });
    }
  });

  function initTailorControls() {
    const cs = $("#tailorCompany");
    M.COMPANIES.forEach((c) => cs.insertAdjacentHTML("beforeend", `<option value="${c.id}">${esc(c.name)} — ${esc(c.sector)}</option>`));
    cs.value = state.tailor.company;
    [$("#tailorRole"), $("#roleSelect")].forEach((sel) => {
      Object.entries(M.ROLES).forEach(([k, r]) => sel.insertAdjacentHTML("beforeend", `<option value="${k}">${esc(r.label)}</option>`));
    });
    $("#tailorRole").value = state.tailor.role;
    $("#roleSelect").value = state.role;
    $("#tailorApply").checked = state.tailor.apply;
    $("#tailorHighlight").checked = state.tailor.highlight;
    $("#tplSelect").value = state.template;
    $("#accent").value = state.accent;
    const save = () => { store.set("tailor", state.tailor); renderPreview(); };
    cs.addEventListener("change", () => { state.tailor.company = cs.value; save(); });
    $("#tailorRole").addEventListener("change", (e) => { state.tailor.role = e.target.value; save(); });
    $("#tailorApply").addEventListener("change", (e) => { state.tailor.apply = e.target.checked; save(); });
    $("#tailorHighlight").addEventListener("change", (e) => { state.tailor.highlight = e.target.checked; save(); });
    $("#tplSelect").addEventListener("change", (e) => { state.template = e.target.value; store.set("template", state.template); renderPreview(); });
    $("#accent").addEventListener("input", (e) => { state.accent = e.target.value; store.set("accent", state.accent); previewSoon(); });
    $("#roleSelect").addEventListener("change", (e) => { state.role = e.target.value; store.set("analyserRole", state.role); });
  }

  /* ---- toolbar actions ---- */
  $("#btnSample").addEventListener("click", async () => {
    if (!(await ask("Replace the current CV with the sample?\nYou can undo this right after.", { ok: "Load sample" }))) return;
    withUndo("Sample CV loaded.", () => { state.cv = G.sample(); });
  });
  $("#btnClear").addEventListener("click", async () => {
    if (!(await ask("Clear the whole CV?\nYou can undo this right after.", { ok: "Clear everything", danger: true }))) return;
    withUndo("CV cleared.", () => { state.cv = G.empty(); });
  });
  const dl = (ext, mime, content, msg) => { G.download(G.slug(state.cv) + ext, mime, content); toast(msg || "Downloaded " + G.slug(state.cv) + ext, { type: "good" }); };
  function exportDocx() {
    // .docx is always the plain ATS layout, regardless of the on-screen design
    const bytes = G.toDocx(currentCv());
    dl(".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes);
  }
  $("#btnDocx").addEventListener("click", exportDocx);
  $("#btnPdf").addEventListener("click", () => {
    if (!G.print(currentCv(), renderOpts())) { toast("The print window was blocked — allow pop-ups for this page and try again.", { type: "bad" }); return; }
    toast("In the print dialog choose “Save as PDF” and turn off “Headers and footers”.", { ms: 7000 });
  });
  $("#btnHtml").addEventListener("click", () => dl(".html", "text/html", G.fullHtml(currentCv(), renderOpts())));
  $("#btnDoc").addEventListener("click", () => dl(".doc", "application/msword", G.fullHtml(currentCv(), renderOpts())));
  $("#btnTxt").addEventListener("click", () => dl(".txt", "text/plain", G.toText(currentCv())));
  $("#btnJson").addEventListener("click", () => dl(".mangos.json", "application/json", JSON.stringify({ app: "M.A.N.G.O.S", version: 1, cv: state.cv }, null, 2), "Data file saved — use “Load my data” to restore it."));
  $("#importJson").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      withUndo("Data loaded.", () => { state.cv = normalizeCv(o.cv || o); });
    } catch (err) { toast("That file isn't valid M.A.N.G.O.S data.", { type: "bad" }); }
  });
  $("#btnToAnalyser").addEventListener("click", () => {
    $("#pasteBox").value = G.toText(currentCv());
    $("#fileStatus").textContent = "Loaded from the Builder.";
    showView("analyser");
    runAnalysis();
  });
  // close the "More" menu when clicking elsewhere
  document.addEventListener("click", (e) => { const d = $("details.more"); if (d && d.open && !d.contains(e.target)) d.open = false; });

  /* ============================== ANALYSER ============================== */
  const SAMPLE_TEXT = `Priya Nair
priya.nair@example.com | +91 98765 43210 | linkedin.com/in/priyanair | github.com/priyanair

Summary
Software developer with 3 years of experience. Hard-working team player looking for a challenging position in a reputed company.

Experience
Software Developer | Brightloop Technologies | Jul 2024 - Present
- Responsible for developing web pages using React and Node.js
- Worked on REST APIs and helped the team with database queries
- Reduced page load time by 40% by lazy loading images and splitting bundles
- Assisted in testing and deployment activities

Junior Developer | Webcraft Solutions | Jun 2023 - Jun 2024
- Worked on bug fixes and various customer requests
- Built a reporting dashboard with Chart.js used by 15 internal users

Education
B.E. Computer Science | Anna University | 2019 - 2023

Skills
JavaScript, React, Node.js, HTML, CSS, SQL, MongoDB, Git, AWS, Docker, Python, Java
`;

  const dz = $("#dropZone"), fi = $("#fileInput");
  dz.addEventListener("click", () => fi.click());
  dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fi.click(); } });
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
  dz.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
  fi.addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) handleFile(f); });

  async function pdfToText(file) {
    if (!window.pdfjsLib) throw new Error("The PDF engine couldn't load (offline?). Paste your CV text instead.");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const out = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const tc = await (await pdf.getPage(p)).getTextContent();
      const items = tc.items.filter((i) => i.str).map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width }));
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      const rows = [];
      for (const it of items) {
        const r = rows[rows.length - 1];
        if (r && Math.abs(r.y - it.y) <= 3) r.items.push(it); else rows.push({ y: it.y, items: [it] });
      }
      for (const r of rows) {
        r.items.sort((a, b) => a.x - b.x);
        let line = "", end = null;
        for (const it of r.items) {
          if (end !== null) {
            const gap = it.x - end;
            if (gap > 1.5 && !line.endsWith(" ") && !it.s.startsWith(" ")) line += " ";
            if (gap > 28) line += " ";
          }
          line += it.s;
          end = it.x + it.w;
        }
        out.push(line.trim());
      }
      out.push("");
    }
    return out.join("\n");
  }

  async function fileToText(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf") || file.type === "application/pdf") return pdfToText(file);
    if (name.endsWith(".docx")) {
      if (!window.mammoth) throw new Error("The DOCX engine couldn't load (offline?). Paste your CV text instead.");
      return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
    }
    if (name.endsWith(".doc")) throw new Error("Old .doc files can't be read in the browser — save as .docx or PDF, or paste the text.");
    const text = await file.text();
    if (name.endsWith(".json")) {
      try { const o = JSON.parse(text); return G.toText(normalizeCv(o.cv || o)); } catch (e) { /* fall through to raw text */ }
    }
    return text;
  }

  async function handleFile(file) {
    const status = $("#fileStatus");
    status.className = "muted small";
    status.textContent = `Reading ${file.name}…`;
    try {
      const text = await fileToText(file);
      if (!text || text.replace(/\s/g, "").length < 40) throw new Error("I couldn't extract readable text. If this is a scanned/image PDF, paste the text instead — an ATS can't read it either.");
      $("#pasteBox").value = text;
      status.textContent = `Loaded ${file.name} (${text.length.toLocaleString()} characters).`;
      runAnalysis();
    } catch (err) {
      status.className = "err small";
      status.textContent = err.message || String(err);
    }
  }

  $("#btnAnalyse").addEventListener("click", runAnalysis);
  $("#btnSampleText").addEventListener("click", () => { $("#pasteBox").value = SAMPLE_TEXT; runAnalysis(); });

  function runAnalysis() {
    const text = $("#pasteBox").value;
    const status = $("#fileStatus");
    if (text.replace(/\s/g, "").length < 40) {
      status.className = "err small";
      status.textContent = "Paste or upload a CV first (at least a few lines).";
      return;
    }
    state.analysis = A.analyze(text);
    state.rankings = A.rankCompanies(state.analysis, state.role);
    state.rawText = text;
    renderResults();
    renderCompanyGrid();
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function gauge(score) {
    const C = 2 * Math.PI * 70, col = scoreColor(score / 100);
    return `<div class="gauge"><svg width="170" height="170" viewBox="0 0 170 170"><circle cx="85" cy="85" r="70" fill="none" stroke="var(--panel-2)" stroke-width="14"/>
      <circle cx="85" cy="85" r="70" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - score / 100)}"/></svg>
      <div class="num"><div><b style="color:${col}">${score}</b><br><span>out of 100</span></div></div></div>`;
  }

  function fitCard(r, i) {
    const c = r.company, m = r.match;
    return `<button class="ccard" data-company="${c.id}" style="--c:${c.color}"><h4><span>${esc(c.name)}</span><span style="color:${scoreColor(m.score / 100)}">${m.score}</span></h4>
      <div class="sector">${esc(c.sector)}${i === 0 ? " · best fit" : ""}</div>
      <div class="bar"><i style="width:${m.score}%;background:${scoreColor(m.score / 100)}"></i></div>
      <div class="small muted fitbar">${esc(m.fit)}</div></button>`;
  }

  function companyProfile(c, m) {
    return `<div style="--c:${c.color}">
      <h3>${esc(c.name)} <span class="chip">${esc(c.sector)}</span></h3>
      <p class="muted">${esc(c.blurb)}</p>
      ${m ? `<div class="badges"><span class="chip" style="color:${scoreColor(m.score / 100)}">Your fit: ${m.score}/100 — ${esc(m.fit)}</span></div>` : ""}
      <h4>What they look for</h4><p>${esc(c.looksFor)}</p>
      <h4>Values</h4><div class="chips">${c.values.map((v) => `<span class="chip">${esc(v)}</span>`).join("")}</div>
      <h4>Keywords${m ? " — what you show / lack" : ""}</h4>
      ${m ? `${chipList(m.techHit, "good")}<div style="height:6px"></div>${chipList(m.techMiss, "warn")}` : chipList(c.tech, "info")}
      <h4>Signals they weigh</h4>
      <ul>${(m ? [...m.sigHit.map((s) => `✅ ${s.name}`), ...m.sigMiss.map((s) => `⚠️ ${s.name} — not visible`)] : c.signals.map((s) => s.name)).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      ${m && m.advice.length ? `<h4>Your gaps</h4><ul>${m.advice.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
      <h4>How to write for them</h4><ul>${c.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <h4>Avoid</h4><ul>${c.avoid.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </div>`;
  }

  /** the three things to fix first: worst findings in the heaviest-weighted areas */
  function priorityCard(a) {
    const weight = Object.fromEntries(a.categories.map((c) => [c.id, c.max * (1 - c.ratio)]));
    const top = a.findings.filter((f) => f.type === "bad").sort((x, y) => (weight[y.cat] || 0) - (weight[x.cat] || 0)).slice(0, 3);
    const fill = top.length < 3 ? top.concat(a.findings.filter((f) => f.type === "warn").sort((x, y) => (weight[y.cat] || 0) - (weight[x.cat] || 0)).slice(0, 3 - top.length)) : top;
    if (!fill.length) return `<div class="panel priority"><div class="panel-h"><h3>🚀 Nothing urgent</h3></div><p class="muted">No major blockers found. Polish the bullets under “Line-by-line fixes” and tailor to your target company.</p></div>`;
    return `<div class="panel priority"><div class="panel-h"><h3>🚀 Fix these first</h3><span class="muted small">Biggest score gains for the least effort</span></div>
      <ol>${fill.map((f) => `<li><b>${esc(f.title)}</b><span>${esc(f.detail)}</span></li>`).join("")}</ol></div>`;
  }

  function renderResults() {
    const a = state.analysis;
    const good = a.findings.filter((f) => f.type === "good");
    const bad = a.findings.filter((f) => f.type !== "good").sort((x, y) => (x.type === y.type ? 0 : x.type === "bad" ? -1 : 1));
    const finding = (f) => `<div class="finding ${f.type}"><b>${esc(f.title)}</b>${f.detail ? `<span>${esc(f.detail)}</span>` : ""}</div>`;
    const techChips = Object.entries(a.tech.found).map(([cat, items]) => `<div style="margin:4px 0"><span class="muted small">${esc(cat)}:</span> ${items.map((t) => `<span class="chip">${esc(t)}</span>`).join(" ")}</div>`).join("");

    $("#results").innerHTML = `
      <div class="panel score-card">
        ${gauge(a.score)}
        <div>
          <div class="verdict" style="color:${scoreColor(a.score / 100)}">Grade ${a.grade} · ${esc(a.verdict)}</div>
          <div class="muted">${esc(a.verdictLine)}</div>
          <div class="badges">
            <span class="chip">Level read: ${esc(a.level)}</span>
            <span class="chip">${a.years ? "~" + a.years + " yrs experience" : "No dated experience found"}</span>
            <span class="chip">${a.words} words · ~${a.pages} page${a.pages === 1 ? "" : "s"}</span>
            <span class="chip">${a.bulletCount} bullets · ${a.metricBullets} quantified</span>
          </div>
          <div class="row-wrap" style="margin-top:6px">
            <button class="btn" id="btnReport">⬇ Download report (.md)</button>
            <button class="btn accent" id="btnImprove">✍️ Improve it in the Builder</button>
          </div>
        </div>
      </div>

      ${priorityCard(a)}

      <div class="panel narr"><div class="panel-h"><h3>🧑‍💻 A senior engineer's take</h3></div>${a.narrative.map((p) => `<p>${md(p)}</p>`).join("")}</div>

      <div class="panel"><div class="panel-h"><h3>Score breakdown</h3></div><div class="bars">
        ${a.categories.map((c) => `<div class="bar-row"><div>${esc(c.name)}</div><div class="bar"><i style="width:${Math.round(c.ratio * 100)}%;background:${scoreColor(c.ratio)}"></i></div><div style="text-align:right"><b>${c.score}</b><span class="muted">/${c.max}</span></div></div>`).join("")}
      </div></div>

      <div class="two-col">
        <div class="panel"><div class="panel-h"><h3>👍 The good</h3><span class="chip good">${good.length}</span></div>${good.length ? good.map(finding).join("") : '<p class="muted">Honestly? Nothing stands out yet. Fix the items on the right and run it again.</p>'}</div>
        <div class="panel"><div class="panel-h"><h3>👎 The bad &amp; the fixable</h3><span class="chip bad">${bad.length}</span></div>${bad.length ? bad.map(finding).join("") : '<p class="muted">Nothing major flagged.</p>'}</div>
      </div>

      ${a.bulletIssues.length ? `<div class="panel"><div class="panel-h"><h3>🔧 Line-by-line fixes</h3><span class="muted small">Worst bullets first. Only add numbers that are true.</span></div>
        ${a.bulletIssues.map((b) => `<div class="fix"><q>“${esc(b.text.length > 220 ? b.text.slice(0, 217) + "…" : b.text)}”</q><ul>${b.issues.map((i) => `<li>${esc(i.m)}</li>`).join("")}</ul></div>`).join("")}
        <div class="hint" style="margin-top:8px">Formula: <b>[Strong verb] + [what you built/changed] + [how/with what] + [measurable result]</b></div></div>` : ""}

      <div class="two-col">
        <div class="panel"><div class="panel-h"><h3>🎤 Questions I'd ask you</h3></div><ol style="padding-left:20px;margin:0">${a.questions.map((q) => `<li style="margin-bottom:8px">${esc(q)}</li>`).join("")}</ol>
          <p class="hint">If you can't answer these confidently, fix the CV claim — or the skill — before applying.</p></div>
        <div class="panel"><div class="panel-h"><h3>🧩 What I detected</h3></div>
          <p class="small muted">Sections: ${a.sections.map(esc).join(", ") || "none"} · Email ${a.contact.email ? "✓" : "✗"} · Phone ${a.contact.phone ? "✓" : "✗"} · LinkedIn ${a.contact.linkedin ? "✓" : "✗"} · GitHub ${a.contact.github ? "✓" : "✗"}</p>
          ${techChips || '<p class="muted">No recognisable technologies.</p>'}</div>
      </div>

      <div class="panel"><div class="panel-h"><h3>🏢 Fit with MNCs</h3><span class="muted small">Role lens: ${esc(M.ROLES[state.role].label)} · click a company for gaps and tailoring advice</span></div>
        <div class="company-grid" id="fitGrid">${state.rankings.map(fitCard).join("")}</div>
        <div id="fitDetail" class="detail panel" hidden style="margin-top:16px"></div></div>

      <div class="panel"><details class="ai"><summary>🤖 Optional: deeper AI review with Claude</summary>
        <p class="muted small">Sends your CV text directly from this browser to Anthropic's API using your own key. Not stored unless you tick the box. Leave this alone if you don't want your CV leaving this page.</p>
        <div class="grid2"><label class="f"><span>Anthropic API key</span><input type="password" id="aiKey" placeholder="sk-ant-…" autocomplete="off"></label>
        <label class="f"><span>Target company (optional)</span><select id="aiCompany"><option value="">— general review —</option>${M.COMPANIES.map((c) => `<option>${esc(c.name)}</option>`).join("")}</select></label></div>
        <label class="check" style="margin:8px 0"><input type="checkbox" id="aiRemember"> Remember the key on this device</label>
        <button class="btn primary" id="btnAi">Run AI review</button>
        <div id="aiOut" class="ai-out" hidden></div></details></div>`;

    const saved = store.get("aiKey", "");
    if (saved) { $("#aiKey").value = saved; $("#aiRemember").checked = true; }
  }

  $("#results").addEventListener("click", async (e) => {
    const cc = e.target.closest("[data-company]");
    if (cc) {
      const r = state.rankings.find((x) => x.company.id === cc.dataset.company);
      const d = $("#fitDetail");
      d.hidden = false;
      d.style.setProperty("--c", r.company.color);
      d.innerHTML = companyProfile(r.company, r.match);
      d.scrollIntoView({ behavior: "smooth", block: "nearest" });
      $$("#fitGrid .ccard").forEach((x) => x.classList.toggle("sel", x === cc));
    }
    if (e.target.id === "btnReport") G.download("cv-review.md", "text/markdown", reportMd());
    if (e.target.id === "btnImprove") {
      if (!(await ask("Replace the Builder's CV with a best-effort import of this text?\nYou can undo this right after.", { ok: "Import into Builder" }))) return;
      showView("builder");
      withUndo("Imported. Check each section — headings and job entries need a quick tidy.", () => { state.cv = G.fromText(state.rawText); });
    }
    if (e.target.dataset.go) showView(e.target.dataset.go);
    if (e.target.id === "btnAi") runAi();
  });

  function reportMd() {
    const a = state.analysis;
    const L = [];
    L.push(`# CV review — ${a.score}/100 (${a.grade}) · ${a.verdict}`, "", `_${a.verdictLine}_`, "",
      `Level read: **${a.level}** · ~${a.years || 0} yrs · ${a.words} words · ${a.bulletCount} bullets (${a.metricBullets} quantified)`, "",
      "## A senior engineer's take", "", ...a.narrative.map((p) => p + "\n"), "## Score breakdown", "",
      ...a.categories.map((c) => `- **${c.name}**: ${c.score}/${c.max}`), "", "## The good", "",
      ...(a.findings.filter((f) => f.type === "good").map((f) => `- **${f.title}** ${f.detail}`)), "", "## The bad & fixable", "",
      ...(a.findings.filter((f) => f.type !== "good").map((f) => `- **${f.title}** ${f.detail}`)), "", "## Line-by-line fixes", "",
      ...a.bulletIssues.map((b) => `- “${b.text}”\n${b.issues.map((i) => "  - " + i.m).join("\n")}`), "", "## Questions I'd ask", "",
      ...a.questions.map((q, i) => `${i + 1}. ${q}`), "", `## MNC fit (role lens: ${M.ROLES[state.role].label})`, "",
      ...state.rankings.map((r) => `- ${r.company.name}: **${r.match.score}** — ${r.match.fit}`), "",
      "_Generated by M.A.N.G.O.S — a rules-based review; it cannot verify your claims._");
    return L.join("\n");
  }

  async function runAi() {
    const key = $("#aiKey").value.trim();
    const out = $("#aiOut");
    out.hidden = false;
    if (!key) { out.textContent = "Enter your Anthropic API key first."; return; }
    if ($("#aiRemember").checked) store.set("aiKey", key); else store.del("aiKey");
    const company = $("#aiCompany").value;
    out.textContent = "Reading your CV like a hiring manager…";
    const system = "You are a senior software engineer with 15 years of experience who hires engineers at a large technology company. " +
      "Review the resume you are given with candid, specific, constructive honesty — no flattery, no vague advice. " +
      "Never invent facts about the candidate or suggest fabricating achievements; when suggesting a rewrite, use placeholders like [X%] for unknown numbers. " +
      "Structure: 1) Verdict & score out of 100, 2) What genuinely works, 3) What hurts the candidate (ranked), 4) Rewrite the 5 weakest lines (quote → rewrite), " +
      "5) Five interview questions you would ask based on the resume, 6) " + (company ? `Fit for ${company}: strengths, gaps and what to change` : "Which kinds of companies this resume suits and why") + ".";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 2000, system, messages: [{ role: "user", content: "RESUME:\n\n" + state.rawText.slice(0, 20000) }] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || "HTTP " + res.status);
      out.textContent = (data.content || []).map((p) => p.text || "").join("\n").trim() || "(empty response)";
    } catch (err) {
      out.innerHTML = `<span class="err">AI review failed: ${esc(err.message || err)}</span>`;
    }
  }

  /* ============================== COMPANY LIBRARY ============================== */
  function renderCompanyGrid() {
    const q = ($("#companySearch").value || "").toLowerCase().trim();
    const list = M.COMPANIES.filter((c) => !q || (c.name + " " + c.sector).toLowerCase().includes(q));
    $("#companyGrid").innerHTML = list.map((c) => {
      const r = state.rankings && state.rankings.find((x) => x.company.id === c.id);
      return `<button class="ccard" data-lib="${c.id}" style="--c:${c.color}"><h4><span>${esc(c.name)}</span>${r ? `<span style="color:${scoreColor(r.match.score / 100)}">${r.match.score}</span>` : ""}</h4>
        <div class="sector">${esc(c.sector)}</div><div class="small muted">${esc(c.values.slice(0, 3).join(" · "))}</div></button>`;
    }).join("") || '<p class="muted">No companies match.</p>';
  }
  $("#companySearch").addEventListener("input", renderCompanyGrid);
  $("#companyGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lib]");
    if (!b) return;
    const c = M.COMPANIES.find((x) => x.id === b.dataset.lib);
    const r = state.rankings && state.rankings.find((x) => x.company.id === c.id);
    const d = $("#companyDetail");
    d.hidden = false;
    d.style.setProperty("--c", c.color);
    d.innerHTML = companyProfile(c, r ? r.match : null) +
      `<div class="row-wrap"><button class="btn primary" data-tailor="${c.id}">🎯 Tailor my CV to ${esc(c.name)}</button></div>`;
    $$("#companyGrid .ccard").forEach((x) => x.classList.toggle("sel", x === b));
    d.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  $("#companyDetail").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tailor]");
    if (!t) return;
    state.tailor.company = t.dataset.tailor;
    $("#tailorCompany").value = state.tailor.company;
    store.set("tailor", state.tailor);
    renderPreview();
    showView("builder");
  });

  /* ============================== boot ============================== */
  initTailorControls();
  renderForm();
  renderMeter();
  renderPreview();
  renderCompanyGrid();
  const welcome = $("#welcome");
  welcome.hidden = !!store.get("welcomeSeen", false);
  $("#welcomeClose").addEventListener("click", () => { welcome.hidden = true; store.set("welcomeSeen", true); });
  $("#helpBtn").addEventListener("click", () => { welcome.hidden = !welcome.hidden; if (!welcome.hidden) window.scrollTo({ top: 0, behavior: "smooth" }); });
  welcome.addEventListener("click", (e) => { if (e.target.dataset.go) { showView(e.target.dataset.go); store.set("welcomeSeen", true); welcome.hidden = true; } });
  const lastView = store.get("view", "builder");
  if (["builder", "analyser", "companies"].includes(lastView)) showView(lastView);
  window.__mangos = { state, A, G };
})();
