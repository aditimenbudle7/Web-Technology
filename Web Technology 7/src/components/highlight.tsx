import type { ReactNode } from 'react';
import { JAVA_KEYWORDS } from '../model/javaUtils';

const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[A-Za-z]\w*)|\b(\d[\d.]*[fFdDlL]?)\b|\b([A-Za-z_$][\w$]*)\b/g;

/** Minimal Java syntax highlighter - returns React nodes. */
export function highlightJava(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push(code.slice(last, start));
    const [text, comment, str, annotation, num, word] = m;
    let cls: string | null = null;
    if (comment) cls = 'tok-comment';
    else if (str) cls = 'tok-string';
    else if (annotation) cls = 'tok-annotation';
    else if (num) cls = 'tok-number';
    else if (word) {
      if (JAVA_KEYWORDS.has(word)) cls = 'tok-keyword';
      else if (/^[A-Z]/.test(word)) cls = 'tok-type';
    }
    out.push(cls ? <span key={key++} className={cls}>{text}</span> : text);
    last = start + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}
