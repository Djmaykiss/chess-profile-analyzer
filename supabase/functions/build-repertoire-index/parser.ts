export function parseMainlineSan(pgn: string): string[] {
  const body = pgn.replace(/^\s*(?:\[[^\n]*\]\s*\n)+/m, '')
  let plain = ''; let variationDepth = 0; let commentDepth = 0; let lineComment = false
  for (const char of body) {
    if (lineComment) { if (char === '\n') lineComment = false; continue }
    if (commentDepth) { if (char === '}') commentDepth -= 1; continue }
    if (char === '{') { commentDepth += 1; continue }
    if (char === ';') { lineComment = true; continue }
    if (char === '(') { variationDepth += 1; continue }
    if (char === ')' && variationDepth) { variationDepth -= 1; continue }
    if (!variationDepth) plain += char
  }
  return plain.replace(/\$\d+/g, ' ').replace(/\d+\.(?:\.\.)?/g, ' ').trim().split(/\s+/)
    .filter(token => token && !['1-0', '0-1', '1/2-1/2', '*'].includes(token) && !/^[!?]+$/.test(token))
}
