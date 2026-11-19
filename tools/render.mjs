import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = join(ROOT, 'art', 'poster.html');
const OUT = join(ROOT, 'assets', 'entry.png');
const MAX_BYTES = 1048576;

function findChrome() {
  const env = process.env.CHROME_BIN;
  if (env && existsSync(env)) return env;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/local/bin/chrome',
    process.env.HOME + '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  const pw = process.env.HOME + '/.cache/ms-playwright';
  if (existsSync(pw)) {
    try {
      for (const d of readdirSync(pw)) {
        if (!/^chromium/.test(d)) continue;
        for (const rel of [
          'chrome-linux/chrome',
          'chrome-linux64/chrome',
          'chrome-mac/Chromium.app/Contents/MacOS/Chromium'
        ]) {
          candidates.push(join(pw, d, rel));
        }
      }
    } catch { /* ignore */ }
  }
  for (const c of candidates) if (c && existsSync(c)) return c;
  return null;
}

function pngSize(buf) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buf.length < 24) throw new Error('PNG too small');
  if (!buf.subarray(0, 8).equals(sig)) throw new Error('Not a PNG (bad signature)');
  if (buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Bad PNG (no IHDR)');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const chrome = await findChrome();
if (!chrome) {
  console.error('ERROR: no Chrome/Chromium binary found. Set CHROME_BIN to a Chrome executable.');
  process.exit(1);
}
if (!existsSync(ART)) {
  console.error('ERROR: missing art file: ' + ART);
  process.exit(1);
}
mkdirSync(dirname(OUT), { recursive: true });

let ok = false;
for (const h of [1024, 1111, 1132, 1200]) {
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1024,' + h,
    '--screenshot=' + OUT, 'file://' + ART
  ];
  const r = spawnSync(chrome, args, { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0) {
    console.error('Chrome exited ' + r.status + ' with window height ' + h);
    if (r.stderr) console.error(r.stderr.slice(0, 1000));
    continue;
  }
  if (!existsSync(OUT)) { console.error('No screenshot produced'); continue; }
  const buf = readFileSync(OUT);
  const size = pngSize(buf);
  if (size.w !== 1024 || size.h !== 1024) {
    console.error('Got ' + size.w + 'x' + size.h + ' with height ' + h + '; retrying');
    continue;
  }
  const bytes = statSync(OUT).size;
  if (bytes > MAX_BYTES) {
    console.error('ERROR: PNG is ' + bytes + ' bytes, over the ' + MAX_BYTES + ' byte limit');
    process.exit(1);
  }
  const sha = createHash('sha256').update(buf).digest('hex');
  console.log('width=' + size.w);
  console.log('height=' + size.h);
  console.log('bytes=' + bytes);
  console.log('sha256=' + sha);
  console.log('chrome=' + chrome);
  ok = true;
  break;
}
if (!ok) {
  console.error('ERROR: could not produce a validated 1024x1024 PNG');
  process.exit(1);
}
