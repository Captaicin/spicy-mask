import type { DetectionMatch } from '../../shared/types';

/**
 * Represents a mapping from a segment of plain text back to its source DOM Text node.
 */
export interface TextNodeMapping {
  node: Text; // The DOM Text node
  start: number; // The starting index in the concatenated plain text
  end: number; // The ending index in the concatenated plain text
}

/**
 * Traverses a contenteditable element to extract a plain text version and a map
 * of text node positions.
 * @param root The contenteditable HTMLElement to traverse.
 * @returns An object containing the plain text and the node mappings.
 */
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

/**
 * Masks the detected PII within a contenteditable element while preserving HTML structure.
 * (This is a placeholder for the full implementation)
 *
 * @param root The contenteditable HTMLElement.
 * @param matches The array of detections to mask.
 */
export function maskContentEditableNodes(
  matches: DetectionMatch[],
  mappings: TextNodeMapping[],
  maskChar = '*',
): { changed: boolean } {
  if (matches.length === 0 || mappings.length === 0) {
    return { changed: false };
  }

  const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);
  let changed = false;

  for (const match of sortedMatches) {
    const matchStart = match.startIndex;
    const matchEnd = match.endIndex;

    const affectedMappings = mappings.filter(
      (mapping) => Math.max(matchStart, mapping.start) < Math.min(matchEnd, mapping.end),
    );

    if (affectedMappings.length === 0) continue;

    for (const mapping of affectedMappings) {
      const { node, start: nodeStart, end: nodeEnd } = mapping;
      const originalText = node.nodeValue || '';

      const intersectionStart = Math.max(matchStart, nodeStart);
      const intersectionEnd = Math.min(matchEnd, nodeEnd);

      if (intersectionStart >= intersectionEnd) continue;

      const nodeMaskStart = intersectionStart - nodeStart;
      const nodeMaskEnd = intersectionEnd - nodeStart;
      const maskLength = nodeMaskEnd - nodeMaskStart;

      if (maskLength <= 0) continue;

      const prefix = originalText.substring(0, nodeMaskStart);
      const suffix = originalText.substring(nodeMaskEnd);
      
      const newText = prefix + maskChar.repeat(maskLength) + suffix;

      if (node.nodeValue !== newText) {
        node.nodeValue = newText;
        changed = true;
      }
    }
  }

  return { changed };
}
