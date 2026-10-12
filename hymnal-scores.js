(function () {
  'use strict';
  const MAX_BYTES = 25 * 1024 * 1024;
  const memory = new Map();
  const writes = new Map();
  let database;
  let active;
  let selectedNumber = '';
  let query = '';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

  function openDatabase() {
    if (!window.indexedDB) return Promise.reject(new Error('Penyimpanan browser tidak tersedia.'));
    if (database) return database;
    database = new Promise((resolve, reject) => {
      const request = window.indexedDB.open('galilea-hymnal-scores', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('scores', {keyPath:'number'});
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); database = undefined; };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Penyimpanan sedang dipakai tab lain.'));
    }).catch(error => { database = undefined; throw error; });
    return database;
  }

  async function storedScore(number) {
    if (memory.has(number)) return memory.get(number);
    try {
      const db = await openDatabase();
      return await new Promise((resolve, reject) => {
        const request = db.transaction('scores', 'readonly').objectStore('scores').get(number);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (_) { return null; }
  }

  async function saveScore(number, file) {
    const previous = writes.get(number) || Promise.resolve();
    const task = previous.catch(() => {}).then(() => writeScore(number, file));
    writes.set(number, task);
    try { return await task; }
    finally { if (writes.get(number) === task) writes.delete(number); }
  }

  async function writeScore(number, file) {
    if (!file || !file.size) throw new Error('PDF kosong. Pilih file partitur yang berisi halaman.');
    if (file.size > MAX_BYTES) throw new Error('Ukuran PDF maksimal 25 MB.');
    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (String.fromCharCode(...header) !== '%PDF-') throw new Error('File bukan PDF. Pilih partitur berformat PDF.');
    const entry = {number, name:file.name, blob:file, persistent:true};
    try {
      const db = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('scores', 'readwrite');
        transaction.objectStore('scores').put(entry);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } catch (_) { entry.persistent = false; }
    memory.set(number, entry);
    return entry;
  }

  function filterSongs(songs, text) {
    const needle = String(text || '').toLowerCase().trim();
    return songs.filter(song => !needle || String(song.number).includes(needle) || String(song.title).toLowerCase().includes(needle));
  }

  function destroy() {
    if (active) active.destroy();
    active = undefined;
  }

  function mount({root, catalog, getSong, openLyrics, icon}) {
    destroy();
    let disposed = false;
    let sequence = 0;
    let objectUrl = '';
    let currentSong;
    const songs = catalog.songs || [];
    const select = root.querySelector('#scores-select');
    const search = root.querySelector('#scores-search');
    const list = root.querySelector('#scores-list');
    const reader = root.querySelector('#scores-reader');
    const status = root.querySelector('#scores-status');
    select.innerHTML = '<option value="">Pilih Lagu Sion</option>' + songs.map(song => '<option value="'+escape(song.number)+'">'+escape(song.number+' · '+song.title)+'</option>').join('');
    select.value = selectedNumber;
    search.value = query;
    select.disabled = false;
    search.disabled = false;
    root.querySelector('#scores-random').disabled = false;
    root.querySelector('#scores-count').textContent = songs.length + ' lagu';
    const announce = message => { status.textContent = message; };
    const releaseUrl = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = ''; };

    function renderList() {
      const matches = filterSongs(songs, query);
      list.innerHTML = matches.length ? '<div class="song-list">'+matches.slice(0,120).map(song => '<button class="song-row" type="button" data-score-song="'+escape(song.number)+'"><span class="song-number">'+escape(song.number)+'</span><span>'+escape(song.title)+'</span>'+icon('chevron')+'</button>').join('')+'</div>' : '<div class="empty"><p>Lagu tidak ditemukan. Coba nomor atau judul lain.</p></div>';
      root.querySelector('#scores-results').textContent = matches.length + ' lagu ditemukan' + (matches.length > 120 ? ' · menampilkan 120 pertama' : '');
    }

    function renderReader(song, score) {
      releaseUrl();
      if (score) objectUrl = URL.createObjectURL(score.blob);
      const lyrics = (song.lyrics || []).map(part => '<section class="scores-verse"><h3>'+escape(/chorus|refrain/i.test(part.type) ? 'Reff' : 'Ayat '+part.index)+'</h3><p>'+escape((part.lines || []).join('\n')).replace(/\n/g,'<br>')+'</p></section>').join('');
      reader.innerHTML = '<article class="scores-heading"><div><p class="eyebrow">Lagu Sion No. '+escape(song.number)+'</p><h2 tabindex="-1" id="scores-song-title">'+escape(song.title)+'</h2></div><button type="button" class="btn" data-score-lyrics>'+icon('book')+'Buka mode lirik</button></article><div class="scores-layout"><section class="scores-paper" aria-label="Partitur"><div class="scores-file-control"><label for="scores-file">'+(score?'Ganti PDF partitur':'Pilih PDF partitur')+'</label><input id="scores-file" type="file" accept="application/pdf,.pdf"><p class="muted">Maksimal 25 MB. PDF disimpan di browser perangkat ini dan tidak dikirim ke server.</p></div>'+(score?'<p class="scores-filename">'+escape(score.name)+'</p><p class="scores-save-note">'+(score.persistent?'Tersimpan di browser ini.':'PDF hanya tersedia selama tab ini terbuka. Penyimpanan browser tidak tersedia atau penuh.')+'</p><div class="scores-pdf-stage"><div class="scores-pdf-actions"><button type="button" class="btn" data-score-fullscreen>Layar penuh PDF</button><a class="btn soft" href="'+escape(objectUrl)+'" target="_blank" rel="noopener">Buka PDF di tab baru</a><a class="btn soft" href="'+escape(objectUrl)+'" download="'+escape(score.name)+'">Unduh PDF</a></div><iframe class="scores-pdf" title="Partitur Lagu Sion '+escape(song.number)+'" src="'+escape(objectUrl)+'#view=FitH"></iframe></div>':'<div class="scores-empty"><h3>Partitur belum ditambahkan.</h3><p>Pilih PDF partitur untuk Lagu Sion No. '+escape(song.number)+'. Lirik tetap bisa dibaca di sampingnya.</p></div>')+'</section><aside class="scores-lyrics" aria-label="Lirik lagu"><h2>Lirik</h2>'+lyrics+'</aside></div>';
    }

    async function choose(number, focus) {
      const token = ++sequence;
      selectedNumber = String(number);
      currentSong = null;
      select.value = selectedNumber;
      announce('Memuat lirik dan partitur…');
      reader.innerHTML = '<div class="empty"><p>Memuat lagu…</p></div>';
      releaseUrl();
      try {
        const [song, score] = await Promise.all([getSong(number), storedScore(selectedNumber)]);
        if (disposed || token !== sequence) return;
        currentSong = song;
        renderReader(song, score);
        announce(score ? 'Lirik dan PDF partitur siap dibaca.' : 'Lirik siap. Pilih PDF untuk menambahkan partitur.');
        if (focus) reader.querySelector('#scores-song-title').focus();
      } catch (error) {
        if (disposed || token !== sequence) return;
        reader.innerHTML = '<div class="empty"><p>'+escape(error.message)+'</p><button type="button" class="btn" data-score-retry>Coba muat lagi</button></div>';
        announce('Lagu belum berhasil dimuat.');
      }
    }

    function onInput(event) {
      if (event.target === search) { query = search.value; renderList(); }
    }
    async function onChange(event) {
      if (event.target === select && select.value) return choose(select.value, true);
      if (event.target.id !== 'scores-file') return;
      const file = event.target.files[0];
      if (!file) return;
      const number = selectedNumber;
      const token = ++sequence;
      announce('Menyimpan PDF partitur…');
      try {
        const score = await saveScore(number, file);
        if (disposed || token !== sequence || selectedNumber !== number) return;
        renderReader(currentSong, score);
        announce(score.persistent ? 'PDF partitur tersimpan di browser ini.' : 'PDF siap dibaca, tetapi belum tersimpan untuk dibuka kembali.');
      } catch (error) { if (!disposed && token === sequence) { announce(error.message); event.target.value = ''; } }
    }
    async function onClick(event) {
      const song = event.target.closest('[data-score-song]');
      if (song) return choose(song.dataset.scoreSong, true);
      if (event.target.closest('#scores-random') && songs.length) return choose(songs[Math.floor(Math.random()*songs.length)].number, true);
      if (event.target.closest('[data-score-retry]')) return choose(selectedNumber, true);
      if (event.target.closest('[data-score-lyrics]') && currentSong) return openLyrics(currentSong.number);
      if (event.target.closest('[data-score-fullscreen]')) {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else {
            const stage = reader.querySelector('.scores-pdf-stage');
            if (!stage.requestFullscreen) throw new Error('Layar penuh PDF tidak tersedia. Gunakan Buka PDF di tab baru.');
            await stage.requestFullscreen();
          }
        } catch (error) { announce(error.message); }
      }
    }
    function onFullscreen() {
      const button = reader.querySelector('[data-score-fullscreen]');
      if (button) button.textContent = document.fullscreenElement ? 'Keluar layar penuh' : 'Layar penuh PDF';
    }
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    document.addEventListener('fullscreenchange', onFullscreen);
    renderList();
    const ready = selectedNumber ? choose(selectedNumber, false) : Promise.resolve();
    active = {destroy() {
      disposed = true;
      ++sequence;
      releaseUrl();
      root.removeEventListener('input', onInput);
      root.removeEventListener('change', onChange);
      root.removeEventListener('click', onClick);
      document.removeEventListener('fullscreenchange', onFullscreen);
    }};
    return ready;
  }
  window.GalileaHymnalScores = {mount, destroy, filterSongs};
})();
