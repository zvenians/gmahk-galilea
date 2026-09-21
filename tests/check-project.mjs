import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const worker = read('sw.js');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
assert.match(index, /data-build="GALILEA-ADMIN-STABILITY-35-8-0"/);
assert.match(index, /GALILEA-RESPONSIVE-ABOUT-35-1-0/);
assert.match(index, /profile-role/);
assert.match(index, /fetch\('\/api\/gas'/);
assert.match(index, /fetch\('\/api\/quarterly-pdf'/);
assert.match(index, /fetch\('\/api\/weekly-bulletin'/);
assert.match(index, /property="og:image" content="https:\/\/gmahk-galilea\.vercel\.app\/api\/og/);
assert.match(index, /name="robots" content="index,follow,max-image-preview:large/);
assert.match(index, /rel="sitemap" type="application\/xml"/);
assert.match(index, /"@type": "Church"/);
assert.match(index, /function syncSeoMetadata\(route,site\)/);
assert.doesNotMatch(index, /google\.script\.run/);
assert.doesNotMatch(index, /<\?(?:=|!=|\s)/);
assert.match(index, /data-open-activity/);
assert.match(index, /activity-story-gallery/);
assert.match(index, /devotional-cinema/);
assert.match(index, /v1800-bootstrap/);
assert.match(index, /cacheSet\('v1800-bootstrap',fresh,60000\)/);
assert.match(index, /renderBulletin/);
assert.match(index, /renderToday/);
assert.match(index, /data-route="today"/);
assert.match(index, /name="privacy"/);
assert.match(index, /renderVisitor/);
assert.match(index, /renderFavorites/);
assert.match(index, /downloadCalendarIcs/);
assert.match(index, /serviceWorker\.register\('\/sw\.js'\)/);
assert.match(index, /opening-sanctuary/);
assert.match(index, /Jelajahi ruang digital Galilea/);
assert.match(index, /htmlToShareText/);
assert.match(index, /const fullReading = htmlToShareText\(item\.contentHtml\)/);
assert.match(index, /id="presentation-dialog"/);
assert.match(index, /Sekretaris Galilea 2026/);
assert.match(index, /Website GMAHK Galilea/);
assert.match(index, /hymnal-toolbar/);
assert.match(index, /presentation-refrain\{[^}]*clamp\(1\.8rem,3\.6vw,4\.8rem\)/);
assert.match(index, /presentation-title\{[^}]*clamp\(1\.15rem,2vw,2\.15rem\)/);
assert.match(index, /presentation-stage\{[^}]*scrollbar-width:none/);
assert.match(index, /presentation-stage::\-webkit-scrollbar\{[^}]*display:none/);
assert.match(index, /presentation-head\{[^}]*display:flex/);
assert.match(index, /presentation-title::before\{[^}]*content:"—"/);
assert.match(index, /presentation-controls button\{[^}]*clamp\(34px,2\.5vw,40px\)/);
assert.match(index, /GALILEA-PRESENTATION-SUITE-22-0-0/);
assert.match(index, /presentation-controls-hidden/);
assert.match(index, /function fitPresentationText\(\)/);
assert.match(index, /handlePresentationPointerUp/);
assert.match(index, /event\.key==='ArrowLeft'\|\|event\.key==='PageUp'/);
assert.match(index, /navigator\.wakeLock\.request\('screen'\)/);
assert.doesNotMatch(index, /data-presentation-blackout/);
assert.match(index, /galilea:presentation-scale:/);
assert.match(index, /data-presentation-projector/);
assert.match(index, /is-projector/);
assert.match(index, /is-projector \.presentation-main\{position:absolute;inset:0;height:auto/);
assert.match(index, /document\.activeElement\.blur/);
assert.match(index, /data-presentation-theme/);
assert.match(index, /galilea:presentation-theme/);
assert.match(index, /function togglePresentationTheme\(\)/);
assert.match(index, /is-light/);
assert.match(index, /Gunakan mode gelap/);
assert.match(index, /event\.key\.toLowerCase\(\)==='t'/);
assert.match(index, /@media\(max-width:520px\)\{\.presentation-controls button\{width:32px;height:32px\}/);
assert.match(index, /GALILEA-PRESENTATION-MOTION-23-0-0/);
assert.match(index, /function animatePresentationTransition\(direction\)/);
assert.match(index, /presentation-enter-next/);
assert.match(index, /presentation-enter-prev/);
assert.match(index, /document\.documentElement\.dataset\.motion==='reduced'/);
assert.doesNotMatch(index, /Siap ditampilkan/i);
assert.doesNotMatch(index, /theme-song-preview/);
assert.match(index, /id="presentation-offline"/);
assert.match(index, /async function cachedResource/);
assert.match(worker, /galilea-v35-8-admin-stability/);
assert.match(index, /GALILEA-DUAL-BRAND-31-0-0/);
assert.match(index, /assets\/logo-galilea-light\.webp/);
assert.match(index, /assets\/logo-galilea-dark\.webp/);
assert.match(index, /class="theme-logo-pair presentation-logo"/);
assert.doesNotMatch(index, /adventist_logo\.png/);
assert.ok(fs.existsSync(path.join(root, 'assets/logo-galilea-light.webp')));
assert.ok(fs.existsSync(path.join(root, 'assets/logo-galilea-dark.webp')));
assert.ok(fs.existsSync(path.join(root, 'assets/logo-galilea-icon-192.png')));
assert.match(index, /function leaderPhotoSources\(value\)/);
assert.match(index, /data-avatar-fallback/);
assert.match(index, /\/api\/media\?id=/);
assert.match(index, /GALILEA-ANNOUNCEMENT-PRESENTER-24-0-0/);
assert.match(index, /data-present-announcements/);
assert.match(index, /function openAnnouncementPresentation\(category\)/);
assert.match(index, /GALILEA-SCHEDULE-PRESENTER-PREMIUM-27-0-0/);
assert.match(index, /data-present-schedule-summary/);
assert.match(index, /function scheduleSummarySlides\(\)/);
assert.match(index, /function openScheduleSummaryPresentation\(\)/);
assert.match(index, /view\.type==='schedule'/);
assert.match(index, /presentation-schedule-grid/);
assert.match(index, /presentation-schedule-heading/);
assert.match(index, /JENIS IBADAH/);
assert.match(index, /GALILEA-SCHEDULE-BULLETIN-TEMPLATE-28-0-0/);
assert.match(index, /presentation-schedule-sidebar/);
assert.match(index, /presentation-schedule-board/);
assert.match(index, /Susunan Petugas/);
assert.match(index, /function announcementCategory\(item\)/);
assert.match(index, /RABU MALAM/);
assert.match(index, /IBADAH KHOTBAH/);
assert.match(index, /SEKOLAH SABAT/);
assert.match(index, /Pemuda Advent \(PA\)/);
assert.match(index, /announcement-summary/);
assert.match(index, /GALILEA-WORSHIP-OPERATIONS-29-0-0/);
assert.match(index, /GALILEA-PRESENTER-MEDIA-30-0-0/);
assert.match(index, /presentation-art is-bible/);
assert.match(index, /presentation-art is-song/);
assert.match(index, /Website Resmi/);
assert.match(index, /presentation-theme-label/);
assert.match(index, /media-player-fallback/);
assert.match(index, /https:\/\/www\.youtube\.com\/embed\//);
assert.match(index, /@media\(max-width:1180px\)/);
assert.match(index, /@media\(max-width:820px\)/);
assert.match(index, /@media\(max-width:380px\)/);
assert.match(index, /env\(safe-area-inset-bottom\)/);
assert.match(index, /data-presentation-type="schedule"/);
assert.match(index, /\.presentation-stage\{max-width:100%;padding-right:0;overscroll-behavior:contain\}/);
assert.match(index, /\.presentation-controls\{left:max\(8px,env\(safe-area-inset-left\)\)/);
assert.match(index, /function openWorshipOperator\(\)/);
assert.match(index, /async function prepareWorshipOffline\(\)/);
assert.match(index, /function openScreenCheck\(\)/);
assert.match(index, /data-start-worship-operator/);
assert.match(index, /data-open-screen-check/);
assert.match(index, /data-prepare-worship-offline/);
assert.match(index, /v2900-worship-offline-/);
assert.match(index, /v3400-awr-video/);
assert.match(index, /v3400-sabbath-discussion/);
assert.match(index, /function renderAwrHomeMedia\(media\)/);
assert.match(index, /function renderSabbathDiscussionMedia\(media\)/);
assert.match(index, /\.slice\(0,3\)/);
assert.match(index, /SATU VIDEO TERBARU/);
assert.match(index, /data-present-bible/);
assert.match(index, /data-present-song/);
assert.match(index, /book-picker-trigger/);
assert.match(index, /Pilih Lagu Tema atau Lagu Sion/);
assert.doesNotMatch(index, /footer-updated'\)\.textContent = 'V/);

const allScriptBlocks = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
const scriptBlocks = allScriptBlocks.filter(match => !/type=["']application\/ld\+json["']/i.test(match[0])).map(match => match[1]);
assert.ok(scriptBlocks.length > 0, 'Tidak ditemukan blok JavaScript pada index.html.');
for (const [position, source] of scriptBlocks.entries()) {
  new vm.Script(source, {filename: `index-inline-${position + 1}.js`});
}
const structuredData = allScriptBlocks.find(match => /type=["']application\/ld\+json["']/i.test(match[0]));
assert.ok(structuredData, 'Data terstruktur SEO belum tersedia.');
assert.equal(JSON.parse(structuredData[1])['@graph'][0]['@type'], 'Church');

const proxy = read('api/gas.js');
const youtubeProxy = read('api/media.js');
const thumbnailProxy = read('api/thumbnail.js');
const quarterlyPdf = read('api/quarterly-pdf.js');
const weeklyPdf = read('api/weekly-bulletin.js');
const bridge = read('apps-script-backend/VercelApi.gs');
const website = read('apps-script-backend/Website.gs');
const admin = read('apps-script-backend/Admin.gs');
const adminHtml = read('apps-script-backend/Admins.html');
new vm.Script(bridge, {filename: 'VercelApi.gs'});
new vm.Script(website, {filename: 'Website.gs'});
new vm.Script(admin, {filename: 'Admin.gs'});
assert.match(website, /daily-reading-v16/);
assert.match(website, /const day = exactDay;/);
assert.doesNotMatch(website, /const day = exactDay \|\| pastDays/);
assert.match(website, /gwActivityPhotos_/);
assert.match(admin, /Foto Berita/);
assert.match(admin, /Susunan Ibadah/);
assert.match(admin, /Agenda dan Pengumuman/);
assert.match(admin, /Ayat 1/);
assert.match(admin, /Masukkan ke Warta/);
assert.match(admin, /Kategori Tampilan/);
assert.match(admin, /'RABU MALAM', 'IBADAH KHOTBAH', 'SEKOLAH SABAT', 'PEMUDA ADVENT', 'UMUM'/);
assert.match(website, /kategori tampilan/);
assert.match(website, /category: category/);
assert.match(admin, /TIM_PELAYANAN/);
assert.match(admin, /function adminGetDashboardSummary\(\)/);
assert.match(admin, /scheduleSheet: 'Sedang diperiksa…'/);
assert.match(adminHtml, /adminGetBootstrap',\[\],30000/);
assert.match(adminHtml, /loadDashboardSummary\(false\)/);
assert.match(adminHtml, /data-delete-approval/);
assert.match(adminHtml, /data-delete-service/);
assert.match(index, /state\.async\.featuredResource/);
assert.match(index, /loaded&&String\(loaded\.resourceType/);
assert.match(index, /--presentation-bg-schedule/);
assert.match(website, /presentation_schedule_background_url/);
assert.match(proxy, /public, s-maxage=900, stale-while-revalidate=1800/);
assert.match(adminHtml, /multiple accept="image\/png/);
assert.match(adminHtml, /GALILEA-ADMIN-BOOTSTRAP-35-8-0/);
assert.match(adminHtml, /logo-galilea-light\.webp/);
assert.match(adminHtml, /logo-galilea-dark\.webp/);
assert.doesNotMatch(adminHtml, /adventist_logo\.png/);
assert.match(adminHtml, /name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,viewport-fit=cover"/);
assert.match(adminHtml, /responsive admin lock: iPhone, Android, tablet, dan desktop/);
assert.match(adminHtml, /data-preview-editor/);
assert.match(adminHtml, /data-duplicate-schedule/);
assert.match(adminHtml, /function duplicateSchedule\(id\)/);
assert.match(adminHtml, /editor-projector/);
assert.match(adminHtml, /Menunggu Tinjauan/);
assert.match(website, /gwReadWorshipPlans_/);
assert.match(website, /awr-borneo-youtube-v13-unique/);
assert.match(website, /sabbath-discussion-youtube-v13-single/);
assert.match(index, /function scheduleWorshipFallback\(\)/);
assert.match(index, /Bagian yang belum diterbitkan tidak diisi dengan perkiraan/);
assert.match(index, /record\.timestamp\|\|\(record\.isoDate\+'T'\+record\.time\+'\:00\+08\:00'\)/);
assert.match(website, /gwReadThemeSong_/);
assert.match(website, /gwEnsureV200ContentSchemas_/);
assert.match(website, /item\.dateValue < today/);
const adminScripts = [...adminHtml.replace(/<\?!=\s*JSON\.stringify\(appUrl\s*\|\|\s*''\)\s*\?>/g, "''").matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert.ok(adminScripts.length > 0, 'Tidak ditemukan blok JavaScript pada Admins.html.');
for (const [position, source] of adminScripts.entries()) {
  new vm.Script(source, {filename: `admin-inline-${position + 1}.js`});
}
assert.match(website, /CACHE_SECONDS:\s*60/);
assert.doesNotMatch(quarterlyPdf, /WEBSITE GALILEA\) Tj|Diunduh melalui Website Gereja Galilea/);
assert.match(quarterlyPdf, /JADWAL PELAYANAN JEMAAT/);
const calls = [...index.matchAll(/server\('([^']+)'/g)].map(match => match[1]);
assert.ok(calls.length >= 20, 'Jumlah integrasi viewer lebih sedikit dari yang diharapkan.');
// These Bible methods are deliberately terminated in api/gas.js. The Vercel
// proxy reads the single Bible source directly, so they must not be forwarded
// to Apps Script and do not need handlers in apps-script-backend/VercelApi.gs.
// Keep this list explicit: a newly added viewer method must still be present
// in the Apps Script bridge unless it is intentionally added here.
const VERCEL_ONLY_BIBLE_METHODS = new Set([
  'getBibleBook',
  'getBibleBooks',
  'getBibleChapter',
  'searchBible'
]);
for (const method of new Set(calls)) {
  assert.ok(proxy.includes(`'${method}'`), `Method ${method} belum diizinkan oleh proxy Vercel.`);
  if (!VERCEL_ONLY_BIBLE_METHODS.has(method)) {
    assert.ok(bridge.includes(`${method}: function`), `Method ${method} belum tersedia pada bridge Apps Script.`);
  }
}

const vercel = JSON.parse(read('vercel.json'));
assert.equal(vercel.rewrites[0].source, '/admin');
assert.equal(vercel.rewrites[0].destination, '/api/admin');
assert.deepEqual(vercel.regions, ['sin1']);
assert.ok(vercel.headers.some(item => item.source === '/api/og'));
assert.ok(vercel.headers.some(item => item.source === '/robots.txt'));
assert.ok(vercel.headers.some(item => item.source === '/sitemap.xml'));

assert.match(robots, /Allow: \//);
assert.match(robots, /Disallow: \/admin/);
assert.match(robots, /Sitemap: https:\/\/gmahk-galilea\.vercel\.app\/sitemap\.xml/);
assert.match(sitemap, /<loc>https:\/\/gmahk-galilea\.vercel\.app\/<\/loc>/);
assert.match(sitemap, /<lastmod>2026-09-01<\/lastmod>/);

const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.start_url, '/#home');
assert.equal(manifest.lang, 'id');

const envExample = read('.env.example');
for (const key of ['GALILEA_APPS_SCRIPT_API_URL', 'GALILEA_APPS_SCRIPT_ADMIN_URL', 'GALILEA_API_SECRET']) {
  assert.match(envExample, new RegExp(`^${key}=`, 'm'));
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
    redirect(code, value) { this.statusCode = code; this.body = value; return this; }
  };
}

const {default: gasHandler} = await import('../api/gas.js');
let response = mockResponse();
await gasHandler({method: 'GET', headers: {}}, response);
assert.equal(response.statusCode, 200);
assert.equal(response.body.ok, true);

process.env.GALILEA_APPS_SCRIPT_API_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';
process.env.GALILEA_API_SECRET = '12345678901234567890123456789012';
response = mockResponse();
await gasHandler({method: 'POST', headers: {}, body: {method: 'fungsiBerbahaya', args: []}}, response);
assert.equal(response.statusCode, 403);

const nativeFetch = globalThis.fetch;
let forwarded = null;
globalThis.fetch = async (url, options) => {
  forwarded = {url, body: JSON.parse(options.body)};
  return {
    ok: true,
    status: 200,
    async text() { return JSON.stringify({ok: true, data: {title: 'Galilea'}}); }
  };
};
response = mockResponse();
await gasHandler({method: 'POST', headers: {}, body: {method: 'getWebsiteData', args: []}}, response);
globalThis.fetch = nativeFetch;
assert.equal(response.statusCode, 200);
assert.equal(response.body.data.title, 'Galilea');
assert.equal(forwarded.body.method, 'getWebsiteData');
assert.equal(forwarded.body.secret, process.env.GALILEA_API_SECRET);

const {default: adminHandler} = await import('../api/admin.js');
delete process.env.GALILEA_APPS_SCRIPT_ADMIN_URL;
response = mockResponse();
adminHandler({method: 'GET', query: {open: '1'}}, response);
assert.equal(response.statusCode, 503);
assert.match(response.body, /URL Apps Script admin belum siap/);

process.env.GALILEA_APPS_SCRIPT_ADMIN_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';
response = mockResponse();
adminHandler({method: 'GET', query: {open: '1'}}, response);
assert.equal(response.statusCode, 307);
assert.match(response.body, /page=admin/);

const {default: quarterlyHandler} = await import('../api/quarterly-pdf.js');
globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  async text() {
    return JSON.stringify({ok: true, data: {
      periodLabel: 'TRIWULAN III · JULI - SEPTEMBER 2026',
      updatedAt: 'Senin, 24 Agustus 2026 · 14.15 WITA',
      sections: [{title: 'Kebaktian Khotbah', records: [{
        dateLabel: 'Sabat, 29 Agustus 2026', time: '09:00',
        fields: [{label: 'Pengkhotbah', value: 'Bpk. G. Sinurat'}, {label: 'Lagu Pujian', value: 'UKSS Eklesia'}]
      }]}]
    }});
  }
});
response = mockResponse();
await quarterlyHandler({method: 'GET'}, response);
globalThis.fetch = nativeFetch;
assert.equal(response.statusCode, 200);
assert.ok(Buffer.isBuffer(response.body));
assert.equal(response.body.subarray(0, 4).toString(), '%PDF');
assert.match(response.headers['Content-Disposition'], /Jadwal-Ibadah-Galilea/);
const {buildPdf:buildWeeklyPdf} = await import('../api/weekly-bulletin.js');
const weeklyBuffer=buildWeeklyPdf({updatedAt:'Uji',nextSabbath:{title:'Ibadah Sabat',dateLabel:'Sabat',time:'09.00',fields:[]},announcements:[],activities:[]});
assert.ok(Buffer.isBuffer(weeklyBuffer));
assert.equal(weeklyBuffer.subarray(0,4).toString(),'%PDF');
assert.match(weeklyPdf,/GALILEA-WEEKLY-BULLETIN-20\.0\.0/);
assert.match(weeklyPdf,/AGENDA DAN PENGUMUMAN/);
assert.doesNotMatch(weeklyPdf,/KEGIATAN MENDATANG/);
assert.match(youtubeProxy, /youtube\.com\/feeds\/videos\.xml/);
assert.match(youtubeProxy, /uniqueByTitle\(videos, 3\)/);
assert.match(thumbnailProxy, /i\.ytimg\.com\/vi/);
assert.match(thumbnailProxy, /stale-while-revalidate=604800/);

const {default: mediaHandler} = await import('../api/thumbnail.js');
response = mockResponse();
await mediaHandler({method:'GET',query:{id:'bad'}},response);
assert.equal(response.statusCode,400);

globalThis.fetch = async () => ({
  ok:true,
  status:200,
  headers:new Headers({'content-type':'image/png','content-length':'1000'}),
  async arrayBuffer(){const bytes=new Uint8Array(1000);bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);return bytes.buffer;}
});
response = mockResponse();
await mediaHandler({method:'GET',query:{id:'abcdefghijk'}},response);
globalThis.fetch = nativeFetch;
assert.equal(response.statusCode,200);
assert.equal(response.headers['Content-Type'],'image/png');
assert.ok(Buffer.isBuffer(response.body));
if (process.env.WRITE_SAMPLE_PDF === '1') fs.writeFileSync('/tmp/galilea-quarterly-sample.pdf', response.body);

console.log(`OK · ${new Set(calls).size} fungsi viewer terhubung ke proxy dan bridge Apps Script.`);
console.log('OK · index.html bebas template Apps Script dan JavaScript berhasil diparse.');
console.log('OK · konfigurasi Vercel, admin route, manifest, dan environment variables lengkap.');
console.log('OK · proxy menolak fungsi di luar allowlist dan /admin diarahkan ke deployment terpisah.');
console.log('OK · PDF triwulan spreadsheet tanpa watermark dan metadata Open Graph WhatsApp tersedia.');
