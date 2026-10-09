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
let reduced=false,timerDelay=0,savedScale=null;
const context=vm.createContext({
  document,state,$,console,
  window:{clearTimeout(){},setTimeout(fn,delay){timerDelay=delay;return 1;}},
  matchMedia:()=>({matches:reduced}),
  safeStorage:{get:()=> '0',set:(key,value)=>{savedScale={key,value};}},
  storedPresentationScale:()=>1,storedPresentationTheme:()=> 'dark',
  toast:message=>{throw new Error(message);},
  esc:value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),
  launchPresentation:view=>{state.presentation=view;},
  setPresentationOrnament:kind=>{$('#presentation-shell').dataset.presentationKind=kind;},
  setPresentationNavigationLabels:()=>{},finishPresentationRender:()=>{},
  showPresentationControls:()=>{},announcePresentation:()=>{},
  presentationTransitionTimer:0
});
vm.runInContext(html.slice(renderStart,html.indexOf('\n      function ',renderStart+1)),context);
const initialMarkup=$('#app').innerHTML;
assert.doesNotThrow(()=>context.render(),'Rendering before bootstrap must be safe');
assert.equal($('#app').innerHTML,initialMarkup,'Keep the loading/error message visible');
// Execute the actual production functions, without starting unrelated site/network code.
for(const name of ['clampPresentationScale','presentationScaleKey','songPresentationSlides','songPresentationMarkup','normalizeOperatorSongSlides','openPresentation','renderPresentation','movePresentation','animatePresentationTransition','fitPresentationText','resizePresentation']){
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
shell.classList.add('is-projector');
assert.equal(parseFloat(dom.window.getComputedStyle($('.presentation-main')).minHeight),0,'Reading frame must not inherit the site main viewport minimum');
assert.equal(dom.window.getComputedStyle($('.presentation-main')).height,'100%','Projector reading area must stay constrained to its frame');
shell.classList.remove('is-projector');
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

// Controls must visibly resize a fitted slide and remain stable after refitting.
// Simulate desktop and letterboxed/mobile copyright positions independently of
// content size, so the safe boundary follows the real footer rather than viewport.
let frameBottom=1000,footerTop=920;
$('#presentation-frame').getBoundingClientRect=()=>({bottom:frameBottom,height:frameBottom});
$('.presentation-footer').getBoundingClientRect=()=>({top:footerTop,height:27});
for(const kind of ['song','bible']){
  shell.dataset.presentationKind=kind;state.presentation={type:kind,scale:1};
  context.fitPresentationText();
  assert.equal(shell.style.getPropertyValue('--presentation-footer-reserve'),'96px');
  const initial=state.presentation.fittedScale;
  context.resizePresentation(-.1);
  const smaller=state.presentation.fittedScale;
  assert.ok(smaller<initial*.95,'A- visibly shrinks even a previously fitted slide');
  context.fitPresentationText();assert.equal(state.presentation.fittedScale,smaller,'Delayed/resize fit must not undo A-');
  context.resizePresentation(.1);assert.ok(Math.abs(state.presentation.fittedScale-initial)<.0001,'A+ restores size');
  assert.equal(savedScale.value,'1.00','User preference is persisted');
  for(let i=0;i<10;i++)context.resizePresentation(.1);
  assert.ok($('[data-presentation-larger]').disabled,'Upper bound disables A+');
  assert.ok(stage.scrollHeight<=height+2&&stage.scrollWidth<=width+2,'Maximum text stays inside safe area within browser rounding');
  assert.ok(Math.abs(state.presentation.fittedScale-state.presentation.maxFittedScale)<.0001);
  context.resizePresentation(-.1);assert.ok(!$('[data-presentation-larger]').disabled);
  state.presentation.scale=.7;context.fitPresentationText();
  assert.ok(!$('[data-presentation-smaller]').disabled,'Previously saved 70% preference must still allow shrinking');
  const oldMinimum=state.presentation.fittedScale;
  context.resizePresentation(-.1);assert.ok(state.presentation.fittedScale<oldMinimum,'A- shrinks below the old 70% limit');
  for(let i=0;i<10;i++)context.resizePresentation(-.1);
  assert.ok($('[data-presentation-smaller]').disabled,'Lower bound disables A-');
  context.resizePresentation(.1);assert.ok(!$('[data-presentation-smaller]').disabled);
  frameBottom=700;footerTop=610;context.fitPresentationText();
  assert.equal(shell.style.getPropertyValue('--presentation-footer-reserve'),'106px','Copyright reserve follows changed frame');
  frameBottom=1000;footerTop=920;
}
const consistentStage=stage.cloneNode(false);stage.replaceWith(consistentStage);
shell.dataset.presentationKind='bible';state.presentation={type:'bible',scale:1};
state.bibleReader={verses:[{number:1,text:'Singkat'},{number:2,text:'Ayat lebih panjang '.repeat(40)}]};
const slideMarkup=verse=>'<span class="presentation-verse-label">AYAT '+verse.number+'</span><div class="presentation-copy bible">'+verse.text+'</div>';
Object.defineProperties(consistentStage,{
  clientHeight:{get:()=>400},clientWidth:{get:()=>800},
  scrollHeight:{get:()=>Math.max(400,scale()*consistentStage.textContent.length*3)},
  scrollWidth:{get:()=>800}
});
consistentStage.innerHTML=slideMarkup(state.bibleReader.verses[0]);context.fitPresentationText();
const sharedScale=state.presentation.fittedScale;
consistentStage.innerHTML=slideMarkup(state.bibleReader.verses[1]);context.fitPresentationText();
assert.equal(state.presentation.fittedScale,sharedScale,'Short and long verses use one font size before, during and after the fold');
assert.ok(consistentStage.scrollHeight<=402,'The shared size still respects the reading boundary');
context.resizePresentation(-.1);const reducedSharedScale=state.presentation.fittedScale;
consistentStage.innerHTML=slideMarkup(state.bibleReader.verses[0]);context.fitPresentationText();
assert.equal(state.presentation.fittedScale,reducedSharedScale,'User text-size changes remain consistent across verses');
const roundedStage=consistentStage.cloneNode(true);consistentStage.replaceWith(roundedStage);
Object.defineProperties(roundedStage,{
  clientHeight:{get:()=>400},clientWidth:{get:()=>800},
  scrollHeight:{get:()=>Math.max(401,scale()*roundedStage.textContent.length*3)},
  scrollWidth:{get:()=>801}
});
state.presentation={type:'bible',scale:1};context.fitPresentationText();
assert.ok(state.presentation.fittedScale>.1,'One-pixel rounding must not collapse lyrics to an invisible font');
assert.ok(roundedStage.scrollHeight<=402,'Real text overflow is still fitted');
const geometryStage=roundedStage.cloneNode(true);roundedStage.replaceWith(geometryStage);
Object.defineProperties(geometryStage,{
  clientHeight:{get:()=>400},clientWidth:{get:()=>800},
  scrollHeight:{get:()=>416},scrollWidth:{get:()=>816}
});
geometryStage.getBoundingClientRect=()=>({left:0,top:0,right:800,bottom:400,width:800,height:400});
const nativeBox=dom.window.HTMLElement.prototype.getBoundingClientRect;
dom.window.HTMLElement.prototype.getBoundingClientRect=function(){
  if(this.parentElement!==geometryStage)return nativeBox.call(this);
  const height=this.matches('.presentation-copy')?scale()*this.textContent.length*3:40;
  const top=this.matches('.presentation-copy')?40:0;
  return {left:0,top,right:800,bottom:top+height,width:800,height};
};
state.presentation={type:'bible',scale:1};context.fitPresentationText();
assert.ok(state.presentation.fittedScale>.1,'Content geometry must remain readable even when scroll dimensions never fit');
assert.match(geometryStage.querySelector('.presentation-copy').style.fontSize,/px$/,'Original text has an explicit pixel size');
assert.ok(parseFloat(geometryStage.querySelector('.presentation-copy').style.fontSize)>=18,'Text cannot shrink to an invisible size');
state.hymnalReader={song:{lyrics:[{type:'verse',index:1,lines:['Lirik panjang '.repeat(14)]}]}};
state.presentation={type:'song',scale:1};shell.dataset.presentationKind='song';
geometryStage.innerHTML=context.songPresentationMarkup(context.songPresentationSlides(state.hymnalReader.song)[0]);
dom.window.HTMLElement.prototype.getBoundingClientRect=function(){
  if(!geometryStage.contains(this))return nativeBox.call(this);
  const copy=this.matches('.presentation-copy'),label=this.matches('.presentation-verse-label');
  const height=copy?scale()*this.textContent.length*3:label?40:400,top=copy?40:0;
  return {left:0,top,right:800,bottom:top+height,width:800,height};
};
context.fitPresentationText();
assert.ok(state.presentation.fittedScale>.1&&state.presentation.fittedScale<1,'Fit the lyric bounds even when its wrapper clips overflowing text');
dom.window.HTMLElement.prototype.getBoundingClientRect=nativeBox;
dom.window.close();
console.log('Presentation verified: verse/reff ordering, theme songs, navigation, operator/offline, Bible, reduced motion and fitting.');
