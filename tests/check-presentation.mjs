import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://gmahk-galilea.vercel.app'});
const {document}=dom.window;
const $=selector=>document.querySelector(selector);
// The title panel follows the toolbar, so negative margins would cover its buttons.
const readerHero=document.createElement('header');
readerHero.className='song-reader-hero';
$('#reader-body').append(readerHero);
assert.equal(dom.window.getComputedStyle(readerHero).marginTop,'0px');
assert.equal(dom.window.getComputedStyle(readerHero).marginLeft,'0px');
readerHero.remove();
const state={presentation:null,hymnalReader:null,bibleReader:null};
const renderStart=html.indexOf('      function render() {');
assert.match(html.slice(renderStart,renderStart+240),/if\(!state\.data\)return;/,'Navigation must not render before bootstrap');
assert.match(html,/if\(state\.data\)syncSeoMetadata\(next,state\.data\.site\);/);
assert.match(html,/server\('getWebsiteData',\[\],60000\)/,'Initial load waits for the existing 55-second backend timeout');
let reduced=false,timerDelay=0;
const context=vm.createContext({
  document,state,$,console,
  window:{clearTimeout(){},setTimeout(fn,delay){timerDelay=delay;return 1;}},
  matchMedia:()=>({matches:reduced}),
  safeStorage:{get:()=> '0'},
  storedPresentationScale:()=>1,storedPresentationTheme:()=> 'dark',
  toast:message=>{throw new Error(message);},
  esc:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),
  launchPresentation:view=>{state.presentation=view;},
  setPresentationOrnament:kind=>{$('#presentation-shell').dataset.presentationKind=kind;},
  setPresentationNavigationLabels:()=>{},finishPresentationRender:()=>{},
  presentationTransitionTimer:0
});
vm.runInContext(html.slice(renderStart,html.indexOf('\n      function ',renderStart+1)),context);
const initialMarkup=$('#app').innerHTML;
assert.doesNotThrow(()=>context.render(),'Rendering before bootstrap must be safe');
assert.equal($('#app').innerHTML,initialMarkup,'Keep the loading/error message visible');
// Execute the actual production functions, without starting unrelated site/network code.
for(const name of ['clampPresentationScale','songPresentationSlides','songPresentationMarkup','normalizeOperatorSongSlides','openPresentation','renderPresentation','movePresentation','animatePresentationTransition','fitPresentationText']){
  const start=html.indexOf('      function '+name+'(');
  assert.ok(start>=0,name+' exists');
  const end=html.indexOf('\n      function ',start+1);
  vm.runInContext(html.slice(start,end),context);
}
const song={number:1,title:'Lagu pengujian',lyrics:[
  {type:'verse',index:1,lines:['Ayat satu','Tetap utuh']},
  {type:'verse',index:2,lines:['Ayat dua']},
  {type:'chorus',lines:['Reff bersama','<b>Bukan markup</b>']}
]};
const original=JSON.stringify(song);
for(const isTheme of [false,true]){
  state.hymnalReader={song:{...song,isTheme},isTheme,verseIndex:0};
  context.openPresentation('song');context.renderPresentation();
  assert.equal($('#presentation-counter').textContent,'1 / 4');
  assert.equal($('#presentation-stage .presentation-verse-label').textContent,'AYAT 1');
  const lyric=$('#presentation-stage .presentation-copy');
  assert.equal(lyric.textContent,'Ayat satu Tetap utuh','Source lines flow into one paragraph');
  assert.equal(lyric.querySelector('br'),null,'No forced line break in lyrics');
  assert.equal(dom.window.getComputedStyle(lyric).textAlign,'left');
  assert.equal(dom.window.getComputedStyle(lyric).textWrap,'wrap','Fill available width rather than balancing lines');
  assert.ok(!$('#presentation-stage').textContent.includes('Reff bersama'));
  assert.ok($('[data-presentation-prev]').disabled);
  context.movePresentation(1);
  assert.equal($('#presentation-stage .presentation-verse-label').textContent,'REFF / KOOR');
  assert.equal(state.hymnalReader.verseIndex,0);
  assert.equal($('#presentation-stage b'),null,'Lyrics must be escaped');
  assert.equal($('#presentation-stage .presentation-copy').textContent,'Reff bersama <b>Bukan markup</b>');
  context.movePresentation(1);
  assert.equal($('#presentation-stage .presentation-verse-label').textContent,'AYAT 2');
  assert.equal(state.hymnalReader.verseIndex,1);
  context.movePresentation(1);
  assert.equal($('#presentation-stage .presentation-verse-label').textContent,'REFF / KOOR');
  assert.ok($('[data-presentation-next]').disabled);
  context.movePresentation(1);assert.equal(state.presentation.index,3);
  context.movePresentation(-1);assert.equal(state.presentation.index,2);
  context.openPresentation('song');assert.equal(state.presentation.index,2,'Reopening maps verse to slide');
  assert.equal($('#presentation-title').textContent,song.title);
}
assert.equal(JSON.stringify(song),original,'Source song is never modified');
const interleaved={lyrics:[song.lyrics[0],song.lyrics[2],song.lyrics[1],{type:'refrain',lines:['Reff kedua']} ]};
const ordered=context.songPresentationSlides(interleaved);
assert.equal(ordered.length,4,'Already-interleaved refrains must not be multiplied');
assert.equal(ordered[1].lines[0],'Reff bersama');
assert.equal(ordered[3].lines[0],'Reff kedua','Preserve verse-specific refrain');
assert.equal(context.songPresentationSlides({lyrics:song.lyrics.slice(0,2)}).length,2);
assert.equal(context.songPresentationSlides({lyrics:[song.lyrics[2]]}).length,1);
assert.equal(context.songPresentationSlides({lyrics:[]}).length,0);
assert.equal(context.songPresentationSlides({lyrics:[{type:'verse',lines:[]},null]}).length,0);
for(const type of ['chorus','refrain','reff','koor']){
  assert.equal(context.songPresentationSlides({lyrics:[song.lyrics[0],{...song.lyrics[2],type}]}).length,2);
}
const old=[{kind:'overview'},{kind:'song',verseLabel:'AYAT 1',lines:['Ayat'],chorus:['Reff']}];
const migrated=context.normalizeOperatorSongSlides(old);
assert.equal(migrated.length,3);
assert.equal(migrated[2].verseLabel,'REFF / KOOR');
assert.equal(context.normalizeOperatorSongSlides(migrated).length,3,'Offline migration is idempotent');
assert.equal(old[1].chorus.length,1);
state.presentation={type:'operator',index:2,item:migrated,scale:1};
context.renderPresentation();assert.equal($('#presentation-stage .presentation-copy').textContent,'Reff');

state.bibleReader={book:'Yohanes',chapter:3,index:0,verses:[{number:16,text:'Ayat pertama'},{number:17,text:'Ayat berikutnya'}]};
context.openPresentation('bible');context.renderPresentation();context.movePresentation(1);
assert.equal($('#presentation-title').textContent,'Yohanes 3:17');
assert.equal($('#presentation-stage .presentation-copy').textContent,'Ayat berikutnya');
assert.equal(state.bibleReader.index,1);
assert.equal(timerDelay,400,'Transition cleanup runs after 360ms animation ends');
assert.ok($('#presentation-shell').classList.contains('presentation-enter-next'));
context.movePresentation(-1);assert.equal(state.bibleReader.index,0);
assert.ok($('#presentation-shell').classList.contains('presentation-enter-prev'));
for(const mode of ['system','site']){
  $('#presentation-shell').classList.remove('presentation-enter-next','presentation-enter-prev');
  reduced=mode==='system';document.documentElement.dataset.motion=mode==='site'?'reduced':'';
  context.animatePresentationTransition(1);
  assert.ok(!$('#presentation-shell').classList.contains('presentation-enter-next'));
}

// Simulate layout dimensions to test both width/height bounds and growth on larger screens.
const stage=$('#presentation-stage'),shell=$('#presentation-shell');
$('#presentation-dialog').setAttribute('open','');shell.dataset.presentationKind='song';
state.presentation={type:'song',scale:1};
let width=800,height=400;
const scale=()=>Number(shell.style.getPropertyValue('--present-scale'));
Object.defineProperties(stage,{
  clientHeight:{get:()=>height},clientWidth:{get:()=>width},
  scrollHeight:{get:()=>Math.max(height,scale()*1000+50)},
  scrollWidth:{get:()=>Math.max(width,scale()*1800)}
});
context.fitPresentationText();
assert.ok(stage.scrollHeight<=height+1&&stage.scrollWidth<=width+1);
assert.ok(state.presentation.fittedScale<.82,'Long lyrics fit below former hard limit');
const small=state.presentation.fittedScale;width=1920;height=1000;
context.fitPresentationText();assert.ok(state.presentation.fittedScale>small);
assert.ok(stage.scrollHeight<=height+1&&stage.scrollWidth<=width+1);
assert.ok(!stage.classList.contains('is-fitting'));
dom.window.close();
console.log('Presentation verified: verse/reff ordering, theme songs, navigation, operator/offline, Bible, reduced motion and fitting.');
