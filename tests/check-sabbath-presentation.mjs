import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {visitorFixture,hymnalFixture} from './visitor-fixture.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const server=createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const fixture=visitorFixture(1);
const lesson={number:3,id:'03',title:'Bertumbuh dalam Iman dan Pengharapan',dateLabel:'10–16 Oktober 2026',source:'Materi uji',days:[
  {dateLabel:'Minggu, 11 Oktober',title:'Pengharapan yang Menguatkan',bibleHtml:'<p><strong>Roma 15:13</strong> · Ayat untuk direnungkan.</p>',contentHtml:'<p>'+Array.from({length:900},(_,i)=>'kata'+i).join(' ')+'</p><blockquote>Iman bertumbuh melalui doa dan pelayanan.</blockquote><ol><li>Renungkan firman.</li><li>Bagikan pengharapan.</li></ol>'},
  {dateLabel:'Senin, 12 Oktober',title:'Hidup dalam Kasih',bibleHtml:'',contentHtml:'<h3>Pertanyaan diskusi</h3><p>Bagaimana kita menunjukkan <strong>kasih</strong> kepada sesama?</p>'},
  {dateLabel:'Selasa, 13 Oktober',title:'Bacaan belum terbit',bibleHtml:'',contentHtml:''},
  {"dateLabel":"Rabu, 14 Oktober","title":"Fungsi Para Nabi","bibleHtml":"","contentHtml":"<p>Ruang pertemuan itu memiliki beberapa kursi kayu yang disusun pada pagi hari.</p><p>Para nabi berinteraksi dengan raja-raja dalam situasi yang menyenangkan maupun tidak menyenangkan.</p><p>Salah satu fungsi inti para nabi adalah membantu memimpin raja-raja yang tidak setia kembali kepada ketaatan pada hukum Allah.</p><p>Para nabi juga berinteraksi dengan para imam. Musa seorang nabi Allah, mengurapi Harun dan anak-anaknya sebagai imam-imam Israel yang pertama (Im. 8: 10-13).</p><p>Para nabi adalah guru bagi rakyat (2 Taw. 34:12). Mereka menyampaikan berbagai pekabaran dari Allah kepada para imam, raja, dan bangsa itu (Yer. 5:31; Yeh. 22:26).</p><p>Bagaimana kita dapat mengikuti firman Allah dalam kehidupan sehari-hari?</p>"}
]};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
let detailCalls=0;
await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/gas'){
    const {method}=route.request().postDataJSON();
    if(method==='getSabbathLessonDetail')detailCalls++;
    const responses={getWebsiteData:fixture,getSabbathSchoolLibrary:{quarterly:{},lessons:[{...lesson,isCurrent:true}]},getSabbathLessonDetail:lesson};
    return route.fulfill({json:{ok:true,data:responses[method]||{}}});
  }
  if(url.hostname==='raw.githubusercontent.com')return route.fulfill({json:hymnalFixture});
  if(url.origin!==base)return route.fulfill({body:'',contentType:'text/html'});
  return route.continue();
});

async function fit() {
  await page.waitForTimeout(500);
  return page.evaluate(()=>{
    const stage=document.querySelector('#presentation-stage'),copy=stage.querySelector('.ss-page');
    const bounds=stage.getBoundingClientRect(),text=copy.getBoundingClientRect();
    const footer=document.querySelector('.presentation-footer').getBoundingClientRect();
    return {width:stage.clientWidth,scrollWidth:stage.scrollWidth,height:stage.clientHeight,scrollHeight:stage.scrollHeight,bottom:text.bottom,footer:footer.top,top:text.top,stageTop:bounds.top};
  });
}
function fits(result,label){
  assert.ok(result.scrollHeight<=result.height+2,label+': '+JSON.stringify(result));
  assert.ok(result.scrollWidth<=result.width+2,label+': horizontal overflow');
  assert.ok(result.bottom<=result.footer+2,label+': overlaps copyright');
  assert.ok(result.top>=result.stageTop-2,label+': clipped top');
}
async function wake(){await page.mouse.move(20,160);}
async function verifyPages(){
  const result=await page.evaluate(()=>{
    const model=window.ssTestModel;
    const text=html=>{const node=document.createElement('div');node.innerHTML=html;return node.textContent.replace(/\s+/g,'');};
    return model.days.map((day,index)=>({expected:text(day.blocks.map(block=>block.element.innerHTML).join('')),actual:text(model.pages.filter(part=>part.dayIndex===index).map(part=>part.html).join(''))}));
  });
  for(const [index,item] of result.entries())if(item.expected)assert.equal(item.actual,item.expected,'Complete reading, day '+index);
}

try {
  await page.goto(base+'/#sabbath');
  await page.locator('#loader').waitFor({state:'hidden'});
  await page.locator('[data-lesson-id="03"]').first().click();
  await page.locator('[data-present-sabbath="summary"]').waitFor();
  await page.evaluate(()=>{
    const create=window.GalileaSabbathPresentation.create;
    window.GalileaSabbathPresentation.create=(...args)=>(window.ssTestModel=create(...args));
    const layout=window.GalileaSabbathPresentation.layout;
    window.GalileaSabbathPresentation.layout=(view,stage)=>{window.ssTestView=view;return layout(view,stage);};
  });
  await page.locator('[data-present-sabbath="summary"]').click();
  await page.locator('#presentation-dialog[open]').waitFor();
  fits(await fit(),'Desktop cover');
  assert.ok(await page.evaluate(()=>Boolean(document.fullscreenElement)),'Native fullscreen opens');
  assert.equal(await page.locator('#presentation-sabbath-mode').inputValue(),'summary');
  await page.locator('#presentation-sabbath-day').selectOption('3');
  fits(await fit(),'Daily key points');
  assert.ok(await page.locator('.ss-point').count()>=2);
  const dailySections=await page.evaluate(()=>window.ssTestModel.pages.filter(item=>item.dayIndex===3).map(item=>item.section));
  for(const section of ['points','summary','references','discussion'])assert.ok(dailySections.includes(section));
  await page.evaluate(()=>document.querySelector('#presentation-shell').focus());
  for(let step=0;step<8&&!await page.locator('.ss-section-summary').count();step++)await page.keyboard.press('ArrowRight');
  fits(await fit(),'Daily core summary');
  assert.match(await page.locator('.ss-reading').textContent(),/fungsi inti/);
  await wake();await page.locator('#presentation-sabbath-mode').selectOption('full');
  await fit();
  assert.equal(await page.locator('#presentation-sabbath-day').inputValue(),'3','Mode switch keeps day');
  await page.locator('#presentation-sabbath-day').selectOption('-1');
  await fit();
  await verifyPages();
  await page.evaluate(()=>document.querySelector('#presentation-shell').focus());
  await page.keyboard.press('ArrowRight');
  fits(await fit(),'Desktop reading');
  const originalCount=await page.evaluate(()=>window.ssTestModel.pages.length);
  assert.ok(originalCount>5,'Long reading becomes several slides');
  await page.screenshot({path:'/tmp/galilea-sabbath-desktop.png'});
  await wake();await page.locator('[data-presentation-larger]').click();
  fits(await fit(),'Larger text');await verifyPages();
  await wake();await page.locator('#presentation-sabbath-day').selectOption('1');
  fits(await fit(),'Day selection');
  assert.match(await page.locator('.ss-page h2').textContent(),/Hidup dalam Kasih/);
  assert.equal(await page.locator('.ss-reading strong').textContent(),'kasih');
  await wake();await page.locator('#presentation-sabbath-day').selectOption('2');
  assert.match(await page.locator('.ss-reading').textContent(),/belum tersedia/);
  await wake();await page.locator('#presentation-sabbath-day').selectOption('0');
  await page.evaluate(()=>document.querySelector('#presentation-shell').focus());
  await page.keyboard.press('PageDown');
  const anchor=await page.locator('.ss-reading').textContent();
  assert.ok(anchor.includes('kata'),'Presenter PageDown advances');
  await wake();await page.locator('[data-presentation-projector]').click();
  fits(await fit(),'16:9 reading');await verifyPages();
  await wake();await page.locator('[data-presentation-theme]').click();
  await wake();await page.locator('#presentation-palette').click();
  await page.locator('[data-screen-palette="pink"]').click();
  fits(await fit(),'Pink light theme');
  await wake();await page.locator('[data-presentation-projector]').click();
  await page.evaluate(async()=>{if(document.fullscreenElement)await document.exitFullscreen();});
  await page.setViewportSize({width:390,height:844});
  fits(await fit(),'Mobile reading');await verifyPages();
  await page.screenshot({path:'/tmp/galilea-sabbath-mobile.png'});
  await page.setViewportSize({width:844,height:390});
  fits(await fit(),'Mobile landscape');await verifyPages();
  await wake();await page.locator('#presentation-sabbath-mode').selectOption('summary');
  await page.locator('#presentation-sabbath-day').selectOption('3');
  fits(await fit(),'Mobile landscape key points');await verifyPages();
  await page.setViewportSize({width:390,height:844});
  fits(await fit(),'Mobile portrait key points');await verifyPages();
  await page.evaluate(()=>document.querySelector('#presentation-shell').focus());
  for(let step=0;step<20&&!await page.locator('.ss-section-summary').count();step++)await page.keyboard.press('ArrowRight');
  fits(await fit(),'Mobile portrait core summary');
  assert.match(await page.locator('.ss-reading').textContent(),/fungsi inti/);
  await page.setViewportSize({width:1440,height:900});
  await fit();
  await page.evaluate(()=>document.querySelector('#presentation-shell').focus());
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#reader-dialog').evaluate(node=>node.open),'Return to reading');
  await page.locator('[data-present-sabbath="summary"]').click();await fit();
  assert.equal(detailCalls,1,'Fullscreen reuses loaded lesson');
  const pageBounds=await page.evaluate(()=>{
    const view=window.ssTestView,stage=document.querySelector('#presentation-stage');
    const previous=view.index;
    const sizes=view.item.pages.map((_,index)=>{
      view.index=index;window.GalileaSabbathPresentation.render(view,stage);
      return {index,height:stage.clientHeight,scrollHeight:stage.scrollHeight};
    });
    view.index=previous;window.GalileaSabbathPresentation.render(view,stage);
    return sizes;
  });
  for(const bounds of pageBounds)assert.ok(bounds.scrollHeight<=bounds.height+2,'Every slide fits: '+JSON.stringify(bounds));
  await page.evaluate(()=>document.querySelector('#presentation-shell').focus());
  await page.mouse.move(25,180);
  await page.waitForTimeout(4300);
  assert.ok(await page.locator('#presentation-shell').evaluate(node=>node.classList.contains('presentation-controls-hidden')),'Controls hide automatically');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{document.querySelector('#presentation-shell').requestFullscreen=()=>Promise.reject(new Error('Fullscreen unavailable'));});
  await page.locator('[data-present-sabbath="summary"]').click();
  fits(await fit(),'Fullscreen fallback');
  assert.ok(await page.locator('#presentation-dialog').evaluate(node=>node.open),'Presentation still opens when native fullscreen is unavailable');
  assert.deepEqual(errors,[],'No browser errors');
  console.log('PASS: Fullscreen, complete text, pagination, day jump, empty reading, keyboard, text size, themes, mobile, 16:9 and return to reader.');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
