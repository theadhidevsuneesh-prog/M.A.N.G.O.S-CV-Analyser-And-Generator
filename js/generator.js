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
        o.push([e.role, e.company, e.location, dates(e.start, e.end).replace(" – ", " - ")].filter(Boolean).join(" | "));
        lines(e.bullets).forEach((l) => o.push("- " + l));
      });
    }
    if (cv.projects.length) {
      o.push("", "PROJECTS");
      cv.projects.forEach((p) => {
        o.push([p.name, p.stack, p.link].filter(Boolean).join(" | "));
        lines(p.bullets).forEach((l) => o.push("- " + l));
      });
    }
    if (cv.education.length) {
      o.push("", "EDUCATION");
      cv.education.forEach((e) => {
        o.push([e.degree, e.school, e.location, dates(e.start, e.end).replace(" – ", " - ")].filter(Boolean).join(" | "));
        if (e.detail) o.push(e.detail);
      });
    }
    if (cv.skills.length) {
      o.push("", "SKILLS");
      cv.skills.forEach((s) => o.push((s.group ? s.group + ": " : "") + csv(s.items).join(", ")));
    }
    if (cv.certifications.trim()) { o.push("", "CERTIFICATIONS"); lines(cv.certifications).forEach((l) => o.push("- " + l)); }
    if (cv.achievements.trim()) { o.push("", "ACHIEVEMENTS"); lines(cv.achievements).forEach((l) => o.push("- " + l)); }
    return o.join("\n");
  };

  /* ---------------- HTML rendering ---------------- */
  /** opts: { template, accent, highlight: RegExp|null } */
  G.render = (cv, opts) => {
    opts = opts || {};
    if (opts.template === "ats") return G.renderAts(cv, opts);
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

  /* ---------------- ATS mode ---------------- */
  const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DATE_OK = /^(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) )?\d{4}$|^Present$/;
  const FANCY = /[‘’‛“”–—−… →•●▪■★☆✓✔►➢➤○️\u{1F300}-\u{1FAFF}☀-➿]/u;
  const SKILLBAR = /\(\s*\d{1,3}\s*%\s*\)|\b\d{2,3}\s*%|[★☆●○■□]{2,}|\b(?:beginner|intermediate|advanced|expert|proficient)\b/i;

  G.normDate = (s) => {
    const t = String(s || "").trim();
    if (!t) return "";
    if (/^(present|current|now|ongoing|till date|today|date)$/i.test(t)) return "Present";
    let m;
    if ((m = t.match(/^(\d{1,2})\s*[\/.\-]\s*((?:19|20)\d{2})$/))) return MN[Math.min(11, Math.max(0, +m[1] - 1))] + " " + m[2];
    if ((m = t.match(/^((?:19|20)\d{2})\s*[\/.\-]\s*(\d{1,2})$/))) return MN[Math.min(11, Math.max(0, +m[2] - 1))] + " " + m[1];
    if ((m = t.match(/^([A-Za-z]{3,9})\.?,?\s+((?:19|20)\d{2})$/))) {
      const i = MN.findIndex((x) => m[1].toLowerCase().startsWith(x.toLowerCase()));
      if (i >= 0) return MN[i] + " " + m[2];
    }
    return t;
  };

  const cleanChars = (s) =>
    String(s == null ? "" : s)
      .replace(/[‘’‛]/g, "'").replace(/[“”]/g, '"').replace(/[–—−]/g, "-")
      .replace(/…/g, "...").replace(/[   ]/g, " ").replace(/[→⇒]/g, "->")
      .replace(/[•●▪■★☆✓✔►➢➤○️\u{1F300}-\u{1FAFF}☀-➿]/gu, "")
      .replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/gm, "").replace(/^[ \t]+/gm, "");

  const strings = (cv) => {
    const out = [];
    const walk = (o) => { if (typeof o === "string") out.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") Object.values(o).forEach(walk); };
    walk(cv);
    return out;
  };
  const isEmptyItem = (kind, it) => Object.values(it).every((v) => !String(v).trim());

  /** Each check: {id, ok, title, detail, fixable}. `ok` false → needs attention. */
  G.atsCheck = (cv, ctx) => {
    ctx = ctx || {};
    const b = cv.basics, out = [];
    const add = (id, ok, title, detail, fixable) => out.push({ id, ok, title, detail: detail || "", fixable: !!fixable });
    const missing = ["name", "email", "phone"].filter((k) => !b[k].trim());
    add("contact", !missing.length, "Name, email and phone are present", missing.length ? `Missing: ${missing.join(", ")}. Recruiters' systems key off these.` : "");

    const dateVals = [].concat(cv.experience, cv.education).flatMap((e) => [e.start, e.end]).map((d) => d.trim()).filter(Boolean);
    const badDates = dateVals.filter((d) => !DATE_OK.test(d));
    add("dates", !badDates.length, "Dates use one parseable format (Mon YYYY)", badDates.length ? `Fix: ${badDates.slice(0, 4).join(", ")}. Use "Jan 2021" and "Present".` : "", badDates.every((d) => DATE_OK.test(G.normDate(d))));
    const undated = cv.experience.filter((e) => (e.role || e.company) && (!e.start.trim()));
    if (cv.experience.length) add("undated", !undated.length, "Every job has a start date", undated.length ? `${undated.length} job(s) have no start date — parsers may drop them.` : "");

    const fancy = strings(cv).filter((s) => FANCY.test(lines(s).join("\n")) || (s.indexOf("\n") < 0 && FANCY.test(s)));
    add("chars", !fancy.length, "Only plain characters (no smart quotes, emoji, symbols)", fancy.length ? `${fancy.length} field(s) contain characters that some ATS parsers garble.` : "", true);

    const bars = cv.skills.filter((s) => SKILLBAR.test(s.items));
    add("skillbars", !bars.length, "No skill ratings or percentages", bars.length ? "Percentages, stars and levels are unparseable noise — list skills plainly." : "", true);

    const empties = ["experience", "projects", "education", "skills"].reduce((n, k) => n + cv[k].filter((it) => isEmptyItem(k, it)).length, 0);
    add("empty", !empties, "No empty entries", empties ? `${empties} blank entr${empties > 1 ? "ies" : "y"} will render as gaps.` : "", true);

    const skillCount = cv.skills.reduce((n, s) => n + csv(s.items).length, 0);
    add("skills", skillCount >= 6, "Skills section has enough keywords (6+)", skillCount < 6 ? `Only ${skillCount} skills listed. ATS keyword filters need more to match on.` : "");

    const long = cv.experience.concat(cv.projects).flatMap((e) => lines(e.bullets)).filter((l) => l.split(/\s+/).length > 35).length;
    add("bulletlen", !long, "Bullets are short enough to scan (≤ 35 words)", long ? `${long} bullet(s) run long — split them or cut to the result.` : "");

    const words = G.toText(cv).split(/\s+/).filter(Boolean).length;
    add("length", words <= 850, "Length fits 1–2 pages", words > 850 ? `${words} words is likely 2+ pages — trim older/less relevant content.` : "");

    if (!b.linkedin.trim() && !b.github.trim()) add("links", false, "Includes a LinkedIn or GitHub link", "A profile link lets recruiters verify you quickly.");
    else add("links", true, "Includes a LinkedIn or GitHub link");

    if (ctx.hasTarget) {
      add("keywords", ctx.coverage >= 0.5, "Covers at least half of the target's keywords", ctx.coverage < 0.5 ? `Only ${Math.round(ctx.coverage * 100)}% of the target keywords appear. Add the ones you genuinely have (see the Tailor panel).` : "");
    }
    add("layout", !!ctx.atsMode, "ATS layout is on (single column, no colours or graphics)", !ctx.atsMode ? "Turn on ATS-friendly mode so the exported file is plain and linear." : "", true);
    return out;
  };

  /** auto-fix everything fixable without changing meaning; returns {cv, changes} */
  G.atsFix = (cv) => {
    const out = JSON.parse(JSON.stringify(cv));
    const changes = [];
    const before = strings(out).join("\u0001");
    const walk = (o) => {
      if (Array.isArray(o)) o.forEach((v, i) => { if (typeof v === "string") o[i] = cleanChars(v); else walk(v); });
      else if (o && typeof o === "object") for (const k of Object.keys(o)) { if (typeof o[k] === "string") o[k] = cleanChars(o[k]); else walk(o[k]); }
    };
    walk(out);
    if (strings(out).join("\u0001") !== before) changes.push("Replaced smart quotes, dashes, emoji and decorative symbols with plain characters");

    let d = 0;
    [].concat(out.experience, out.education).forEach((e) => ["start", "end"].forEach((k) => {
      const n = G.normDate(e[k]);
      if (n !== e[k].trim() && DATE_OK.test(n)) { e[k] = n; d++; }
    }));
    if (d) changes.push(`Standardised ${d} date${d > 1 ? "s" : ""} to "Mon YYYY" / "Present"`);

    let sk = 0;
    out.skills.forEach((s) => {
      const cleaned = csv(s.items).map((i) => i
        .replace(/\s*\(\s*\d{1,3}\s*%\s*\)/g, "").replace(/\s*[-:]?\s*\d{1,3}\s*%/g, "")
        .replace(/\s*[\(\-:]\s*(?:beginner|intermediate|advanced|expert|proficient)\s*\)?/gi, "")
        .replace(/\b(?:beginner|intermediate|advanced|expert|proficient)\b/gi, "").trim()).filter(Boolean);
      const seen = new Set();
      const uniq = cleaned.filter((i) => { const k = i.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
      const joined = uniq.join(", ");
      if (joined !== csv(s.items).join(", ")) { s.items = joined; sk++; }
    });
    if (sk) changes.push("Removed skill ratings/percentages and duplicate skills");

    let removed = 0;
    ["experience", "projects", "education", "skills"].forEach((k) => {
      const n = out[k].length;
      out[k] = out[k].filter((it) => !isEmptyItem(k, it));
      removed += n - out[k].length;
    });
    if (removed) changes.push(`Removed ${removed} empty entr${removed > 1 ? "ies" : "y"}`);
    return { cv: out, changes };
  };

  /** Plain, linear HTML: no flex columns, no colours, no links styling — what ATS parsers like best */
  G.renderAts = (cv, opts) => {
    const hl = opts && opts.highlight;
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
    const ul = (s) => { const l = lines(s); return l.length ? `<ul>${l.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>` : ""; };
    const sec = (t, body) => (body ? `<h2>${t}</h2>${body}` : "");
    const head = (parts) => parts.filter(Boolean).join(" | ");
    const exp = cv.experience.filter((e) => e.role || e.company || e.bullets).map((e) =>
      `<div class="item"><p class="line"><strong>${esc(e.role)}</strong>${esc(head(["", e.company, e.location, dates(e.start, e.end).replace(" – ", " - ")]))}</p>${ul(e.bullets)}</div>`).join("");
    const proj = cv.projects.filter((p) => p.name || p.bullets).map((p) =>
      `<div class="item"><p class="line"><strong>${esc(p.name)}</strong>${esc(head(["", p.stack, p.link ? bare(p.link) : ""]))}</p>${ul(p.bullets)}</div>`).join("");
    const edu = cv.education.filter((e) => e.school || e.degree).map((e) =>
      `<div class="item"><p class="line"><strong>${esc(e.degree)}</strong>${esc(head(["", e.school, e.location, dates(e.start, e.end).replace(" – ", " - ")]))}</p>${e.detail ? `<p>${esc(e.detail)}</p>` : ""}</div>`).join("");
    const skills = cv.skills.filter((s) => s.items.trim()).map((s) => `<p><strong>${esc(s.group)}${s.group ? ":" : ""}</strong> ${rich(csv(s.items).join(", "))}</p>`).join("");
    const contact = [b.email, b.phone, b.location, b.linkedin && bare(b.linkedin), b.github && bare(b.github), b.website && bare(b.website)].filter(Boolean).join(" | ");
    return `<div class="cv tpl-ats"><h1>${esc(b.name || "Your Name")}</h1>${b.title ? `<p class="headline">${esc(b.title)}</p>` : ""}<p class="contact">${esc(contact)}</p>
      ${sec("Summary", cv.summary.trim() ? `<p>${esc(cv.summary.trim())}</p>` : "")}${sec("Work Experience", exp)}${sec("Projects", proj)}${sec("Education", edu)}${sec("Skills", skills)}
      ${sec("Certifications", ul(cv.certifications))}${sec("Achievements", ul(cv.achievements))}</div>`;
  };

  /* ---------------- real .docx (the format most ATS parsers prefer) ---------------- */
  const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

  function zip(files) { // files: [{name, data: Uint8Array}] — stored, no compression
    const enc = new TextEncoder(), chunks = [], central = [];
    let offset = 0;
    const u16 = (n) => [n & 255, (n >>> 8) & 255], u32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const local = Uint8Array.from([].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(33), u32(crc), u32(size), u32(size), u16(name.length), u16(0)));
      chunks.push(local, name, f.data);
      central.push(Uint8Array.from([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(33), u32(crc), u32(size), u32(size),
        u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      offset += local.length + name.length + size;
    }
    const cdSize = central.reduce((n, c) => n + c.length, 0);
    const end = Uint8Array.from([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
    const all = chunks.concat(central, [end]);
    const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
    let p = 0;
    for (const c of all) { out.set(c, p); p += c.length; }
    return out;
  }

  G.toDocx = (cv) => {
    const enc = new TextEncoder();
    const xe = (s) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.sz ? `<w:sz w:val="${o.sz}"/>` : ""}</w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
    const para = (runs, o = {}) => `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ""}${o.ind ? `<w:ind w:left="${o.ind[0]}" w:hanging="${o.ind[1]}"/>` : ""}${o.center ? '<w:jc w:val="center"/>' : ""}</w:pPr>${runs}</w:p>`;
    const sep = (arr) => arr.filter(Boolean).join(" | ");
    const bullet = (t) => para(run("•\t" + t), { ind: [360, 360] });
    const body = [];
    const b = cv.basics;
    body.push(para(run(b.name || "Your Name"), { style: "Title" }));
    if (b.title) body.push(para(run(b.title), { center: true }));
    const contact = sep([b.email, b.phone, b.location, b.linkedin && bare(b.linkedin), b.github && bare(b.github), b.website && bare(b.website)]);
    if (contact) body.push(para(run(contact), { center: true }));
    const H = (t) => body.push(para(run(t), { style: "Heading1" }));
    const dr = (e) => dates(e.start, e.end).replace(" – ", " - ");
    if (cv.summary.trim()) { H("Summary"); body.push(para(run(cv.summary.trim()))); }
    const jobs = cv.experience.filter((e) => e.role || e.company || e.bullets);
    if (jobs.length) {
      H("Work Experience");
      jobs.forEach((e) => {
        body.push(para(run(e.role, { b: true }) + run(sep(["", e.company, e.location, dr(e)]))));
        lines(e.bullets).forEach((l) => body.push(bullet(l)));
      });
    }
    const projs = cv.projects.filter((p) => p.name || p.bullets);
    if (projs.length) {
      H("Projects");
      projs.forEach((p) => {
        body.push(para(run(p.name, { b: true }) + run(sep(["", p.stack, p.link && bare(p.link)]))));
        lines(p.bullets).forEach((l) => body.push(bullet(l)));
      });
    }
    const edus = cv.education.filter((e) => e.school || e.degree);
    if (edus.length) {
      H("Education");
      edus.forEach((e) => {
        body.push(para(run(e.degree, { b: true }) + run(sep(["", e.school, e.location, dr(e)]))));
        if (e.detail) body.push(para(run(e.detail)));
      });
    }
    const sk = cv.skills.filter((s) => s.items.trim());
    if (sk.length) { H("Skills"); sk.forEach((s) => body.push(para((s.group ? run(s.group + ": ", { b: true }) : "") + run(csv(s.items).join(", "))))); }
    if (cv.certifications.trim()) { H("Certifications"); lines(cv.certifications).forEach((l) => body.push(bullet(l))); }
    if (cv.achievements.trim()) { H("Achievements"); lines(cv.achievements).forEach((l) => body.push(bullet(l))); }

    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
      `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/></w:pBdr><w:spacing w:before="200" w:after="60"/></w:pPr><w:rPr><w:b/><w:caps/><w:sz w:val="22"/></w:rPr></w:style></w:styles>`;
    const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
    const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    return zip([
      { name: "[Content_Types].xml", data: enc.encode(ct) },
      { name: "_rels/.rels", data: enc.encode(rels) },
      { name: "word/document.xml", data: enc.encode(doc) },
      { name: "word/styles.xml", data: enc.encode(styles) },
      { name: "word/_rels/document.xml.rels", data: enc.encode(docRels) }
    ]);
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
/* ATS: plain, linear, black on white — no colour, columns or decoration */
.cv.tpl-ats{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.4;color:#000}
.cv.tpl-ats h1{font-size:18pt;text-align:center;margin:0 0 2px}
.cv.tpl-ats h2{font-size:11pt;border:0;border-bottom:1px solid #000;margin:14px 0 5px;padding-bottom:2px;letter-spacing:.5px}
.cv.tpl-ats p{margin:2px 0}
.cv.tpl-ats .headline,.cv.tpl-ats .contact{text-align:center}
.cv.tpl-ats .line{margin-top:6px}
.cv.tpl-ats .item{margin-bottom:4px}
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
