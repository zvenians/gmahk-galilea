import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const cacheSource=html.slice(html.indexOf('      const WORSHIP_CACHE_TTL'),html.indexOf('      const VIEWER_LANGUAGES'));
const sourceFunction=name=>{
  const start=html.search(new RegExp('      (?:async )?function '+name+'\\('));
  assert.ok(start>=0,name);
  const tail=html.slice(start+1),next=tail.search(/\n      (?:async )?function /);
  return html.slice(start,start+1+next);
};
const pack=Array.from({length:525},(_,i)=>({number:i+1,index:String(i+1).padStart(3,'0'),title:' Lagu  '+(i+1),lyrics:[{type:'verse',index:1,lines:['  Baris   satu ','-']},{type:'refrain',index:1,lines:['Reff']}]}));
let clock=2000000000000;
class Clock extends Date { static now(){return clock;} }
function runtime(storage=new Map(),options={}) {
  const requests=[];
  const localStorage={getItem:key=>storage.get(key)??null,setItem(key,value){if(options.quota)throw new Error('QuotaExceededError');storage.set(key,value);},removeItem:key=>storage.delete(key)};
  const nodes=new Map(['#reader-title','#reader-body','#reader-dialog','#app'].map(key=>[key,{textContent:'',innerHTML:'',open:false,showModal(){this.open=true;}}]));
  const context=vm.createContext({
    Date:Clock,console,AbortController,Promise,Map,Set,JSON,Number,Error,
    window:{localStorage,setTimeout,clearTimeout},navigator:{onLine:true},
    safeStorage:{get:(key,fallback)=>localStorage.getItem(key)??fallback,set:(key,value)=>{try{localStorage.setItem(key,value);}catch{}},remove:localStorage.removeItem},
    fetch:async url=>{requests.push(url);if(options.fetch)return options.fetch(url);return {ok:true,json:async()=>pack};},
    server:async(name,args)=>{requests.push(name);if(options.server)return options.server(name,args);throw new Error('API should not be needed');},
    $:selector=>nodes.get(selector),$$:()=>[],esc:String,
    state:{data:{themeSong:{title:'Tema',lyrics:[]}},language:'id'},
    loadingBox:()=> 'loading',errorBox:message=>message,
    renderSongReader(){context.rendered=context.state.hymnalReader.song.number||'theme';},toast(){},
  });
  vm.runInContext(cacheSource,context);
  for(const name of ['openReader','openSong','openThemeSong'])vm.runInContext(sourceFunction(name),context);
  return {context,requests,storage,nodes};
}

// Full pack is downloaded once, persisted, and every song is immediately usable.
const first=runtime();
await Promise.all([first.context.ensureHymnalPack(),first.context.ensureHymnalPack()]);
assert.equal(first.requests.length,1,'Coalesce simultaneous pack requests');
assert.match(first.context.hymnCacheStatusHtml(),/tersimpan di perangkat/);
assert.equal(JSON.parse(first.storage.get('galilea:hymnal-pack-v1')).ttl,10800000);
for(let number=1;number<=525;number++)assert.equal((await first.context.getViewerHymnalSong(number)).number,number);
assert.equal(first.requests.length,1,'No per-song API requests once pack is ready');
const normalized=await first.context.getViewerHymnalSong(1);
assert.equal(normalized.title,'Lagu 1');assert.equal(normalized.lyrics[0].lines[0],'Baris satu');assert.equal(normalized.lyrics[0].lines[1],'—');
assert.equal((await first.context.getViewerHymnalCatalog()).count,525);
await first.context.openSong(525);assert.equal(first.context.rendered,525);
assert.notEqual(first.nodes.get('#reader-body').innerHTML,'loading','Cached song does not flash a loader');

// New JS runtime simulates reload: same persisted storage, no previous memory.
clock+=3*3600000-1;
const reloaded=runtime(first.storage);
await reloaded.context.ensureHymnalPack();
await reloaded.context.openSong(2);
assert.equal(reloaded.context.rendered,2);
assert.equal(reloaded.requests.length,0,'Reload within three hours must not download again');
clock+=2;
let finishRefresh;
const stale=runtime(first.storage,{fetch:()=>new Promise(resolve=>{finishRefresh=resolve;})});
const refresh=stale.context.ensureHymnalPack();
assert.equal((await stale.context.getViewerHymnalSong(3)).number,3,'Expired pack remains usable during refresh');
finishRefresh({ok:false});await refresh;
assert.match(stale.context.hymnCacheStatusHtml(),/Pembaruan tertunda/);

const rejected=runtime(new Map(),{fetch:async()=>({ok:true,json:async()=>pack.slice(0,524)})});
await assert.rejects(rejected.context.ensureHymnalPack());
assert.equal(rejected.storage.size,0,'Incomplete download must never be saved');
assert.match(rejected.context.hymnCacheStatusHtml(),/belum tersimpan/);
const quota=runtime(new Map(),{quota:true});
await quota.context.ensureHymnalPack();
assert.match(quota.context.hymnCacheStatusHtml(),/Penyimpanan browser tidak tersedia/);
assert.equal((await quota.context.getViewerHymnalSong(9)).number,9,'Memory fallback still works');

// Existing public-data cache migrates to >=3 hours, deduplicates, and serves stale offline.
const resource=runtime();let loads=0;
resource.context.cacheSet('v1800-bootstrap',{site:{name:'Galilea'},themeSong:{title:'Tema'}},60000);
clock+=2*3600000;
assert.equal(resource.context.cacheGet('v1800-bootstrap').site.name,'Galilea');
await Promise.all([1,2].map(()=>resource.context.cachedResource('example',async()=>{loads++;return {ok:true};},60000)));
assert.equal(loads,1);
resource.context.cacheSet('awr-live',{isLive:true},60000);
clock+=60001;assert.equal(resource.context.cacheGet('awr-live'),null,'Live data retains its short TTL');
clock+=3*3600000;
resource.context.navigator.onLine=false;
assert.equal((await resource.context.cachedResource('example',()=>{throw new Error('offline network call');},60000)).ok,true);
resource.context.navigator.onLine=true;
assert.equal((await resource.context.cachedResource('example',async()=>{throw new Error('network failed');},60000)).ok,true);

// Execute production boot with a fresh bootstrap; no request or second render.
const boot=runtime(first.storage);let renders=0;
boot.context.cacheSet('v1800-bootstrap',{site:{name:'Galilea'}},10800000);
Object.assign(boot.context,{
  startWebsiteSync(){},initPreferences(){},buildMobileNav(){},readStoredList:()=>[],startDayRolloverWatcher(){},witaDateKey:()=> '2026-10-05',
  VIEWER_LANGUAGES:['id'],ROUTES:['home','hymnal'],location:{hash:'#home'},history:{replaceState(){}},
  setShellData(){},render(){renders++;},releaseStartupLoader(){},setLanguage(){},updateNetworkStatus(){},clearTimeout(){},startupGuard:0,
  MutationObserver:class {observe(){}},document:{body:{},querySelector:()=>null},
});
vm.runInContext(sourceFunction('boot'),boot.context);
await boot.context.boot();
assert.ok(!boot.requests.includes('getWebsiteData'),'Fresh bootstrap must skip the API entirely');
assert.equal(renders,1);

// Slow song A must not overwrite song B, the theme, or another reader.
const race=runtime();let finishA,finishB;
race.context.getViewerHymnalSong=number=>new Promise(resolve=>{if(number===1)finishA=resolve;else finishB=resolve;});
const a=race.context.openSong(1),b=race.context.openSong(2);
finishB({number:2});await b;finishA({number:1});await a;
assert.equal(race.context.rendered,2);
const a2=race.context.openSong(1);race.context.openThemeSong();finishA({number:1});await a2;
assert.equal(race.context.rendered,'theme');
const a3=race.context.openSong(1);race.context.openReader('Alkitab','Ayat');finishA({number:1});await a3;
assert.equal(race.nodes.get('#reader-body').innerHTML,'Ayat');

console.log('Worship cache verified: all 525 songs, reload <3h without requests, expiry/offline, deduplication, invalid pack, quota, bootstrap and selection races.');
