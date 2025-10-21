export interface ShadowOverlay {
  host: HTMLElement
  shadow: ShadowRoot
  updatePosition: () => void
  destroy: () => void
}

export const createOverlayShadow = (id: string): ShadowOverlay => {
  const host = document.createElement('div')
  host.id = id
  host.style.position = 'fixed'
  host.style.top = '0'
  host.style.left = '0'
  host.style.width = '0'
  host.style.height = '0'
  host.style.overflow = 'hidden'
  host.style.opacity = '0'
  host.style.pointerEvents = 'none'
  host.style.visibility = 'hidden'
  host.style.zIndex = '2147483647'

  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  return {
    host,
    shadow,
    updatePosition: () => {},
    destroy: () => {
      host.remove()
    }
  }
}

export interface TextNodeMapping {
  node: Text; // The DOM Text node
  start: number; // The starting index in the concatenated plain text
  end: number; // The ending index in the concatenated plain text
}

export function extractTextWithMapping(root: HTMLElement): { plainText: string; mappings: TextNodeMapping[] } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node: Node | null;
  let plainText = '';
  const mappings: TextNodeMapping[] = [];
  const blockElements = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'HR', 'PRE']);

  while (node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const text = textNode.nodeValue || '';
      if (text.length === 0) continue;

      const start = plainText.length;
      plainText += text;
      const end = plainText.length;
      
      mappings.push({ node: textNode, start, end });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toUpperCase();

      // If we encounter a block element or a <br>, and the text doesn't already end with a newline, add one.
      // This helps simulate how blocks create line breaks.
      if (tagName === 'BR' || blockElements.has(tagName)) {
        if (plainText.length > 0 && !plainText.endsWith('\n')) {
          plainText += '\n';
        }
      }
    }
  }

  return { plainText, mappings };
}