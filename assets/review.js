/* Markco-style inline review for the blog series — client-side, localStorage-only.
   Select text → "+ Note" pill → composer → save. Notes show as highlights with
   a side panel and an export-to-markdown button. No backend. */
(function () {
  'use strict';

  const STORAGE_KEY = 'lardinator.blog.notes.v1';
  const PAGE = location.pathname.replace(/index\.html?$/, '') || '/';
  const CONTENT_SELECTOR = '.post-content, .site-main';
  const HAS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;

  // ── Storage ────────────────────────────────────────────────────────
  const loadAll = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveAll = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  const loadPage = () => loadAll()[PAGE] || [];
  const savePage = (notes) => {
    const all = loadAll();
    if (notes.length) all[PAGE] = notes; else delete all[PAGE];
    saveAll(all);
  };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const escapeHTML = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── UI elements ────────────────────────────────────────────────────
  const addBtn = document.createElement('button');
  addBtn.className = 'lr-add-btn';
  addBtn.type = 'button';
  addBtn.innerHTML = '<span>+ Note</span>';
  document.body.appendChild(addBtn);

  const composer = document.createElement('div');
  composer.className = 'lr-composer';
  composer.innerHTML = `
    <div class="lr-composer-quote"></div>
    <textarea placeholder="Your note — what's wrong, missing, or excellent…" rows="3"></textarea>
    <div class="lr-composer-actions">
      <button type="button" class="lr-cancel">Cancel</button>
      <button type="button" class="lr-save">Save note</button>
    </div>`;
  document.body.appendChild(composer);

  const toggle = document.createElement('button');
  toggle.className = 'lr-toggle';
  toggle.type = 'button';
  toggle.innerHTML = '<span class="lr-toggle-icon">📝</span><span class="lr-toggle-label">Notes</span><span class="lr-toggle-count">0</span>';
  document.body.appendChild(toggle);

  const panel = document.createElement('aside');
  panel.className = 'lr-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <header class="lr-panel-header">
      <h2>Review notes</h2>
      <div class="lr-panel-actions">
        <button type="button" class="lr-export" title="Download every note from every page as Markdown">Export all</button>
        <button type="button" class="lr-close" aria-label="Close">×</button>
      </div>
    </header>
    <div class="lr-panel-tabs">
      <button type="button" class="lr-tab lr-tab-page" data-tab="page">This page</button>
      <button type="button" class="lr-tab" data-tab="all">All pages</button>
    </div>
    <ul class="lr-list" data-view="page"></ul>
    <footer class="lr-panel-footer">
      <span class="lr-storage-info">Stored in this browser's localStorage</span>
    </footer>`;
  document.body.appendChild(panel);

  // ── Selection handling ───────────────────────────────────────────
  let currentSel = null;

  function getValidSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    const text = sel.toString().trim();
    if (text.length < 4) return null;
    const range = sel.getRangeAt(0);
    const main = document.querySelector(CONTENT_SELECTOR);
    if (!main || !main.contains(range.commonAncestorContainer)) return null;
    return { range, text };
  }

  function showAddBtn(rect) {
    if (HAS_TOUCH) {
      // On touch devices, pin the pill to a fixed bottom-right slot well clear
      // of iOS Safari's native selection callout ("Copy / Look up / Share…").
      addBtn.classList.add('lr-fixed');
      addBtn.style.top = '';
      addBtn.style.left = '';
    } else {
      addBtn.classList.remove('lr-fixed');
      const top = window.scrollY + rect.top - 42;
      const left = window.scrollX + Math.max(8, rect.left + rect.width / 2 - 40);
      addBtn.style.top = top + 'px';
      addBtn.style.left = left + 'px';
    }
    addBtn.classList.add('lr-show');
  }
  function hideAddBtn() { addBtn.classList.remove('lr-show'); }

  function updateSelection() {
    const sel = getValidSelection();
    if (!sel) { hideAddBtn(); return; }
    currentSel = sel;
    showAddBtn(sel.range.getBoundingClientRect());
  }

  document.addEventListener('mouseup', () => setTimeout(updateSelection, 0));

  // `selectionchange` is the most reliable selection signal on mobile (iOS Safari
  // does not fire mouseup in a useful way for touch selections). Debounced.
  let _selTimer = null;
  document.addEventListener('selectionchange', () => {
    clearTimeout(_selTimer);
    _selTimer = setTimeout(updateSelection, 180);
  });

  document.addEventListener('mousedown', (e) => {
    if (!addBtn.contains(e.target) && !composer.contains(e.target)) hideAddBtn();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideAddBtn(); closeComposer(); closePanel(); }
  });

  // ── Composer ─────────────────────────────────────────────────────
  function openComposer(sel, rect) {
    composer.querySelector('.lr-composer-quote').textContent =
      sel.text.length > 220 ? sel.text.slice(0, 220) + '…' : sel.text;
    const ta = composer.querySelector('textarea');
    ta.value = '';
    if (HAS_TOUCH) {
      // On touch devices, anchor the composer to the bottom of the viewport so
      // the on-screen keyboard pushes it up cleanly instead of clipping it.
      composer.classList.add('lr-mobile');
      composer.style.top = '';
      composer.style.left = '';
    } else {
      composer.classList.remove('lr-mobile');
      const top = Math.min(window.innerHeight - 220, Math.max(20, rect.top + window.scrollY + 30));
      const left = Math.min(window.innerWidth - 380, Math.max(20, rect.left + window.scrollX));
      composer.style.top = top + 'px';
      composer.style.left = left + 'px';
    }
    composer.classList.add('lr-show');
    setTimeout(() => ta.focus(), 50);
  }
  function closeComposer() { composer.classList.remove('lr-show'); }

  // Use `pointerdown` so the action fires BEFORE iOS Safari collapses the
  // selection in response to the tap. `preventDefault` keeps the selection
  // alive through the gesture (otherwise `getBoundingClientRect()` returns
  // a zero rect for an already-collapsed range).
  addBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!currentSel) return;
    const rect = currentSel.range.getBoundingClientRect();
    hideAddBtn();
    openComposer(currentSel, rect);
  });

  composer.querySelector('.lr-cancel').addEventListener('click', closeComposer);
  composer.querySelector('.lr-save').addEventListener('click', () => {
    const text = composer.querySelector('textarea').value.trim();
    if (!text) { closeComposer(); return; }
    if (!currentSel) { closeComposer(); return; }

    const note = {
      id: uid(),
      ts: Date.now(),
      quote: currentSel.text,
      comment: text,
      url: PAGE,
      title: document.title || PAGE,
    };
    const notes = loadPage();
    notes.push(note);
    savePage(notes);
    highlightNote(note);
    renderPanel();
    closeComposer();
    window.getSelection().removeAllRanges();
    currentSel = null;
    // brief confirmation pulse on the count badge
    toggle.classList.add('lr-pulse');
    setTimeout(() => toggle.classList.remove('lr-pulse'), 600);
  });

  composer.querySelector('textarea').addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') composer.querySelector('.lr-save').click();
  });

  // ── Highlighting on page ─────────────────────────────────────────
  function highlightNote(note) {
    const main = document.querySelector(CONTENT_SELECTOR);
    if (!main) return;
    // Skip if already highlighted somewhere
    if (main.querySelector(`mark.lr-mark[data-id="${note.id}"]`)) return;

    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        // skip text inside our own UI / inside <mark> already
        if (n.parentElement && n.parentElement.closest('.lr-add-btn,.lr-composer,.lr-panel,.lr-toggle,mark.lr-mark'))
          return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(note.quote);
      if (idx >= 0) {
        try {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + note.quote.length);
          const mark = document.createElement('mark');
          mark.className = 'lr-mark';
          mark.dataset.id = note.id;
          mark.title = note.comment;
          range.surroundContents(mark);
        } catch { /* spans across elements; skip highlight */ }
        return;
      }
    }
    // not found — leave note without highlight
  }

  // ── Side panel ──────────────────────────────────────────────────
  function openPanel() { panel.classList.add('lr-open'); panel.setAttribute('aria-hidden', 'false'); }
  function closePanel() { panel.classList.remove('lr-open'); panel.setAttribute('aria-hidden', 'true'); }

  toggle.addEventListener('click', () => panel.classList.contains('lr-open') ? closePanel() : openPanel());
  panel.querySelector('.lr-close').addEventListener('click', closePanel);

  panel.querySelectorAll('.lr-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('.lr-tab').forEach((t) => t.classList.remove('lr-tab-page'));
      tab.classList.add('lr-tab-page');
      panel.querySelector('.lr-list').dataset.view = tab.dataset.tab;
      renderPanel();
    });
  });

  function notesForView() {
    const view = panel.querySelector('.lr-list').dataset.view || 'page';
    if (view === 'page') return loadPage().map((n) => ({ ...n, url: PAGE, title: document.title || PAGE }));
    const all = loadAll();
    return Object.entries(all).flatMap(([url, list]) =>
      list.map((n) => ({ ...n, url: n.url || url, title: n.title || url }))
    );
  }

  function renderPanel() {
    const pageNotes = loadPage();
    const allCount = Object.values(loadAll()).reduce((s, l) => s + l.length, 0);
    panel.querySelector('.lr-tab[data-tab="page"]').textContent = `This page (${pageNotes.length})`;
    panel.querySelector('.lr-tab[data-tab="all"]').textContent = `All pages (${allCount})`;
    toggle.querySelector('.lr-toggle-count').textContent = pageNotes.length || allCount;
    toggle.classList.toggle('lr-show', allCount > 0);

    const list = panel.querySelector('.lr-list');
    const view = list.dataset.view || 'page';
    const data = notesForView();
    if (!data.length) {
      list.innerHTML = `<li class="lr-empty">${view === 'page'
        ? 'No notes on this page yet — select any text to add one.'
        : 'No notes anywhere yet. Highlight text on a post to begin.'}</li>`;
      return;
    }
    let html = '';
    let lastUrl = null;
    data.sort((a, b) => (a.url === b.url ? a.ts - b.ts : a.url.localeCompare(b.url)));
    for (const n of data) {
      if (view === 'all' && n.url !== lastUrl) {
        html += `<li class="lr-section"><a href="${n.url}">${escapeHTML(n.title)}</a></li>`;
        lastUrl = n.url;
      }
      html += `
        <li data-id="${n.id}" data-url="${escapeHTML(n.url)}">
          <blockquote>${escapeHTML(n.quote.length > 180 ? n.quote.slice(0, 180) + '…' : n.quote)}</blockquote>
          <p>${escapeHTML(n.comment)}</p>
          <div class="lr-meta">
            <time>${new Date(n.ts).toLocaleString()}</time>
            <button type="button" class="lr-del">delete</button>
          </div>
        </li>`;
    }
    list.innerHTML = html;
  }

  panel.querySelector('.lr-list').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const id = li.dataset.id;
    const url = li.dataset.url;
    if (e.target.classList.contains('lr-del')) {
      const all = loadAll();
      Object.keys(all).forEach((u) => { all[u] = all[u].filter((n) => n.id !== id); if (!all[u].length) delete all[u]; });
      saveAll(all);
      const mark = document.querySelector(`mark.lr-mark[data-id="${id}"]`);
      if (mark) { while (mark.firstChild) mark.parentNode.insertBefore(mark.firstChild, mark); mark.parentNode.removeChild(mark); }
      renderPanel();
      return;
    }
    if (url && url !== PAGE) {
      location.href = url + '#note-' + id;
      return;
    }
    const mark = document.querySelector(`mark.lr-mark[data-id="${id}"]`);
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mark.classList.add('lr-flash');
      setTimeout(() => mark.classList.remove('lr-flash'), 1500);
    }
  });

  // ── Export ──────────────────────────────────────────────────────
  panel.querySelector('.lr-export').addEventListener('click', () => {
    const all = loadAll();
    const lines = [
      '# Review notes — *How I Failed to Beat the Tote*',
      '',
      `Exported: ${new Date().toLocaleString()}  `,
      `From: ${location.origin}`,
      '',
      '---',
      '',
    ];
    const entries = Object.entries(all).filter(([, l]) => l.length);
    if (!entries.length) {
      lines.push('*(No notes recorded yet.)*');
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
      for (const [url, notes] of entries) {
        const title = notes[0].title || url;
        lines.push(`## [${title}](${url})`, '');
        notes.sort((a, b) => a.ts - b.ts);
        for (const n of notes) {
          lines.push(`> ${n.quote.replace(/\n+/g, ' ')}`, '');
          lines.push(`**Note:** ${n.comment}`, '');
          lines.push(`<sub>${new Date(n.ts).toLocaleString()}</sub>`, '');
          lines.push('---', '');
        }
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    a.href = URL.createObjectURL(blob);
    a.download = `review-notes-${stamp}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  });

  // ── Restore highlights on page load ──────────────────────────────
  function restoreOnLoad() {
    loadPage().forEach((n) => highlightNote(n));
    renderPanel();
    // jump to specific note if URL has #note-<id>
    const m = location.hash.match(/^#note-(.+)$/);
    if (m) {
      const el = document.querySelector(`mark.lr-mark[data-id="${m[1]}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('lr-flash');
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreOnLoad);
  } else {
    restoreOnLoad();
  }

  // Expose a tiny console API for debugging — only via `__lr.*`
  window.__lr = { all: loadAll, page: loadPage, clear: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); } };
})();
