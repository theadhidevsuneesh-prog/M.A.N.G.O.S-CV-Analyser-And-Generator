/* Run with:  node tests/generator.test.js   (optionally pass an output path to keep the sample .docx) */
const assert = require("assert");
const fs = require("fs");
require("../js/data.js");
require("../js/analyzer.js");
require("../js/generator.js");
const { Generator: G, Analyzer: A } = globalThis.MANGOS;

/* ---- date normalisation ---- */
assert.strictEqual(G.normDate("03/2021"), "Mar 2021");
assert.strictEqual(G.normDate("2021-07"), "Jul 2021");
assert.strictEqual(G.normDate("September 2020"), "Sep 2020");
assert.strictEqual(G.normDate("Sept, 2020"), "Sep 2020");
assert.strictEqual(G.normDate("current"), "Present");
assert.strictEqual(G.normDate("2019"), "2019");

/* ---- a deliberately messy CV ---- */
const messy = G.sample();
messy.experience[0].start = "01/2021";
messy.experience[0].end = "till date";
messy.experience[1].start = "June 2018";
messy.experience[0].bullets = "• Led a team of 4 — shipped “Atlas” → saved $210k ★\n✓ Cut latency 62%";
messy.skills[0].items = "Java (90%), Go ★★★★, Python – Expert, Java";
messy.projects.push(G.emptyItem.projects());

const before = G.atsCheck(messy, { atsMode: false });
const failing = before.filter((c) => !c.ok).map((c) => c.id);
console.log("failing before:", failing.join(", "));
["dates", "chars", "skillbars", "empty", "layout"].forEach((id) => assert(failing.includes(id), "should flag " + id));

const fixed = G.atsFix(messy);
console.log("changes:", fixed.changes);
const after = G.atsCheck(fixed.cv, { atsMode: true });
const stillFailing = after.filter((c) => !c.ok).map((c) => c.id);
console.log("failing after:", stillFailing.join(", ") || "(none)");
["dates", "chars", "skillbars", "empty", "layout"].forEach((id) => assert(!stillFailing.includes(id), id + " should be fixed"));
assert.strictEqual(fixed.cv.experience[0].start, "Jan 2021");
assert.strictEqual(fixed.cv.experience[0].end, "Present");
assert.strictEqual(fixed.cv.experience[1].start, "Jun 2018");
assert(!/[★“”→—]/.test(JSON.stringify(fixed.cv)), "fancy chars removed");
assert.strictEqual(fixed.cv.skills[0].items, "Java, Go, Python", "skills cleaned + de-duplicated: " + fixed.cv.skills[0].items);
assert.strictEqual(messy.experience[0].start, "01/2021", "original must not be mutated");

/* ---- ATS render has no flex/rows/links/marks ---- */
const html = G.render(fixed.cv, { template: "ats" });
assert(!/class="row"|<a |<mark/.test(html), "ATS html must be plain");
assert(/Work Experience/.test(html));

/* ---- plain text round-trips through the analyser ---- */
const a = A.analyze(G.toText(fixed.cv));
console.log("analyser score of fixed CV:", a.score);
assert(a.contact.email && a.years > 5);

/* ---- docx package ---- */
const bytes = G.toDocx(fixed.cv);
assert(bytes[0] === 0x50 && bytes[1] === 0x4b, "zip signature");
const out = process.argv[2] || require("path").join(require("os").tmpdir(), "mangos-test.docx");
fs.writeFileSync(out, bytes);
console.log("docx written:", out, bytes.length, "bytes");
console.log("\nAll generator tests passed.");
