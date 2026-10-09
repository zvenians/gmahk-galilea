import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../page-turn.js',import.meta.url),'utf8');
new vm.Script(source);
assert.match(html,/page-turn\.css/);assert.match(html,/page-turn\.js/);
assert.ok(html.indexOf('/vendor/page-flip-2.0.7.js')<html.indexOf('<script src="/page-turn.js'),'Load the soft-page engine before its adapter');
assert.match(html,/window\.GalileaPageTurn\?\.capture\(\)/);
assert.match(html,/if\(view\.index!==previous\)\{\s*fitPresentationText\(\);\s*if\(!window\.GalileaPageTurn\?\.play/,'Fit new text before capturing the incoming page');
const dom=new JSDOM(html,{url:'https://gmahk-galilea.vercel.app',pretendToBeVisual:true,runScripts:'outside-only'});
const {window}=dom,{document}=window;
let systemReduced=false;
window.matchMedia=()=>({get matches(){return systemReduced;},addEventListener(){}});
const engines=[];
window.St={PageFlip:class{
  constructor(book,settings){this.book=book;this.settings=settings;this.renderer={};engines.push(this);}
  getRender(){return this.renderer;}
  on(name,handler){this.handler=handler;}
  loadFromHTML(sheets){this.sheets=sheets;}
  flipNext(corner){this.direction='next';this.corner=corner;}
  flipPrev(corner){this.direction='prev';this.corner=corner;}
  destroy(){this.destroyed=true;this.book.remove();}
}};
const shell=document.getElementById('presentation-shell'),main=shell.querySelector('.presentation-main'),stage=document.getElementById('presentation-stage');
document.getElementById('presentation-dialog').open=true;shell.dataset.presentationType='bible';
stage.innerHTML='<span class="presentation-verse-label">AYAT 1</span><div class="presentation-copy bible">Ayat aktual yang sedang dibaca.</div>';
const box=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
shell.getBoundingClientRect=()=>box(0,0,1440,900);main.getBoundingClientRect=()=>box(0,0,1440,900);
main.querySelector('.presentation-head').getBoundingClientRect=()=>box(50,60,1340,100);stage.getBoundingClientRect=()=>box(50,180,1340,580);
window.eval(source);
const turn=window.GalileaPageTurn;
const oldPage=turn.capture();
stage.querySelector('.presentation-copy').textContent='Ayat berikutnya yang baru dibuka.';
assert.equal(turn.play(oldPage,1),true);
let layer=document.querySelector('.page-turn-layer');
assert.equal(layer.dataset.direction,'next');assert.equal(layer.getAttribute('aria-hidden'),'true');
assert.equal(layer.querySelectorAll('[id]').length,0);assert.equal(layer.querySelectorAll('.page-turn-sheet').length,2);
assert.ok([...layer.querySelectorAll('.page-turn-sheet')].every(sheet=>sheet.dataset.density==='soft'),'Book pages must bend, never use hard covers');
assert.equal(engines.at(-1).settings.showCover,false);
assert.equal(engines.at(-1).settings.startPage,0);
assert.equal(layer.style.top,'60px');assert.equal(layer.style.height,'700px','Paper stops above the copyright');
assert.match(layer.textContent,/Ayat aktual/);
assert.match(layer.querySelectorAll('.page-turn-sheet')[1].textContent,/Ayat berikutnya/);
await new Promise(resolve=>window.requestAnimationFrame(resolve));
assert.equal(engines.at(-1).direction,'next');assert.equal(engines.at(-1).corner,'bottom');
turn.cancel();assert.equal(document.querySelector('.page-turn-layer'),null);
assert.equal(shell.classList.contains('page-turn-active'),false,'Original text is visible again after cleanup');
assert.equal(engines.at(-1).renderer.galileaDisposed,true,'Closing stops the renderer loop');
assert.equal(engines.at(-1).destroyed,true);
window.innerWidth=390;assert.equal(turn.play(turn.capture(),-1),true);layer=document.querySelector('.page-turn-layer');
assert.equal(layer.dataset.direction,'prev');assert.equal(layer.querySelectorAll('.page-turn-sheet').length,2);
assert.equal(engines.at(-1).settings.startPage,1);
turn.play(turn.capture(),1);assert.equal(document.querySelectorAll('.page-turn-layer').length,1,'Rapid input replaces, not queues, animation');
turn.cancel();document.documentElement.dataset.motion='reduced';assert.equal(turn.capture(),null);assert.equal(turn.play(null,1),false);
document.documentElement.dataset.motion='full';systemReduced=true;assert.ok(turn.capture(),'Explicit full motion overrides the system preference');
delete document.documentElement.dataset.motion;assert.equal(turn.capture(),null,'System preference applies when no site choice exists');
document.documentElement.dataset.motion='reduced';assert.equal(turn.capture(),null,'Reduced site choice always disables motion');
document.documentElement.dataset.motion='full';systemReduced=false;
shell.dataset.presentationType='schedule';assert.equal(turn.capture(),null,'No page turn outside Bible/Song');
shell.dataset.presentationType='song';document.getElementById('presentation-dialog').open=false;assert.equal(turn.capture(),null);
dom.window.close();
const real=new JSDOM(html,{url:'https://gmahk-galilea.vercel.app',pretendToBeVisual:true,runScripts:'outside-only'});
const rw=real.window,rd=rw.document,frames=new Map();let frameId=0;
rw.requestAnimationFrame=callback=>{frames.set(++frameId,callback);return frameId;};
rw.cancelAnimationFrame=id=>frames.delete(id);
rw.matchMedia=()=>({matches:false,addEventListener(){}});
Object.defineProperties(rw.HTMLElement.prototype,{offsetWidth:{get(){return 1340;}},offsetHeight:{get(){return 700;}}});
const rs=rd.getElementById('presentation-shell'),rm=rs.querySelector('.presentation-main'),rt=rd.getElementById('presentation-stage');
rd.getElementById('presentation-dialog').open=true;rs.dataset.presentationType='song';
rs.getBoundingClientRect=rm.getBoundingClientRect=()=>box(0,0,1440,900);
rm.querySelector('.presentation-head').getBoundingClientRect=()=>box(50,60,1340,100);rt.getBoundingClientRect=()=>box(50,180,1340,580);
rt.innerHTML='<div class="presentation-copy song">Lirik sebelumnya</div>';
rw.eval(fs.readFileSync(new URL('../vendor/page-flip-2.0.7.js',import.meta.url),'utf8'));rw.eval(source);
const tick=time=>{const batch=[...frames.values()];frames.clear();batch.forEach(callback=>callback(time));};
const softTurn=direction=>{
  const snapshot=rw.GalileaPageTurn.capture();rt.querySelector('.presentation-copy').textContent='Lirik baru';
  assert.equal(rw.GalileaPageTurn.play(snapshot,direction),true);tick(0);tick(450);
  const sheet=rd.querySelector('.page-turn-sheet[data-page-turn-surface="fold"][style*="polygon"]');
  assert.ok(sheet,'The real engine draws a clipped, folded soft page');
  assert.match(sheet.style.transform,/rotate\(/,'Paper folds diagonally instead of rotating as a rigid cover');
  assert.equal(sheet.dataset.pageTurnSurface,'fold','The lifted paper is marked as opaque');
  assert.ok(rd.querySelector('.page-turn-sheet[data-page-turn-surface="flat"]'),'The underlying flat page remains a separate transparent surface');
  assert.ok(rd.querySelector('.stf__outerShadow').style.transform,'The fold has a moving shadow');
  rw.GalileaPageTurn.cancel();tick(500);assert.equal(frames.size,0,'Canceled real renderer stops scheduling frames');
};
softTurn(1);softTurn(-1);real.window.close();
console.log('Page turn verified: scoped to Bible/song, direction, real-text snapshots, copyright boundary, rapid input cleanup, mobile, and reduced motion.');
