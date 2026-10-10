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
turn.play(turn.capture(),1);engines.at(-1).destroy=()=>{throw new Error('Renderer cleanup failure');};
assert.throws(()=>turn.cancel(),/Renderer cleanup failure/);
assert.equal(document.querySelector('.page-turn-layer'),null,'A renderer failure cannot leave the animation over the lyrics');
assert.equal(shell.classList.contains('page-turn-active'),false,'A renderer failure cannot keep the original hidden');
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
let realEngine;const PageFlip=rw.St.PageFlip;
rw.St.PageFlip=class extends PageFlip{constructor(...args){super(...args);realEngine=this;}};
const tick=time=>{const batch=[...frames.values()];frames.clear();batch.forEach(callback=>callback(time));};
const inside=(point,polygon)=>{
  let result=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)result=!result;
  }
  return result;
};
const softTurn=direction=>{
  const snapshot=rw.GalileaPageTurn.capture();rt.querySelector('.presentation-copy').textContent='Lirik baru';
  assert.equal(rw.GalileaPageTurn.play(snapshot,direction),true);tick(0);tick(450);
  const sheet=rd.querySelector('.page-turn-sheet[data-page-turn-surface="fold"][style*="polygon"]');
  assert.ok(sheet,'The real engine draws a clipped, folded soft page');
  assert.match(sheet.style.transform,/rotate\(/,'Paper folds diagonally instead of rotating as a rigid cover');
  assert.equal(sheet.dataset.pageTurnSurface,'fold','The lifted paper is marked as opaque');
  assert.ok(rd.querySelector('.page-turn-sheet[data-page-turn-surface="flat"]'),'The underlying flat page remains a separate transparent surface');
  assert.ok(rd.querySelector('.stf__outerShadow').style.transform,'The fold has a moving shadow');
  const renderer=realEngine.getRender();
  assert.equal(renderer.flippingPage.getElement().dataset.pageTurnSurface,'fold','The lifted page stays solid in both directions');
  assert.ok(Math.abs(realEngine.getFlipController().getCalculation().getAngle())>.1,'The corner lifts visibly instead of becoming a vertical strip');
  if(direction>0){
    for(const time of [450,750,1050,1350]){
      tick(time);
      const old=renderer.rightPage.getElement(),revealed=realEngine.getFlipController().getCalculation().getBottomClipArea().filter(Boolean);
      assert.match(old.style.clipPath,/^polygon\(evenodd,/,'The old transparent page excludes the newly revealed page');
      const oldPolygon=[...old.style.clipPath.matchAll(/(-?[\d.]+)px\s+(-?[\d.]+)px/g)].map(match=>({x:+match[1],y:+match[2]}));
      for(let x=11;x<1340;x+=53)for(let y=13;y<700;y+=47){
        const point={x,y},oldVisible=inside(point,oldPolygon),newVisible=inside(point,revealed);
        assert.equal(oldVisible&&newVisible,false,'Old and incoming flat text never share the same area');
        assert.ok(oldVisible||newVisible,'The two flat areas still cover the full page');
      }
    }
  }
  tick(1700);tick(1750);
  assert.equal(rd.querySelector('.page-turn-layer'),null,'Completion restores the real text without an overlay');
  assert.equal(rs.classList.contains('page-turn-active'),false);
  rw.GalileaPageTurn.cancel();tick(500);assert.equal(frames.size,0,'Canceled real renderer stops scheduling frames');
};
softTurn(1);softTurn(-1);real.window.close();
console.log('Page turn verified: scoped to Bible/song, direction, real-text snapshots, copyright boundary, rapid input cleanup, mobile, and reduced motion.');
