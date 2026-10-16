(() => {
  'use strict';

  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function readingBlocks(html) {
    const root = document.createElement('div');
    root.innerHTML = html;
    root.querySelectorAll('script,style,iframe,button,input,textarea,select').forEach(node => node.remove());
    root.querySelectorAll('*').forEach(node => {
      for (const attribute of [...node.attributes]) {
        if (!['href','src','alt','start'].includes(attribute.name)) node.removeAttribute(attribute.name);
      }
    });
    root.querySelectorAll('br').forEach(node => node.before(document.createTextNode(' ')));
    const blocks = [];
    function collect(parent) {
      let inline = document.createElement('div');
      function flush() {
        if (inline.textContent.trim() || inline.querySelector('img')) {
          const text = inline.textContent;
          const words = [...text.matchAll(/\S+\s*/g)];
          const walker = document.createTreeWalker(inline, NodeFilter.SHOW_TEXT);
          const nodes = [];
          let node, offset = 0;
          while ((node = walker.nextNode())) {
            nodes.push({node, start:offset, end:offset + node.length});
            offset += node.length;
          }
          blocks.push({element:inline, words, nodes});
        }
        inline = document.createElement('div');
      }
      for (const node of parent.childNodes) {
        if (node.nodeType === 1 && node.tagName === 'IMG') {
          flush();
          inline.append(node.cloneNode(true));
          flush();
        } else if (node.nodeType === 1 && /^(P|DIV|SECTION|ARTICLE|H[1-6]|BLOCKQUOTE|UL|OL|LI|TABLE|TBODY|TR|TD|TH|FIGURE|FIGCAPTION)$/.test(node.tagName)) {
          flush();
          if (node.querySelector('p,div,section,article,ul,ol,li,table,tr,td,th,img')) collect(node);
          else {
            const tag = /^H/.test(node.tagName) ? 'h3' : node.tagName === 'BLOCKQUOTE' ? 'blockquote' : 'p';
            const content = document.createElement(tag);
            content.innerHTML = node.innerHTML;
            if (node.tagName === 'LI') content.prepend(document.createTextNode(node.parentElement.tagName === 'OL' ? (Number(node.parentElement.getAttribute('start') || 1) + [...node.parentElement.children].indexOf(node)) + '. ' : '• '));
            inline.append(content);
            flush();
          }
        } else inline.append(node.cloneNode(true));
      }
      flush();
    }
    collect(root);
    return blocks;
  }

  function fragment(block, start, end) {
    if (start === 0 && end === block.words.length) return block.element.innerHTML;
    const from = block.words[start].index;
    const last = block.words[end - 1];
    const to = last.index + last[0].length;
    const firstNode = block.nodes.find(item => item.end > from);
    const lastNode = block.nodes.find(item => item.end >= to);
    const range = document.createRange();
    range.setStart(firstNode.node, from - firstNode.start);
    range.setEnd(lastNode.node, to - lastNode.start);
    let content = range.cloneContents();
    let parent = range.commonAncestorContainer;
    if (parent.nodeType === 3) parent = parent.parentElement;
    while (parent && parent !== block.element) {
      const container = parent.cloneNode(false);
      container.append(content);
      content = container;
      parent = parent.parentElement;
    }
    const wrapper = document.createElement('div');
    wrapper.append(content);
    return wrapper.outerHTML;
  }

  function create(lesson, sanitize, mode = 'summary') {
    const days = lesson.days.map(day => {
      const fullBlocks = readingBlocks(sanitize(day.bibleHtml || '') + sanitize(day.contentHtml || ''));
      const content = readingBlocks(sanitize(day.contentHtml || ''));
      const bible = readingBlocks(sanitize(day.bibleHtml || ''));
      const outline = globalThis.GalileaSabbathSummary.summarize({
        title:day.title,
        paragraphs:content.map(block => ({text:block.element.textContent, emphasized:Boolean(block.element.querySelector('strong,b'))})),
        bibleText:bible.map(block => block.element.textContent).join(' ')
      });
      const summaryBlocks = [];
      const add = (section, html) => readingBlocks(html).forEach(block => {
        block.section = section;
        if (section === 'points') block.element.firstElementChild?.classList.add('ss-point');
        summaryBlocks.push(block);
      });
      outline.points.forEach(point => add('points','<p>'+escape(point)+'</p>'));
      if (outline.summary) add('summary','<p>'+escape(outline.summary)+'</p>');
      outline.references.forEach(reference => add('references','<p>'+escape(reference)+'</p>'));
      if (outline.discussion) add('discussion','<p>'+escape(outline.discussion)+'</p>');
      if (!outline.points.length && !outline.summary) {
        const text=outline.hasContent?'Poin ringkas belum tersedia untuk bacaan ini. Pilih Bacaan lengkap untuk membaca materinya.':'Isi bacaan hari ini belum tersedia.';
        summaryBlocks.unshift(...readingBlocks('<p>'+text+'</p>').map(block => ({...block,section:'empty'})));
      }
      return {...day, outline, fullBlocks, summaryBlocks, blocks:mode === 'full' ? fullBlocks : summaryBlocks};
    });
    return {lesson, days, mode, pages:[], layoutKey:''};
  }

  function setMode(view, mode) {
    if (!['summary','full'].includes(mode) || view.item.mode === mode) return;
    view.pendingDay = view.item.pages[view.index]?.dayIndex ?? -1;
    view.item.mode = mode;
    view.item.days.forEach(day => { day.blocks = mode === 'full' ? day.fullBlocks : day.summaryBlocks; });
    view.item.layoutKey = '';
  }

  function markup(model, page) {
    if (page.dayIndex < 0) return '<article class="ss-page ss-cover"><small>PELAJARAN ' + escape(model.lesson.number) + '</small><h2>' + escape(model.lesson.title) + '</h2><p>' + escape(model.lesson.dateLabel) + '</p><small>' + escape(model.lesson.source) + '</small></article>';
    const day = model.days[page.dayIndex];
    const labels = {points:'Poin penting', summary:'Inti pelajaran', references:'Ayat pendukung', discussion:'Diskusi', empty:'Materi'};
    const sectionLabel = model.mode === 'summary' ? labels[page.section] || 'Ringkasan' : 'Bacaan lengkap';
    return '<article class="ss-page ss-section-' + escape(page.section || 'reading') + '"><header><small>' + escape(day.dateLabel) + ' · ' + escape(sectionLabel) + '</small><h2>' + escape(day.title) + '</h2></header><div class="ss-reading">' + page.html + '</div></article>';
  }

  function layout(view, stage) {
    const model = view.item;
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    const key = [width, height, view.scale, model.mode, document.fonts?.status].join(':');
    if (model.layoutKey === key) return;
    const previous = model.pages[view.index];
    const pages = [{dayIndex:-1, html:''}];
    const measure = document.createElement('div');
    measure.className = 'ss-measure';
    measure.style.width = width + 'px';
    stage.append(measure);
    try {
      model.days.forEach((day, dayIndex) => {
        let current = {dayIndex, html:'', block:0, offset:0};
        const fits = html => {
          measure.innerHTML = markup(model, {...current, html});
          return measure.scrollHeight <= height - 4 && measure.scrollWidth <= width + 1;
        };
        const push = () => {
          if (current.html) pages.push(current);
          current = {dayIndex, html:'', block:0, offset:0, section:current.section};
        };
        day.blocks.forEach((block, blockIndex) => {
          if (current.html && current.section !== block.section) push();
          current.section = block.section;
          let offset = 0;
          const total = block.words.length;
          if (!total) {
            const html = block.element.innerHTML;
            if (current.html && !fits(current.html + html)) push();
            if (!current.html) Object.assign(current, {block:blockIndex, offset:0});
            current.html += html;
          }
          while (offset < total) {
            if (!current.html) Object.assign(current, {block:blockIndex, offset});
            const remaining = fragment(block, offset, total);
            if (fits(current.html + remaining)) {
              current.html += remaining;
              break;
            }
            // Paragraf pendek pindah utuh ke halaman berikutnya.
            if (current.html && fits(remaining)) { push(); continue; }
            let low = offset, high = total;
            while (low < high) {
              const end = Math.ceil((low + high) / 2);
              if (fits(current.html + fragment(block, offset, end))) low = end;
              else high = end - 1;
            }
            if (low === offset && current.html) { push(); continue; }
            const end = Math.max(offset + 1, low);
            current.html += fragment(block, offset, end);
            offset = end;
            push();
          }
        });
        if (!day.blocks.length) current.html = '<p>Isi bacaan hari ini belum tersedia.</p>';
        push();
      });
    } finally { measure.remove(); }
    model.pages = pages;
    model.layoutKey = key;
    if (view.pendingDay !== undefined) {
      view.index = Math.max(0,pages.findIndex(page => page.dayIndex === view.pendingDay));
      delete view.pendingDay;
    } else if (previous && previous.dayIndex >= 0) {
      const candidates = pages.map((page, index) => ({...page, index})).filter(page => page.dayIndex === previous.dayIndex && (page.block < previous.block || (page.block === previous.block && page.offset <= previous.offset)));
      view.index = candidates.at(-1)?.index || 0;
    }
  }

  function render(view, stage) {
    const pages = view.item.pages.length ? view.item.pages : [{dayIndex:-1, html:''}];
    view.index = Math.max(0, Math.min(pages.length - 1, Number(view.index) || 0));
    const page = pages[view.index];
    stage.innerHTML = markup(view.item, page);
    return {page, total:pages.length};
  }

  window.GalileaSabbathPresentation = {create, setMode, layout, render};
})();
