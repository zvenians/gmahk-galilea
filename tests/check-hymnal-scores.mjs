import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const source = fs.readFileSync(new URL('../hymnal-scores.js', import.meta.url), 'utf8');
const html = '<div id="root"><select id="scores-select"></select><input id="scores-search"><button id="scores-random">Acak</button><span id="scores-count"></span><p id="scores-status"></p><p id="scores-results"></p><div id="scores-list"></div><div id="scores-reader"></div></div>';
const records = new Map();
let failWrites = false;
const indexedDB = {open() {
  const request = {};
  queueMicrotask(() => {
    request.result = {close(){}, transaction(name, mode) {
      const tx = {objectStore: () => ({
        get(number) { const result = {}; queueMicrotask(() => { result.result = records.get(number); result.onsuccess(); }); return result; },
        put(entry) { queueMicrotask(() => { if (failWrites) {tx.error=new Error('quota');tx.onabort();} else {records.set(entry.number,entry);tx.oncomplete();} }); },
        delete(number) {queueMicrotask(()=>{records.delete(number);tx.oncomplete();});}
      })};
      return tx;
    }};
    request.onsuccess();
  });
  return request;
}};
const catalog = {songs:[{number:1,title:'Di Hadapan Hadirat-Mu'},{number:2,title:'Hai Segnap Ciptaan Tuhan'}]};
const song = number => ({number:Number(number),title:catalog.songs.find(item=>item.number===Number(number)).title,lyrics:[{type:'verse',index:1,lines:['Baris pertama','<img src=x onerror=alert(1)>']},{type:'chorus',index:1,lines:['Reff lagu']}]});
function setup(provider = async number => song(number)) {
  const dom = new JSDOM(html,{url:'https://galilea.test/',runScripts:'outside-only'});
  const {window}=dom;
  Object.defineProperty(window,'indexedDB',{value:indexedDB});
  const revoked=[];
  window.URL.createObjectURL=()=> 'blob:https://galilea.test/'+Math.random();
  window.URL.revokeObjectURL=url=>revoked.push(url);
  window.eval(source);
  const root=window.document.querySelector('#root');
  const opened=[];
  const ready=window.GalileaHymnalScores.mount({root,catalog,getSong:provider,openLyrics:number=>opened.push(number),icon:()=>''});
  return {dom,window,root,ready,opened,revoked};
}
const flush = async () => {for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
function select(view,number){const input=view.root.querySelector('#scores-select');input.value=String(number);input.dispatchEvent(new view.window.Event('change',{bubbles:true}));}
function attach(view,file){const input=view.root.querySelector('#scores-file');Object.defineProperty(input,'files',{value:[file],configurable:true});input.dispatchEvent(new view.window.Event('change',{bubbles:true}));}
const view=setup();await view.ready;
assert.equal(view.root.querySelector('#scores-count').textContent,'2 lagu');
const search=view.root.querySelector('#scores-search');search.value='ciptaan';search.dispatchEvent(new view.window.Event('input',{bubbles:true}));
assert.equal(view.root.querySelectorAll('[data-score-song]').length,1);
assert.equal(view.root.querySelector('[data-score-song]').dataset.scoreSong,'2');
search.value='absent';search.dispatchEvent(new view.window.Event('input',{bubbles:true}));assert.match(view.root.textContent,/Lagu tidak ditemukan/);
select(view,1);await flush();
assert.match(view.root.textContent,/Partitur belum ditambahkan/);
assert.equal(view.root.querySelector('.scores-lyrics img'),null,'Lyrics cannot inject markup');
const pdf=new File(['%PDF-1.4\nPDF test fixture'], 'uji.pdf',{type:'application/pdf'});
attach(view,pdf);await flush();
assert.ok(view.root.querySelector('iframe').src.startsWith('blob:'));
assert.match(view.root.textContent,/Tersimpan di browser ini/);
assert.equal(records.get('1').name,'uji.pdf');
view.root.querySelector('.scores-pdf-stage').requestFullscreen=async()=>{throw new Error('not granted');};
view.root.querySelector('[data-score-fullscreen]').click();await flush();
assert.ok(view.root.querySelector('.is-expanded'),'Fullscreen rejection falls back to viewport display');
view.window.document.dispatchEvent(new view.window.KeyboardEvent('keydown',{key:'Escape'}));
assert.equal(view.root.querySelector('.is-expanded'),null,'Escape closes fallback fullscreen');
assert.equal(view.window.document.body.classList.contains('scores-pdf-expanded'),false);
view.root.querySelector('[data-score-lyrics]').click();assert.deepEqual(view.opened,[1]);
attach(view,new File(['not a PDF'],'wrong.pdf'));await flush();
assert.match(view.root.querySelector('#scores-status').textContent,/File bukan PDF/);
assert.equal(records.get('1').name,'uji.pdf','Invalid import cannot replace saved PDF');
view.root.querySelector('[data-score-remove]').click();await flush();
assert.equal(records.has('1'),false,'Removing attachment deletes only this song record');
assert.equal(view.root.querySelector('iframe'),null);
attach(view,pdf);await flush();
select(view,2);await flush();assert.equal(view.root.querySelector('iframe'),null,'Scores remain isolated by song number');
assert.ok(view.revoked.length>0,'Switching songs releases prior PDF URL');
failWrites=true;attach(view,pdf);await flush();assert.match(view.root.textContent,/hanya tersedia selama tab ini terbuka/);failWrites=false;
view.window.GalileaHymnalScores.destroy();view.dom.window.close();
const reload=setup();await reload.ready;select(reload,1);await flush();assert.ok(reload.root.querySelector('iframe'),'Saved score survives module reload');
reload.window.GalileaHymnalScores.destroy();reload.dom.window.close();
let firstResolve;
const raced=setup(number=>Number(number)===1?new Promise(resolve=>{firstResolve=resolve;}):Promise.resolve(song(number)));
await raced.ready;select(raced,1);select(raced,2);await flush();firstResolve(song(1));await flush();assert.match(raced.root.querySelector('#scores-song-title').textContent,/Ciptaan/,'A slow previous selection cannot replace the newer song');
raced.window.GalileaHymnalScores.destroy();raced.dom.window.close();
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(index, /'hymnal-scores': renderHymnalScores/);
assert.match(index, /state.route === 'hymnal-scores'\) loadHymnalScores/);
assert.match(index,/\['hymnal-scores','file','Lagu Sion \(Partiture\)'/);
assert.match(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/hymnal-scores.js\?v=34-pdf3/);
console.log('Hymnal scores: search, empty states, PDF validation, storage/reload, quota fallback, isolated songs, race cleanup and safe lyrics PASS');
