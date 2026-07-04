import { Router } from 'express';
import puppeteer from 'puppeteer-core';

export const router = Router();

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

router.post('/scan', async (req, res) => {
  const { url, width = 1024, height = 768 } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
    const title = await page.title();
    res.json({ title, screenshot: `data:image/png;base64,${screenshot}` });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Scan failed', message: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});
