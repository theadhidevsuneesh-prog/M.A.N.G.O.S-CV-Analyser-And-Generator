/* M.A.N.G.O.S — CV generator: data model, rendering, exports, tailoring. No DOM access except print/download helpers. */
(function (g) {
  const M = (g.MANGOS = g.MANGOS || {});
  const G = (M.Generator = {});
  const A = () => M.Analyzer;

  /* ---------------- model ---------------- */
  G.empty = () => ({
    basics: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
    summary: "",
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: "",
    achievements: ""
  });

  G.emptyItem = {
    experience: () => ({ role: "", company: "", location: "", start: "", end: "", bullets: "" }),
    projects: () => ({ name: "", link: "", stack: "", bullets: "" }),
    education: () => ({ school: "", degree: "", location: "", start: "", end: "", detail: "" }),
    skills: () => ({ group: "", items: "" })
  };

  G.sample = () => ({
    basics: {
      name: "Alex Morgan", title: "Senior Backend Engineer", email: "alex.morgan@example.com", phone: "+1 415 555 0134",
      location: "San Francisco, CA", linkedin: "linkedin.com/in/alexmorgan", github: "github.com/alexmorgan", website: ""
    },
    summary: "Backend engineer with 6 years building high-throughput payment and data platforms in Java and Go on AWS. Cut p99 latency 62% and infrastructure spend by $210k/yr while mentoring a team of four.",
    experience: [
      {
        role: "Senior Software Engineer", company: "Paytrail", location: "Remote", start: "Jan 2021", end: "Present",
        bullets: [
          "Architected an event-driven settlement pipeline on Kafka processing 4M transactions/day, cutting reconciliation time from 6 hours to 25 minutes.",
          "Reduced p99 API latency by 62% (480ms to 180ms) by introducing Redis caching and query-plan tuning in PostgreSQL.",
          "Led migration of 12 services to Kubernetes with a 4-engineer team, saving $210k per year in infrastructure cost.",
          "Mentored 3 junior engineers and introduced design reviews, lowering production incidents by 35%."
        ].join("\n")
      },
      {
        role: "Software Engineer", company: "Cartly", location: "Austin, TX", start: "Jun 2018", end: "Dec 2020",
        bullets: [
          "Built a REST API serving 1.2M requests/day with Spring Boot and MySQL, maintaining 92% unit-test coverage.",
          "Automated CI/CD with GitHub Actions, shrinking release time from 2 days to 20 minutes.",
          "Designed a feature-flag service adopted by 8 product teams."
        ].join("\n")
      }
    ],
    projects: [
      {
        name: "ratelimit — distributed rate limiter", link: "github.com/alexmorgan/ratelimit", stack: "Go, Redis, Lua",
        bullets: "Implemented a token-bucket limiter handling 50k req/s per node with atomic Redis Lua scripts.\nPublished benchmarks and docs; 420 GitHub stars and 6 external contributors."
      }
    ],
    education: [
      { school: "State University", degree: "B.Tech, Computer Science", location: "", start: "2014", end: "2018", detail: "GPA 3.8/4.0 · ACM ICPC regional finalist" }
    ],
    skills: [
      { group: "Languages", items: "Java, Go, Python, SQL" },
      { group: "Backend", items: "Spring Boot, Kafka, Redis, PostgreSQL, MySQL, REST, Microservices" },
      { group: "Cloud & DevOps", items: "AWS, Kubernetes, Docker, Terraform, GitHub Actions, CI/CD" }
    ],
    certifications: "AWS Certified Solutions Architect – Associate",
    achievements: ""
  });

  /* ---------------- helpers ---------------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lines = (s) => String(s || "").split(/\r?\n/).map((l) => l.replace(/^\s*(?:[••·▪*\-–—]|\d+[.)])\s*/, "").trim()).filter(Boolean);
  const csv = (s) => String(s || "").split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  const dates = (a, b) => [a, b].map((x) => String(x || "").trim()).filter(Boolean).join(" – ");
  const href = (u) => (/^https?:\/\//i.test(u) ? u : "https://" + u);
  const bare = (u) => String(u).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
  G.esc = esc;

  /* ---------------- tailoring (reorder only — never invents content) ---------------- */
  G.keywordTerms = (company, roleKey) => {
    const t = [];
    if (company) t.push(...company.tech);
    if (roleKey && M.ROLES[roleKey]) t.push(...M.ROLES[roleKey].tech);
    return Array.from(new Set(t));
  };

  G.tailor = (cv, terms) => {
    const out = JSON.parse(JSON.stringify(cv));
    if (!terms || !terms.length) return out;
    const hits = (text) => terms.filter((t) => A().has(String(text).toLowerCase(), t)).length;
    const stable = (arr, score) => arr.map((v, i) => ({ v, i, s: score(v) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.v);

    out.skills.forEach((grp) => {
      grp.items = stable(csv(grp.items), (item) => hits(item)).join(", ");
    });
    out.skills = stable(out.skills, (grp) => csv(grp.items).filter((i) => hits(i)).length);
    out.experience.forEach((job) => { job.bullets = stable(lines(job.bullets), (b) => hits(b)).join("\n"); });
    out.projects.forEach((p) => { p.bullets = stable(lines(p.bullets), (b) => hits(b)).join("\n"); });
    out.projects = stable(out.projects, (p) => hits(p.name + " " + p.stack + " " + p.bullets));
    return out;
  };

  /** a summary starter built from the user's own data + the company's signals; contains [placeholders] */
  G.summaryDraft = (cv, company) => {
    const b = cv.basics;
    const topSkills = [];
    cv.skills.forEach((s) => csv(s.items).forEach((i) => topSkills.length < 4 && topSkills.push(i)));
    const role = b.title || "Software engineer";
    const sig = company ? company.signals.slice(0, 2).map((s) => s.name.toLowerCase().split(/[&/]/)[0].trim()) : [];
    return `${role} with [X] years of experience building ${topSkills.length ? topSkills.slice(0, 3).join(", ") : "[your core stack]"} systems. ` +
      `Delivered [headline result with a number]${sig.length ? ", with a focus on " + sig.join(" and ") : ""}. ` +
      `Looking to ${company ? "bring that to " + company.name : "apply that"} as [target role].`;
  };

  /* ---------------- plain text (what an ATS sees) ---------------- */
  G.toText = (cv) => {
    const b = cv.basics, o = [];
    if (b.name) o.push(b.name);
    if (b.title) o.push(b.title);
    const contact = [b.email, b.phone, b.location, b.linkedin, b.github, b.website].filter(Boolean).join(" | ");
    if (contact) o.push(contact);
    if (cv.summary.trim()) o.push("", "SUMMARY", cv.summary.trim());
    if (cv.experience.length) {
      o.push("", "EXPERIENCE");
      cv.experience.forEach((e) => {
        o.push([e.role, e.company, e.location, dates(e.start, e.end)].filter(Boolean).join(" | "));
        lines(e.bullets).forEach((l) => o.push("• " + l));
      });
    }
    if (cv.projects.length) {
      o.push("", "PROJECTS");
      cv.projects.forEach((p) => {
        o.push([p.name, p.stack, p.link].filter(Boolean).join(" | "));
        lines(p.bullets).forEach((l) => o.push("• " + l));
      });
    }
    if (cv.education.length) {
      o.push("", "EDUCATION");
      cv.education.forEach((e) => {
        o.push([e.degree, e.school, e.location, dates(e.start, e.end)].filter(Boolean).join(" | "));
        if (e.detail) o.push(e.detail);
      });
    }
    if (cv.skills.length) {
      o.push("", "SKILLS");
      cv.skills.forEach((s) => o.push((s.group ? s.group + ": " : "") + csv(s.items).join(", ")));
    }
    if (cv.certifications.trim()) { o.push("", "CERTIFICATIONS"); lines(cv.certifications).forEach((l) => o.push("• " + l)); }
    if (cv.achievements.trim()) { o.push("", "ACHIEVEMENTS"); lines(cv.achievements).forEach((l) => o.push("• " + l)); }
    return o.join("\n");
  };

  /* ---------------- HTML rendering ---------------- */
  /** opts: { template, accent, highlight: RegExp|null } */
  G.render = (cv, opts) => {
    opts = opts || {};
    const hl = opts.highlight;
    const rich = (text) => {
      text = String(text == null ? "" : text);
      if (!hl) return esc(text);
      let out = "", last = 0, m;
      hl.lastIndex = 0;
      while ((m = hl.exec(text))) {
        if (!m[0]) { hl.lastIndex++; continue; }
        out += esc(text.slice(last, m.index)) + '<mark class="kw">' + esc(m[0]) + "</mark>";
        last = m.index + m[0].length;
      }
      return out + esc(text.slice(last));
    };
    const b = cv.basics;
    const contact = [];
    if (b.email) contact.push(`<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`);
    if (b.phone) contact.push(esc(b.phone));
    if (b.location) contact.push(esc(b.location));
    if (b.linkedin) contact.push(`<a href="${esc(href(b.linkedin))}">${esc(bare(b.linkedin))}</a>`);
    if (b.github) contact.push(`<a href="${esc(href(b.github))}">${esc(bare(b.github))}</a>`);
    if (b.website) contact.push(`<a href="${esc(href(b.website))}">${esc(bare(b.website))}</a>`);

    const ul = (s) => {
      const l = lines(s);
      return l.length ? `<ul>${l.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>` : "";
    };
    const sec = (title, body) => (body ? `<section><h2>${esc(title)}</h2>${body}</section>` : "");

    const exp = cv.experience.filter((e) => e.role || e.company || e.bullets).map((e) => `
      <div class="item">
        <div class="row"><div><strong>${esc(e.role)}</strong>${e.company ? `<span class="sep"> — </span><span>${esc(e.company)}</span>` : ""}${e.location ? `<span class="muted">, ${esc(e.location)}</span>` : ""}</div><div class="date">${esc(dates(e.start, e.end))}</div></div>
        ${ul(e.bullets)}
      </div>`).join("");
    const proj = cv.projects.filter((p) => p.name || p.bullets).map((p) => `
      <div class="item">
        <div class="row"><div><strong>${esc(p.name)}</strong>${p.stack ? `<span class="muted"> · ${rich(p.stack)}</span>` : ""}</div>${p.link ? `<div class="date"><a href="${esc(href(p.link))}">${esc(bare(p.link))}</a></div>` : ""}</div>
        ${ul(p.bullets)}
      </div>`).join("");
    const edu = cv.education.filter((e) => e.school || e.degree).map((e) => `
      <div class="item">
        <div class="row"><div><strong>${esc(e.degree)}</strong>${e.school ? `<span class="sep"> — </span>${esc(e.school)}` : ""}${e.location ? `<span class="muted">, ${esc(e.location)}</span>` : ""}</div><div class="date">${esc(dates(e.start, e.end))}</div></div>
        ${e.detail ? `<div class="detail">${esc(e.detail)}</div>` : ""}
      </div>`).join("");
    const skills = cv.skills.filter((s) => s.items.trim()).map((s) =>
      `<div class="skill"><strong>${esc(s.group)}${s.group ? ":" : ""}</strong> ${csv(s.items).map(rich).join(", ")}</div>`).join("");

    const accent = /^#[0-9a-f]{3,8}$/i.test(opts.accent || "") ? opts.accent : "#d97706";
    return `<div class="cv tpl-${esc(opts.template || "classic")}" style="--accent:${accent}">
      <header>
        <h1>${esc(b.name || "Your Name")}</h1>
        ${b.title ? `<div class="headline">${esc(b.title)}</div>` : ""}
        <div class="contact">${contact.join('<span class="dot"> • </span>')}</div>
      </header>
      ${sec("Summary", cv.summary.trim() ? `<p>${rich(cv.summary.trim())}</p>` : "")}
      ${sec("Experience", exp)}
      ${sec("Projects", proj)}
      ${sec("Education", edu)}
      ${sec("Skills", skills)}
      ${sec("Certifications", ul(cv.certifications))}
      ${sec("Achievements", ul(cv.achievements))}
    </div>`;
  };

  /** CSS shared by the in-app preview, print window and downloaded HTML */
  G.CSS = `
.cv{font-family:"Calibri","Segoe UI",Arial,Helvetica,sans-serif;color:#1a1a1a;line-height:1.38;font-size:10.5pt;background:#fff;padding:0}
.cv *{box-sizing:border-box}
.cv a{color:inherit;text-decoration:none}
.cv h1{margin:0;font-size:22pt;line-height:1.1;letter-spacing:.2px}
.cv .headline{font-size:11.5pt;margin-top:2px;color:#444}
.cv .contact{margin-top:6px;font-size:9.5pt;color:#333}
.cv .dot{color:#999}
.cv section{margin-top:12px}
.cv h2{margin:0 0 5px;font-size:10.5pt;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #222;padding-bottom:2px}
.cv .item{margin-bottom:8px;break-inside:avoid}
.cv .row{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
.cv .date{white-space:nowrap;font-size:9.5pt;color:#444}
.cv .muted{color:#555}
.cv ul{margin:3px 0 0;padding-left:18px}
.cv li{margin:1px 0}
.cv p{margin:0}
.cv .skill{margin:1px 0}
.cv .detail{font-size:9.5pt;color:#444}
.cv mark.kw{background:#fde68a;color:inherit;border-radius:2px;padding:0 1px}
/* modern */
.cv.tpl-modern header{border-left:5px solid var(--accent);padding-left:12px}
.cv.tpl-modern h1{color:var(--accent)}
.cv.tpl-modern h2{border-bottom:2px solid var(--accent);color:var(--accent)}
.cv.tpl-modern .headline{color:#222;font-weight:600}
/* compact */
.cv.tpl-compact{font-size:9.6pt;line-height:1.3}
.cv.tpl-compact h1{font-size:19pt}
.cv.tpl-compact section{margin-top:8px}
.cv.tpl-compact h2{font-size:9.6pt;border-bottom:1px solid #999}
.cv.tpl-compact .item{margin-bottom:5px}
.cv.tpl-compact ul{padding-left:16px}
@media print{.cv mark.kw{background:none}}
`;

  G.fullHtml = (cv, opts) =>
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(cv.basics.name || "Resume")} — Resume</title>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><style>@page{size:A4;margin:14mm}html,body{margin:0;background:#fff}body{padding:0}${G.CSS}</style></head><body>${G.render(cv, Object.assign({}, opts, { highlight: null }))}</body></html>`;

  /* ---------------- file helpers (browser only) ---------------- */
  G.download = (filename, mime, content) => {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  };
  G.print = (cv, opts) => {
    const w = window.open("", "_blank");
    if (!w) return false;
    w.document.open();
    w.document.write(G.fullHtml(cv, opts));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
    return true;
  };
  G.slug = (cv) => (cv.basics.name || "resume").trim().replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "resume";

  /** best-effort: turn analysed raw text into a starting structured CV (for "Improve this in the builder") */
  G.fromText = (raw) => {
    const P = A().parse(raw);
    const cv = G.empty();
    const c = P.contact;
    cv.basics.name = c.name || ""; cv.basics.email = c.email || ""; cv.basics.phone = (c.phone || "").trim();
    cv.basics.linkedin = c.linkedin || ""; cv.basics.github = c.github || ""; cv.basics.website = c.website || "";
    const sec = (n) => (P.sections[n] || []).map((l) => l.text);
    cv.summary = sec("summary").join(" ");
    const expLines = sec("experience");
    if (expLines.length) cv.experience.push({ role: "", company: "", location: "", start: "", end: "", bullets: expLines.map((l) => l.replace(/^[••·▪*\-–—]\s*/, "")).join("\n") });
    const projLines = sec("projects");
    if (projLines.length) cv.projects.push({ name: "", link: "", stack: "", bullets: projLines.map((l) => l.replace(/^[••·▪*\-–—]\s*/, "")).join("\n") });
    const eduLines = sec("education");
    if (eduLines.length) cv.education.push({ school: "", degree: eduLines[0], location: "", start: "", end: "", detail: eduLines.slice(1).join(" · ") });
    const skillLines = sec("skills");
    if (skillLines.length) cv.skills.push({ group: "Skills", items: skillLines.join(", ").replace(/\s*[|•]\s*/g, ", ") });
    cv.certifications = sec("certifications").join("\n");
    cv.achievements = sec("achievements").join("\n");
    return cv;
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
