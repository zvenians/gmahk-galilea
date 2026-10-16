import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const source=fs.readFileSync(new URL('../sabbath-summary.js',import.meta.url),'utf8');
const sandbox=vm.createContext({Intl});
vm.runInContext(source,sandbox);
const {summarize,references}=sandbox.GalileaSabbathSummary;
const fixture={
  "title": "Fungsi Para Nabi",
  "paragraphs": [
    "Ruang pertemuan itu memiliki beberapa kursi kayu yang disusun pada pagi hari.",
    "Para nabi berinteraksi dengan raja-raja dalam situasi yang menyenangkan maupun tidak menyenangkan.",
    "Salah satu fungsi inti para nabi adalah membantu memimpin raja-raja yang tidak setia kembali kepada ketaatan pada hukum Allah.",
    "Para nabi juga berinteraksi dengan para imam. Musa seorang nabi Allah, mengurapi Harun dan anak-anaknya sebagai imam-imam Israel yang pertama (Im. 8: 10-13).",
    "Para nabi adalah guru bagi rakyat (2 Taw. 34:12). Mereka menyampaikan berbagai pekabaran dari Allah kepada para imam, raja, dan bangsa itu (Yer. 5:31; Yeh. 22:26).",
    {
      "text": "Bagaimana kita dapat mengikuti firman Allah dalam kehidupan sehari-hari?",
      "emphasized": true
    }
  ]
};
const original=JSON.stringify(fixture);
const summary=summarize(fixture);
assert.ok(summary.points.length>=3&&summary.points.length<=4);
assert.match(summary.summary,/fungsi inti/,'The central teaching wins over introductory details');
assert.ok(!summary.points.some(point=>/kursi kayu/.test(point)));
assert.match(summary.discussion,/Bagaimana kita/);
assert.equal(JSON.stringify(fixture),original,'Source data stays intact');
assert.equal(new Set(summary.points).size,summary.points.length);
assert.ok(!summary.points.includes(summary.summary),'Core slide does not repeat a bullet');
assert.equal(references('Yak. 5: 17, 18; 1 Raja-raja 19: 1-16; Im. 8: 10-13.').length,3,'Reference abbreviations and ranges survive');
assert.ok(summary.references.includes('Im. 8:10-13'));
const empty=summarize();
assert.equal(empty.points.length,0);
assert.equal(empty.hasContent,false);
const questions=summarize({title:'Diskusi',paragraphs:['Bagaimana kita membagikan kasih kepada sesama pada hari ini?']});
assert.equal(questions.points.length,0,'Questions must not become statements');
assert.match(questions.discussion,/\?$/);
const one=summarize({title:'Kasih',paragraphs:['Allah memanggil umat-Nya untuk mengasihi sesama dengan tulus setiap hari.']});
assert.equal(one.points.length,1,'Short source is not padded with invented points');
assert.equal(one.summary,'');
const negation=summarize({title:'Nabi yang setia',paragraphs:['Nabi yang setia tidak mengubah kebenaran Allah untuk menyenangkan raja.']});
assert.match(negation.points[0],/tidak mengubah/,'Negation must survive');
const quotation=summarize({title:'Nabi',paragraphs:['"Aku tidak mengutus mereka, tidak memerintahkan mereka dan tidak berfirman kepada mereka."']});
assert.equal(quotation.points.length,0,'A first-person quotation must not be recast as the narrator');
assert.equal(summarize({paragraphs:['Untuk mengetahui lebih lanjut, kunjungi https://example.com/pelajaran.']}).points.length,0);

const dom=new JSDOM('<section id="stage"></section>',{runScripts:'outside-only'});
dom.window.eval(source);
dom.window.eval(fs.readFileSync(new URL('../sabbath-presentation.js',import.meta.url),'utf8'));
const day={title:fixture.title,dateLabel:'Selasa, 13 Oktober',contentHtml:fixture.paragraphs.map(p=>'<p>'+String(typeof p==='string'?p:p.text)+'</p>').join(''),bibleHtml:''};
const lesson={number:3,title:'Nabi-Nabi Perjanjian Lama',days:[day,{title:'Kosong',contentHtml:'',bibleHtml:''}]};
const presenter=dom.window.GalileaSabbathPresentation;
const model=presenter.create(lesson,html=>html);
assert.equal(model.mode,'summary');
assert.ok(model.days[0].summaryBlocks.some(block=>block.section==='points'));
assert.ok(model.days[0].summaryBlocks.some(block=>block.section==='summary'));
assert.ok(model.days[0].summaryBlocks.some(block=>block.section==='references'));
assert.ok(model.days[0].summaryBlocks.some(block=>block.section==='discussion'));
assert.match(model.days[1].blocks[0].element.textContent,/belum tersedia/);
const stage=dom.window.document.querySelector('#stage');
Object.defineProperties(stage,{clientWidth:{value:1200},clientHeight:{value:600}});
const view={item:model,index:0,scale:1};
presenter.layout(view,stage);
const sections=model.pages.filter(page=>page.dayIndex===0).map(page=>page.section);
assert.deepEqual([...sections],['points','summary','references','discussion'],'Sections start on separate slides');
view.index=model.pages.findIndex(page=>page.section==='discussion');
presenter.setMode(view,'full');presenter.layout(view,stage);
assert.equal(model.mode,'full');
assert.equal(model.pages[view.index].dayIndex,0,'Mode switch keeps the selected day');
assert.equal(model.days[0].blocks,model.days[0].fullBlocks);
presenter.setMode(view,'summary');presenter.layout(view,stage);
assert.equal(model.pages[view.index].section,'points');
presenter.render(view,stage);
assert.ok(stage.querySelector('.ss-point'),'Key points have their own presentation styling');
assert.ok(!stage.querySelector('script'),'Only escaped source text is inserted');
dom.window.close();
console.log('PASS: Daily key points, source fidelity, central summary, verse references, discussion, empty/short material and mode switching.');
