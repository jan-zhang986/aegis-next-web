import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SQL_KEYWORDS = [
  'AUTO_INCREMENT', 'DATETIME', 'TIMESTAMP', 'VARBINARY', 'MEDIUMBLOB', 'LONGBLOB',
  'TINYBLOB', 'MEDIUMTEXT', 'LONGTEXT', 'TINYTEXT', 'SMALLINT', 'MEDIUMINT',
  'TINYINT', 'REFERENCES', 'CONSTRAINT', 'COLLATE', 'CASCADE', 'RESTRICT',
  'CREATE', 'TABLE', 'ALTER', 'INDEX', 'VIEW', 'SCHEMA', 'EXISTS', 'DEFAULT',
  'PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK', 'ENGINE', 'CHARSET', 'COMMENT',
  'UPDATE', 'DELETE', 'ACTION', 'INTO', 'VALUES', 'SELECT', 'FROM', 'WHERE',
  'INSERT', 'INNER', 'LEFT', 'RIGHT', 'JOIN', 'GROUP', 'ORDER', 'HAVING',
  'LIMIT', 'OFFSET', 'VARCHAR', 'DECIMAL', 'BOOLEAN', 'BIGINT', 'BINARY',
  'TRIGGER', 'DATABASE', 'PROCEDURE', 'FUNCTION', 'DROP', 'IF', 'NOT', 'NULL',
  'ON', 'SET', 'NO', 'AS', 'BY', 'INT', 'TEXT', 'DATE', 'FLOAT', 'DOUBLE',
  'BLOB', 'JSON', 'ENUM', 'CHAR', 'YEAR', 'TIME', 'BIT',
];

function highlightKeywordsAndNumbers(text: string, keyPrefix: string): (string | JSX.Element)[] {
  if (!text) return [];
  const parts: (string | JSX.Element)[] = [];
  let idx = 0;
  const k = () => `${keyPrefix}-${idx++}`;
  const combinedRegex = new RegExp(
    `\\b(${SQL_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b|\\b\\d+\\.?\\d*\\b`,
    'gi'
  );
  let lastIndex = 0;
  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.substring(lastIndex, match.index);
      if (before) parts.push(before);
    }
    const m = match[0];
    const isKw = SQL_KEYWORDS.some((x) => x.toUpperCase() === m.toUpperCase());
    if (isKw) parts.push(<span key={k()} className="text-blue-400 font-semibold">{m}</span>);
    else parts.push(<span key={k()} className="text-yellow-400">{m}</span>);
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts.length > 0 ? parts : [text];
}

function highlightLine(text: string, keyPrefix: string): (string | JSX.Element)[] {
  if (!text) return [' '];
  let idx = 0;
  const k = () => `${keyPrefix}-${idx++}`;
  const commentMatch = text.match(/^(.*?)(--.*$|#.*$)/);
  if (commentMatch) {
    const [, before, comment] = commentMatch;
    const parts: (string | JSX.Element)[] = [];
    if (before) parts.push(...highlightLine(before, `${keyPrefix}-b`));
    parts.push(<span key={k()} className="text-slate-500 italic">{comment}</span>);
    return parts;
  }
  const parts: (string | JSX.Element)[] = [];
  const stringRegex = /(['"])(?:(?=(\\?))\2.)*?\1/g;
  let lastIndex = 0;
  let m;
  while ((m = stringRegex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(...highlightKeywordsAndNumbers(text.substring(lastIndex, m.index), k()));
    }
    parts.push(<span key={k()} className="text-green-400">{m[0]}</span>);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(...highlightKeywordsAndNumbers(text.substring(lastIndex), k()));
  return parts.length > 0 ? parts : [text];
}

export interface SqlCodeBlockProps {
  sqlContent: string;
  onCopy: (content: string) => Promise<boolean>;
}

export function SqlCodeBlock({ sqlContent, onCopy }: SqlCodeBlockProps) {
  const handleCopy = async () => {
    if (!sqlContent) return;
    const ok = await onCopy(sqlContent);
    if (ok) toast.success('SQL 已复制到剪贴板');
    else toast.error('复制失败，请手动复制');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div
          className="text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition-colors inline-flex items-center gap-1"
          onClick={handleCopy}
          title="点击复制 SQL"
        >
          <Copy className="w-3 h-3" />
          <span>点击复制 SQL</span>
        </div>
        {sqlContent && (
          <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs">
            <Copy className="w-3 h-3 mr-1" />
            复制
          </Button>
        )}
      </div>
      <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
          <span className="text-xs text-slate-400 font-medium">SQL</span>
          <span className="text-xs text-slate-500 font-mono">
            {sqlContent ? `${sqlContent.split('\n').length} 行` : '0 行'}
          </span>
        </div>
        <div className="relative">
          {sqlContent && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800 border-r border-slate-700 text-right py-4">
              <div className="text-xs text-slate-500 font-mono leading-6">
                {sqlContent.split('\n').map((_, i) => (
                  <div key={i} className="px-2">{i + 1}</div>
                ))}
              </div>
            </div>
          )}
          <div className={sqlContent ? 'pl-12 pr-4 py-4 overflow-x-auto' : 'px-4 py-4'}>
            <pre className="text-sm font-mono leading-6 text-slate-100 whitespace-pre">
              <code>
                {sqlContent ? (
                  sqlContent.split('\n').map((line, i) => <div key={i}>{highlightLine(line, `L${i}`)}</div>)
                ) : (
                  <span className="text-slate-500 italic">暂无 SQL 内容</span>
                )}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
