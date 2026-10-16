(() => {
  'use strict';

  const stop = new Set(('yang dan di ke dari untuk dengan pada dalam itu ini adalah akan oleh sebagai juga atau karena tetapi namun para suatu sebuah telah tidak bukan kita mereka ia dia anda saya kami kamu lebih dapat tersebut menjadi tentang kepada bahwa agar pun saat ketika hanya sama sangat sudah masih seperti melalui sehingga lalu maka serta saja ada apa bagaimana mengapa apakah').split(' '));
  const books = '(?:Kej(?:adian)?|Kel(?:uaran)?|Im(?:amat)?|Bil(?:angan)?|Ul(?:angan)?|Yos(?:ua)?|Hak(?:im-hakim)?|Rut|Sam(?:uel)?|Raj(?:a-raja)?|Taw(?:arikh)?|Ezr(?:a)?|Neh(?:emia)?|Est(?:er)?|Ayb|Ayub|Mzm|Mazmur|Ams(?:al)?|Pkh|Pengkhotbah|Kid(?:ung Agung)?|Yes(?:aya)?|Yer(?:emia)?|Rat(?:apan)?|Yeh(?:ezkiel)?|Dan(?:iel)?|Hos(?:ea)?|Yl|Yoel|Am(?:os)?|Ob(?:aja)?|Yun(?:us)?|Mi(?:kha)?|Nah(?:um)?|Hab(?:akuk)?|Zef(?:anya)?|Hag(?:ai)?|Za(?:kharia)?|Mal(?:eakhi)?|Mat(?:ius)?|Mrk|Markus|Luk(?:as)?|Yoh(?:anes)?|Kis(?:ah Para Rasul)?|Rm|Rom(?:a)?|Kor(?:intus)?|Gal(?:atia)?|Ef(?:esus)?|Flp|Filipi|Kol(?:ose)?|Tes(?:alonika)?|Tim(?:otius)?|Tit(?:us)?|Flm|Filemon|Ibr(?:ani)?|Yak(?:obus)?|Ptr|Pet(?:rus)?|Yud(?:as)?|Why|Wahyu)';
  const referencePattern = new RegExp('\\b(?:[1-3]\\s*)?' + books + '\\.?\\s+\\d+\\s*:\\s*\\d+(?:\\s*[-–,]\\s*\\d+)*', 'gi');
  const normalize = text => String(text || '').replace(/\s+/g, ' ').trim();
  const tokens = text => [...new Set((normalize(text).toLowerCase().match(/[\p{L}]{3,}/gu) || []).filter(word => !stop.has(word)))];
  const countWords = text => normalize(text).split(/\s+/).filter(Boolean).length;
  const overlap = (a, b) => {
    const left = new Set(a), right = new Set(b);
    const common = [...left].filter(word => right.has(word)).length;
    return common / Math.max(1, Math.min(left.size, right.size));
  };

  function references(text) {
    return [...new Set((String(text || '').match(referencePattern) || []).map(ref => ref.replace(/\s*:\s*/g, ':').replace(/\s*([-–,])\s*/g, '$1').replace(/\s+/g, ' ').trim()))];
  }

  function sentences(text) {
    const protectedText = normalize(text)
      .replace(/\b([A-Z])\.(?=\s+[A-Z])/g, '$1\uE000')
      .replace(/\b(Kej|Kel|Im|Bil|Ul|Yos|Hak|Sam|Raj|Taw|Ezr|Neh|Est|Ayb|Mzm|Ams|Pkh|Kid|Yes|Yer|Rat|Yeh|Dan|Hos|Am|Ob|Yun|Mi|Nah|Hab|Zef|Hag|Za|Mal|Mat|Mrk|Luk|Yoh|Kis|Rm|Rom|Kor|Gal|Ef|Flp|Kol|Tes|Tim|Tit|Flm|Ibr|Yak|Ptr|Pet|Yud|Why|jld|hlm)\./gi, '$1\uE000');
    return (protectedText.match(/[^.!?]+(?:[.!?]+["'”’]?|$)/g) || [])
      .map(value => normalize(value.replace(/\uE000/g, '.')))
      .filter(Boolean);
  }

  function displaySentence(text) {
    // Rujukan dipindahkan ke slide ayat; isi kalimat tetap utuh.
    return normalize(text.replace(/\([^)]*\)/g, value => references(value).length ? '' : value)
      .replace(/\s+([,.!?;:])/g, '$1'));
  }

  function summarize({title = '', paragraphs = [], bibleText = ''} = {}) {
    const blocks = paragraphs.map(item => typeof item === 'string' ? {text:normalize(item), emphasized:false} : {...item, text:normalize(item.text)}).filter(item => item.text);
    const candidates = [], questions = [];
    const titleTokens = tokens(title);
    blocks.forEach((block, paragraph) => {
      sentences(block.text).forEach((original, position) => {
        const text = displaySentence(original), words = countWords(text);
        if (/\?["'”’]?$/.test(text) && words >= 5 && words <= 55) {
          questions.push({text, paragraph, score:paragraph / Math.max(1, blocks.length) * 3 + (block.emphasized ? 2 : 0) + (/\b(Anda|kita|hidup|terapkan|pengharapan)\b/i.test(text) ? 3 : 0)});
          return;
        }
        if (words < 7 || words > 44 || text.length > 340 || !/[.!]["'”’]?$/.test(text)) return;
        if (/https?:|www\.|hlm\.|jld\.|untuk mengetahui lebih lanjut|pelajari pelajaran|untuk persiapan sabat/i.test(text)) return;
        if (/^(?:bacalah|baca|lihat|renungkanlah|diskusikan|ayat hafalan|untuk pelajaran)\b/i.test(text)) return;
        if (/^["“]|["”]$|\b(aku|saya|kami)\b/i.test(text)) return;
        const terms = tokens(text);
        if (terms.length < 3) return;
        candidates.push({text, original, terms, paragraph, position, emphasized:block.emphasized});
      });
    });
    const frequency = new Map();
    candidates.forEach(item => item.terms.forEach(term => frequency.set(term, (frequency.get(term) || 0) + 1)));
    candidates.forEach(item => {
      const centrality = item.terms.reduce((sum, term) => sum + Math.log1p(frequency.get(term) || 0), 0) / Math.sqrt(item.terms.length);
      const theme = item.terms.filter(term => titleTokens.includes(term)).length;
      const conclusion = /\b(pelajaran (?:besar|penting)|dengan kata lain|fungsi inti|kuncinya|menunjukkan bahwa|mengajarkan|diingat|kesimpulan)\b/i.test(item.text) ? 3 : 0;
      const dependent = /^(?:ini|itu|ia|dia|mereka|hal ini|namun demikian|akibatnya|dalam hal ini|dengan demikian|seperti yang)\b/i.test(item.text) ? 2 : 0;
      item.score = centrality + theme * 2 + conclusion + (item.emphasized ? 1 : 0) + (item.position === 0 ? .3 : 0) - dependent;
    });
    const relevant = candidates.filter(item => candidates.length < 5 || item.terms.some(term => titleTokens.includes(term)) || item.terms.filter(term => (frequency.get(term) || 0) > 1).length >= 2);
    const ranked = [...relevant].sort((a,b) => b.score - a.score || a.paragraph - b.paragraph || a.position - b.position);
    const selected = [];
    for (let i = 0; i < 5; i++) {
      const available = ranked.filter(item => !selected.includes(item) && selected.every(other => overlap(item.terms, other.terms) < .7));
      if (!available.length) break;
      available.sort((a,b) => {
        const adjusted = item => item.score - Math.max(0, ...selected.map(other => overlap(item.terms, other.terms) * 5 + (item.paragraph === other.paragraph ? 1.5 : 0)));
        return adjusted(b) - adjusted(a);
      });
      selected.push(available[0]);
    }
    const core = selected[0] || null;
    const points = selected.slice(1, 5).sort((a,b) => a.paragraph - b.paragraph || a.position - b.position);
    if (!points.length && core) points.push(core);
    const discussion = questions.sort((a,b) => b.score - a.score)[0]?.text || '';
    const refs = references(blocks.map(item => item.text).join(' ') + ' ' + bibleText).slice(0, 4);
    return {
      points:points.map(item => item.text),
      summary:core && !points.includes(core) ? core.text : '',
      discussion,
      references:refs,
      hasContent:blocks.some(item => countWords(item.text) >= 4),
      method:'source-excerpts'
    };
  }

  globalThis.GalileaSabbathSummary = {summarize, sentences, references};
})();
