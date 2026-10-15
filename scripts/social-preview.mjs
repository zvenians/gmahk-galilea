import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';

const root = new URL('../',import.meta.url);
export function previewRevision() {
  const hash = createHash('sha256');
  const inputs = readdirSync(root).filter(name=>/\.(html|css|js)$/.test(name)).sort();
  for (const file of inputs) hash.update(readFileSync(new URL(file,root)));
  const assets = new URL('assets/',root);
  for (const file of readdirSync(assets,{recursive:true,withFileTypes:true}).filter(entry=>entry.isFile()).sort((a,b)=>(a.parentPath+'/'+a.name).localeCompare(b.parentPath+'/'+b.name))) hash.update(readFileSync(file.parentPath+'/'+file.name));
  hash.update(readFileSync(new URL(import.meta.url)));
  return hash.digest('hex').slice(0,16);
}
export async function sitePreview() {
  const require = createRequire(import.meta.url);
  globalThis.require ??= require;
  globalThis.__dirname ??= dirname(require.resolve('harfbuzzjs'));
  const {ImageResponse} = await import('@vercel/og');
  const css = readFileSync(new URL('appearance.css',root),'utf8').split('}')[0];
  const tone = number => css.match(new RegExp('--tone-'+number+':(#[0-9a-f]+)','i'))[1];
  const logo = 'data:image/png;base64,'+readFileSync(new URL('assets/logo-galilea-icon-192.png',root)).toString('base64');
  const element = (type,style,children) => ({type,props:{style,children}});
  return new ImageResponse(element('div',{
    display:'flex',width:'100%',height:'100%',padding:64,background:tone(900),color:tone(50),fontFamily:'sans-serif',flexDirection:'column',justifyContent:'space-between',borderLeft:'18px solid '+tone(600)
  },[
    element('div',{display:'flex',alignItems:'center',gap:22},[
      {type:'img',props:{src:logo,width:76,height:76,style:{borderRadius:16}}},
      element('div',{display:'flex',flexDirection:'column',gap:6},[
        element('span',{fontSize:26},'GMAHK Galilea Balikpapan'),
        element('span',{fontSize:19,color:tone(300)},'Website resmi jemaat')
      ])
    ]),
    element('div',{display:'flex',flexDirection:'column',gap:20},[
      element('div',{display:'flex',fontSize:80,lineHeight:1.08,maxWidth:950},'Selamat datang di Jemaat Galilea.'),
      element('div',{display:'flex',fontSize:27,color:tone(100)},'Jadwal ibadah · Alkitab · Lagu Sion · Berita jemaat')
    ]),
    element('div',{display:'flex',fontSize:20,color:tone(300),borderTop:'1px solid '+tone(600),paddingTop:22},'gmahk-galilea.vercel.app')
  ]),{width:1200,height:630,headers:{'Cache-Control':'public, max-age=0, s-maxage=0, must-revalidate'}});
}
