    (function () {
      'use strict';

      // Browser yang menolak storage tetap bisa membuka halaman.
      const startupMemory = {};
      const safeStorage = {
        get(key, fallback) {
          try {
            const value = window.localStorage.getItem(key);
            return value == null ? (fallback == null ? '' : fallback) : value;
          } catch (_) { return Object.prototype.hasOwnProperty.call(startupMemory,key) ? startupMemory[key] : (fallback == null ? '' : fallback); }
        },
        set(key, value) {
          startupMemory[key] = String(value);
          try { window.localStorage.setItem(key,String(value)); } catch (_) {}
        },
        remove(key) {
          delete startupMemory[key];
          try { window.localStorage.removeItem(key); } catch (_) {}
        }
      };
      function releaseStartupLoader(message) {
        const loader = document.getElementById('loader');
        if (!loader) return;
        loader.classList.add('hidden');
        if (!message) return;
        const app = document.getElementById('app');
        if (app && (!app.childElementCount || app.querySelector('[data-startup-loading]'))) app.innerHTML = '<section class="view" style="min-height:72vh;display:grid;place-items:center;padding:140px 28px 40px"><div style="max-width:680px;text-align:center"><h1 style="margin-bottom:14px">Informasi jemaat belum terhubung.</h1><p style="color:var(--text-soft)">' + String(message).replace(/[&<>]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]}) + '</p><button class="btn primary" type="button" onclick="location.reload()">Coba muat ulang</button></div></section>';
      }
      const startupGuard = window.setTimeout(function () {
        releaseStartupLoader('Koneksi ke data gereja membutuhkan waktu lebih lama dari biasanya. Silakan muat ulang halaman.');
      },8000);
      window.setTimeout(function () {
        const app = document.getElementById('app');
        if (app && !app.childElementCount) app.innerHTML = '<section class="section" data-startup-loading style="padding-top:140px"><div class="shell">' + loadingBox('Memuat informasi jemaat','Anda tetap bisa membuka menu sambil menunggu.') + '</div></section>';
        releaseStartupLoader();
      },safeStorage.get('galilea:visited','') ? 0 : 650);
      safeStorage.set('galilea:visited','1');
      window.addEventListener('error',function (event) { releaseStartupLoader(event.message || 'Terjadi gangguan saat membuka viewer.'); });
      window.addEventListener('unhandledrejection',function (event) {
        const reason = event.reason && event.reason.message ? event.reason.message : 'Permintaan data belum berhasil.';
        releaseStartupLoader(reason);
      });

      const APP_URL = window.location.origin;
      const PALETTES = [
        ['green','Hijau Galilea','#39714c'],['red','Merah','#9a3a4f'],
        ['navy','Biru tua','#2c5d94'],['brown','Coklat','#886046'],
        ['purple','Ungu','#715191'],['teal','Teal','#287b7b'],['slate','Abu-abu','#586574'],
        ['pink','Pink','#a43970'],['orange','Oranye','#9c4b21'],['amber','Emas','#80651c'],
        ['olive','Zaitun','#5a6a32'],['sky','Biru langit','#28627f'],['indigo','Nila','#474d94']
      ];
      const ROUTES = ['home','today','church','aboutsite','leaders','schedule','bulletin','sabbath','bible','hymnal','hymnal-scores','favorites','visitor','activities','announcements','gallery','services','faq','contact'];
      const MOBILE_GROUPS = [
        {label:'Akses cepat',items:[
          ['home','home','Beranda','Ringkasan hari ini'],['today','church','Pusat Ibadah','Tema, lagu & susunan acara'],['schedule','calendar','Jadwal','Pelayanan terdekat'],['bible','book','Alkitab','Baca firman'],['hymnal','music','Lagu Sion','Pujian jemaat']
        ]},
        {label:'Informasi Gereja',items:[
          ['church','church','Gereja','Tentang jemaat'],['leaders','users','Pengurus','Pelayan gereja'],['announcements','bell','Agenda dan Pengumuman','Informasi ibadah mendatang'],['activities','calendar','Berita Jemaat','Kegiatan yang sudah berlangsung'],['gallery','image','Galeri','Dokumentasi'],['aboutsite','info','Tentang Website','Cerita desain dan tujuan']
        ]},
        {label:'Materi Ibadah',items:[
          ['welcome','church','Layar Sambutan','Sambutan sesuai hari'],['bulletin','file','Warta Digital','Susunan ibadah & kabar'],['sabbath','book','Sekolah Sabat','Pelajaran mingguan'],['hymnal-scores','file','Lagu Sion (Partiture)','Lirik & PDF jemaat'],['favorites','star','Tersimpan','Favorit & terakhir dibaca']
        ]},
        {label:'Pelayanan',items:[
          ['visitor','map','Panduan Pengunjung','Untuk kunjungan pertama'],['services','heart','Layanan Jemaat','Kirim permohonan'],['contact','phone','Kontak','Alamat & WhatsApp'],['faq','help','FAQ','Bantuan website']
        ]}
      ];
      const state = {
        data: null,
        route: 'home',
        scheduleTab: 'summary',
        scheduleFilter: 'upcoming',
        sabbathTab: 'lesson',
        sabbathYear: new Date().getFullYear(),
        sabbathQuarter: Math.floor(new Date().getMonth() / 3) + 1,
        bibleBooks: [],
        bibleTestament: '',
        bibleTargetVerse: null,
        bibleReader: null,
        bibleSearchResults: [],
        bibleSearchToken: 0,
        bibleSearchBusy: false,
        hymnal: null,
        hymnalReader: {song:null,verseIndex:0},
        presentation: {type:'',index:0,scale:1,fittedScale:1,item:null,blackout:false,projector:false,theme:'dark'},
        archives: null,
        faqQuery: '',
        faqCategory: 'Semua',
        favorites: [],
        recents: [],
        deferredInstall: null,
        witaDayKey: '',
        dayWatcher: null,
        language: safeStorage.get('galilea:language','id') || 'id',
        translationTimer: null,
        translationRun: 0,
        translationCaches: {},
        translationObserver: null,
        searchToken: 0,
        async: {}
      };

      let presentationControlsTimer = 0;
      let presentationKeyboardControls = false;
      let presentationFitFrame = 0;
      let presentationFitTimer = 0;
      let presentationTransitionTimer = 0;
      let presentationWakeLock = null;
      let presentationPointer = null;
      let presentationResizeObserver = null;
      let presentationWelcomeTimer = 0;

      const $ = (selector, context) => (context || document).querySelector(selector);
      const $$ = (selector, context) => Array.from((context || document).querySelectorAll(selector));
      const icon = name => '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
      const esc = value => String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      const attr = value => esc(value).replace(/`/g, '&#096;');
      function cleanHtml(value) {
        if (!value) return '';
        const temp = document.createElement('div');
        temp.innerHTML = String(value);
        const allowedTags = ['P', 'STRONG', 'B', 'EM', 'I', 'U', 'BR', 'UL', 'OL', 'LI', 'A'];

        function traverse(node) {
          const children = Array.prototype.slice.call(node.childNodes);
          for (let i = 0; i < children.length; i++) traverse(children[i]);

          if (node.nodeType === 3) return;
          if (node.nodeType !== 1) {
            node.parentNode.removeChild(node);
            return;
          }
          const tag = node.nodeName.toUpperCase();
          const dangerousTags = ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'HEAD', 'META', 'LINK'];
          if (dangerousTags.indexOf(tag) !== -1) {
            node.parentNode.removeChild(node);
            return;
          }

          if (allowedTags.indexOf(tag) === -1) {
            while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node);
            node.parentNode.removeChild(node);
          } else {
            const attrs = Array.prototype.slice.call(node.attributes);
            for (let i = 0; i < attrs.length; i++) {
              const attrName = attrs[i].name.toLowerCase();
              if (tag === 'A' && attrName === 'href') {
                const hrefVal = node.getAttribute('href').trim();
                if (!/^https:\/\//i.test(hrefVal) || /^(javascript:|data:|vbscript:)/i.test(hrefVal)) {
                  node.removeAttribute('href');
                }
              } else {
                node.removeAttribute(attrs[i].name);
              }
            }
          }
        }

        const children = Array.prototype.slice.call(temp.childNodes);
        for (let i = 0; i < children.length; i++) traverse(children[i]);
        return temp.innerHTML;
      }
      const safeUrl = value => /^https:\/\//i.test(String(value || '')) ? String(value) : '';
      const initials = value => String(value || '').split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase();
      function googleDriveFileId(value) {
        const source = safeUrl(value);
        if (!source) return '';
        try {
          const url = new URL(source);
          const host = url.hostname.toLowerCase();
          if (host !== 'drive.google.com' && host !== 'drive.usercontent.google.com') return '';
          const pathMatch = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,128})/);
          const id = url.searchParams.get('id') || (pathMatch && pathMatch[1]) || '';
          return /^[A-Za-z0-9_-]{10,128}$/.test(id) ? id : '';
        } catch (_) { return ''; }
      }
      function leaderPhotoSources(value) {
        const source = safeUrl(value);
        const driveId = googleDriveFileId(source);
        return driveId ? {
          primary: 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(driveId) + '=w800',
          fallback: '/api/media?id=' + encodeURIComponent(driveId)
        } : {primary: source, fallback: ''};
      }
      function leaderAvatar(leader) {
        const label = String(leader && leader.name || 'Pengurus Galilea');
        const letters = initials(label) || 'GG';
        const photo = leaderPhotoSources(leader && leader.photoUrl);
        return '<div class="avatar" role="img" aria-label="Foto ' + attr(label) + '"><span class="avatar-fallback" aria-hidden="true">' + esc(letters) + '</span>' + (photo.primary ? '<img src="' + attr(photo.primary) + '"' + (photo.fallback ? ' data-avatar-fallback="' + attr(photo.fallback) + '"' : '') + ' data-avatar-image alt="" loading="lazy" decoding="async">' : '') + '</div>';
      }
      const routeTitle = route => ({home:'Beranda',today:state.data&&selectedWorshipPlan()?.isToday?'Ibadah Hari Ini':'Ibadah Berikutnya',church:'Gereja',aboutsite:'Tentang Website',leaders:'Pengurus',schedule:'Jadwal Ibadah',bulletin:'Warta Digital',sabbath:'Sekolah Sabat',bible:'Alkitab',hymnal:'Lagu Sion','hymnal-scores':'Lagu Sion (Partiture)',favorites:'Tersimpan',visitor:'Panduan Pengunjung',activities:'Berita Jemaat',announcements:'Agenda dan Pengumuman',gallery:'Galeri',services:'Layanan Jemaat',faq:'FAQ',contact:'Kontak'})[route] || 'Galilea';
      const ROUTE_DESCRIPTIONS = {
        home:'Website resmi GMAHK Galilea Balikpapan untuk jadwal ibadah, Sekolah Sabat, Alkitab, Lagu Sion, warta, dan informasi pelayanan jemaat.',
        today:'Tema, ayat, lagu, susunan acara, dan informasi Ibadah Hari Ini GMAHK Galilea Balikpapan.',
        church:'Profil, sejarah, dan pelayanan GMAHK Galilea Balikpapan.',aboutsite:'Cerita di balik warna, logo, dan tujuan Website GMAHK Galilea Balikpapan.',leaders:'Daftar pengurus dan pelayan GMAHK Galilea Balikpapan.',
        schedule:'Jadwal Ibadah Sabat, Rabu Malam, Sekolah Sabat, dan pembagian pelayanan GMAHK Galilea Balikpapan.',
        bulletin:'Warta Jemaat digital GMAHK Galilea Balikpapan yang dapat dibaca, dibagikan, dan diunduh.',
        sabbath:'Pelajaran Sekolah Sabat, Berita Misi, Bacaan Persembahan, dan Penginjilan Perorangan Advent.',
        bible:'Baca Alkitab Bahasa Indonesia dengan mode layar besar untuk ibadah.',hymnal:'Lagu Sion dan Lagu Tema GMAHK Galilea dengan lirik serta mode layar besar.',
        'hymnal-scores':'Cari Lagu Sion berdasarkan nomor atau judul, lalu baca lirik bersama PDF partitur jemaat di perangkat Anda.',
        announcements:'Agenda dan Pengumuman GMAHK Galilea untuk Rabu Malam, Ibadah Khotbah, Sekolah Sabat, dan Pemuda Advent.',
        activities:'Berita kegiatan dan pelayanan Jemaat Galilea Balikpapan.',gallery:'Galeri kegiatan GMAHK Galilea Balikpapan.',
        services:'Permohonan doa, kunjungan, kelas Alkitab, baptisan, dan layanan Jemaat Galilea.',faq:'Panduan penggunaan Website GMAHK Galilea.',contact:'Alamat, jadwal, peta, dan kontak GMAHK Galilea Balikpapan.'
      };
      function syncSeoMetadata(route,site){
        const churchName=site&&site.church_name||'GMAHK Galilea Balikpapan',title=route==='home'?churchName+' · Website Resmi':routeTitle(route)+' · '+churchName;
        const description=route==='home'&&site&&site.seo_description?site.seo_description:(ROUTE_DESCRIPTIONS[route]||ROUTE_DESCRIPTIONS.home);
        document.title=title;
        const values=[['meta[name="description"]','content',description],['meta[property="og:title"]','content',title],['meta[property="og:description"]','content',description],['meta[name="twitter:title"]','content',title],['meta[name="twitter:description"]','content',description]];
        values.forEach(entry=>{const node=$(entry[0]);if(node)node.setAttribute(entry[1],entry[2]);});
      }

      function readStoredList(key) {
        try { const parsed=JSON.parse(safeStorage.get(key,'[]')); return Array.isArray(parsed)?parsed:[]; } catch(_){ return []; }
      }
      function savePersonalLists() {
        safeStorage.set('galilea:favorites',JSON.stringify(state.favorites.slice(0,80)));
        safeStorage.set('galilea:recents',JSON.stringify(state.recents.slice(0,20)));
      }
      function personalId(type,id){return String(type||'item')+':'+String(id||'');}
      function isFavorite(type,id){return state.favorites.some(item=>item.key===personalId(type,id));}
      function rememberItem(item) {
        if(!item||!item.id)return;
        const entry={key:personalId(item.type,item.id),type:item.type,id:String(item.id),title:String(item.title||'Bacaan'),subtitle:String(item.subtitle||''),route:String(item.route||'home'),savedAt:Date.now()};
        state.recents=[entry].concat(state.recents.filter(existing=>existing.key!==entry.key)).slice(0,20);savePersonalLists();
      }
      function toggleFavorite(item) {
        if(!item||!item.id)return;
        const key=personalId(item.type,item.id),index=state.favorites.findIndex(entry=>entry.key===key);
        if(index>=0){state.favorites.splice(index,1);toast('Dihapus dari tersimpan.');}
        else{state.favorites.unshift({key,type:item.type,id:String(item.id),title:String(item.title||'Bacaan'),subtitle:String(item.subtitle||''),route:String(item.route||'home'),savedAt:Date.now()});toast('Disimpan di perangkat ini.');}
        savePersonalLists();
        $$('[data-favorite-key="'+CSS.escape(key)+'"]').forEach(button=>{button.classList.toggle('active',isFavorite(item.type,item.id));button.innerHTML=icon('star')+(isFavorite(item.type,item.id)?'Tersimpan':'Simpan');});
      }
      function favoriteButton(item){const key=personalId(item.type,item.id);return '<button class="btn v18-fav-button '+(isFavorite(item.type,item.id)?'active':'')+'" type="button" data-favorite-key="'+attr(key)+'" data-favorite-item="'+attr(JSON.stringify(item))+'">'+icon('star')+(isFavorite(item.type,item.id)?'Tersimpan':'Simpan')+'</button>';}
      function eventStatus(summary) {
        if(!summary||!summary.timestamp)return {label:'Jadwal berikutnya',detail:'Jadwal terbaru tersedia di halaman ibadah'};
        const start=Number(new Date(summary.timestamp)),now=Date.now(),diff=start-now;
        if(diff<=0&&diff>-2.5*3600000)return {label:'Sedang berlangsung',detail:(summary.dateLabel||'Hari ini')+' · '+(summary.time||'')};
        if(diff>0&&diff<24*3600000){const hours=Math.floor(diff/3600000),minutes=Math.max(1,Math.round((diff%3600000)/60000));return {label:'Dimulai dalam '+(hours?hours+' jam ':'')+minutes+' menit',detail:(summary.dateLabel||'Hari ini')+' · '+(summary.time||'')};}
        return {label:summary.countdown||'Ibadah berikutnya',detail:(summary.dateLabel||'')+' · '+(summary.time||'')};
      }
      function archiveYear(item){const match=String(item.dateLabel||item.date||item.createdAt||'').match(/20\d{2}/);return match?match[0]:'Lainnya';}
      function archiveCategory(item){return String(item.category||item.location||'Umum').trim()||'Umum';}

      async function server(name, args, timeoutMs) {
        const controller = new AbortController();
        const timeout = Math.max(8000,Number(timeoutMs) || 22000);
        const timer = window.setTimeout(() => controller.abort(),timeout);
        try {
          const response = await fetch('/api/gas',{
            method:'POST',
            headers:{'Content-Type':'application/json','Accept':'application/json'},
            body:JSON.stringify({method:name,args:Array.isArray(args) ? args : []}),
            cache:'no-store',
            credentials:'same-origin',
            signal:controller.signal
          });
          let payload = null;
          try { payload = await response.json(); }
          catch (_) { throw new Error('Respons server tidak dapat dibaca. Silakan coba lagi.'); }
          if (!response.ok || !payload || payload.ok !== true) {
            throw new Error(payload && payload.error ? payload.error : 'Data belum dapat dimuat.');
          }
          return payload.data;
        } catch (error) {
          if (error && error.name === 'AbortError') throw new Error('Koneksi membutuhkan waktu terlalu lama. Silakan coba lagi.');
          throw error instanceof Error ? error : new Error(String(error || 'Terjadi gangguan koneksi.'));
        } finally {
          window.clearTimeout(timer);
        }
      }

      const WORSHIP_CACHE_TTL = 3 * 60 * 60 * 1000;
      const resourceLoads = new Map();
      // Public reading data stays fresh for an entire service. Live broadcasts and
      // date-sensitive devotionals retain their existing, shorter refresh policy.
      function resourceTtl(key, ttl) {
        return /awr|discussion|devotional/.test(key) ? (ttl || 900000) : Math.max(WORSHIP_CACHE_TTL,ttl || 0);
      }
      function cacheGet(key) {
        try {
          const item = JSON.parse(safeStorage.get('galilea:' + key,'null') || 'null');
          return item && Number.isFinite(item.time) && Date.now() >= item.time && Date.now() - item.time < resourceTtl(key,item.ttl) ? item.value : null;
        } catch (_) { return null; }
      }
      function cachePeek(key) {
        try {
          const item = JSON.parse(safeStorage.get('galilea:' + key,'null') || 'null');
          return item && Object.prototype.hasOwnProperty.call(item,'value') ? item.value : null;
        } catch (_) { return null; }
      }
      async function cachedResource(key, loader, ttl) {
        const fresh = cacheGet(key);
        if (fresh != null) return fresh;
        const stored = cachePeek(key);
        if (navigator.onLine === false && stored != null) return stored;
        if (!resourceLoads.has(key)) {
          const pending = Promise.resolve().then(loader).then(value => {
            cacheSet(key,value,ttl);return value;
          }).finally(() => resourceLoads.delete(key));
          resourceLoads.set(key,pending);
        }
        const pending = resourceLoads.get(key);
        // Expired data is still useful: never block a service waiting for refresh.
        if (stored != null) { pending.catch(() => {}); return stored; }
        return pending;
      }
      function cacheSet(key, value, ttl) {
        try { safeStorage.set('galilea:' + key, JSON.stringify({time:Date.now(),ttl:resourceTtl(key,ttl),value:value})); } catch (_) {}
      }
      function cacheRemove(key) {
        try { safeStorage.remove('galilea:' + key); } catch (_) {}
      }

      // Same public dataset used by getHymnalCatalog/getHymnalSong on the existing
      // backend. One download replaces 525 per-song round trips; API stays intact.
      const HYMNAL_PACK_KEY = 'hymnal-pack-v1';
      const HYMNAL_PACK_URL = 'https://raw.githubusercontent.com/PaulTitto/LaguSion-indo/main/sda-hymnal-db-in.json';
      let hymnalPack = null, hymnalPackPromise = null, hymnalPackLastAttempt = 0;
      let hymnalPackStatus = 'idle', hymnalPackPersistent = false, songOpenSequence = 0;
      function normalizeHymnalPack(rows) {
        if (!Array.isArray(rows) || rows.length !== 525) throw new Error('Paket Lagu Sion belum lengkap.');
        const clean = value => { const text=String(value==null?'':value).replace(/\s+/g,' ').trim();return text==='-'?'—':text; };
        const numbers = new Set();
        const songs = rows.map(row => {
          const number=Number(row.number), title=clean(row.title);
          if (!Number.isInteger(number) || number<1 || number>525 || numbers.has(number) || !title || !Array.isArray(row.lyrics)) throw new Error('Paket Lagu Sion tidak valid.');
          numbers.add(number);
          const lyrics=row.lyrics.map(part=>({type:clean(part.type||'verse'),index:Number(part.index)||1,lines:(Array.isArray(part.lines)?part.lines:[]).map(clean).filter(Boolean)}));
          if (!lyrics.some(part=>part.lines.length)) throw new Error('Lirik Lagu Sion belum lengkap.');
          return {number,index:clean(row.index),title,lyrics,source:'LaguSion-indo',sourceUrl:'https://github.com/PaulTitto/LaguSion-indo'};
        });
        return {songs};
      }
      function hymnCacheStatusHtml() {
        let message='Menyiapkan unduhan otomatis seluruh Lagu Sion…';
        if(hymnalPackStatus==='loading')message=hymnalPack?'Lagu tersimpan siap dipakai. Memperbarui paket di latar belakang…':'Mengunduh 525 Lagu Sion di latar belakang. Anda tetap bisa memilih lagu.';
        if(hymnalPackStatus==='ready')message=hymnalPackPersistent?'525 Lagu Sion tersimpan di perangkat · cache minimal 3 jam · siap saat reload.':'525 Lagu Sion siap di tab ini. Penyimpanan browser tidak tersedia; reload membutuhkan unduhan ulang.';
        if(hymnalPackStatus==='error')message=hymnalPack?'Pembaruan tertunda. 525 lagu dari simpanan terakhir tetap siap dipakai.':'Paket lagu belum tersimpan. Periksa koneksi; lagu yang dipilih tetap dicoba melalui layanan biasa.';
        return '<div class="notice" data-hymnal-cache-status><div class="notice-copy"><strong>Persiapan Lagu Sion</strong><span role="status" aria-live="polite">'+esc(message)+'</span>'+(hymnalPackStatus==='error'?'<button class="btn soft" type="button" data-retry-hymnal-cache>Coba unduh lagi</button>':'')+'</div></div>';
      }
      function updateHymnalCacheStatus() {
        $$('[data-hymnal-cache-status]').forEach(box=>{box.outerHTML=hymnCacheStatusHtml();});
      }
      function ensureHymnalPack(retry) {
        if (hymnalPackPromise) return hymnalPackPromise;
        const fresh=cacheGet(HYMNAL_PACK_KEY), saved=fresh||cachePeek(HYMNAL_PACK_KEY);
        if (!hymnalPack && saved) {
          try { hymnalPack=normalizeHymnalPack(saved.songs);hymnalPackPersistent=true; } catch (_) { cacheRemove(HYMNAL_PACK_KEY); }
        }
        if (fresh && hymnalPack) { hymnalPackStatus='ready';updateHymnalCacheStatus();return Promise.resolve(hymnalPack); }
        if (!retry && hymnalPackLastAttempt && Date.now()-hymnalPackLastAttempt<60000) return hymnalPack?Promise.resolve(hymnalPack):Promise.reject(new Error('Unduhan akan dicoba kembali saat koneksi tersedia.'));
        hymnalPackLastAttempt=Date.now();
        hymnalPackStatus='loading';updateHymnalCacheStatus();
        hymnalPackPromise=(async()=>{
          const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),15000);
          try {
            const response=await fetch(HYMNAL_PACK_URL,{signal:controller.signal,credentials:'omit',cache:'no-cache'});
            if(!response.ok)throw new Error('Paket Lagu Sion belum dapat diunduh.');
            const pack=normalizeHymnalPack(await response.json());
            hymnalPack=pack;
            // Do not report "saved" when a private/quota-limited browser rejected it.
            const record=JSON.stringify({time:Date.now(),ttl:WORSHIP_CACHE_TTL,value:pack});
            try { window.localStorage.setItem('galilea:'+HYMNAL_PACK_KEY,record);hymnalPackPersistent=window.localStorage.getItem('galilea:'+HYMNAL_PACK_KEY)===record; }
            catch (_) { hymnalPackPersistent=false; }
            hymnalPackStatus='ready';return pack;
          } catch(error) { hymnalPackStatus='error';if(hymnalPack)return hymnalPack;throw error; }
          finally { window.clearTimeout(timer);hymnalPackPromise=null;updateHymnalCacheStatus(); }
        })();
        return hymnalPackPromise;
      }
      function cachedHymnalSong(number) {
        return (hymnalPack&&hymnalPack.songs.find(song=>song.number===Number(number))) || cacheGet('song-'+number) || cachePeek('song-'+number);
      }
      async function getViewerHymnalSong(number) {
        const saved=cachedHymnalSong(number);if(saved)return saved;
        // The selected song may win from either source; never wait for a failed
        // bulk transfer before starting the existing API fallback.
        return Promise.any([
          ensureHymnalPack().then(pack=>{const song=pack.songs.find(item=>item.number===Number(number));if(!song)throw new Error('Lagu tidak ditemukan.');return song;}),
          cachedResource('song-'+number,()=>server('getHymnalSong',[Number(number)]),21600000)
        ]).catch(()=>{throw new Error('Lagu belum tersimpan dan koneksi belum tersedia. Silakan coba lagi.');});
      }
      async function getViewerHymnalCatalog() {
        const catalog=pack=>({count:pack.songs.length,songs:pack.songs.map(({number,index,title})=>({number,index,title})),source:'LaguSion-indo',sourceUrl:'https://github.com/PaulTitto/LaguSion-indo'});
        if(hymnalPack)return catalog(hymnalPack);
        const saved=cacheGet('hymnal-catalog')||cachePeek('hymnal-catalog');if(saved)return saved;
        return Promise.any([ensureHymnalPack().then(catalog),cachedResource('hymnal-catalog',()=>server('getHymnalCatalog',[]),21600000)]).catch(()=>{throw new Error('Daftar lagu belum tersimpan. Periksa koneksi lalu coba lagi.');});
      }

      const VIEWER_LANGUAGES = ['id','en','ms','zh-CN','es'];
      const STATIC_I18N = {
        en:{'Beranda':'Home','Profil':'Profile','Jadwal':'Schedule','Sekolah Sabat':'Sabbath School','Alkitab':'Bible','Lagu Sion':'Hymnal','Lainnya':'More','Gereja':'Church','Pengurus':'Leaders','Kontak':'Contact','Kegiatan':'Activities','Pengumuman':'Announcements','Galeri':'Gallery','Layanan Jemaat':'Member Services','FAQ':'FAQ','Cari':'Search','Terang':'Light','Gelap':'Dark','Sistem':'System','Normal':'Normal','Besar':'Large','Sangat besar':'Extra large','Halus':'Smooth','Kurangi':'Reduce'},
        ms:{'Beranda':'Laman utama','Profil':'Profil','Jadwal':'Jadual','Sekolah Sabat':'Sekolah Sabat','Alkitab':'Alkitab','Lagu Sion':'Lagu Sion','Lainnya':'Lain-lain','Gereja':'Gereja','Pengurus':'Pemimpin','Kontak':'Hubungi','Kegiatan':'Aktiviti','Pengumuman':'Pengumuman','Galeri':'Galeri','Layanan Jemaat':'Khidmat Jemaat','FAQ':'Soalan Lazim','Cari':'Cari','Terang':'Cerah','Gelap':'Gelap','Sistem':'Sistem','Normal':'Normal','Besar':'Besar','Sangat besar':'Sangat besar','Halus':'Lancar','Kurangi':'Kurangkan'},
        'zh-CN':{'Beranda':'首页','Profil':'简介','Jadwal':'日程','Sekolah Sabat':'安息日学','Alkitab':'圣经','Lagu Sion':'赞美诗','Lainnya':'更多','Gereja':'教会','Pengurus':'负责人','Kontak':'联系','Kegiatan':'活动','Pengumuman':'公告','Galeri':'相册','Layanan Jemaat':'会友服务','FAQ':'常见问题','Cari':'搜索','Terang':'浅色','Gelap':'深色','Sistem':'系统','Normal':'正常','Besar':'大','Sangat besar':'特大','Halus':'流畅','Kurangi':'减少'},
        es:{'Beranda':'Inicio','Profil':'Perfil','Jadwal':'Horario','Sekolah Sabat':'Escuela Sabática','Alkitab':'Biblia','Lagu Sion':'Himnario','Lainnya':'Más','Gereja':'Iglesia','Pengurus':'Líderes','Kontak':'Contacto','Kegiatan':'Actividades','Pengumuman':'Anuncios','Galeri':'Galería','Layanan Jemaat':'Servicios','FAQ':'Preguntas','Cari':'Buscar','Terang':'Claro','Gelap':'Oscuro','Sistem':'Sistema','Normal':'Normal','Besar':'Grande','Sangat besar':'Muy grande','Halus':'Suave','Kurangi':'Reducir'}
      };
      function translationCache(language) {
        if (state.translationCaches[language]) return state.translationCaches[language];
        try { state.translationCaches[language] = JSON.parse(safeStorage.get('galilea:translations:' + language,'{}') || '{}'); }
        catch (_) { state.translationCaches[language] = {}; }
        return state.translationCaches[language];
      }
      function saveTranslationCache(language) {
        try {
          const cache = translationCache(language);
          const keys = Object.keys(cache);
          if (keys.length > 900) keys.slice(0,keys.length - 900).forEach(key => delete cache[key]);
          safeStorage.set('galilea:translations:' + language,JSON.stringify(cache));
        } catch (_) {}
      }
      function translatableText(value) {
        const text = String(value || '').trim();
        return text.length > 1 && text.length <= 1600 && /[A-Za-zÀ-ÿ\u0100-\u024F]/.test(text) && !/^https?:\/\//i.test(text);
      }
      function collectTranslationRefs() {
        const refs = [];
        const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          /* Closure memakai salinan node. Variabel loop menjadi null setelah
             TreeWalker selesai dan pada build lama memicu error _gxSource. */
          const currentNode = node;
          const parent = currentNode.parentElement;
          if (!parent || parent.closest('script,style,svg,template,noscript,[translate="no"]')) continue;
          if (currentNode.__gxSource == null) currentNode.__gxSource = currentNode.nodeValue;
          const source = String(currentNode.__gxSource || '').trim();
          if (!translatableText(source)) continue;
          refs.push({source:source,apply:value=>{
            if (!currentNode || !currentNode.isConnected) return;
            currentNode.nodeValue = String(currentNode.__gxSource || '').replace(source,value);
          }});
        }
        $$('[placeholder],[title],[aria-label]').forEach(element => {
          if (element.closest('[translate="no"]')) return;
          ['placeholder','title','aria-label'].forEach(attribute => {
            if (!element.hasAttribute(attribute)) return;
            element.__gxAttrs = element.__gxAttrs || {};
            if (element.__gxAttrs[attribute] == null) element.__gxAttrs[attribute] = element.getAttribute(attribute);
            const source = String(element.__gxAttrs[attribute] || '').trim();
            if (translatableText(source)) refs.push({source:source,apply:value=>element.setAttribute(attribute,value)});
          });
        });
        return refs;
      }
      function restoreIndonesian() {
        collectTranslationRefs().forEach(ref => ref.apply(ref.source));
        document.documentElement.lang = 'id';
        document.documentElement.classList.remove('translate-busy');
      }
      function scheduleTranslation(delay) {
        clearTimeout(state.translationTimer);
        if (state.language === 'id') return restoreIndonesian();
        state.translationTimer = setTimeout(translateVisiblePage,delay == null ? 180 : delay);
      }
      async function translateVisiblePage() {
        if (state.language === 'id') return restoreIndonesian();
        const language = state.language;
        const run = ++state.translationRun;
        const refs = collectTranslationRefs();
        const cache = translationCache(language);
        Object.assign(cache,STATIC_I18N[language] || {});
        const unique = [...new Set(refs.map(ref=>ref.source))];
        const missing = unique.filter(text=>!cache[text]);
        document.documentElement.classList.add('translate-busy');
        try {
          /* Label umum berubah langsung; konten panjang menyusul tanpa menahan UI. */
          refs.forEach(ref=>ref.apply(cache[ref.source] || ref.source));
          document.documentElement.lang = language;
          if (missing.length) {
            const chunks = [];
            for (let index=0; index<missing.length; index+=72) chunks.push(missing.slice(index,index+72));
            for(let offset=0;offset<chunks.length;offset+=3){
              const wave=chunks.slice(offset,offset+3);
              const payloads=await Promise.all(wave.map(chunk=>server('translateViewerTexts',[chunk,language],14000)));
              if(run!==state.translationRun||language!==state.language)return;
              payloads.forEach((payload,waveIndex)=>{const chunk=wave[waveIndex];(payload.translations||[]).forEach((value,index)=>{cache[chunk[index]]=value||chunk[index]})});
              refs.forEach(ref=>ref.apply(cache[ref.source]||ref.source));
            }
            saveTranslationCache(language);
          }
          if (run !== state.translationRun || language !== state.language) return;
          refs.forEach(ref=>ref.apply(cache[ref.source] || ref.source));
          document.documentElement.lang = language;
        } catch (error) {
          toast('Terjemahan belum selesai. Konten Indonesia tetap dapat dibaca.');
        } finally {
          if (run === state.translationRun) document.documentElement.classList.remove('translate-busy');
        }
      }
      function setLanguage(language) {
        const selected = VIEWER_LANGUAGES.includes(language) ? language : 'id';
        state.language = selected;
        safeStorage.set('galilea:language',selected);
        if ($('#language-select')) $('#language-select').value = selected;
        if ($('#language-settings')) $('#language-settings').value = selected;
        document.documentElement.lang = selected;
        if (selected === 'id') restoreIndonesian();
        else scheduleTranslation(20);
      }
      function toast(message) {
        const zone = $('#toast-zone');
        const item = document.createElement('div');
        item.className = 'toast';
        item.textContent = message;
        zone.appendChild(item);
        setTimeout(() => item.remove(), 3600);
      }
      function errorBox(message) {
        return '<div class="empty">' + icon('info') + '<p>' + esc(message || 'Bagian ini sedang belum tersedia.') + '</p></div>';
      }
      function startupFailureHtml(error) {
        const detail = error && error.message ? error.message : 'Koneksi data belum berhasil.';
        return '<section class="startup-failure"><article class="startup-failure-card"><div class="startup-failure-mark"><span class="theme-logo-pair"><img class="logo-light" src="/assets/logo-galilea-light.webp" alt=""><img class="logo-dark" src="/assets/logo-galilea-dark.webp" alt=""></span></div><p class="eyebrow">KONEKSI GALILEA</p><h1>Data belum tersambung.</h1><p class="lead">Data belum dapat dimuat. Periksa koneksi lalu coba lagi.</p><details><summary>Lihat detail teknis</summary><code>' + esc(detail) + '</code></details><div class="button-row"><button class="btn primary" type="button" onclick="location.reload()">Muat ulang website' + icon('arrow') + '</button></div></article></section>';
      }
      function faithLoader(label, note) {
        return '<div class="faith-loader" role="status" aria-live="polite"><div class="faith-loader-visual" aria-hidden="true"><span class="faith-orbit orbit-one"><i></i></span><span class="faith-orbit orbit-two"><i></i></span><span class="theme-logo-pair"><img class="logo-light" src="/assets/logo-galilea-light.webp" alt=""><img class="logo-dark" src="/assets/logo-galilea-dark.webp" alt=""></span></div><strong>' + esc(label || 'Menyiapkan halaman') + '</strong><p>' + esc(note || 'Menghubungkan materi terbaru untuk jemaat…') + '</p><span class="faith-progress"><i></i></span></div>';
      }
      function loadingBox(label, note) { return faithLoader(label, note); }
      function formatGreeting() {
        const hour = Number(new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',hour:'2-digit',hour12:false}).format(new Date()));
        return hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
      }
      function currentDateLabel() {
        return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date()).replace(' pukul ', ' · ') + ' WITA';
      }
      function witaDateKey(value) {
        const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Makassar',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value || new Date()).reduce((map,part) => {
          if (part.type !== 'literal') map[part.type] = part.value;
          return map;
        },{});
        return parts.year + '-' + parts.month + '-' + parts.day;
      }
      function phoneDigits(phone) { return String(phone || '').replace(/\D/g,''); }
      function whatsappUrl(site) { return safeUrl(site.whatsapp_url) || ('https://wa.me/' + phoneDigits(site.phone)); }
      function mapsUrl(site) { return safeUrl(site.maps_url) || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(site.address || 'GMAHK Galilea Balikpapan')); }
      function instagramHandle(site) { const value=String(site&&site.instagram_handle||'@advent.galilea').trim().replace(/^@?\s*/,''); return '@'+(value||'advent.galilea'); }
      function instagramProfileUrl(site) { return safeUrl(site&&site.instagram_url) || ('https://www.instagram.com/' + encodeURIComponent(instagramHandle(site).slice(1)) + '/'); }
      function brandIcon(name) {
        if (name === 'whatsapp') return '<svg class="brand-svg whatsapp-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.76 9.76 0 0 0-8.47 14.64L2 22l5.5-1.44A9.98 9.98 0 1 0 12.04 2Zm0 17.73a7.8 7.8 0 0 1-3.98-1.09l-.29-.17-3.26.85.87-3.17-.19-.31a7.74 7.74 0 1 1 6.85 3.89Zm4.27-5.81c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.92-.13.16-.27.18-.5.06-.23-.12-.99-.36-1.88-1.16a7.05 7.05 0 0 1-1.3-1.62c-.14-.23-.02-.36.1-.48.1-.1.23-.27.35-.41.12-.14.16-.23.23-.39.08-.15.04-.29-.02-.4-.06-.12-.52-1.27-.72-1.74-.19-.46-.38-.4-.52-.4h-.45c-.15 0-.4.06-.62.3-.21.23-.81.8-.81 1.94s.83 2.25.95 2.4c.11.16 1.63 2.5 3.96 3.5.55.24.98.38 1.32.49.55.17 1.05.15 1.45.09.44-.07 1.38-.57 1.57-1.12.2-.55.2-1.03.14-1.12-.06-.1-.21-.16-.45-.28Z"/></svg>';
        if (name === 'instagram') return '<svg class="brand-svg instagram-svg" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="instagram-gradient" x1="2" y1="22" x2="22" y2="2"><stop stop-color="#ffdc80"/><stop offset=".36" stop-color="#fcaf45"/><stop offset=".68" stop-color="#c13584"/><stop offset="1" stop-color="#833ab4"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="url(#instagram-gradient)" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="url(#instagram-gradient)" stroke-width="2"/><circle cx="17.4" cy="6.7" r="1.15" fill="#c13584"/></svg>';
        return '<svg class="brand-svg maps-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34A853" d="M12 22s7-6.13 7-13A7 7 0 0 0 5.2 7.32L12 22Z"/><path fill="#4285F4" d="M5.2 7.32A7 7 0 0 1 12 2v7L5.2 7.32Z"/><path fill="#EA4335" d="M12 2a7 7 0 0 1 6.08 3.53L12 9V2Z"/><path fill="#FBBC04" d="m12 9 6.08-3.47A7 7 0 0 1 19 9c0 1.57-.4 3.05-1.03 4.4L12 9Z"/><circle cx="12" cy="9" r="2.45" fill="#fff"/></svg>';
      }

      function youtubeTile(item, label) {
        if (!item || !/^[A-Za-z0-9_-]{11}$/.test(String(item.videoId || ''))) return '';
        const thumb = '/api/thumbnail?id=' + encodeURIComponent(item.videoId);
        const watch=safeUrl(item.watchUrl)||('https://www.youtube.com/watch?v='+item.videoId);
        return '<article class="media-tile card lift"><button class="media-cover" type="button" data-youtube-play="' + attr(item.videoId) + '" data-youtube-title="' + attr(item.title || 'Video YouTube') + '" aria-label="Putar ' + attr(item.title || 'video') + '"><img src="' + attr(thumb) + '" data-video-thumbnail alt="" loading="lazy"><span class="media-shade"></span><span class="media-play">' + icon('play') + '</span><span class="media-label">' + esc(label || 'VIDEO TERBARU') + '</span></button><div class="media-copy"><strong>' + esc(item.title || 'Video terbaru') + '</strong>' + (item.publishedLabel ? '<span>' + esc(item.publishedLabel) + '</span>' : '') + '<a class="media-youtube-link" href="'+attr(watch)+'" target="_blank" rel="noopener">Buka di YouTube'+icon('external')+'</a></div></article>';
      }

      function youtubeChannelFallback(channelUrl,title,copy){
        return '<article class="card card-pad"><span class="chip brand">KANAL RESMI</span><h3 style="margin-top:18px">'+esc(title)+'</h3><p class="muted">'+esc(copy)+'</p><a class="btn primary" href="'+attr(safeUrl(channelUrl)||'https://www.youtube.com/')+'" target="_blank" rel="noopener">Buka kanal YouTube'+icon('external')+'</a></article>';
      }
      function youtubePlaylistFallback(channelId,title,copy){
        const id=String(channelId||'').trim();
        if(!/^UC[A-Za-z0-9_-]{20,}$/.test(id))return youtubeChannelFallback('',title,copy);
        return '<article class="card media-feed-fallback"><div><span class="chip brand">KANAL RESMI</span><h3>'+esc(title)+'</h3><p class="muted">'+esc(copy)+'</p></div><div class="media-feed-frame"><iframe src="https://www.youtube-nocookie.com/embed/videoseries?list=UU'+attr(id.slice(2))+'&rel=0&modestbranding=1" title="'+attr(title)+'" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div></article>';
      }

      function safeFileName(value) {
        return String(value || 'bacaan-galilea').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90) || 'bacaan-galilea';
      }
      function readingDocument(title, subtitle, body, source) {
        return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><style>body{max-width:860px;margin:0 auto;padding:48px 24px;color:#172119;background:#f8faf5;font:17px/1.8 system-ui,-apple-system,Segoe UI,sans-serif}header{padding:32px;border-radius:24px;color:#f5f8f1;background:linear-gradient(135deg,#163323,#78936e)}h1{margin:8px 0;font-size:clamp(34px,7vw,64px);line-height:1.02}h2{margin-top:42px;color:#244c35}h3{margin-top:30px}.meta{opacity:.78}.day{margin:22px 0;padding:25px;border:1px solid #d7e1d3;border-radius:20px;background:#fff}.source{margin-top:38px;padding-top:18px;border-top:1px solid #d7e1d3;color:#617064;font-size:13px}a{color:#285b3d}img{max-width:100%;height:auto}@media print{body{padding:0;background:#fff}.day{break-inside:avoid}}</style></head><body><header><small>GMAHK GALILEA BALIKPAPAN</small><h1>' + esc(title) + '</h1><div class="meta">' + esc(subtitle || '') + '</div></header><main>' + body + '</main><p class="source">Sumber: ' + esc(source || 'Materi rohani yang terhubung pada Website Galilea') + '<br>Diunduh melalui Website Gereja Galilea · © Sekretaris Galilea 2026</p></body></html>';
      }
      function downloadHtmlReading(title, subtitle, body, source) {
        const blob = new Blob([readingDocument(title,subtitle,body,source)],{type:'text/html;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = safeFileName(title) + '.html';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url),1500);
        toast('Bacaan sudah disiapkan untuk diunduh.');
      }
      function downloadLessonData(data) {
        if (!data || !Array.isArray(data.days)) return toast('Materi belum siap diunduh.');
        const body = data.days.map(day => '<section class="day"><h2>' + esc(day.dateLabel || '') + '</h2><h3>' + esc(day.title || '') + '</h3>' + cleanHtml(day.bibleHtml) + cleanHtml(day.contentHtml) + '</section>').join('');
        downloadHtmlReading('Pelajaran ' + data.number + ' - ' + data.title,data.dateLabel,body,data.source);
      }
      function downloadResourceData(data) {
        if (!data) return toast('Bacaan belum siap diunduh.');
        downloadHtmlReading(data.title,data.dateLabel,'<section class="day">' + cleanHtml(data.contentHtml || '<p>Isi bacaan belum tersedia.</p>') + '</section>',data.source);
      }

      function initPreferences() {
        const selectedTheme = safeStorage.get('galilea:theme','system') || 'system';
        const selectedFont = safeStorage.get('galilea:font','normal') || 'normal';
        const selectedMotion = safeStorage.get('galilea:motion','') || (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full');
        buildPaletteControls();
        applyPalette(safeStorage.get('galilea:palette','green'));
        applyTheme(selectedTheme);
        applyFont(selectedFont);
        applyMotion(selectedMotion);
        matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
          if ((safeStorage.get('galilea:theme','system') || 'system') === 'system') applyTheme('system');
        });
      }
      function applyTheme(value) {
        value = ['light','dark','system'].includes(value) ? value : 'system';
        const theme = value === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value;
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        updateThemeColor();
        safeStorage.set('galilea:theme', value);
        safeStorage.set('galilea:presentation-theme', theme);
        $('#theme-button').innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
        $('#theme-button').setAttribute('aria-label', theme === 'dark' ? 'Gunakan mode terang' : 'Gunakan mode gelap');
        $$('[data-theme-value]').forEach(button => {
          const active = button.dataset.themeValue === value;
          button.classList.toggle('active',active);
          button.setAttribute('aria-pressed',String(active));
        });
        if (state.presentation) state.presentation.theme = theme;
        if ($('#presentation-dialog')?.open) { window.GalileaPageTurn?.cancel(); syncPresentationState(); schedulePresentationFit(); }
      }
      function buildPaletteControls() {
        const template = $('#appearance-settings-template');
        if (template && !$('#palette-options')) $('#settings-dialog .settings-grid').prepend(template.content.cloneNode(true));
        if (!$('#presentation-palette')) {
          $('.presentation-controls').insertAdjacentHTML('afterbegin','<button type="button" id="presentation-palette" aria-label="Pilih warna layar" aria-expanded="false" popovertarget="presentation-palette-menu"></button><div id="presentation-palette-menu" popover="auto" role="group" aria-label="Warna layar"><p>Pilih warna layar</p><div class="palette-options"></div></div>');
          $('#presentation-palette-menu').addEventListener('toggle',event=>{ $('#presentation-palette').setAttribute('aria-expanded',String(event.newState==='open'));showPresentationControls(true); });
        }
        const choices = $('#palette-options');
        if (choices) choices.innerHTML = PALETTES.map(([id,label,color]) =>
          '<button type="button" class="palette-choice" data-palette-value="'+id+'" aria-pressed="false"><span class="palette-dot" style="--swatch:'+color+'" aria-hidden="true"></span><span>'+label+'</span><span class="palette-check" aria-hidden="true">'+icon('check')+'</span></button>').join('');
        $('#presentation-palette-menu .palette-options').innerHTML=PALETTES.map(([id,label,color])=>'<button type="button" class="palette-choice" data-screen-palette="'+id+'" aria-pressed="false"><span class="palette-dot" style="--swatch:'+color+'" aria-hidden="true"></span><span>'+label+'</span><span class="palette-check" aria-hidden="true">'+icon('check')+'</span></button>').join('');
      }
      function updateThemeColor() {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--tone-800').trim() || '#123821';
      }
      function applyPalette(value, announce) {
        const selected = PALETTES.find(([id]) => id === value) || PALETTES[0];
        document.documentElement.dataset.palette = selected[0];
        safeStorage.set('galilea:palette',selected[0]);
        $$('[data-palette-value],[data-screen-palette]').forEach(button => {
          const active = (button.dataset.paletteValue || button.dataset.screenPalette) === selected[0];
          button.classList.toggle('active',active);
          button.setAttribute('aria-pressed',String(active));
        });
        if ($('#presentation-palette')) $('#presentation-palette').innerHTML=esc(selected[1])+icon('down');
        if ($('#palette-status')) $('#palette-status').textContent = selected[1]+' aktif di semua halaman dan layar ibadah.';
        window.GalileaPageTurn?.cancel();
        updateThemeColor();
        if (announce && $('#presentation-dialog')?.open) announcePresentation('Warna '+selected[1]+' aktif');
      }
      function applyFont(value) {
        document.documentElement.dataset.font = ['normal','large','xlarge'].includes(value) ? value : 'normal';
        safeStorage.set('galilea:font', document.documentElement.dataset.font);
        $$('[data-font-value]').forEach(button => button.classList.toggle('active', button.dataset.fontValue === document.documentElement.dataset.font));
      }
      function applyMotion(value) {
        document.documentElement.dataset.motion = value === 'reduced' ? 'reduced' : 'full';
        safeStorage.set('galilea:motion', document.documentElement.dataset.motion);
        $$('[data-motion-value]').forEach(button => button.classList.toggle('active', button.dataset.motionValue === document.documentElement.dataset.motion));
      }

      function setShellData() {
        const site = state.data.site;
        (state.data.sections || []).forEach(section => {
          if (section.id === 'doa') section.title = 'Ibadah Rabu Malam';
        });
        const presentationShell = $('#presentation-shell');
        if (presentationShell) {
          const backgroundValue = (value,fallback) => 'url(' + JSON.stringify(safeUrl(value) || fallback) + ')';
          presentationShell.style.setProperty('--presentation-bg-schedule',backgroundValue(site.presentation_schedule_background_url,'/assets/presentation/schedule.webp'));
          presentationShell.style.setProperty('--presentation-bg-bible',backgroundValue(site.presentation_bible_background_url,'/assets/presentation/bible.webp'));
          presentationShell.style.setProperty('--presentation-bg-hymnal',backgroundValue(site.presentation_hymnal_background_url,'/assets/presentation/hymnal.webp'));
        }
        const logoFallback = $('#header-logo-fallback');
        /* Identitas viewer selalu satu: lambang Advent inline yang mengikuti mode. */
        if (logoFallback) logoFallback.hidden = false;
        $('#header-name').textContent = 'GMAHK Galilea';
        $('#header-tagline').textContent = site.tagline || '';
        const menuLabel = String(site.navigation_menu_label || 'MENU').trim().slice(0,12) || 'MENU';
        const menuLabelNode = $('#mobile-toggle .menu-label');
        if (menuLabelNode) menuLabelNode.textContent = menuLabel;
        $('#footer-address').textContent = site.address || 'Balikpapan, Kalimantan Timur';
        $('#footer-whatsapp').href = whatsappUrl(site);
        $('#footer-whatsapp').innerHTML = brandIcon('whatsapp') + 'WhatsApp';
        $('#footer-maps').href = mapsUrl(site);
        $('#footer-maps').innerHTML = icon('map') + 'Petunjuk arah';
        $('#footer-instagram').href = instagramProfileUrl(site);
        $('#footer-instagram-label').textContent = instagramHandle(site);
        $('#footer-sabbath').textContent = site.sabbath_service || 'Setiap Sabat · 09.00 WITA';
        const footerEmail=site.email||'galileabalikpapan@gmail.com';
        $('#footer-email').textContent=footerEmail;
        $('#footer-email').href='mailto:'+footerEmail;
        $('#footer-copy').textContent = state.data.copyright + ' · ' + (site.footer_text || 'Website resmi GMAHK Galilea Balikpapan');
        $('#footer-updated').textContent = 'Data diperbarui ' + state.data.updatedAt;
        syncSeoMetadata(state.route,site);
        startAnalytics(site.analytics_id);
      }

      function startAnalytics(id) {
        if (!/^G-[A-Z0-9]+$/i.test(id || '') || window.gtag) return;
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
        document.head.appendChild(script);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){ dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', id, {anonymize_ip:true,send_page_view:false});
      }
      function track(name, params) { if (window.gtag) gtag('event', name, params || {}); }

      function buildMobileNav() {
        const groups = MOBILE_GROUPS.map((group,index) => {
          const titleId = 'mobile-group-' + index;
          const items = group.items.map(item => '<button type="button" '+(item[0] === 'welcome' ? 'data-present-welcome' : 'data-route="'+attr(item[0])+'"')+'><span class="mobile-nav-icon">' + icon(item[1]) + '</span><span class="mobile-nav-copy"><strong>' + esc(item[2]) + '</strong></span></button>').join('');
          return '<section class="mobile-nav-group" aria-labelledby="' + titleId + '"><h2 class="mobile-nav-title" id="' + titleId + '">' + esc(group.label) + '</h2><div class="mobile-nav-grid">' + items + '</div></section>';
        }).join('');
        const tools = '<section class="mobile-nav-group mobile-nav-tools" aria-labelledby="mobile-group-tools"><h2 class="mobile-nav-title" id="mobile-group-tools">Alat</h2><div class="mobile-nav-grid"><button type="button" data-open="search"><span class="mobile-nav-icon">' + icon('search') + '</span><span class="mobile-nav-copy"><strong>Cari</strong></span></button><button type="button" data-open="settings"><span class="mobile-nav-icon">' + icon('access') + '</span><span class="mobile-nav-copy"><strong>Tampilan</strong></span></button></div></section>';
        $('#mobile-nav').innerHTML = groups + tools;
        const desktop = $('#desktop-menu-groups');
        if (desktop) desktop.innerHTML = MOBILE_GROUPS.slice(1).map(group =>
          '<span class="nav-drop"><button type="button" data-nav-toggle aria-expanded="false">'+esc(group.label)+icon('down')+'</button><span class="nav-drop-menu">'+group.items.map(item =>
            '<button type="button" '+(item[0] === 'welcome' ? 'data-present-welcome' : 'data-route="'+attr(item[0])+'"')+'>'+icon(item[1])+esc(item[2])+'</button>').join('')+'</span></span>').join('');
        scheduleTranslation();
      }

      function setMobileMenu(open) {
        const panel = $('#mobile-panel'), toggle = $('#mobile-toggle');
        if (!panel || !toggle) return;
        const active = Boolean(open);
        panel.classList.toggle('open',active);
        toggle.setAttribute('aria-expanded',String(active));
        toggle.setAttribute('aria-label',active ? 'Tutup menu' : 'Buka menu');
        document.documentElement.classList.toggle('mobile-menu-open',active);
        document.body.classList.toggle('mobile-menu-open',active);
        if (active) panel.scrollTop = 0;
        else if (panel.contains(document.activeElement)) toggle.focus({preventScroll:true});
        panel.inert=!active;
        panel.setAttribute('aria-hidden',String(!active));
      }

      function closeMobile() {
        setMobileMenu(false);
      }
      function syncCinemaNav() {
        updateCinemaHeader();
      }
      function updateCinemaHeader() {
        const header = $('.site-header');
        if (header) header.classList.toggle('is-scrolled',window.scrollY > 42);
        const max = Math.max(1,document.documentElement.scrollHeight - window.innerHeight);
        document.documentElement.style.setProperty('--nav-progress',Math.min(1,Math.max(0,window.scrollY / max)).toFixed(4));
      }
      function navigate(route, options) {
        const next = ROUTES.includes(route) ? route : 'home';
        const previous = state.route;
        const shouldRecord = !options || options.history !== false;
        if (shouldRecord && (next !== previous || location.hash !== '#' + next)) {
          history.pushState({route:next},'','#' + next);
        }
        state.route = next;
        syncCinemaNav();
        if (options && options.action === 'mine') state.scheduleTab = 'mine';
        closeMobile();
        document.querySelectorAll('.nav-drop.open').forEach(drop=>{drop.classList.remove('open');drop.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded','false');});
        const paint=()=>{render();window.scrollTo({top:0,behavior:'auto'});};
        let ready = Promise.resolve();
        if(document.startViewTransition&&document.documentElement.dataset.motion!=='reduced') {
          const transition = document.startViewTransition(paint);
          transition.ready.catch(()=>{});
          transition.finished.catch(()=>{});
          ready = transition.updateCallbackDone;
        }
        else paint();
        if(state.data)syncSeoMetadata(next,state.data.site);
        document.querySelectorAll('[data-route]').forEach(button => button.classList.toggle('active', button.dataset.route === next));
        track('page_view',{page_title:routeTitle(next),page_location:location.href});
        return ready;
      }

      function render() {
        // Tunggu data supaya pesan pemuatan tidak ikut hilang.
        if(!state.data)return;
        window.GalileaHymnalScores?.destroy();
        if(window.GalileaScheduleClock)window.GalileaScheduleClock.refresh(state.data);
        const renderers = {
          home: renderHome, today: renderToday, church: renderChurch, aboutsite: renderAboutSite, leaders: renderLeaders, schedule: renderSchedule,
          bulletin: renderBulletin, sabbath: renderSabbath, bible: renderBible, hymnal: renderHymnal, 'hymnal-scores': renderHymnalScores,
          favorites: renderFavorites, visitor: renderVisitor, activities: renderActivities,
          announcements: renderAnnouncements, gallery: renderGallery, services: renderServices,
          faq: renderFaq, contact: renderContact
        };
        syncCinemaNav();
        $('#app').className = 'view';
        $('#app').innerHTML = (renderers[state.route] || renderHome)();
        requestAnimationFrame(() => { bindView(); scheduleTranslation(); });
      }

      function pageHead(eyebrow, title, description) {
        return '<section class="page-head"><div class="shell"><div><p class="eyebrow">' + esc(eyebrow) + '</p><h1>' + esc(title) + '</h1>' + (description ? '<p class="lead">' + esc(description) + '</p>' : '') + '</div></div></section>';
      }
      function emptyText(text) { return '<div class="empty"><p>' + esc(text) + '</p></div>'; }
      function fieldsHtml(fields) {
        return '<dl class="field-grid">' + (fields || []).map(field => '<div class="field"><dt>' + esc(field.label) + '</dt><dd>' + esc(field.value) + '</dd></div>').join('') + '</dl>';
      }

      function renderNotices() {
        if (!state.data.banners.length) return '';
        return '<div class="notice-stack">' + state.data.banners.map(item => '<div class="notice">' + icon(item.variant === 'PENTING' ? 'bell' : 'info') + '<div class="notice-copy"><strong>' + esc(item.title) + '</strong><span>' + esc(item.message) + '</span></div>' + (item.url ? '<a class="link-arrow small" href="' + attr(item.url) + '" target="_blank" rel="noopener">' + esc(item.buttonLabel) + icon('arrow') + '</a>' : '') + '</div>').join('') + '</div>';
      }

      function nextScheduleHtml(summary, compact) {
        if (!summary) return emptyText('Jadwal ibadah terdekat belum tersedia.');
        const serviceBlocks = (summary.services || []).map(service => '<section class="service-block"><span class="chip brand">' + esc(service.title) + '</span>' + fieldsHtml(service.fields) + '</section>').join('');
        const serviceCount=(summary.services||[]).length;
        return '<article class="card next-card"><div class="next-cover"><span class="chip">' + esc(summary.countdown || 'MENDATANG') + '</span><h3>' + esc(summary.dateLabel) + '</h3><div class="meta"><span>' + icon('clock') + esc(summary.time || '09.00 WITA') + '</span></div></div><div class="next-details"><p class="eyebrow">Ringkasan ibadah terdekat' + (serviceCount?' · '+serviceCount+' bagian':'') + '</p>' + serviceBlocks + '<div class="button-row" style="margin-top:26px"><button class="btn primary" type="button" data-present-schedule-summary>' + icon('external') + 'Tampilkan ringkasan</button><button class="btn whatsapp" type="button" data-whatsapp-summary>' + brandIcon('whatsapp') + 'WhatsApp</button><button class="btn" type="button" data-share-summary>' + icon('share') + 'Bagikan lainnya</button></div></div></article>';
      }

      function homeSummaryStrip(summary) {
        const dateText = summary ? (summary.dateLabel + ' · ' + (summary.time || '09.00 WITA')) : 'Jadwal terdekat akan tampil dari spreadsheet';
        return '<button class="schedule-portal" type="button" data-route="schedule"><span class="portal-icon">' + icon('calendar') + '</span><span><small class="eyebrow" style="margin-bottom:7px">Jadwal ibadah</small><strong>Buka ringkasan dan pembagian pelayanan</strong><span>' + esc(dateText) + '</span></span><span class="portal-arrow">' + icon('arrow') + '</span></button>';
      }

      function renderHome() {
        const data = state.data, site = data.site;
        const announcements = data.announcements.slice(0,3);
        const activities = data.activities.slice(0,3);
        const plan = selectedWorshipPlan();
        const scheduleDate = plan ? (plan.dateLabel + ' · ' + normalizeWorshipTime(plan.time).replace(':','.') + ' WITA') : 'Jadwal terbaru sedang disiapkan';
        const liveStatus = eventStatus(plan);
        const worshipTitle = plan?.isToday ? 'Ibadah hari ini' : 'Ibadah terdekat';
        const leadStory = activities.find(item => safeUrl(item.coverUrl || (item.photos || [])[0]));
        const story = leadStory ? '<button class="visitor-story" type="button" data-open-activity="'+attr(leadStory.id)+'" aria-label="Baca berita '+attr(leadStory.title)+'"><img src="'+attr(safeUrl(leadStory.coverUrl || leadStory.photos[0]))+'" alt="'+attr(leadStory.title)+'" loading="lazy"><span class="visitor-story-copy"><small>Kehidupan jemaat</small><strong>'+esc(leadStory.title)+'</strong><span>Baca cerita '+icon('arrow')+'</span></span></button>' : '';
        const journal = activities.map((item,index) => activityCardHtml(item,index===0)).join('');
        const homeAnnouncements = announcements.map(item => {const meta=announcementGroupMeta(announcementCategory(item));return '<article class="journal-note"><div class="button-row"><span class="chip brand">'+esc(meta.label)+'</span><span class="chip">'+esc(item.dateLabel||'Pengumuman')+'</span></div><h3>'+esc(item.title)+'</h3><p>'+esc(item.summary||'Informasi selengkapnya tersedia pada halaman Agenda dan Pengumuman.')+'</p><div class="button-row"><span class="chip '+(item.priority==='PENTING'?'gold':'')+'">'+esc(item.priority||'NORMAL')+'</span><button class="link-arrow" type="button" data-open-announcement="'+attr(item.id)+'">Baca pengumuman'+icon('arrow')+'</button></div></article>';}).join('');
        const nextWorship = plan
          ? '<button class="hero-next" type="button" data-route="today"><span class="hero-next-icon">'+icon('calendar')+'</span><span><small>'+esc(worshipTitle)+' · '+esc(plan.serviceType||'Ibadah')+'</small><strong>'+esc(scheduleDate)+'</strong></span>'+icon('chevron')+'</button>'
          : '<div class="hero-next"><span class="hero-next-icon">'+icon('calendar')+'</span><span><small>Ibadah terdekat</small><strong>Jadwal sedang disiapkan pengurus.</strong></span></div>';

        return '<section class="film-hero">' +
          '<div class="film-hero-media"></div><div class="film-hero-shade" aria-hidden="true"></div><div class="film-hero-lines" aria-hidden="true"></div><span class="film-cross-light" aria-hidden="true"></span>' +
          '<div class="film-hero-inner"><div class="visitor-welcome"><p class="film-kicker">' + esc(site.tagline || 'Bertumbuh dalam iman') + '</p><h1>' + esc(site.hero_title || 'Selamat datang di Galilea.') + '</h1>'+nextWorship+'<p class="film-hero-lead">' + esc(site.hero_description || 'Temukan jadwal ibadah dan kabar jemaat. Kami senang menyambut Anda di Galilea.') + '</p>' +
          '<div class="film-hero-actions"><button class="btn primary" type="button" data-route="schedule">'+icon('calendar')+'Lihat jadwal ibadah</button><button class="btn ghost" type="button" data-route="visitor">'+icon('map')+'Panduan berkunjung</button></div>' +
          '<div class="film-hero-bottom"><div class="film-greeting"><strong>' + esc(formatGreeting()) + ', ' + esc(site.greeting_audience || 'Jemaat Galilea') + '.</strong><span>' + esc(currentDateLabel()) + '</span></div></div></div>'+story+'</div></section>' +
          '<section class="service-reel" aria-label="Informasi ibadah"><div class="service-reel-item"><small>Ibadah Sabat</small><strong>' + esc(site.sabbath_service) + '</strong></div><div class="service-reel-item"><small>Ibadah Rabu Malam</small><strong>' + esc(site.wednesday_service) + '</strong></div><div class="service-reel-item"><small>Lokasi</small><strong>' + esc(site.address) + '</strong></div></section>' +
          '<section class="v18-today-hub"><div class="shell v18-today-grid"><article class="v18-today-card primary"><span class="v18-status">'+esc(liveStatus.label)+'</span><span class="service-name">'+esc(plan?.serviceType || worshipTitle)+'</span><h2>'+esc(plan ? scheduleDate : 'Jadwal ibadah sedang disiapkan.')+'</h2><p>Lihat petugas dan materi yang tersedia untuk '+esc(worshipTitle.toLowerCase())+'.</p><div class="button-row"><button class="btn primary" type="button" data-route="today">'+icon('church')+'Buka '+esc(worshipTitle.toLowerCase())+'</button><button class="btn ghost" type="button" data-calendar-today>'+icon('calendar')+'Tambah kalender</button></div></article><article class="v18-today-card"><p class="eyebrow">Akses cepat</p><div class="v18-quick-grid"><button class="v18-quick" type="button" data-route="visitor">'+icon('map')+'<strong>Baru berkunjung?</strong></button><button class="v18-quick" type="button" data-route="favorites">'+icon('star')+'<strong>Tersimpan</strong></button><button class="v18-quick" type="button" data-route="bible">'+icon('book')+'<strong>Baca Alkitab</strong></button><button class="v18-quick" type="button" data-route="services">'+icon('heart')+'<strong>Permohonan doa</strong></button></div></article></div></section>'+
          (data.banners.length ? '<section class="section home-notices"><div class="shell">'+renderNotices()+'</div></section>' : '') +

          '<section class="cinema-chapter journal-stage"><div class="shell cinema-chapter-grid"><div><div class="chapter-heading"><h2>Kabar dari Galilea.</h2><p>Cerita kegiatan dan kebersamaan Jemaat Galilea.</p></div>' + '<div class="journal-grid home-news-grid news-count-'+activities.length+'">' + (journal || emptyText('Belum ada kabar yang dipublikasikan.')) + '</div>' + (homeAnnouncements ? '<div class="home-announcements" aria-label="Pengumuman terbaru">'+homeAnnouncements+'</div>' : '') + '<div class="button-row" style="margin-top:36px"><button class="btn primary" type="button" data-route="activities">Seluruh Berita Jemaat' + icon('arrow') + '</button><button class="btn" type="button" data-route="announcements">Agenda dan Pengumuman</button></div></div></div></section>' +

          '<section class="word-stage"><div class="word-stage-heading"><p class="eyebrow">Renungan Pagi</p><h2>Mulai hari bersama firman.</h2><p>Bacaan hari ini untuk menemani waktu teduh Anda.</p></div><div id="home-devotional">' + loadingBox('Menyiapkan renungan pagi','Memuat bacaan hari ini…') + '</div></section>' +
          '<section class="instagram-stage" aria-labelledby="instagram-stage-title"><div class="shell"><header class="instagram-stage-head"><div><p class="eyebrow">Instagram Galilea</p><h2 id="instagram-stage-title">Kebersamaan dalam cerita.</h2><p>Ikuti kegiatan jemaat melalui Reels @advent.galilea.</p></div><a class="instagram-profile-link" href="https://www.instagram.com/advent.galilea/" target="_blank" rel="noopener">'+brandIcon('instagram')+'@advent.galilea'+icon('external')+'</a></header><div id="home-instagram-reel">'+loadingBox('Memuat Reels Galilea','Menyiapkan video dari Instagram…')+'</div></div></section>'+
          '<details class="v18-more" data-home-extra="broadcast"><summary>Video resmi & pembahasan Sekolah Sabat</summary><div class="v18-more-body"><section class="cinema-chapter broadcast-stage"><div class="shell cinema-chapter-grid"><div class="broadcast-stack"><div class="broadcast-block"><div class="section-head"><div><p class="eyebrow">AWR Borneo</p><h2>Tiga video terbaru.</h2></div><a class="link-arrow" href="' + attr(site.awr_youtube_channel_url || 'https://www.youtube.com/@AWRBorneo') + '" target="_blank" rel="noopener">Buka kanal YouTube' + icon('external') + '</a></div><div id="home-video">' + loadingBox('Video siap dibuka','Buka bagian ini untuk memuat video terbaru.') + '</div></div><div class="broadcast-block"><div class="section-head"><div><p class="eyebrow">Diskusi Sekolah Sabat</p><h2>Pembahasan minggu ini.</h2></div></div><div id="home-sabbath-video">' + loadingBox('Pembahasan Sekolah Sabat','Materi dimuat saat bagian ini dibuka.') + '</div></div></div></div></section></div></details>' +
          '<details class="v18-more" data-home-extra="theme"><summary>Ayat tema tahunan</summary><div class="v18-more-body"><section class="faith-interlude"><div class="shell faith-interlude-grid"><article class="faith-verse"><p class="eyebrow">' + esc(site.bible_reference) + '</p><p class="quote">“' + esc(site.bible_verse) + '”</p><button class="btn ghost" type="button" data-route="bible">Baca Alkitab' + icon('arrow') + '</button></article><div class="faith-theme"><article class="card card-pad" id="advent-theme">' + loadingBox('Tema Advent','Tema dimuat saat bagian ini dibuka.') + '</article></div></div></section></div></details>';
      }

      async function loadDevotionalHome(force) {
        const devotionalBox = $('#home-devotional');
        if (devotionalBox) {
          try {
            const todayKey = witaDateKey();
            const cacheKey = 'v3500-devotional-' + todayKey;
            cacheRemove('v1730-devotional-' + todayKey);
            cacheRemove('v1700-devotional-' + todayKey);
            cacheRemove('v11-devotional-today');
            cacheRemove('v1101-devotional-' + todayKey);
            let item = force ? null : cacheGet(cacheKey);
            if (force) cacheRemove(cacheKey);
            if (item && item.requestedDate !== todayKey) {
              cacheRemove(cacheKey);
              item = null;
            }
            item = item || await server('getDailyDevotional',[todayKey]);
            if (!item || item.requestedDate !== todayKey) throw new Error('Tanggal Renungan Pagi belum cocok dengan hari ini. Silakan muat ulang.');
            const hasOfficialText = item.format === 'text' && String(item.contentHtml || '').trim() && !item.videoId && !item.embedUrl && !item.watchUrl;
            if (hasOfficialText) {
              item = Object.assign({},item,{format:'text',videoId:'',thumbnailUrl:'',embedUrl:'',watchUrl:''});
            } else {
              item = {
                id:'official-text-pending-' + todayKey,
                format:'pending',
                requestedDate:todayKey,
                contentDate:todayKey,
                todayLabel:item.todayLabel || currentDateLabel(),
                title:'Renungan Pagi teks sedang diperbarui',
                scripture:'',
                summary:'Website hanya menampilkan bacaan teks dari sumber resmi Advent. Video tidak digunakan untuk Renungan Pagi.',
                contentHtml:'',
                videoId:'',thumbnailUrl:'',embedUrl:'',watchUrl:'',
                isArchive:false,isPending:true,
                source:'Materi resmi Advent · Bahasa Indonesia',
                attribution:'Dibagikan melalui Website Gereja Galilea'
              };
            }
            cacheSet(cacheKey,item,item.isPending ? 120000 : 900000);
            if ($('#home-devotional')) $('#home-devotional').innerHTML = devotionalCardHtml(item);
            state.async.devotional = item;
          } catch (error) { if ($('#home-devotional')) $('#home-devotional').innerHTML = errorBox(error.message); }
        }
      }

      function devotionalCardHtml(item) {
        if (item.isPending || item.format === 'pending') {
          return '<article class="devotional-pending cinematic-pending"><div class="pending-halo" aria-hidden="true"></div><div><span class="chip brand">' + esc(item.todayLabel) + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(item.summary) + '</p></div></article>';
        }
        return '<article class="devotional-cinema"><div class="devotional-orbit" aria-hidden="true"><span></span><span></span><span></span></div><div class="devotional-date"><small>Bacaan hari ini</small><strong>' + esc(item.todayLabel) + '</strong><span>' + esc(item.source || 'Materi resmi Advent · Bahasa Indonesia') + '</span></div><div class="devotional-body"><div class="devotional-meta">' + (item.lessonNumber?'<span class="chip">Pelajaran ' + esc(item.lessonNumber) + '</span>':'') + '</div><p class="eyebrow">Renungan Pagi</p><h3 class="devotional-title">' + esc(item.title) + '</h3>' + (item.scripture?'<blockquote class="devotional-verse">' + esc(item.scripture) + '</blockquote>':'') + '<p class="devotional-summary">' + esc(item.summary) + '</p><div class="button-row"><button class="btn primary" type="button" data-read-devotional>'+icon('book')+'Baca renungan</button><button class="btn whatsapp" type="button" data-whatsapp-devotional>' + brandIcon('whatsapp') + 'Bagikan ke WhatsApp</button></div><p class="small faint">' + esc(item.attribution || 'Dibagikan melalui Website Gereja Galilea') + '</p></div></article>';
      }
      function renderAwrHomeMedia(media){
        const box=$('#home-video');if(!box||!media)return false;
        const featured=media.videoId?{videoId:media.videoId,title:media.title,thumbnailUrl:'/api/thumbnail?id='+encodeURIComponent(media.videoId)}:null;
        const normalizeTitle=value=>String(value||'').toLowerCase().replace(/\blive\b|🔴|episode\s*\d+|ep\.?\s*\d+/gi,' ').replace(/[^a-z0-9]+/gi,' ').trim();
        const items=[featured].concat(media.recentVideos||[]).filter(item=>item&&/^[A-Za-z0-9_-]{11}$/.test(String(item.videoId||''))).filter((item,index,array)=>{
          const title=normalizeTitle(item.title),id=String(item.videoId);
          return array.findIndex(other=>String(other.videoId)===id || (title&&normalizeTitle(other.title)===title))===index;
        }).slice(0,3);
        box.innerHTML=items.length?'<div class="media-grid">'+items.map((item,index)=>youtubeTile(item,index===0&&media.isLive?'● SEDANG LIVE':index===0?'TERBARU':'AWR BORNEO')).join('')+'</div>':youtubePlaylistFallback(media.channelId||'UC41TOa3S2aC8C-AxRBvH9Xw','AWR Borneo','Feed kartu sedang diperbarui. Unggahan terbaru tetap tersedia pada pemutar kanal resmi.');return Boolean(items.length);
      }
      async function fetchLiveYoutubeChannel(channel){
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
        try{
          const response=await fetch('/api/media?channel='+encodeURIComponent(channel),{headers:{Accept:'application/json'},cache:'no-store',credentials:'same-origin',signal:controller.signal});
          let payload=null;try{payload=await response.json();}catch(_){}
          if(!response.ok||!payload||payload.ok!==true||!payload.data)throw new Error(payload&&payload.error||'Feed video belum tersedia.');
          return payload.data;
        }finally{clearTimeout(timer);}
      }
      async function loadAwrHome(){
        if(!$('#home-video'))return;const key='v3400-awr-video',stale=cachePeek(key);
        if(stale)renderAwrHomeMedia(stale);
        const fresh=cacheGet(key);if(fresh){state.async.awr=fresh;renderAwrHomeMedia(fresh);return;}
        try{
          let media;try{media=await fetchLiveYoutubeChannel('awr');}catch(_){media=await server('getAwrBorneoMedia',[false],12000);}
          cacheSet(key,media,media.isLive?300000:600000);state.async.awr=media;renderAwrHomeMedia(media);
        }catch(error){if(!stale&&$('#home-video'))$('#home-video').innerHTML=youtubePlaylistFallback('UC41TOa3S2aC8C-AxRBvH9Xw','AWR Borneo','Feed kartu sedang diperbarui. Unggahan terbaru tetap tersedia pada pemutar kanal resmi.');}
      }
      function renderSabbathDiscussionMedia(media){
        const box=$('#home-sabbath-video');if(!box||!media)return false;
        if(!media.video||!/^[A-Za-z0-9_-]{11}$/.test(String(media.video.videoId||''))){box.innerHTML=youtubePlaylistFallback(media.channelId||'UCkNVHkC8G5HiOgFG7Iv9smg','Diskusi Sekolah Sabat','Pembahasan terbaru sedang diperbarui. Video kanal resmi tetap dapat diputar.');return false;}
        box.innerHTML='<div class="discussion-layout">'+youtubeTile(media.video,'PEMBAHASAN TERBARU')+'<article class="card discussion-copy"><span class="chip brand">SATU VIDEO TERBARU</span><h3>'+esc(media.video.title)+'</h3><p class="muted">Pembahasan pelajaran mingguan dari Diskusi Sekolah Sabat, Hope Channel Indonesia. Tekan gambar video untuk menonton tanpa meninggalkan halaman.</p><div class="button-row"><button class="btn primary" type="button" data-youtube-play="'+attr(media.video.videoId)+'" data-youtube-title="'+attr(media.video.title)+'">'+icon('play')+'Tonton sekarang</button><a class="btn" href="'+attr(media.channelUrl)+'" target="_blank" rel="noopener">Buka kanal'+icon('external')+'</a></div></article></div>';return true;
      }
      async function loadSabbathDiscussionHome(){
        const box=$('#home-sabbath-video');if(!box)return;
        const key='v3400-sabbath-discussion',stale=cachePeek(key);if(stale)renderSabbathDiscussionMedia(stale);
        const fresh=cacheGet(key);if(fresh){state.async.sabbathDiscussion=fresh;renderSabbathDiscussionMedia(fresh);return;}
        try{
          let media;try{media=await fetchLiveYoutubeChannel('sabbath');}catch(_){media=await server('getSabbathDiscussionVideos',[false],12000);}
          cacheSet(key,media,600000);state.async.sabbathDiscussion=media;renderSabbathDiscussionMedia(media);
        }catch(error){if(!stale&&$('#home-sabbath-video'))$('#home-sabbath-video').innerHTML=youtubePlaylistFallback('UCkNVHkC8G5HiOgFG7Iv9smg','Diskusi Sekolah Sabat','Pembahasan terbaru sedang diperbarui. Video kanal resmi tetap dapat diputar.');}
      }
      async function loadThemeHome() {
        const themeBox = $('#advent-theme');
        if (themeBox) {
          try {
            const year = Number(state.data.site.advent_theme_year) || new Date().getFullYear();
            const cached = cacheGet('v1700-advent-theme-' + year);
            const item = cached || await server('getAdventTheme',[year]);
            cacheSet('v1700-advent-theme-' + year,item,43200000);
            state.async.theme = item;
            if ($('#advent-theme')) $('#advent-theme').innerHTML = '<span class="chip gold">TEMA ADVENT ' + esc(item.year) + '</span><h3 style="margin-top:22px;font-size:clamp(2rem,4vw,3.4rem)">' + esc(item.title) + '</h3><p class="lead">' + esc(item.description || item.scripture || '') + '</p>' + (item.song ? '<p class="muted"><strong>Lagu tema Advent:</strong> ' + esc(item.song) + '</p>' : '') + (state.data.themeSong ? '<button class="btn soft" type="button" data-theme-song>' + icon('music') + esc(state.data.themeSong.title) + '</button>' : state.data.site.theme_song_number ? '<button class="btn soft" type="button" data-song="' + attr(state.data.site.theme_song_number) + '">' + icon('music') + esc(state.data.site.theme_song_title || 'Buka lagu tema') + '</button>' : '') + (item.imageUrl ? '<img src="' + attr(item.imageUrl) + '" alt="' + attr(item.title) + '" style="margin-top:22px;border-radius:14px;max-height:240px;object-fit:cover;width:100%">' : '');
          } catch (error) { if ($('#advent-theme')) $('#advent-theme').innerHTML = errorBox(error.message); }
        }
      }
      function instagramReelFallback(message){
        return '<article class="instagram-reel-fallback"><span class="instagram-profile-mark" aria-hidden="true">'+brandIcon('instagram')+'</span><div><span class="instagram-reel-badge">@advent.galilea</span><h3>Kabar jemaat ada di Instagram.</h3><p>Video belum bisa ditampilkan di sini. Anda bisa menonton Reels dan mengikuti kabar Galilea melalui profil kami.</p><div class="instagram-reel-actions"><a class="btn primary" href="https://www.instagram.com/advent.galilea/" target="_blank" rel="noopener">'+brandIcon('instagram')+'Buka Instagram Galilea'+icon('external')+'</a></div></div></article>';
      }
      async function loadInstagramHome(){
        const box=$('#home-instagram-reel');if(!box)return false;
        try{
          const fallback=state.data&&state.data.site&&state.data.site.instagram_reel_fallback_url;
          const endpoint='/api/instagram'+(safeUrl(fallback)?'?fallback='+encodeURIComponent(fallback):'');
          const response=await fetch(endpoint,{headers:{Accept:'application/json'},cache:'no-store',credentials:'same-origin'});
          let payload=null;try{payload=await response.json();}catch(_){}
          if(!response.ok||!payload||payload.ok!==true||!payload.reel)throw new Error(payload&&payload.error||'Reel terbaru belum dapat dibaca.');
          const reel=payload.reel,permalink=safeUrl(reel.permalink),embedUrl=safeUrl(reel.embedUrl),caption=String(reel.caption||'Reel terbaru dari @advent.galilea.').trim();
          if(!permalink||!embedUrl)throw new Error('Tautan Reel terbaru belum valid.');
          box.innerHTML='<article class="instagram-reel-live"><div class="instagram-reel-phone"><iframe src="'+attr(embedUrl)+'" title="Reel Instagram terbaru @advent.galilea" loading="lazy" scrolling="no" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div><section class="instagram-reel-copy"><span class="instagram-reel-badge">'+brandIcon('instagram')+'REEL TERBARU</span><h3>@advent.galilea</h3><p class="instagram-reel-caption">'+esc(caption)+'</p>'+(reel.publishedLabel?'<p class="instagram-reel-meta">'+esc(reel.publishedLabel)+'</p>':'')+'<div class="instagram-reel-actions"><a class="btn primary" href="'+attr(permalink)+'" target="_blank" rel="noopener">'+brandIcon('instagram')+'Tonton di Instagram'+icon('external')+'</a><a class="btn" href="https://www.instagram.com/advent.galilea/" target="_blank" rel="noopener">Lihat profil</a></div></section></article>';
          return true;
        }catch(error){box.innerHTML=instagramReelFallback(error&&error.message);return false;}
      }
      async function loadHomeAsync() {
        await Promise.allSettled([loadDevotionalHome(),loadInstagramHome()]);
      }

      function renderAboutSite() {
        const site = state.data.site || {};
        const title = site.website_about_title || 'Sebuah ruang digital yang terasa teduh, jelas, dan dekat.';
        const intro = site.website_about_intro || 'Website ini membantu jemaat melihat jadwal, menemukan bacaan, dan menghubungi pengurus dengan lebih mudah. Kami menyiapkannya untuk mendukung ibadah dan menjaga jemaat tetap terhubung.';
        const palette = site.website_palette_text || 'Hijau tua mengingatkan pada pertumbuhan dan pengharapan. Emas memberi rasa hangat, sebagai pengingat kepada Yesus, Terang Dunia. Warna gading menjaga halaman tetap nyaman dibaca.';
        const logo = site.website_logo_text || 'Nyala api Advent, Alkitab yang terbuka, dan salib bertemu dalam satu lambang. Bagi kami, bentuk ini bercerita tentang Kristus yang tetap menjadi pusat, firman yang hidup, dan kabar baik yang terus bergerak keluar.';
        const purpose = site.website_purpose_text || 'Tujuannya sederhana: membuat informasi ibadah dan pelayanan lebih mudah ditemukan, dibaca dari ponsel, serta ditampilkan dengan tenang saat kebaktian. Teknologi dipakai untuk membantu pelayanan, bukan mengambil alih persekutuan.';
        const developer = site.website_developer || 'Kevin Oloan Simatupang';
        return pageHead('Tentang Website', title, intro) +
          '<section class="section about-site-section"><div class="shell about-site-layout">' +
            '<article class="about-story-card about-palette-card"><div><span class="chip brand">WARNA YANG PUNYA ARTI</span><h2>Teduh, hangat, dan tetap jernih.</h2><p>' + esc(palette) + '</p></div><div class="palette-row" aria-label="Palet warna website"><span class="palette-swatch is-green"><b>Hijau</b><small>Pertumbuhan</small></span><span class="palette-swatch is-gold"><b>Emas</b><small>Terang</small></span><span class="palette-swatch is-ivory"><b>Gading</b><small>Kejernihan</small></span></div></article>' +
            '<article class="about-story-card about-logo-card"><div class="about-logo-visual"><span class="theme-logo-pair"><img class="logo-light" src="/assets/logo-galilea-light.webp" alt="Logo GMAHK Galilea"><img class="logo-dark" src="/assets/logo-galilea-dark.webp" alt="Logo GMAHK Galilea"></span><span class="about-logo-halo" aria-hidden="true"></span></div><div><span class="chip">CERITA DI BALIK LOGO</span><h2>Kristus tetap menjadi pusat.</h2><p>' + esc(logo) + '</p></div></article>' +
            '<article class="about-story-card about-purpose-card"><span class="chip brand">UNTUK APA WEBSITE INI?</span><h2>Pelayanan yang lebih mudah dijangkau.</h2><p>' + esc(purpose) + '</p><div class="about-purpose-points"><span>' + icon('calendar') + 'Jadwal yang jelas</span><span>' + icon('book') + 'Bacaan yang mudah dibuka</span><span>' + icon('users') + 'Jemaat tetap terhubung</span></div></article>' +
            '<aside class="developer-signature"><span class="eyebrow">Dikembangkan oleh</span><strong>' + esc(developer) + '</strong><p>Dirancang untuk melayani kebutuhan digital Jemaat Galilea, dengan perhatian pada keterbacaan, kesederhanaan, dan suasana ibadah.</p></aside>' +
          '</div></section>';
      }

      function renderChurch() {
        const site = state.data.site;
        const missions = String(site.mission || '').split(/\n+/).filter(Boolean);
        const image = safeUrl(site.church_image_url);
        return pageHead('Tentang Galilea', site.about_title || site.church_name, site.about_text) +
          '<section class="section"><div class="shell"><div class="grid grid-2"><article class="card card-pad"><span class="chip brand">Sejak ' + esc(site.church_established || '') + '</span><h2 style="margin-top:26px">Perjalanan Jemaat Galilea.</h2><p class="lead">' + esc(site.church_history || '') + '</p></article><article class="card" style="min-height:430px;background:linear-gradient(145deg,var(--tone-800),var(--tone-600))">' + (image ? '<img src="' + attr(image) + '" alt="Gereja Galilea" style="width:100%;height:100%;object-fit:cover">' : '<div style="height:100%;display:grid;place-items:center;color:var(--tone-50)">' + icon('church') + '<strong>GMAHK Galilea Balikpapan</strong></div>') + '</article></div></div></section>' +
          '<section class="section"><div class="shell"><div class="grid grid-2"><article class="card card-pad"><p class="eyebrow">Visi</p><p class="quote">' + esc(site.vision || '') + '</p></article><article class="card card-pad"><p class="eyebrow">Misi</p><ul class="prose-list">' + missions.map(item => '<li>' + icon('check') + '<span>' + esc(item) + '</span></li>').join('') + '</ul></article></div></div></section>' +
          '<section class="section"><div class="shell"><button class="btn long-action primary" type="button" data-route="contact"><span>Alamat, jadwal ibadah, dan kontak gereja</span>' + icon('arrow') + '</button></div></section>';
      }

      function renderLeaders() {
        const leaders = state.data.leaders;
        return pageHead('Pelayanan', 'Pengurus Gereja', 'Kenali para pelayan yang mendampingi kehidupan dan pelayanan jemaat.') +
          '<section class="section"><div class="shell"><div class="grid grid-3">' + (leaders.length ? leaders.map(leader => '<article class="card profile-card lift">' + leaderAvatar(leader) + '<span class="chip brand profile-role">' + esc(leader.role) + '</span><h3>' + esc(leader.name) + '</h3><p class="muted">' + esc(leader.description || 'Melayani Jemaat Galilea Balikpapan.') + '</p></article>').join('') : emptyText('Data pengurus belum dipublikasikan.')) + '</div></div></section>';
      }

      function scheduleSummaryEntries() {
        const data=state.data||{};
        return [
          data.nextWednesday?{label:'Ibadah Rabu Malam',source:data.nextWednesday}:null,
          data.nextSabbath?{label:'Ibadah Sabat',source:data.nextSabbath}:null
        ].filter(Boolean).sort((a,b)=>new Date(a.source.timestamp||a.source.isoDate||0)-new Date(b.source.timestamp||b.source.isoDate||0));
      }

      function scheduleSummaryText() {
        const entries=scheduleSummaryEntries();
        if (!entries.length) return whatsappTemplate('JADWAL IBADAH','Jadwal belum diterbitkan','','');
        const sections=[];
        entries.forEach(entry=>{
          const item=entry.source,services=(item.services||[]).length?item.services:[{title:entry.label,fields:item.fields||[]}];
          services.forEach(service=>sections.push({title:(entry.label===service.title?entry.label:entry.label+' · '+service.title),lines:[(item.dateLabel||'')+' · '+String(item.time||'').replace(':','.')+(String(item.time||'').toUpperCase().includes('WITA')?'':' WITA')].concat((service.fields||[]).map(field=>'• '+field.label+': '+field.value))}));
        });
        return whatsappTemplate('JADWAL IBADAH TERDEKAT',entries[0].source.dateLabel,state.data.periodLabel||'',sections);
      }

      function renderSchedule() {
        const data = state.data;
        const tabs = [
          ['summary','Ringkasan Terdekat'],['khotbah','Kebaktian Khotbah'],['sekolahSabat','Sekolah Sabat'],
          ['doa','Ibadah Rabu Malam'],['pemuda','Pemuda Advent'],['mine','Jadwal Saya']
        ];
        const toolbar = '<div class="toolbar"><div class="tabs">' + tabs.map(tab => '<button class="tab ' + (state.scheduleTab === tab[0] ? 'active' : '') + '" type="button" data-schedule-tab="' + tab[0] + '">' + esc(tab[1]) + '</button>').join('') + '</div><div class="filters"><button class="btn" type="button" data-open-screen-check>' + icon('external') + 'Uji Tampilan</button><button class="btn" type="button" data-download-quarterly>' + icon('download') + 'PDF Triwulan</button><a class="btn soft" href="' + attr(data.site.schedule_spreadsheet_url) + '" target="_blank" rel="noopener">' + icon('external') + 'Buka Spreadsheet</a></div></div>';
        let content = '';
        if (state.scheduleTab === 'summary') {
          content = nextScheduleHtml(data.nextSabbath) + (data.nextWednesday ? '<div class="section-head" style="margin:42px 0 20px"><div><h2>Ibadah Rabu Malam</h2></div></div>' + scheduleCard(data.sections.find(section => section.id === 'doa'), data.nextWednesday, 0) : '');
        } else if (state.scheduleTab === 'mine') {
          content = '<article class="card card-pad"><p class="eyebrow">Cari pelayanan</p><h2>Jadwal Saya</h2><p class="muted">Ketik sebagian nama untuk melihat semua tugas pada periode jadwal aktif.</p><form class="search-box" id="member-form"><input id="member-input" required minlength="2" placeholder="Contoh: Kevin"><button class="btn primary" type="submit">Cari' + icon('search') + '</button></form><div id="member-results" style="margin-top:22px"></div></article>';
        } else {
          const section = data.sections.find(item => item.id === state.scheduleTab);
          const records = section ? section.records.filter(record => state.scheduleFilter === 'all' || record.status !== 'past') : [];
          content = '<div class="toolbar"><div class="tabs"><button class="tab ' + (state.scheduleFilter === 'upcoming' ? 'active' : '') + '" data-schedule-filter="upcoming">Mendatang</button><button class="tab ' + (state.scheduleFilter === 'all' ? 'active' : '') + '" data-schedule-filter="all">Semua Jadwal</button></div><span class="chip">' + esc(records.length) + ' jadwal</span></div><div class="schedule-grid">' + (records.length ? records.map((record,index) => scheduleCard(section,record,index)).join('') : emptyText('Belum ada jadwal yang dapat ditampilkan.')) + '</div>';
        }
        return pageHead(data.periodLabel, 'Jadwal Ibadah', 'Ringkasan terdekat tampil lebih dulu. Pilih jenis ibadah untuk melihat pembagian pelayanan.') + '<section class="section" style="padding-top:10px"><div class="shell">' + toolbar + content + '</div></section>';
      }

      function scheduleCard(section, record, index) {
        if (!section || !record) return '';
        const fields = record.fields || [];
        return '<article class="card schedule-card lift ' + (record.status === 'next' ? 'next' : '') + '" data-schedule-card data-section="' + attr(section.title) + '" data-date="' + attr(record.dateLabel) + '" data-time="' + attr(record.time) + '"><div class="schedule-top"><div>' + (record.status === 'next' ? '<span class="chip gold">BERIKUTNYA</span>' : '<span class="chip">' + esc(record.status === 'past' ? 'SELESAI' : 'MENDATANG') + '</span>') + '<h3>' + esc(record.dateLabel) + '</h3><div class="meta"><span>' + icon('clock') + esc(record.time.replace(':','.') + ' WITA') + '</span></div></div>' + (record.countdown ? '<span class="chip brand">' + esc(record.countdown) + '</span>' : '') + '</div>' + fieldsHtml(fields) + '<div class="schedule-actions"><button class="btn whatsapp" type="button" data-whatsapp-card>' + brandIcon('whatsapp') + '<span>WhatsApp</span></button><button class="btn" type="button" data-share-card>' + icon('share') + '<span>Lainnya</span></button><button class="btn" type="button" data-calendar>' + icon('calendar') + '<span>Kalender</span></button><button class="btn" type="button" data-poster>' + icon('download') + '<span>Poster</span></button></div><script type="application/json" class="schedule-json">' + JSON.stringify({sectionTitle:section.title,record:record}).replace(/</g,'\\u003c') + '<' + '/script></article>';
      }

      function memberResultsHtml(payload) {
        if (!payload.results.length) return emptyText('Nama tersebut belum ditemukan pada jadwal aktif. Coba gunakan sebagian nama.');
        return '<div class="toolbar"><div><strong>' + esc(payload.count) + ' pelayanan ditemukan</strong><br><span class="small faint">Hasil sesuai pencarian “' + esc(payload.query) + '”</span></div><button class="btn primary" type="button" data-download-member-schedule>' + icon('download') + 'Unduh sebagai gambar</button></div><div class="schedule-grid">' + payload.results.map(item => '<article class="card schedule-card"><span class="chip brand">' + esc(item.sectionTitle) + '</span><h3 style="margin-top:16px">' + esc(item.dateLabel) + '</h3><div class="meta"><span>' + icon('clock') + esc(item.time.replace(':','.') + ' WITA') + '</span></div>' + fieldsHtml(item.roles) + '</article>').join('') + '</div>';
      }

      function renderSabbath() {
        const tabs = [['lesson','Pelajaran Sekolah Sabat'],['mission','Berita Misi'],['offering','Bacaan Persembahan'],['personal','Penginjilan Perorangan']];
        const years = [];
        for (let year = new Date().getFullYear() + 1; year >= 2016; year--) years.push(year);
        return pageHead('Perpustakaan Sabat', 'Firman untuk dipelajari dan dibagikan.', 'Pilih tahun dan triwulan. Materi dibuka langsung di halaman ini.') +
          '<section class="section" style="padding-top:10px"><div class="shell"><div class="toolbar"><div class="tabs">' + tabs.map(tab => '<button class="tab ' + (state.sabbathTab === tab[0] ? 'active' : '') + '" type="button" data-sabbath-tab="' + tab[0] + '">' + esc(tab[1]) + '</button>').join('') + '</div><div class="filters"><div class="field-control"><label for="sabbath-year">Tahun</label><select id="sabbath-year">' + years.map(year => '<option ' + (year === state.sabbathYear ? 'selected' : '') + '>' + year + '</option>').join('') + '</select></div><div class="field-control"><label for="sabbath-quarter">Triwulan</label><select id="sabbath-quarter">' + [1,2,3,4].map(q => '<option value="' + q + '" ' + (q === state.sabbathQuarter ? 'selected' : '') + '>Triwulan ' + ['','I','II','III','IV'][q] + '</option>').join('') + '</select></div></div></div><div id="sabbath-content">' + loadingBox('Menyiapkan Sekolah Sabat','Mengambil pelajaran resmi sesuai minggu dan triwulan…') + '</div></div></section>';
      }

      async function loadSabbath() {
        const box = $('#sabbath-content');
        if (!box) return;
        if (state.sabbathTab === 'personal') return loadPersonalEvangelism();
        if (state.sabbathTab === 'mission' || state.sabbathTab === 'offering') return loadSabbathResources(state.sabbathTab);
        box.innerHTML = loadingBox('Menyiapkan pelajaran','Mencocokkan minggu ini dengan sumber Sekolah Sabat…');
        const key = 'v1700-ss-' + state.sabbathYear + '-' + state.sabbathQuarter;
        try {
          const cached = cacheGet(key);
          let data = cached || await server('getSabbathSchoolLibrary',[state.sabbathYear,state.sabbathQuarter,false]);
          if (!data || !Array.isArray(data.lessons) || !data.lessons.length) {
            cacheRemove(key);
            data = await server('getSabbathSchoolLibrary',[state.sabbathYear,state.sabbathQuarter,true]);
          }
          cacheSet(key,data,1800000);
          state.async.sabbath = data;
          if (!$('#sabbath-content')) return;
          if (!data || !Array.isArray(data.lessons) || !data.lessons.length) return box.innerHTML = errorBox(data && data.message || 'Pelajaran periode ini belum tersedia.');
          const current = selectCurrentLesson(data.lessons);
          box.innerHTML = '<article class="card lesson-feature"><div class="lesson-feature-cover">' + (current.coverUrl || data.quarterly.coverUrl ? '<img src="' + attr(current.coverUrl || data.quarterly.coverUrl) + '" alt="' + attr(current.title) + '">' : '') + '</div><div class="lesson-feature-body"><span class="chip gold">PELAJARAN MINGGU INI</span><h2>' + esc(current.title) + '</h2><p class="lead">' + esc(current.dateLabel || data.quarterly.humanDate || '') + '</p><div class="button-row"><button class="btn primary" type="button" data-lesson-id="' + attr(current.id) + '">Mulai membaca' + icon('arrow') + '</button><button class="btn" type="button" data-download-lesson-id="' + attr(current.id) + '">' + icon('download') + 'Unduh pelajaran</button></div></div></article><div class="section-head" style="margin-top:42px"><div><p class="eyebrow">Pelajaran lainnya</p><h2>Triwulan ' + ['','I','II','III','IV'][state.sabbathQuarter] + ' · ' + state.sabbathYear + '</h2></div></div><div class="grid grid-3">' + data.lessons.map(lesson => '<article class="card library-card lift"><span class="chip ' + (lesson.isCurrent ? 'gold' : '') + '">' + (lesson.isCurrent ? 'MINGGU INI' : lesson.isUpcoming ? 'MENDATANG' : 'PELAJARAN ' + esc(lesson.number)) + '</span><h3>' + esc(lesson.title) + '</h3><p class="muted">' + esc(lesson.dateLabel || '') + '</p><div class="library-actions"><button class="link-arrow" type="button" data-lesson-id="' + attr(lesson.id) + '">Baca pelajaran' + icon('arrow') + '</button><button class="icon-button" type="button" data-download-lesson-id="' + attr(lesson.id) + '" aria-label="Unduh ' + attr(lesson.title) + '">' + icon('download') + '</button></div></article>').join('') + '</div>';
        } catch (error) { box.innerHTML = errorBox(error.message); }
      }

      async function fetchMissionApi(query) {
        const response=await fetch('/api/mission?'+query,{headers:{Accept:'application/json'},cache:'no-store',credentials:'same-origin'});
        let payload=null;try{payload=await response.json();}catch(_){}
        if(!response.ok||!payload||payload.ok!==true)throw new Error(payload&&payload.error||'Berita Misi otomatis belum dapat dimuat.');
        return payload;
      }

      async function fetchMissionDetail(id) {
        const key='v3200-mission-detail-'+String(id||'');
        const cached=cacheGet(key);
        if(cached)return cached;
        const payload=await fetchMissionApi('id='+encodeURIComponent(id));
        if(!payload.detail)throw new Error('Isi Berita Misi belum tersedia.');
        cacheSet(key,payload.detail,300000);
        return payload.detail;
      }

      function missionReadingHtml(detail) {
        return '<div class="mission-reader-hero"><span class="chip gold">'+esc(detail.dateLabel||'BERITA MISI')+'</span><h2>'+esc(detail.title||'Berita Misi Advent')+'</h2><p>Kisah misi untuk dibacakan pada Sekolah Sabat.</p></div><div class="reader-content mission-reading">'+cleanHtml(detail.contentHtml||'')+'</div>';
      }

      async function loadAutomaticMissionResources() {
        const box=$('#sabbath-content');if(!box)return;
        const payload=await fetchMissionApi('year='+encodeURIComponent(state.sabbathYear)+'&quarter='+encodeURIComponent(state.sabbathQuarter));
        if(!payload.featured)throw new Error('Berita Misi untuk periode ini belum diterbitkan pada sumber rujukan.');
        let detail=null,detailMessage='';
        try{detail=await fetchMissionDetail(payload.featured.sourceId);}catch(error){detailMessage=error.message||'Isi lengkap belum tersedia.';}
        if(!$('#sabbath-content'))return;
        state.async.featuredResource=detail?Object.assign({},detail,{sourceId:detail.sourceId||payload.featured.sourceId,resourceType:'mission'}):null;
        const featured=detail?Object.assign({},payload.featured,{title:detail.title,summary:detail.summary||payload.featured.summary}):payload.featured;
        const reader=detail?missionReadingHtml(detail):'<p class="lead">'+esc(featured.summary||'')+'</p><div class="notice">'+icon('info')+'<div class="notice-copy"><strong>Bacaan lengkap belum tersambung</strong><span>'+esc(detailMessage)+'</span></div></div>';
        const others=(payload.items||[]).filter(item=>item.sourceId!==featured.sourceId).slice(0,12);
        const freshness=featured.isThisSabbath
          ? '<div class="mission-live-note">'+icon('check')+'<div><strong>Bacaan Sabat terbaru sudah cocok.</strong><br><span>Sistem memeriksa sumber otomatis setiap menit.</span></div></div>'
          : '<div class="mission-live-note">'+icon('info')+'<div><strong>Materi Sabat berikutnya belum diterbitkan.</strong><br><span>Menampilkan bacaan terbaru yang tersedia dan akan berganti otomatis setelah sumber memperbaruinya.</span></div></div>';
        box.innerHTML='<div class="section-head"><div><p class="eyebrow">'+esc(payload.cadence||'Otomatis setiap Sabat')+'</p><h2>Berita Misi Advent</h2></div><span class="chip brand">Triwulan '+['','I','II','III','IV'][state.sabbathQuarter]+' · '+state.sabbathYear+'</span></div>'+freshness+'<article class="card resource-feature is-mission"><aside class="resource-aside"><span class="chip gold">'+esc(featured.badge||'TERBARU')+'</span><h2>'+esc(featured.title)+'</h2><p>'+esc(featured.dateLabel||'')+'</p><p class="resource-aside-copy">'+esc(featured.summary||'Kisah misi Advent untuk Sabat ini.')+'</p></aside><div class="resource-reading"><div class="resource-reading-head"><p class="eyebrow">Baca langsung</p>'+(detail?'<button class="btn" type="button" data-download-featured-resource="mission" data-resource-id="'+attr(featured.sourceId)+'">'+icon('download')+'Unduh bacaan</button>':'')+'</div>'+reader+'<p class="small faint">Sumber: '+esc((detail&&detail.source)||featured.source||'ben.Adam · Berita Misi Advent')+'</p></div></article>'+(others.length?'<div class="section-head" style="margin-top:42px"><div><p class="eyebrow">Arsip Triwulan</p><h2>Berita Misi Sabat lainnya.</h2></div></div><div class="grid grid-3">'+others.map(item=>'<button class="card library-card lift" type="button" data-resource-type="mission" data-resource-id="'+attr(item.sourceId)+'" style="text-align:left"><span class="chip '+(item.badge?'gold':'')+'">'+esc(item.badge||item.dateLabel||'Berita Misi')+'</span><h3>'+esc(item.title)+'</h3><p class="muted">'+esc(item.summary||'')+'</p><span class="link-arrow">Baca di sini'+icon('arrow')+'</span></button>').join('')+'</div>':'');
      }

      async function downloadFeaturedResource(button){
        const type=String(button&&button.dataset.downloadFeaturedResource||'').toLowerCase();
        const id=String(button&&button.dataset.resourceId||'');
        if(!type||!id)return toast('Bacaan belum siap diunduh.');
        const oldHtml=button.innerHTML;button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=icon('refresh')+'Menyiapkan…';
        try{
          const key='v3500-download-'+type+'-'+id;
          const loaded=state.async.featuredResource;
          const loadedId=loaded&&String(loaded.sourceId||loaded.id||'');
          let data=loaded&&String(loaded.resourceType||loaded.type||type).toLowerCase()===type&&loadedId===id?loaded:cacheGet(key);
          if(!data)data=type==='mission'?await fetchMissionDetail(id):await server('getSabbathResourceDetail',[type,id]);
          cacheSet(key,data,21600000);downloadResourceData(data);
        }catch(error){toast(error.message||'Bacaan belum dapat diunduh.');}
        finally{button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=oldHtml;}
      }

      async function loadSabbathResources(type) {
        if(type==='mission'){
          const box=$('#sabbath-content');if(!box)return;
          state.async.featuredResource=null;
          box.innerHTML=loadingBox('Menyiapkan Berita Misi','Mencocokkan bacaan dengan Sabat terbaru dan periode WITA…');
          try{return await loadAutomaticMissionResources();}
          catch(autoError){
            return loadLegacySabbathResources(type,'Sumber otomatis belum dapat dihubungi. Menampilkan link cadangan dari panel admin. '+(autoError.message||''));
          }
        }
        return loadLegacySabbathResources(type);
      }

      async function loadLegacySabbathResources(type, fallbackMessage) {
        const box = $('#sabbath-content');
        if (!box) return;
        state.async.featuredResource = null;
        box.innerHTML = loadingBox(type === 'mission' ? 'Menyiapkan Berita Misi' : 'Menyiapkan Bacaan Persembahan', type === 'mission' ? 'Mencari bacaan resmi untuk Sabat terdekat…' : 'Membuka bacaan Sabat mendatang pada halaman yang tepat…');
        const label = type === 'mission' ? 'Berita Misi Dewasa' : 'Bacaan Persembahan';
        try {
          const key = 'v1700-ss-resource-' + type + '-' + state.sabbathYear + '-' + state.sabbathQuarter;
          const data = cacheGet(key) || await server('getSabbathResources',[type,state.sabbathYear,state.sabbathQuarter]);
          cacheSet(key,data,1800000);
          if (!$('#sabbath-content')) return;
          if (!data.featured) return box.innerHTML = emptyText(label + ' belum diterbitkan untuk periode ini. Website tidak membuat bacaan pengganti.');
          let detail = null;
          let detailMessage = '';
          if (data.featured.sourceId) {
            try {
              const detailKey = 'v12-resource-detail-' + type + '-' + data.featured.sourceId;
              detail = cacheGet(detailKey) || await server('getSabbathResourceDetail',[type,data.featured.sourceId]);
              cacheSet(detailKey,detail,21600000);
            } catch (detailError) {
              detailMessage = 'Isi lengkap sedang belum dapat diambil. Ringkasan dan arsip tetap dapat digunakan.';
            }
          }
          state.async.featuredResource = detail ? Object.assign({},detail,{sourceId:detail.sourceId||data.featured.sourceId,resourceType:type}) : null;
          const featured = data.featured;
          const manualLink=!detail&&safeUrl(featured.url)?'<a class="btn primary" href="'+attr(featured.url)+'" target="_blank" rel="noopener">Buka link bacaan cadangan'+icon('external')+'</a>':'';
          const reader = detail ? resourceReadingHtml(detail,type) : '<p class="lead">' + esc(featured.summary || '') + '</p>' + (detailMessage ? '<div class="notice">' + icon('info') + '<div class="notice-copy"><strong>Bacaan lengkap belum tersambung</strong><span>' + esc(detailMessage) + '</span></div></div>' : '')+manualLink;
          const others = (data.items || []).filter(item => item.sourceId !== featured.sourceId).slice(0,12);
          box.innerHTML = '<div class="section-head"><div><p class="eyebrow">Diperbarui otomatis · ' + esc(data.cadence) + '</p><h2>' + esc(label) + '</h2></div><span class="chip brand">Triwulan ' + ['','I','II','III','IV'][state.sabbathQuarter] + ' · ' + state.sabbathYear + '</span></div>'+(fallbackMessage?'<div class="mission-live-note">'+icon('info')+'<div><strong>Mode link cadangan admin aktif.</strong><br><span>'+esc(fallbackMessage)+'</span></div></div>':'')+'<article class="card resource-feature"><aside class="resource-aside"><span class="chip gold">' + esc(featured.badge || 'TERBARU') + '</span><h2>' + esc(type === 'offering' ? 'Bacaan untuk Sabat mendatang' : featured.title) + '</h2><p>' + esc(featured.dateLabel || '') + '</p><p class="resource-aside-copy">' + esc(type === 'offering' ? featured.title : featured.summary || '') + '</p></aside><div class="resource-reading"><div class="resource-reading-head"><p class="eyebrow">Baca langsung</p>' + (detail ? '<button class="btn" type="button" data-download-featured-resource="' + attr(type) + '" data-resource-id="' + attr(featured.sourceId) + '">' + icon('download') + 'Unduh bacaan</button>' : '') + '</div>' + reader + '<p class="small faint">Sumber: ' + esc((detail && detail.source) || featured.source || '') + '</p></div></article>' + (others.length ? '<div class="section-head" style="margin-top:42px"><div><p class="eyebrow">Arsip</p><h2>Bacaan lainnya.</h2></div></div><div class="grid grid-3">' + others.map(item => '<button class="card library-card lift" type="button" data-resource-type="' + type + '" data-resource-id="' + attr(item.sourceId) + '" style="text-align:left"><span class="chip ' + (item.badge ? 'gold' : '') + '">' + esc(item.badge || item.dateLabel || label) + '</span><h3>' + esc(item.title) + '</h3><p class="muted">' + esc(item.summary || '') + '</p><span class="link-arrow">Baca di sini' + icon('arrow') + '</span></button>').join('') + '</div>' : '');
        } catch (error) { if ($('#sabbath-content')) $('#sabbath-content').innerHTML = errorBox(error.message); }
      }

      function resourceReadingHtml(detail,type) {
        const content = '<div class="reader-content">' + cleanHtml(detail.contentHtml || '') + '</div>';
        if (!detail.documentUrl) return content;
        const isPdf = /\.pdf(?:\?|$)/i.test(detail.documentUrl);
        const directPdf = detail.documentUrl + (detail.pageNumber ? '#page=' + detail.pageNumber + '&view=FitH' : '');
        const viewer = isPdf ? directPdf : 'https://docs.google.com/gview?embedded=1&url=' + encodeURIComponent(detail.documentUrl);
        const targetNote = type === 'offering' && detail.targetDateLabel ? '<div class="notice"><span class="chip gold">SABAT ' + esc(detail.targetDateLabel) + '</span><div class="notice-copy"><strong>Langsung dibuka pada bacaan Sabat mendatang.</strong><span>Nomor Sabat dan halaman dihitung otomatis dari tanggal.</span></div></div>' : '';
        return targetNote + content + '<div class="document-frame"><iframe src="' + attr(viewer) + '" title="' + attr(detail.title) + '" loading="lazy"></iframe></div><a class="btn soft" href="' + attr(directPdf) + '" target="_blank" rel="noopener">Buka dokumen lengkap' + icon('external') + '</a>';
      }

      function selectCurrentLesson(lessons) {
        const explicit = lessons.find(item => item.isCurrent);
        if (explicit) return explicit;
        const now = new Date();
        const parse = value => {
          const text = String(value || '');
          let m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (m) return new Date(+m[3],+m[2]-1,+m[1]);
          m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          return m ? new Date(+m[1],+m[2]-1,+m[3]) : null;
        };
        return lessons.find(item => { const a=parse(item.startDate), b=parse(item.endDate); return a && b && now >= a && now <= new Date(b.getTime()+86399999); }) || lessons.find(item => { const a=parse(item.startDate); return a && a > now; }) || lessons[lessons.length-1];
      }

      async function loadPersonalEvangelism() {
        const box = $('#sabbath-content');
        if (!box) return;
        box.innerHTML = loadingBox('Menyiapkan Penginjilan Perorangan','Menyusun pokok pelayanan untuk tanggal terdekat…');
        try {
          const item = await server('getPersonalEvangelism',[state.sabbathYear,state.sabbathQuarter]);
          if (!$('#sabbath-content')) return;
          box.innerHTML = '<article class="card lesson-feature"><div class="lesson-feature-cover" style="display:grid;place-items:center;color:#fff;padding:35px">' + icon('spark') + '<div><span class="chip">' + esc(item.dateLabel) + '</span><h3 style="margin-top:22px;color:#fff;font-size:clamp(2rem,4vw,3.8rem)">Kasih yang menjadi tindakan.</h3></div></div><div class="lesson-feature-body"><span class="chip brand">PENGINJILAN PERORANGAN</span><h2>' + esc(item.title) + '</h2><p class="lead">' + esc(item.summary) + '</p><ul class="prose-list">' + item.actions.map(action => '<li>' + icon('check') + '<span>' + esc(action) + '</span></li>').join('') + '</ul><button class="btn primary" type="button" data-read-personal>Baca pokok pelajaran' + icon('arrow') + '</button></div></article>';
          state.async.personal = item;
        } catch (error) { box.innerHTML = errorBox(error.message); }
      }

      function renderBible() {
        return pageHead('Baca Alkitab', 'Firman, tersusun dengan jernih.', 'Pilihan awal sengaja dikosongkan. Pilih Perjanjian, kitab, pasal, dan ayat yang akan dibaca atau ditampilkan.') +
          '<section class="section" style="padding-top:10px"><div class="shell"><div class="bible-layout"><aside class="card bible-sidebar"><div class="bible-controls"><div><span class="field-label">Kelompok kitab</span><div class="bible-testaments"><button type="button" data-bible-testament="PL">Perjanjian Lama</button><button type="button" data-bible-testament="PB">Perjanjian Baru</button></div></div><div class="field-control"><label for="bible-book-trigger">Kitab</label><button type="button" id="bible-book-trigger" class="book-picker-trigger" aria-haspopup="dialog" aria-label="Pilih kitab"><span class="book-picker-trigger-text placeholder" id="bible-book-label">Pilih kitab\u2026</span><svg class="book-picker-trigger-caret" viewBox="0 0 16 16" aria-hidden="true"><polyline points="4,6 8,10 12,6"></polyline></svg></button><input type="hidden" id="bible-book" value=""></div><div class="grid grid-2"><div class="field-control"><label for="bible-chapter">Pasal</label><select id="bible-chapter"><option value="">Pilih pasal</option></select></div><div class="field-control"><label for="bible-verse">Ayat</label><input id="bible-verse" type="number" min="1" value="" placeholder="Pilih ayat" inputmode="numeric"></div></div><button class="btn primary" id="bible-open" type="button">Buka bacaan' + icon('arrow') + '</button></div><div class="bible-search"><div class="field-control"><label for="bible-search-input">Cari ayat</label><div class="bible-search-box"><input id="bible-search-input" type="search" placeholder="Cari ayat atau kata..." autocomplete="off" enterkeyhint="search"><button class="btn" id="bible-search-submit" type="button" aria-label="Cari ayat">' + icon('search') + '</button></div></div><div class="field-control"><label for="bible-search-scope">Cakupan pencarian</label><select id="bible-search-scope" class="bible-search-scope"><option value="all">Seluruh Alkitab</option><option value="PL">Perjanjian Lama</option><option value="PB">Perjanjian Baru</option><option value="book">Kitab terpilih</option></select></div><p class="bible-search-status" id="bible-search-status">Tekan Enter untuk mencari. Minimal 2 karakter.</p><div id="bible-search-results"></div></div><div class="archive-panel"><button class="btn" type="button" data-download-bible-book>' + icon('download') + 'Unduh kitab ini</button><button class="btn soft" type="button" data-download-archive="bible">' + icon('download') + 'PDF Alkitab lengkap</button><small class="faint">Sumber teks dicantumkan pada pembaca dan hasil unduhan.</small></div></aside><article class="card"><div class="card-pad" id="bible-heading"><p class="eyebrow">Alkitab Bahasa Indonesia</p><h2>Pilih kitab, pasal, dan ayat.</h2></div><div id="bible-content"><div class="v18-empty">Belum ada ayat yang dipilih.</div></div></article></div></div></section>';
      }

      async function loadBibleBooks() {
        try {
          const rawBooks = await cachedResource('v1710-bible-books',()=>server('getBibleBooks',[]),86400000);
          state.bibleBooks = (Array.isArray(rawBooks) ? rawBooks : []).map((book,index) => ({
            id: String(book && book.id || '').toUpperCase(),
            name: String(book && book.name || 'Kitab ' + (index + 1)),
            chapters: Math.max(1, Number(book && book.chapters) || 1),
            testament: book && book.testament === 'PL' ? 'PL' : 'PB',
            order: Number(book && book.order) || index + 1
          })).filter(book => book.id);
          if (!state.bibleBooks.length) throw new Error('Daftar kitab belum tersedia. Silakan muat ulang.');
          cacheSet('v1710-bible-books',state.bibleBooks,86400000);
          state.bibleTestament='';state.bibleTargetVerse=null;state.bibleReader=null;syncBibleTestament();
          if ($('#bible-book')) $('#bible-book').value='';
          const labelEl = $('#bible-book-label');
          if (labelEl) { labelEl.textContent = 'Pilih kitab\u2026'; labelEl.classList.add('placeholder'); }
          if ($('#bible-chapter')) $('#bible-chapter').innerHTML='<option value="">Pilih pasal</option>';
          if ($('#bible-verse')) $('#bible-verse').value='';
          loadDownloadArchives();
        } catch (error) { if ($('#bible-content')) $('#bible-content').innerHTML = errorBox(error.message); }
      }
      function populateBibleBooks(testament) {
        // Pemilih kitab sudah mengatur tampilan nama kitab.
        void testament;
      }
      function syncBibleTestament() {
        $$('[data-bible-testament]').forEach(button => {
          const active = button.dataset.bibleTestament === state.bibleTestament;
          button.classList.toggle('active',active);
          button.setAttribute('aria-pressed',String(active));
        });
      }
      async function selectBibleTestament(testament) {
        const next = testament === 'PB' ? 'PB' : 'PL';
        state.bibleTestament = next;
        syncBibleTestament();
        const firstBook = state.bibleBooks.filter(book=>book.testament===next).sort((a,b)=>a.order-b.order)[0];
        if (!firstBook) return toast('Daftar kitab belum tersedia.');
        selectBookFromPicker(firstBook.id);
        const chapterSelect = $('#bible-chapter');
        const verseInput = $('#bible-verse');
        if (chapterSelect) chapterSelect.value = '1';
        if (verseInput) verseInput.value = '1';
        return openBibleChapter();
      }
      function fillBibleChapters() {
        const bookSelect = $('#bible-book'), chapterSelect = $('#bible-chapter');
        if (!bookSelect || !chapterSelect) return;
        const book = state.bibleBooks.find(item => item.id === bookSelect.value);
        if (!book) { chapterSelect.innerHTML='<option value="">Pilih pasal</option>'; if($('#bible-verse'))$('#bible-verse').value=''; return; }
        const chapterCount = Math.max(1, Number(book && book.chapters) || 1);
        chapterSelect.innerHTML = '<option value="">Pilih pasal</option>' + Array.from({length:chapterCount},(_,i) => '<option value="' + (i+1) + '">' + (i+1) + '</option>').join('');
        chapterSelect.value='';if($('#bible-verse'))$('#bible-verse').value='';
      }
      async function openBibleChapter() {
        const bookSelect = $('#bible-book'), chapterSelect = $('#bible-chapter'), verseInput = $('#bible-verse');
        const content = $('#bible-content'), heading = $('#bible-heading');
        if (!bookSelect || !chapterSelect || !verseInput || !content || !heading) return;
        const book = String(bookSelect.value || '').toUpperCase();
        const chapter = Number(chapterSelect.value);
        const verse = Number(verseInput.value);
        if (!book || !Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verse) || verse < 1) { content.innerHTML = errorBox('Pilih kitab, pasal, dan ayat terlebih dahulu.'); return; }
        state.bibleTargetVerse = verse;
        content.innerHTML = loadingBox('Membuka firman…','Menyiapkan pasal yang dipilih.');
        try {
          const key = 'v1710-bible-' + book + '-' + chapter;
          const data = await cachedResource(key,()=>server('getBibleChapter',[book,chapter]),21600000);
          if (!$('#bible-content')) return;
          const safeChapter = Math.max(1, Number(data && data.chapter) || chapter);
          const selected = state.bibleBooks.find(item=>item.id===book);
          const safeBook = String(data && data.book || selected && selected.name || 'Kitab');
          const safeSource = String(data && data.source || 'Alkitab Terjemahan Baru (TB) — LAI');
          const verses = (Array.isArray(data && data.verses) ? data.verses : []).map((item,index) => ({
            number: String(item && (item.number != null ? item.number : item.verse != null ? item.verse : index + 1) || index + 1),
            text: String(item && (item.text != null ? item.text : item.content != null ? item.content : '') || '').trim()
          })).filter(item=>item.text);
          if (!verses.length) throw new Error('Ayat pada pasal ini belum tersedia.');
          const targetIndex=Math.max(0,verses.findIndex(item=>Number(item.number)===verse));
          state.bibleReader={bookId:book,book:safeBook,chapter:safeChapter,source:safeSource,verses:verses,index:targetIndex};
          heading.innerHTML = '<p class="eyebrow">' + esc(safeSource) + '</p><h2>' + esc(safeBook) + ' ' + esc(safeChapter) + '</h2>';
          const savedItem={type:'bible',id:book+'-'+safeChapter,title:safeBook+' '+safeChapter,subtitle:safeSource,route:'bible'};
          rememberItem(savedItem);
          content.innerHTML = '<div class="v18-reader-tools">'+favoriteButton(savedItem)+'<button class="btn primary present-button" type="button" data-present-bible>'+icon('external')+'Mode layar</button></div><div class="verse-list">' + verses.map(item => '<div class="verse ' + (Number(item.number)===verse?'is-target':'') + '" id="verse-' + attr(item.number) + '"><span class="verse-number">' + esc(item.number) + '</span><span class="verse-text">' + esc(item.text) + '</span></div>').join('') + '</div><footer class="card-pad small faint">' + esc(safeSource) + ' · Mode layar menampilkan satu ayat besar dan jelas.</footer>';
          requestAnimationFrame(()=>document.getElementById('verse-' + String(verse))?.scrollIntoView({behavior:document.documentElement.dataset.motion==='reduced'?'auto':'smooth',block:'center'}));
        } catch (error) { if ($('#bible-content')) $('#bible-content').innerHTML = errorBox(error.message); }
      }

      // GALILEA-BIBLE-SEARCH · memakai sumber tunggal yang sama dengan pembaca ayat.
      function bibleSearchStatus(message) {
        const node = $('#bible-search-status');
        if (node) node.textContent = message;
      }
      function bibleSearchSnippet(text, query) {
        const raw = String(text || '');
        const needle = String(query || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const at = needle ? raw.toLowerCase().indexOf(needle) : -1;
        if (at < 0) return esc(raw.slice(0, 150));
        const from = Math.max(0, at - 42);
        const lead = from > 0 ? '…' : '';
        return lead + esc(raw.slice(from, at)) + '<mark>' + esc(raw.substr(at, needle.length)) + '</mark>' + esc(raw.slice(at + needle.length, at + needle.length + 96));
      }
      async function runBibleSearch() {
        const input = $('#bible-search-input'), box = $('#bible-search-results');
        if (!input || !box) return;
        const query = String(input.value || '').replace(/\s+/g, ' ').trim();
        if (query.length < 2) { box.innerHTML = ''; bibleSearchStatus('Ketik minimal 2 karakter untuk mencari.'); return; }

        const scopeSelect = $('#bible-search-scope');
        let scope = scopeSelect ? scopeSelect.value : 'all';
        if (scope === 'book') {
          const selected = $('#bible-book')?.value;
          if (!selected) { box.innerHTML = ''; bibleSearchStatus('Pilih kitab terlebih dahulu untuk cakupan "Kitab terpilih".'); return; }
          scope = selected;
        }

        const token = (state.bibleSearchToken = (state.bibleSearchToken || 0) + 1);
        if (state.bibleSearchBusy) return;
        state.bibleSearchBusy = true;
        const button = $('#bible-search-submit');
        if (button) button.disabled = true;
        bibleSearchStatus('Mencari “' + query + '”…');
        box.innerHTML = loadingBox('Mencari ayat…', 'Menelusuri teks Alkitab pada cakupan yang dipilih.');

        try {
          const key = 'v1710-bible-search-' + scope + '-' + query.toLowerCase();
          const data = await cachedResource(key, () => server('searchBible', [query, scope], 45000), 86400000);
          if (token !== state.bibleSearchToken || !$('#bible-search-results')) return;
          const results = Array.isArray(data && data.results) ? data.results : [];
          state.bibleSearchResults = results;
          if (!results.length) {
            box.innerHTML = '<div class="v18-empty">Tidak ada ayat yang cocok dengan “' + esc(query) + '”.</div>';
            bibleSearchStatus(data && data.partial ? 'Pencarian belum mencakup seluruh cakupan. Persempit cakupan lalu coba lagi.' : 'Tidak ada hasil. Coba kata lain atau ubah cakupan.');
            return;
          }
          box.innerHTML = results.map((item, index) => '<button class="bible-search-hit" type="button" data-bible-hit="' + index + '"><span class="bible-search-ref">' + esc(item.book) + ' ' + esc(item.chapter) + ':' + esc(item.verse) + '</span><span class="bible-search-snippet">' + bibleSearchSnippet(item.text, query) + '</span></button>').join('');
          let note = results.length + ' ayat ditemukan';
          if (data && data.limited) note += ' (ditampilkan sebagian)';
          if (data && data.timedOut) note += ' · pencarian dihentikan karena batas waktu, persempit cakupan';
          else if (data && data.partial) note += ' · cakupan belum tuntas dipindai';
          bibleSearchStatus(note + '.');
        } catch (error) {
          if (token !== state.bibleSearchToken || !$('#bible-search-results')) return;
          box.innerHTML = errorBox(error.message);
          bibleSearchStatus('Pencarian gagal. Periksa koneksi lalu coba lagi.');
        } finally {
          state.bibleSearchBusy = false;
          const submit = $('#bible-search-submit');
          if (submit) submit.disabled = false;
        }
      }
      async function openBibleSearchHit(index) {
        const hit = (state.bibleSearchResults || [])[Number(index)];
        if (!hit) return;
        const bookSelect = $('#bible-book'), chapterSelect = $('#bible-chapter'), verseInput = $('#bible-verse');
        if (!bookSelect || !chapterSelect || !verseInput) return;
        const book = state.bibleBooks.find(item => item.id === hit.bookId);
        if (book) {
          state.bibleTestament = book.testament;
          syncBibleTestament();
          bookSelect.value = hit.bookId;
          const labelEl = $('#bible-book-label');
          if (labelEl) { labelEl.textContent = book.name; labelEl.classList.remove('placeholder'); }
          saveBookRecent(hit.bookId, book.name);
        } else {
          bookSelect.value = hit.bookId;
        }
        fillBibleChapters();
        chapterSelect.value = String(hit.chapter);
        verseInput.value = String(hit.verse);
        await openBibleChapter();
      }

      // =====================================================================
      // BIBLE BOOK PICKER · Searchable, keyboard-friendly, accessible
      // =====================================================================
      const BOOK_ABBR_ID = {
        GEN:'Kej',EXO:'Kel',LEV:'Im',NUM:'Bil',DEU:'Ul',
        JOS:'Yos',JDG:'Hak',RUT:'Rut','1SA':'1Sam','2SA':'2Sam',
        '1KI':'1Raj','2KI':'2Raj','1CH':'1Taw','2CH':'2Taw',EZR:'Ezr',
        NEH:'Neh',EST:'Est',JOB:'Ayb',PSA:'Mzm',PRO:'Ams',
        ECC:'Pkh',SNG:'Kid',ISA:'Yes',JER:'Yer',LAM:'Rat',
        EZK:'Yeh',DAN:'Dan',HOS:'Hos',JOL:'Yl',AMO:'Am',
        OBA:'Ob',JON:'Yun',MIC:'Mi',NAM:'Nah',HAB:'Hab',
        ZEP:'Zef',HAG:'Hag',ZEC:'Za',MAL:'Mal',
        MAT:'Mat',MRK:'Mrk',LUK:'Luk',JHN:'Yoh',ACT:'Kis',
        ROM:'Rm','1CO':'1Kor','2CO':'2Kor',GAL:'Gal',EPH:'Ef',
        PHP:'Flp',COL:'Kol','1TH':'1Tes','2TH':'2Tes','1TI':'1Tim',
        '2TI':'2Tim',TIT:'Tit',PHM:'Flm',HEB:'Ibr',JAS:'Yak',
        '1PE':'1Pet','2PE':'2Pet','1JN':'1Yoh','2JN':'2Yoh','3JN':'3Yoh',
        JUD:'Yud',REV:'Why'
      };
      // Alias tambahan untuk pencarian (singkatan alternatif umum)
      const BOOK_ABBR_SEARCH_EXTRA = {
        '1sam':'1SA','2sam':'2SA','1raj':'1KI','2raj':'2KI','1taw':'1CH','2taw':'2CH',
        'mzm':'PSA','ams':'PRO','pkh':'ECC','kid':'SNG','yes':'ISA','yer':'JER','rat':'LAM',
        'yeh':'EZK','yl':'JOL','yun':'JON','za':'ZEC',
        'mat':'MAT','mrk':'MRK','luk':'LUK','yoh':'JHN','kis':'ACT','rm':'ROM',
        '1kor':'1CO','2kor':'2CO','gal':'GAL','ef':'EPH','flp':'PHP','kol':'COL',
        '1tes':'1TH','2tes':'2TH','1tim':'1TI','2tim':'2TI','tit':'TIT','flm':'PHM',
        'ibr':'HEB','yak':'JAS','1pet':'1PE','2pet':'2PE',
        '1yoh':'1JN','2yoh':'2JN','3yoh':'3JN','yud':'JUD','why':'REV',
        'kej':'GEN','kel':'EXO','im':'LEV','bil':'NUM','ul':'DEU',
        'yos':'JOS','hak':'JDG','rut':'RUT','ezr':'EZR','neh':'NEH','est':'EST',
        'ayb':'JOB','hos':'HOS','am':'AMO','ob':'OBA','mi':'MIC','nah':'NAM','hab':'HAB',
        'zef':'ZEP','hag':'HAG','mal':'MAL','dan':'DAN'
      };
      const BOOK_PICKER_RECENTS_KEY = 'galilea-book-recents-v1';
      const BOOK_PICKER_RECENTS_MAX = 3;

      function getBookAbbr(id) {
        return BOOK_ABBR_ID[id.toUpperCase()] || id;
      }
      function getBookRecents() {
        try { return JSON.parse(localStorage.getItem(BOOK_PICKER_RECENTS_KEY) || '[]'); }
        catch(e) { return []; }
      }
      function saveBookRecent(id, name) {
        try {
          const prev = getBookRecents().filter(r => r.id !== id);
          const next = [{ id, name, abbr: getBookAbbr(id) }, ...prev].slice(0, BOOK_PICKER_RECENTS_MAX);
          localStorage.setItem(BOOK_PICKER_RECENTS_KEY, JSON.stringify(next));
        } catch(e) {}
      }

      function filterBibleBooks(query, testament) {
        const books = state.bibleBooks || [];
        let pool = testament ? books.filter(b => b.testament === testament) : books;
        if (!query) return pool.sort((a,b) => a.order-b.order);
        const q = query.toLowerCase().replace(/\s+/g,'');
        const matchId = BOOK_ABBR_SEARCH_EXTRA[q];
        return pool.filter(b => {
          if (matchId && b.id === matchId) return true;
          const abbr = (getBookAbbr(b.id) || '').toLowerCase().replace(/\s+/g,'');
          const name = (b.name || '').toLowerCase().replace(/\s+/g,'');
          return name.includes(q) || abbr.includes(q) || b.id.toLowerCase().includes(q);
        }).sort((a,b) => a.order-b.order);
      }

      function renderBookPickerBody(query) {
        const selectedId = $('#bible-book') ? $('#bible-book').value : '';
        const filtered = filterBibleBooks(query, '');
        if (!filtered.length) {
          return '<div class="book-picker-empty"><strong>Kitab tidak ditemukan</strong>Coba variasi lain, misal "yoh", "1kor", "mzm"</div>';
        }
        const recents = (!query) ? getBookRecents() : [];
        const recentsHtml = recents.length ? `
          <div class="book-picker-recents">
            <div class="book-picker-section-label">Terakhir dibaca</div>
            <div class="book-picker-recents-row">
              ${recents.map(r => `<button type="button" class="book-picker-recent-btn" data-pick-book="${esc(r.id)}"><span class="abr">${esc(r.abbr)}</span>${esc(r.name)}</button>`).join('')}
            </div>
          </div>` : '';
        const groups = [['PL','Perjanjian Lama'],['PB','Perjanjian Baru']];
        const groupsHtml = groups.map(([code, label]) => {
          const books = filtered.filter(b => b.testament === code);
          if (!books.length) return '';
          return `<div class="book-picker-group">
            <div class="book-picker-section-label">${label}</div>
            <div class="book-picker-grid">
              ${books.map(b => `<button type="button" class="book-picker-item${b.id===selectedId?' selected':''}" data-pick-book="${esc(b.id)}"><span class="book-picker-item-abr">${esc(getBookAbbr(b.id))}</span><span class="book-picker-item-name">${esc(b.name)}</span></button>`).join('')}
            </div>
          </div>`;
        }).join('');
        return recentsHtml + groupsHtml;
      }

      function openBookPicker() {
        if (!state.bibleBooks || !state.bibleBooks.length) { toast('Daftar kitab belum tersedia, tunggu sebentar.'); return; }
        // Inject DOM if not present
        if (!$('#book-picker-panel')) {
          const backdrop = document.createElement('div');
          backdrop.id = 'book-picker-backdrop';
          backdrop.className = 'book-picker-backdrop';
          backdrop.setAttribute('aria-hidden','true');
          document.body.appendChild(backdrop);
          const panel = document.createElement('div');
          panel.id = 'book-picker-panel';
          panel.className = 'book-picker-panel';
          panel.setAttribute('role','dialog');
          panel.setAttribute('aria-modal','true');
          panel.setAttribute('aria-label','Pilih kitab Alkitab');
          panel.innerHTML = `
            <div class="book-picker-handle" aria-hidden="true"></div>
            <div class="book-picker-header">
              <strong>Pilih Kitab</strong>
              <button type="button" class="book-picker-close" id="book-picker-close" aria-label="Tutup">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>
              </button>
            </div>
            <div class="book-picker-search-wrap">
              <div class="book-picker-search">
                <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/></svg>
                <input type="search" id="book-picker-input" class="book-picker-input" placeholder="Cari kitab atau singkatan…" autocomplete="off" enterkeyhint="search" autocorrect="off" autocapitalize="off" spellcheck="false">
              </div>
            </div>
            <div class="book-picker-body" id="book-picker-body"></div>`;
          document.body.appendChild(panel);
          // Bind close and search
          backdrop.addEventListener('click', closeBookPicker);
          $('#book-picker-close').addEventListener('click', closeBookPicker);
          $('#book-picker-input').addEventListener('input', e => {
            const q = e.target.value.replace(/\s+/g,' ').trim();
            $('#book-picker-body').innerHTML = renderBookPickerBody(q);
          });
          panel.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeBookPicker();
          });
          panel.addEventListener('click', e => {
            const btn = e.target.closest('[data-pick-book]');
            if (btn) selectBookFromPicker(btn.dataset.pickBook);
          });
        }
        // Render body
        $('#book-picker-body').innerHTML = renderBookPickerBody('');
        // Open
        requestAnimationFrame(() => {
          $('#book-picker-backdrop').classList.add('open');
          $('#book-picker-panel').classList.add('open');
          setTimeout(() => { const inp = $('#book-picker-input'); if(inp){inp.value='';inp.focus();} }, 80);
        });
        document.body.style.overflow = 'hidden';
      }

      function closeBookPicker() {
        const panel = $('#book-picker-panel'), backdrop = $('#book-picker-backdrop');
        if (panel) panel.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
        document.body.style.overflow = '';
        // Return focus to trigger
        const trigger = $('#bible-book-trigger');
        if (trigger) trigger.focus();
      }

      function selectBookFromPicker(bookId) {
        const book = (state.bibleBooks || []).find(b => b.id === bookId);
        if (!book) return;
        // Update hidden input
        const hiddenInput = $('#bible-book');
        if (hiddenInput) hiddenInput.value = bookId;
        // Update trigger label
        const labelEl = $('#bible-book-label');
        if (labelEl) {
          labelEl.textContent = book.name;
          labelEl.classList.remove('placeholder');
        }
        // Sync testament
        state.bibleTestament = book.testament;
        syncBibleTestament();
        // Fill chapters
        fillBibleChapters();
        // Save to recents
        saveBookRecent(bookId, book.name);
        closeBookPicker();
      }

      async function downloadBibleBook() {
        const bookId = $('#bible-book')?.value; if (!bookId) return;
        toast('Menyiapkan kitab…');
        try {
          const data = await server('getBibleBook',[bookId],20000);
          const safeBook = String(data && data.book || 'Kitab');
          const chapters = Array.isArray(data && data.chapters) ? data.chapters : [];
          if (!chapters.length) throw new Error('Isi kitab belum tersedia untuk diunduh.');
          const body = chapters.map((chapter,index)=>'<section class="day"><h2>' + esc(safeBook) + ' ' + esc(chapter && chapter.number != null ? chapter.number : index + 1) + '</h2><p>' + (Array.isArray(chapter && chapter.verses) ? chapter.verses : []).map((verse,verseIndex)=>'<sup>' + esc(verse && verse.number != null ? verse.number : verseIndex + 1) + '</sup> ' + esc(verse && verse.text != null ? verse.text : '')).join(' ') + '</p></section>').join('') + '<p class="source">Diunduh melalui Website Galilea · © Sekretaris Galilea 2026</p>';
          downloadHtmlReading(safeBook + ' · Alkitab Terjemahan Baru (TB)','Seluruh pasal',body,String(data && data.source || 'Alkitab Terjemahan Baru (TB) — LAI'));
        } catch(error) { toast(error.message); }
      }

      function renderHymnalScores() {
        return pageHead('Pujian jemaat', 'Lagu Sion (Partiture)', 'Cari lagu, lalu baca lirik bersama PDF partitur jemaat.') + '<section class="section" style="padding-top:10px"><div class="shell" id="hymnal-scores-view"><div class="toolbar hymnal-toolbar"><div class="field-control"><label for="scores-select">Pilih lagu</label><select id="scores-select"><option value="">Memuat daftar lagu…</option></select></div><div class="field-control"><label for="scores-search">Cari Lagu Sion</label><div class="hymnal-search-box"><input id="scores-search" type="search" placeholder="Nomor atau judul lagu…"><button class="btn" type="button" id="scores-random">Lagu acak'+icon('music')+'</button></div></div><div class="hymnal-actions"><span class="chip hymnal-count" id="scores-count">Memuat…</span></div></div><p id="scores-status" role="status" aria-live="polite">Memuat daftar lagu…</p><div id="scores-reader"></div><p id="scores-results"></p><div id="scores-list">'+loadingBox()+'</div></div></section>';
      }
      async function loadHymnalScores() {
        const root = $('#hymnal-scores-view');
        if (!root) return;
        ['scores-select','scores-search','scores-random'].forEach(id => { root.querySelector('#'+id).disabled = true; });
        try {
          const catalog = await getViewerHymnalCatalog();
          if (!root.isConnected || state.route !== 'hymnal-scores') return;
          root.querySelector('#scores-status').textContent = 'Pilih lagu untuk membaca lirik dan menambahkan PDF partitur.';
          await window.GalileaHymnalScores.mount({root, catalog, getSong:getViewerHymnalSong, openLyrics:openSong, icon});
        } catch(error) {
          if (root.isConnected) {
            root.querySelector('#scores-status').textContent = error.message;
            root.querySelector('#scores-list').innerHTML = '<button class="btn" type="button" id="scores-load-retry">Coba muat daftar lagi</button>';
            root.querySelector('#scores-load-retry').addEventListener('click', loadHymnalScores, {once:true});
          }
        }
      }
      function renderHymnal() {
        const theme=state.data.themeSong;
        const featured=theme?'<article class="theme-song-feature"><div><span class="chip gold">LAGU TEMA JEMAAT</span><h2>'+esc(theme.title)+'</h2><p>Lagu tema ditempatkan paling atas dan dapat diperbarui pengurus melalui Portal Sekretariat.</p><button class="btn primary" type="button" data-theme-song>'+icon('play')+'Buka Lagu Tema</button></div></article>':'<article class="theme-song-feature"><div><span class="chip gold">LAGU TEMA JEMAAT</span><h2>Belum diterbitkan.</h2><p>Pengurus dapat mengisi Judul, Ayat 1, Ayat 2, ayat tambahan, dan Reff melalui Portal Sekretariat.</p></div></article>';
        return pageHead('Lagu Sion', 'Nyanyikan pengharapan.', 'Pilihan awal dikosongkan. Pilih Lagu Tema atau Lagu Sion, lalu gunakan Mode Layar untuk teks yang besar dan jelas.') +
          '<section class="section" style="padding-top:10px"><div class="shell">'+featured+
          '<div class="toolbar hymnal-toolbar">'+
            '<div class="field-control"><label for="hymnal-select">Pilih lagu</label><select id="hymnal-select"><option value="">Memuat daftar lagu…</option></select></div>'+
            '<div class="field-control"><label for="hymnal-search">Cari Lagu Sion</label><div class="hymnal-search-box"><input id="hymnal-search" type="search" placeholder="Nomor atau judul lagu…"><button class="btn" type="button" id="random-song">Lagu acak' + icon('music') + '</button></div></div>'+
            '<div class="hymnal-actions"><span class="chip hymnal-count" id="song-count">Memuat…</span><button class="btn soft" type="button" data-download-archive="hymnal">' + icon('download') + 'Unduh PDF lengkap</button></div>'+
          '</div>'+hymnCacheStatusHtml()+'<div id="hymnal-content">' + loadingBox() + '</div></div></section>';
      }
      async function loadHymnal() {
        try {
          state.hymnal = await getViewerHymnalCatalog();
          if (!$('#hymnal-content')) return;
          $('#song-count').textContent = state.hymnal.count + ' lagu';
          const selector=$('#hymnal-select');
          if(selector){selector.innerHTML='<option value="">Pilih Lagu Tema atau Lagu Sion</option>'+(state.data.themeSong?'<option value="theme">Lagu Tema — '+esc(state.data.themeSong.title)+'</option>':'')+(state.hymnal.songs||[]).map(song=>'<option value="'+attr(song.number)+'">'+esc(song.number+' · '+song.title)+'</option>').join('');selector.value='';}
          loadDownloadArchives();
          renderSongList('');
        } catch (error) { if ($('#hymnal-content')) $('#hymnal-content').innerHTML = errorBox(error.message); }
      }
      function renderSongList(query) {
        const needle = String(query || '').toLowerCase().trim();
        const songs = (state.hymnal ? state.hymnal.songs : []).filter(song => !needle || String(song.number).includes(needle) || song.title.toLowerCase().includes(needle)).slice(0,120);
        $('#hymnal-content').innerHTML = songs.length ? '<div class="song-list">' + songs.map(song => '<button class="song-row" type="button" data-song="' + song.number + '"><span class="song-number">' + song.number + '</span><span>' + esc(song.title) + '</span>' + icon('chevron') + '</button>').join('') + '</div>' : emptyText('Lagu tidak ditemukan.');
      }
      async function openSong(number) {
        if(String(number)==='theme')return openThemeSong();
        const saved=cachedHymnalSong(number);
        openReader(saved?saved.title:'Memuat lagu…',saved?'':loadingBox());
        const sequence=songOpenSequence;
        try {
          const song = saved || await getViewerHymnalSong(number);
          if(sequence!==songOpenSequence || !$('#reader-dialog').open)return;
          state.hymnalReader = {song:song,verseIndex:0,isTheme:false};
          renderSongReader();
        } catch (error) { if(sequence===songOpenSequence && $('#reader-dialog').open)$('#reader-body').innerHTML = errorBox(error.message); }
      }

      function openThemeSong(){
        ++songOpenSequence;
        const song=state.data&&state.data.themeSong;if(!song)return toast('Lagu Tema belum diterbitkan oleh pengurus.');
        openReader(song.title,loadingBox());state.hymnalReader={song:song,verseIndex:0,isTheme:true};renderSongReader();
      }

      function renderSongReader() {
        const song=state.hymnalReader.song; if(!song) return;
        const verses=song.lyrics.filter(part=>!/(chorus|refrain)/i.test(part.type));
        const chorus=song.lyrics.find(part=>/(chorus|refrain)/i.test(part.type));
        const index=Math.max(0,Math.min(verses.length-1,state.hymnalReader.verseIndex));
        state.hymnalReader.verseIndex=index;
        const verse=verses[index] || song.lyrics[0] || {index:1,lines:[]};
        const isTheme=Boolean(state.hymnalReader.isTheme||song.isTheme);
        $('#reader-title').textContent=isTheme?'Lagu Tema · '+song.title:'Lagu Sion No. ' + song.number;
        const savedItem={type:'hymnal',id:isTheme?'theme':song.number,title:(isTheme?'Lagu Tema':'Lagu Sion No. '+song.number)+' · '+song.title,subtitle:isTheme?'Lagu Tema Jemaat':'Lagu Sion',route:'hymnal'};
        rememberItem(savedItem);
        const fontSize=safeStorage.get('galilea:song-font-size','normal');
        const chorusCard=chorus?'<div class="song-chorus-col"><div class="song-chorus-card"><span class="chip gold">REFF / KOOR</span><div class="song-chorus">' + chorus.lines.map(esc).join('<br>') + '</div></div></div>':'';
        $('#reader-body').innerHTML='<div class="song-reader-shell font-' + esc(fontSize) + '"><div class="v18-reader-tools"><div class="v18-reader-tools-main">'+favoriteButton(savedItem)+'<button class="btn primary present-button" type="button" data-present-song>'+icon('external')+'Mode layar</button></div><div class="song-size-group" role="group" aria-label="Ukuran font lagu"><button class="btn soft font-size-btn '+(fontSize==='small'?'active':'')+'" type="button" data-song-size="small" title="Ukuran teks kecil" aria-label="Ukuran teks kecil">A−</button><button class="btn soft font-size-btn '+(fontSize==='normal'?'active':'')+'" type="button" data-song-size="normal" title="Ukuran teks sedang" aria-label="Ukuran teks sedang">A</button><button class="btn soft font-size-btn '+(fontSize==='large'?'active':'')+'" type="button" data-song-size="large" title="Ukuran teks besar" aria-label="Ukuran teks besar">A+</button></div></div><header class="song-reader-hero"><span class="song-reader-number">' + (isTheme?'Lagu Tema Jemaat':'Lagu Sion · Nomor '+esc(song.number)) + '</span><h2>' + esc(song.title) + '</h2></header><section class="song-stage"><div class="song-stage-grid ' + (chorus?'has-chorus':'single-col') + '"><div class="song-verse-col"><div class="song-verse-card"><span class="chip brand">AYAT ' + esc(verse.index || index+1) + '</span><div class="song-verse">' + verse.lines.map(esc).join('<br>') + '</div></div></div>' + chorusCard + '</div></section><nav class="song-reader-nav" aria-label="Pilih ayat"><button class="icon-button" type="button" data-song-prev aria-label="Ayat sebelumnya" ' + (index===0?'disabled':'') + '>' + icon('arrow-left') + '</button><strong>Ayat ' + (index+1) + ' dari ' + Math.max(1,verses.length) + '</strong><button class="icon-button" type="button" data-song-next aria-label="Ayat berikutnya" ' + (index>=verses.length-1?'disabled':'') + '>' + icon('arrow') + '</button></nav><p class="small faint">Gunakan Mode Layar agar teks terlihat jelas dari jarak jauh.</p></div>';
      }

      function clampPresentationScale(value,type=state.presentation&&state.presentation.type){return Math.max(/^(song|bible)$/.test(type||'')?.35:.7,Math.min(1.35,Number(value)||1));}
      function presentationScaleKey(type){return 'galilea:presentation-scale:'+(type==='sabbath'?'sabbath':type==='welcome'?'welcome':type==='bible'?'bible':type==='announcement'?'announcement':type==='schedule'?'schedule':type==='operator'?'operator':type==='screencheck'?'screencheck':'song');}
      function storedPresentationScale(type){return /^(song|bible)$/.test(type)?1.35:clampPresentationScale(safeStorage.get(presentationScaleKey(type),'1'),type);}
      function storedPresentationTheme(){
        return document.documentElement.dataset.theme==='light'?'light':'dark';
      }
      function welcomeContent(now = new Date()) {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
          timeZone:'Asia/Makassar',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'
        }).formatToParts(now).map(part => [part.type,part.value]));
        const sabbath = parts.weekday === 'Sat';
        const wednesdayEvening = parts.weekday === 'Wed' && Number(parts.hour) >= 18;
        return {
          key:parts.year+parts.month+parts.day+(wednesdayEvening?'evening':''),
          title:sabbath?'Selamat Hari Sabat':'Selamat Datang',
          subtitle:'Selamat berbakti di Jemaat Galilea.',
          reminder:'Mohon senyapkan ponsel dan perangkat elektronik selama ibadah.',
          label:sabbath?'Ibadah Sabat':wednesdayEvening?'Ibadah Rabu Malam':'GMAHK Galilea Balikpapan',
          dateLabel:new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now)
        };
      }
      function openWelcomePresentation() {
        closeMobile();
        $$('.nav-drop.open').forEach(drop => { drop.classList.remove('open'); drop.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded','false'); });
        launchPresentation({type:'welcome',index:0,scale:storedPresentationScale('welcome'),fittedScale:1,item:welcomeContent(),blackout:false,
          projector:safeStorage.get('galilea:presentation-projector','0')==='1',theme:storedPresentationTheme()});
        window.clearInterval(presentationWelcomeTimer);
        presentationWelcomeTimer = window.setInterval(refreshWelcomePresentation,15000);
      }
      function refreshWelcomePresentation() {
        if (!$('#presentation-dialog')?.open || state.presentation.type !== 'welcome') return;
        const content = welcomeContent();
        if (content.key === state.presentation.item?.key) return;
        state.presentation.item = content;
        renderPresentation();
        schedulePresentationFit();
      }
      function announcePresentation(message){const status=$('#presentation-a11y-status');if(status)status.textContent=message||'';}
      function syncPresentationState(){
        const shell=$('#presentation-shell'),view=state.presentation;if(!shell||!view)return;
        view.blackout=false;shell.classList.remove('is-blackout');
        shell.classList.toggle('is-projector',Boolean(view.projector));
        shell.classList.toggle('is-light',view.theme==='light');
        const theme=$('[data-presentation-theme]'),themeLabel=$('#presentation-theme-label'),projector=$('[data-presentation-projector]');
        if(theme){
          const isLight=view.theme==='light',target=isLight?'gelap':'terang',use=$('use',theme);
          theme.setAttribute('aria-pressed',String(isLight));theme.setAttribute('aria-label','Gunakan mode '+target);theme.title='Gunakan mode '+target+' (T)';
          if(use)use.setAttribute('href',isLight?'#i-moon':'#i-sun');
          if(themeLabel)themeLabel.textContent=target.charAt(0).toUpperCase()+target.slice(1);
        }
        if(projector)projector.setAttribute('aria-pressed',String(Boolean(view.projector)));
      }
      function showPresentationControls(autoHide){
        const dialog=$('#presentation-dialog'),shell=$('#presentation-shell');if(!dialog||!shell)return;
        shell.classList.remove('presentation-controls-hidden');
        window.clearTimeout(presentationControlsTimer);
        if(!dialog.open||autoHide===false)return;
        presentationControlsTimer=window.setTimeout(()=>{
          const controls=$('.presentation-controls');
          const paletteOpen=$('#presentation-palette-menu')?.matches(':popover-open');
          if(paletteOpen){showPresentationControls(true);return;}
          if(presentationKeyboardControls && controls?.contains(document.activeElement))return;
          if(controls?.contains(document.activeElement))document.activeElement.blur();
          shell.classList.add('presentation-controls-hidden');
        },4000);
      }
      function fitPresentationText(){
        const dialog=$('#presentation-dialog'),shell=$('#presentation-shell'),stage=$('#presentation-stage'),view=state.presentation;
        if(!dialog||!dialog.open||!shell||!stage||!view||!view.type)return;
        layoutPresentationFrame();
        if(view.type==='sabbath'){
          window.GalileaSabbathPresentation.layout(view,stage);
          renderSabbathPresentation();
          $('[data-presentation-smaller]').disabled=view.scale<=.7001;
          $('[data-presentation-larger]').disabled=view.scale>=1.3499;
          return;
        }
        const textSlide=/^(song|bible)$/.test(shell.dataset.presentationKind||'');
        if(textSlide&&shell.classList.contains('page-turn-active')&&view.textFontSize>0){
          stage.querySelectorAll('.presentation-copy').forEach(copy=>copy.style.setProperty('font-size',view.textFontSize+'px','important'));
          return;
        }
        if(textSlide){
          const frame=$('#presentation-frame'),footer=$('.presentation-footer');
          if(frame&&footer){
            const frameBox=frame.getBoundingClientRect(),footerBox=footer.getBoundingClientRect();
            if(frameBox.height>0&&footerBox.height>0)shell.style.setProperty('--presentation-footer-reserve',Math.max(0,frameBox.bottom-footerBox.top+16)+'px');
          }
        }
        if(stage.clientHeight<=0||stage.clientWidth<=0)return;
        let fitted=clampPresentationScale(view.scale),textFont=0;stage.classList.add('is-fitting');
        if(textSlide){
          const baseFont=64;
          // Keep one pixel ceiling for every page; measuring must not rescale the live page.
          const samples=view.type==='song'?songPresentationSlides(state.hymnalReader?.song).map(songPresentationMarkup):view.type==='bible'?(state.bibleReader?.verses||[]).map(verse=>'<span class="presentation-verse-label">AYAT '+esc(verse.number)+'</span><div class="presentation-copy bible">'+esc(verse.text)+'</div>'):[];
          const profileKey=JSON.stringify([stage.clientWidth,stage.clientHeight,document.documentElement.clientWidth,shell.classList.contains('is-projector'),document.fonts?.status,samples]);
          let ceiling=view.textFitProfile?.key===profileKey?view.textFitProfile.fontCeiling:null;
          if(ceiling==null){
            const originalNodes=[...stage.childNodes],stageStyle=window.getComputedStyle?.(stage)||{};
            const contentWidth=stage.clientWidth-(parseFloat(stageStyle.paddingLeft)||0)-(parseFloat(stageStyle.paddingRight)||0);
            const contentHeight=stage.clientHeight-(parseFloat(stageStyle.paddingTop)||0)-(parseFloat(stageStyle.paddingBottom)||0);
            const measure=document.createElement('div');measure.className='presentation-stage presentation-fit-measure';measure.setAttribute('aria-hidden','true');measure.inert=true;
            measure.style.cssText='position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;display:block;width:'+contentWidth+'px;height:auto;min-height:0;max-height:none;margin:0;padding:0;overflow:visible;';
            ($('#presentation-frame')||shell).append(measure);const isolated=measure.getBoundingClientRect().width>0;ceiling=Infinity;
            try{
              for(const markup of samples.length?samples:[null]){
                if(isolated)measure.innerHTML=markup??stage.innerHTML;
                else if(markup!==null)stage.innerHTML=markup;
                let sampleLow=isolated?18:.001,high=isolated?512:2.7;
                for(let attempt=0;attempt<14;attempt++){
                  const candidate=(sampleLow+high)/2;
                  let fits;
                  if(isolated){
                    measure.querySelectorAll('.presentation-copy').forEach(copy=>copy.style.setProperty('font-size',candidate+'px','important'));
                    const measured=measure.getBoundingClientRect();
                    // Measure natural content height, independent of fullscreen grid alignment and transforms.
                    fits=Math.max(measured.height,measure.scrollHeight)<=contentHeight+1&&measure.scrollWidth<=contentWidth+1;
                  }else{
                    shell.style.setProperty('--present-scale',String(candidate));
                    const bounds=stage.getBoundingClientRect(),blocks=[...stage.querySelectorAll('.presentation-copy,.presentation-verse-label')].map(node=>node.getBoundingClientRect());
                    fits=bounds.height>0&&blocks.some(box=>box.height>0)
                    ?blocks.every(box=>box.bottom<=bounds.bottom+2&&box.right<=bounds.right+2)
                    :stage.scrollHeight<=stage.clientHeight+2&&stage.scrollWidth<=stage.clientWidth+2;
                  }
                  if(fits)sampleLow=candidate;
                  else high=candidate;
                }
                ceiling=Math.min(ceiling,isolated?sampleLow:baseFont*sampleLow);
              }
            }finally{measure.remove();if(!isolated)stage.replaceChildren(...originalNodes);}
            view.textFitProfile={key:profileKey,fontCeiling:ceiling};
          }
          view.maxFittedScale=ceiling/baseFont;
          fitted=view.maxFittedScale*clampPresentationScale(view.scale)/1.35;shell.style.setProperty('--present-scale',String(fitted));
          textFont=Math.max(18,ceiling*clampPresentationScale(view.scale)/1.35);
          stage.querySelectorAll('.presentation-copy').forEach(copy=>copy.style.setProperty('font-size',textFont+'px','important'));
          view.textFontSize=textFont;
        }else for(let attempt=0;attempt<8;attempt++){
          shell.style.setProperty('--present-scale',String(fitted));
          const available=Math.max(1,stage.clientHeight),needed=Math.max(1,stage.scrollHeight);
          if(needed<=available+2)break;
          const ratio=Math.max(.85,Math.min(.96,(available/needed)*.96));
          const next=Math.max(.82,fitted*ratio);
          if(Math.abs(next-fitted)<.006)break;
          fitted=next;shell.style.setProperty('--present-scale',String(fitted));
        }
        shell.style.setProperty('--present-scale',String(fitted));
        stage.classList.remove('is-fitting');stage.scrollTop=0;view.fittedScale=fitted;
        shell.dataset.fit=fitted<clampPresentationScale(view.scale)-.015?'fitted':'preferred';
        const smaller=$('[data-presentation-smaller]'),larger=$('[data-presentation-larger]');
        if(smaller)smaller.disabled=clampPresentationScale(view.scale)<=clampPresentationScale(.01)+.0001||(textSlide&&textFont<=18.01);
        if(larger){larger.disabled=clampPresentationScale(view.scale)>=1.3499;larger.title=larger.disabled&&textSlide?'Batas maksimum di atas copyright':'Perbesar teks';}
      }
      function layoutPresentationFrame(){
        const shell=$('#presentation-shell'),frame=$('#presentation-frame');if(!shell||!frame)return;
        if(!shell.classList.contains('is-projector')){frame.style.removeProperty('width');frame.style.removeProperty('height');return;}
        const bounds=shell.getBoundingClientRect();if(bounds.width<=0||bounds.height<=0)return;
        const width=Math.min(bounds.width,bounds.height*16/9),height=width*9/16;
        frame.style.width=width+'px';frame.style.height=height+'px';
      }
      function schedulePresentationFit(){
        window.cancelAnimationFrame(presentationFitFrame);window.clearTimeout(presentationFitTimer);
        presentationFitFrame=window.requestAnimationFrame(()=>{presentationFitFrame=window.requestAnimationFrame(fitPresentationText);});
        presentationFitTimer=window.setTimeout(fitPresentationText,260);
      }
      function updatePresentationNetworkStatus(){
        const badge=$('#presentation-offline'),label=badge&&$('span',badge);if(!badge||!label)return;
        const offline=navigator.onLine===false;badge.classList.toggle('show',offline);
        if(offline){const type=state.presentation&&state.presentation.type;label.textContent=type==='song'?'OFFLINE · LAGU TERSIMPAN':type==='announcement'?'OFFLINE · PENGUMUMAN TERSIMPAN':type==='schedule'?'OFFLINE · JADWAL TERSIMPAN':type==='operator'?'OFFLINE · MODE OPERATOR SIAP':'OFFLINE · BACAAN TERSIMPAN';}
      }
      async function requestPresentationWakeLock(){
        if(!navigator.wakeLock||!navigator.wakeLock.request||document.visibilityState!=='visible'||presentationWakeLock)return;
        try{
          const lock=await navigator.wakeLock.request('screen');presentationWakeLock=lock;
          lock.addEventListener('release',()=>{if(presentationWakeLock===lock)presentationWakeLock=null;});
        }catch(_){}
      }
      async function releasePresentationWakeLock(){
        const lock=presentationWakeLock;presentationWakeLock=null;if(!lock)return;
        try{await lock.release();}catch(_){}
      }
      function finishPresentationRender(){syncPresentationState();updatePresentationNetworkStatus();schedulePresentationFit();showPresentationControls(true);}
      function setPresentationNavigationLabels(noun){
        const prev=$('[data-presentation-prev]'),next=$('[data-presentation-next]'),label=String(noun||'Ayat');
        if(prev){prev.setAttribute('aria-label',label+' sebelumnya');prev.title=label+' sebelumnya';}
        if(next){next.setAttribute('aria-label',label+' berikutnya');next.title=label+' berikutnya';}
      }
      function announcementBackdropVariant(item,index){
        const text=((item&&item.title)||'')+' '+((item&&item.summary)||'');
        if(/doa|renungan|penghiburan|rohani/i.test(text))return 1;
        if(/buah|pelayanan|bakti|sosial|one voice/i.test(text))return 2;
        if(/makan|potluck|perjamuan|fellowship|kebersamaan/i.test(text))return 3;
        return Math.abs(Number(index)||0)%4;
      }
      function setPresentationOrnament(kind,context,index){
        const shell=$('#presentation-shell'),use=$('#presentation-context-art-use'),site=state.data&&state.data.site||{};
        const baseMap={overview:'church',agenda:'calendar',sabbath:'book',bible:'book',scripture:'book',song:'music','song-reference':'music',service:'users',announcement:'bell',reminder:'church',connection:'heart',closing:'church'};
        const allowed=['church','calendar','book','music','users','bell','heart'];
        const disabled=/^(?:TIDAK|NO|OFF|FALSE|0)$/i.test(String(site.presentation_ornaments_enabled||'YA').trim());
        const strength=String(site.presentation_ornament_strength||'JELAS').trim().toUpperCase();
        const opacity={LEMBUT:.1,SEIMBANG:.145,JELAS:.19}[strength]||.19;
        const variant=kind==='announcement'?announcementBackdropVariant(context,index):Math.abs(Number(index)||0)%4;
        let setting='';
        if(['overview','agenda','service'].includes(kind))setting=site.presentation_schedule_ornament;
        else if(['bible','scripture'].includes(kind))setting=site.presentation_bible_ornament;
        else if(['song','song-reference'].includes(kind))setting=site.presentation_hymnal_ornament;
        else if(kind==='announcement')setting=site.presentation_announcement_ornament;
        let ornament=String(setting||'AUTO').trim().toLowerCase();
        if(ornament==='auto'||!allowed.includes(ornament)){
          ornament=kind==='announcement'?(['calendar','book','heart','users'][variant]||'bell'):(baseMap[kind]||'church');
        }
        if(shell){
          shell.dataset.presentationKind=String(kind||'overview');
          shell.dataset.presentationVariant=String(variant);
          shell.dataset.presentationOrnament=disabled?'off':ornament;
          shell.style.setProperty('--presentation-ornament-opacity',String(opacity));
        }
        if(use)use.setAttribute('href','#i-'+ornament);
      }
      function launchPresentation(view){
        const dialog=$('#presentation-dialog'),shell=$('#presentation-shell');if(!dialog||!shell||!view)return;
        state.presentation=view;shell.dataset.presentationType=view.type;
        const readerDialog=$('#reader-dialog');
        state.presentationPreviousDialog=Boolean(readerDialog&&readerDialog.open);
        state.presentationScrollPos=window.scrollY||window.pageYOffset||0;
        if(state.presentationPreviousDialog){try{readerDialog.close();}catch(_){}}
        document.documentElement.classList.add('is-presenting');
        document.body.classList.add('is-presenting');
        document.body.style.overflow='hidden';
        renderPresentation();if(!dialog.open)dialog.showModal();shell.tabIndex=-1;shell.focus({preventScroll:true});syncPresentationState();fitPresentationText();showPresentationControls(true);schedulePresentationFit();requestPresentationWakeLock();
        if(shell.requestFullscreen&&!document.fullscreenElement)shell.requestFullscreen().then(schedulePresentationFit).catch(()=>{});
      }
      function openSabbathPresentation(){
        const lesson=state.async.currentLesson;
        if(!lesson?.days?.length)return toast('Buka pelajaran terlebih dahulu.');
        const presenter=window.GalileaSabbathPresentation;
        if(!presenter)return toast('Mode layar belum termuat. Silakan muat ulang halaman.');
        $('#presentation-sabbath-day').dataset.lesson='';
        launchPresentation({type:'sabbath',index:0,scale:storedPresentationScale('sabbath'),
          item:presenter.create(lesson,cleanHtml),blackout:false,
          projector:safeStorage.get('galilea:presentation-projector','0')==='1',theme:storedPresentationTheme()});
        document.fonts?.ready.then(()=>{if(state.presentation?.type==='sabbath'&&$('#presentation-dialog').open){state.presentation.item.layoutKey='';schedulePresentationFit();}});
      }
      function renderSabbathPresentation(){
        const view=state.presentation,stage=$('#presentation-stage');
        const {page,total}=window.GalileaSabbathPresentation.render(view,stage);
        const lesson=view.item.lesson;
        setPresentationOrnament('sabbath',lesson,view.index);
        $('#presentation-kicker').textContent='SEKOLAH SABAT · PELAJARAN '+lesson.number;
        $('#presentation-title').textContent=lesson.title;
        $('#presentation-counter').textContent=(view.index+1)+' / '+total;
        $('#presentation-counter').setAttribute('aria-label','Slide '+(view.index+1)+' dari '+total);
        setPresentationNavigationLabels('Slide');
        $('[data-presentation-prev]').disabled=view.index===0;
        $('[data-presentation-next]').disabled=view.index>=total-1;
        const select=$('#presentation-sabbath-day');
        if(select){
          if(select.dataset.lesson!==lesson.title || select.options.length!==lesson.days.length+1){
            select.innerHTML='<option value="-1">Pembuka</option>'+lesson.days.map((day,index)=>'<option value="'+index+'">'+esc(day.dateLabel||day.title)+'</option>').join('');
            select.dataset.lesson=lesson.title;
          }
          select.value=String(page.dayIndex);
        }
      }
      function openPresentation(type){
        if(type==='bible'&&!state.bibleReader)return toast('Pilih ayat Alkitab terlebih dahulu.');
        if(type==='song'&&!(state.hymnalReader&&state.hymnalReader.song))return toast('Pilih lagu terlebih dahulu.');
        const songSlides=type==='song'?songPresentationSlides(state.hymnalReader.song):[];
        if(type==='song'&&!songSlides.length)return toast('Lirik lagu belum tersedia.');
        const index=type==='bible'?Number(state.bibleReader.index||0):Math.max(0,songSlides.findIndex(slide=>!slide.isChorus&&slide.verseIndex===Number(state.hymnalReader.verseIndex||0)));
        launchPresentation({type:type,index:index,scale:storedPresentationScale(type),fittedScale:1,item:type==='bible'?state.bibleReader:state.hymnalReader.song,blackout:false,projector:safeStorage.get('galilea:presentation-projector','0')==='1',theme:storedPresentationTheme()});
      }
      function songPresentationSlides(song){
        const parts=Array.isArray(song&&song.lyrics)?song.lyrics:[];
        const isChorus=part=>/(chorus|refrain|reff?|koor)/i.test(part.type||'');
        const hasLines=part=>Array.isArray(part.lines)&&part.lines.some(line=>String(line||'').trim());
        const choruses=parts.filter(part=>part&&isChorus(part)&&hasLines(part));
        const slides=[];let verseIndex=-1;
        parts.forEach((verse,partIndex)=>{
          if(!verse||isChorus(verse))return;
          verseIndex+=1;
          if(!hasLines(verse))return;
          slides.push({kind:'song',verseLabel:'AYAT '+String(verse.index||verseIndex+1),lines:verse.lines,verseIndex:verseIndex,isChorus:false});
          // Imported songs may already interleave each verse with its own refrain.
          // A single refrain at the end is shared by verses without an explicit one.
          const following=[];
          for(let index=partIndex+1;index<parts.length;index++){
            const part=parts[index];if(!part)continue;
            if(!isChorus(part))break;
            if(hasLines(part))following.push(part);
          }
          (following.length?following:choruses.slice(0,1)).forEach(chorus=>slides.push({kind:'song',verseLabel:'REFF / KOOR',lines:chorus.lines,verseIndex:verseIndex,isChorus:true}));
        });
        if(!slides.length)choruses.forEach(chorus=>slides.push({kind:'song',verseLabel:'REFF / KOOR',lines:chorus.lines,verseIndex:0,isChorus:true}));
        return slides;
      }
      function songPresentationMarkup(slide){
        return '<div class="presentation-song-layout lyrics-slide"><div class="presentation-song-verse"><span class="presentation-verse-label">'+esc(slide.verseLabel)+'</span><div class="presentation-copy">'+esc(slide.lines.join(' ').replace(/\s+/g,' ').trim())+'</div></div></div>';
      }
      function normalizeOperatorSongSlides(slides){
        // Older offline playlists stored the chorus alongside each verse.
        return slides.flatMap(slide=>{
          if(slide.kind!=='song'||!Array.isArray(slide.chorus)||!slide.chorus.length)return[slide];
          return[{...slide,chorus:[]},{...slide,chorus:[],verseLabel:'REFF / KOOR',lines:slide.chorus,isChorus:true}];
        });
      }
      function openAnnouncementPresentation(category){
        const normalized=announcementGroupMeta(String(category||'UMUM').toUpperCase()).id;
        const items=(state.data.announcements||[]).filter(item=>announcementCategory(item)===normalized);
        if(!items.length)return toast('Belum ada pengumuman pada kategori ini.');
        launchPresentation({type:'announcement',index:0,scale:storedPresentationScale('announcement'),fittedScale:1,item:items,announcementCategory:normalized,blackout:false,projector:safeStorage.get('galilea:presentation-projector','0')==='1',theme:storedPresentationTheme()});
      }
      function scheduleSummarySlides(){
        const slides=[];
        scheduleSummaryEntries().forEach(entry=>{
          const item=entry.source,time=String(item.time||'').replace(':','.')+(String(item.time||'').toUpperCase().includes('WITA')?'':' WITA');
          slides.push({kind:'overview',title:entry.label,dateLabel:item.dateLabel||'Jadwal terdekat',time:time,countdown:item.countdown||'MENDATANG',fields:[]});
          const services=(item.services||[]).length?item.services:[{title:entry.label,fields:item.fields||[]}];
          services.filter(service=>(service.fields||[]).length).forEach(service=>{const fields=service.fields||[],parts=Math.max(1,Math.ceil(fields.length/8));for(let index=0;index<fields.length;index+=8)slides.push({kind:'service',title:service.title+(parts>1?' · '+(Math.floor(index/8)+1)+'/'+parts:''),dateLabel:item.dateLabel||'',time:time,countdown:item.countdown||'',fields:fields.slice(index,index+8)});});
        });
        slides.push(...worshipClosingSlides(selectedWorshipPlan()));
        return slides;
      }
      function openScheduleSummaryPresentation(){
        const slides=scheduleSummarySlides();
        if(!slides.length)return toast('Ringkasan jadwal terdekat belum tersedia.');
        launchPresentation({type:'schedule',index:0,scale:storedPresentationScale('schedule'),fittedScale:1,item:slides,blackout:false,projector:safeStorage.get('galilea:presentation-projector','0')==='1',theme:storedPresentationTheme()});
      }
      function renderPresentation(){
        const view=state.presentation,stage=$('#presentation-stage'),title=$('#presentation-title'),kicker=$('#presentation-kicker'),counter=$('#presentation-counter'),shell=$('#presentation-shell');
        if(!view||!stage||!title||!kicker||!counter||!shell)return;
        shell.style.setProperty('--present-scale',String(clampPresentationScale(view.scale)));
        if(view.type==='sabbath'){renderSabbathPresentation();finishPresentationRender();return;}
        if(view.type==='welcome'){
          const content=view.item||welcomeContent();
          view.index=0;setPresentationOrnament('welcome',content,0);
          kicker.textContent=content.label;title.textContent='Layar Sambutan';
          stage.innerHTML='<article class="welcome-screen"><p class="welcome-date">'+esc(content.dateLabel)+'</p><h2><em>Selamat</em> <span>'+esc(content.title.replace(/^Selamat /,''))+'</span></h2><p class="welcome-message"><span>Selamat berbakti di</span><strong>Jemaat Galilea</strong></p><p class="welcome-reminder">'+esc(content.reminder)+'</p></article>';
          counter.textContent='Sambutan';setPresentationNavigationLabels('Sambutan');
          $('[data-presentation-prev]').disabled=true;$('[data-presentation-next]').disabled=true;
          finishPresentationRender();return;
        }
        if(view.type==='operator'){
          const slides=Array.isArray(view.item)?view.item:[];if(!slides.length)return;
          view.index=Math.max(0,Math.min(slides.length-1,Number(view.index)||0));const slide=slides[view.index];setPresentationOrnament(slide.kind,slide,view.index);
          kicker.textContent='MODE OPERATOR · GMAHK GALILEA';title.textContent=slide.title||'Ibadah';setPresentationNavigationLabels('Bagian');
          if(slide.kind==='overview')stage.innerHTML='<article class="presentation-operator-hero"><section class="presentation-operator-copy"><span class="presentation-verse-label">'+esc(slide.serviceType||'IBADAH')+'</span><h2>'+esc(slide.title)+'</h2><p>'+esc(slide.dateLabel)+' · '+esc(slide.time)+'</p></section><aside class="presentation-operator-aside"><span>KESIAPAN MATERI</span><strong>'+esc(slide.readiness||'SIAP')+'</strong><small>Urutan otomatis tanpa playlist</small></aside></article>';
          else if(slide.kind==='agenda')stage.innerHTML='<article class="presentation-operator-panel"><span class="presentation-verse-label">URUTAN IBADAH'+(slide.part>1?' · BAGIAN '+esc(slide.part):'')+'</span><h2>'+esc(slide.title)+'</h2><ol class="presentation-operator-agenda">'+(slide.items||[]).map(item=>'<li>'+esc(item)+'</li>').join('')+'</ol></article>';
          else if(slide.kind==='bible')stage.innerHTML='<span class="presentation-verse-label">'+esc(slide.label)+'</span><div class="presentation-copy bible">'+esc(slide.text)+'</div>';
          else if(slide.kind==='scripture')stage.innerHTML='<article class="presentation-operator-panel"><span class="presentation-verse-label">AYAT UTAMA</span><h2>'+esc(slide.reference)+'</h2><p class="presentation-announcement-copy">Buka teks Alkitab melalui menu Alkitab apabila ayat lengkap belum tersimpan.</p></article>';
          else if(slide.kind==='song')stage.innerHTML=songPresentationMarkup(slide);
          else if(slide.kind==='song-reference')stage.innerHTML='<article class="presentation-operator-panel"><span class="presentation-verse-label">LAGU PUJIAN</span><h2>'+esc(slide.title)+'</h2></article>';
          else if(slide.kind==='service')stage.innerHTML='<article class="presentation-operator-service"><aside class="presentation-operator-service-title"><span class="presentation-verse-label">PELAYANAN</span><h2>'+esc(slide.title)+'</h2><p>'+esc(slide.dateLabel)+' · '+esc(slide.time)+'</p></aside><dl class="presentation-operator-fields">'+(slide.fields||[]).map(field=>'<div class="presentation-operator-field"><dt>'+esc(field.label)+'</dt><dd>'+esc(field.value||'—')+'</dd></div>').join('')+'</dl></article>';
          else if(slide.kind==='announcement')stage.innerHTML='<article class="presentation-announcement"><div class="presentation-announcement-meta"><span class="presentation-verse-label">'+esc(slide.dateLabel)+'</span><span class="presentation-announcement-priority">'+esc(slide.priority)+'</span></div><h2 class="presentation-announcement-title">'+esc(slide.title)+'</h2><p class="presentation-announcement-copy">'+esc(slide.summary||'Informasi selengkapnya tersedia pada website.')+'</p></article>';
          else if(slide.kind==='reminder')stage.innerHTML='<article class="presentation-reminder"><section class="presentation-reminder-copy"><span class="presentation-verse-label">PENGINGAT IBADAH</span><h2>'+esc(slide.title)+'</h2></section><aside class="presentation-reminder-aside"><strong>'+esc(slide.number||'')+'</strong><span>Persiapan Ibadah</span></aside></article>';
          else if(slide.kind==='connection')stage.innerHTML='<article class="presentation-connect"><section class="presentation-connect-intro"><span class="presentation-verse-label">TETAP TERHUBUNG</span><h2>'+esc(slide.title)+'</h2><p>'+esc(slide.copy||'Informasi resmi Jemaat Galilea Balikpapan.')+'</p></section><section class="presentation-connect-grid">'+(slide.fields||[]).map(field=>'<div class="presentation-connect-card"><small>'+esc(field.label)+'</small><strong>'+esc(field.value||'—')+'</strong></div>').join('')+'</section></article>';
          else stage.innerHTML='<article class="presentation-operator-hero"><section class="presentation-operator-copy"><span class="presentation-verse-label">GMAHK GALILEA BALIKPAPAN</span><h2>'+esc(slide.title||'Selamat Beribadah')+'</h2><p>'+esc(slide.copy||'')+'</p></section><aside class="presentation-operator-aside"><span>SEKRETARIAT</span><strong>GALILEA</strong><small>Balikpapan · 2026</small></aside></article>';
          counter.textContent='Bagian '+(view.index+1)+' / '+slides.length;counter.setAttribute('aria-label','Bagian '+(view.index+1)+' dari '+slides.length);
          $('[data-presentation-prev]').disabled=view.index===0;$('[data-presentation-next]').disabled=view.index>=slides.length-1;finishPresentationRender();return;
        }
        if(view.type==='screencheck'){
          const slides=Array.isArray(view.item)?view.item:[];if(!slides.length)return;
          view.index=Math.max(0,Math.min(slides.length-1,Number(view.index)||0));const slide=slides[view.index];
          kicker.textContent='PEMERIKSAAN LAYAR';title.textContent=slide.title;setPresentationNavigationLabels('Tes');
          stage.innerHTML='<article class="presentation-screencheck"><span class="presentation-verse-label">TES '+(view.index+1)+' DARI '+slides.length+'</span><h2>'+esc(slide.title)+'</h2><p class="presentation-announcement-copy">'+esc(slide.copy)+'</p><div class="presentation-screencheck-grid">'+(slide.cards||[]).map(card=>'<div class="presentation-screencheck-card"><strong>'+esc(card[0])+'</strong><span>'+esc(card[1])+'</span></div>').join('')+'</div></article>';
          counter.textContent='Tes '+(view.index+1)+' / '+slides.length;counter.setAttribute('aria-label','Tes '+(view.index+1)+' dari '+slides.length);
          $('[data-presentation-prev]').disabled=view.index===0;$('[data-presentation-next]').disabled=view.index>=slides.length-1;finishPresentationRender();return;
        }
        if(view.type==='schedule'){
          const slides=Array.isArray(view.item)?view.item:[];if(!slides.length)return;
          view.index=Math.max(0,Math.min(slides.length-1,Number(view.index)||0));const slide=slides[view.index],isOverview=slide.kind==='overview';setPresentationOrnament(slide.kind||(isOverview?'overview':'service'),slide,view.index);
          kicker.textContent=slide.kind==='announcement'?'AGENDA DAN PENGUMUMAN':slide.kind==='reminder'?'PENGINGAT IBADAH':slide.kind==='connection'?'TETAP TERHUBUNG':'RINGKASAN IBADAH TERDEKAT';title.textContent=slide.title||'Jadwal Ibadah';setPresentationNavigationLabels('Bagian');
          const heading='<h2 class="presentation-schedule-heading">'+esc(slide.title||'Jadwal Ibadah')+'</h2>';
          const subline='<div class="presentation-schedule-subline"><span>'+esc(slide.dateLabel)+'</span><span>'+esc(slide.time)+'</span></div>';
          const fields='<dl class="presentation-schedule-grid '+((slide.fields||[]).length>8?'is-dense':'')+'">'+(slide.fields||[]).map(field=>'<div class="presentation-schedule-field"><dt>'+esc(field.label)+'</dt><dd>'+esc(field.value||'—')+'</dd></div>').join('')+'</dl>';
          if(slide.kind==='announcement'){
            stage.innerHTML='<article class="presentation-announcement"><div class="presentation-announcement-meta"><span class="presentation-verse-label">'+esc(slide.dateLabel)+'</span><span class="presentation-announcement-priority">'+esc(slide.priority)+'</span></div><h2 class="presentation-announcement-title">'+esc(slide.title)+'</h2><p class="presentation-announcement-copy">'+esc(slide.summary||'Informasi selengkapnya tersedia pada website.')+'</p></article>';
          }else if(slide.kind==='reminder'){
            stage.innerHTML='<article class="presentation-reminder"><section class="presentation-reminder-copy"><span class="presentation-verse-label">PENGINGAT IBADAH</span><h2>'+esc(slide.title)+'</h2></section><aside class="presentation-reminder-aside"><strong>'+esc(slide.number||'')+'</strong><span>Persiapan Ibadah</span></aside></article>';
          }else if(slide.kind==='connection'){
            stage.innerHTML='<article class="presentation-connect"><section class="presentation-connect-intro"><span class="presentation-verse-label">TETAP TERHUBUNG</span><h2>'+esc(slide.title)+'</h2><p>'+esc(slide.copy||'Informasi resmi Jemaat Galilea Balikpapan.')+'</p></section><section class="presentation-connect-grid">'+(slide.fields||[]).map(field=>'<div class="presentation-connect-card"><small>'+esc(field.label)+'</small><strong>'+esc(field.value||'—')+'</strong></div>').join('')+'</section></article>';
          }else if(isOverview){
            stage.innerHTML='<article class="presentation-schedule is-overview"><section class="presentation-schedule-overview-copy"><div class="presentation-schedule-meta"><span class="presentation-verse-label">IBADAH TERDEKAT</span>'+(slide.countdown?'<span class="presentation-schedule-countdown">'+esc(slide.countdown)+'</span>':'')+'</div>'+heading+'<h3 class="presentation-schedule-date">'+esc(slide.dateLabel)+'</h3><div class="presentation-schedule-time">'+icon('clock')+'<span>'+esc(slide.time)+'</span></div></section><aside class="presentation-schedule-overview-art" aria-hidden="true"><span>RINGKASAN</span><strong>JADWAL<br>IBADAH</strong><small>GMAHK GALILEA<br>BALIKPAPAN</small></aside></article>';
          }else{
            stage.innerHTML='<article class="presentation-schedule is-service"><aside class="presentation-schedule-sidebar"><span class="presentation-verse-label">JENIS IBADAH</span>'+heading+subline+'<span class="presentation-schedule-sidebar-note">Ringkasan ibadah terdekat</span></aside><section class="presentation-schedule-board"><header class="presentation-schedule-board-head"><strong>Susunan Petugas</strong><span>'+esc((slide.fields||[]).length)+' bagian pelayanan</span></header>'+fields+'</section></article>';
          }
          counter.textContent='Bagian '+(view.index+1)+' / '+slides.length;counter.setAttribute('aria-label','Bagian '+(view.index+1)+' dari '+slides.length);
          $('[data-presentation-prev]').disabled=view.index===0;$('[data-presentation-next]').disabled=view.index>=slides.length-1;
          finishPresentationRender();return;
        }
        if(view.type==='announcement'){
          const items=Array.isArray(view.item)?view.item:[];if(!items.length)return;
          view.index=Math.max(0,Math.min(items.length-1,Number(view.index)||0));const item=items[view.index],meta=announcementGroupMeta(view.announcementCategory||announcementCategory(item));setPresentationOrnament('announcement',item,view.index);
          kicker.textContent='AGENDA DAN PENGUMUMAN';title.textContent=meta.label;setPresentationNavigationLabels('Pengumuman');
          stage.innerHTML='<article class="presentation-announcement"><div class="presentation-announcement-meta"><span class="presentation-verse-label">'+esc(item.dateLabel||'INFORMASI JEMAAT')+'</span><span class="presentation-announcement-priority">'+esc(item.priority||'NORMAL')+'</span></div><h2 class="presentation-announcement-title">'+esc(item.title)+'</h2><p class="presentation-announcement-copy">'+esc(item.summary||'Informasi selengkapnya akan diperbarui oleh pengurus.')+'</p></article>';
          counter.textContent=(view.index+1)+' / '+items.length;counter.setAttribute('aria-label','Pengumuman '+(view.index+1)+' dari '+items.length);
          $('[data-presentation-prev]').disabled=view.index===0;$('[data-presentation-next]').disabled=view.index>=items.length-1;
          finishPresentationRender();return;
        }
        if(view.type==='bible'){
          const item=state.bibleReader,verses=item&&item.verses||[];if(!verses.length)return;
          view.index=Math.max(0,Math.min(verses.length-1,Number(view.index)||0));const verse=verses[view.index];
          setPresentationOrnament('bible',verse,view.index);
          kicker.textContent=item.source||'Alkitab Bahasa Indonesia';title.textContent=item.book+' '+item.chapter+':'+verse.number;setPresentationNavigationLabels('Ayat');
          stage.innerHTML='<span class="presentation-verse-label">AYAT '+esc(verse.number)+'</span><div class="presentation-copy bible">'+esc(verse.text)+'</div>';
          counter.textContent=(view.index+1)+' / '+verses.length;counter.setAttribute('aria-label','Ayat '+(view.index+1)+' dari '+verses.length);
          $('[data-presentation-prev]').disabled=view.index===0;$('[data-presentation-next]').disabled=view.index>=verses.length-1;
          finishPresentationRender();return;
        }
        const song=state.hymnalReader&&state.hymnalReader.song,slides=songPresentationSlides(song);if(!slides.length)return;
        view.index=Math.max(0,Math.min(slides.length-1,Number(view.index)||0));const slide=slides[view.index],isTheme=Boolean(state.hymnalReader.isTheme||song.isTheme);
        setPresentationOrnament('song',song,view.index);
        kicker.textContent=isTheme?'LAGU TEMA · GMAHK GALILEA BALIKPAPAN':'LAGU SION · NOMOR '+song.number;title.textContent=song.title;setPresentationNavigationLabels('Slide');
        stage.innerHTML=songPresentationMarkup(slide);
        counter.textContent=(view.index+1)+' / '+slides.length;counter.setAttribute('aria-label',slide.verseLabel+', slide '+(view.index+1)+' dari '+slides.length);
        $('[data-presentation-prev]').disabled=view.index===0;$('[data-presentation-next]').disabled=view.index>=slides.length-1;
        finishPresentationRender();
      }
      function movePresentation(direction){
        const view=state.presentation;if(!view||!view.type)return;
        const page=/^(song|bible)$/.test(view.type)?window.GalileaPageTurn?.capture():null;
        const previous=Math.max(0,Number(view.index)||0);view.index=previous+(direction<0?-1:1);renderPresentation();
        if(view.type==='song')state.hymnalReader.verseIndex=(songPresentationSlides(state.hymnalReader.song)[view.index]||{}).verseIndex||0;
        else if(view.type==='bible'&&state.bibleReader)state.bibleReader.index=view.index;
        if(view.index!==previous){
          fitPresentationText();
          if(!window.GalileaPageTurn?.play(page,direction))animatePresentationTransition(direction);
        }
      }
      function animatePresentationTransition(direction){
        const shell=$('#presentation-shell');if(!shell||document.documentElement.dataset.motion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
        const nextClass=direction<0?'presentation-enter-prev':'presentation-enter-next';
        shell.classList.remove('presentation-enter-next','presentation-enter-prev');void shell.offsetWidth;shell.classList.add(nextClass);
        const duration=/^(song|bible)$/.test(shell.dataset.presentationKind||'')?400:680;
        window.clearTimeout(presentationTransitionTimer);presentationTransitionTimer=window.setTimeout(()=>shell.classList.remove('presentation-enter-next','presentation-enter-prev'),duration);
      }
      function resizePresentation(delta){
        window.GalileaPageTurn?.cancel();
        const view=state.presentation;if(!view||!view.type)return;
        view.scale=clampPresentationScale(Number(view.scale||1)+delta);safeStorage.set(presentationScaleKey(view.type),view.scale.toFixed(2));
        if(view.type==='sabbath')$('#presentation-shell').style.setProperty('--present-scale',String(view.scale));
        fitPresentationText();showPresentationControls(true);
        announcePresentation(view.scale>=1.35&&/^(song|bible)$/.test($('#presentation-shell').dataset.presentationKind||'')?'Ukuran maksimum yang muat di atas copyright':'Ukuran teks '+Math.round(view.scale*100)+' persen');
      }
      function togglePresentationTheme(){
        window.GalileaPageTurn?.cancel();
        const view=state.presentation;if(!view||!view.type)return;applyTheme(view.theme==='light'?'dark':'light');
        syncPresentationState();schedulePresentationFit();showPresentationControls(true);announcePresentation(view.theme==='light'?'Mode terang aktif':'Mode gelap aktif');
      }
      function togglePresentationProjector(){
        window.GalileaPageTurn?.cancel();
        const view=state.presentation;if(!view||!view.type)return;view.projector=!view.projector;safeStorage.set('galilea:presentation-projector',view.projector?'1':'0');
        syncPresentationState();schedulePresentationFit();showPresentationControls(true);announcePresentation(view.projector?'Mode proyektor 16 banding 9 aktif':'Mode layar penuh aktif');
      }
      function handlePresentationPointerDown(event){
        const dialog=$('#presentation-dialog');if(!dialog||!dialog.open)return;showPresentationControls(true);
        if(event.target.closest('.presentation-controls')){presentationPointer=null;return;}
        presentationPointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:Date.now()};
      }
      function handlePresentationPointerUp(event){
        const start=presentationPointer;presentationPointer=null;if(!start||start.id!==event.pointerId)return;
        const dx=event.clientX-start.x,dy=event.clientY-start.y,elapsed=Date.now()-start.time;
        if(elapsed<900&&Math.abs(dx)>=56&&Math.abs(dx)>Math.abs(dy)*1.2)movePresentation(dx<0?1:-1);
      }
      function cleanupPresentation(){
        presentationKeyboardControls=false;
        $('#presentation-palette-menu')?.hidePopover();
        window.GalileaPageTurn?.cancel();
        window.clearInterval(presentationWelcomeTimer);presentationWelcomeTimer=0;
        window.clearTimeout(presentationControlsTimer);window.clearTimeout(presentationFitTimer);window.clearTimeout(presentationTransitionTimer);window.cancelAnimationFrame(presentationFitFrame);presentationPointer=null;
        const shell=$('#presentation-shell');if(shell){shell.classList.remove('presentation-controls-hidden','presentation-enter-next','presentation-enter-prev','is-blackout','is-light');delete shell.dataset.fit;delete shell.dataset.presentationType;delete shell.dataset.presentationKind;}
        releasePresentationWakeLock();
        document.documentElement.classList.remove('is-presenting');
        document.body.classList.remove('is-presenting');
        document.body.style.overflow='';
        if(typeof state.presentationScrollPos==='number'){window.scrollTo(0,state.presentationScrollPos);}
        if(state.presentationPreviousDialog){
          state.presentationPreviousDialog=false;
          const readerDialog=$('#reader-dialog');
          if(readerDialog&&!readerDialog.open){try{readerDialog.showModal();}catch(_){}}
        }
      }
      function closePresentation(){
        const dialog=$('#presentation-dialog');if(dialog&&dialog.open)dialog.close();cleanupPresentation();
        if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
      }

      async function loadDownloadArchives() {
        if(state.archives) return state.archives;
        try { state.archives=await server('getGalileaDownloadArchives',[],9000); return state.archives; }
        catch(_){ return null; }
      }

      async function downloadArchive(kind) {
        const archives=await loadDownloadArchives(); const item=archives&&archives[kind];
        if(item&&item.ready&&safeUrl(item.url)){ const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener';document.body.appendChild(link);link.click();link.remove();return; }
        toast('PDF lengkap belum disiapkan. Admin dapat membuatnya dari menu Sistem pada portal admin.');
      }

      function normalizeWorshipTime(value,fallback) {
        const match=String(value||'').match(/(\d{1,2})[.:](\d{2})/);
        return match?String(Number(match[1])).padStart(2,'0')+':'+match[2]:(fallback||'09:00');
      }

      function scheduleWorshipFallback() {
        const data=state.data||{},now=Date.now()-3*3600000;
        const today=witaDateKey(),clock=window.GalileaScheduleClock;
        const candidates=[
          clock&&clock.forDate(data,'sabbath',today)?{kind:'sabbath',source:clock.forDate(data,'sabbath',today)}:null,
          clock&&clock.forDate(data,'wednesday',today)?{kind:'wednesday',source:clock.forDate(data,'wednesday',today)}:null,
          data.nextWednesday?{kind:'wednesday',source:data.nextWednesday}:null,
          data.nextSabbath?{kind:'sabbath',source:data.nextSabbath}:null
        ].filter(Boolean).filter(item=>item.source.isoDate===today||Number(new Date(item.source.timestamp||0))>=now).sort((a,b)=>Number(new Date(a.source.timestamp||0))-Number(new Date(b.source.timestamp||0)));
        const item=candidates[0];if(!item)return null;
        const source=item.source,isSabbath=item.kind==='sabbath';
        const time=normalizeWorshipTime(source.time,isSabbath?'09:00':'19:00');
        return {
          id:'SCHEDULE-'+String(source.isoDate||'').replace(/-/g,''),
          isoDate:source.isoDate||witaDateKey(new Date(source.timestamp)),
          dateLabel:source.dateLabel||'Jadwal ibadah terdekat',
          serviceType:isSabbath?'IBADAH SABAT':'RABU MALAM',
          time:time,
          timestamp:source.timestamp||((source.isoDate||witaDateKey())+'T'+time+':00+08:00'),
          theme:isSabbath?'Ibadah Sabat':'Ibadah Rabu Malam',
          scripture:'',songs:[],
          agenda:isSabbath?(source.services||[]).map(service=>service.title).filter(Boolean):[],
          note:'Tema, ayat utama, Lagu Sion, dan susunan rinci akan tampil setelah diterbitkan oleh pengurus.',
          livestreamUrl:'',isToday:String(source.isoDate||'')===witaDateKey(),isFallback:true
        };
      }

      function selectedWorshipPlan() {
        const today = witaDateKey();
        const plans = (state.data.worshipPlans || []).filter(item => item.isoDate >= today);
        const fallback = scheduleWorshipFallback();
        if (fallback && !plans.some(item => item.isoDate === fallback.isoDate && normalizeWorshipTime(item.time) === fallback.time)) plans.push(fallback);
        plans.sort((a,b) => (a.isoDate+' '+normalizeWorshipTime(a.time)).localeCompare(b.isoDate+' '+normalizeWorshipTime(b.time)));
        const selected = plans[0];
        return selected ? Object.assign({},selected,{isToday:selected.isoDate === today}) : null;
      }

      function worshipMatchingServices(plan){
        if(!plan)return[];const services=[];
        (state.data.sections||[]).forEach(section=>(section.records||[]).filter(record=>record.isoDate===plan.isoDate).forEach(record=>{
          const nested=(record.services||[]).filter(item=>(item.fields||[]).length);
          if(nested.length)nested.forEach(item=>services.push({title:item.title||section.title,fields:item.fields||[]}));
          else if((record.fields||[]).length)services.push({title:section.title,fields:record.fields||[]});
        }));
        return services;
      }
      function worshipReadiness(plan){
        const services=worshipMatchingServices(plan),checks=[
          {label:'Tema ibadah',ready:Boolean(plan&&plan.theme&&!plan.isFallback),detail:plan&&plan.theme&&!plan.isFallback?'Siap':'Belum diisi'},
          {label:'Ayat utama',ready:Boolean(plan&&plan.scripture),detail:plan&&plan.scripture?'Siap':'Belum diisi'},
          {label:'Lagu pujian',ready:Boolean(plan&&(plan.songs||[]).length),detail:plan&&(plan.songs||[]).length?(plan.songs.length+' lagu'):'Belum diisi'},
          {label:'Susunan acara',ready:Boolean(plan&&(plan.agenda||[]).length),detail:plan&&(plan.agenda||[]).length?(plan.agenda.length+' bagian'):'Belum diisi'},
          {label:'Pembagian petugas',ready:Boolean(services.length),detail:services.length?(services.length+' kelompok'):'Belum tersedia'}
        ];
        return{checks:checks,ready:checks.filter(item=>item.ready).length,total:checks.length,services:services};
      }
      function worshipOfflineKey(plan){return'v2900-worship-offline-'+String(plan&&plan.isoDate||witaDateKey());}
      function normalizeBibleName(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');}
      async function operatorScriptureSlides(reference){
        const match=String(reference||'').trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);if(!match)return[];
        let books=state.bibleBooks||[];
        if(!books.length){
          const raw=await cachedResource('v1710-bible-books',()=>server('getBibleBooks',[]),86400000);
          books=(Array.isArray(raw)?raw:[]).map((book,index)=>({id:String(book&&book.id||'').toUpperCase(),name:String(book&&book.name||'Kitab '+(index+1)),chapters:Math.max(1,Number(book&&book.chapters)||1),testament:book&&book.testament==='PL'?'PL':'PB',order:Number(book&&book.order)||index+1})).filter(book=>book.id);state.bibleBooks=books;
        }
        const wanted=normalizeBibleName(match[1]),book=books.find(item=>normalizeBibleName(item.name)===wanted)||books.find(item=>normalizeBibleName(item.id)===wanted);if(!book)return[];
        const chapter=Number(match[2]),start=Math.max(1,Number(match[3])||1),end=Math.max(start,Number(match[4])||start);
        const data=await cachedResource('v1710-bible-'+book.id+'-'+chapter,()=>server('getBibleChapter',[book.id,chapter]),21600000);
        return(Array.isArray(data&&data.verses)?data.verses:[]).filter(item=>Number(item.number||item.verse)>=start&&Number(item.number||item.verse)<=end).map(item=>({kind:'bible',title:book.name+' '+chapter+':'+String(item.number||item.verse),label:'AYAT '+String(item.number||item.verse),text:String(item.text||item.content||''),source:String(data&&data.source||'Alkitab Bahasa Indonesia')})).filter(item=>item.text);
      }
      function operatorAnnouncementTime(item){
        const numeric=Number(item&&item.dateValue||item&&item.timestamp||0);if(Number.isFinite(numeric)&&numeric>0)return numeric;
        const value=String(item&&item.isoDate||item&&item.date||item&&item.endDate||item&&item.displayUntil||'').trim();
        if(!value)return 0;const parsed=Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00+08:00':value);return Number.isFinite(parsed)?parsed:0;
      }
      function worshipAnnouncementSlides(plan){
        const nextSabbath=state.data.nextSabbath||{},sabbathIso=/SABAT/i.test(String(plan&&plan.serviceType||''))?plan.isoDate:(nextSabbath.isoDate||plan&&plan.isoDate||'');
        const sabbathStart=Date.parse(String(sabbathIso||witaDateKey())+'T00:00:00+08:00');
        return(state.data.announcements||[]).filter(item=>item.includeInBulletin!==false&&operatorAnnouncementTime(item)>=sabbathStart).sort((a,b)=>operatorAnnouncementTime(a)-operatorAnnouncementTime(b)).slice(0,8).map(item=>({kind:'announcement',title:item.title,dateLabel:item.dateLabel||'INFORMASI JEMAAT',priority:item.priority||'NORMAL',summary:item.summary||''}));
      }
      function worshipClosingSlides(plan){
        const site=state.data.site||{};
        const bankName=site.presentation_bank_name||'Bank Mandiri';
        const bankAccount=site.presentation_bank_account||'1490022442422';
        const bankHolder=site.presentation_bank_holder||'Gereja Masehi Advent Hari Ketujuh';
        return worshipAnnouncementSlides(plan).concat([
          {kind:'reminder',number:'01',title:site.presentation_reminder_arrival||'Partisipan wajib hadir 15 menit sebelum kebaktian dimulai.'},
          {kind:'reminder',number:'02',title:site.presentation_reminder_devices||'Mohon nonaktifkan perangkat elektronik saat ibadah berjalan.'},
          {kind:'connection',title:site.presentation_connection_title||'Tetap terhubung bersama kami.',copy:'Informasi resmi Jemaat Galilea Balikpapan.',fields:[
            {label:'WhatsApp',value:site.phone||'+62 851-1717-7709'},
            {label:'Instagram',value:site.presentation_instagram_handle||instagramHandle(site)},
            {label:'Email Galilea',value:site.presentation_email||site.email||'galileabalikpapan@gmail.com'},
            {label:bankName,value:bankAccount+'\n'+bankHolder},
            {label:'Website',value:site.presentation_website||'gmahk-galilea.vercel.app'}
          ]}
        ]);
      }
      async function buildWorshipOperatorSlides(){
        const plan=selectedWorshipPlan();if(!plan)return[];const readiness=worshipReadiness(plan),slides=[];
        slides.push({kind:'overview',title:plan.theme||plan.serviceType||'Ibadah',serviceType:plan.serviceType||'IBADAH',dateLabel:plan.dateLabel||'',time:String(plan.time||'').replace(':','.')+' WITA',readiness:readiness.ready+'/'+readiness.total+' bagian siap'});
        const agenda=plan.agenda||[];for(let index=0;index<agenda.length;index+=6)slides.push({kind:'agenda',title:'Susunan Acara',items:agenda.slice(index,index+6),part:Math.floor(index/6)+1});
        if(plan.scripture){
          try{const scriptureSlides=await operatorScriptureSlides(plan.scripture);if(scriptureSlides.length)slides.push(...scriptureSlides);else slides.push({kind:'scripture',title:'Ayat Utama',reference:plan.scripture});}
          catch(_){slides.push({kind:'scripture',title:'Ayat Utama',reference:plan.scripture});}
        }
        for(const label of (plan.songs||[]).slice(0,10)){
          let song=null,isTheme=/lagu\s*tema/i.test(String(label));
          if(isTheme&&state.data.themeSong)song=state.data.themeSong;
          else{const number=(String(label).match(/\d{1,3}/)||[])[0];if(number)try{song=await getViewerHymnalSong(number);}catch(_){} }
          if(!song){slides.push({kind:'song-reference',title:String(label)});continue;}
          songPresentationSlides(song).forEach(slide=>slides.push({...slide,title:song.title,number:isTheme||song.isTheme?'Lagu Tema':('Lagu Sion · '+song.number)}));
        }
        readiness.services.forEach(service=>{const fields=service.fields||[],parts=Math.max(1,Math.ceil(fields.length/8));for(let index=0;index<fields.length;index+=8)slides.push({kind:'service',title:service.title+(parts>1?' · '+(Math.floor(index/8)+1)+'/'+parts:''),dateLabel:plan.dateLabel||'',time:String(plan.time||'').replace(':','.')+' WITA',fields:fields.slice(index,index+8)});});
        slides.push(...worshipClosingSlides(plan));
        return slides;
      }
      async function prepareWorshipOffline(){
        const plan=selectedWorshipPlan();if(!plan)return toast('Susunan ibadah terdekat belum tersedia.');
        const button=$('[data-prepare-worship-offline]');if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=icon('refresh')+'Menyiapkan…';}
        try{const slides=await buildWorshipOperatorSlides();cacheSet(worshipOfflineKey(plan),{plan:plan,slides:slides,savedAt:Date.now()},604800000);cacheSet('v1800-bootstrap',state.data,604800000);toast('Data ibadah siap digunakan saat koneksi terputus.');render();}
        catch(error){toast('Belum dapat menyiapkan mode offline: '+error.message);}
      }
      async function openWorshipOperator(){
        const plan=selectedWorshipPlan();if(!plan)return toast('Susunan ibadah belum tersedia.');
        const button=$('[data-start-worship-operator]');if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
        try{
          const cached=cachePeek(worshipOfflineKey(plan));const slides=normalizeOperatorSongSlides(navigator.onLine===false&&cached&&cached.slides?cached.slides:await buildWorshipOperatorSlides());
          if(!slides.length)throw new Error('Materi ibadah belum lengkap.');cacheSet(worshipOfflineKey(plan),{plan:plan,slides:slides,savedAt:Date.now()},604800000);
          launchPresentation({type:'operator',index:0,scale:storedPresentationScale('operator'),fittedScale:1,item:slides,blackout:false,projector:safeStorage.get('galilea:presentation-projector','0')==='1',theme:storedPresentationTheme()});
        }catch(error){toast(error.message);}finally{if(button){button.disabled=false;button.removeAttribute('aria-busy');}}
      }
      function openScreenCheck(){
        const ratio=(window.innerWidth/Math.max(1,window.innerHeight)).toFixed(2),slides=[
          {kind:'safe',title:'Area Aman Layar',copy:'Seluruh teks, logo, dan kontrol harus berada di dalam garis putus-putus.',cards:[['Rasio layar',ratio+':1'],['Resolusi',window.innerWidth+' × '+window.innerHeight],['Mode','Uji tampilan aktif']]},
          {kind:'type',title:'Uji Keterbacaan',copy:'Pastikan tiga tingkat tulisan tetap jelas dari bagian belakang ruangan.',cards:[['Judul Besar','IBADAH SABAT'],['Isi Utama','Firman Tuhan menjadi pusat ibadah.'],['Keterangan','Sabtu · 09.00 WITA']]},
          {kind:'contrast',title:'Uji Warna',copy:'Tekan tombol tema untuk membandingkan mode terang dan gelap.',cards:[['Teks utama','Kontras tinggi'],['Teks pendukung','Tetap terbaca'],['Aksen emas','Label dan penanda']]}
        ];
        launchPresentation({type:'screencheck',index:0,scale:1,fittedScale:1,item:slides,blackout:false,projector:safeStorage.get('galilea:presentation-projector','0')==='1',theme:storedPresentationTheme()});
      }

      function worshipPlanText(plan) {
        if(!plan)return whatsappTemplate('IBADAH HARI INI','Susunan ibadah belum dipublikasikan','','');
        const sections=[];
        if(plan.scripture)sections.push({title:'Ayat utama',lines:[plan.scripture]});
        if((plan.songs||[]).length)sections.push({title:'Lagu Sion',lines:plan.songs.map(song=>'• '+song)});
        if((plan.agenda||[]).length)sections.push({title:'Susunan acara',lines:plan.agenda.map((item,index)=>(index+1)+'. '+item)});
        return whatsappTemplate(plan.serviceType||'IBADAH HARI INI',plan.theme||'Ibadah Hari Ini',plan.dateLabel+' · '+String(plan.time||'').replace(':','.')+' WITA',sections,plan.note||'');
      }

      function todayCalendarPayload() {
        const plan=selectedWorshipPlan();if(!plan)return summaryCalendarPayload();
        const time=normalizeWorshipTime(plan.time,'09:00');
        return {sectionTitle:plan.serviceType||'Ibadah',record:{isoDate:plan.isoDate,dateLabel:plan.dateLabel,time:time,timestamp:plan.timestamp||(plan.isoDate+'T'+time+':00+08:00'),fields:[{label:'Tema',value:plan.theme},{label:'Ayat Utama',value:plan.scripture},{label:'Lagu Sion',value:(plan.songs||[]).join(', ')}].filter(item=>item.value)}};
      }

      function renderToday() {
        const plan=selectedWorshipPlan();
        if(!plan)return pageHead('Pusat Ibadah','Ibadah Hari Ini','Seluruh kebutuhan ibadah akan tampil di sini setelah susunan diterbitkan oleh pengurus.')+'<section class="section" style="padding-top:10px"><div class="shell"><div class="worship-empty"><span class="chip brand">MENUNGGU PUBLIKASI</span><h2 style="margin-top:18px">Susunan ibadah belum tersedia.</h2><p class="muted">Jadwal pelayanan tetap dapat dibuka. Halaman ini akan terisi otomatis setelah admin menerbitkan tema, ayat, lagu, dan urutan acara.</p><button class="btn primary" type="button" data-route="schedule">Buka jadwal ibadah'+icon('arrow')+'</button></div></div></section>';
        const matching=[];(state.data.sections||[]).forEach(section=>(section.records||[]).filter(record=>record.isoDate===plan.isoDate).forEach(record=>matching.push({title:section.title,fields:record.fields||[]})));
        const agenda=(plan.agenda||[]).map(item=>'<li><span>'+esc(item)+'</span></li>').join('');
        const songs=(plan.songs||[]).map(song=>{const number=(String(song).match(/\d{1,3}/)||[])[0];return number?'<button class="btn soft" type="button" data-song="'+attr(number)+'">'+icon('music')+esc(song)+'</button>':'<span class="chip">'+esc(song)+'</span>'}).join('');
        const duty=matching.map(section=>'<article class="card worship-section"><p class="eyebrow">PELAYAN</p><h3>'+esc(section.title)+'</h3>'+fieldsHtml(section.fields)+'</article>').join('');
        const label=plan.isToday?'HARI INI':plan.isFallback?'JADWAL TERDEKAT':'IBADAH BERIKUTNYA';
        const intro=plan.isFallback?'Lihat jadwal dan petugas ibadah terdekat. Materi lainnya menyusul setelah pengurus menyiapkannya.':'Lihat tema, bacaan Alkitab, lagu, dan petugas untuk ibadah ini.';
        const sourceNote=plan.isFallback?'<p class="worship-source-note">Jadwal petugas sudah tersedia. Tema dan materi ibadah masih menunggu pengurus.</p>':'';
        const readiness=worshipReadiness(plan),offlineReady=Boolean(cachePeek(worshipOfflineKey(plan))),checks=readiness.checks.map(item=>'<div class="worship-check '+(item.ready?'ready':'missing')+'">'+icon(item.ready?'check':'info')+'<span>'+esc(item.label)+'</span><small>'+esc(item.detail)+'</small></div>').join('');
        const complete = readiness.ready === readiness.total;
        const missing = readiness.checks.filter(item => !item.ready).map(item => item.label.toLowerCase()).join(', ');
        const command='<section class="section operator-section"><div class="shell"><details class="operator-tools"><summary>'+icon('play')+'<span>Untuk petugas: tampilan layar ibadah</span><small>'+esc(readiness.ready)+'/'+esc(readiness.total)+' bagian tersedia</small>'+icon('down')+'</summary><div class="worship-command"><article class="worship-command-panel primary"><p class="eyebrow">Mode operator</p><h2>'+(complete?'Materi ibadah siap.':'Materi ibadah belum lengkap.')+'</h2><p>'+(complete?'Tampilkan ayat, lagu, dan susunan acara di layar ibadah.':'Masih menunggu '+esc(missing)+'. Mode operator menampilkan materi yang sudah tersedia.')+'</p><div class="worship-command-actions"><button class="btn primary" type="button" data-start-worship-operator>'+icon('play')+(complete?'Mulai mode operator':'Buka materi yang tersedia')+'</button><button class="btn ghost" type="button" data-open-screen-check>'+icon('external')+'Uji layar</button></div></article><article class="worship-command-panel"><div class="worship-readiness-head"><div><p class="eyebrow">Kelengkapan materi</p><h3>'+esc(readiness.ready)+' dari '+esc(readiness.total)+' bagian tersedia</h3></div><span class="worship-readiness-score">'+esc(Math.round(readiness.ready/readiness.total*100))+'%</span></div><div class="worship-checks">'+checks+'</div><button class="btn soft" type="button" data-prepare-worship-offline style="width:100%;margin-top:16px">'+icon('download')+(offlineReady?'Perbarui materi tersimpan':'Simpan untuk offline')+'</button>'+(offlineReady?'<div class="offline-ready-note">'+icon('check')+'Materi tersimpan di perangkat ini.</div>':'')+'</article></div></details></div></section>';
        return pageHead(label,plan.isToday?'Ibadah Hari Ini':'Ibadah Berikutnya',intro)+'<section class="section"><div class="shell worship-grid"><div class="worship-stack"><article class="card worship-hero"><span class="chip gold">'+esc(label)+'</span><h2>'+esc(plan.theme)+'</h2><div class="worship-meta"><span>'+icon('calendar')+esc(plan.dateLabel)+'</span><span>'+icon('clock')+esc(String(plan.time||'').replace(':','.')+' WITA')+'</span><span>'+icon('church')+esc(plan.serviceType)+'</span></div>'+sourceNote+(plan.scripture?'<blockquote class="quote">“'+esc(plan.scripture)+'”</blockquote>':'')+'<div class="button-row worship-actions"><button class="btn primary" type="button" data-share-today>'+brandIcon('whatsapp')+'Bagikan</button><button class="btn ghost" type="button" data-calendar-today>'+icon('calendar')+'Tambah kalender</button>'+(plan.livestreamUrl?'<a class="btn ghost" href="'+attr(plan.livestreamUrl)+'" target="_blank" rel="noopener">'+icon('play')+'Siaran langsung</a>':'')+'</div></article><article class="card worship-section"><p class="eyebrow">Urutan ibadah</p><h3>Susunan acara</h3>'+(agenda?'<ol class="worship-agenda">'+agenda+'</ol>':'<p class="muted">Pengurus belum menambahkan susunan acara. Jadwal petugas tetap bisa Anda lihat.</p>')+'</article>'+(songs?'<article class="card worship-section"><p class="eyebrow">Pujian</p><h3>Lagu Sion</h3><div class="worship-songs">'+songs+'</div></article>':'')+'</div><aside class="worship-stack">'+(plan.note?'<article class="card worship-section"><p class="eyebrow">Catatan jemaat</p><h3>Perlu diperhatikan</h3><p class="muted">'+esc(plan.note)+'</p></article>':'')+(duty||'<article class="card worship-section"><p class="eyebrow">Pelayanan</p><h3>Pembagian petugas</h3><p class="muted">Petugas untuk tanggal ini belum tersedia. Anda bisa memeriksa jadwal lengkap.</p><button class="btn" type="button" data-route="schedule">Buka jadwal</button></article>')+'<article class="card worship-section"><p class="eyebrow">Butuh didoakan?</p><h3>Kami siap mendampingi.</h3><p class="muted">Pilih siapa yang boleh membaca permohonan doa Anda.</p><button class="btn primary" type="button" data-route="services">Kirim permohonan doa</button></article></aside></div></section>'+command;
      }

      function renderBulletin() {
        const data=state.data, sabbath=data.nextSabbath, wednesday=data.nextWednesday;
        const serviceHtml=record=>record?'<div class="v18-bulletin-section"><span class="chip brand">'+esc(record.dateLabel||'Jadwal')+' · '+esc(record.time||'')+'</span><h3>'+esc(record.title||record.sectionTitle||'Ibadah')+'</h3>'+fieldsHtml(record.fields||(record.services||[]).flatMap(item=>item.fields||[]))+'</div>':'';
        const announcements=(data.announcements||[]).filter(item=>item.includeInBulletin!==false).slice(0,8).map(item=>'<li><strong>'+esc(item.title)+'</strong><br><span class="muted">'+esc(item.dateLabel||'')+(item.summary?' · '+esc(item.summary):'')+'</span></li>').join('');
        return pageHead('Informasi Mingguan','Warta Jemaat Digital','Susunan pelayanan serta Agenda dan Pengumuman aktif dalam satu halaman yang mudah dibaca dan dibagikan.')+'<section class="section"><div class="shell v18-bulletin-grid"><article class="card v18-bulletin-sheet"><div class="card-pad"><p class="eyebrow">GMAHK Galilea Balikpapan</p><h2>Warta minggu ini.</h2><p class="muted">Berita kegiatan yang sudah lewat tidak dimasukkan ke Warta. Warta hanya memuat jadwal dan informasi aktif.</p></div>'+serviceHtml(sabbath)+serviceHtml(wednesday)+'<div class="v18-bulletin-section"><h3>Agenda dan Pengumuman</h3><ul class="prose-list">'+(announcements||'<li>Belum ada Agenda dan Pengumuman yang dimasukkan ke Warta.</li>')+'</ul></div></article><aside class="v18-side-stack"><article class="card card-pad v18-action-card"><p class="eyebrow">Bagikan</p><h3>Satu warta, seluruh informasi.</h3><div class="grid"><button class="btn whatsapp" type="button" data-share-bulletin>'+brandIcon('whatsapp')+'Bagikan ke WhatsApp</button><button class="btn primary" type="button" data-download-bulletin>'+icon('download')+'Unduh PDF A4</button></div></article><article class="card card-pad"><p class="eyebrow">Kalender</p><h3>Jangan lewatkan ibadah.</h3><button class="btn" type="button" data-calendar-summary>'+icon('calendar')+'Tambah ke kalender</button></article></aside></div></section>';
      }

      function renderVisitor() {
        const site = state.data.site;
        const entrance = safeUrl(site.visitor_entrance_photo_url);
        const photo = entrance || safeUrl(site.church_image_url);
        const guides = [
          ['map','Pintu masuk & parkir',site.visitor_parking,'Petunjuk pintu masuk dan parkir belum dicantumkan. Tanyakan sebelum berangkat agar lebih mudah menemukan lokasi.'],
          ['book','Sekolah Sabat',site.visitor_sabbath_classes,'Tanyakan kelas Sekolah Sabat dan tempat berkumpul kepada penerima tamu saat tiba.'],
          ['users','Anak & keluarga',site.visitor_children,'Informasi kelas anak dan ruang keluarga belum dicantumkan. Pengurus dapat membantu menyiapkan kunjungan Anda.'],
          ['access','Akses kursi roda',site.visitor_accessibility,'Kondisi jalur kursi roda belum dikonfirmasi di website. Hubungi pengurus untuk memastikan akses dan bantuan yang dibutuhkan.']
        ];
        const guideCards = guides.map(item => '<article class="card card-pad visitor-guide-card">'+
          '<span class="visitor-guide-icon">'+icon(item[0])+'</span><h3>'+esc(item[1])+'</h3><p>'+esc(item[2] || item[3])+'</p>'+
          '<a class="link-arrow" href="'+attr(contactWithMessage(site,'Shalom, saya ingin berkunjung ke Galilea. Boleh minta informasi tentang '+item[1].toLowerCase()+'?'))+'" target="_blank" rel="noopener">Tanyakan ke pengurus'+icon('external')+'</a></article>').join('');
        const visual = photo ? '<figure class="visitor-location-photo"><img src="'+attr(photo)+'" alt="'+(entrance?'Pintu masuk gereja':'Foto gereja yang diterbitkan pengurus')+'" loading="lazy" decoding="async"><figcaption>'+(entrance?'Pintu masuk gereja':'Foto gereja dari pengurus')+'</figcaption></figure>' : '';
        return pageHead('Selamat datang','Kunjungan pertama ke Galilea','Lihat waktu ibadah, siapkan perjalanan, dan sampaikan kebutuhan Anda kepada pengurus.')+
          '<section class="section"><div class="shell"><article class="visitor-arrival'+(photo?' has-photo':'')+'"><div class="visitor-arrival-copy"><p class="eyebrow">Rencanakan kunjungan</p><h2>Kami senang menyambut Anda.</h2><dl class="visitor-visit-details"><div><dt>Ibadah Sabat</dt><dd>'+esc(site.sabbath_service)+'</dd></div><div><dt>Ibadah Rabu Malam</dt><dd>'+esc(site.wednesday_service)+'</dd></div><div><dt>Alamat</dt><dd>'+esc(site.address)+'</dd></div></dl><div class="button-row"><a class="btn primary" href="'+attr(mapsUrl(site))+'" target="_blank" rel="noopener">'+brandIcon('maps')+'Petunjuk arah</a><button class="btn" type="button" data-route="schedule">'+icon('calendar')+'Lihat jadwal</button></div></div>'+visual+'</article><div class="visitor-guide-grid">'+guideCards+'</div><aside class="visitor-help"><div><h3>Perlu pendampingan saat berkunjung?</h3><p>Sampaikan kebutuhan Anda sebelum berangkat supaya pengurus dapat membantu.</p></div><a class="btn whatsapp" href="'+attr(contactWithMessage(site,'Shalom, saya berencana berkunjung ke Galilea dan ingin meminta bantuan untuk kunjungan saya.'))+'" target="_blank" rel="noopener">'+brandIcon('whatsapp')+'Hubungi pengurus</a></aside></div></section>';
      }

      function contactWithMessage(site, message) {
        const url = new URL(whatsappUrl(site));
        url.searchParams.set('text', message);
        return url.href;
      }

      function renderFavorites() {
        const renderList=items=>items.length?'<div class="v18-favorite-list">'+items.map(item=>'<article class="v18-favorite">'+icon('star')+'<div><strong>'+esc(item.title)+'</strong><br><span class="small muted">'+esc(item.subtitle||routeTitle(item.route))+'</span></div><button class="btn" type="button" data-open-saved="'+attr(item.key)+'">Buka'+icon('arrow')+'</button></article>').join('')+'</div>':'<div class="v18-empty">Belum ada bacaan tersimpan di perangkat ini.</div>';
        return pageHead('Bacaan Pribadi','Tersimpan & terakhir dibaca','Favorit disimpan hanya pada perangkat ini—tanpa akun dan tanpa mengirim data pribadi.')+'<section class="section"><div class="shell grid"><div><div class="section-head"><div><p class="eyebrow">Favorit</p><h2>Tersimpan</h2></div></div>'+renderList(state.favorites)+'</div><div><div class="section-head"><div><p class="eyebrow">Riwayat lokal</p><h2>Terakhir dibaca</h2></div></div>'+renderList(state.recents)+'</div></div></section>';
      }

      function activityMediaSlides(item) {
        const slides=[], seen=new Set();
        const add=slide=>{const key=safeUrl(slide.url);if(!key||seen.has(key))return;seen.add(key);slides.push(Object.assign({},slide,{url:key,downloadUrl:safeUrl(slide.downloadUrl)||key}));};
        const photos=(item.photos||[]).filter(Boolean), cover=String(item.coverUrl||'');
        if(cover)add({type:'image',url:cover,downloadUrl:cover,name:item.title+' · sampul'});
        photos.forEach((url,index)=>add({type:'image',url:url,downloadUrl:url,name:item.title+' · foto '+(index+1)}));
        (item.media||[]).slice().sort((a,b)=>Number(b.primary||0)-Number(a.primary||0)).forEach(media=>{
          const mime=String(media.mimeType||''), type=mime.startsWith('image/')?'image':mime.startsWith('video/')?'video':mime.startsWith('audio/')?'audio':'file';
          add({type:type,url:safeUrl(type==='file'?(media.viewUrl||media.url):(media.url||media.downloadUrl)),downloadUrl:safeUrl(media.downloadUrl||media.url||media.viewUrl),name:media.name||item.title,size:Number(media.size||0)});
        });
        return slides;
      }

      function renderActivities() {
        const items=state.data.activities||[];
        return pageHead('Kehidupan Jemaat', 'Berita Jemaat', 'Cerita dan dokumentasi kegiatan yang sudah berlangsung. Cari media, buka Journal, lalu download atau bagikan.') + '<section class="section activity-archive"><div class="shell"><div class="v18-toolbar"><strong>'+esc(items.length)+' berita ditemukan</strong>'+'</div><div class="activity-cinema-grid">' + (items.length ? items.map((item,index) => activityCardHtml(item,index===0)).join('') : '<div class="v18-empty">Belum ada berita yang diterbitkan.</div>') + '</div></div></section>';
      }

      function activityExcerptText(value) {
        if (!value) return '';
        const div = document.createElement('div');
        div.innerHTML = String(value).replace(/<br\s*\/?>/gi, ' ');
        let text = div.textContent || div.innerText || '';
        text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, '');
        return text.replace(/\s+/g, ' ').trim();
      }

      function activityCardHtml(item, featured) {
        const cover = safeUrl(item.coverUrl || (item.media && item.media.find(m => m.mimeType.startsWith("image/")) ? item.media.find(m => m.mimeType.startsWith("image/")).url : "") || (item.photos || [])[0]);
        return '<article class="activity-film ' + (featured?'featured':'') + '">' +
          '<button class="activity-film-hit" type="button" data-open-activity="' + attr(item.id) + '" aria-label="Buka kegiatan ' + attr(item.title) + '"></button>' +
          '<div class="activity-film-media">' + (cover?'<img src="' + attr(cover) + '" alt="' + attr(item.title) + '" loading="lazy" decoding="async">':'<span class="activity-film-placeholder">' + icon('image') + '</span>') + '<span class="film-shade"></span></div>' +
          '<div class="activity-film-copy"><div class="film-meta"><span>' + esc(item.dateLabel || 'Berita Jemaat') + '</span><span>' + esc(item.location || 'GMAHK Galilea') + '</span></div><h3>' + esc(item.title) + '</h3><p>' + esc(activityExcerptText(item.description)) + '</p><div class="film-cta"><span>Baca berita</span>' + icon('arrow') + (item.photoCount?'<small>' + esc(item.photoCount) + ' foto</small>':'') + '</div></div></article>';
      }

      function activityBodyHtml(text) {
        if (!text) return '';
        if (/<[a-z][\s\S]*>/i.test(text)) return cleanHtml(text);
        return text.split(/\n{2,}/).map(p => '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>').join('');
      }

      function openActivity(id) {
        const item=(state.data.activities||[]).find(activity=>String(activity.id)===String(id));
        if(!item)return toast('Berita Jemaat belum ditemukan.');
        history.pushState({route:'activities',beritaId:id},'','#berita/' + encodeURIComponent(id));
        const cover = safeUrl(item.coverUrl || (item.media && item.media.find(m => m.mimeType.startsWith("image/")) ? item.media.find(m => m.mimeType.startsWith("image/")).url : "") || (item.photos||[])[0]);
        if(cover){const ogImg=document.querySelector('meta[property="og:image"]');if(ogImg)ogImg.content=cover;}
        const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=item.title+' · Berita Jemaat Galilea';
        const ogDesc=document.querySelector('meta[property="og:description"]');if(ogDesc)ogDesc.content=htmlToWaText(item.description||'').slice(0,160);
        document.title=item.title+' · GMAHK Galilea';


        const mergedSlides=activityMediaSlides(item);
        let gallery='';
        if(mergedSlides.length){
          gallery='<div class="journal-deck" data-journal-index="0" data-journal-count="'+mergedSlides.length+'" aria-label="Journal media '+attr(item.title)+'"><div class="journal-deck-stage">' +
            mergedSlides.map((slide, index) => {
               const stateClass=index===0?' is-active':index===1?' is-next':index===mergedSlides.length-1?' is-prev':'';
               const label=slide.type==='image'?'Foto':slide.type==='video'?'Video':slide.type==='audio'?'Audio':'Dokumen';
               let mediaHtml='';
               if (slide.type === 'image') {
                 mediaHtml='<button class="journal-card-media" type="button" data-story-photo="'+attr(slide.url)+'" aria-label="Perbesar '+attr(slide.name)+'"><img src="'+attr(slide.url)+'" alt="'+attr(slide.name)+'" loading="lazy" decoding="async"></button>';
               } else if (slide.type === 'video') {
                 mediaHtml='<div class="journal-card-media"><video controls playsinline preload="metadata" src="'+attr(slide.url)+'"></video></div>';
               } else if (slide.type === 'audio') {
                 mediaHtml='<div class="journal-card-media journal-file">'+icon('music')+'<h3>'+esc(slide.name)+'</h3><audio controls preload="metadata" src="'+attr(slide.url)+'"></audio></div>';
               } else {
                 mediaHtml='<div class="journal-card-media journal-file">'+icon('file')+'<h3>'+esc(slide.name)+'</h3><p>'+(slide.size?esc(Math.round(slide.size/1024)+' KB'):'Dokumen kegiatan')+'</p><a href="'+attr(slide.url)+'" target="_blank" rel="noopener" class="btn soft">Buka dokumen</a></div>';
               }
               return '<article class="journal-card'+stateClass+'" data-journal-card="'+index+'"'+(index?' inert':'')+'>'+mediaHtml+'<div class="journal-card-bar"><div class="journal-card-name"><strong>'+esc(slide.name)+'</strong><span>'+label+' · '+(index+1)+' dari '+mergedSlides.length+'</span></div><div class="journal-card-actions"><a class="journal-action" href="'+attr(slide.downloadUrl||slide.url)+'" target="_blank" rel="noopener" download aria-label="Download '+attr(slide.name)+'">'+icon('download')+'</a><button class="journal-action" type="button" data-share-media data-media-title="'+attr(slide.name)+'" data-media-url="'+attr(slide.url)+'" aria-label="Bagikan '+attr(slide.name)+'">'+icon('share')+'</button></div></div></article>';
            }).join('') +
            '</div>' + (mergedSlides.length>1?'<div class="journal-deck-nav"><button class="journal-action" type="button" data-journal-nav="-1" aria-label="Media sebelumnya">'+icon('chevron')+'</button><button class="journal-action next" type="button" data-journal-nav="1" aria-label="Media selanjutnya">'+icon('chevron')+'</button></div>':'')+'<div class="journal-deck-footer"><span data-journal-counter>1 / '+mergedSlides.length+'</span><div class="journal-dots">'+mergedSlides.map((_,index)=>'<span class="journal-dot '+(index===0?'active':'')+'" data-journal-dot="'+index+'"></span>').join('')+'</div><span>Geser untuk menjelajah</span></div>'+
            '</div>';
        } else {
          gallery='<div class="activity-story-empty">'+icon('image')+'<span>Media kegiatan belum ditambahkan.</span></div>';
        }

        const actions='<div class="button-row" style="margin-top: 32px;">'+(item.url?'<a class="btn primary" href="'+attr(item.url)+'" target="_blank" rel="noopener">Sumber berita'+icon('external')+'</a>':'')+'<button class="btn whatsapp" type="button" data-share-activity="'+attr(item.id)+'">'+brandIcon('whatsapp')+'Bagikan ke WhatsApp</button></div>';
        openReader(item.title,'<article class="activity-story"><header><p class="eyebrow">Berita Jemaat · '+esc(item.dateLabel)+'</p><div class="activity-story-heading"><h2>'+esc(item.title)+'</h2><div class="meta"><span>'+icon('map')+esc(item.location||'GMAHK Galilea Balikpapan')+'</span></div></div></header>'+gallery+'<div class="activity-story-content">'+activityBodyHtml(item.description||'')+actions+'</div></article>');
      }

      function updateJournalDeck(wrap,index) {
        if(!wrap)return;
        const count=Number(wrap.dataset.journalCount||0);if(!count)return;
        const active=(Number(index)+count)%count;wrap.dataset.journalIndex=String(active);
        wrap.querySelectorAll('[data-journal-card]').forEach(card=>{
          const cardIndex=Number(card.dataset.journalCard),forward=(cardIndex-active+count)%count,backward=(active-cardIndex+count)%count;
          card.classList.remove('is-active','is-prev','is-next','is-far-prev','is-far-next');
          card.inert = cardIndex !== active;
          if(cardIndex===active)card.classList.add('is-active');else if(forward===1)card.classList.add('is-next');else if(backward===1)card.classList.add('is-prev');else if(forward===2)card.classList.add('is-far-next');else if(backward===2)card.classList.add('is-far-prev');
          card.querySelectorAll('video,audio').forEach(media=>{if(cardIndex!==active)media.pause();});
        });
        wrap.querySelectorAll('[data-journal-dot]').forEach(dot=>dot.classList.toggle('active',Number(dot.dataset.journalDot)===active));
        const counter=wrap.querySelector('[data-journal-counter]');if(counter)counter.textContent=(active+1)+' / '+count;
      }
      function shiftJournalDeck(wrap,step){if(wrap)updateJournalDeck(wrap,Number(wrap.dataset.journalIndex||0)+Number(step||0));}
      const ANNOUNCEMENT_GROUPS = [
        {id:'RABU MALAM',label:'Rabu Malam',hint:'Informasi ibadah doa dan pelayanan Rabu malam.'},
        {id:'IBADAH KHOTBAH',label:'Ibadah Khotbah',hint:'Informasi Kebaktian Khotbah, Perjamuan Kudus, dan Ibadah Sabat.'},
        {id:'SEKOLAH SABAT',label:'Sekolah Sabat',hint:'Informasi kelas, pelayanan, serta kegiatan Sekolah Sabat.'},
        {id:'PEMUDA ADVENT',label:'Pemuda Advent (PA)',hint:'Informasi ibadah, persekutuan, dan pelayanan Pemuda Advent.'},
        {id:'UMUM',label:'Pengumuman Umum',hint:'Informasi jemaat yang berlaku untuk seluruh kegiatan.'}
      ];
      function announcementCategory(item){
        const explicit=String(item&&item.category||'').trim().toUpperCase().replace(/\s+/g,' '),allowed=ANNOUNCEMENT_GROUPS.map(group=>group.id);
        if(explicit==='PA')return 'PEMUDA ADVENT';
        if(explicit&&explicit!=='UMUM'&&allowed.includes(explicit))return explicit;
        const text=String((item&&item.title||'')+' '+(item&&item.summary||'')).toUpperCase();
        if(/SEKOLAH\s+SABAT/.test(text))return 'SEKOLAH SABAT';
        if(/RABU|PERMINTAAN\s+DOA/.test(text))return 'RABU MALAM';
        if(/\bPA\b|PEMUDA\s+ADVENT/.test(text))return 'PEMUDA ADVENT';
        if(/KHOTBAH|IBADAH\s+SABAT|SABAT\s+RAYA|PERJAMUAN/.test(text))return 'IBADAH KHOTBAH';
        return allowed.includes(explicit)?explicit:'UMUM';
      }
      function announcementGroupMeta(category){return ANNOUNCEMENT_GROUPS.find(group=>group.id===category)||ANNOUNCEMENT_GROUPS[ANNOUNCEMENT_GROUPS.length-1];}
      function announcementCardHtml(item){
        const category=announcementCategory(item),meta=announcementGroupMeta(category);
        return '<article class="card card-pad lift announcement-card" data-announcement-card="'+attr(item.id)+'"><div class="button-row"><span class="chip '+(item.priority==='PENTING'?'gold':item.priority==='IBADAH'?'brand':'')+'">'+esc(item.priority||'NORMAL')+'</span><span class="chip">'+esc(item.dateLabel||'Informasi Jemaat')+'</span></div><h3 style="margin-top:19px">'+esc(item.title)+'</h3><p class="muted">'+esc(item.summary||'Informasi selengkapnya akan diperbarui oleh pengurus.')+'</p><div class="button-row"><button class="btn" type="button" data-open-announcement="'+attr(item.id)+'">Baca pengumuman</button><button class="btn whatsapp" type="button" data-share-announcement="'+attr(item.id)+'">'+brandIcon('whatsapp')+'Bagikan</button><span class="chip">'+esc(meta.label)+'</span></div></article>';
      }

      function openAnnouncement(id) {
        const item = (state.data.announcements || []).find(entry => String(entry.id) === String(id));
        if (!item) return toast('Pengumuman belum ditemukan. Silakan buka daftar terbaru.');
        const meta = announcementGroupMeta(announcementCategory(item));
        openReader(item.title, '<article class="announcement-reading"><p class="eyebrow">'+esc(meta.label)+'</p><h2>'+esc(item.title)+'</h2><div class="button-row"><span class="chip">'+esc(item.dateLabel || 'Informasi jemaat')+'</span><span class="chip '+(item.priority === 'PENTING' ? 'gold' : '')+'">'+esc(item.priority || 'NORMAL')+'</span></div><p class="announcement-reading-copy">'+esc(item.summary || 'Keterangan belum ditambahkan pengurus.')+'</p><div class="button-row"><button class="btn whatsapp" type="button" data-share-announcement="'+attr(item.id)+'">'+brandIcon('whatsapp')+'Bagikan</button>'+(safeUrl(item.url)?'<a class="btn" href="'+attr(safeUrl(item.url))+'" target="_blank" rel="noopener">Buka informasi lengkap'+icon('external')+'</a>':'')+'</div></article>');
      }
      function nearestAnnouncement(items){
        const floor=Date.now()-86400000,future=items.filter(item=>Number(item.dateValue||0)>=floor).sort((a,b)=>Number(a.dateValue||0)-Number(b.dateValue||0));
        return future[0]||items[0]||null;
      }
      function announcementSummaryHtml(items){
        const item=nearestAnnouncement(items);if(!item)return '';
        const category=announcementCategory(item),meta=announcementGroupMeta(category);
        return '<article class="announcement-summary"><div><div class="announcement-summary-meta"><span class="chip brand">TERDEKAT</span><span class="chip">'+esc(meta.label)+'</span><span class="chip '+(item.priority==='PENTING'?'gold':'')+'">'+esc(item.priority||'NORMAL')+'</span></div><h2>'+esc(item.title)+'</h2><p class="lead">'+esc(item.summary||'Informasi selengkapnya akan diperbarui oleh pengurus.')+'</p><p class="small muted">'+icon('calendar')+esc(item.dateLabel||'Tanggal mengikuti informasi pengurus')+'</p></div><div class="announcement-summary-actions"><button class="btn primary" type="button" data-present-announcements="'+attr(category)+'">'+icon('external')+'Tampilkan layar</button><button class="btn whatsapp" type="button" data-share-announcement="'+attr(item.id)+'">'+brandIcon('whatsapp')+'Bagikan ke WhatsApp</button>'+(item.url?'<a class="btn" href="'+attr(item.url)+'" target="_blank" rel="noopener">Selengkapnya'+icon('external')+'</a>':'')+'</div></article>';
      }
      function renderAnnouncements() {
        const items=Array.isArray(state.data.announcements)?state.data.announcements:[];
        const groups=ANNOUNCEMENT_GROUPS.map(meta=>({meta,items:items.filter(item=>announcementCategory(item)===meta.id)})).filter(group=>group.items.length);
        const sections=groups.map(group=>'<section class="announcement-group" id="announcement-'+attr(group.meta.id.toLowerCase().replace(/\s+/g,'-'))+'"><div class="announcement-group-head"><div><p class="eyebrow">'+esc(group.meta.label)+'</p><h2>'+esc(group.meta.label)+'</h2><p class="muted">'+esc(group.meta.hint)+'</p></div><button class="btn primary" type="button" data-present-announcements="'+attr(group.meta.id)+'">'+icon('external')+'Mode layar <span class="announcement-group-count">'+group.items.length+'</span></button></div><div class="grid grid-2">'+group.items.map(announcementCardHtml).join('')+'</div></section>').join('');
        return pageHead('Informasi Ibadah','Agenda dan Pengumuman','Perjamuan Kudus, rapat, perubahan jadwal, dan informasi aktif jemaat. Setiap kategori dapat ditampilkan satu per satu dalam Mode Layar.')+'<section class="section"><div class="shell">'+announcementSummaryHtml(items)+(sections?'<div class="announcement-groups">'+sections+'</div>':emptyText('Belum ada Agenda dan Pengumuman yang dipublikasikan.'))+'</div></section>';
      }
      function renderGallery() {
        const items=state.data.gallery||[];
        return pageHead('Galilea dalam Gambar', 'Galeri', 'Momen ibadah, persekutuan, dan pelayanan jemaat.') + '<section class="section"><div class="shell">' + (items.length ? '<div class="gallery-grid">' + items.map(item => '<figure class="card gallery-item lift"><button type="button" class="activity-film-hit" data-story-photo="'+attr(item.imageUrl)+'" aria-label="Perbesar '+attr(item.title||'foto')+'"></button><img src="' + attr(item.imageUrl) + '" alt="' + attr(item.title || 'Galeri Galilea') + '" loading="lazy"><figcaption><strong>' + esc(item.title || '') + '</strong><br>' + esc(item.caption || '') + '</figcaption></figure>').join('') + '</div>' : '<div class="v18-empty">Belum ada foto yang diterbitkan.</div>') + '</div></section>';
      }

      function renderServices() {
        const types = ['Permohonan Doa','Kunjungan','Kelas Alkitab','Baptisan','Bergabung Melayani','Bantuan Website'];
        const site = state.data.site;
        const responseTime = site.service_response_time || 'Waktu balasan mengikuti ketersediaan tim pelayanan.';
        const form = '<form id="service-form" class="grid">'+
          '<div class="field-control"><label for="service-type">Jenis layanan</label><select id="service-type" name="type" required>'+types.map(type => '<option>'+esc(type)+'</option>').join('')+'</select></div>'+
          '<div class="grid grid-2"><div class="field-control"><label for="service-name">Nama</label><input id="service-name" name="name" autocomplete="name" required maxlength="100"></div><div class="field-control"><label for="service-phone">WhatsApp</label><input id="service-phone" name="phone" type="tel" autocomplete="tel" required maxlength="30" placeholder="08…"></div></div>'+
          '<div class="field-control"><label for="service-message">Pesan</label><textarea id="service-message" name="message" required maxlength="1200" placeholder="Tuliskan kebutuhan Anda…"></textarea></div>'+
          '<div class="field-control"><label for="service-privacy">Siapa yang boleh membaca?</label><select id="service-privacy" name="privacy" required><option value="TIM_PELAYANAN">Tim pelayanan</option><option value="GEMBALA">Gembala / reviewer senior saja</option><option value="ANONIM">Boleh dibagikan tanpa nama</option></select></div>'+
          '<input class="sr-only" name="website" tabindex="-1" autocomplete="off" aria-label="Biarkan kosong"><label class="check"><input type="checkbox" name="consent" required><span>Saya setuju data ini disimpan untuk keperluan tindak lanjut pelayanan.</span></label>'+
          '<button class="btn primary" type="submit" id="service-submit">Kirim permohonan'+icon('send')+'</button><div id="service-result" role="status" aria-live="polite" tabindex="-1"></div></form>';
        return pageHead('Kami siap mendampingi','Layanan Jemaat','Sampaikan kebutuhan Anda. Pilih siapa yang boleh membaca permohonan sebelum mengirim.')+
          '<section class="section"><div class="shell contact-layout services-layout"><article class="card card-pad service-form-card"><h2>Mari terhubung.</h2>'+form+'</article><aside class="service-sidebar"><article class="card card-pad"><p class="eyebrow">Setelah mengirim</p><h3>Pengurus akan menindaklanjuti.</h3><ol class="service-next-steps"><li>Simpan nomor permohonan yang muncul setelah pengiriman.</li><li>Tim yang berwenang membaca pesan sesuai pilihan privasi Anda.</li><li>Pengurus menghubungi nomor WhatsApp yang Anda isi bila diperlukan.</li></ol><p class="service-response-time">'+esc(responseTime)+'</p><a class="btn" href="'+attr(whatsappUrl(site))+'" target="_blank" rel="noopener">'+brandIcon('whatsapp')+'Kontak tindak lanjut</a></article><article class="card card-pad"><h3>Pilihan layanan</h3><ul class="service-types">'+types.map(type => '<li>'+esc(type)+'</li>').join('')+'</ul></article></aside></div></section>';
      }

      function renderFaq() {
        const items = state.data.faq;
        const categories = Array.from(new Set(items.map(item => item.category)));
        return pageHead('Bantuan Jemaat', 'Jawaban yang mudah ditemukan.', 'Cari berdasarkan kata atau pilih kategori. Seluruh jawaban ditulis untuk jemaat yang menggunakan website ini.') + '<section class="section faq-section" style="padding-top:10px"><div class="shell"><article class="faq-welcome"><div><span class="chip brand">PUSAT BANTUAN</span><h2>Mulai dari pertanyaan Anda.</h2><p>Petunjuk mencakup jadwal, bacaan, video, unduhan, bahasa, tampilan, layanan, dan privasi.</p></div><button class="btn primary" type="button" data-route="services">Hubungi pengurus' + icon('arrow') + '</button></article><div class="faq-tools"><div class="search-box"><input id="faq-search" type="search" value="' + attr(state.faqQuery) + '" placeholder="Cari pertanyaan, misalnya: unduh jadwal…">' + icon('search') + '</div><div class="faq-category-tabs"><button class="tab ' + (state.faqCategory==='Semua'?'active':'') + '" type="button" data-faq-category="Semua">Semua</button>' + categories.map(category=>'<button class="tab ' + (state.faqCategory===category?'active':'') + '" type="button" data-faq-category="' + attr(category) + '">' + esc(category) + '</button>').join('') + '</div></div><div id="faq-results">' + faqResultsHtml() + '</div><article class="card faq-contact-card"><div><p class="eyebrow">Masih perlu bantuan?</p><h3>Pengurus gereja siap membantu.</h3><p class="muted">Sampaikan pertanyaan atau kebutuhan pelayanan melalui halaman Layanan Jemaat.</p></div><div class="button-row"><button class="btn primary" type="button" data-route="services">Buka layanan jemaat' + icon('arrow') + '</button><a class="btn" href="' + attr(whatsappUrl(state.data.site)) + '" target="_blank" rel="noopener">' + brandIcon('whatsapp') + 'WhatsApp</a></div></article></div></section>';
      }

      function faqResultsHtml() {
        const query=String(state.faqQuery||'').toLowerCase().trim();
        const items=state.data.faq.filter(item=>(state.faqCategory==='Semua'||item.category===state.faqCategory)&&(!query||(item.question+' '+item.answer+' '+item.category).toLowerCase().includes(query)));
        const categories=Array.from(new Set(items.map(item=>item.category)));
        if(!items.length)return emptyText('Belum ada jawaban yang cocok. Coba kata yang lebih singkat.');
        return '<div class="faq-category-grid">' + categories.map(category=>'<section class="faq-category"><p class="eyebrow">' + esc(category) + '</p><div class="faq-list">' + items.filter(item=>item.category===category).map(item=>'<details class="faq"><summary><span>' + esc(item.question) + '</span>' + icon('plus') + '</summary><div class="faq-answer">' + esc(item.answer) + '</div></details>').join('') + '</div></section>').join('') + '</div>';
      }

      function renderContact() {
        const site = state.data.site;
        const mapEmbed = safeUrl(site.maps_embed_url) || ('https://www.google.com/maps?q=' + encodeURIComponent((site.church_name || 'GMAHK Galilea Balikpapan') + ' ' + (site.address || 'Balikpapan')) + '&output=embed');
        const instagramName=instagramHandle(site), instagramLink=instagramProfileUrl(site);
        const rows = [
          ['map','Alamat',site.address],['phone','Telepon / WhatsApp',site.phone],
          ['mail','Email',site.email],['calendar','Ibadah Sabat',site.sabbath_service],
          ['clock','Ibadah Rabu Malam',site.wednesday_service]
        ].filter(row => row[2]).map(row => '<div class="contact-row"><span class="contact-icon">'+icon(row[0])+'</span><div><small>'+esc(row[1])+'</small><strong>'+esc(row[2])+'</strong></div></div>').join('');
        return pageHead('Datang beribadah','Kontak Gereja','Alamat, jadwal ibadah, dan jalur komunikasi GMAHK Galilea Balikpapan.')+
          '<section class="section"><div class="shell contact-layout"><article class="card card-pad"><h2>Mari terhubung.</h2><div class="contact-list">'+rows+'<div class="contact-row"><span class="contact-icon">'+brandIcon('instagram')+'</span><div><small>Instagram</small><strong><a href="'+attr(instagramLink)+'" target="_blank" rel="noopener">'+esc(instagramName)+'</a></strong></div></div></div><div class="button-row"><a class="btn primary" href="'+attr(whatsappUrl(site))+'" target="_blank" rel="noopener">'+brandIcon('whatsapp')+'WhatsApp</a><button class="btn" type="button" data-route="visitor">Panduan berkunjung</button></div></article><article class="card map-embed contact-map"><iframe src="'+attr(mapEmbed)+'" title="Peta lokasi GMAHK Galilea Balikpapan" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><div class="map-overlay"><div><strong>GMAHK Galilea Balikpapan</strong><br><span class="small muted">'+esc(site.address)+'</span></div><a class="btn primary" href="'+attr(mapsUrl(site))+'" target="_blank" rel="noopener">'+brandIcon('maps')+'Petunjuk arah</a></div></article></div></section>';
      }

      function bindView() {
        if (state.route === 'home') requestIdleCallbackSafe(loadHomeAsync);
        $$('[data-home-extra]').forEach(details => details.addEventListener('toggle', () => {
          if (!details.open || details.dataset.loading === '1') return;
          details.dataset.loading = '1';
          const jobs = details.dataset.homeExtra === 'broadcast'
            ? [loadAwrHome(),loadSabbathDiscussionHome()] : [loadThemeHome()];
          Promise.allSettled(jobs).finally(() => { delete details.dataset.loading; });
        }));
        if (state.route === 'sabbath') loadSabbath();
        if (state.route === 'bible') loadBibleBooks();
        if (state.route === 'hymnal') loadHymnal();
        if (state.route === 'hymnal-scores') loadHymnalScores();

        $('#member-form')?.addEventListener('submit', async event => {
          event.preventDefault();
          const box = $('#member-results');
          box.innerHTML = loadingBox();
          try { state.async.memberSchedule = await server('findMemberSchedule',[$('#member-input').value]); box.innerHTML = memberResultsHtml(state.async.memberSchedule); }
          catch (error) { box.innerHTML = errorBox(error.message); }
        });
        $('#sabbath-year')?.addEventListener('change', event => { state.sabbathYear = Number(event.target.value); loadSabbath(); });
        $('#sabbath-quarter')?.addEventListener('change', event => { state.sabbathQuarter = Number(event.target.value); loadSabbath(); });
        $('#bible-book-trigger')?.addEventListener('click', openBookPicker);
        $('#bible-open')?.addEventListener('click', openBibleChapter);
        $('#bible-verse')?.addEventListener('keydown', event => { if(event.key==='Enter') openBibleChapter(); });
        $('#bible-search-submit')?.addEventListener('click', runBibleSearch);
        $('#bible-search-input')?.addEventListener('keydown', event => { if(event.key==='Enter'){ event.preventDefault(); runBibleSearch(); } });
        $('#bible-search-results')?.addEventListener('click', event => { const hit=event.target.closest('[data-bible-hit]'); if(hit) openBibleSearchHit(hit.dataset.bibleHit); });
        $('#hymnal-search')?.addEventListener('input', event => renderSongList(event.target.value));
        $('#hymnal-select')?.addEventListener('change', event => {if(event.target.value)openSong(event.target.value);});
        $('#faq-search')?.addEventListener('input', event => { state.faqQuery=event.target.value; const box=$('#faq-results'); if(box) box.innerHTML=faqResultsHtml(); scheduleTranslation(350); });
        $('#random-song')?.addEventListener('click', () => state.hymnal && openSong(state.hymnal.songs[Math.floor(Math.random()*state.hymnal.songs.length)].number));
        $('#service-form')?.addEventListener('submit', submitServiceForm);
      }

      async function submitServiceForm(event) {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.dataset.submitting === '1') return;
        form.dataset.submitting = '1';
        const button = $('#service-submit');
        const result = $('#service-result');
        const values = Object.fromEntries(new FormData(form).entries());
        values.consent = form.elements.consent.checked;
        values.contactMethod = 'WhatsApp';
        button.disabled = true;
        button.textContent = 'Mengirim…';
        form.setAttribute('aria-busy','true');
        result.innerHTML = '';
        try {
          const response = await server('submitServiceRequest',[values]);
          const site = state.data.site;
          const reference = String(response.reference || '');
          const followUp = contactWithMessage(site,'Shalom, saya ingin menanyakan tindak lanjut permohonan'+(reference?' nomor '+reference:' yang telah saya kirim')+'.');
          result.innerHTML = '<article class="service-confirmation"><span class="service-confirmation-icon">'+icon('check')+'</span><h3>Permohonan sudah diterima.</h3><p>'+esc(response.message || 'Terima kasih telah menghubungi tim pelayanan.')+'</p>'+(reference?'<dl><dt>Nomor permohonan</dt><dd>'+esc(reference)+'</dd></dl>':'')+'<p>Simpan nomor ini untuk menanyakan perkembangannya. Pengurus dapat menghubungi Anda melalui WhatsApp yang sudah diisi.</p><p class="muted">'+esc(site.service_response_time || 'Waktu balasan mengikuti ketersediaan tim pelayanan.')+'</p><a class="btn" href="'+attr(followUp)+'" target="_blank" rel="noopener">'+brandIcon('whatsapp')+'Tanyakan tindak lanjut</a></article>';
          form.reset();
          result.focus({preventScroll:true});
          result.scrollIntoView({block:'nearest',behavior:'smooth'});
          track('service_request',{service_type:values.type});
        } catch (error) { result.innerHTML = errorBox(error.message); }
        finally { delete form.dataset.submitting; form.removeAttribute('aria-busy'); button.disabled = false; button.innerHTML = 'Kirim permohonan' + icon('send'); }
      }

      function requestIdleCallbackSafe(callback) {
        if ('requestIdleCallback' in window) requestIdleCallback(callback,{timeout:350});
        else setTimeout(callback,30);
      }

      function openReader(title, html) {
        ++songOpenSequence;
        $('#reader-title').textContent = title;
        $('#reader-body').innerHTML = html;
        $('#reader-dialog').showModal();
      }
      async function fetchLessonData(id) {
        const key = 'v1700-lesson-' + state.sabbathYear + '-' + state.sabbathQuarter + '-' + id;
        let data = cacheGet(key);
        const valid = value => Boolean(value && Number(value.number) > 0 && value.title && Array.isArray(value.days) && value.days.length);
        if (!valid(data)) {
          cacheRemove(key);
          data = await server('getSabbathLessonDetail',[state.sabbathYear,state.sabbathQuarter,id,true]);
        }
        if (!valid(data)) throw new Error('Pelajaran ini belum selesai diterbitkan. Silakan muat kembali beberapa saat lagi.');
        cacheSet(key,data,21600000);
        return data;
      }
      async function downloadLessonById(id) {
        try {
          toast('Menyiapkan pelajaran untuk diunduh…');
          downloadLessonData(await fetchLessonData(id));
        } catch (error) { toast(error.message); }
      }
      async function openLesson(id) {
        state.async.currentLesson=null;
        openReader('Menyiapkan pelajaran',loadingBox('Membuka pelajaran minggu ini','Mengambil bacaan harian dan menandai bagian hari ini…'));
        try {
          const data = await fetchLessonData(id);
          state.async.currentLesson = data;
          const savedItem={type:'lesson',id:data.number||id,title:'Pelajaran '+data.number+' · '+data.title,subtitle:data.dateLabel||'Sekolah Sabat',route:'sabbath'};
          rememberItem(savedItem);
          $('#reader-title').textContent = 'Pelajaran ' + data.number + ' · ' + data.title;
          const activeIndex = Math.max(0,data.days.findIndex(day => day.isToday));
          const labels = data.days.map((day,index) => '<button class="chip ' + (day.isToday ? 'today-marker' : '') + '" type="button" data-day-jump="day-' + index + '">' + (day.isToday ? 'HARI INI · ' : '') + esc(day.dateLabel || day.title) + '</button>').join('');
          $('#reader-body').innerHTML = '<div class="v18-reader-tools"><div class="v18-reader-tools-main">'+favoriteButton(savedItem)+'<button class="btn primary present-button" type="button" data-present-sabbath>'+icon('external')+'Mode layar</button></div></div><span class="chip brand">PELAJARAN ' + esc(data.number) + '</span><h2 style="margin-top:20px">' + esc(data.title) + '</h2><p class="lead">' + esc(data.dateLabel) + '</p><div class="download-bar"><div><strong>Simpan untuk dibaca kapan saja</strong><span>Unduhan berupa halaman bacaan rapi yang dapat dibuka dan dicetak.</span></div><button class="btn primary" type="button" data-download-current-lesson>' + icon('download') + 'Unduh pelajaran</button></div><div class="day-labels" aria-label="Pilih hari bacaan">' + labels + '</div><div class="faq-list">' + data.days.map((day,index) => '<details class="faq lesson-day" id="day-' + index + '" ' + (index === activeIndex ? 'open' : '') + '><summary><span><small class="chip ' + (day.isToday ? 'today-marker' : '') + '">' + (day.isToday ? 'HARI INI' : day.isPast ? 'SUDAH DIBACA' : 'MENDATANG') + '</small><strong style="display:block;margin-top:10px">' + esc(day.dateLabel || '') + ' · ' + esc(day.title) + '</strong></span>' + icon('plus') + '</summary><div class="faq-answer reader-content">' + cleanHtml(day.bibleHtml) + cleanHtml(day.contentHtml) + '</div></details>').join('') + '</div><p class="small faint" style="margin-top:26px">Sumber materi: ' + esc(data.source) + '</p>';
        } catch (error) { $('#reader-body').innerHTML = errorBox(error.message); }
      }
      async function openResource(type, id) {
        if (!id) return toast('Isi lengkap materi ini belum tersedia. Tambahkan tautan pada sheet materi bila diperlukan.');
        openReader('Menyiapkan bacaan',loadingBox(type === 'mission' ? 'Membuka Berita Misi' : 'Membuka Bacaan Persembahan','Menyiapkan isi lengkap tanpa meninggalkan website…'));
        try {
          const key = 'v1700-resource-detail-' + type + '-' + id;
          const automaticMission=type==='mission'&&/^\d{1,2}-(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)-20\d{2}$/i.test(String(id));
          const data = automaticMission ? await fetchMissionDetail(id) : (cacheGet(key) || await server('getSabbathResourceDetail',[type,id]));
          cacheSet(key,data,21600000);
          state.async.currentResource = data;
          $('#reader-title').textContent = data.title;
          $('#reader-body').innerHTML = (automaticMission?missionReadingHtml(data):'<span class="chip brand">' + esc(data.dateLabel || '') + '</span><h2 style="margin-top:20px">' + esc(data.title) + '</h2>')+'<div class="download-bar"><div><strong>Unduh bacaan ini</strong><span>Simpan versi bacaan yang bersih untuk dibaca atau dicetak.</span></div><button class="btn primary" type="button" data-download-current-resource>' + icon('download') + 'Unduh bacaan</button></div>' + (automaticMission?'':resourceReadingHtml(data,type)) + '<p class="small faint" style="margin-top:22px">Sumber: ' + esc(data.source) + '</p>';
        } catch (error) { $('#reader-body').innerHTML = errorBox(error.message); }
      }

      function playYouTube(button) {
        const videoId = String(button && button.dataset.youtubePlay || '');
        if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return toast('Video belum tersedia.');
        let tile = button.closest('.media-tile');
        if (!tile) tile = document.querySelector('.media-tile [data-youtube-play="' + CSS.escape(videoId) + '"]')?.closest('.media-tile');
        if (!tile) return window.open('https://www.youtube.com/watch?v=' + videoId,'_blank','noopener');
        const cover = $('.media-cover',tile);
        if (!cover) return;
        const player = document.createElement('div');
        player.className = 'media-player';
        const watch='https://www.youtube.com/watch?v='+videoId,origin=location.origin&&location.origin!=='null'?'&origin='+encodeURIComponent(location.origin):'';
        player.innerHTML = '<iframe src="https://www.youtube.com/embed/' + attr(videoId) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1'+attr(origin)+'" title="' + attr(button.dataset.youtubeTitle || 'Video YouTube') + '" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><a class="media-player-fallback" href="'+attr(watch)+'" target="_blank" rel="noopener">YouTube'+icon('external')+'</a>';
        cover.replaceWith(player);
        tile.classList.add('is-playing');
      }

      async function shareText(title, text, url) {
        try {
          if (navigator.share) await navigator.share({title:title,text:text,url:url || location.href});
          else { await navigator.clipboard.writeText(text + '\n' + (url || location.href)); toast('Ringkasan sudah disalin.'); }
          track('share',{content_type:title});
        } catch (error) { if (error.name !== 'AbortError') toast('Belum dapat membagikan. Silakan salin tautan dari browser.'); }
      }
      function shareWhatsApp(text, url) {
        const targetUrl = String(url || location.href);
        const body = String(text || '');
        const message = body.indexOf(targetUrl) >= 0 ? body : body + '\n\n' + targetUrl;
        window.open('https://wa.me/?text=' + encodeURIComponent(message),'_blank','noopener');
        track('share',{method:'WhatsApp',content_type:'Jadwal Ibadah'});
      }
      function whatsappTemplate(category,title,meta,sections,note){
        const lines=['*GMAHK GALILEA BALIKPAPAN*','_'+String(category||'INFORMASI JEMAAT')+'_',''];
        if(title)lines.push('*'+String(title).trim()+'*');
        if(meta)lines.push(String(meta).trim());
        (Array.isArray(sections)?sections:[]).forEach(section=>{
          const content=(section&&Array.isArray(section.lines)?section.lines:[]).filter(Boolean);if(!content.length)return;
          lines.push('','*'+String(section.title||'Informasi')+'*');content.forEach(item=>lines.push(String(item)));
        });
        if(note)lines.push('',String(note).trim());
        lines.push('','_Dibagikan melalui Website Resmi GMAHK Galilea Balikpapan_');
        return lines.filter((line,index)=>line!==''||lines[index-1]!=='').join('\n').trim();
      }
      function htmlToShareText(html) {
        if (!html) return '';
        const prepared = cleanHtml(String(html))
          .replace(/<br\s*\/?\s*>/gi,'\n')
          .replace(/<li\b[^>]*>/gi,'• ')
          .replace(/<\/(p|div|section|article|h[1-6]|li|blockquote|ul|ol)>/gi,'\n\n');
        const box = document.createElement('div');
        box.innerHTML = prepared;
        return String(box.textContent || '')
          .replace(/\u00a0/g,' ')
          .replace(/[ \t]+\n/g,'\n')
          .replace(/\n{3,}/g,'\n\n')
          .replace(/[ \t]{2,}/g,' ')
          .trim();
      }
      function devotionalShareText(item) {
        if (!item) return whatsappTemplate('RENUNGAN PAGI','Renungan belum tersedia','','');
        const dateLabel = item.isArchive ? ('Materi terbaru: ' + (item.contentDateLabel || item.todayLabel || '')) : (item.todayLabel || '');
        const fullReading = htmlToShareText(item.contentHtml) || String(item.summary || '').trim();
        const sections=[];
        if(item.scripture)sections.push({title:'Ayat',lines:[item.scripture]});
        if(fullReading)sections.push({title:'Renungan',lines:[fullReading]});
        if(item.source)sections.push({title:'Sumber resmi',lines:[item.source]});
        return whatsappTemplate('RENUNGAN PAGI',item.title||'Renungan Pagi',dateLabel,sections);
      }
      function openDevotional(item) {
        if (!item || item.format !== 'text' || !String(item.contentHtml || '').trim()) {
          return toast('Teks Renungan Pagi dari sumber resmi sedang belum tersedia.');
        }
        const savedItem={type:'devotional',id:item.requestedDate||item.todayLabel,title:item.title||'Renungan Pagi',subtitle:item.todayLabel||'Sumber resmi Advent',route:'home'};
        rememberItem(savedItem);
        const shareBar = '<div class="download-bar devotional-share-bar"><div><span class="chip brand">' + esc(item.todayLabel) + '</span><strong>Renungan Pagi teks untuk dibagikan</strong><span>Sumber resmi Advent · Tanpa video</span></div><div class="button-row">'+favoriteButton(savedItem)+'<button class="btn whatsapp" type="button" data-whatsapp-devotional>' + brandIcon('whatsapp') + 'Bagikan ke WhatsApp</button></div></div>';
        return openReader(item.title,shareBar + '<div class="reader-content">' + cleanHtml(item.contentHtml) + '</div>');
      }
      function scheduleJson(card) {
        try { return JSON.parse($('.schedule-json',card).textContent); } catch (_) { return null; }
      }
      function scheduleText(payload) {
        if (!payload) return '';
        const record = payload.record;
        return [payload.sectionTitle,record.dateLabel + ' · ' + record.time.replace(':','.') + ' WITA'].concat(record.fields.map(field => field.label + ': ' + field.value)).join('\n');
      }
      function scheduleShareText(payload){
        if(!payload)return'';const record=payload.record||{},sections=[{title:'Pelayan',lines:(record.fields||[]).map(field=>'• '+field.label+': '+field.value)}];
        return whatsappTemplate(payload.sectionTitle||'JADWAL IBADAH',record.dateLabel||'Jadwal Ibadah',String(record.time||'').replace(':','.')+' WITA',sections);
      }
      function addCalendar(payload) {
        if (!payload) return;
        const record = payload.record;
        const start = record.isoDate.replace(/-/g,'') + 'T' + record.time.replace(':','') + '00';
        const date = new Date(record.timestamp||(record.isoDate+'T'+record.time+':00+08:00'));
        if(Number.isNaN(date.getTime()))return toast('Tanggal ibadah belum valid untuk kalender.');
        const endDate = new Date(date.getTime() + 2*3600000);
        const end = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Makassar',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(endDate).reduce((a,p)=>(a[p.type]=p.value,a),{});
        const endString = end.year + end.month + end.day + 'T' + end.hour + end.minute + end.second;
        const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(payload.sectionTitle + ' · GMAHK Galilea') + '&dates=' + start + '/' + endString + '&ctz=Asia%2FMakassar&details=' + encodeURIComponent(scheduleText(payload)) + '&location=' + encodeURIComponent(state.data.site.address || 'GMAHK Galilea Balikpapan');
        state.async.calendar={payload,start,endString,url};
        openReader('Tambah ke kalender','<div class="grid grid-2"><article class="card card-pad"><p class="eyebrow">Google Calendar</p><h3>Buka dan simpan di akun Google.</h3><button class="btn primary" type="button" data-calendar-google>'+icon('external')+'Buka Google Calendar</button></article><article class="card card-pad"><p class="eyebrow">Apple, Outlook & lainnya</p><h3>Unduh file kalender universal.</h3><button class="btn" type="button" data-calendar-ics>'+icon('download')+'Unduh .ics</button></article></div>');
      }
      function summaryCalendarPayload() {
        const source=state.data.nextSabbath;
        if(!source)return null;
        const record=source.record||source;
        if(!record.isoDate&&record.timestamp)record.isoDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Makassar',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(record.timestamp));
        record.fields=record.fields||(source.services||[]).flatMap(service=>service.fields||[]);
        return {sectionTitle:source.sectionTitle||source.title||'Ibadah Sabat',record};
      }
      function downloadCalendarIcs() {
        const item=state.async.calendar;if(!item)return;
        const payload=item.payload,record=payload.record,stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
        const escapeIcs=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
        const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GMAHK Galilea//Website V18//ID','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+escapeIcs(record.isoDate+'-'+record.time+'@gmahk-galilea.vercel.app'),'DTSTAMP:'+stamp,'DTSTART;TZID=Asia/Makassar:'+item.start,'DTEND;TZID=Asia/Makassar:'+item.endString,'SUMMARY:'+escapeIcs(payload.sectionTitle+' · GMAHK Galilea'),'DESCRIPTION:'+escapeIcs(scheduleText(payload)),'LOCATION:'+escapeIcs(state.data.site.address||'GMAHK Galilea Balikpapan'),'END:VEVENT','END:VCALENDAR'];
        const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Ibadah-Galilea-'+record.isoDate+'.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('File kalender berhasil diunduh.');
      }

      function downloadPoster(payload) {
        if (!payload) return;
        const canvas = document.createElement('canvas');
        canvas.width = 1080; canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0,0,1080,1350);
        gradient.addColorStop(0,'#0f2419'); gradient.addColorStop(.55,'#294637'); gradient.addColorStop(1,'#607860');
        ctx.fillStyle = gradient; ctx.fillRect(0,0,1080,1350);
        ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1;
        for (let x=0;x<=1080;x+=72) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1350);ctx.stroke(); }
        for (let y=0;y<=1350;y+=72) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1080,y);ctx.stroke(); }
        ctx.strokeStyle = 'rgba(229,209,151,.22)'; ctx.lineWidth = 2;
        [230,310,390].forEach(radius => { ctx.beginPath();ctx.arc(1040,70,radius,0,Math.PI*2);ctx.stroke(); });
        canvasRoundRect(ctx,62,54,956,94,26);
        ctx.fillStyle = 'rgba(255,255,255,.075)'; ctx.fill();
        ctx.fillStyle = '#e4cf98'; ctx.beginPath(); ctx.arc(104,101,10,0,Math.PI*2);ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = '700 25px Arial'; ctx.fillText('GMAHK GALILEA BALIKPAPAN',132,96);
        ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = '500 18px Arial'; ctx.fillText('Jadwal pelayanan jemaat',132,123);
        ctx.fillStyle = '#e4cf98'; ctx.font = '800 21px Arial'; ctx.fillText(String(payload.sectionTitle || 'IBADAH').toUpperCase(),64,218);
        ctx.fillStyle = '#ffffff'; ctx.font = '700 64px Arial';
        const afterDate = drawCanvasText(ctx,payload.record.dateLabel,64,302,900,72);
        canvasRoundRect(ctx,64,afterDate+35,235,58,29);
        ctx.fillStyle = '#e4cf98'; ctx.fill();
        ctx.fillStyle = '#16231a'; ctx.font = '800 24px Arial'; ctx.fillText(payload.record.time.replace(':','.') + ' WITA',93,afterDate+73);

        const panelY = afterDate + 128;
        const panelH = Math.min(720,1160-panelY);
        canvasRoundRect(ctx,62,panelY,956,panelH,34);
        ctx.fillStyle = 'rgba(8,22,14,.48)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.stroke();
        const fields = payload.record.fields.slice(0,8);
        const rows = Math.max(1,Math.ceil(fields.length/2));
        const rowHeight = (panelH-68)/rows;
        fields.forEach((field,index) => {
          const column = index % 2;
          const row = Math.floor(index/2);
          const x = 102 + column*472;
          const y = panelY + 58 + row*rowHeight;
          if (column === 1) { ctx.strokeStyle='rgba(255,255,255,.09)';ctx.beginPath();ctx.moveTo(540,y-24);ctx.lineTo(540,y+rowHeight-34);ctx.stroke(); }
          ctx.fillStyle = '#e4cf98'; ctx.font = '800 17px Arial'; ctx.fillText(String(field.label || '').toUpperCase(),x,y);
          ctx.fillStyle = '#ffffff'; ctx.font = '650 27px Arial'; drawCanvasText(ctx,field.value,x,y+38,390,33);
        });
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(64,1234); ctx.lineTo(1018,1234); ctx.stroke();
        ctx.fillStyle = '#e4cf98'; ctx.beginPath(); ctx.arc(75,1270,6,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.font = '650 20px Arial'; ctx.fillText('Periksa pembaruan terbaru melalui Website Gereja Galilea.',94,1277);
        ctx.fillStyle = 'rgba(255,255,255,.46)'; ctx.font = '500 16px Arial'; ctx.fillText('Diunduh melalui Website Gereja Galilea · © Sekretaris Galilea 2026',64,1314);
        ctx.fillStyle = '#e4cf98'; ctx.font = '800 16px Arial'; ctx.textAlign = 'right'; ctx.fillText('BERIBADAH · BERTUMBUH · MELAYANI',1018,1314); ctx.textAlign = 'left';
        const link = document.createElement('a');
        link.download = 'Jadwal-Galilea-' + payload.record.isoDate + '.png';
        link.href = canvas.toDataURL('image/png'); link.click();
        track('download_poster',{schedule_type:payload.sectionTitle});
      }
      function canvasRoundRect(ctx,x,y,width,height,radius) {
        const r = Math.min(radius,width/2,height/2);
        ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+width,y,x+width,y+height,r);ctx.arcTo(x+width,y+height,x,y+height,r);ctx.arcTo(x,y+height,x,y,r);ctx.arcTo(x,y,x+width,y,r);ctx.closePath();
      }
      function drawCanvasText(ctx,text,x,y,maxWidth,lineHeight) {
        const words = String(text || '').split(' '); let line = '', cursor = y;
        words.forEach(word => { const test = line ? line + ' ' + word : word; if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line,x,cursor); line=word; cursor+=lineHeight; } else line=test; });
        if (line) ctx.fillText(line,x,cursor); return cursor;
      }

      function downloadMemberSchedulePoster() {
        const payload=state.async.memberSchedule;
        if(!payload||!payload.results||!payload.results.length) return toast('Cari nama terlebih dahulu.');
        const items=payload.results, width=1080, rowHeight=155, height=390+items.length*rowHeight;
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,width,height);
        gradient.addColorStop(0,'#07150d');gradient.addColorStop(.52,'#1c3d29');gradient.addColorStop(1,'#698169');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
        ctx.strokeStyle='rgba(255,255,255,.05)';for(let x=0;x<width;x+=72){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke()}
        ctx.fillStyle='#dfc68d';ctx.font='800 22px Arial';ctx.fillText('JADWAL PELAYANAN PRIBADI',64,72);
        ctx.fillStyle='#fff';ctx.font='750 64px Arial';drawCanvasText(ctx,payload.query,64,158,900,70);
        ctx.fillStyle='rgba(255,255,255,.65)';ctx.font='500 21px Arial';ctx.fillText(payload.count+' pelayanan ditemukan · '+payload.updatedAt,64,244);
        items.forEach((item,index)=>{const y=300+index*rowHeight;canvasRoundRect(ctx,58,y,964,rowHeight-18,24);ctx.fillStyle='rgba(5,20,12,.44)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.12)';ctx.stroke();ctx.fillStyle='#dfc68d';ctx.font='800 17px Arial';ctx.fillText(String(item.sectionTitle).toUpperCase(),88,y+40);ctx.fillStyle='#fff';ctx.font='700 29px Arial';ctx.fillText(item.dateLabel,88,y+78);ctx.fillStyle='rgba(255,255,255,.72)';ctx.font='600 19px Arial';ctx.fillText(String(item.time).replace(':','.')+' WITA',88,y+110);const roles=(item.roles||[]).map(role=>role.label+': '+role.value).join(' · ');ctx.font='600 19px Arial';drawCanvasText(ctx,roles,470,y+52,500,26)});
        ctx.fillStyle='rgba(255,255,255,.54)';ctx.font='500 16px Arial';ctx.fillText('Diunduh melalui Website Gereja Galilea · © Sekretaris Galilea 2026',64,height-30);
        const link=document.createElement('a');link.download='Jadwal-'+safeFileName(payload.query)+'-Galilea.png';link.href=canvas.toDataURL('image/png');link.click();
      }

      async function downloadQuarterlySchedule() {
        const button=$('[data-download-quarterly]'); if(button) button.disabled=true;
        toast('Menyusun tabel PDF triwulan…');
        try {
          const response=await fetch('/api/quarterly-pdf',{method:'GET',headers:{Accept:'application/pdf'},cache:'no-store'});
          if(!response.ok){let message='PDF belum dapat dibuat.';try{const payload=await response.json();message=payload.error||message}catch(ignore){}throw new Error(message)}
          const blob=await response.blob();
          const disposition=response.headers.get('content-disposition')||'';
          const match=disposition.match(/filename="?([^";]+)"?/i);
          const url=URL.createObjectURL(blob);
          const link=document.createElement('a');link.href=url;link.download=match?match[1]:'Jadwal-Ibadah-Galilea.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
          toast('PDF triwulan berhasil diunduh.');
        } catch(error){toast(error.message);} finally{if(button)button.disabled=false;}
      }

      function bulletinShareText() {
        const data=state.data,sections=[];
        [data.nextSabbath,data.nextWednesday].filter(Boolean).forEach(item=>sections.push({title:item.title||item.sectionTitle||'Ibadah',lines:[(item.dateLabel||'')+' · '+(item.time||'')].concat((item.fields||(item.services||[]).flatMap(service=>service.fields||[])).map(field=>'• '+field.label+': '+field.value))}));
        const announcements=(data.announcements||[]).filter(item=>item.includeInBulletin!==false).slice(0,8);
        if(announcements.length)sections.push({title:'Agenda dan Pengumuman',lines:announcements.map(item=>'• '+item.title+(item.summary?' — '+item.summary:''))});
        return whatsappTemplate('WARTA JEMAAT DIGITAL','Informasi Mingguan',data.updatedAt||'',sections);
      }
      function htmlToWaText(html) {
        if (!html) return '';
        if (!/<[a-z][\s\S]*>/i.test(html)) return String(html).trim();
        const div = document.createElement('div');
        div.innerHTML = String(html);

        function traverse(node) {
          if (node.nodeType === 3) {
            return node.nodeValue.replace(/\s+/g, ' ');
          }
          if (node.nodeType !== 1) return '';

          const tag = node.nodeName.toUpperCase();
          if (tag === 'BR') return '\n';

          const children = Array.prototype.slice.call(node.childNodes);
          let text = '';

          if (tag === 'UL') {
            for (let i = 0; i < children.length; i++) {
              if (children[i].nodeType === 1 && children[i].nodeName.toUpperCase() === 'LI') {
                text += '- ' + traverse(children[i]).trim() + '\n';
              }
            }
            return text + '\n';
          }
          if (tag === 'OL') {
            let count = 1;
            for (let i = 0; i < children.length; i++) {
              if (children[i].nodeType === 1 && children[i].nodeName.toUpperCase() === 'LI') {
                text += (count++) + '. ' + traverse(children[i]).trim() + '\n';
              }
            }
            return text + '\n';
          }

          for (let i = 0; i < children.length; i++) {
            text += traverse(children[i]);
          }

          if (tag === 'STRONG' || tag === 'B') return '*' + text.trim() + '*';
          if (tag === 'EM' || tag === 'I') return '_' + text.trim() + '_';
          if (tag === 'P' || tag === 'DIV') return text.trim() + '\n\n';
          if (tag === 'A') {
            const href = node.getAttribute('href') || '';
            if (href && href !== text.trim()) return text.trim() + ' (' + href + ')';
            return text.trim();
          }

          return text;
        }

        let text = traverse(div);
        text = text.replace(/<\/?[a-z][\s\S]*?>/gi, '');
        text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, '');
        text = text.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
        return text.replace(/\n{3,}/g, '\n\n').trim();
      }

      function activityShareText(item){
        const lines = ['*BERITA JEMAAT*','','*' + String(item.title||'').trim() + '*'];
        if(item.dateLabel) lines.push(String(item.dateLabel).trim());
        if(item.location) lines.push(String(item.location).trim());

        let text = lines.join('\n');
        if(item.description) {
          const body = htmlToWaText(item.description);
          if (body) text += '\n\n' + body;
        }
        return text;
      }
      function announcementShareText(item){
        const meta=announcementGroupMeta(announcementCategory(item));
        return whatsappTemplate('AGENDA DAN PENGUMUMAN · '+meta.label,item.title,(item.dateLabel||'')+(item.priority&&item.priority!=='NORMAL'?' · '+item.priority:''),[{title:'Informasi',lines:[item.summary||'']}]);
      }
      async function downloadBulletinPdf() {
        const button=$('[data-download-bulletin]');if(button)button.disabled=true;toast('Menyusun Warta Digital…');
        try{const response=await fetch('/api/weekly-bulletin',{headers:{Accept:'application/pdf'},cache:'no-store'});if(!response.ok){let message='PDF Warta belum dapat dibuat.';try{const body=await response.json();message=body.error||message}catch(_){}throw new Error(message)}const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Warta-Jemaat-Galilea.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Warta PDF berhasil diunduh.');}catch(error){toast(error.message);}finally{if(button)button.disabled=false;}
      }

      function normalizeSearch(value) {
        return activityExcerptText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
      }

      function localSearchResults(query) {
        const data = state.data;
        const results = [];
        const words = normalizeSearch(query).split(' ').filter(Boolean);
        const add = (kind,title,excerpt,route,action,id,keywords) => {
          const text = normalizeSearch([title,excerpt,keywords].join(' '));
          if (!words.every(word => text.includes(word))) return;
          results.push({kind,title,excerpt:activityExcerptText(excerpt).slice(0,150),route,action:action || '',id:id || ''});
        };
        MOBILE_GROUPS.forEach(group => group.items.forEach(item => add('Halaman',item[2],item[3],item[0])));
        if (!data) return results;
        (data.activities || []).forEach(item => add('Berita Jemaat',item.title,item.description,'activities','',item.id,item.location+' '+item.dateLabel));
        (data.announcements || []).forEach(item => add('Agenda dan Pengumuman',item.title,item.summary,'announcements','',item.id,item.dateLabel));
        (data.leaders || []).forEach(item => add('Pengurus',item.name,item.role+' '+(item.description || ''),'leaders'));
        (data.sections || []).forEach(section => (section.records || []).forEach(record => add('Jadwal',section.title+' · '+record.dateLabel,(record.fields || []).map(field => field.label+' '+field.value).join(' '),'schedule',section.id,record.isoDate)));
        (data.faq || []).forEach(item => add('FAQ',item.question,item.answer,'faq',item.question));
        if (data.themeSong) add('Lagu Tema',data.themeSong.title,'Lagu tema jemaat','hymnal','theme');
        (hymnalPack?.songs || state.hymnal?.songs || []).forEach(song => add('Lagu Sion','No. '+song.number+' · '+song.title,'Buka lirik Lagu Sion','hymnal',String(song.number),'',song.index));
        return results;
      }

      function mergeSearchResults(local, remote) {
        const merged = local.slice();
        (remote || []).forEach(item => {
          if (!ROUTES.includes(item.route)) return;
          const match = merged.find(entry => entry.route === item.route && normalizeSearch(entry.title) === normalizeSearch(item.title));
          if (match) return;
          // API lama belum menyertakan ID berita dan pengumuman.
          const collection = item.route === 'activities' ? state.data?.activities : item.route === 'announcements' ? state.data?.announcements : [];
          const target = (collection || []).find(entry => normalizeSearch(entry.title) === normalizeSearch(item.title));
          merged.push(Object.assign({},item,{id:target?.id || item.id || ''}));
        });
        return merged.slice(0,48);
      }

      function searchResultsHtml(items, note) {
        const status = '<p class="search-status" role="status">'+esc(note || (items.length+' hasil ditemukan'))+'</p>';
        return status + (items.length ? items.map(item => '<button class="search-result" type="button" data-search-route="'+attr(item.route)+'" data-search-action="'+attr(item.action)+'" data-search-id="'+attr(item.id)+'"><span class="chip">'+esc(item.kind)+'</span><span><strong>'+esc(item.title)+'</strong><small>'+esc(item.excerpt)+'</small></span>'+icon('chevron')+'</button>').join('') : emptyText('Belum ada hasil yang cocok. Coba nama, judul, atau kata yang lebih singkat.'));
      }

      async function performSearch(event) {
        event.preventDefault();
        const query = $('#search-input').value.trim();
        const token = ++state.searchToken;
        if (query.length < 2) return;
        const box = $('#search-results');
        const local = localSearchResults(query);
        box.innerHTML = local.length ? searchResultsHtml(local,'Hasil dari data yang sudah tersedia. Memeriksa bacaan lainnya…') : loadingBox('Mencari informasi','Memeriksa jadwal, berita, dan materi ibadah…');
        if (navigator.onLine === false) {
          box.innerHTML = searchResultsHtml(local,'Mode offline. Hasil berasal dari data tersimpan.');
          return;
        }
        try {
          const data = await server('searchWebsite',[query]);
          if (token !== state.searchToken) return;
          box.innerHTML = searchResultsHtml(mergeSearchResults(local,data.results));
          track('search',{search_term:query});
        } catch (error) {
          if (token !== state.searchToken) return;
          box.innerHTML = local.length ? searchResultsHtml(local,'Hasil dari data tersimpan. Pencarian tambahan belum terhubung.') : errorBox(error.message);
        }
      }

      async function openSearchResult(button) {
        const route = button.dataset.searchRoute;
        const action = button.dataset.searchAction;
        const id = button.dataset.searchId;
        ++state.searchToken;
        $('#search-dialog').close();
        if (route === 'schedule' && action) { state.scheduleTab = action; state.scheduleFilter = 'all'; }
        if (route === 'faq' && action) { state.faqQuery = action; state.faqCategory = 'Semua'; }
        await navigate(route);
        if (state.route !== route) return;
        if (route === 'activities' && id) return openActivity(id);
        if (route === 'announcements' && id) return openAnnouncement(id);
        if (route === 'hymnal' && action) return action === 'theme' ? openThemeSong() : openSong(action);
        if (route === 'sabbath' && action) return openLesson(action);
        if (route === 'schedule' && id) {
          const card = $$('.schedule-card').find(node => node.textContent.includes(id) || node.dataset.scheduleJson?.includes(id));
          card?.scrollIntoView({block:'center',behavior:'smooth'});
        }
      }

      function openInstallHelp() {
        if (state.deferredInstall) {
          state.deferredInstall.prompt();
          state.deferredInstall.userChoice.finally(() => { state.deferredInstall = null; });
          return;
        }
        openReader('Simpan di layar utama','<p class="lead">Simpan website agar lebih cepat dibuka.</p><div class="grid grid-2"><article class="card card-pad"><h3>Android · Chrome</h3><p class="muted">Buka menu browser <strong>⋮</strong>, lalu pilih <strong>Tambahkan ke layar utama</strong> atau <strong>Instal aplikasi</strong>.</p></article><article class="card card-pad"><h3>iPhone · Safari</h3><p class="muted">Tekan tombol <strong>Bagikan</strong>, lalu pilih <strong>Tambahkan ke Layar Utama</strong>.</p></article></div>');
      }
      function updateNetworkStatus(){const box=$('#network-status');if(box)box.classList.toggle('show',navigator.onLine===false);updatePresentationNetworkStatus();}

      function handleClick(event) {
        const screenPalette=event.target.closest('[data-screen-palette]');
        if(screenPalette){applyPalette(screenPalette.dataset.screenPalette,true);$('#presentation-palette-menu').hidePopover();$('#presentation-palette').focus({preventScroll:true});showPresentationControls(true);return;}
        if (event.target.closest('[data-present-welcome]')) return openWelcomePresentation();
        const paletteButton = event.target.closest('[data-palette-value]');
        if (paletteButton) return applyPalette(paletteButton.dataset.paletteValue,true);
        if (event.target.closest('[data-reset-palette]')) return applyPalette('green',true);
        const navToggle = event.target.closest('[data-nav-toggle]');
        if (navToggle) {
          const drop = navToggle.closest('.nav-drop');
          const shouldOpen = !drop.classList.contains('open');
          $$('.nav-drop.open').forEach(item=>{item.classList.remove('open');item.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded','false');});
          drop.classList.toggle('open',shouldOpen);
          navToggle.setAttribute('aria-expanded',String(shouldOpen));
          return;
        }
        if (!event.target.closest('.nav-drop')) $$('.nav-drop.open').forEach(item=>{item.classList.remove('open');item.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded','false');});
        if(event.target.closest('[data-retry-hymnal-cache]'))return ensureHymnalPack(true).catch(()=>{});
        const youtube = event.target.closest('[data-youtube-play]');
        if (youtube) return playYouTube(youtube);
        const routeButton = event.target.closest('[data-route]');
        if (routeButton) return navigate(routeButton.dataset.route,{action:routeButton.dataset.action});
        const openButton = event.target.closest('[data-open]');
        if (openButton) {
          const dialog = $('#' + openButton.dataset.open + '-dialog');
          if (dialog) { dialog.showModal(); if (openButton.dataset.open === 'search') setTimeout(() => $('#search-input').focus(),40); }
          closeMobile(); return;
        }
        const closeButton = event.target.closest('[data-close]');
        if (closeButton) return closeButton.closest('dialog').close();
        const activityButton=event.target.closest('[data-open-activity]');
        if(activityButton)return openActivity(activityButton.dataset.openActivity);
        const announcementButton=event.target.closest('[data-open-announcement]');
        if(announcementButton)return openAnnouncement(announcementButton.dataset.openAnnouncement);
        const storyPhoto=event.target.closest('[data-story-photo]');
        if(storyPhoto){const image=$('#photo-dialog-image');image.src=storyPhoto.dataset.storyPhoto;$('#photo-dialog').showModal();return;}
        const activityShare=event.target.closest('[data-share-activity]');
        if(activityShare){const item=(state.data.activities||[]).find(activity=>String(activity.id)===String(activityShare.dataset.shareActivity));if(item)return shareWhatsApp(activityShareText(item),location.origin+'/berita/'+encodeURIComponent(item.id));}
        const mediaShare=event.target.closest('[data-share-media]');
        if(mediaShare)return shareText(mediaShare.dataset.mediaTitle||'Media Berita Jemaat','Dokumentasi GMAHK Galilea Balikpapan',mediaShare.dataset.mediaUrl||location.href);
        const journalNav=event.target.closest('[data-journal-nav]');
        if(journalNav)return shiftJournalDeck(journalNav.closest('.journal-deck'),Number(journalNav.dataset.journalNav));
        const announcementPresentation=event.target.closest('[data-present-announcements]');
        if(announcementPresentation)return openAnnouncementPresentation(announcementPresentation.dataset.presentAnnouncements);
        if(event.target.closest('[data-present-schedule-summary]'))return openScheduleSummaryPresentation();
        if(event.target.closest('[data-start-worship-operator]'))return openWorshipOperator();
        if(event.target.closest('[data-prepare-worship-offline]'))return prepareWorshipOffline();
        if(event.target.closest('[data-open-screen-check]'))return openScreenCheck();
        const announcementShare=event.target.closest('[data-share-announcement]');
        if(announcementShare){const item=(state.data.announcements||[]).find(entry=>String(entry.id)===String(announcementShare.dataset.shareAnnouncement));if(item)return shareWhatsApp(announcementShareText(item),location.href.split('#')[0]+'#announcements');}
        const favorite=event.target.closest('[data-favorite-item]');if(favorite){try{return toggleFavorite(JSON.parse(favorite.dataset.favoriteItem));}catch(_){return toast('Item belum dapat disimpan.');}}
        const saved=event.target.closest('[data-open-saved]');if(saved){const item=state.favorites.concat(state.recents).find(entry=>entry.key===saved.dataset.openSaved);if(!item)return;if(item.type==='hymnal'){navigate('hymnal');return setTimeout(()=>openSong(item.id),350);}if(item.type==='bible'){const parts=item.id.split('-');navigate('bible');return setTimeout(()=>{if($('#bible-book')){$('#bible-book').value=parts[0];fillBibleChapters();$('#bible-chapter').value=parts[1]||'1';openBibleChapter();}},500);}return navigate(item.route||'home');}
        const scheduleTab = event.target.closest('[data-schedule-tab]');
        if (scheduleTab) { state.scheduleTab = scheduleTab.dataset.scheduleTab; render(); return; }
        const scheduleFilter = event.target.closest('[data-schedule-filter]');
        if (scheduleFilter) { state.scheduleFilter = scheduleFilter.dataset.scheduleFilter; render(); return; }
        const sabbathTab = event.target.closest('[data-sabbath-tab]');
        if (sabbathTab) { state.sabbathTab = sabbathTab.dataset.sabbathTab; render(); return; }
        const faqCategory = event.target.closest('[data-faq-category]');
        if (faqCategory) { state.faqCategory=faqCategory.dataset.faqCategory; render(); return; }
        const lesson = event.target.closest('[data-lesson-id]');
        if (lesson) return openLesson(lesson.dataset.lessonId);
        const lessonDownload = event.target.closest('[data-download-lesson-id]');
        if (lessonDownload) return downloadLessonById(lessonDownload.dataset.downloadLessonId);
        if (event.target.closest('[data-download-current-lesson]') && state.async.currentLesson) return downloadLessonData(state.async.currentLesson);
        const featuredDownload=event.target.closest('[data-download-featured-resource]');if(featuredDownload)return downloadFeaturedResource(featuredDownload);
        if (event.target.closest('[data-download-current-resource]') && state.async.currentResource) return downloadResourceData(state.async.currentResource);
        const resource = event.target.closest('[data-resource-id]');
        if (resource) return openResource(resource.dataset.resourceType,resource.dataset.resourceId);
        const dayJump = event.target.closest('[data-day-jump]');
        if (dayJump) {
          const target = document.getElementById(dayJump.dataset.dayJump);
          if (target) { target.open = true; target.scrollIntoView({behavior:document.documentElement.dataset.motion === 'reduced' ? 'auto' : 'smooth',block:'start'}); }
          return;
        }
        const song = event.target.closest('[data-song]');
        if (song) return openSong(song.dataset.song);
        if (event.target.closest('[data-theme-song]')) return openThemeSong();
        if (event.target.closest('[data-present-bible]')) return openPresentation('bible');
        if (event.target.closest('[data-present-sabbath]')) return openSabbathPresentation();
        if (event.target.closest('[data-present-song]')) return openPresentation('song');
        if (event.target.closest('[data-presentation-prev]')) return movePresentation(-1);
        if (event.target.closest('[data-presentation-next]')) return movePresentation(1);
        if (event.target.closest('[data-presentation-smaller]')) return resizePresentation(-.1);
        if (event.target.closest('[data-presentation-larger]')) return resizePresentation(.1);
        if (event.target.closest('[data-presentation-theme]')) return togglePresentationTheme();
        if (event.target.closest('[data-presentation-projector]')) return togglePresentationProjector();
        if (event.target.closest('[data-presentation-close]')) return closePresentation();
        const testament = event.target.closest('[data-bible-testament]');
        if (testament) return selectBibleTestament(testament.dataset.bibleTestament);
        if (event.target.closest('[data-download-bible-book]')) return downloadBibleBook();
        const archive = event.target.closest('[data-download-archive]');
        if (archive) return downloadArchive(archive.dataset.downloadArchive);
        if (event.target.closest('[data-song-prev]')) { state.hymnalReader.verseIndex--; return renderSongReader(); }
        if (event.target.closest('[data-song-next]')) { state.hymnalReader.verseIndex++; return renderSongReader(); }
        const songSizeBtn = event.target.closest('[data-song-size]');
        if (songSizeBtn) {
          const sz = songSizeBtn.dataset.songSize;
          if (['small','normal','large'].includes(sz)) {
            safeStorage.set('galilea:song-font-size', sz);
            return renderSongReader();
          }
        }
        const searchResult = event.target.closest('[data-search-route]');
        if (searchResult) return openSearchResult(searchResult);
        if (event.target.closest('[data-share-summary]')) return shareText('Jadwal Ibadah Galilea',scheduleSummaryText(),location.href.split('#')[0] + '#schedule');
        if (event.target.closest('[data-whatsapp-summary]')) return shareWhatsApp(scheduleSummaryText(),location.href.split('#')[0] + '#schedule');
        const card = event.target.closest('[data-schedule-card]');
        if (card && event.target.closest('[data-share-card]')) return shareText('Jadwal Ibadah Galilea',scheduleShareText(scheduleJson(card)),location.href.split('#')[0] + '#schedule');
        if (card && event.target.closest('[data-whatsapp-card]')) return shareWhatsApp(scheduleShareText(scheduleJson(card)),location.href.split('#')[0] + '#schedule');
        if (card && event.target.closest('[data-calendar]')) return addCalendar(scheduleJson(card));
        if (event.target.closest('[data-calendar-summary]')) {const payload=summaryCalendarPayload();return payload?addCalendar(payload):toast('Jadwal terdekat belum tersedia.');}
        if (event.target.closest('[data-calendar-google]')&&state.async.calendar)return window.open(state.async.calendar.url,'_blank','noopener');
        if (event.target.closest('[data-calendar-ics]'))return downloadCalendarIcs();
        if (card && event.target.closest('[data-poster]')) return downloadPoster(scheduleJson(card));
        if (event.target.closest('[data-download-member-schedule]')) return downloadMemberSchedulePoster();
        if (event.target.closest('[data-download-quarterly]')) return downloadQuarterlySchedule();
        if (event.target.closest('[data-share-today]')) return shareWhatsApp(worshipPlanText(selectedWorshipPlan()),location.href.split('#')[0]+'#today');
        if (event.target.closest('[data-calendar-today]')) {const payload=todayCalendarPayload();return payload?addCalendar(payload):toast('Susunan ibadah belum tersedia.');}
        if (event.target.closest('[data-share-bulletin]')) return shareWhatsApp(bulletinShareText(),location.href.split('#')[0]+'#bulletin');
        if (event.target.closest('[data-download-bulletin]')) return downloadBulletinPdf();
        if (event.target.closest('[data-whatsapp-devotional]') && state.async.devotional) return shareWhatsApp(devotionalShareText(state.async.devotional),location.href.split('#')[0] + '#home');
        if (event.target.closest('[data-read-devotional]') && state.async.devotional) return openDevotional(state.async.devotional);
        if (event.target.closest('[data-read-personal]') && state.async.personal) return openReader(state.async.personal.title,'<div class="reader-content">' + state.async.personal.contentHtml + '</div>');
      }

      document.addEventListener('change',event=>{
        if(event.target.id!=='presentation-sabbath-day'||state.presentation?.type!=='sabbath')return;
        const view=state.presentation,day=Number(event.target.value);
        const index=view.item.pages.findIndex(page=>page.dayIndex===day);
        if(index<0)return;
        view.index=index;renderPresentation();fitPresentationText();
        announcePresentation(day<0?'Pembuka':view.item.lesson.days[day].title);
      });

      document.addEventListener('keydown',event=>{
        const dialog=$('#presentation-dialog');if(!dialog||!dialog.open)return;
        presentationKeyboardControls=true;
        if(event.key==='Escape' && $('#presentation-palette-menu')?.matches(':popover-open')){event.preventDefault();event.stopImmediatePropagation();$('#presentation-palette-menu').hidePopover();$('#presentation-palette').focus({preventScroll:true});showPresentationControls(true);return;}
        showPresentationControls(true);
        if(event.target.closest?.('select,input,textarea,button') && event.key!=='Escape')return;
        if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();movePresentation(-1);}
        else if(event.key==='ArrowRight'||event.key==='PageDown'||event.key===' '){event.preventDefault();movePresentation(event.shiftKey?-1:1);}
        else if(event.key==='+'||event.key==='='){event.preventDefault();resizePresentation(.1);}
        else if(event.key==='-'||event.key==='_'){event.preventDefault();resizePresentation(-.1);}
        else if(event.key.toLowerCase()==='t'){event.preventDefault();togglePresentationTheme();}
        else if(event.key.toLowerCase()==='p'){event.preventDefault();togglePresentationProjector();}
        else if(event.key==='Escape'){event.preventDefault();closePresentation();}
      });

      // Keep the three-hour offline copy; check a small revision response in the background.
      let websiteSyncPromise=null,websiteSyncLastAttempt=0;
      function websiteUpdateIsBusy() {
        return Boolean(document.querySelector('dialog[open]') || state.route==='services' || document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]'));
      }
      function applyWebsiteUpdate() {
        if(!state.pendingWebsiteData || websiteUpdateIsBusy())return;
        state.data=state.pendingWebsiteData;state.pendingWebsiteData=null;
        setShellData();render();
      }
      async function checkWebsiteUpdates(force) {
        if(!state.data || navigator.onLine===false || document.visibilityState==='hidden')return;
        if(websiteSyncPromise)return websiteSyncPromise;
        if(!force && Date.now()-websiteSyncLastAttempt<60000)return;
        websiteSyncLastAttempt=Date.now();
        websiteSyncPromise=(async()=>{
          const revision=await server('getWebsiteData',[{revisionOnly:true}],60000);
          const current=state.pendingWebsiteData||state.data;
          const fullResponse=revision&&revision.site;
          if(!fullResponse && revision && revision.cacheRevision===current.cacheRevision && revision.dayKey===current.dayKey)return;
          const fresh=fullResponse?revision:await server('getWebsiteData',[],60000);
          if(!fresh||!fresh.site||!Array.isArray(fresh.activities))throw new Error('Data pembaruan belum lengkap.');
          cacheSet('v1800-bootstrap',fresh,WORSHIP_CACHE_TTL);
          state.pendingWebsiteData=fresh;
          if(document.querySelector('dialog[open]')){
            toast('Konten terbaru sudah diterima. Tampilan diperbarui setelah layar bacaan ditutup.');
          }else applyWebsiteUpdate();
        })().catch(()=>{
          // Preserve the known-good copy and retry on the next online/visible interval.
        }).finally(()=>{websiteSyncPromise=null;});
        return websiteSyncPromise;
      }
      function startWebsiteSync() {
        if(state.websiteSyncTimer)return;
        checkScheduleClock();
        state.scheduleClockTimer=window.setInterval(checkScheduleClock,60000);
        window.addEventListener('focus',checkScheduleClock);
        checkWebsiteUpdates(false);
        state.websiteSyncTimer=window.setInterval(()=>{applyWebsiteUpdate();checkWebsiteUpdates(false);},120000);
        window.addEventListener('online',()=>checkWebsiteUpdates(true));
        document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkScheduleClock();checkWebsiteUpdates(false);}});
        document.addEventListener('close',()=>applyWebsiteUpdate(),true);
      }

      function checkScheduleClock() {
        if(!state.data||!window.GalileaScheduleClock)return;
        const changed=window.GalileaScheduleClock.refresh(state.data);
        if(changed)state.scheduleClockPending=true;
        if(!state.scheduleClockPending||document.visibilityState==='hidden'||websiteUpdateIsBusy())return;
        state.scheduleClockPending=false;
        if(['home','today','schedule','bulletin'].includes(state.route))render();
      }

      async function boot() {
        try {
          ensureHymnalPack().catch(()=>{});
          initPreferences(); buildMobileNav();
          document.querySelectorAll('.icon-button[data-close]').forEach(button => { if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label','Tutup jendela'); });
          state.favorites=readStoredList('galilea:favorites');state.recents=readStoredList('galilea:recents');
          if ($('#language-select')) $('#language-select').value = VIEWER_LANGUAGES.includes(state.language) ? state.language : 'id';
          if ($('#language-settings')) $('#language-settings').value = VIEWER_LANGUAGES.includes(state.language) ? state.language : 'id';
          state.witaDayKey = witaDateKey();
          startDayRolloverWatcher();
          const initialRoute = location.hash.replace('#','');
          const beritaMatch = initialRoute.match(/^berita\/(.+)$/);
          if (beritaMatch) {
            state.route = 'activities';
            state._pendingBeritaId = decodeURIComponent(beritaMatch[1]);
          } else {
            state.route = ROUTES.includes(initialRoute) ? initialRoute : 'home';
          }
          history.replaceState({route:state.route},'','#' + (beritaMatch ? 'berita/' + beritaMatch[1] : state.route));
          const freshCache = cacheGet('v1800-bootstrap') || cacheGet('v1700-bootstrap');
          const cached = freshCache || cachePeek('v1800-bootstrap') || cachePeek('v1700-bootstrap');
          if (cached) { state.data = cached; setShellData(); render(); releaseStartupLoader(); }
          if (!freshCache && !(cached && navigator.onLine===false)) {
            const fresh = await server('getWebsiteData',[],60000);
            state.data = fresh; cacheSet('v1800-bootstrap',fresh,WORSHIP_CACHE_TTL); setShellData();
            if(!document.querySelector('dialog[open]'))render();
          }
          if (!state.translationObserver) {
            state.translationObserver = new MutationObserver(() => scheduleTranslation(260));
            state.translationObserver.observe(document.body,{subtree:true,childList:true});
          }
          setLanguage(state.language);
          if (state._pendingBeritaId) { openActivity(state._pendingBeritaId); delete state._pendingBeritaId; }
        } catch (error) {
          if (!state.data) {
            $('#app').innerHTML = startupFailureHtml(error);
          } else toast('Data terbaru belum terhubung. Menampilkan data terakhir yang tersimpan.');
        } finally {
          if (state.data && !state.translationObserver) {
            state.translationObserver = new MutationObserver(() => scheduleTranslation(260));
            state.translationObserver.observe(document.body,{subtree:true,childList:true});
            setLanguage(state.language);
          }
          clearTimeout(startupGuard);
          releaseStartupLoader();
          if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
          updateNetworkStatus();
          if(state.data)startWebsiteSync();
        }
      }

      function startDayRolloverWatcher() {
        if (state.dayWatcher) return;
        state.dayWatcher = window.setInterval(async () => {
          const currentKey = witaDateKey();
          if (currentKey === state.witaDayKey) return;
          const previousKey = state.witaDayKey;
          state.witaDayKey = currentKey;
          const witaNow=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Makassar'}));
          state.sabbathYear=witaNow.getFullYear();state.sabbathQuarter=Math.floor(witaNow.getMonth()/3)+1;
          cacheRemove('v11-devotional-today');
          cacheRemove('v1101-devotional-' + previousKey);
          cacheRemove('v1110-devotional-' + previousKey);
          cacheRemove('v12-devotional-' + previousKey);
          cacheRemove('v1300-devotional-' + previousKey);
          cacheRemove('v1400-devotional-' + previousKey);
          cacheRemove('v1401-devotional-' + previousKey);
          cacheRemove('v1500-devotional-' + previousKey);
          cacheRemove('v1700-devotional-' + previousKey);
          cacheRemove('v12-bootstrap');
          cacheRemove('v1300-bootstrap');
          cacheRemove('v1400-bootstrap');
          cacheRemove('v1401-bootstrap');
          cacheRemove('v1500-bootstrap');
          cacheRemove('v1700-bootstrap');
          // Date-bound content must roll over even while the three-hour copy is fresh.
          if(state.data){checkWebsiteUpdates(true);if(state.route==='home')loadDevotionalHome(true);return;}
          try {
            const fresh = await server('getWebsiteData',[]);
            state.data = fresh;
            cacheSet('v1800-bootstrap',fresh,WORSHIP_CACHE_TTL);
            setShellData();
            if(!document.querySelector('dialog[open]'))render();
            toast('Konten hari ini sudah diperbarui otomatis.');
          } catch (_) {
            if ($('#home-devotional')) {
              $('#home-devotional').innerHTML = loadingBox('Memperbarui renungan pagi','Menyesuaikan bacaan dengan tanggal WITA hari ini…');
              loadDevotionalHome(true);
            }
          }
        },60000);
      }

      let touchStartX = 0;
      let touchEndX = 0;
      document.addEventListener('touchstart', e => {
        if (!e.target.closest('.journal-deck')) return;
        touchStartX = e.changedTouches[0].screenX;
      }, {passive: true});
      document.addEventListener('touchend', e => {
        const wrap = e.target.closest('.journal-deck');
        if (!wrap) return;
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) shiftJournalDeck(wrap,1);
        if (touchEndX > touchStartX + 50) shiftJournalDeck(wrap,-1);
      }, {passive: true});

      document.addEventListener('click',handleClick);
      document.addEventListener('error',event => {
        const image = event.target;
        if (image instanceof HTMLImageElement && image.matches('.visitor-story img,.activity-film-media img,.gallery-item>img,.visitor-location-photo img')) {
          if (image.dataset.unavailable === '1') return;
          image.dataset.unavailable = '1';
          const message = document.createElement('div');
          message.className = 'media-unavailable';
          message.innerHTML = icon('image')+'<span>Foto belum dapat ditampilkan.</span>';
          image.replaceWith(message);
          return;
        }
        if (!(image instanceof HTMLImageElement) || !image.matches('[data-avatar-image]')) return;
        const fallback = image.dataset.avatarFallback;
        if (fallback) {
          delete image.dataset.avatarFallback;
          image.src = fallback;
          return;
        }
        image.hidden = true;
        image.removeAttribute('src');
        image.closest('.avatar')?.classList.add('is-fallback');
      },true);
      $('#search-form').addEventListener('submit',performSearch);
      $('#theme-button').addEventListener('click',() => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
      $('#mobile-toggle').addEventListener('click',() => {
        setMobileMenu(!$('#mobile-panel').classList.contains('open'));
      });
      document.addEventListener('keydown',event => {
        if (event.defaultPrevented) return;
        if (event.key === 'Escape') {
          const dialog = event.target.closest?.('dialog[open]') || document.querySelector('dialog[open]');
          if (dialog) { event.preventDefault(); dialog.close(); return; }
          const drop = event.target.closest?.('.nav-drop.open');
          if (drop) {
            event.preventDefault();
            drop.classList.remove('open');
            const toggle = drop.querySelector('[data-nav-toggle]');
            toggle?.setAttribute('aria-expanded','false');
            toggle?.focus();
            return;
          }
        }
        if (event.key === 'Escape' && $('#mobile-panel').classList.contains('open')) closeMobile();
        if (event.key === 'ArrowRight') {
          const wrap = document.querySelector('.journal-deck');
          if (wrap) shiftJournalDeck(wrap,1);
        }
        if (event.key === 'ArrowLeft') {
          const wrap = document.querySelector('.journal-deck');
          if (wrap) shiftJournalDeck(wrap,-1);
        }
      });
      $('#theme-options').addEventListener('click',event => { const button=event.target.closest('[data-theme-value]'); if(button) applyTheme(button.dataset.themeValue); });
      document.addEventListener('visibilitychange',() => { if (!document.hidden) refreshWelcomePresentation(); });
      $('#font-options').addEventListener('click',event => { const button=event.target.closest('[data-font-value]'); if(button) applyFont(button.dataset.fontValue); });
      $('#motion-options').addEventListener('click',event => { const button=event.target.closest('[data-motion-value]'); if(button) applyMotion(button.dataset.motionValue); });
      $('#language-select').addEventListener('change',event => setLanguage(event.target.value));
      $('#language-settings').addEventListener('change',event => setLanguage(event.target.value));
      $('#install-app').addEventListener('click',openInstallHelp);
      const presentationShellElement=$('#presentation-shell');
      if(presentationShellElement){
        presentationShellElement.addEventListener('pointerdown',()=>{presentationKeyboardControls=false;showPresentationControls(true);},{passive:true});
        presentationShellElement.addEventListener('focusin',()=>showPresentationControls(true));
        presentationShellElement.addEventListener('focusout',()=>showPresentationControls(true));
        presentationShellElement.addEventListener('pointerdown',handlePresentationPointerDown,{passive:true});
        presentationShellElement.addEventListener('pointerup',handlePresentationPointerUp,{passive:true});
        presentationShellElement.addEventListener('pointercancel',()=>{presentationPointer=null;},{passive:true});
        presentationShellElement.addEventListener('pointermove',()=>showPresentationControls(true),{passive:true});
        presentationShellElement.addEventListener('mousemove',()=>showPresentationControls(true),{passive:true});
        presentationShellElement.addEventListener('touchmove',()=>showPresentationControls(true),{passive:true});
      }
      $('#presentation-dialog')?.addEventListener('close',cleanupPresentation);
      if('ResizeObserver' in window){presentationResizeObserver=new ResizeObserver(()=>{if($('#presentation-dialog')?.open)schedulePresentationFit();});const frame=$('#presentation-frame');if(frame)presentationResizeObserver.observe(frame);}
      document.addEventListener('fullscreenchange',()=>{if($('#presentation-dialog')?.open)schedulePresentationFit();});
      document.addEventListener('galilea:page-turn-end',()=>{if($('#presentation-dialog')?.open)schedulePresentationFit();});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if($('#presentation-dialog')?.open){requestPresentationWakeLock();schedulePresentationFit();}if(state.route==='home'&&state.async.devotional&&state.async.devotional.requestedDate!==witaDateKey())loadDevotionalHome(true);}else releasePresentationWakeLock();});
      window.addEventListener('beforeinstallprompt',event => { event.preventDefault(); state.deferredInstall=event; });
      window.addEventListener('online',()=>{updateNetworkStatus();ensureHymnalPack(true).catch(()=>{});toast('Koneksi kembali tersedia.');});
      window.addEventListener('offline',updateNetworkStatus);
      window.addEventListener('popstate',() => {
        const route = location.hash.replace('#','');
        const beritaMatch = route.match(/^berita\/(.+)$/);
        if (beritaMatch) { navigate('activities',{history:false}); setTimeout(() => openActivity(decodeURIComponent(beritaMatch[1])),100); return; }
        navigate(ROUTES.includes(route) ? route : 'home',{history:false});
      });
      window.addEventListener('scroll',updateCinemaHeader,{passive:true});
      window.addEventListener('resize',()=>{updateCinemaHeader();if($('#presentation-dialog')?.open)schedulePresentationFit();},{passive:true});
      $$('dialog').forEach(dialog => dialog.addEventListener('click',event => { if(event.target===dialog) dialog.close(); }));
      boot();
    }());
