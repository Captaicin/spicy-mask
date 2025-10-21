import type { DetectionMatch } from '../../shared/types';
import type { TextNodeMapping } from '../../shared/dom';

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

      // Calculate the intersection of the match and the current node
      const intersectionStart = Math.max(matchStart, nodeStart);
      const intersectionEnd = Math.min(matchEnd, nodeEnd);

      if (intersectionStart >= intersectionEnd) continue;

      // Convert the intersection indices from plainText-space to node-space
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