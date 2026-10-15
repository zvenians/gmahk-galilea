import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {visitorFixture,hymnalFixture} from './visitor-fixture.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'};
const server = createServer((req,res)=>{
  const pathname = new URL(req.url,'http://localhost').pathname;
  const file = path.resolve(root,'.'+(pathname === '/'?'/index.html':pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404);res.end();return; }
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:'+server.address().port;
const browser = await chromium.launch({headless:true,args:['--no-sandbox'],
  executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (fs.existsSync(chromium.executablePath())?chromium.executablePath():undefined)});
const context = await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page = await context.newPage();
const errors = [];
const requests = [];
let submitCount = 0;
let serviceFails = false;
let searchFails = false;
let fixture = visitorFixture();
page.on('pageerror',error=>errors.push(error.message));
await page.route('**/*',async route=>{
  const url = new URL(route.request().url());
  if (url.pathname === '/api/gas') {
    const {method,args} = route.request().postDataJSON();
    requests.push(method);
    let data = {};
    if (method === 'getWebsiteData') data = args[0]?.revisionOnly?{cacheRevision:'test-1',dayKey:fixture.dayKey}:fixture;
    if (method === 'getDailyDevotional') data = {format:'text',requestedDate:args[0],title:'Renungan uji',todayLabel:args[0],contentHtml:'<p>Teks untuk pengujian.</p>'};
    if (method === 'searchWebsite') {
      if (searchFails) return route.fulfill({status:503,json:{ok:false,error:'Pencarian uji tidak tersedia.'}});
      data = {results:[{kind:'Berita Jemaat',route:'activities',title:'Kunjungan Uji',excerpt:'Berita uji',action:''},{kind:'Agenda dan Pengumuman',route:'announcements',title:'Pengumuman Uji',excerpt:'Pengumuman',action:''}]};
    }
    if (method === 'submitServiceRequest') {
      submitCount++;
      if (serviceFails) return route.fulfill({status:503,json:{ok:false,error:'Pengiriman uji gagal. Isi form tetap tersedia.'}});
      data = {reference:'TEST-0001',message:'Permohonan uji diterima.'};
    }
    if (method === 'getAwrBorneoMedia') data = {videos:[],channelTitle:'Kanal uji'};
    if (method === 'getSabbathDiscussionVideos') data = {videos:[]};
    if (method === 'getAdventTheme') data = {title:'Tema uji',theme:'Tema uji'};
    if (method === 'getBibleBooks') data = [{id:'gen',name:'Kejadian',chapters:50,testament:'old'}];
    if (method === 'getSabbathSchoolLibrary') data = {lessons:[]};
    return route.fulfill({json:{ok:true,data}});
  }
  if (url.pathname === '/api/instagram') return route.fulfill({json:{ok:true,reel:{permalink:'https://www.instagram.com/reel/test/',embedUrl:'https://www.instagram.com/reel/test/embed/',caption:'Caption uji yang panjang. '.repeat(40)}}});
  if (url.hostname === 'raw.githubusercontent.com') return route.fulfill({json:hymnalFixture});
  if (url.origin !== base) return route.fulfill({status:200,contentType:'text/html',body:'<p>Embed untuk pengujian.</p>'});
  return route.continue();
});

let navigation = 0;
async function visit(route) {
  await page.goto(base+'/?check='+(++navigation)+'#'+route);
  await page.waitForSelector('#app h1');
  await page.locator('#loader').waitFor({state:'hidden'});
}
async function noOverflow(label) {
  const result = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
    offenders:[...document.querySelectorAll('#app *')].filter(node=>{
      const box=node.getBoundingClientRect();return box.width && (box.right>innerWidth+2 || box.left< -2);
    }).slice(0,5).map(node=>node.className)}));
  assert.ok(result.scroll <= result.width+1,label+': '+JSON.stringify(result));
}

try {
  await visit('home');
  assert.ok((await page.locator('.hero-next').textContent()).includes('WITA'));
  assert.ok((await page.locator('.hero-next').boundingBox()).y < 650,'Date visible near the opening');
  assert.ok(!requests.includes('getAwrBorneoMedia') && !requests.includes('getAdventTheme'),'Closed extras must not fetch');
  await page.locator('[data-home-extra="broadcast"] summary').click();
  await page.waitForFunction(()=>!document.querySelector('#home-video .faith-loader'));
  assert.ok(requests.includes('getAwrBorneoMedia'),'Opening broadcast fetches videos');
  await page.locator('.search-trigger').click();
  await page.locator('#search-input').fill('Kunjungan Uji');
  await page.locator('#search-form').evaluate(form=>form.requestSubmit());
  await page.locator('[data-search-id="news-0"]').click();
  await page.locator('#reader-dialog').waitFor({state:'visible'});
  assert.equal(await page.locator('#reader-title').textContent(),'Kunjungan Uji');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#reader-dialog').isVisible(),false);
  console.log('PASS: opening date, deferred broadcasts, legacy news search opens exact item, Escape closes reader.');

  await page.locator('.search-trigger').click();
  await page.locator('#search-input').fill('Pengumuman Uji');
  await page.locator('#search-form').evaluate(form=>form.requestSubmit());
  await page.locator('[data-search-id="note-0"]').click();
  await page.locator('#reader-dialog').waitFor({state:'visible'});
  assert.equal(await page.locator('#reader-title').textContent(),'Pengumuman Uji');
  await page.keyboard.press('Escape');
  searchFails = true;
  await page.locator('.search-trigger').click();
  await page.locator('#search-input').fill('Kunjungan Uji');
  await page.locator('#search-form').evaluate(form=>form.requestSubmit());
  await page.waitForFunction(()=>document.querySelector('.search-status')?.textContent.includes('belum terhubung'));
  assert.ok(await page.locator('[data-search-id="news-0"]').isVisible());
  await page.keyboard.press('Escape');
  console.log('PASS: announcement search opens exact item; server failure preserves local search results.');

  await visit('services');
  await page.locator('#service-submit').click();
  assert.equal(submitCount,0,'Empty form must not send');
  async function fillForm() {
    await page.locator('#service-name').fill('Pengguna uji');
    await page.locator('#service-phone').fill('0000000000');
    await page.locator('#service-message').fill('Pesan uji yang tidak dikirim ke server gereja.');
    await page.locator('[name="consent"]').check();
  }
  await fillForm();
  await page.locator('#service-form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});
  await page.waitForSelector('.service-confirmation');
  assert.equal(submitCount,1,'Duplicate submit is ignored');
  assert.match(await page.locator('#service-result').textContent(),/TEST-0001/);
  assert.match(await page.locator('.service-confirmation a').getAttribute('href'),/TEST-0001/);
  serviceFails = true;
  await fillForm();
  await page.locator('#service-submit').click();
  await page.waitForFunction(()=>document.querySelector('#service-result').textContent.includes('Pengiriman uji gagal'));
  assert.equal(await page.locator('#service-name').inputValue(),'Pengguna uji');
  assert.equal(await page.locator('#service-submit').isEnabled(),true);
  console.log('PASS: form validation, duplicate protection, reference, follow-up link, failure retains entered data.');

  const widths = [320,390,768,1024,1440];
  for (const theme of ['light','dark']) {
    await page.evaluate(theme=>localStorage.setItem('galilea:theme',theme),theme);
    for (const width of widths) {
      await page.setViewportSize({width,height:950});
      for (const route of ['home','activities','announcements','gallery','visitor','services','contact','schedule','leaders','faq']) {
        await visit(route);
        await noOverflow(theme+' '+width+' '+route);
      }
    }
  }
  console.log('PASS: 100 route/theme/width checks with long titles, captions, locations, and 12 items per list.');

  await page.setViewportSize({width:390,height:844});
  await visit('home');
  await page.locator('#mobile-toggle').click();
  assert.equal(await page.locator('#mobile-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#mobile-nav [data-route="visitor"]').click();
  await page.waitForSelector('.visitor-arrival');
  assert.equal(await page.locator('#mobile-toggle').getAttribute('aria-expanded'),'false');
  assert.match(await page.locator('.visitor-guide-grid').textContent(),/belum dikonfirmasi/);
  await page.emulateMedia({reducedMotion:'reduce'});
  await noOverflow('reduced motion');
  for (const count of [0,1,2,3,25]) {
    fixture = visitorFixture(count);
    await page.evaluate(()=>localStorage.removeItem('galilea:v1800-bootstrap'));
    for (const route of ['home','activities','announcements','gallery']) {
      await visit(route);
      await noOverflow('content count '+count+' '+route);
      if (route === 'activities') assert.equal(await page.locator('.activity-cinema-grid>.activity-film').count(),count);
      if (route === 'gallery') assert.equal(await page.locator('.gallery-grid>.gallery-item').count(),count);
    }
  }
  assert.deepEqual(errors,[],'No browser exceptions');
  console.log('PASS: mobile navigation, honest access guidance, reduced motion, empty/small/large collections, zero browser exceptions.');
  await page.evaluate(()=>localStorage.setItem('galilea:font','xlarge'));
  await page.setViewportSize({width:320,height:900});
  for (const route of ['visitor','services','activities']) { await visit(route); await noOverflow('large text '+route); }
  console.log('PASS: largest text setting at 320px.');

  const offlineContext = await browser.newContext({serviceWorkers:'allow',viewport:{width:390,height:844}});
  const offlinePage = await offlineContext.newPage();
  offlinePage.on('pageerror',error=>errors.push(error.message));
  await offlinePage.route('**/api/gas',route=>{
    const {method,args} = route.request().postDataJSON();
    const data = method === 'getWebsiteData'
      ? args[0]?.revisionOnly?{cacheRevision:'test-1',dayKey:fixture.dayKey}:visitorFixture(2)
      : method === 'getDailyDevotional'?{requestedDate:args[0],format:'text',title:'Renungan uji',contentHtml:'<p>Teks uji.</p>'}:{};
    return route.fulfill({json:{ok:true,data}});
  });
  await offlinePage.route('**/api/instagram',route=>route.fulfill({status:503,json:{ok:false}}));
  await offlinePage.route('**/raw.githubusercontent.com/**',route=>route.fulfill({json:hymnalFixture}));
  await offlinePage.goto(base);
  await offlinePage.waitForSelector('.hero-next');
  await offlinePage.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  const shell = await offlinePage.evaluate(async()=>{
    const cache=await caches.open('galilea-v46-welcome');
    return (await cache.keys()).map(request=>new URL(request.url).pathname);
  });
  assert.ok(shell.includes('/viewer.js') && shell.includes('/viewer.css'),'New modules are available offline');
  await offlineContext.setOffline(true);
  await offlinePage.reload();
  await offlinePage.waitForSelector('.hero-next');
  assert.ok(await offlinePage.locator('.hero-next').isVisible(),'Cached viewer reloads offline');
  await offlinePage.locator('#mobile-toggle').click();
  await offlinePage.locator('#mobile-nav [data-route="activities"]').click();
  await offlinePage.waitForSelector('.activity-cinema-grid');
  assert.equal(await offlinePage.locator('.activity-film').count(),2);
  assert.deepEqual(errors,[],'Offline flow has no browser exceptions');
  await offlineContext.close();
  console.log('PASS: service worker caches split assets, offline reload renders, cached news remains accessible.');
} catch (error) {
  await page.screenshot({path:'/tmp/galilea-visitor-failure.png',fullPage:false}).catch(()=>{});
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
