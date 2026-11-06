import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {previewRevision,sitePreview} from './social-preview.mjs';

const root = new URL('../',import.meta.url);
const output = new URL('public-dist/',root);
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
for (const entry of readdirSync(root,{withFileTypes:true})) {
  if (entry.isFile() && /\.(html|css|js|webmanifest|txt|xml)$/.test(entry.name)) cpSync(new URL(entry.name,root),new URL(entry.name,output));
}
for (const directory of ['assets','vendor','majelis-galilea']) cpSync(new URL(directory,root),new URL(directory,output),{recursive:true});
const revision = previewRevision();
const imagePath = '/assets/social/galilea-'+revision+'.png';
mkdirSync(new URL('assets/social/',output),{recursive:true});
// A captured browser screenshot takes priority over the old illustrated fallback.
// It is refreshed separately by the scheduled GitHub Actions workflow.
const screenshot = new URL('assets/social/home-latest.png',root);
let png;
if (existsSync(screenshot)) {
  png = readFileSync(screenshot);
  if (png.subarray(1,4).toString() !== 'PNG' || png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    throw new Error('Home thumbnail must be a valid 1200x630 PNG screenshot.');
  }
} else {
  const response = await sitePreview();
  png = Buffer.from(await response.arrayBuffer());
  console.warn('No home screenshot yet; using the previous social-preview image.');
}
writeFileSync(new URL('.'+imagePath,output),png);
writeFileSync(new URL('assets/social/current.png',output),png);
const source = readFileSync(new URL('index.html',root),'utf8');
const html = source.replaceAll('https://gmahk-galilea.vercel.app/api/og','https://gmahk-galilea.vercel.app'+imagePath);
writeFileSync(new URL('index.html',output),html);
writeFileSync(new URL('social-revision.json',output),JSON.stringify({revision,imagePath}));
console.log('Built '+fileURLToPath(output)+' with social preview '+revision);
