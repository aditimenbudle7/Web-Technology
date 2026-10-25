import { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import type { GeneratedFile } from '../model/javaGenerator';
import type { Issue } from '../model/validation';
import { highlightJava } from './highlight';

interface Props {
  files: GeneratedFile[];
  issues: Issue[];
  packageName: string;
  selectedClassId: string | null;
  onIssueClick: (targetId: string) => void;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadAllAsZip(files: GeneratedFile[], packageName: string) {
  const zip = new JSZip();
  const pkg = packageName.trim();
  const folder = pkg ? zip.folder(`src/${pkg.replace(/\./g, '/')}`)! : zip.folder('src')!;
  files.forEach((f) => folder.file(f.fileName, f.code));
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'uml-java-code.zip');
}

export default function CodePanel({ files, issues, packageName, selectedClassId, onIssueClick }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Follow the class selected on the canvas.
  useEffect(() => {
    if (selectedClassId) setActiveId(selectedClassId);
  }, [selectedClassId]);

  const active = files.find((f) => f.classId === activeId) ?? files[0];
  const highlighted = useMemo(() => (active ? highlightJava(active.code) : null), [active]);
  const lineCount = active ? active.code.split('\n').length - 1 : 0;

  const copy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked - user can still select the text */
    }
  };

  const errors = issues.filter((i) => i.level === 'error').length;

  return (
    <div className="code-panel">
      {issues.length > 0 && (
        <details className={`issues ${errors ? 'has-errors' : ''}`} open>
          <summary>{errors ? `${errors} error(s)` : 'No errors'}, {issues.length - errors} warning(s)</summary>
          <ul>
            {issues.map((i, n) => (
              <li key={n} className={i.level}>
                <button className="link-btn" onClick={() => i.targetId && onIssueClick(i.targetId)}>
                  {i.level === 'error' ? '✖' : '⚠'} {i.message}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {files.length === 0 ? (
        <p className="muted empty-code">Add a class to see the generated Java code.</p>
      ) : (
        <>
          <div className="file-tabs" role="tablist">
            {files.map((f) => (
              <button key={f.classId} role="tab" aria-selected={f.classId === active?.classId}
                className={`file-tab ${f.classId === active?.classId ? 'active' : ''}`}
                onClick={() => setActiveId(f.classId)}>
                {f.fileName}
              </button>
            ))}
          </div>
          <div className="code-actions">
            <button className="btn btn-sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
            <button className="btn btn-sm" onClick={() => active && downloadBlob(new Blob([active.code], { type: 'text/x-java' }), active.fileName)}>
              Download {active?.fileName}
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => downloadAllAsZip(files, packageName)}>
              Download all (.zip)
            </button>
          </div>
          <div className="code-view">
            <pre className="gutter" aria-hidden="true">
              {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
            </pre>
            <pre className="code"><code>{highlighted}</code></pre>
          </div>
        </>
      )}
    </div>
  );
}
