/* Run with:  node tests/analyzer.test.js   (no dependencies) */
const assert = require("assert");
require("../js/data.js");
require("../js/analyzer.js");
const { Analyzer: A, COMPANIES, ROLES } = globalThis.MANGOS;

const GOOD = `Alex Morgan
alex.morgan@example.com | +1 415 555 0134 | github.com/alexmorgan | linkedin.com/in/alexmorgan

SUMMARY
Backend engineer with 6 years building high-throughput payment services in Java and Go on AWS.

EXPERIENCE
Senior Software Engineer | Paytrail | Jan 2021 - Present
• Architected an event-driven settlement pipeline on Kafka processing 4M transactions/day, cutting reconciliation time from 6 hours to 25 minutes.
• Reduced p99 API latency by 62% (480ms to 180ms) by introducing Redis caching and query-plan tuning in PostgreSQL.
• Led a team of 4 engineers to migrate 12 services to Kubernetes, saving $210k per year in infrastructure cost.
• Mentored 3 junior engineers and introduced design reviews, lowering production incidents by 35%.

Software Engineer | Cartly | Jun 2018 - Dec 2020
• Built a REST API serving 1.2M requests/day using Spring Boot and MySQL, with 92% unit test coverage.
• Automated CI/CD with GitHub Actions, shrinking release time from 2 days to 20 minutes.
• Designed a feature-flag service adopted by 8 teams.

PROJECTS
Open-source rate limiter | github.com/alexmorgan/ratelimit
• Implemented a distributed token-bucket limiter in Go handling 50k req/s with Redis Lua scripts.

EDUCATION
B.Tech Computer Science | State University | 2014 - 2018

SKILLS
Languages: Java, Go, Python, SQL
Backend: Spring Boot, Kafka, Redis, PostgreSQL, MySQL, REST, microservices
Cloud & DevOps: AWS, Kubernetes, Docker, Terraform, GitHub Actions, CI/CD
`;

const BAD = `john
johnny_cutie99@mail.com

Objective
To work in a challenging position in a reputed company where I can use my skills. I am a hard-working team player and fast learner.

Experience
Responsible for working on various tasks in the team. Helped with the development of websites.
Worked on databse and handled many things etc.
I was involved in managment of the enviroment.

Skills
Python 90%, Java 80%, C, C++, JavaScript, React, Angular, Vue, Node, Django, Flask, Spring, AWS, Azure, GCP, Docker, Kubernetes, Kafka, Spark, Hadoop, Tableau
`;

const good = A.analyze(GOOD);
const bad = A.analyze(BAD);
console.log("GOOD:", good.score, good.grade, good.verdict, "| years", good.years, "| bullets", good.bulletCount);
console.log("BAD :", bad.score, bad.grade, bad.verdict);
good.categories.forEach((c) => console.log("  good", c.name.padEnd(26), c.score + "/" + c.max));
bad.categories.forEach((c) => console.log("  bad ", c.name.padEnd(26), c.score + "/" + c.max));

assert(good.score >= 78, "good resume should score highly, got " + good.score);
assert(bad.score <= 45, "bad resume should score low, got " + bad.score);
assert(good.score - bad.score >= 35, "scores should be well separated");
assert(good.years >= 6 && good.years <= 8.5, "years of experience ~7, got " + good.years);
assert(good.bulletCount >= 8, "bullets detected: " + good.bulletCount);
assert(good.tech.all.length >= 10, "tech detected: " + good.tech.all.length);
assert(good.contact.github && good.contact.email, "contact detected");
assert(bad.findings.some((f) => /spelling/i.test(f.title)), "typos flagged");
assert(bad.findings.some((f) => /clich/i.test(f.title)), "cliches flagged");
assert(bad.findings.some((f) => /Unprofessional email/i.test(f.title)), "email flagged");

/* Go / C detection must not fire on ordinary English */
assert(!A.has("we go to market and go live", "go"), "go false positive");
assert(A.has("languages: python, go, rust", "go"), "go detection");
assert(A.has("languages: c, c++, python", "c"), "c detection");
assert(A.has("built with c++ and c#", "c++") && A.has("built with c++ and c#", "c#"), "c++/c#");

/* company ranking: strongly-AWS/Java CV should rate Amazon above Intel */
const ranked = A.rankCompanies(good, "backend");
assert.strictEqual(ranked.length, COMPANIES.length);
const byId = Object.fromEntries(ranked.map((r) => [r.company.id, r.match.score]));
console.log("Top 5:", ranked.slice(0, 5).map((r) => r.company.name + " " + r.match.score).join(", "));
assert(byId.amazon > byId.intel, "amazon should beat intel for this CV");
assert(ROLES.backend && ranked[0].match.score > ranked[ranked.length - 1].match.score);

console.log("\nAll analyzer tests passed.");
