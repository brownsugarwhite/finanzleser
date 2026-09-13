const { chromium } = await import("playwright-core");
const OUT = process.env.OUT;
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
await p.goto("http://localhost:3000", { waitUntil: "load" });
const nn = p.getByRole("button", { name: "Nur notwendig" }); if (await nn.count()) await nn.first().click().catch(()=>{});
await p.waitForTimeout(2500);
const g = await p.evaluate(() => document.body.scrollHeight - innerHeight);
for (let i = 0; i <= 10; i++) { await p.evaluate((y) => window.scrollTo(0, y), Math.round((i*g)/10)); await p.waitForTimeout(220); }
for (const [sel, name] of JSON.parse(process.env.Z)) {
  await p.evaluate((s) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 130); }, sel);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}${name}.png` });
}
await b.close();
