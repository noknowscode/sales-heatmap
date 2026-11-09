// The Sales Heatmap capture driver (adapted from PAC's drive.js): one browser page kept open and driven step by step
// over a local control port, so a session is one running card: one feed, one heatmap, whatever the viewport or theme.
//
//   node drive.js <url> <outdir> <WxH> <dpr> <scheme> <controlPort> [clock]
//   "clock" installs Playwright's clock in the page before the app loads (time flows as usual until a `freeze`), so a
//   moment of the running card can be held still and shot in every theme and size.
//   curl -s localhost:<controlPort> -d '[{"viewport":[390,844]},{"wait":3000},{"shot":"name"}]'
//
// Steps (run in order; every step is appended to <outdir>/steps.jsonl, kept in tools/sessions/):
//   {scheme:"light"|"dark"}  prefers-color-scheme (the app follows it)     {viewport:[w,h]}  resize (same app instance)
//   {move:[x,y]}             park the pointer                              {wait:ms}
//   {shot:"name", clip:{x,y,width,height}}  one screenshot at the context's device pixel ratio
//   {burst:"prefix", n:8, every:2000, clip:{...}}
//                            n screenshots of the clip, one every `every` ms (prefix-000.png ...), with their times in
//                            steps.jsonl: the heatmap of one running card at successive moments.
//   {freeze:{figures:{...}, dot:{at:[x,y], rgb:"#RRGGBB"}, hold:250, need:100, dotNeed:100}}
//                            (clock sessions) pauses the page clock, then advances it 50 ms at a time until the figures
//                            (a clip around the totals and regions) have held still for `hold` ms of page time, the LIVE
//                            dot is at the "on" end of its blink, and the next feed tick is at least `need` ms away (the
//                            dot's next blink `dotNeed` ms), then leaves the clock paused there. The feed ticks every 2 s
//                            of page time and the figures ease for up to about 1.9 s after a tick; the slack lets the
//                            theme or size change with `run` (a theme change paints within 32 ms) without a tick.
//   {run:ms}                 advance the paused page clock by ms (timers and frames fire as they would); in a step
//                            with a scheme or viewport change, after 400 ms of real time so the change is dispatched
//   {resume:true}            let the page clock flow again
//   {pause:true}             (clock sessions) pause the page clock at any moment (3 s of page time ahead)
//   {reload:true}            a fresh instance of the app in the same page (the clock is installed again)
//   A `freeze` with maxTicks gives up (and the rest of the request is not run) after that many feed ticks without a
//   moment that qualifies: the blink and the feed run on fixed timers, so in some instances they never line up.
const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const zlib = require('zlib');

// Minimal PNG reader for Playwright's 8-bit RGB/RGBA, non-interlaced screenshots: returns {w, h, px(x,y) -> [r,g,b]}.
function decodePng(buf) {
  let pos = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = (x >= bpp && y) ? out[(y - 1) * stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, px: (x, y) => [out[y * stride + x * bpp], out[y * stride + x * bpp + 1], out[y * stride + x * bpp + 2]] };
}

(async () => {
  const [url, out, size, dpr, scheme, port, clock] = process.argv.slice(2);
  const [w, h] = size.split('x').map(Number);
  fs.mkdirSync(out, { recursive: true });
  const log = fs.createWriteStream(`${out}/steps.jsonl`, { flags: 'a' });
  const b = await chromium.launch({ args: ['--hide-scrollbars'] });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: Number(dpr), colorScheme: scheme });
  if (clock === 'clock') await ctx.clock.install();
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const t0 = Date.now();
  await p.goto(url, { waitUntil: 'load', timeout: 300000 });
  log.write(JSON.stringify({ open: url, size, dpr: Number(dpr), scheme, at: new Date().toISOString() }) + '\n');
  console.log('loaded after', Math.round((Date.now() - t0) / 1000), 's');
  await p.mouse.move(w - 2, h - 2);

  const shot = async (name, clip) => {
    await p.screenshot({ path: `${out}/${name}.png`, clip, animations: 'disabled', timeout: 240000 });
    log.write(JSON.stringify({ saved: name, at: new Date().toISOString() }) + '\n');
  };
  // Pixel colour at a CSS point of a decoded clip
  const near = (img, clip, [x, y], hex, tol = 36) => {
    const d = Number(dpr), c = img.px(Math.round((x - clip.x) * d), Math.round((y - clip.y) * d));
    const want = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    return Math.hypot(c[0] - want[0], c[1] - want[1], c[2] - want[2]) < tol;
  };
  async function freeze(f) {
    const pageNow = await p.evaluate(() => Date.now());
    await p.clock.pauseAt(Math.max(pageNow, Date.now()) + 3000);
    // without `dot` the blink is not waited for (the feed and the blink run on fixed timers, so in some sessions the dot
    // is never "on" in the quiet part of a feed cycle)
    const dc = f.dot && { x: Math.floor(f.dot.at[0]) - 3, y: Math.floor(f.dot.at[1]) - 3, width: 7, height: 7 };
    const hold = f.hold ?? 250, need = f.need ?? 100, dotNeed = f.dotNeed ?? need, step = f.step ?? 50;
    let prev = await p.screenshot({ clip: f.figures }), t = 0, lastChange = 0, tickAt = null, dotOnAt = null, dotWas = true;
    const t0 = Date.now();
    let ticks = 0;
    for (let i = 0; i < 4000; i++) {
      await p.clock.runFor(step); t += step;
      const cur = await p.screenshot({ clip: f.figures });
      if (!cur.equals(prev)) {
        if (t - lastChange > 220) { tickAt = t - step; if (++ticks > (f.maxTicks ?? 1e9)) throw new Error(`freeze gave up after ${ticks - 1} feed ticks (the blink never lit in the quiet part of a cycle)`); log.write(JSON.stringify({ tick: tickAt, settledAfter: lastChange - (f._lastTick ?? 0), realMs: Date.now() - t0 }) + '\n'); f._lastTick = tickAt; }
        lastChange = t;
      }
      prev = cur;
      const on = !f.dot || near(decodePng(await p.screenshot({ clip: dc })), dc, f.dot.at, f.dot.rgb, f.dot.tol);
      if (!f.dot) dotOnAt = t + 1e6;
      else if (on && !dotWas) dotOnAt = t - step;
      dotWas = on;
      if (tickAt === null || dotOnAt === null || !on || t - lastChange < hold) continue;
      const tickSlack = tickAt + 2000 - t, dotSlack = dotOnAt + 500 - t;
      if (tickSlack >= need && dotSlack >= dotNeed) {
        log.write(JSON.stringify({ frozen: true, pageMs: t, still: t - lastChange, tickSlack, dotSlack, realMs: Date.now() - t0, at: new Date().toISOString() }) + '\n');
        return `frozen after ${t} ms of page time: figures still ${t - lastChange} ms, next tick in ${tickSlack} ms, dot on for ${dotSlack} ms more`;
      }
    }
    return 'freeze FAILED';
  }

  async function run(steps) {
    const res = [];
    for (const s of steps) {
      log.write(JSON.stringify({ ...s, at: new Date().toISOString() }) + '\n');
      if (s.viewport) await p.setViewportSize({ width: s.viewport[0], height: s.viewport[1] });
      if (s.freeze) res.push(await freeze(s.freeze));
      if (s.resume) await p.clock.resume();
      if (s.reload) { await p.reload({ waitUntil: 'load', timeout: 300000 }); await p.mouse.move(2, 2); }
      if (s.pause) { const n = await p.evaluate(() => Date.now()); await p.clock.pauseAt(Math.max(n, Date.now()) + 3000); }
      if (s.scheme) await p.emulateMedia({ colorScheme: s.scheme });
      // the browser dispatches a colour-scheme or resize change at its next real frame; let it, then advance the page clock
      if (s.run) { if (s.scheme || s.viewport) await p.waitForTimeout(400); await p.clock.runFor(s.run); }
      if (s.move) await p.mouse.move(...s.move);
      if (s.wait) await p.waitForTimeout(s.wait);
      if (s.shot) { const t = Date.now(); await shot(s.shot, s.clip); res.push(`shot ${s.shot} ${Date.now() - t}ms`); }
      if (s.burst) {
        const t = Date.now();
        for (let i = 0; i < s.n; i++) {
          const due = t + i * s.every;
          if (Date.now() < due) await p.waitForTimeout(due - Date.now());
          await shot(`${s.burst}-${String(i).padStart(3, '0')}`, s.clip);
        }
        res.push(`burst ${s.burst} x${s.n} ${Date.now() - t}ms`);
      }
    }
    if (errors.length) { res.push('errors: ' + errors.slice(0, 3).join(' | ')); errors.length = 0; }
    return res;
  }

  http.createServer((req, resp) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        if (body.trim() === 'quit') { resp.end('bye\n'); await b.close(); process.exit(0); }
        const r = await run(JSON.parse(body));
        resp.end(r.join('\n') + '\nok\n');
      } catch (e) { resp.statusCode = 500; resp.end(String(e) + '\n'); }
    });
  }).listen(Number(port), '127.0.0.1', () => console.log('control on', port));
})();
