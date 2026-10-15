import assert from 'node:assert/strict';
import fs from 'node:fs';
import {previewRevision,sitePreview} from '../scripts/social-preview.mjs';
import {GET as berita} from '../api/berita.js';
import legacyPreview from '../api/og.js';
import {GET as newsPreview} from '../api/news-og.js';

const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('public-dist/social-revision.json',root)));
assert.equal(manifest.revision,previewRevision(),'Built metadata uses the current design hash');
const html=fs.readFileSync(new URL('public-dist/index.html',root),'utf8');
assert.equal((html.match(new RegExp(manifest.imagePath,'g'))||[]).length,4,'OG, Twitter and schema share the versioned image');
const png=fs.readFileSync(new URL('public-dist'+manifest.imagePath,root));
assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
for(const method of ['GET','HEAD','POST']){
  const result={headers:{},setHeader(key,value){this.headers[key]=value;},status(code){this.code=code;return this;},end(body){this.body=body;return this;}};
  legacyPreview({method},result);
  assert.equal(result.code,method==='POST'?405:200);
  if(method==='GET'){assert.deepEqual(result.body,png);assert.match(result.headers['Cache-Control'],/must-revalidate/);assert.ok(!result.headers['Cache-Control'].includes('immutable'));}
  else assert.equal(result.body,undefined);
}
const response=await sitePreview();
assert.match(response.headers.get('Cache-Control'),/must-revalidate/);
assert.ok(!response.headers.get('Cache-Control').includes('immutable'),'Renderer must replace its default immutable cache header');
assert.ok((await response.arrayBuffer()).byteLength>10000);
const fetchOriginal=globalThis.fetch;
let activity={id:'test-id',title:'Judul & foto',description:'Kabar jemaat',coverUrl:'https://example.org/cover-a.jpg',updatedAt:'first'};
globalThis.fetch=async()=>Response.json({ok:true,data:{activities:[activity]}});
try{
  const request=()=>new Request('https://gmahk-galilea.vercel.app/api/berita?id=test-id',{headers:{host:'gmahk-galilea.vercel.app'}});
  const first=await berita(request());
  assert.match(first.headers.get('Cache-Control'),/s-maxage=0/);
  const firstHtml=await first.text();
  const image=html=>html.match(/property="og:image" content="([^"]+)"/)[1];
  activity={...activity,coverUrl:'https://example.org/cover-b.jpg',updatedAt:'second'};
  const secondHtml=await (await berita(request())).text();
  assert.notEqual(image(firstHtml),image(secondHtml),'Editing a story changes its image URL');
  assert.match(image(secondHtml),/news-og\?id=test-id&amp;v=[a-f0-9]{16}/);
  assert.match(secondHtml,/Judul &amp; foto/);
  activity={...activity,coverUrl:''};
  const news=await newsPreview(new Request('https://gmahk-galilea.vercel.app/api/news-og?id=test-id',{headers:{host:'gmahk-galilea.vercel.app'}}));
  assert.ok(!news.headers.get('Cache-Control').includes('immutable'));
  assert.ok((await news.arrayBuffer()).byteLength>10000);
}finally{globalThis.fetch=fetchOriginal;}
console.log('PASS: current design metadata, 1200x630 PNG, revalidation, content-versioned news images.');
