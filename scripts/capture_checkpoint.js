#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const CHECKPOINTS = {
  A_NORMAL: { time: 8.0, camera: 'FIRST_PERSON', modal: 'false' },
  C_SHARD_GOD: { time: 40.0, camera: 'FIRST_PERSON', modal: 'true' },
  D_COLLAPSE: { time: 65.0, camera: 'FIRST_PERSON', modal: 'false' },
  E_BREACH: { time: 90.0, camera: 'FIRST_PERSON', modal: 'false' },
  F_SIEGE_WALL: { time: 112.0, camera: 'FIRST_PERSON', modal: 'false' },
  G_STATION_LOSS: { time: 130.0, camera: 'CINEMATIC', modal: 'false' },
  H_REPLAY: { time: 138.0, camera: 'EXTERIOR_INSPECTION', modal: 'false' },
};

async function capture(checkpointName, outputPath, options = {}) {
  const cfg = CHECKPOINTS[checkpointName] || { time: 8.0, camera: 'FIRST_PERSON', modal: 'false' };
  const time = options.time !== undefined ? options.time : cfg.time;
  const camera = options.camera || cfg.camera;
  const modal = options.modal !== undefined ? options.modal : cfg.modal;
  const port = options.port || 5173;

  const url = `http://localhost:${port}/?time=${time}&camera=${camera}&modal=${modal}&paused=true`;

  const dir = path.dirname(path.resolve(outputPath));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--hide-scrollbars'
    ],
    defaultViewport: {
      width: 1600,
      height: 900,
      deviceScaleFactor: 1
    }
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait for WebGL canvas and render settle
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`Successfully captured ${checkpointName} -> ${outputPath}`);
    return true;
  } catch (err) {
    console.error(`Error capturing ${checkpointName}:`, err);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  let checkpoint = 'A_NORMAL';
  let out = 'screenshot.png';
  let port = 5173;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--checkpoint') checkpoint = args[++i];
    else if (args[i] === '--out') out = args[++i];
    else if (args[i] === '--port') port = parseInt(args[++i], 10);
  }

  if (checkpoint === 'ALL') {
    for (const cp of Object.keys(CHECKPOINTS)) {
      const targetOut = `docs/visual-evolution/baselines/${cp}.png`;
      await capture(cp, targetOut, { port });
    }
  } else {
    await capture(checkpoint, out, { port });
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
