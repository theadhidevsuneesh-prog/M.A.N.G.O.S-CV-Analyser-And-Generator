/* M.A.N.G.O.S — resume analyser.
 * Pure functions (no DOM) so it runs in the browser and in Node (see tests/analyzer.test.js).
 * Everything is heuristic: it reads the text the way a senior engineer skims a resume,
 * and it is deliberately blunt. It cannot verify that claims are true.
 */
(function (g) {
  const M = (g.MANGOS = g.MANGOS || {});
  const A = (M.Analyzer = {});

  /* ------------------------------------------------------------------ */
  /* term matching                                                       */
  /* ------------------------------------------------------------------ */
  const GO_SRC = "golang|(?<![a-z0-9.+#])go(?=\\s*[,|/)]|\\s*$)";
  const C_SRC = "(?<![a-z0-9.+#])c(?=\\s*[,|/)])|embedded c|c programming";
  const R_SRC = "(?<![a-z0-9.+#])r(?=\\s*[,|/)])";
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
  const srcCache = new Map();
  const reCache = new Map();

  /** regex source (no flags) for a term definition */
  function termSource(term) {
    if (srcCache.has(term)) return srcCache.get(term);
    let src;
    if (term.startsWith("re:")) {
      src = term.slice(3);
    } else {
      src = term
        .split("|")
        .map((alias) => {
          alias = alias.trim().toLowerCase();
          if (alias === "go") return GO_SRC;
          if (alias === "c") return C_SRC;
          if (alias === "r") return R_SRC;
          return "(?<![a-z0-9_])" + reEsc(alias) + "(?![a-z0-9_])";
        })
        .join("|");
    }
    srcCache.set(term, src);
    return src;
  }

  function termRegex(term) {
    if (!reCache.has(term)) reCache.set(term, new RegExp(termSource(term), "m"));
    return reCache.get(term);
  }

  /** true if the (lower-case) text contains the term */
  const has = (lower, term) => termRegex(term).test(lower);
  /** display label for a term = first alias */
  const SPECIAL_LABELS = { go: "Go", c: "C", r: "R" };
  const label = (term) => {
    if (term.startsWith("re:")) {
      if (term.includes("golang")) return "Go";
      if (term.includes("embedded c")) return "C";
      if (term.includes("])r(")) return "R";
      return term.slice(3);
    }
    const first = term.split("|")[0];
    return SPECIAL_LABELS[first] || first;
  };
  /** prefix match for culture/signal stems (very short stems must be whole words) */
  const hasStem = (lower, stem) => {
    const s = stem.toLowerCase();
    if (/^[a-z]{1,3}$/.test(s)) return new RegExp("(?<![a-z0-9])" + s + "(?![a-z0-9])").test(lower);
    if (/^[a-z0-9]/.test(s)) return new RegExp("(?<![a-z0-9])" + reEsc(s)).test(lower);
    return lower.includes(s);
  };

  A.termSource = termSource;
  A.termRegex = termRegex;
  A.has = has;
  A.label = label;

  /* ------------------------------------------------------------------ */
  /* parsing                                                             */
  /* ------------------------------------------------------------------ */
  const SECTION_PATTERNS = {
    summary: /^(professional\s+|career\s+|executive\s+)?(summary|profile|objective|about( me)?|career objective|personal statement)$/,
    experience: /^(work\s+|professional\s+|relevant\s+|industry\s+|internship\s+)?(experience|employment( history)?|work history|career history|internships?)$/,
    education: /^(education|academic( background| qualifications| profile)?|qualifications|education (&|and) training)$/,
    skills: /^(technical\s+|key\s+|core\s+|it\s+)?(skills|competencies|technologies|tech stack|skills (&|and) tools|tools (&|and) technologies|skills summary|technical expertise)$/,
    projects: /^((personal|academic|key|selected|side|notable|open[- ]source)\s+)?projects?( (&|and) open[- ]source)?$/,
    certifications: /^(certifications?|licen[sc]es?( (&|and) certifications?)?|courses|training|certificates?)$/,
    achievements: /^(achievements?|awards?|honou?rs?|accomplishments|awards (&|and) honou?rs?|extra[- ]?curricular.*|activities|leadership|volunteering|publications?)$/
  };

  const BULLET_RE = /^\s*(?:[•\u2022\u25CF\u25CB\u25AA\u25A0\u2023\u2043\u2219·▪►➢➤✓✔→]\s*|[-–—*]\s+|\d{1,2}[.)]\s+)/;
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const MON = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
  const RANGE_NAMED = new RegExp("(?:" + MON + "\\.?,?\\s+)?((?:19|20)\\d{2})\\s*(?:-|–|—|to|until|till)\\s*(?:(present|current|now|ongoing|till date|today|date)|(?:" + MON + "\\.?,?\\s+)?((?:19|20)\\d{2}))", "gi");
  const RANGE_NUMERIC = /(\d{1,2})[\/.](\d{4})\s*(?:-|–|—|to|until)\s*(?:(present|current|now|ongoing|till date|today)|(\d{1,2})[\/.](\d{4}))/gi;

  const clean = (s) =>
    s.replace(/\r\n?/g, "\n").replace(/[\u00A0\u2007\u202F]/g, " ").replace(/\f/g, "\n").replace(/[ \t]+/g, " ");

  function headerOf(line) {
    const t = line.replace(/[:\-–—_=*#|]+$/g, "").replace(/^[#*\-–—_=\s]+/, "").trim().toLowerCase();
    if (!t || t.length > 42) return null;
    for (const [name, re] of Object.entries(SECTION_PATTERNS)) if (re.test(t)) return name;
    return null;
  }

  const monthIndex = (y, m) => y * 12 + m;
  function nowIndex() {
    const d = new Date();
    return monthIndex(d.getFullYear(), d.getMonth());
  }

  function findRanges(line, lineNo) {
    const out = [];
    let m;
    RANGE_NAMED.lastIndex = 0;
    while ((m = RANGE_NAMED.exec(line))) {
      const sm = m[1] ? MONTHS[m[1].slice(0, 3).toLowerCase()] : null;
      const sy = +m[2];
      const present = !!m[3];
      const em = m[4] ? MONTHS[m[4].slice(0, 3).toLowerCase()] : null;
      const ey = m[5] ? +m[5] : null;
      out.push({
        start: monthIndex(sy, sm ?? 5),
        end: present ? nowIndex() : monthIndex(ey, em ?? 5),
        present,
        precise: sm !== null && (present || em !== null),
        line: lineNo,
        text: m[0]
      });
    }
    RANGE_NUMERIC.lastIndex = 0;
    while ((m = RANGE_NUMERIC.exec(line))) {
      const present = !!m[3];
      out.push({
        start: monthIndex(+m[2], Math.min(11, Math.max(0, +m[1] - 1))),
        end: present ? nowIndex() : monthIndex(+m[5], Math.min(11, Math.max(0, +m[4] - 1))),
        present,
        precise: true,
        line: lineNo,
        text: m[0]
      });
    }
    return out.filter((r) => r.end >= r.start);
  }

  function parse(rawText) {
    const text = clean(rawText || "");
    const lines = text.split("\n").map((l) => l.trim());
    const nonEmpty = lines.filter(Boolean);
    const lower = text.toLowerCase();

    /* sections */
    const sections = {};
    let current = "header";
    sections.header = [];
    const lineSection = [];
    lines.forEach((line, i) => {
      const h = line ? headerOf(line) : null;
      if (h) {
        current = h;
        sections[h] = sections[h] || [];
        lineSection[i] = "__header__";
        return;
      }
      lineSection[i] = current;
      if (line) (sections[current] = sections[current] || []).push({ text: line, no: i });
    });

    /* contact */
    const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || null;
    const phone = (text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?){2,4}\d{2,4}/g) || []).find((p) => p.replace(/\D/g, "").length >= 9 && p.replace(/\D/g, "").length <= 15 && !/^(19|20)\d{2}/.test(p.trim())) || null;
    const linkedin = (text.match(/linkedin\.com\/(?:in|pub)\/[\w%-]+/i) || [])[0] || null;
    const github = (text.match(/github\.com\/[\w-]+/i) || [])[0] || null;
    const urls = text.match(/https?:\/\/[^\s)]+|(?:www\.)[^\s)]+/gi) || [];
    const website = urls.find((u) => !/linkedin|github/i.test(u)) || null;
    const nameGuess = (nonEmpty.find((l) => l.split(" ").length <= 5 && /^[A-Za-z .'-]{3,40}$/.test(l) && !headerOf(l)) || null);

    /* bullets (experience + projects) */
    const bulletSource = [].concat(sections.experience || [], sections.projects || []);
    const hasBulletChars = bulletSource.some((l) => BULLET_RE.test(l.text));
    const bullets = [];
    let prev = null;
    for (const l of bulletSource) {
      const isBullet = BULLET_RE.test(l.text);
      const body = l.text.replace(BULLET_RE, "").trim();
      const hasDate = findRanges(l.text, l.no).length > 0;
      if (isBullet) {
        prev = { text: body, no: l.no };
        bullets.push(prev);
      } else if (prev && !hasDate && /^[a-z(]/.test(body) && body.split(" ").length < 40) {
        prev.text += " " + body; // wrapped line
      } else if (!hasBulletChars && !hasDate && body.split(" ").length >= 7) {
        prev = { text: body, no: l.no };
        bullets.push(prev);
      } else {
        prev = null;
      }
    }

    /* dates → experience intervals */
    const dateSource = sections.experience && sections.experience.length
      ? sections.experience
      : lines.map((t, no) => ({ text: t, no })).filter((l) => l.text && lineSection[l.no] !== "education");
    const ranges = [];
    for (const l of dateSource) ranges.push(...findRanges(l.text, l.no));
    for (const r of ranges) {
      const around = (lines[r.line] + " " + (lines[r.line - 1] || "") + " " + (lines[r.line + 1] || "")).toLowerCase();
      r.intern = /\bintern(ship)?\b|trainee|apprentice/.test(around);
      r.contract = /\bcontract|freelance|consultant|part[- ]time\b/.test(around);
    }
    const intervals = ranges.slice().sort((a, b) => a.start - b.start);
    let months = 0;
    let cur = null;
    for (const r of intervals) {
      if (!cur) cur = { s: r.start, e: r.end };
      else if (r.start <= cur.e) cur.e = Math.max(cur.e, r.end);
      else {
        months += cur.e - cur.s;
        cur = { s: r.start, e: r.end };
      }
    }
    if (cur) months += cur.e - cur.s;
    const years = Math.round((months / 12) * 10) / 10;

    const gaps = [];
    for (let i = 1; i < intervals.length; i++) {
      const gap = intervals[i].start - intervals[i - 1].end;
      if (gap > 9) gaps.push({ months: gap, after: intervals[i - 1].text, before: intervals[i].text });
    }
    const roleLike = intervals.filter((r) => !r.intern);
    const shortStints = roleLike.filter((r) => r.end - r.start < 8 && !r.present && !r.contract);

    const words = (text.match(/\b[\w'+#./-]+\b/g) || []).length;

    return {
      text, lower, lines, nonEmpty, sections, bullets, ranges: intervals, years, gaps, shortStints,
      roleCount: roleLike.length,
      words, pages: Math.round((words / 520) * 10) / 10,
      contact: { email, phone, linkedin, github, website, name: nameGuess }
    };
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const firstWord = (s) => (s.match(/^[A-Za-z][A-Za-z'-]*/) || [""])[0].toLowerCase();
  const wc = (s) => (s.match(/\S+/g) || []).length;

  function stripDates(s) {
    return s
      .replace(new RegExp("\\b" + MON + "\\.?,?\\s+(19|20)\\d{2}\\b", "gi"), " ")
      .replace(/\b(19|20)\d{2}\b/g, " ")
      .replace(/\b\d{1,2}[\/.]\d{4}\b/g, " ");
  }
  const hasMetric = (s) => {
    const t = stripDates(s);
    return /\d+(\.\d+)?\s?(%|x\b|×|k\b|m\b|b\b|ms\b|s\b|sec|hrs?|hours|days|weeks|months|users|requests|rps|qps|gb|tb|mb|engineers|developers|services|customers|clients|teams|people|\+)|[$₹€£]\s?\d|\b\d{2,}\b|\b\d+\s?(x|fold)\b|\b(half|double|doubled|tripled|halved)\b/i.test(t);
  };
  const OUTCOME = /\b(reduc|increas|improv|sav|cut|grew|boost|accelerat|decreas|eliminat|doubl|tripl|halv|slash|rais|lower|speed|faster|shorten|improv|enabl|prevent|avoid)\w*/i;

  /* ------------------------------------------------------------------ */
  /* the analysis                                                        */
  /* ------------------------------------------------------------------ */
  function analyze(rawText, opts) {
    opts = opts || {};
    const P = parse(rawText);
    const { lower, bullets, sections, contact } = P;
    const findings = []; // {cat, type: good|bad|warn, title, detail}
    const F = (cat, type, title, detail) => findings.push({ cat, type, title, detail: detail || "" });
    const B = bullets.length;
    const level = P.years < 1 ? "Fresher / Intern" : P.years < 3 ? "Junior" : P.years < 6 ? "Mid-level" : P.years < 10 ? "Senior" : "Staff+ / Lead";

    /* ---------- tech detection ---------- */
    const techFound = {};
    const techAll = [];
    for (const [cat, terms] of Object.entries(M.TECH)) {
      for (const t of terms) {
        if (has(lower, t)) {
          (techFound[cat] = techFound[cat] || []).push(label(t));
          techAll.push(t);
        }
      }
    }
    const uniqueTech = Array.from(new Set(techAll));
    const techCats = Object.keys(techFound).filter((c) => c !== "Concepts");

    /* ---------- 1. IMPACT (25) ---------- */
    let impact = 0;
    const metricBullets = bullets.filter((b) => hasMetric(b.text));
    const outcomeBullets = bullets.filter((b) => OUTCOME.test(b.text));
    const metricRatio = B ? metricBullets.length / B : 0;
    if (!B) {
      F("impact", "bad", "I couldn't find achievement bullets", "No bullet points were detected under Experience/Projects. If your bullets are in images, tables or odd columns, an ATS (and I) can't read them either.");
    } else {
      impact = 0.7 * clamp(metricRatio / 0.5) + 0.3 * clamp(outcomeBullets.length / B / 0.4);
      const pct = Math.round(metricRatio * 100);
      if (metricRatio >= 0.5) F("impact", "good", `${pct}% of bullets carry numbers`, "That's what I want to see: scale, speed, money, users — evidence rather than adjectives.");
      else if (metricRatio >= 0.25) F("impact", "warn", `Only ${pct}% of bullets are quantified`, "Aim for at least half. For every bullet ask: how many, how much faster, how much cheaper, how many users?");
      else F("impact", "bad", `Just ${pct}% of bullets contain a number`, "This reads as a job description, not a track record. I can't tell if you shipped something small or something that mattered.");
      if (outcomeBullets.length / B < 0.25) F("impact", "bad", "Bullets describe activity, not outcomes", "Most lines say what you did, not what changed because of it. Add the result: reduced / increased / eliminated / enabled…");
    }

    /* ---------- 2. LANGUAGE (15) ---------- */
    let language = 0;
    const bulletIssues = [];
    if (B) {
      let strong = 0, weakCount = 0, pron = 0, longB = 0, shortB = 0;
      const starts = {};
      for (const b of bullets) {
        const issues = [];
        const fw = firstWord(b.text);
        starts[fw] = (starts[fw] || 0) + 1;
        if (M.STRONG_VERBS.has(fw)) strong++;
        else issues.push({ k: "weak-start", m: `Opens with "${fw || "…"}" — start with a strong, specific verb (Built, Cut, Led, Shipped…).` });
        const bl = b.text.toLowerCase();
        const weak = M.WEAK_PHRASES.find((p) => hasStem(bl, p) && new RegExp("(?<![a-z])" + reEsc(p) + "(?![a-z])").test(bl));
        if (weak) {
          weakCount++;
          issues.push({ k: "weak-phrase", m: `"${weak}" hides your contribution. Try: ${M.WEAK_REPLACEMENTS[weak] || "a concrete verb + the outcome"}.` });
        }
        if (/\b(i|my|me|myself)\b/i.test(b.text)) { pron++; issues.push({ k: "pronoun", m: "First-person pronouns don't belong on a resume — drop 'I/my'." }); }
        const n = wc(b.text);
        if (n > 34) { longB++; issues.push({ k: "long", m: `${n} words — too long to skim. Split it or cut to the result.` }); }
        if (n < 5) { shortB++; issues.push({ k: "short", m: "Too thin to say anything. What did you build, and what changed?" }); }
        if (!hasMetric(b.text)) issues.push({ k: "no-metric", m: "No number. Add scale, speed, cost, users or time saved (only if true)." });
        if (issues.length) bulletIssues.push({ text: b.text, issues, weight: issues.reduce((a, i) => a + (i.k === "no-metric" ? 1 : 2), 0) });
      }
      const cliches = M.CLICHES.filter((c) => lower.includes(c));
      const strongRatio = strong / B;
      language = clamp(
        0.35 * clamp(strongRatio / 0.75) +
          0.2 * (1 - clamp(weakCount / Math.max(3, B * 0.3))) +
          0.15 * (1 - clamp(cliches.length / 3)) +
          0.15 * (1 - clamp(pron / 4)) +
          0.15 * (1 - clamp((longB + shortB) / B / 0.3))
      );
      if (strongRatio >= 0.7) F("language", "good", "Bullets start with strong action verbs", `${Math.round(strongRatio * 100)}% open with a real verb.`);
      else F("language", strongRatio < 0.4 ? "bad" : "warn", `Only ${Math.round(strongRatio * 100)}% of bullets open with a strong verb`, "Weak openers (\"Responsible for…\", \"Worked on…\") make you sound like a passenger.");
      if (weakCount >= 2) F("language", "bad", `${weakCount} bullets use passive/weak phrasing`, "\"Responsible for\", \"helped\", \"worked on\" — I can't tell what *you* did. Say what you owned.");
      if (cliches.length) F("language", "bad", `Resume clichés: ${cliches.slice(0, 5).map((c) => `"${c}"`).join(", ")}`, "Everyone writes these; nobody believes them. Delete them and let a bullet prove the trait instead.");
      if (pron) F("language", "warn", `${pron} bullets use "I/my"`, "Write in implied first person: \"Built…\", not \"I built…\".");
      if (longB / B > 0.25) F("language", "warn", `${longB} bullets run past ~34 words`, "Hiring managers skim for 6–10 seconds. One idea per bullet, result at the front.");
      const topStart = Object.entries(starts).sort((a, b) => b[1] - a[1])[0];
      if (topStart && topStart[1] >= 3 && topStart[1] / B > 0.25 && topStart[0]) F("language", "warn", `"${topStart[0]}" opens ${topStart[1]} bullets`, "Repetition reads as lazy. Vary the verbs — and make sure each one is true to what you did.");
    } else {
      F("language", "bad", "No bullets to assess", "Without bullet points I can't judge how you communicate achievements.");
    }

    /* ---------- 3. TECHNICAL DEPTH (20) ---------- */
    let tech = 0;
    const depth = M.DEPTH_SIGNALS.filter((s) => hasStem(lower, s));
    const skillsText = (sections.skills || []).map((l) => l.text.toLowerCase()).join("\n");
    const bodyText = [].concat(sections.experience || [], sections.projects || []).map((l) => l.text.toLowerCase()).join("\n");
    let evidence = 0, listed = 0;
    const unevidenced = [];
    if (skillsText) {
      for (const t of uniqueTech) {
        if (has(skillsText, t)) {
          listed++;
          if (has(bodyText, t)) evidence++;
          else unevidenced.push(label(t));
        }
      }
    }
    const evidenceRatio = listed ? evidence / listed : uniqueTech.length ? 0.5 : 0;
    tech = clamp(
      0.35 * clamp(uniqueTech.length / 12) +
        0.25 * clamp(techCats.length / 5) +
        0.25 * clamp(depth.length / 6) +
        0.15 * evidenceRatio
    );
    if (uniqueTech.length > 45) { tech = Math.max(0, tech - 0.15); F("tech", "bad", `${uniqueTech.length} technologies listed`, "That's keyword stuffing. Nobody is deep in 45 things; I'll assume you're shallow in all of them. Cut to what you'd defend in an interview."); }
    if (uniqueTech.length >= 8) F("tech", "good", `Clear technical footprint (${uniqueTech.length} technologies across ${techCats.length} areas)`, techCats.join(" · "));
    else if (uniqueTech.length > 0) F("tech", "warn", `Thin technical footprint (${uniqueTech.length} recognised technologies)`, "I can't build a picture of your stack. Name languages, frameworks, datastores and cloud explicitly.");
    else F("tech", "bad", "I can't find a technical stack", "No recognisable languages, frameworks or tools. For an engineering role this is a screen-out.");
    if (depth.length >= 6) F("tech", "good", "Shows engineering depth, not just tool names", `Signals such as: ${depth.slice(0, 6).join(", ")}.`);
    else if (uniqueTech.length) F("tech", "warn", "Tools are listed but depth is hard to see", "Where's scale, performance, reliability, design decisions, trade-offs? That's what separates a user of a tool from an engineer.");
    if (listed >= 6 && evidenceRatio < 0.5) F("tech", "bad", `${listed - evidence} of ${listed} listed skills never appear in your experience or projects`, `e.g. ${unevidenced.slice(0, 6).join(", ")}. A skill without evidence is a liability — I'll probe exactly those in the interview.`);
    else if (listed >= 6 && evidenceRatio >= 0.7) F("tech", "good", "Skills are backed by experience", "Most listed technologies appear in real project/job bullets — that's credible.");
    if (/(?:python|java|javascript|sql|react|aws|docker|c\+\+|node)[^\n]{0,25}(?:\d{2,3}\s?%|[★●■]{2,}|expert|beginner|intermediate|advanced)/i.test(P.text) || /[★●■▪]{3,}|\b\d{2}\s?%\s*\n?\s*(?:python|java|js|sql)/i.test(P.text))
      F("tech", "bad", "Skill-level bars / percentages / self-ratings", "'Python 90%' means nothing and ATS can't parse the graphics. Group skills by area and let projects prove the level.");

    /* ---------- 4. STRUCTURE & ATS (15) ---------- */
    const hasExp = !!(sections.experience && sections.experience.length);
    const hasProj = !!(sections.projects && sections.projects.length);
    const hasEdu = !!(sections.education && sections.education.length);
    const hasSkills = !!(sections.skills && sections.skills.length);
    const secScore = ((hasExp || hasProj ? 1 : 0) + (hasEdu ? 1 : 0) + (hasSkills ? 1 : 0)) / 3;
    const contactScore = ((contact.email ? 1 : 0) + (contact.phone ? 1 : 0) + (contact.linkedin || contact.github ? 1 : 0)) / 3;
    let lengthScore = 1;
    const maxPages = P.years < 8 ? 1.15 : 2.15;
    if (P.words < 200) lengthScore = 0.25;
    else if (P.words < 300) lengthScore = 0.65;
    else if (P.pages > maxPages + 0.9) lengthScore = 0.35;
    else if (P.pages > maxPages) lengthScore = 0.7;
    const dateScore = P.ranges.length ? 1 : 0.2;
    const structure = clamp(0.35 * secScore + 0.25 * contactScore + 0.2 * lengthScore + 0.2 * dateScore);
    if (!hasExp && !hasProj) F("structure", "bad", "No Experience or Projects section found", "Use plain, standard headings (Experience, Projects, Education, Skills) — ATS parsers key off them.");
    if (!hasEdu) F("structure", "warn", "No Education section detected", "Even if self-taught, list degree/courses/certifications under a standard heading.");
    if (!hasSkills) F("structure", "warn", "No Skills section detected", "A scannable Skills block is how recruiters (and ATS keyword filters) find you.");
    if (hasExp && hasEdu && hasSkills) F("structure", "good", "Standard, parseable section structure", "Experience / Education / Skills are all present under conventional headings.");
    if (!contact.email) F("structure", "bad", "No email address found", "If I can't contact you in two seconds, the resume ends here.");
    if (!contact.phone) F("structure", "warn", "No phone number found", "Recruiters often call first. Add one.");
    if (!contact.linkedin && !contact.github) F("structure", "warn", "No LinkedIn or GitHub link", "For engineers, a GitHub (or portfolio) link lets me verify instead of guess.");
    else if (contact.github) F("structure", "good", "GitHub link present", "Make sure the pinned repos are clean, have READMEs and recent commits — I will click.");
    if (P.words >= 200 && P.pages > maxPages) F("structure", P.pages > maxPages + 0.9 ? "bad" : "warn", `~${P.pages} pages of content`, `With ${P.years || "<1"} years' experience, I expect ${P.years < 8 ? "one page" : "at most two"}. Cut the oldest and least relevant material first.`);
    else if (P.words >= 300) F("structure", "good", `Length looks right (~${P.pages} pages)`, "");
    if (P.words < 200) F("structure", "bad", "Very little content", "Under ~200 words I can't evaluate you at all — this will be rejected on sight.");
    const fancy = (P.text.match(/[★☆●■▪✓✔►➢➤→\u{1F300}-\u{1FAFF}☀-➿]/gu) || []).length;
    if (fancy >= 2) F("structure", "warn", `${fancy} decorative symbols / emoji`, "Icons, arrows and star ratings often turn into garbage in an ATS. Use plain text and standard bullets.");
    if (!P.ranges.length && P.words >= 150) F("structure", "warn", "No date ranges detected", "Roles and education need clear start/end dates (e.g. Jan 2022 – Present). Missing dates look like hiding something.");

    /* ---------- 5. CREDIBILITY & SENIORITY (15) ---------- */
    const ownership = M.OWNERSHIP_VERBS.filter((v) => new RegExp("(?<![a-z])" + reEsc(v) + "(?![a-z])").test(lower));
    const expected = P.years < 2 ? 1 : P.years < 5 ? 2 : 4;
    const links = (P.text.match(/https?:\/\/|github\.com|gitlab\.com|bitbucket|\.dev\b|\.io\b|demo|live at|deployed/gi) || []).length;
    let credibility = 0;
    credibility += 0.25 * (contact.github || links >= 2 ? 1 : links ? 0.5 : 0);
    credibility += 0.25 * clamp(ownership.length / expected);
    let stability = 1;
    if (P.gaps.length) stability -= 0.4;
    if (P.shortStints.length >= 3 || (P.roleCount >= 4 && P.years / P.roleCount < 1)) stability -= 0.5;
    else if (P.shortStints.length === 2) stability -= 0.25;
    credibility += 0.25 * clamp(stability);
    credibility += 0.25 * clamp((hasProj ? 0.5 : 0) + (hasExp ? 0.5 : 0) + (/(open[- ]source|pull request|contribut|hackathon|publication|patent|talk|award|rank|winner)/i.test(lower) ? 0.25 : 0));
    credibility = clamp(credibility);
    if (ownership.length >= expected) F("credibility", "good", "Shows ownership and scope", `Words like ${ownership.slice(0, 4).join(", ")} signal you drive work rather than just receive it.`);
    else F("credibility", P.years >= 3 ? "bad" : "warn", "Weak ownership / scope signals", `${P.years >= 3 ? "At your experience level I expect to see leading, designing, mentoring and owning." : "Even early in your career, show where you took initiative."} Where did you decide, not just execute?`);
    if (P.gaps.length) F("credibility", "warn", `Unexplained gap${P.gaps.length > 1 ? "s" : ""} in timeline (${P.gaps.map((x) => x.months + " months").join(", ")})`, "Gaps are fine when explained — study, caregiving, freelancing, a project. Silence invites worse assumptions.");
    if (P.shortStints.length >= 3) F("credibility", "bad", `${P.shortStints.length} stints under 8 months`, "That pattern reads as a retention risk. If they were contracts or acquisitions, label them.");
    if (!contact.github && links < 2 && uniqueTech.length) F("credibility", "warn", "Nothing I can verify", "No GitHub, deployed demo or repo links. Claims without proof get discounted.");
    if (/\b(expert|guru|ninja|rockstar|wizard|master)\b/i.test(P.text)) F("credibility", "bad", "Self-assigned superlatives (expert / ninja / rockstar)", "Let results do the talking. Titles like 'ninja' make senior reviewers wince.");
    if (P.years >= 4 && !/(mentor|led|lead|review|onboard|coach|guided)/i.test(lower)) F("credibility", "warn", "No mentoring or leadership signal for your experience level", "Senior roles are about multiplying others — code review, mentoring, design docs, running projects.");

    /* ---------- 6. PRESENTATION (10) ---------- */
    const typos = Object.keys(M.MISSPELLINGS).filter((w) => new RegExp("(?<![a-z])" + w + "(?![a-z])", "i").test(lower));
    const bulletChars = new Set(bullets.map((b) => { const m = (sections.experience || []).concat(sections.projects || []).find((l) => l.no === b.no); return m ? (m.text.match(BULLET_RE) || [""])[0].trim().charAt(0) : ""; }).filter(Boolean));
    const summaryText = (sections.summary || []).map((l) => l.text).join(" ");
    const summaryWords = wc(summaryText);
    const numericDates = (P.text.match(/\b\d{1,2}[\/.]\d{4}\b/g) || []).length;
    const namedDates = (P.text.match(new RegExp("\\b" + MON + "\\.?\\s+(19|20)\\d{2}\\b", "gi")) || []).length;
    const mixedDates = numericDates >= 2 && namedDates >= 2;
    const emailBad = contact.email && /(cutie|sexy|baby|hotboy|hotgirl|king|queen|killer|bro\d|boss\d|[a-z]{2,}\d{4,}@)/i.test(contact.email);
    const upperLines = P.nonEmpty.filter((l) => l.length > 25 && l === l.toUpperCase() && /[A-Z]{4}/.test(l)).length;
    let presentation = 1;
    presentation -= clamp(typos.length * 0.2, 0, 0.6);
    if (bulletChars.size > 1) presentation -= 0.15;
    if (mixedDates) presentation -= 0.15;
    if (emailBad) presentation -= 0.15;
    if (upperLines > 4) presentation -= 0.1;
    if (summaryWords && (summaryWords < 12 || summaryWords > 80)) presentation -= 0.1;
    if (!summaryWords && P.years >= 2) presentation -= 0.05;
    presentation = clamp(presentation);
    if (typos.length) F("presentation", "bad", `Spelling errors: ${typos.slice(0, 5).map((t) => `${t} → ${M.MISSPELLINGS[t]}`).join(", ")}`, "A typo on a resume tells me you don't review your own work. In code review terms, that's a blocker.");
    else if (P.words > 250) F("presentation", "good", "No common spelling errors spotted", "(Run it through a proper spell-checker too — this is a small dictionary.)");
    if (bulletChars.size > 1) F("presentation", "warn", "Inconsistent bullet symbols", `Found ${Array.from(bulletChars).join(" ")} — pick one.`);
    if (mixedDates) F("presentation", "warn", "Mixed date formats (Jan 2020 vs 01/2020)", "Consistency is a cheap signal of care. Pick one format.");
    if (emailBad) F("presentation", "bad", "Unprofessional email address", "Use firstname.lastname@… — it's the first line I read.");
    if (summaryWords > 80) F("presentation", "warn", "Summary is too long", `${summaryWords} words. Three lines max — who you are, what you're best at, proof.`);
    else if (summaryWords && summaryWords < 12) F("presentation", "warn", "Summary says almost nothing", "Make it a one-line pitch with your stack and a headline achievement.");
    else if (summaryWords) F("presentation", "good", "Concise summary present", "");
    if (!summaryWords && P.years >= 2) F("presentation", "warn", "No summary", "A two-line summary tailored to the role helps me place you in 5 seconds.");

    /* ---------- score ---------- */
    const WEIGHTS = { impact: 25, language: 15, tech: 20, structure: 15, credibility: 15, presentation: 10 };
    const NAMES = { impact: "Impact & metrics", language: "Language & clarity", tech: "Technical depth", structure: "Structure & ATS", credibility: "Credibility & seniority", presentation: "Presentation" };
    const raw = { impact, language, tech, structure, credibility, presentation };
    const categories = Object.keys(WEIGHTS).map((k) => ({
      id: k, name: NAMES[k], max: WEIGHTS[k], score: Math.round(raw[k] * WEIGHTS[k] * 10) / 10, ratio: raw[k]
    }));
    let score = categories.reduce((a, c) => a + c.score, 0);
    const caps = [];
    if (P.words < 120) { score = Math.min(score, 30); caps.push("Too little content to evaluate (capped at 30)."); }
    else if (!hasExp && !hasProj) { score = Math.min(score, 45); caps.push("No experience or projects found (capped at 45)."); }
    if (!contact.email && P.words >= 120) { score = Math.min(score, 70); caps.push("No email found (capped at 70)."); }
    // I can't verify a single claim from text alone, so nothing gets a perfect mark.
    if (score > 95) { score = 95; caps.push("Capped at 95 — claims can't be verified from a document alone."); }
    score = Math.round(score);

    const tier =
      score >= 85 ? { grade: "A", verdict: "Strong hire signal", line: "I'd fast-track this to a phone screen." }
      : score >= 72 ? { grade: "B", verdict: "Solid — interview", line: "I'd interview this person; I'd have a few probing questions." }
      : score >= 58 ? { grade: "C", verdict: "Borderline", line: "It might pass if the candidate pool is thin. It won't stand out." }
      : score >= 40 ? { grade: "D", verdict: "Likely filtered out", line: "I'd skip it in a stack of 200 resumes." }
      : { grade: "F", verdict: "Reject at screen", line: "As written, this doesn't get a reply." };

    /* ---------- narrative (senior-engineer voice) ---------- */
    const sorted = categories.slice().sort((a, b) => a.ratio - b.ratio);
    const weakest = sorted.slice(0, 2);
    const strongest = sorted[sorted.length - 1];
    const parts = [];
    parts.push(`I read this the way I read every resume: ten seconds, looking for proof you've shipped things that mattered. Reading as a ${level.toLowerCase()} candidate (${P.years ? "~" + P.years + " yrs of experience detected" : "no dated experience detected"}), it scores **${score}/100 — ${tier.verdict}.** ${tier.line}`);
    const WORKS = {
      impact: `${Math.round(metricRatio * 100)}% of your bullets are quantified — that's proof, not adjectives.`,
      language: "The wording is direct and action-led.",
      tech: `I can see a real stack (${uniqueTech.length} technologies across ${techCats.length} areas).`,
      structure: "It's clean and parseable — an ATS and a recruiter will both find what they need.",
      credibility: "There are ownership signals and things I can verify.",
      presentation: "It's tidy and consistent — no sloppiness to distract from the content."
    };
    if (strongest.ratio >= 0.6) parts.push(`What works: **${strongest.name.toLowerCase()}**. ${WORKS[strongest.id]}`);
    parts.push(`What's costing you most: **${weakest.map((w) => w.name.toLowerCase()).join("** and **")}**. ${weakest[0].id === "impact" ? "I can't see outcomes — right now I'd be guessing how good you are." : weakest[0].id === "tech" ? "I can't tell how deep your engineering goes." : weakest[0].id === "language" ? "The wording makes your contribution sound smaller than it probably was." : weakest[0].id === "structure" ? "Basic structure/contact problems are making an ATS or recruiter's job harder than it should be." : weakest[0].id === "credibility" ? "There's little I can verify or that shows you drive work." : "The details signal carelessness."}`);
    if (caps.length) parts.push("Hard limits applied: " + caps.join(" "));

    /* ---------- interview questions I'd ask ---------- */
    const questions = [];
    for (const [key, q] of Object.entries(M.QUESTIONS)) {
      if (has(lower, key)) questions.push(q);
      if (questions.length >= 4) break;
    }
    const mb = metricBullets[0];
    if (mb) questions.push(`You wrote: "${mb.text.length > 140 ? mb.text.slice(0, 137) + "…" : mb.text}" — what was the baseline, how did you measure it, and what was *your* part vs the team's?`);
    if (!questions.length) questions.push("Walk me through the most technically difficult thing you've built — what were the options and why did you choose that one?");
    questions.push("What's the weakest part of your resume, and what would you say if I asked you to defend it?");

    bulletIssues.sort((a, b) => b.weight - a.weight);

    return {
      score, grade: tier.grade, verdict: tier.verdict, verdictLine: tier.line, level, years: P.years,
      words: P.words, pages: P.pages, bulletCount: B, metricBullets: metricBullets.length,
      categories, findings, narrative: parts, questions,
      bulletIssues: bulletIssues.slice(0, 10),
      tech: { found: techFound, all: uniqueTech, depth },
      contact: P.contact, caps, lower, sections: Object.keys(sections).filter((s) => s !== "header" && sections[s].length),
      parsed: { ranges: P.ranges.length, gaps: P.gaps, roleCount: P.roleCount }
    };
  }

  /* ------------------------------------------------------------------ */
  /* company matching                                                    */
  /* ------------------------------------------------------------------ */
  function matchCompany(analysis, company, roleKey) {
    const lower = analysis.lower;
    const roleTerms = roleKey && M.ROLES[roleKey] ? M.ROLES[roleKey].tech : [];
    const techTerms = company.tech;
    const techHit = [], techMiss = [];
    for (const t of techTerms) (has(lower, t) ? techHit : techMiss).push(t);
    const roleHit = [], roleMiss = [];
    for (const t of roleTerms) (has(lower, t) ? roleHit : roleMiss).push(t);

    const sigHit = [], sigMiss = [];
    for (const s of company.signals) {
      const hits = s.terms.filter((t) => hasStem(lower, t));
      (hits.length ? sigHit : sigMiss).push({ name: s.name, hits: hits.slice(0, 4), terms: s.terms });
    }
    const techNeeded = Math.max(5, Math.ceil(techTerms.length * 0.65));
    const techScore = clamp(techHit.length / techNeeded);
    const roleScore = roleTerms.length ? clamp(roleHit.length / Math.max(4, Math.ceil(roleTerms.length * 0.6))) : null;
    // a signal counts fully only with two distinct pieces of evidence
    const allSig = company.signals.map((sg) => clamp(sg.terms.filter((t) => hasStem(lower, t)).length / 2));
    const sigScore = allSig.length ? allSig.reduce((a, b) => a + b, 0) / allSig.length : 0;
    const quality = analysis.score / 100;
    let s = roleScore === null ? 0.5 * techScore + 0.3 * sigScore + 0.2 * quality : 0.4 * techScore + 0.15 * roleScore + 0.28 * sigScore + 0.17 * quality;
    const score = Math.round(s * 100);
    const fit = score >= 75 ? "Strong match" : score >= 55 ? "Competitive with tailoring" : score >= 35 ? "Stretch — real gaps" : "Weak match today";

    const advice = [];
    if (techMiss.length) advice.push(`Missing from your resume: ${techMiss.slice(0, 6).map(label).join(", ")}. Only add what you can honestly defend — otherwise treat these as learning targets.`);
    for (const m of sigMiss.slice(0, 3)) advice.push(`No evidence of "${m.name}". ${company.name} weighs this; reframe existing work to show it (language like: ${m.terms.slice(0, 3).join(", ")}).`);
    if (analysis.score < 60) advice.push(`Fix the fundamentals first: a ${analysis.score}/100 resume loses to cleaner ones before keyword fit even matters.`);
    return { score, fit, techHit, techMiss, roleHit, roleMiss, sigHit, sigMiss, advice };
  }

  function rankCompanies(analysis, roleKey) {
    return M.COMPANIES.map((c) => ({ company: c, match: matchCompany(analysis, c, roleKey) })).sort((a, b) => b.match.score - a.match.score);
  }

  A.parse = parse;
  A.analyze = analyze;
  A.matchCompany = matchCompany;
  A.rankCompanies = rankCompanies;
  A.hasMetric = hasMetric;
  A.hasStem = hasStem;
})(typeof globalThis !== "undefined" ? globalThis : window);
