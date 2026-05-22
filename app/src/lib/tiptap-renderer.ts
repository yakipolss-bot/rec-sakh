interface TipTapDoc {
  type: 'doc';
  content?: TipTapNode[];
}

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

function escape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderNode(node: TipTapNode): string {
  switch (node.type) {
    case 'paragraph':
      return `<p>${renderChildren(node)}</p>`;
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2;
      return `<h${level}>${renderChildren(node)}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${renderChildren(node)}</ul>`;
    case 'orderedList':
      return `<ol>${renderChildren(node)}</ol>`;
    case 'listItem':
      return `<li>${renderChildren(node)}</li>`;
    case 'blockquote':
      return `<blockquote>${renderChildren(node)}</blockquote>`;
    case 'iframe': {
      const src = (node.attrs?.src as string) ?? '';
      const w = (node.attrs?.width as string) ?? '100%';
      const h = (node.attrs?.height as string) ?? '360';
      const allowFull = node.attrs?.allowfullscreen ?? true;
      return `<div class="sakh-embed"><iframe src="${escape(src)}" width="${escape(w)}" height="${escape(h)}"${allowFull ? ' allowfullscreen' : ''} frameborder="0" loading="lazy"></iframe></div>`;
    }
    case 'image': {
      const src = (node.attrs?.src as string) ?? '';
      const alt = (node.attrs?.alt as string) ?? '';
      return `<img src="${escape(src)}" alt="${escape(alt)}" loading="lazy" />`;
    }
    case 'hardBreak':
      return '<br />';
    case 'horizontalRule':
      return '<hr />';
    case 'codeBlock': {
      const lang = node.attrs?.language as string;
      return `<pre${lang ? ` class="language-${escape(lang)}"` : ''}><code>${escape(renderChildren(node))}</code></pre>`;
    }
    case 'text':
      return renderText(node);
    default:
      return renderChildren(node);
  }
}

function renderChildren(node: TipTapNode): string {
  return node.content?.map(renderNode).join('') ?? '';
}

function renderText(node: TipTapNode): string {
  let html = escape(node.text ?? '');
  if (!node.marks) return html;
  for (const mark of node.marks) {
    switch (mark.type) {
      case 'bold':
        html = `<strong>${html}</strong>`;
        break;
      case 'italic':
        html = `<em>${html}</em>`;
        break;
      case 'underline':
        html = `<u>${html}</u>`;
        break;
      case 'strike':
        html = `<s>${html}</s>`;
        break;
      case 'code':
        html = `<code>${html}</code>`;
        break;
      case 'link': {
        const href = (mark.attrs?.href as string) ?? '#';
        html = `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
        break;
      }
    }
  }
  return html;
}

export function renderTipTapJson(doc: TipTapDoc | null): string {
  if (!doc?.content) return '';
  return doc.content.map(renderNode).join('');
}

export function estimateReadingTime(doc: TipTapDoc | null): number {
  if (!doc) return 1;
  const text = extractText(doc.content ?? []);
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

function extractText(nodes: TipTapNode[]): string {
  return nodes.map(n => n.text ?? (n.content ? extractText(n.content) : '')).join(' ');
}

export function injectAdAfterParagraph(html: string, after: number, adHtml: string): string {
  let count = 0;
  return html.replace(/<\/p>/g, m => ++count === after ? `${m}${adHtml}` : m);
}
