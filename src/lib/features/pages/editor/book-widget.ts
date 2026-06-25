import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';
import { RangeSetBuilder, StateField, EditorState } from '@codemirror/state';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookRefData {
  title: string;
  author: string;
  status: string;
  rating: number;
  pagesRead: number;
  pagesTotal: number;
  imageUrl: string;
  startedAt: string;
  finishedAt: string;
  description: string;
}

// ─── Parse ────────────────────────────────────────────────────────────────────

/**
 * Parse the content of a :::book-ref block into a BookRefData object.
 * Each line is expected to be `key: value`.
 */
function parseBookRef(blockContent: string): BookRefData {
  const lines = blockContent.split('\n');
  const data: Record<string, string> = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) data[key] = value;
  }
  return {
    title: data['title'] ?? 'Unknown Title',
    author: data['author'] ?? '',
    status: data['status'] ?? '',
    rating: parseInt(data['rating'] ?? '0', 10) || 0,
    pagesRead: parseInt(data['pagesRead'] ?? '0', 10) || 0,
    pagesTotal: parseInt(data['pagesTotal'] ?? '0', 10) || 0,
    imageUrl: data['imageUrl'] ?? '',
    startedAt: data['startedAt'] ?? '',
    finishedAt: data['finishedAt'] ?? '',
    description: data['description'] ?? '',
  };
}

// ─── Widget ───────────────────────────────────────────────────────────────────

class BookRefWidget extends WidgetType {
  constructor(
    private data: BookRefData,
    private targetPos?: number
  ) {
    super();
  }

  eq(other: BookRefWidget): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data) && this.targetPos === other.targetPos;
  }

  toDOM(view: EditorView): HTMLElement {
    const { title, author, status, rating, pagesRead, pagesTotal, imageUrl, startedAt, finishedAt, description } = this.data;

    const stars = rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—';
    const progress = pagesTotal > 0
      ? Math.min(100, Math.round((pagesRead / pagesTotal) * 100))
      : 0;

    const progressBar = (() => {
      const total = 16;
      const filled = Math.round((progress / 100) * total);
      return `[${'█'.repeat(filled)}${'░'.repeat(total - filled)}] ${progress}%`;
    })();

    const statusColors: Record<string, string> = {
      'Reading': 'var(--color-primary)',
      'Completed': 'var(--color-chart-2, #7ec8a0)',
      'Paused': 'var(--color-chart-4, #e5c07b)',
      'Abandoned': 'var(--color-destructive)',
      'Want to Read': 'var(--color-muted-foreground)',
    };
    const statusColor = statusColors[status] ?? 'var(--color-muted-foreground)';

    const wrap = document.createElement('div');
    wrap.className = 'cm-book-ref-widget';
    wrap.setAttribute('contenteditable', 'false');
    wrap.style.cssText = `
      display: flex;
      align-items: stretch;
      gap: 12px;
      border: 1px solid var(--color-border);
      background: var(--color-box-bg, var(--color-background));
      padding: 12px;
      margin: 6px 0;
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      user-select: none;
      cursor: default;
      position: relative;
    `;

    // left badge
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: absolute;
      top: 0; left: 10px;
      transform: translateY(-50%);
      background: var(--color-box-bg, var(--color-background));
      border-left: 1px solid var(--color-border);
      border-right: 1px solid var(--color-border);
      padding: 0 6px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-primary);
    `;
    badge.textContent = '// book ref';
    wrap.appendChild(badge);

    // cover
    if (imageUrl) {
      const cover = document.createElement('img');
      cover.src = imageUrl;
      cover.alt = 'cover';
      cover.style.cssText = `
        width: 52px;
        aspect-ratio: 3/4;
        object-fit: cover;
        border: 1px solid var(--color-border);
        flex-shrink: 0;
        align-self: flex-start;
        margin-top: 6px;
      `;
      wrap.appendChild(cover);
    } else {
      const noCover = document.createElement('div');
      noCover.style.cssText = `
        width: 52px;
        aspect-ratio: 3/4;
        border: 1px dashed var(--color-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: var(--color-dim-foreground, var(--color-muted-foreground));
        font-weight: bold;
        flex-shrink: 0;
        align-self: flex-start;
        margin-top: 6px;
        text-align: center;
        padding: 2px;
      `;
      noCover.textContent = '[NO\nCOVER]';
      wrap.appendChild(noCover);
    }

    // info column
    const info = document.createElement('div');
    info.style.cssText = `
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-top: 6px;
    `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-weight: bold;
      font-size: 12px;
      color: var(--color-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    titleEl.textContent = title;

    const authorEl = document.createElement('div');
    authorEl.style.cssText = `color: var(--color-muted-foreground); font-size: 10px;`;
    authorEl.textContent = author ? `by ${author}` : '';

    const separator = document.createElement('div');
    separator.style.cssText = `
      border-top: 1px dashed var(--color-border);
      margin: 4px 0 3px 0;
    `;

    const statusEl = document.createElement('div');
    statusEl.style.cssText = `display: flex; align-items: center; gap: 6px;`;
    const statusDot = document.createElement('span');
    statusDot.style.cssText = `
      display: inline-block;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: ${statusColor};
      flex-shrink: 0;
    `;
    const statusText = document.createElement('span');
    statusText.style.cssText = `color: ${statusColor}; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.08em;`;
    statusText.textContent = status || 'No Status';
    statusEl.appendChild(statusDot);
    statusEl.appendChild(statusText);

    const ratingEl = document.createElement('div');
    ratingEl.style.cssText = `color: var(--color-primary); font-size: 11px; letter-spacing: 1px;`;
    ratingEl.textContent = stars;

    info.appendChild(titleEl);
    if (author) info.appendChild(authorEl);

    if (description) {
      const descEl = document.createElement('div');
      descEl.style.cssText = `
        color: var(--color-dim-foreground, var(--color-muted-foreground));
        font-size: 9px;
        font-style: italic;
        margin-top: 2px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
      `;
      descEl.textContent = description;
      info.appendChild(descEl);
    }

    info.appendChild(separator);
    info.appendChild(statusEl);
    info.appendChild(ratingEl);

    // progress
    if (pagesTotal > 0) {
      const progressEl = document.createElement('div');
      progressEl.style.cssText = `
        margin-top: 4px;
        color: var(--color-primary);
        font-size: 10px;
        font-weight: bold;
        white-space: pre;
      `;
      progressEl.textContent = progressBar;
      const pagesEl = document.createElement('div');
      pagesEl.style.cssText = `color: var(--color-muted-foreground); font-size: 9px; margin-top: 1px;`;
      pagesEl.textContent = `${pagesRead} / ${pagesTotal} pages`;
      info.appendChild(progressEl);
      info.appendChild(pagesEl);
    }

    // dates
    const datesRow = document.createElement('div');
    datesRow.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 4px;
      color: var(--color-dim-foreground, var(--color-muted-foreground));
      font-size: 9px;
    `;
    if (startedAt) {
      const s = document.createElement('span');
      s.textContent = `started: ${startedAt}`;
      datesRow.appendChild(s);
    }
    if (finishedAt) {
      const f = document.createElement('span');
      f.textContent = `finished: ${finishedAt}`;
      datesRow.appendChild(f);
    }
    if (startedAt || finishedAt) info.appendChild(datesRow);

    wrap.appendChild(info);

    wrap.addEventListener('click', () => {
      if (view && this.targetPos !== undefined) {
        view.focus();
        view.dispatch({
          selection: { anchor: this.targetPos, head: this.targetPos },
          scrollIntoView: true
        });
      }
    });

    return wrap;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

// ─── StateField ────────────────────────────────────────────────────────────────

const BOOK_REF_RE = /^:::book-ref\n([\s\S]*?)\n:::/gm;

function buildDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = state.doc.toString();
  let match: RegExpExecArray | null;
  BOOK_REF_RE.lastIndex = 0;

  while ((match = BOOK_REF_RE.exec(doc)) !== null) {
    const blockContent = match[1];
    const from = match.index;
    const to = match.index + match[0].length;

    // Map character positions to line positions
    const fromLine = state.doc.lineAt(from);
    const toLine = state.doc.lineAt(to);

    const data = parseBookRef(blockContent);
    const targetPos = Math.min(state.doc.length, toLine.to + 1);
    const widget = Decoration.replace({
      widget: new BookRefWidget(data, targetPos),
      block: true,
    });

    builder.add(fromLine.from, toLine.to, widget);
  }

  return builder.finish();
}

/**
 * Scans the document for :::book-ref ... ::: fenced blocks and replaces
 * each matching line range with a BookRefWidget decoration.
 */
export const bookRefPlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged) {
      return buildDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});
