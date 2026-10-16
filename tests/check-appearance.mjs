import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {chromium} from 'playwright';
import {visitorFixture,hymnalFixture} from './visitor-fixture.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=fs.readFileSync(path.join(root,'viewer.js'),'utf8');
const start=source.indexOf('      function welcomeContent(');
const sandbox=vm.createContext({Intl,Date});
vm.runInContext(source.slice(start,source.indexOf('\n      function ',start+1)),sandbox);
for(const [date,title,label] of [
  ['2026-10-16T15:59:59Z','Selamat Datang','GMAHK Galilea Balikpapan'],
  ['2026-10-16T16:00:00Z','Selamat Hari Sabat','Ibadah Sabat'],
  ['2026-10-17T15:59:59Z','Selamat Hari Sabat','Ibadah Sabat'],
  ['2026-10-17T16:00:00Z','Selamat Datang','GMAHK Galilea Balikpapan'],
  ['2026-10-14T09:59:59Z','Selamat Datang','GMAHK Galilea Balikpapan'],
  ['2026-10-14T10:00:00Z','Selamat Datang','Ibadah Rabu Malam'],
  ['2026-10-12T10:00:00Z','Selamat Datang','GMAHK Galilea Balikpapan'],
  ['2026-10-13T10:00:00Z','Selamat Datang','GMAHK Galilea Balikpapan'],
  ['2026-10-15T10:00:00Z','Selamat Datang','GMAHK Galilea Balikpapan']
]){
  const content=sandbox.welcomeContent(new Date(date));
  assert.equal(content.title,title,date);assert.equal(content.label,label,date);
  assert.match(content.reminder,/senyapkan ponsel dan perangkat elektronik selama ibadah/,date);
}
console.log('PASS: Sabbath and Wednesday 18:00 boundaries use WITA.');

const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'};
const server=createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const fixture=visitorFixture(3);
fixture.activities.forEach(item=>item.coverUrl='/assets/presentation/schedule.webp');
await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/gas'){
    const {method,args}=route.request().postDataJSON();
    const responses={getWebsiteData:fixture,getDailyDevotional:{format:'text',requestedDate:args[0],title:'Renungan uji',contentHtml:'<p>Teks uji</p>'},getBibleBooks:[{id:'GEN',name:'Kejadian',chapters:50,testament:'PL',order:1}],getBibleChapter:{book:'Kejadian',chapter:1,verses:[{number:1,text:'Teks ayat untuk pengujian tampilan.'}]}};
    return route.fulfill({json:{ok:true,data:responses[method]||{}}});
  }
  if(url.hostname==='raw.githubusercontent.com')return route.fulfill({json:hymnalFixture});
  if(url.origin!==base)return route.fulfill({body:'',contentType:'text/html'});
  return route.continue();
});
const palettes=['green','red','navy','brown','purple','teal','slate','pink','orange','amber','olive','sky','indigo'];
const screenshotDir=process.env.APPEARANCE_SCREENSHOTS||'/tmp/galilea-appearance';
fs.mkdirSync(screenshotDir,{recursive:true});
async function loaded(){await page.locator('#app h1').waitFor();await page.locator('#loader').waitFor({state:'hidden'});}
async function settings(){await page.locator('[data-open="settings"]:visible').first().click();}
async function choosePalette(value){await page.locator('#settings-palette').click();await page.locator('[data-palette-value="'+value+'"]').click();}
async function screenPalette(value){await page.mouse.move(15,150);await page.locator('#presentation-palette').click();await page.locator('[data-screen-palette="'+value+'"]').click();}
async function verifyPaletteMenu(id){
  const menu=page.locator('#'+id);
  await menu.waitFor({state:'visible'});
  await page.waitForTimeout(220);
  const box=await menu.boundingBox(),viewport=page.viewportSize();
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,'Palette stays within viewport');
  const sizes=await menu.locator('.palette-choice').evaluateAll(nodes=>nodes.map(node=>({width:node.clientWidth,height:node.clientHeight})));
  sizes.forEach(size=>assert.ok(size.width>=44&&size.height>=44,'Touch target size'));
  const columns=await menu.locator('.palette-options').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length);
  assert.equal(columns,2,'Two compact columns');
  const labels=await menu.locator('.palette-choice [lang="en"]').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().left));
  labels.forEach((left,index)=>assert.ok(Math.abs(left-labels[index%2])<1,'Color names align within each column'));
  assert.equal(await menu.evaluate(node=>node.scrollWidth<=node.clientWidth),true,'No horizontal overflow');
}
async function welcome(){
  if(await page.locator('#mobile-toggle').isVisible()){
    await page.locator('#mobile-toggle').click();
    await page.waitForTimeout(420);
    const row=await page.locator('.header-row').boundingBox(),panel=await page.locator('#mobile-panel').boundingBox();
    assert.ok(Math.abs(panel.y-row.y-row.height)<2,'Expanded menu meets navbar without a gap');
    assert.ok(Math.abs(panel.x-row.x)<2&&Math.abs(panel.width-row.width)<2,'Menu shares navbar width');
    assert.equal(await page.locator('#mobile-panel').evaluate(node=>node.inert),false);
    await page.screenshot({path:path.join(screenshotDir,'expanded-menu-'+page.viewportSize().width+'.png')});
    await page.locator('#mobile-panel [data-present-welcome]').click();
  }else{
    await page.locator('[data-nav-toggle]').filter({hasText:'Materi Ibadah'}).click();
    await page.locator('#desktop-menu-groups [data-present-welcome]').click();
  }
  await page.locator('#presentation-dialog').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.fullscreenElement?.id==='presentation-shell');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
function luminance(rgb){const values=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return values[0]*.2126+values[1]*.7152+values[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
try{
  await page.goto(base);await loaded();
  await settings();
  assert.equal(await page.locator('#settings-palette-menu').isVisible(),false,'Settings starts with a collapsed picker');
  await page.locator('#settings-palette').focus();await page.keyboard.press('Enter');
  await verifyPaletteMenu('settings-palette-menu');
  const labels=await page.locator('#palette-options [lang="en"]').allTextContents();
  assert.deepEqual(labels,['Galilea Green','Red','Navy','Brown','Purple','Teal','Slate','Pink','Orange','Gold','Olive','Sky Blue','Indigo']);
  await page.keyboard.press('End');await page.keyboard.press('Enter');
  assert.equal(await page.locator('html').getAttribute('data-palette'),'indigo');
  await page.locator('#settings-palette-menu').waitFor({state:'hidden'});
  assert.equal(await page.locator('#settings-palette-menu').isVisible(),false,'Selecting closes the menu');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-palette');
  await page.keyboard.press('Enter');await page.keyboard.press('Escape');
  assert.equal(await page.locator('#settings-dialog').isVisible(),true,'Escape closes palette before settings');
  await page.locator('#settings-palette').click();
  await page.locator('#palette-heading').click();
  await page.locator('#settings-palette-menu').waitFor({state:'hidden'});
  assert.equal(await page.locator('#settings-palette-menu').isVisible(),false,'Click outside dismisses palette');
  await page.keyboard.press('Escape');
  if(process.argv.includes('--palette-only')){
    for(const viewport of [{width:320,height:640},{width:844,height:390},{width:1440,height:900}]){
      await page.setViewportSize(viewport);
      for(const theme of ['light','dark']){
        console.log('Palette viewport:',viewport.width,viewport.height,theme);
        await settings();await page.locator('[data-theme-value="'+theme+'"]').click();
        await page.locator('#settings-palette').click();await verifyPaletteMenu('settings-palette-menu');
        await page.screenshot({path:path.join(screenshotDir,'palette-settings-'+viewport.width+'-'+theme+'.png')});
        await page.keyboard.press('End');await page.keyboard.press('Enter');
        await page.locator('#settings-palette-menu').waitFor({state:'hidden'});
        await page.keyboard.press('Escape');
        await welcome();await page.locator('#presentation-palette').click();
        await verifyPaletteMenu('presentation-palette-menu');
        await page.screenshot({path:path.join(screenshotDir,'palette-screen-'+viewport.width+'-'+theme+'.png')});
        await page.keyboard.press('Escape');await page.keyboard.press('Escape');
        await page.locator('#presentation-dialog').waitFor({state:'hidden'});
        await page.waitForFunction(()=>!document.fullscreenElement);
      }
    }
    await settings();await page.locator('[data-motion-value="reduced"]').click();
    await page.locator('#settings-palette').click();
    assert.ok(await page.locator('#settings-palette-menu').evaluate(node=>getComputedStyle(node).transitionDuration.split(',').every(value=>parseFloat(value)<=.001)),'Reduced motion removes visible transition');
    assert.deepEqual(errors,[]);
    console.log('PASS: palette alignment, portrait/landscape bounds, both themes, keyboard, dismiss, English names and reduced motion.');
  }else{
  const navColors=new Set();
  for(const palette of palettes){
    await settings();await choosePalette(palette);
    assert.equal(await page.locator('[data-palette-value="'+palette+'"]').getAttribute('aria-pressed'),'true');
    for(const mode of ['light','dark']){
      await page.locator('[data-theme-value="'+mode+'"]').click();
      await page.waitForFunction(()=>getComputedStyle(document.body).color===getComputedStyle(document.querySelector('#settings-dialog .palette-choice.active')).color,null,{timeout:3000});
      await page.waitForTimeout(450);
      const colors=await page.evaluate(()=>({
        text:getComputedStyle(document.body).color,bg:getComputedStyle(document.documentElement).backgroundColor,
        nav:getComputedStyle(document.querySelector('.header-row')).backgroundColor,
        control:getComputedStyle(document.querySelector('#settings-dialog .palette-choice.active')).color,
        controlBg:getComputedStyle(document.querySelector('#settings-dialog .palette-choice.active')).backgroundColor
      }));
      assert.ok(contrast(colors.text,colors.bg)>=4.5,palette+' '+mode+' body contrast '+JSON.stringify(colors));
      assert.ok(contrast(colors.control,colors.controlBg)>=4.5,palette+' '+mode+' selected control contrast');
      navColors.add(colors.nav);
    }
    await page.keyboard.press('Escape');
  }
  assert.equal(navColors.size,palettes.length,'All navbar palettes are distinct');
  await page.reload();await loaded();assert.equal(await page.locator('html').getAttribute('data-palette'),'indigo');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  console.log('PASS: thirteen palettes including pink, both modes, contrast, selected state, persistence.');
  for(const mode of ['light','dark']){
    await settings();await choosePalette('pink');
    await page.locator('[data-theme-value="'+mode+'"]').click();await page.keyboard.press('Escape');
    await page.goto(base);await loaded();await page.waitForLoadState('networkidle');
    const loader=page.locator('.faith-interlude .faith-loader');
    const colors=await loader.evaluate(node=>({text:getComputedStyle(node.querySelector('strong')).color,bg:getComputedStyle(node).backgroundColor}));
    assert.ok(contrast(colors.text,colors.bg)>=4.5,'Nested welcome card contrast '+mode);
    await page.addStyleTag({content:'#app, #app * {content-visibility:visible!important}'});
    await page.locator('.faith-interlude').evaluate(node=>node.scrollIntoView({behavior:'instant'}));
    await page.mouse.wheel(0,await page.locator('.faith-interlude').evaluate(node=>node.getBoundingClientRect().top-130));
    await page.waitForTimeout(500);
    await page.mouse.wheel(0,await page.locator('.faith-interlude').evaluate(node=>node.getBoundingClientRect().top-130));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(screenshotDir,'home-pink-'+mode+'.png')});
    await page.goto(base+'/#hymnal');await loaded();await page.locator('[data-song="1"]').click();
    const hero=page.locator('#reader-dialog .song-reader-hero');
    const style=await hero.evaluate(node=>({text:getComputedStyle(node.querySelector('h2')).color,bg:getComputedStyle(node).getPropertyValue('--surface'),gradient:getComputedStyle(node).backgroundImage}));
    assert.ok(!style.gradient.includes('rgb(7, 28, 16)'),'Song reader drops old green gradient');
    assert.equal(await hero.evaluate(node=>getComputedStyle(node,'::before').display),'none','Old dark green overlay must not obscure light mode');
    await hero.screenshot({path:path.join(screenshotDir,'song-reader-pink-'+mode+'.png')});
    await page.keyboard.press('Escape');
  }
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    await settings();await choosePalette('navy');
    await page.waitForTimeout(350);
    await page.screenshot({path:path.join(screenshotDir,'settings-'+width+'.png')});
    await page.keyboard.press('Escape');
    for(const route of ['home','today','schedule','bible','hymnal','activities','announcements','services','church','gallery',...(width===1440?['aboutsite','leaders','bulletin','sabbath','hymnal-scores','favorites','visitor','faq','contact']:[])]){
      await page.goto(base+'/#'+route);await loaded();
      assert.equal(await page.locator('html').getAttribute('data-palette'),'navy');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' overflow '+width);
      if(width===1440){
        await page.addStyleTag({content:'#app, #app *, .site-footer {content-visibility:visible!important}'});
        const leaks=await page.locator('body').evaluate(root=>{
          const results=[];
          for(const node of root.querySelectorAll('#app *, .site-footer, .site-footer *')){
            if(!node.getBoundingClientRect().height||node.closest('.palette-swatch,.btn.whatsapp'))continue;
            for(const pseudo of [null,'::before','::after']){
              const style=getComputedStyle(node,pseudo);
              if(pseudo&&(style.content==='none'||style.display==='none'))continue;
              const value=style.backgroundColor+' '+style.backgroundImage;
              const stale=[...value.matchAll(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/g)].some(m=>+m[2]>+m[1]*1.18&&+m[2]>+m[3]*1.1&&m[4]!=='0');
              if(stale)results.push(node.tagName+'.'+node.getAttribute('class')+' '+pseudo+' '+value);
            }
          }
          return results;
        });
        assert.deepEqual(leaks,[],route+' has no stale green surfaces');
      }
    }
    await page.goto(base);await loaded();
    const photos=await page.locator('.activity-film-media').evaluateAll(nodes=>nodes.map(node=>{
      const box=node.getBoundingClientRect(),copy=node.parentElement.querySelector('.activity-film-copy').getBoundingClientRect();
      return {height:box.height,bottom:box.bottom,copyTop:copy.top,loaded:node.querySelector('img')?.naturalWidth>0};
    }));
    assert.ok(photos.length>0);photos.forEach(photo=>{assert.ok(photo.height>=175);assert.ok(photo.bottom<=photo.copyTop+1,'Caption must not cover photo');});
    await page.setViewportSize({width,height:900});
    await settings();await page.locator('#settings-palette').click();
    await verifyPaletteMenu('settings-palette-menu');
    await page.screenshot({path:path.join(screenshotDir,'settings-palette-'+width+'.png')});
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    await welcome();
    await page.locator('#presentation-palette').click();
    await verifyPaletteMenu('presentation-palette-menu');
    await page.screenshot({path:path.join(screenshotDir,'palette-grid-'+width+'.png')});
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#presentation-dialog').isVisible(),true,'Escape closes color options before fullscreen');
    assert.match(await page.locator('.welcome-reminder').textContent(),/senyapkan ponsel/);
    assert.match(await page.locator('.welcome-screen h2').evaluate(node=>getComputedStyle(node).fontFamily),/Georgia/);
    assert.ok(await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.welcome-message strong')).fontSize)>parseFloat(getComputedStyle(document.querySelector('.welcome-screen h2')).fontSize)),'Jemaat Galilea leads the typography');
    assert.equal(await page.locator('#presentation-palette').evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)','Fullscreen palette has no background box');
    for(const palette of palettes){
      await screenPalette(palette);
      for(const light of [true,false]){
        const isLight=await page.locator('#presentation-shell').evaluate(node=>node.classList.contains('is-light'));
        if(isLight!==light)await page.locator('[data-presentation-theme]').click();
        const colors=await page.evaluate(()=>({text:getComputedStyle(document.querySelector('.welcome-screen h2')).color,bg:getComputedStyle(document.querySelector('#presentation-frame')).backgroundColor}));
        assert.ok(contrast(colors.text,colors.bg)>=7,palette+' fullscreen contrast');
      }
    }
    await screenPalette('brown');
    await page.locator('[data-presentation-larger]').click();
    await page.waitForTimeout(4500);
    assert.equal(await page.locator('.presentation-controls').evaluate(node=>getComputedStyle(node).opacity),'0','Pointer-focused controls hide even when hovered');
    assert.equal(await page.locator('.welcome-reminder').isVisible(),true,'Reminder remains after controls disappear');
    await page.mouse.move(20,200);
    await page.locator('#presentation-palette').focus();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(4200);
    assert.equal(await page.locator('.presentation-controls').evaluate(node=>node.contains(document.activeElement)&&getComputedStyle(node).opacity==='1'),true,'Auto-hide preserves keyboard focus');
    const bounds=await page.locator('.welcome-screen').boundingBox();
    assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1,'Welcome fits screen');
    if(width<=600){
      const footer=await page.locator('.presentation-footer').boundingBox();
      const controls=await page.locator('.presentation-controls').boundingBox();
      assert.ok(footer.y+footer.height<=controls.y,'Mobile controls do not cover copyright');
    }
    await page.screenshot({path:path.join(screenshotDir,'welcome-'+width+'.png')});
    await page.locator('[data-presentation-close]').click();
    assert.equal(await page.locator('#presentation-dialog').isVisible(),false);
  }
  await page.setViewportSize({width:1440,height:900});
  for(const kind of ['song','bible']){
    await page.goto(base+'/#'+(kind==='song'?'hymnal':'bible'));await loaded();
    if(kind==='song'){
      await page.locator('[data-song="1"]').click();
    }else{
      await page.locator('#bible-book-trigger').click();
      await page.locator('[data-pick-book="GEN"]').first().click();
      await page.locator('#bible-chapter').selectOption('1');
      await page.locator('#bible-verse').fill('1');
      await page.locator('#bible-open').click();
    }
    await page.locator('[data-present-'+kind+']').click();
    await screenPalette('red');
    await page.locator('[data-presentation-projector]').click();
    for(const mode of ['light','dark']){
      const isLight=await page.locator('#presentation-shell').evaluate(node=>node.classList.contains('is-light'));
      if(isLight!==(mode==='light'))await page.locator('[data-presentation-theme]').click();
      await page.waitForTimeout(400);
      assert.ok((await page.locator('.presentation-copy').textContent()).length>0);
      const bounds=await page.locator('.presentation-copy').boundingBox();
      const frame=await page.locator('#presentation-frame').boundingBox();
      assert.ok(bounds.x>=frame.x&&bounds.y>=frame.y&&bounds.y+bounds.height<=frame.y+frame.height,'Readable '+kind+' '+mode);
      await page.screenshot({path:path.join(screenshotDir,kind+'-'+mode+'.png')});
    }
    await page.locator('[data-presentation-close]').click();
    if(await page.locator('#reader-dialog').isVisible())await page.keyboard.press('Escape');
  }
  await page.goto(base+'/#schedule');await loaded();
  await page.locator('[data-present-schedule-summary]').first().click();await screenPalette('brown');
  for(let slide=0;slide<20;slide++){
    for(const mode of ['light','dark']){
      const light=await page.locator('#presentation-shell').evaluate(node=>node.classList.contains('is-light'));
      if(light!==(mode==='light'))await page.locator('[data-presentation-theme]').click();
      await page.waitForTimeout(400);
      const leaks=await page.locator('#presentation-stage').evaluate(root=>[...root.querySelectorAll('*')].flatMap(node=>{
        const style=getComputedStyle(node),value=style.backgroundColor+' '+style.backgroundImage;
        return [...value.matchAll(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/g)].filter(m=>+m[2]>+m[1]*1.18&&+m[2]>+m[3]*1.1&&m[4]!=='0').map(()=>node.className);
      }));
      assert.deepEqual(leaks,[],'Schedule slide '+slide+' '+mode+' has no fixed green panel');
      if(await page.locator('.presentation-reminder-copy').count())await page.screenshot({path:path.join(screenshotDir,'reminder-'+mode+'.png')});
    }
    if(await page.locator('[data-presentation-next]').isDisabled())break;
    await page.locator('[data-presentation-next]').click();
  }
  await page.locator('[data-presentation-close]').click();
  await page.goto(base);await loaded();await page.setViewportSize({width:390,height:900});
  await page.clock.install({time:new Date('2026-10-16T15:59:55Z')});
  await welcome();
  assert.equal(await page.locator('.welcome-screen h2').textContent(),'Selamat Datang');
  await page.clock.fastForward(16000);
  assert.equal(await page.locator('.welcome-screen h2').textContent(),'Selamat Hari Sabat','Open welcome updates at Saturday midnight WITA');
  await page.mouse.move(20,200);
  await page.locator('[data-presentation-projector]').click();
  await page.waitForTimeout(400);
  const welcomeFrame=await page.locator('#presentation-frame').boundingBox();
  for(const selector of ['.welcome-screen h2','.welcome-reminder']){
    const box=await page.locator(selector).boundingBox();
    assert.ok(box.y>=welcomeFrame.y&&box.y+box.height<=welcomeFrame.y+welcomeFrame.height,selector+' fits mobile projector frame');
  }
  await page.screenshot({path:path.join(screenshotDir,'welcome-sabbath.png')});
  await page.locator('[data-presentation-close]').click();
  await settings();await page.locator('[data-reset-palette]').click();
  assert.equal(await page.locator('html').getAttribute('data-palette'),'green');
  await page.locator('[data-theme-value="system"]').click();
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  console.log('PASS: song/Bible fullscreen, projector, live Sabbath rollover, reset, system mode.');
  assert.deepEqual(errors,[]);
  console.log('PASS: themed routes at four widths; visible news photos; fullscreen palettes, contrast, keyboard focus and exit.');
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
