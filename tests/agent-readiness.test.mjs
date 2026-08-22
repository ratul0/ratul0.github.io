import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readDist = (relativePath) =>
  readFile(new URL(`../dist/${relativePath}`, import.meta.url), "utf8");

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

test("homepage publishes canonical metadata and a markdown alternative", async () => {
  const html = await readDist("index.html");

  assert.match(html, /<html lang="en">/);
  assert.match(html, /rel="canonical" href="https:\/\/ratul0\.github\.io\/"/);
  assert.match(html, /rel="alternate" type="text\/markdown" href="\/index\.md"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /property="og:type" content="website"/);
});

test("homepage JSON-LD identifies the person, organization, and website", async () => {
  const html = await readDist("index.html");
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );

  assert.ok(match, "expected a JSON-LD script");
  const data = JSON.parse(match[1]);
  const types = data["@graph"].map((entry) => entry["@type"]);

  assert.deepEqual(types, ["Person", "Organization", "WebSite"]);

  const organization = data["@graph"].find(
    (entry) => entry["@type"] === "Organization",
  );
  assert.equal(organization.contactPoint.contactType, "professional inquiries");
  assert.equal(organization.contactPoint.email, "ratulcse27@gmail.com");
  assert.equal(organization.address.addressLocality, "Bremen");
  assert.equal(organization.address.addressCountry, "DE");
});

test("agent discovery files use canonical URLs and explicit use guidance", async () => {
  const [robots, sitemap, llms, markdown] = await Promise.all([
    readDist("robots.txt"),
    readDist("sitemap.xml"),
    readDist("llms.txt"),
    readDist("index.md"),
  ]);

  assert.match(robots, /Sitemap: https:\/\/ratul0\.github\.io\/sitemap\.xml/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  for (const page of ["", "about/", "contact/", "privacy/"]) {
    assert.match(sitemap, new RegExp(`<loc>https://ratul0\\.github\\.io/${page}</loc>`));
  }
  assert.match(llms, /## When to use this site/);
  assert.match(llms, /Do not use this site as an API, developer portal, authentication provider, commerce service, or MCP server\./);
  assert.match(markdown, /This personal portfolio has no API, login, commerce flow, or MCP server\./);
});

test("trust pages contain substantial content and canonical metadata", async () => {
  for (const page of ["about", "contact", "privacy"]) {
    const html = await readDist(`${page}/index.html`);
    assert.ok(visibleText(html).length >= 500, `${page} should contain at least 500 visible characters`);
    assert.match(
      html,
      new RegExp(`rel="canonical" href="https://ratul0\\.github\\.io/${page}/"`),
    );
  }
});

test("custom 404 gives agents recovery links", async () => {
  const html = await readDist("404.html");

  assert.match(html, /404: Page not found/);
  assert.match(html, /https:\/\/ratul0\.github\.io\/sitemap\.xml/);
  assert.match(html, /https:\/\/ratul0\.github\.io\/llms\.txt/);
  assert.match(html, /href="\/sitemap\.xml"/);
  assert.match(html, /href="\/llms\.txt"/);
  assert.match(html, /name="robots" content="noindex, follow"/);
});
