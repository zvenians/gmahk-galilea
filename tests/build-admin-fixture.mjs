import fs from 'node:fs';
import path from 'node:path';

const output=process.argv[2];
if(!output)throw new Error('Pass a temporary output directory for the isolated browser fixture.');
fs.mkdirSync(output,{recursive:true});
const source=fs.readFileSync(new URL('../apps-script-backend/Admins.html',import.meta.url),'utf8');
const mock=`<script>
const entities=[{key:'activities',label:'Berita Jemaat',icon:'newspaper'},{key:'gallery',label:'Galeri',icon:'image'},{key:'announcements',label:'Agenda dan Pengumuman',icon:'bell'},{key:'themeSong',label:'Lagu Tema',icon:'music'},{key:'worshipPlans',label:'Susunan Ibadah',icon:'layout'},{key:'leaders',label:'Pengurus Gereja',icon:'users'},{key:'banners',label:'Pengumuman Terjadwal',icon:'flag'},{key:'settings',label:'Pengaturan',icon:'settings'},{key:'schedule',label:'Jadwal Pelayanan',icon:'calendar'}];
const dashboard={pendingApprovals:0,myDrafts:0,activeAnnouncements:2,serviceRequests:0,scheduleSheet:'Jadwal Triwulan',updatedAt:'Mode uji',systemStatus:'Data contoh',loading:false};
const user={name:'Pengurus (contoh)',email:'fixture@example.test',role:'SUPERADMIN',permissions:{edit:true,approve:true,manageAdmins:true}};
const fields=[{key:'title',label:'Judul',type:'text',required:true},{key:'description',label:'Isi Berita',type:'textarea',required:true}];
let drafts=[];
function fixtureResponse(method,args){
 if(method==='adminGetBootstrap')return{user,entities,dashboard,publicSite:{publicUrl:'https://gmahk-galilea.vercel.app/'}};
 if(method==='adminGetDashboardSummary')return{dashboard};
 if(method==='adminGetNotifications')return{count:0,items:[],checkedAt:'Mode uji'};
 if(method==='adminListEntity')return{entity:args[0],label:entities.find(x=>x.key===args[0])?.label||args[0],fields,records:[],workflows:args[0]==='activities'?drafts:[]};
 if(method==='adminSaveWorkflow'){const value=args[0];drafts=[{id:'TEST-DRAFT',entity:'activities',entityId:'',action:'UPSERT',state:'DRAFT',ownerEmail:user.email,ownerName:user.name,updatedAt:'Mode uji',payload:value.payload}];document.querySelector('#fixture-payload').textContent=JSON.stringify(value.payload);dashboard.myDrafts=1;return{message:'Draf disimpan di memori uji; tidak dikirim ke server.'};}
 if(method==='adminListApprovals'||method==='adminListUsers'||method==='adminListServices')return[];
 if(method==='adminGetDashboardActivity')return{audit:[],health:[]};
 throw new Error('Fixture tidak mengaktifkan operasi '+method);
}
const runner=new Proxy({withSuccessHandler(fn){return makeRunner(fn)},withFailureHandler(){return this}},{get(target,key){return key in target?target[key]:(...args)=>{}}});
function makeRunner(success,failure){return new Proxy({withSuccessHandler(fn){return makeRunner(fn,failure)},withFailureHandler(fn){return makeRunner(success,fn)}},{get(target,key){return key in target?target[key]:(...args)=>{try{success(fixtureResponse(key,args))}catch(e){failure?.(e)}}}})}
window.google={script:{run:runner}};
</script><div style="position:fixed;bottom:0;left:0;z-index:200;background:#173a25;color:#fff;padding:5px 12px;font:12px system-ui">Mode uji · Data contoh · Penyimpanan lokal sementara <output id="fixture-payload" hidden></output></div>`;
let html=source.replace(/<\?!= JSON\.stringify\(appUrl \|\| ''\) \?>/,JSON.stringify('https://gmahk-galilea.vercel.app/')).replace('<body>','<body>'+mock).replace('https://gmahk-galilea.vercel.app/assets/admin-valley.webp','./admin-valley.webp');
fs.writeFileSync(path.join(output,'admin-fixture.html'),html);
fs.copyFileSync(new URL('../assets/admin-valley.webp',import.meta.url),path.join(output,'admin-valley.webp'));
fs.writeFileSync(path.join(output,'admin-layout.html'),`<!doctype html><html><meta charset="utf-8"><title>Admin layout QA</title><body style="margin:0;background:#ddd;font:14px system-ui"><label>Ukuran uji <select id="size"><option>1366x900</option><option>1920x1080</option><option>980x900</option><option>420x900</option><option>320x900</option></select></label><iframe title="Admin fixture" src="./admin-fixture.html" style="display:block;width:1366px;height:900px;border:0"></iframe><script>document.querySelector('select').onchange=e=>{const [w,h]=e.target.value.split('x');const f=document.querySelector('iframe');f.style.width=w+'px';f.style.height=h+'px'}</script></body></html>`);
console.log(path.join(output,'admin-fixture.html'));
