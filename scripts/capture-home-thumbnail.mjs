import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {chromium} from 'playwright';

const target = resolve('assets/social/home-latest.png');
const home = 'https://gmahk-galilea.vercel.app/#home';
const browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
  const page = await browser.newPage({
    viewport:{width:1200,height:630},
    deviceScaleFactor:1,
    colorScheme:'light',
    reducedMotion:'reduce',
    locale:'id-ID',
    timezoneId:'Asia/Makassar',
    serviceWorkers:'block'
  });
  await page.goto(home,{waitUntil:'domcontentloaded',timeout:45000});
  // Do not publish the loader, an error screen, or partially rendered content.
  await page.waitForFunction(() => {
    const loader=document.getElementById('loader');
    const app=document.getElementById('app');
    return !!app && (!loader || loader.classList.contains('hidden')) &&
      !app.querySelector('[data-startup-loading]') &&
      (app.textContent||'').trim().length>100;
  },null,{timeout:45000});
  const text=await page.locator('#app').innerText();
  if (/informasi jemaat belum terhubung|coba muat ulang|terjadi kesalahan/i.test(text)) {
    throw new Error('Home rendered an error message; keeping the previous thumbnail.');
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter(img=>{
      const box=img.getBoundingClientRect();
      return box.bottom>0 && box.top<window.innerHeight;
    }).map(img=>img.complete?Promise.resolve():new Promise(resolve=>{
      img.addEventListener('load',resolve,{once:true});
      img.addEventListener('error',resolve,{once:true});
      setTimeout(resolve,5000);
    })));
  });
  await page.waitForTimeout(1200);
  const png=await page.screenshot({type:'png',animations:'disabled',caret:'hide'});
  if(png.subarray(1,4).toString()!=='PNG'||png.readUInt32BE(16)!==1200||png.readUInt32BE(20)!==630)
    throw new Error('Unexpected screenshot dimensions or format.');
  const old=await readFile(target).catch(e=>{
    if(e.code==='ENOENT') return null;
    throw e;
  });
  if(old){
    // Reduce needless Git commits and Vercel builds caused by tiny changes
    // such as clocks and anti-aliasing. Larger Home changes are captured.
    const changed=await page.evaluate(async ({before,after})=>{
      const decode=async encoded=>{
        const raw=atob(encoded);
        const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
        return await createImageBitmap(new Blob([bytes],{type:'image/png'}));
      };
      const a=await decode(before), b=await decode(after);
      const sample=bitmap=>{
        const canvas=document.createElement('canvas');
        canvas.width=120;canvas.height=63;
        const context=canvas.getContext('2d',{willReadFrequently:true});
        context.drawImage(bitmap,0,0,120,63);
        return context.getImageData(0,0,120,63).data;
      };
      const aa=sample(a),bb=sample(b);
      let differences=0;
      for(let i=0;i<aa.length;i+=4){
        if((Math.abs(aa[i]-bb[i])+Math.abs(aa[i+1]-bb[i+1])+Math.abs(aa[i+2]-bb[i+2]))/3>22) differences++;
      }
      a.close();b.close();
      return differences/(120*63);
    },{before:old.toString('base64'),after:png.toString('base64')});
    if(changed<0.01){
      console.log('Home remains visually similar ('+(changed*100).toFixed(2)+'% changed); keeping previous screenshot.');
      process.exitCode=0;
    }else{
      await mkdir(dirname(target),{recursive:true});
      await writeFile(target,png);
      console.log('Home screenshot updated (changed '+(changed*100).toFixed(2)+'%).');
    }
  }else{
    await mkdir(dirname(target),{recursive:true});
    await writeFile(target,png);
    console.log('Initial Home screenshot captured.');
  }
} finally {
  await browser.close();
}
