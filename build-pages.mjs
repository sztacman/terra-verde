import fs from "node:fs";
import path from "node:path";

const pages = [
  {
    file: "index.html",
    slug: "domov",
    title: "Domov",
    md: "content/domov.md",
    image: "assets/images/hero-garden.webp",
    imageAlt: "Luxusná moderná záhrada pri rodinnom dome",
  },
  {
    file: "projekcia.html",
    slug: "projekcia",
    title: "Projekcia",
    md: "content/projekcia.md",
    image: "assets/images/projekcia-design.webp",
    imageAlt: "Návrh záhrady s vizualizáciou a materiálmi",
  },
  {
    file: "realizacia-a-udrzba.html",
    slug: "realizacia-a-udrzba",
    title: "Realizácia a údržba",
    md: "content/realizacia-a-udrzba.md",
    image: "assets/images/realizacia.webp",
    imageAlt: "Realizácia záhrady a pokládka trávnika",
  },
  {
    file: "interierova-zelen.html",
    slug: "interierova-zelen",
    title: "Interiérová zeleň",
    md: "content/zelene-steny-a-interierova-zelen.md",
    image: "assets/images/zelene-steny.webp",
    imageAlt: "Luxusná interiérová zelená stena",
  },
  {
    file: "velkoformatove-kvetinace.html",
    slug: "velkoformatove-kvetinace",
    title: "Veľkoformátové kvetináče",
    md: "content/velkoformatove-kvetinace.md",
    image: "assets/images/kvetinace.webp",
    imageAlt: "Prémiové veľkoformátové kvetináče",
  },
  {
    file: "referencie.html",
    slug: "referencie",
    title: "Referencie",
    md: "content/referencie.md",
    image: "assets/images/hero-garden.webp",
    imageAlt: "Moderná súkromná záhrada",
  },
  {
    file: "kontakt.html",
    slug: "kontakt",
    title: "Kontakt",
    md: "content/kontakt.md",
    image: "assets/images/hero-garden.webp",
    imageAlt: "Detail prémiovej záhrady",
  },
];

const nav = [
  ["Domov", "index.html"],
  ["Projekcia", "projekcia.html"],
  ["Realizácia a údržba", "realizacia-a-udrzba.html"],
  ["Interiérová zeleň", "interierova-zelen.html"],
  ["Veľkoformátové kvetináče", "velkoformatove-kvetinace.html"],
  ["Referencie", "referencie.html"],
  ["Kontakt", "kontakt.html"],
];

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list });
      list = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", text: trimmed.slice(4) });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h1", text: trimmed.slice(2) });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      list.push(trimmed.slice(2));
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function removeInternalBlocks(blocks) {
  const skipHeadings = new Set([
    "Header",
    "Hero",
    "Consultation CTA",
    "Page Purpose",
    "Image placeholder",
    "Image Placeholder",
    "Icon direction",
    "Open Decisions",
    "Known Client Direction",
    "Recommended Catalog Structure",
    "Recommended Project Card Content",
    "Placeholder Product Categories",
    "Contact Form",
    "Contact Details",
  ]);

  const output = [];
  let skipping = false;
  let skipLevel = 0;

  for (const block of blocks) {
    const level = block.type === "h2" ? 2 : block.type === "h3" ? 3 : 0;
    if (level && skipping && level <= skipLevel) {
      skipping = false;
      skipLevel = 0;
    }

    if ((block.type === "h2" || block.type === "h3") && skipHeadings.has(block.text)) {
      skipping = true;
      skipLevel = level;
      continue;
    }

    if (block.type === "p" && ["Image placeholder:", "Icon direction:", "CTA:"].includes(block.text)) {
      skipping = true;
      skipLevel = 3;
      continue;
    }

    if (!skipping) output.push(block);
  }

  return output;
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function blocksToHtml(blocks, page) {
  const [h1, ...rest] = removeInternalBlocks(blocks);
  const heroTitle = page.slug === "domov" ? labeledText(blocks, "Headline:") || h1?.text || page.title : h1?.text || page.title;
  const intro =
    page.slug === "domov"
      ? labeledText(blocks, "Supporting text:") || ""
      : rest.find((block) => block.type === "p")?.text || "";
  const labelParagraphs = new Set([
    "Brand:",
    "Descriptor:",
    "Navigation:",
    "Primary CTA:",
    "Secondary CTA:",
    "Eyebrow:",
    "Headline:",
    "Supporting text:",
    "Text:",
    "Form title:",
    "Submit button:",
    "Service type options:",
  ]);
  const body = rest
    .filter((block) => {
      if (block.type === "p" && labelParagraphs.has(block.text)) return false;
      return true;
    })
    .map((block) => {
      if (block.type === "h2") {
        const label =
          block.text === "Recommended Intro Copy"
            ? page.slug === "referencie"
              ? "Referencie Studio Terra Verde"
              : "Dizajnové riešenia na mieru"
            : block.text === "Content Direction"
              ? "Obsah stránky"
              : block.text;
        return `<section class="content-block"><h2>${inline(label)}</h2>`;
      }
      if (block.type === "h3") return `<h3>${inline(block.text)}</h3>`;
      if (block.type === "p") return `<p>${inline(block.text)}</p>`;
      if (block.type === "ul") return `<ul class="check-list">${block.items.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`;
      return "";
    })
    .join("\n")
    .replaceAll(/(<section class="content-block">)/g, "</section>$1")
    .replace("</section>", "")
    .concat("</section>");

  return { heroTitle, intro, body };
}

function labeledText(blocks, label) {
  const index = blocks.findIndex((block) => block.type === "p" && block.text === label);
  if (index === -1) return "";
  const next = blocks.slice(index + 1).find((block) => block.type === "p");
  return next?.text || "";
}

function servicesSection() {
  const services = [
    ["Návrh záhrad", "Individuálne návrhy záhrad na mieru vašim predstavám.", "projekcia.html"],
    ["Realizácia", "Komplexná realizácia záhrad s dôrazom na kvalitu.", "realizacia-a-udrzba.html"],
    ["Údržba zelene", "Profesionálna starostlivosť pre krásu a zdravie vašej zelene.", "realizacia-a-udrzba.html"],
    ["Zelené steny", "Moderné vertikálne záhrady pre interiér aj exteriér.", "interierova-zelen.html"],
    ["Interiérová zeleň", "Rastlinné riešenia pre domácnosti a kancelárske priestory.", "interierova-zelen.html"],
    ["Kvetináče", "Dizajnové nádoby pre reprezentatívne priestory.", "velkoformatove-kvetinace.html"],
  ];

  return `<section class="services services-pages" aria-label="Prehľad služieb">
    ${services
      .map(
        ([title, text, href]) => `<article>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40V16M24 16c-8 0-13-4-15-10 8 0 13 4 15 10Zm0 0c8 0 13-4 15-10-8 0-13 4-15 10Zm0 10c-7 0-12-3-15-8 7-1 12 2 15 8Zm0 0c7 0 12-3 15-8-7-1-12 2-15 8Z"/></svg>
          <h3>${title}</h3>
          <p>${text}</p>
          <a href="${href}">Zistiť viac</a>
        </article>`
      )
      .join("")}
  </section>`;
}

function contactForm() {
  return `<form class="contact-form">
    <label>Meno a priezvisko <input type="text" name="name" autocomplete="name"></label>
    <label>E-mail <input type="email" name="email" autocomplete="email"></label>
    <label>Telefón <input type="tel" name="phone" autocomplete="tel"></label>
    <label>Typ služby
      <select name="service">
        <option>Návrh záhrady</option>
        <option>Realizácia záhrady</option>
        <option>Údržba zelene</option>
        <option>Zelená stena</option>
        <option>Interiérová zeleň</option>
        <option>Veľkoformátové kvetináče</option>
      </select>
    </label>
    <label>Správa <textarea name="message" rows="4"></textarea></label>
    <button class="button primary" type="submit">Odoslať správu</button>
  </form>`;
}

function referencesGrid() {
  return `<div class="reference-grid">
    <article>
      <img src="assets/images/hero-garden.webp" alt="Moderná súkromná záhrada">
      <h3>Moderná súkromná záhrada</h3>
      <p>Návrh a realizácia exteriérovej zelene.</p>
    </article>
    <article>
      <img src="assets/images/kvetinace.webp" alt="Reprezentatívna terasa">
      <h3>Reprezentatívna terasa</h3>
      <p>Terasová zeleň a veľkoformátové kvetináče.</p>
    </article>
    <article>
      <img src="assets/images/zelene-steny.webp" alt="Interiérová zelená stena">
      <h3>Interiérová zelená stena</h3>
      <p>Samozavlažovacia zelená stena pre moderný interiér.</p>
    </article>
  </div>`;
}

function productGrid() {
  return `<div class="product-grid" aria-label="Ukážka katalógu">
    <article><span>Travertine Bowl</span><strong>od 290 EUR</strong></article>
    <article><span>Charcoal Cylinder</span><strong>od 360 EUR</strong></article>
    <article><span>Bronze Low Planter</span><strong>od 420 EUR</strong></article>
  </div>`;
}

function renderPage(page) {
  const markdown = fs.readFileSync(page.md, "utf8");
  const content = blocksToHtml(parseMarkdown(markdown), page);
  const activeNav = nav
    .map(([label, href]) => `<a href="${href}"${href === page.file ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");

  const extra =
    page.slug === "domov"
      ? ""
      : page.slug === "kontakt"
        ? `<section class="contact standalone-contact">${contactForm()}</section>`
        : page.slug === "referencie"
          ? `<section class="references">${referencesGrid()}</section>`
          : page.slug === "velkoformatove-kvetinace"
            ? `<section class="catalog-items">${productGrid()}</section>`
            : "";

  return `<!doctype html>
<html lang="sk">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${page.title} | Studio Terra Verde</title>
    <meta name="description" content="Studio Terra Verde - prémiové krajinné a záhradné úpravy, realizácia, údržba zelene a interiérová zeleň.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="index.html" aria-label="Studio Terra Verde">
        <img src="assets/images/logo-mark.webp" alt="">
        <span><small>Studio</small>Terra Verde</span>
      </a>
      <button class="menu-toggle" type="button" aria-label="Otvoriť menu" aria-expanded="false">
        <span></span>
        <span></span>
      </button>
      <nav class="main-nav" aria-label="Hlavná navigácia">${activeNav}</nav>
      <a class="header-cta" href="kontakt.html">Konzultácia zdarma</a>
    </header>

    <main>
      <section class="page-hero ${page.slug === "domov" ? "home-hero" : ""}">
        <div class="page-hero-copy">
          <p class="eyebrow">${page.slug === "domov" ? "Premium záhradné riešenia" : page.title}</p>
          <h1>${inline(content.heroTitle)}</h1>
          ${content.intro ? `<p>${inline(content.intro)}</p>` : ""}
          <div class="hero-actions">
            <a class="button primary" href="kontakt.html">Dohodnúť stretnutie</a>
            <a class="button text" href="referencie.html">Referencie</a>
          </div>
        </div>
        <div class="page-hero-image">
          <img src="${page.image}" alt="${page.imageAlt}">
        </div>
      </section>

      ${page.slug === "domov" ? servicesSection() : ""}

      <section class="page-content">
        ${content.body}
      </section>

      ${extra}

      <section class="cta-band">
        <div>
          <p class="eyebrow">Úvodná konzultácia</p>
          <h2>Prvé stretnutie a terénna obhliadka zdarma</h2>
        </div>
        <p>Spoznáme váš priestor, prediskutujeme vaše predstavy a navrhneme ideálne riešenie.</p>
        <a class="button outline" href="kontakt.html">Dohodnúť stretnutie</a>
      </section>
    </main>

    <footer class="site-footer">
      <img src="sources/terra-verde-logo-dark.jpeg" alt="Studio Terra Verde">
      <p>Krajinné a záhradné úpravy</p>
      <nav aria-label="Navigácia v pätičke">
        <a href="projekcia.html">Projekcia</a>
        <a href="realizacia-a-udrzba.html">Realizácia</a>
        <a href="interierova-zelen.html">Interiérová zeleň</a>
        <a href="kontakt.html">Kontakt</a>
      </nav>
    </footer>

    <script src="script.js"></script>
  </body>
</html>
`;
}

for (const page of pages) {
  fs.writeFileSync(page.file, renderPage(page), "utf8");
}

console.log(`Generated ${pages.length} pages from /content.`);
