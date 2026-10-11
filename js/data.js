/* M.A.N.G.O.S — knowledge base: tech dictionary, role profiles, MNC hiring profiles.
 *
 * Term syntax used everywhere in the app:
 *   "kubernetes|k8s"  -> aliases, any one counts
 *   "re:<regex>"      -> raw (lower-case) regex, for terms that need special handling (go, c, r)
 * Signal terms are prefix-matched ("collaborat" matches collaborate/collaborated/collaboration).
 */
(function (g) {
  const M = (g.MANGOS = g.MANGOS || {});

  /* ---------- generic tech dictionary (used to measure technical depth) ---------- */
  M.TECH = {
    Languages: [
      "python", "java", "javascript", "typescript", "c++", "c#", "rust", "kotlin", "swift", "scala",
      "ruby", "php", "sql", "bash|shell scripting", "matlab", "dart", "objective-c", "perl",
      "re:golang|(?<![a-z0-9.+#])go(?=\\s*[,|/)]|\\s*$)", "re:(?<![a-z0-9.+#])c(?=\\s*[,|/)])|embedded c|c programming",
      "re:(?<![a-z0-9.+#])r(?=\\s*[,|/)])"
    ],
    Frontend: [
      "react|reactjs|react.js", "angular", "vue|vue.js", "next.js|nextjs", "html", "css", "tailwind",
      "redux", "webpack|vite", "svelte", "jquery", "sass|scss", "graphql", "react native", "flutter"
    ],
    Backend: [
      "node.js|nodejs", "express", "spring boot|spring", "django", "flask", "fastapi", ".net|asp.net|dotnet",
      "ruby on rails|rails", "laravel", "grpc", "rest api|rest apis|restful", "microservices|microservice",
      "kafka", "rabbitmq", "websocket|websockets", "protobuf"
    ],
    Data: [
      "postgresql|postgres", "mysql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb",
      "snowflake", "spark|pyspark", "hadoop", "airflow", "pandas", "numpy", "tensorflow", "pytorch",
      "scikit-learn|sklearn", "bigquery", "tableau", "power bi", "dbt", "sql server", "oracle db|oracle database"
    ],
    Cloud: [
      "aws|amazon web services", "azure", "gcp|google cloud", "lambda", "ec2", "s3", "eks", "gke",
      "cloudformation", "terraform", "serverless", "cloud run", "kubernetes|k8s"
    ],
    DevOps: [
      "docker", "ci/cd|cicd|ci-cd", "jenkins", "github actions", "gitlab ci", "ansible", "helm",
      "prometheus", "grafana", "linux", "git", "nginx", "datadog", "argo|argocd"
    ],
    Testing: [
      "unit test|unit tests|unit testing", "integration test|integration tests|integration testing",
      "jest", "pytest", "junit", "selenium", "cypress", "tdd|test-driven", "playwright", "mocha", "e2e|end-to-end test"
    ],
    Concepts: [
      "system design", "distributed systems", "data structures", "algorithms", "design patterns",
      "oop|object-oriented", "concurrency|multithreading", "caching", "load balancing", "scalability",
      "latency", "high availability", "observability", "agile|scrum", "code review", "api design",
      "authentication|oauth|jwt", "machine learning", "deep learning", "nlp", "llm|large language model"
    ]
  };

  /* words that signal engineering depth (distinct matches are counted) */
  M.DEPTH_SIGNALS = [
    "scal", "latency", "throughput", "architect", "system design", "performance", "optimi", "reliab",
    "availability", "concurren", "distributed", "migrat", "refactor", "automat", "pipeline", "observab",
    "test", "ci/cd", "code review", "mentor", "on-call", "incident", "sla", "slo", "design", "profil",
    "benchmark", "cache", "caching", "security", "monitor"
  ];

  /* ---------- role lenses ---------- */
  M.ROLES = {
    swe: { label: "Software Engineer (general)", tech: ["data structures", "algorithms", "system design", "git", "unit test|unit tests|unit testing", "ci/cd|cicd|ci-cd", "rest api|rest apis|restful", "sql", "docker", "code review"] },
    backend: { label: "Backend Engineer", tech: ["microservices|microservice", "rest api|rest apis|restful", "sql", "postgresql|postgres", "redis", "kafka", "docker", "kubernetes|k8s", "caching", "latency", "distributed systems", "api design", "authentication|oauth|jwt"] },
    frontend: { label: "Frontend Engineer", tech: ["react|reactjs|react.js", "typescript", "javascript", "html", "css", "accessibility|a11y", "performance", "webpack|vite", "jest", "responsive", "web vitals|lighthouse", "graphql", "design system"] },
    fullstack: { label: "Full-Stack Engineer", tech: ["react|reactjs|react.js", "typescript", "node.js|nodejs", "rest api|rest apis|restful", "sql", "postgresql|postgres", "docker", "aws|amazon web services", "ci/cd|cicd|ci-cd", "unit test|unit tests|unit testing", "graphql"] },
    data: { label: "Data / ML Engineer", tech: ["python", "sql", "pandas", "spark|pyspark", "airflow", "machine learning", "pytorch", "tensorflow", "scikit-learn|sklearn", "etl|data pipeline|data pipelines", "snowflake", "feature engineering|model deployment|mlops"] },
    devops: { label: "DevOps / SRE", tech: ["kubernetes|k8s", "docker", "terraform", "ci/cd|cicd|ci-cd", "prometheus", "grafana", "linux", "aws|amazon web services", "observability", "incident", "sla|slo", "ansible", "helm", "on-call"] },
    mobile: { label: "Mobile Engineer", tech: ["swift", "kotlin", "ios", "android", "react native", "flutter", "swiftui|jetpack compose", "mvvm|mvc", "rest api|rest apis|restful", "app store|play store", "crash", "offline"] }
  };

  /* ---------- MNC hiring profiles ---------- */
  M.COMPANIES = [
    {
      id: "google", name: "Google", sector: "Big Tech", color: "#4285F4",
      blurb: "Algorithmic rigour, scale, and measurable impact. Hiring committees read resumes for evidence of hard problems solved at scale.",
      values: ["Impact at scale", "Technical excellence", "Collaboration", "Intellectual humility", "User focus"],
      tech: ["c++", "java", "python", "re:golang|(?<![a-z0-9.+#])go(?=\\s*[,|/)]|\\s*$)", "kubernetes|k8s", "bigquery|bigtable|spanner", "distributed systems", "machine learning|tensorflow", "algorithms", "data structures", "system design", "grpc|protobuf", "latency", "low-latency|large-scale|planet-scale", "angular|flutter", "gcp|google cloud"],
      signals: [
        { name: "Scale & measurable impact", terms: ["million", "billion", "scale", "qps", "petabyte", "reduced", "increased", "improved"] },
        { name: "Algorithmic / technical depth", terms: ["algorithm", "complexity", "optimi", "data structure", "latency", "throughput"] },
        { name: "Collaboration & leadership", terms: ["cross-functional", "collaborat", "mentor", "led", "partnered", "stakeholder"] },
        { name: "Initiative & ambiguity", terms: ["from scratch", "prototype", "initiated", "pioneer", "open source", "launched", "designed"] }
      ],
      looksFor: "Strong CS fundamentals, evidence of large-scale systems, and impact written as 'Accomplished X, as measured by Y, by doing Z'.",
      tips: [
        "Use the X-Y-Z formula on every bullet: Accomplished [X] as measured by [Y] by doing [Z].",
        "Quantify scale (users, QPS, data size) — Google interviewers anchor on scale.",
        "Show algorithmic thinking in projects: complexity improvements, data structure choices, benchmarks.",
        "Open-source contributions, publications or competitive programming results carry real weight."
      ],
      avoid: ["Long lists of technologies without outcomes", "Vague 'worked on backend' bullets", "Resumes over 2 pages"]
    },
    {
      id: "microsoft", name: "Microsoft", sector: "Big Tech", color: "#00A4EF",
      blurb: "Growth mindset, customer empathy, and strong engineering across Azure, developer tools and productivity products.",
      values: ["Growth mindset", "Customer obsession", "Diverse & inclusive", "One Microsoft", "Make a difference"],
      tech: ["c#", ".net|asp.net|dotnet", "azure", "typescript", "c++", "sql server|sql", "powershell", "kubernetes|k8s", "microservices|microservice", "distributed systems", "rest api|rest apis|restful", "ci/cd|cicd|ci-cd", "unit test|unit tests|unit testing", "python", "cosmos db|cosmosdb", "devops"],
      signals: [
        { name: "Growth mindset / learning", terms: ["learn", "upskill", "certified", "certification", "self-taught", "adopted", "new technology"] },
        { name: "Customer & user impact", terms: ["customer", "user", "feedback", "adoption", "satisfaction", "nps"] },
        { name: "Collaboration across teams", terms: ["cross-team", "cross-functional", "collaborat", "partnered", "mentor", "inclusive"] },
        { name: "Quality & reliability", terms: ["test", "reliab", "availability", "security", "compliance", "accessib"] }
      ],
      looksFor: "Engineers who learn quickly, work across teams, and tie technical work to customer outcomes. Azure/.NET depth helps for many teams.",
      tips: [
        "Show learning velocity: new stacks picked up, certifications (AZ-204, AZ-900) and how you applied them.",
        "Connect work to customers — adoption, satisfaction, support-ticket reduction.",
        "Mention accessibility, security or compliance work; Microsoft cares about trustworthy computing.",
        "Cross-team collaboration and mentoring are explicit parts of performance reviews — show them."
      ],
      avoid: ["Lone-wolf narratives with no collaboration", "Ignoring Azure/cloud entirely if applying to cloud teams"]
    },
    {
      id: "amazon", name: "Amazon", sector: "Big Tech", color: "#FF9900",
      blurb: "Leadership Principles drive everything. Bullets must show ownership, bias for action, and results with hard numbers.",
      values: ["Customer Obsession", "Ownership", "Invent & Simplify", "Dive Deep", "Bias for Action", "Deliver Results"],
      tech: ["java", "python", "aws|amazon web services", "dynamodb", "lambda", "s3", "ec2", "microservices|microservice", "distributed systems", "rest api|rest apis|restful", "sql", "ci/cd|cicd|ci-cd", "system design", "cloudformation|cdk", "sqs|sns|kinesis", "scalability"],
      signals: [
        { name: "Customer obsession", terms: ["customer", "user", "client", "satisfaction", "nps", "support ticket"] },
        { name: "Ownership & bias for action", terms: ["owned", "ownership", "end-to-end", "drove", "initiated", "took", "launched", "shipped"] },
        { name: "Dive deep / root cause", terms: ["root cause", "debug", "diagnos", "investigat", "postmortem", "incident", "profil"] },
        { name: "Deliver results (numbers)", terms: ["reduced", "increased", "saved", "improved", "%", "$", "cost", "revenue"] },
        { name: "Invent & simplify", terms: ["simplif", "automat", "streamlin", "invent", "designed", "built from scratch", "reduced complexity"] },
        { name: "Frugality", terms: ["cost", "saving", "efficien", "reduced spend", "optimi"] }
      ],
      looksFor: "Each bullet should map to a Leadership Principle with a quantified result. Expect behavioural interviews built on your bullets.",
      tips: [
        "Write bullets in STAR shape (situation → action → result) and put the number first where possible.",
        "Show ownership: 'owned end-to-end', on-call, incident leadership, driving a project without being told.",
        "Include customer impact AND cost impact (Frugality) where honest.",
        "Prepare a story behind every bullet — you will be asked 'tell me about a time…' on them."
      ],
      avoid: ["Team-only 'we' stories with no personal contribution", "Results without numbers", "Buzzwords with no story behind them"]
    },
    {
      id: "meta", name: "Meta", sector: "Big Tech", color: "#0866FF",
      blurb: "Impact is the currency. Meta wants engineers who move fast, ship at massive scale, and can show measurable product or infra outcomes.",
      values: ["Move fast", "Focus on long-term impact", "Build awesome things", "Be direct", "Live in the future"],
      tech: ["react|reactjs|react.js", "python", "c++", "php|hack", "graphql", "pytorch", "distributed systems", "mysql", "javascript", "typescript", "system design", "a/b test|a/b testing|experimentation", "data pipeline|data pipelines|spark|presto", "latency", "scalability", "machine learning"],
      signals: [
        { name: "Measurable impact", terms: ["impact", "increased", "reduced", "improved", "grew", "%", "million", "billion"] },
        { name: "Speed & iteration", terms: ["shipped", "launched", "iterat", "rapid", "prototype", "weekly", "rolled out"] },
        { name: "Experimentation & data", terms: ["a/b", "experiment", "metric", "analytics", "data-driven", "hypothesis"] },
        { name: "Product & user thinking", terms: ["product", "user", "engagement", "retention", "growth", "feature"] }
      ],
      looksFor: "Product-minded engineers with shipped-at-scale evidence and an experimentation mindset. 'Impact' is literally the review criterion.",
      tips: [
        "Lead each bullet with the outcome (engagement +X%, latency -Y ms) then how you did it.",
        "Show speed: features shipped per quarter, time from idea to launch, iteration cycles.",
        "Mention A/B tests, metrics you moved and how you validated them.",
        "Highlight open-source work — React, PyTorch and others come from Meta."
      ],
      avoid: ["Process-heavy descriptions with no outcome", "Slow, waterfall-flavoured project narratives"]
    },
    {
      id: "apple", name: "Apple", sector: "Big Tech", color: "#A2AAAD",
      blurb: "Craftsmanship, attention to detail and deep platform knowledge. Quality of the product experience beats raw feature count.",
      values: ["Craftsmanship", "Attention to detail", "Privacy", "Simplicity", "Collaboration with design/hardware"],
      tech: ["swift", "objective-c", "ios", "macos", "c++", "c", "swiftui", "xcode", "performance", "memory management", "multithreading|concurrency", "core data|core ml", "accessibility|a11y", "privacy", "unit test|unit tests|unit testing", "metal"],
      signals: [
        { name: "Craft & quality", terms: ["polish", "quality", "pixel", "detail", "crash", "stability", "zero", "regression"] },
        { name: "Performance & efficiency", terms: ["performance", "memory", "battery", "latency", "launch time", "optimi", "fps", "profil"] },
        { name: "Privacy & security", terms: ["privacy", "security", "encrypt", "secure", "on-device", "gdpr"] },
        { name: "Design & hardware collaboration", terms: ["design", "hardware", "firmware", "cross-functional", "prototype", "user experience", "ux"] }
      ],
      looksFor: "Engineers who sweat quality: performance profiling, crash-rate reduction, accessibility, and platform fluency (Swift/ObjC/C++).",
      tips: [
        "Show craft metrics: crash-free rate, launch time, memory footprint, frame-rate improvements.",
        "Mention accessibility and privacy-by-design decisions explicitly.",
        "Platform fluency matters — name frameworks you've genuinely used (Core Data, Combine, Metal…).",
        "Keep the resume clean and minimal; sloppy formatting is read as lack of attention to detail."
      ],
      avoid: ["Cluttered layout", "Generic web-stack-only story for platform roles", "Spelling or format inconsistencies"]
    },
    {
      id: "netflix", name: "Netflix", sector: "Big Tech", color: "#E50914",
      blurb: "Senior-heavy, high-autonomy culture. Judgement, resilience engineering and independent ownership matter more than credentials.",
      values: ["Freedom & responsibility", "Context not control", "Highly aligned, loosely coupled", "Candor", "Impact over process"],
      tech: ["java", "spring boot|spring", "microservices|microservice", "aws|amazon web services", "kafka", "cassandra", "distributed systems", "resilience|chaos engineering", "python", "react|reactjs|react.js", "node.js|nodejs", "graphql", "observability", "a/b test|a/b testing|experimentation", "streaming", "latency"],
      signals: [
        { name: "Independent ownership", terms: ["owned", "independently", "end-to-end", "sole", "drove", "decided", "led"] },
        { name: "Resilience & operations", terms: ["resilien", "outage", "incident", "availability", "failover", "chaos", "on-call", "slo"] },
        { name: "Judgement & trade-offs", terms: ["trade-off", "tradeoff", "decision", "evaluated", "chose", "rfc", "design doc", "proposal"] },
        { name: "Candor & influence", terms: ["influenc", "mentor", "feedback", "alignment", "context", "stakeholder"] }
      ],
      looksFor: "Experienced engineers who make good decisions with little supervision and keep large systems up.",
      tips: [
        "Describe decisions and trade-offs you made, not just tasks you did.",
        "Show operational ownership — on-call, incident reviews, resilience work.",
        "Fewer, deeper stories beat a long laundry list; Netflix reads for seniority of thinking.",
        "Mention influence without authority: RFCs, design docs, cross-team alignment."
      ],
      avoid: ["Junior-style task lists", "Heavy process / certification emphasis", "Fluff and superlatives"]
    },
    {
      id: "nvidia", name: "NVIDIA", sector: "Big Tech", color: "#76B900",
      blurb: "GPU computing, parallel performance and deep systems knowledge — from CUDA kernels to ML frameworks and drivers.",
      values: ["Innovation", "Intellectual honesty", "Speed & agility", "One team", "Excellence"],
      tech: ["cuda", "c++", "c", "python", "gpu", "parallel computing|parallel programming|hpc", "deep learning", "tensorrt", "pytorch", "linux", "performance optimization|performance", "compilers|llvm", "opengl|vulkan|directx", "distributed training", "ray tracing|rendering", "triton|cudnn|nccl"],
      signals: [
        { name: "Performance engineering", terms: ["speedup", "throughput", "optimi", "profil", "latency", "benchmark", "vectoriz"] },
        { name: "Low-level / systems depth", terms: ["kernel", "driver", "memory", "assembly", "compiler", "embedded", "firmware", "simd"] },
        { name: "ML / graphics / HPC domain", terms: ["deep learning", "inference", "training", "graphics", "simulation", "hpc", "model"] },
        { name: "Research / innovation", terms: ["research", "paper", "publication", "novel", "prototype", "patent"] }
      ],
      looksFor: "Measurable speedups, low-level fluency and domain depth in GPU, ML systems, graphics or HPC.",
      tips: [
        "Quantify speedups (e.g. '4.2x faster inference on A100') and name the hardware.",
        "Show profiling tools and methodology (Nsight, perf, flame graphs).",
        "Publications, patents or competition results (ICPC, Kaggle) are valued.",
        "Be precise with C/C++ and CUDA claims — you will be probed deeply."
      ],
      avoid: ["Claiming CUDA/GPU skills without a concrete project", "Only high-level framework usage for systems roles"]
    },
    {
      id: "adobe", name: "Adobe", sector: "Big Tech", color: "#FF0000",
      blurb: "Creative and document cloud products: expect strong craft, web/graphics fundamentals and a customer-experience lens.",
      values: ["Genuine", "Exceptional", "Innovative", "Involved"],
      tech: ["java", "javascript", "typescript", "react|reactjs|react.js", "node.js|nodejs", "aws|amazon web services", "azure", "microservices|microservice", "c++", "python", "machine learning", "rest api|rest apis|restful", "kubernetes|k8s", "graphics|rendering", "pdf", "accessibility|a11y"],
      signals: [
        { name: "Creativity & product craft", terms: ["creative", "design", "ux", "user experience", "prototype", "polish"] },
        { name: "Customer experience", terms: ["customer", "user", "adoption", "engagement", "feedback", "retention"] },
        { name: "Innovation / AI", terms: ["innovat", "ai", "machine learning", "generative", "experiment", "patent"] },
        { name: "Collaboration", terms: ["cross-functional", "collaborat", "designer", "product manager", "partnered", "mentor"] }
      ],
      looksFor: "Product-minded engineers comfortable working with designers, with solid web/graphics fundamentals and ML curiosity.",
      tips: [
        "Show collaboration with design and product, not just engineering.",
        "Highlight UX-sensitive engineering: performance of rendering, accessibility, polish.",
        "Mention generative AI / ML features you shipped or prototyped.",
        "A visible portfolio (demos, live links) lands well for creative-tooling roles."
      ],
      avoid: ["Dry back-office-only narrative with no user angle"]
    },
    {
      id: "salesforce", name: "Salesforce", sector: "Enterprise Software", color: "#00A1E0",
      blurb: "Multi-tenant SaaS at enterprise scale. Trust, customer success and platform fluency (Apex, Lightning, integrations).",
      values: ["Trust", "Customer success", "Innovation", "Equality", "Sustainability"],
      tech: ["java", "apex", "lightning|lwc", "salesforce|sfdc", "javascript", "typescript", "rest api|rest apis|restful", "microservices|microservice", "multi-tenant|multitenant", "sql|soql", "heroku", "mulesoft", "aws|amazon web services", "kubernetes|k8s", "ci/cd|cicd|ci-cd", "security"],
      signals: [
        { name: "Trust, security & compliance", terms: ["security", "compliance", "gdpr", "soc 2", "privacy", "audit", "trust", "encrypt"] },
        { name: "Customer success", terms: ["customer", "client", "adoption", "onboarding", "retention", "support"] },
        { name: "Enterprise integration", terms: ["integration", "api", "salesforce", "crm", "erp", "etl", "middleware"] },
        { name: "Scale & reliability", terms: ["multi-tenant", "scale", "availability", "uptime", "sla", "reliab"] }
      ],
      looksFor: "SaaS and integration experience with a clear trust/security mindset; Salesforce certifications are a plus.",
      tips: [
        "Highlight security, compliance and data-privacy awareness.",
        "Show enterprise integration experience (APIs, ETL, middleware).",
        "Trailhead badges and Salesforce certifications are legitimately valued.",
        "Tie work to customer adoption/retention."
      ],
      avoid: ["Consumer-only framing with no enterprise context"]
    },
    {
      id: "oracle", name: "Oracle", sector: "Enterprise Software", color: "#C74634",
      blurb: "Databases, cloud infrastructure and enterprise Java. Deep fundamentals and performance matter.",
      values: ["Integrity", "Innovation", "Customer success", "Excellence"],
      tech: ["java", "sql", "pl/sql", "oracle db|oracle database|oracle", "oci|oracle cloud", "spring boot|spring", "microservices|microservice", "kubernetes|k8s", "docker", "linux", "performance tuning|performance", "distributed systems", "rest api|rest apis|restful", "python", "terraform", "multithreading|concurrency"],
      signals: [
        { name: "Database & data depth", terms: ["database", "query", "index", "schema", "transaction", "replication", "sql", "optimi"] },
        { name: "Cloud infrastructure", terms: ["cloud", "infrastructure", "oci", "iaas", "paas", "kubernetes", "terraform"] },
        { name: "Performance & scale", terms: ["performance", "throughput", "latency", "scale", "tuning", "bottleneck"] },
        { name: "Enterprise reliability", terms: ["enterprise", "reliab", "availability", "sla", "security", "compliance", "backup"] }
      ],
      looksFor: "Strong Java/SQL fundamentals, database internals curiosity, and cloud infrastructure experience.",
      tips: [
        "Show database depth: indexing, query plans, transaction handling, tuning outcomes.",
        "Quantify performance work with before/after numbers.",
        "OCI certifications and Java certifications are credible add-ons.",
        "Emphasise reliability and security for enterprise-grade systems."
      ],
      avoid: ["ORM-only database exposure with no depth", "Trendy-stack-only resume with weak fundamentals"]
    },
    {
      id: "ibm", name: "IBM", sector: "Enterprise Software", color: "#0F62FE",
      blurb: "Hybrid cloud and AI for enterprises: Red Hat/OpenShift, watsonx, mainframe modernisation, consulting-style delivery.",
      values: ["Dedication to client success", "Innovation that matters", "Trust & personal responsibility"],
      tech: ["java", "python", "red hat|openshift", "kubernetes|k8s", "docker", "hybrid cloud", "microservices|microservice", "watson|watsonx", "ai", "z/os|mainframe|cobol", "node.js|nodejs", "ci/cd|cicd|ci-cd", "terraform", "linux", "rest api|rest apis|restful", "quantum"],
      signals: [
        { name: "Client success", terms: ["client", "customer", "delivery", "engagement", "stakeholder", "requirements"] },
        { name: "Hybrid cloud & modernisation", terms: ["migrat", "modernis", "moderniz", "hybrid", "legacy", "containeriz", "cloud"] },
        { name: "AI / data", terms: ["ai", "machine learning", "nlp", "model", "data", "analytics"] },
        { name: "Enterprise standards", terms: ["security", "compliance", "governance", "enterprise", "audit", "documentation"] }
      ],
      looksFor: "Engineers who can modernise legacy systems, deliver for enterprise clients and work with hybrid cloud / AI platforms.",
      tips: [
        "Show migration and modernisation projects with before/after outcomes.",
        "Client-facing delivery experience and requirement gathering are valued.",
        "IBM/Red Hat certifications and open-source contributions help.",
        "Mention governance, security and documentation discipline."
      ],
      avoid: ["Startup-only 'move fast' framing without any enterprise rigour"]
    },
    {
      id: "intel", name: "Intel", sector: "Hardware & Systems", color: "#0071C5",
      blurb: "Silicon, firmware and performance engineering. Low-level fluency and validation rigour are the core of most roles.",
      values: ["Customer obsession", "Quality", "Inclusion", "Innovation", "Risk-taking", "One Intel"],
      tech: ["c", "c++", "python", "assembly", "linux", "embedded", "firmware", "verilog|systemverilog|vhdl", "fpga", "compilers|llvm", "performance optimization|performance", "simd|avx|vectoriz", "drivers|kernel", "validation|verification", "oneapi|sycl|openvino", "debug"],
      signals: [
        { name: "Low-level / hardware proximity", terms: ["firmware", "embedded", "driver", "kernel", "register", "soc", "silicon", "rtl"] },
        { name: "Validation & quality", terms: ["validat", "verif", "test", "coverage", "regression", "debug", "root cause"] },
        { name: "Performance", terms: ["performance", "optimi", "latency", "power", "benchmark", "profil", "throughput"] },
        { name: "Cross-functional hardware/software", terms: ["hardware", "cross-functional", "architect", "bring-up", "integration", "specification"] }
      ],
      looksFor: "Systems-level programmers with debugging stamina, validation discipline and performance/power awareness.",
      tips: [
        "Show bring-up, debugging and root-cause stories at the hardware/software boundary.",
        "Quantify performance, power or test-coverage improvements.",
        "List toolchains used (gdb, perf, JTAG, UVM) only if you really used them.",
        "Coursework in computer architecture/OS counts for new grads — name it."
      ],
      avoid: ["Pure web-framework resume for firmware/silicon roles"]
    },
    {
      id: "cisco", name: "Cisco", sector: "Hardware & Systems", color: "#049FD9",
      blurb: "Networking, security and observability. Protocol knowledge and reliability-minded software engineering.",
      values: ["Inclusive culture", "Customer success", "Innovation", "Accountability"],
      tech: ["networking|tcp/ip", "bgp|ospf|routing", "sdn|network automation", "python", "go", "c", "c++", "java", "linux", "kubernetes|k8s", "microservices|microservice", "rest api|rest apis|restful", "security|cybersecurity", "ccna|ccnp", "observability", "docker"],
      signals: [
        { name: "Networking depth", terms: ["network", "protocol", "tcp", "routing", "packet", "latency", "bandwidth"] },
        { name: "Security", terms: ["security", "encrypt", "vulnerab", "zero trust", "firewall", "threat"] },
        { name: "Automation & reliability", terms: ["automat", "reliab", "monitor", "observab", "availability", "ci/cd"] },
        { name: "Customer & partner focus", terms: ["customer", "partner", "support", "escalation", "field"] }
      ],
      looksFor: "Engineers with networking/protocol fundamentals, security awareness, and automation habits.",
      tips: [
        "Name protocols and layers you have worked at, with concrete outcomes.",
        "CCNA/CCNP or security certifications are directly relevant.",
        "Show network automation (Python/Go) and reliability improvements.",
        "Include security-hardening or vulnerability-remediation work."
      ],
      avoid: ["Claiming networking expertise without protocol-level detail"]
    },
    {
      id: "sap", name: "SAP", sector: "Enterprise Software", color: "#0FAAFF",
      blurb: "ERP and business-process software. Domain understanding of enterprise workflows is as valuable as raw coding.",
      values: ["Customer centricity", "Integrity", "Innovation", "Sustainability", "Inclusion"],
      tech: ["abap", "sap|s/4hana", "hana", "java", "javascript", "typescript", "sap btp|btp", "fiori|ui5|sapui5", "cds|cap", "odata", "rest api|rest apis|restful", "sql", "kubernetes|k8s", "cloud foundry", "microservices|microservice", "clean core"],
      signals: [
        { name: "Business-process understanding", terms: ["business process", "erp", "finance", "supply chain", "procurement", "requirements", "workflow"] },
        { name: "Enterprise integration", terms: ["integration", "odata", "api", "migration", "interface", "idoc", "middleware"] },
        { name: "Quality & compliance", terms: ["test", "compliance", "audit", "security", "governance", "quality"] },
        { name: "Customer centricity", terms: ["customer", "client", "stakeholder", "adoption", "support", "implementation"] }
      ],
      looksFor: "Engineers who understand how businesses run and can build/extend enterprise software cleanly.",
      tips: [
        "Connect technical work to a business process (order-to-cash, procure-to-pay).",
        "SAP certifications and ABAP/BTP projects are directly credible.",
        "Show integration and migration outcomes with numbers.",
        "Mention clean-core / extensibility thinking if you have it."
      ],
      avoid: ["Only consumer-app experience with zero enterprise context"]
    },
    {
      id: "uber", name: "Uber", sector: "Big Tech", color: "#000000",
      blurb: "Real-time marketplace systems: geospatial, high-throughput services, experimentation and reliability at global scale.",
      values: ["Customer obsession", "Do the right thing", "Bias for action", "Build with heart", "Celebrate differences"],
      tech: ["go", "java", "python", "kafka", "cassandra", "microservices|microservice", "distributed systems", "spark", "mysql", "redis", "real-time|streaming", "geospatial|maps", "a/b test|a/b testing|experimentation", "kubernetes|k8s", "machine learning", "latency"],
      signals: [
        { name: "Real-time & scale", terms: ["real-time", "realtime", "throughput", "qps", "scale", "million", "latency", "streaming"] },
        { name: "Reliability", terms: ["reliab", "availability", "incident", "on-call", "slo", "resilien", "failover"] },
        { name: "Experimentation & metrics", terms: ["experiment", "a/b", "metric", "conversion", "marketplace", "pricing", "supply", "demand"] },
        { name: "Bias for action", terms: ["shipped", "launched", "rapid", "owned", "drove", "initiated"] }
      ],
      looksFor: "Backend/infra engineers who have handled high-throughput, latency-sensitive systems and care about marketplace metrics.",
      tips: [
        "Quantify throughput, latency and availability of services you owned.",
        "Real-time/streaming and geospatial experience stands out.",
        "Show experiment-driven product work and the metrics moved.",
        "Include on-call/incident ownership."
      ],
      avoid: ["Batch-only CRUD apps with no scale story"]
    },
    {
      id: "atlassian", name: "Atlassian", sector: "Enterprise Software", color: "#0052CC",
      blurb: "Team-collaboration software with a values-heavy culture and strong engineering craft across Jira, Confluence and Cloud.",
      values: ["Open company, no bullshit", "Build with heart and balance", "Don't #@!% the customer", "Play, as a team", "Be the change you seek"],
      tech: ["java", "kotlin", "typescript", "react|reactjs|react.js", "aws|amazon web services", "microservices|microservice", "postgresql|postgres", "kafka", "docker", "kubernetes|k8s", "ci/cd|cicd|ci-cd", "graphql", "rest api|rest apis|restful", "observability", "unit test|unit tests|unit testing", "terraform"],
      signals: [
        { name: "Team play & collaboration", terms: ["team", "collaborat", "pair", "mentor", "cross-functional", "retro", "agile"] },
        { name: "Customer empathy", terms: ["customer", "user", "feedback", "research", "support", "adoption"] },
        { name: "Openness & communication", terms: ["document", "rfc", "blog", "talk", "open source", "wrote", "presented", "transparen"] },
        { name: "Quality & ownership", terms: ["owned", "test", "quality", "reliab", "on-call", "incident", "ownership"] }
      ],
      looksFor: "Collaborative engineers with customer empathy, good written communication and shipping discipline.",
      tips: [
        "Show collaboration and mentoring — values alignment is evaluated seriously.",
        "Written communication (design docs, blog posts, talks) is a plus.",
        "Customer-empathy stories (user research, support feedback loops).",
        "Mention engineering quality: tests, CI/CD, observability."
      ],
      avoid: ["Lone-genius framing", "Hype language"]
    },
    {
      id: "accenture", name: "Accenture", sector: "Consulting & IT Services", color: "#A100FF",
      blurb: "Client-delivery driven. Breadth across stacks, adaptability, certifications, and communication with business stakeholders.",
      values: ["Client value creation", "One global network", "Respect for the individual", "Best people", "Integrity", "Stewardship"],
      tech: ["java", "python", ".net|dotnet", "sap", "salesforce", "aws|amazon web services", "azure", "gcp|google cloud", "sql", "microservices|microservice", "agile|scrum", "devops", "api|rest api|rest apis|restful", "cloud migration|migration", "javascript", "servicenow"],
      signals: [
        { name: "Client & stakeholder delivery", terms: ["client", "stakeholder", "requirements", "delivery", "engagement", "workshop", "presentation"] },
        { name: "Adaptability & learning", terms: ["certified", "certification", "learn", "adapt", "upskill", "cross-train", "new technology"] },
        { name: "Process & agile delivery", terms: ["agile", "scrum", "sprint", "jira", "release", "uat", "documentation"] },
        { name: "Transformation outcomes", terms: ["transformation", "migrat", "modernis", "modernize", "digital", "cost", "efficiency", "automation"] }
      ],
      looksFor: "Reliable delivery engineers/consultants: broad tech exposure, certifications, communication, and project outcomes.",
      tips: [
        "Name clients/industries (where permitted) and the scope you delivered.",
        "Cloud/SAP/Salesforce certifications are given real weight.",
        "Show communication: demos, workshops, stakeholder reporting.",
        "Quantify transformation outcomes — cost saved, time-to-deliver, defects reduced."
      ],
      avoid: ["Pure R&D narrative with no delivery or client element"]
    },
    {
      id: "tcs", name: "TCS", sector: "Consulting & IT Services", color: "#EE3124",
      blurb: "Large-scale enterprise delivery across banking, retail, telecom and more. Fundamentals, learnability and process discipline.",
      values: ["Leading change", "Integrity", "Respect for the individual", "Excellence", "Learning and sharing"],
      tech: ["java", "python", "spring boot|spring", "sql", ".net|dotnet", "sap", "microservices|microservice", "rest api|rest apis|restful", "aws|amazon web services", "azure", "agile|scrum", "mainframe|cobol", "testing|qa", "devops", "javascript", "angular"],
      signals: [
        { name: "Delivery & ownership", terms: ["delivered", "owned", "responsible for", "release", "deadline", "production", "support"] },
        { name: "Learning & certifications", terms: ["certified", "certification", "learn", "training", "upskill", "course"] },
        { name: "Domain exposure", terms: ["banking", "finance", "insurance", "retail", "telecom", "healthcare", "domain"] },
        { name: "Process & quality", terms: ["agile", "sprint", "test", "defect", "quality", "documentation", "sla"] }
      ],
      looksFor: "Solid fundamentals, quick learners with domain exposure and process discipline. Strong academic record helps for fresher hiring.",
      tips: [
        "Mention domain exposure (BFSI, retail, telecom) and the business problem solved.",
        "List certifications and internal/online training completed.",
        "For freshers: academic scores, projects and aptitude matter — keep them visible and accurate.",
        "Show delivery under deadlines with defect/SLA numbers."
      ],
      avoid: ["Unexplained gaps in education timeline", "Inflated skill lists you can't back in a technical round"]
    },
    {
      id: "infosys", name: "Infosys", sector: "Consulting & IT Services", color: "#007CC3",
      blurb: "Digital-services delivery with a strong learning culture (Springboard) and the C-LIFE value set.",
      values: ["Client value", "Leadership by example", "Integrity & transparency", "Fairness", "Excellence"],
      tech: ["java", "python", "spring boot|spring", "sql", "angular|react|reactjs", "microservices|microservice", "aws|amazon web services", "azure", "devops", "rest api|rest apis|restful", "agile|scrum", "selenium|automation testing", "sap", "salesforce", "cloud", "docker"],
      signals: [
        { name: "Client value", terms: ["client", "customer", "delivery", "satisfaction", "requirements", "stakeholder"] },
        { name: "Learning culture", terms: ["certified", "certification", "learn", "training", "springboard", "course", "upskill"] },
        { name: "Leadership by example", terms: ["led", "mentor", "initiative", "volunteer", "ownership", "drove"] },
        { name: "Excellence & quality", terms: ["quality", "test", "defect", "optimi", "improv", "automation", "process"] }
      ],
      looksFor: "Learning-oriented engineers with delivery ownership and exposure to modern digital stacks.",
      tips: [
        "Show learning: certifications, courses completed and what you built with them.",
        "Demonstrate initiative beyond assigned tasks (internal tools, automation).",
        "Client/user value stated with numbers.",
        "Keep skills honest — technical rounds go through your listed stack."
      ],
      avoid: ["Skill lists with no project evidence"]
    },
    {
      id: "jpmorgan", name: "JPMorgan Chase", sector: "Finance & Fintech", color: "#5B7B9A",
      blurb: "Large-scale, regulated financial systems. Resilience, controls, correctness and modern Java/cloud engineering.",
      values: ["Exceptional client service", "Operational excellence", "Integrity", "Fairness & responsibility", "Resilience"],
      tech: ["java", "spring boot|spring", "kafka", "microservices|microservice", "aws|amazon web services", "kubernetes|k8s", "sql", "python", "react|reactjs|react.js", "rest api|rest apis|restful", "ci/cd|cicd|ci-cd", "low latency|low-latency", "unit test|unit tests|unit testing", "oracle", "cloud", "security"],
      signals: [
        { name: "Controls, risk & compliance", terms: ["compliance", "regulat", "risk", "audit", "control", "security", "sox", "governance"] },
        { name: "Resilience & correctness", terms: ["resilien", "availability", "reliab", "test", "coverage", "failover", "reconcil", "accuracy"] },
        { name: "Client / business impact", terms: ["client", "business", "trading", "payments", "revenue", "cost", "customer"] },
        { name: "Modernisation", terms: ["migrat", "modernis", "modernize", "cloud", "refactor", "legacy", "automation"] }
      ],
      looksFor: "Correctness-minded engineers who respect controls, build resilient services and can work in regulated environments.",
      tips: [
        "Highlight testing rigour, coverage and production-stability improvements.",
        "Show awareness of risk, controls, auditability and security.",
        "Finance/payments/trading domain exposure is a differentiator — be specific.",
        "Show cloud-migration or legacy-modernisation outcomes."
      ],
      avoid: ["'Move fast and break things' framing", "No mention of testing or reliability"]
    },
    {
      id: "goldman", name: "Goldman Sachs", sector: "Finance & Fintech", color: "#6C9BD2",
      blurb: "Quantitative rigour and high-performance engineering for markets and risk. Algorithms and problem-solving carry heavy weight.",
      values: ["Partnership", "Client service", "Integrity", "Excellence"],
      tech: ["java", "python", "c++", "slang|legend|marquee", "sql", "algorithms", "data structures", "low latency|low-latency", "multithreading|concurrency", "kafka", "distributed systems", "microservices|microservice", "react|reactjs|react.js", "risk", "trading", "statistics|probability"],
      signals: [
        { name: "Quantitative & algorithmic thinking", terms: ["algorithm", "quantitative", "statistic", "probability", "model", "optimi", "complexity"] },
        { name: "Performance & latency", terms: ["latency", "throughput", "performance", "low-latency", "real-time", "concurren", "scale"] },
        { name: "Financial domain", terms: ["trading", "risk", "market", "pricing", "portfolio", "derivative", "settlement", "payments"] },
        { name: "Client & partnership", terms: ["client", "partner", "stakeholder", "cross-functional", "collaborat", "business"] }
      ],
      looksFor: "Strong problem-solvers with solid algorithms, concurrency and performance skills; finance exposure is a bonus, not required.",
      tips: [
        "Competitive programming, olympiads and strong academics are legitimately valued — list them.",
        "Show performance/latency engineering with numbers.",
        "Mention probability/statistics/quant coursework if relevant.",
        "Keep it to one page with crisp, quantified bullets."
      ],
      avoid: ["Long, wordy bullets", "Unexplained academic gaps", "Skills with no demonstrable depth"]
    },
    {
      id: "deloitte", name: "Deloitte", sector: "Consulting & IT Services", color: "#86BC25",
      blurb: "Technology consulting and implementation: cloud, ERP, security and analytics, with strong client-communication expectations.",
      values: ["Integrity", "Outstanding value to clients", "Commitment to each other", "Strength from cultural diversity"],
      tech: ["sap", "salesforce", "servicenow", "azure", "aws|amazon web services", "gcp|google cloud", "python", "java", "sql", "power bi|tableau", "cloud migration|migration", "cybersecurity|security", "agile|scrum", "data analytics|analytics", "api|rest api|rest apis|restful", "devops"],
      signals: [
        { name: "Client advisory & communication", terms: ["client", "stakeholder", "advis", "workshop", "present", "requirements", "executive"] },
        { name: "Business impact", terms: ["cost", "revenue", "efficiency", "roi", "saving", "transformation", "process"] },
        { name: "Delivery & governance", terms: ["delivery", "governance", "risk", "compliance", "audit", "agile", "project"] },
        { name: "Learning & certifications", terms: ["certified", "certification", "learn", "training", "cpa", "pmp", "scrum master"] }
      ],
      looksFor: "Consultative engineers who communicate with executives, map tech to business value and deliver on governed programmes.",
      tips: [
        "Frame work as business problem → solution → quantified value.",
        "Show executive-facing communication: presentations, reports, workshops.",
        "Certifications (cloud, SAP, Salesforce, PMP) have real weight.",
        "Include risk/governance awareness."
      ],
      avoid: ["Purely technical details without business context"]
    }
  ];

  /* ---------- language-quality dictionaries ---------- */
  M.STRONG_VERBS = new Set(("built developed designed implemented led architected optimized optimised reduced increased improved launched " +
    "shipped delivered automated migrated refactored scaled created engineered deployed integrated mentored owned drove spearheaded " +
    "established introduced streamlined accelerated cut boosted resolved debugged diagnosed authored wrote maintained managed coordinated " +
    "analyzed analysed researched prototyped tested secured modernized modernised orchestrated configured instrumented monitored partnered " +
    "negotiated trained defined standardized standardised consolidated replaced rewrote extended contributed published presented won " +
    "initiated pioneered formulated revamped overhauled simplified unified enabled facilitated transformed executed achieved generated " +
    "saved supported documented evaluated benchmarked profiled tuned hardened containerized containerised provisioned productionized " +
    "productionised fine-tuned curated reengineered re-architected eliminated expanded raised grew slashed halved doubled tripled " +
    "founded organized organised conducted investigated identified reviewed mapped upgraded ported built-out rolled bootstrapped " +
    "open-sourced contributed championed revived stabilized stabilised unblocked directed supervised recruited onboarded coached").split(/\s+/));

  M.WEAK_PHRASES = [
    "responsible for", "worked on", "worked with", "helped", "assisted", "assisting", "participated in", "involved in",
    "duties included", "tasked with", "was part of", "exposure to", "familiar with", "knowledge of", "various", "etc",
    "handled", "dealt with", "in charge of", "utilized", "utilised", "attempted", "tried to", "looked after", "contributed to"
  ];

  M.WEAK_REPLACEMENTS = {
    "responsible for": "Owned / Led / Ran",
    "worked on": "Built / Shipped / Implemented",
    "worked with": "Partnered with / Integrated",
    "helped": "Enabled / Contributed… (and state your specific part)",
    "assisted": "Supported… (and quantify what changed)",
    "participated in": "Drove / Contributed to… (state your role)",
    "involved in": "Delivered / Owned… (state your role)",
    "duties included": "Replace the duty list with achievements",
    "tasked with": "Delivered / Executed",
    "handled": "Managed / Resolved",
    "utilized": "Used",
    "contributed to": "Built / Implemented… (name your piece)"
  };

  M.CLICHES = [
    "team player", "hard-working", "hardworking", "hard working", "results-oriented", "results oriented", "go-getter",
    "self-motivated", "self motivated", "detail-oriented", "detail oriented", "think outside the box", "synergy",
    "proven track record", "fast learner", "quick learner", "strong communication skills", "excellent communication skills",
    "highly motivated", "seeking a challenging", "references available", "perfectionist", "dynamic", "passionate about",
    "out-of-the-box", "problem solver", "problem-solver", "enthusiastic", "dedicated professional"
  ];

  M.MISSPELLINGS = {
    recieve: "receive", responsibile: "responsible", managment: "management", mangement: "management", developement: "development",
    experiance: "experience", sucessfully: "successfully", successfuly: "successfully", enviroment: "environment", langauge: "language",
    knowlege: "knowledge", definately: "definitely", seperate: "separate", occured: "occurred", acheived: "achieved", achived: "achieved",
    beleive: "believe", accomodate: "accommodate", adress: "address", comunication: "communication", cordination: "coordination",
    implimented: "implemented", implemention: "implementation", intergrated: "integrated", maintainence: "maintenance",
    performace: "performance", proffesional: "professional", programing: "programming", refered: "referred", tecnology: "technology",
    technolgy: "technology", writting: "writing", buisness: "business", bussiness: "business", collegue: "colleague",
    existance: "existence", fullfill: "fulfil", goverment: "government", independant: "independent", occassion: "occasion",
    persistant: "persistent", priviledge: "privilege", publically: "publicly", reccomend: "recommend", relevent: "relevant",
    sucess: "success", succesful: "successful", untill: "until", usefull: "useful", wether: "whether", yeild: "yield",
    wich: "which", algorithim: "algorithm", algorithem: "algorithm", databse: "database", javascipt: "JavaScript",
    kubernates: "Kubernetes", postgre: "PostgreSQL", mircoservices: "microservices", scalabilty: "scalability"
  };

  M.OWNERSHIP_VERBS = ["led", "owned", "architected", "designed", "spearheaded", "drove", "launched", "introduced", "mentored",
    "established", "founded", "pioneered", "initiated", "directed", "managed", "championed", "defined", "built from scratch"];

  /* interview questions keyed by tech term (first alias is used for display) */
  M.QUESTIONS = {
    "python": "You list Python — how does the GIL affect your concurrency choices, and when did you reach for multiprocessing or asyncio instead?",
    "java": "You list Java — walk me through how the JVM garbage collector choice affected a service you ran.",
    "javascript": "You list JavaScript — explain the event loop and a bug you hit because of async ordering.",
    "typescript": "You list TypeScript — where did the type system actually catch a real bug, and where did it get in your way?",
    "react|reactjs|react.js": "You list React — how did you diagnose and fix a re-render performance problem?",
    "node.js|nodejs": "You list Node.js — what happens when a CPU-bound task lands on your event loop, and how do you handle it?",
    "sql": "You list SQL — take me through how you'd find out why a query got slow, and what you'd change.",
    "postgresql|postgres": "You list PostgreSQL — when would you add an index, and when would that hurt you?",
    "mongodb": "You list MongoDB — why was a document store right for that workload instead of a relational DB?",
    "redis": "You list Redis — what's your cache invalidation strategy and what breaks if Redis goes down?",
    "kafka": "You list Kafka — how did you choose partition keys, and what happens when a consumer falls behind?",
    "docker": "You list Docker — how did you keep images small and secure, and what bit you in production?",
    "kubernetes|k8s": "You list Kubernetes — walk me through what happens from `kubectl apply` to a running pod, and how you debugged a crash loop.",
    "aws|amazon web services": "You list AWS — which services did you actually operate, and what did a bad IAM or networking decision cost you?",
    "microservices|microservice": "You mention microservices — what did you gain, what did you pay, and how did you handle distributed failures?",
    "rest api|rest apis|restful": "You mention REST APIs — how did you design versioning, pagination and idempotency?",
    "graphql": "You list GraphQL — how did you avoid N+1 queries and unbounded query cost?",
    "spark|pyspark": "You list Spark — how did you diagnose skew and decide partitioning?",
    "pytorch": "You list PyTorch — how did you validate the model and handle train/serving skew?",
    "tensorflow": "You list TensorFlow — how did you take a model from notebook to production?",
    "ci/cd|cicd|ci-cd": "You list CI/CD — what did your pipeline gate on, and how did you handle a flaky test suite?",
    "c++": "You list C++ — explain RAII and a memory/ownership bug you've actually debugged.",
    "terraform": "You list Terraform — how did you manage state, drift and blast radius?",
    "linux": "You list Linux — how would you debug a process that's using 100% CPU on a production box?",
    "system design": "You mention system design — design the system behind one of your projects at 10x the load. What breaks first?",
    "distributed systems": "You mention distributed systems — explain a consistency or partial-failure problem you hit and the trade-off you made.",
    "git": "You list Git — how do you recover from a bad merge/rebase on a shared branch?",
    "machine learning": "You mention machine learning — how did you define the evaluation metric and detect drift after launch?"
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
