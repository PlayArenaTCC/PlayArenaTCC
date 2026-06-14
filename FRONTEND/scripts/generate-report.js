import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

async function run() {
  const mdPath = path.resolve(process.cwd(), 'reports', 'playwright-test-report.md');
  const outPdf = 'D:\\Teste\\playarena-test-report.pdf';

  const md = fs.readFileSync(mdPath, 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}h1{color:#222}pre{background:#f6f8fa;padding:12px;border-radius:6px}</style></head><body>${marked(md)}</body></html>`;

  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outPdf, format: 'A4', printBackground: true });
  await browser.close();
  console.log('PDF gerado em:', outPdf);
}

run().catch(err => {
  console.error('Erro ao gerar PDF:', err);
  process.exit(1);
});
