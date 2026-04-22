/**
 * Markdown 内容渲染
 * 支持完整 Markdown：标题、列表、代码块、引用、表格、链接等
 * 使用 react-markdown + remark-gfm
 */

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/utils/cn';
import { GeneratedCasesCard } from './GeneratedCasesCard';
import { extractTestCasesJson } from '../utils/case-extractor';
import type { ParsedCaseItem } from './CasePreviewAndSavePanel';

interface MarkdownContentProps {
  content?: string | null;
  className?: string;
  /** 是否允许 HTML（富文本），默认 true */
  allowHtml?: boolean;
  /** 是否正在流式更新，用于优化表格渲染 */
  isStreaming?: boolean;
  /** JSON 用例预览回调（同步到预览 = 覆盖） */
  onJsonCasePreview?: (cases: ParsedCaseItem[]) => void;
  /** JSON 用例预览回调（追加到预览） */
  onJsonCaseAppend?: (cases: ParsedCaseItem[]) => void;
}

/**
 * 检测并隐藏流式更新时的不完整表格
 * 不完整的表格包括：
 * 1. 只有表头+分隔行，没有数据行
 * 2. 表格行不完整（不以 | 结尾，或列数不匹配）
 */
function hideIncompleteTables(content: string): string {
  if (!content) return content;

  const lines = content.split('\n');
  const result: string[] = [];
  let tableStartLine = -1;
  let tableLines: string[] = [];
  let hasHeader = false;
  let hasSeparator = false;
  let hasDataRow = false;
  let expectedColumns = 0;
  let isTableIncomplete = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // 完整的表格行：以 | 开头和结尾
    const isCompleteTableRow = /^\|.+\|$/.test(trimmed);
    // 不完整的表格行：以 | 开头但没有以 | 结尾（流式更新中）
    const isIncompleteTableRow = /^\|/.test(trimmed) && !/^\|.+\|$/.test(trimmed);
    const isSeparator = /^\|\s*[-:]+\s*\|/.test(trimmed);

    if (isCompleteTableRow || isIncompleteTableRow || isSeparator) {
      // 表格相关行
      if (tableStartLine === -1) {
        // 开始新表格
        tableStartLine = i;
        tableLines = [line];
        hasHeader = false;
        hasSeparator = false;
        hasDataRow = false;
        isTableIncomplete = false;
        expectedColumns = 0;

        if (isCompleteTableRow && !isSeparator) {
          // 表头行
          hasHeader = true;
          expectedColumns = (trimmed.match(/\|/g) || []).length - 1; // 减去开头的 |
        } else if (isSeparator) {
          // 分隔行（可能在表头之前）
          hasSeparator = true;
        }
      } else {
        // 继续当前表格
        tableLines.push(line);

        if (isIncompleteTableRow) {
          // 发现不完整的表格行，标记表格为不完整
          isTableIncomplete = true;
        } else if (isSeparator) {
          hasSeparator = true;
        } else if (isCompleteTableRow && hasSeparator) {
          // 分隔行之后的数据行
          const columnCount = (trimmed.match(/\|/g) || []).length - 1;
          // 检查列数是否匹配
          if (expectedColumns > 0 && columnCount !== expectedColumns) {
            isTableIncomplete = true;
          } else {
            hasDataRow = true;
            if (expectedColumns === 0) {
              expectedColumns = columnCount;
            }
          }
        } else if (isCompleteTableRow && !hasSeparator) {
          // 表头行（如果分隔行还没到）
          const columnCount = (trimmed.match(/\|/g) || []).length - 1;
          if (expectedColumns === 0) {
            expectedColumns = columnCount;
            hasHeader = true;
          } else if (columnCount !== expectedColumns) {
            isTableIncomplete = true;
          }
        }
      }
    } else {
      // 非表格行
      if (tableStartLine !== -1) {
        // 检查这行是否可能是表格内容的延续（流式更新时表格行可能被分割）
        // 如果这行包含 | 字符且表格已有分隔行，可能是表格行的延续部分
        const mightBeTableContinuation = trimmed.includes('|') && hasSeparator && !trimmed.startsWith('|');

        if (mightBeTableContinuation) {
          // 可能是表格行的延续（不完整的表格行），标记为不完整并继续收集
          isTableIncomplete = true;
          tableLines.push(line);
          // 不添加到 result，继续等待更多内容
          continue;
        }

        // 表格结束，检查是否完整
        if (isTableIncomplete || (hasHeader && hasSeparator && !hasDataRow)) {
          // 表格不完整，不添加到结果中（隐藏整个表格块）
        } else {
          // 表格完整，添加所有表格行
          result.push(...tableLines);
        }
        // 重置表格状态
        tableStartLine = -1;
        tableLines = [];
        hasHeader = false;
        hasSeparator = false;
        hasDataRow = false;
        expectedColumns = 0;
        isTableIncomplete = false;
      }
      // 添加非表格行到结果
      result.push(line);
    }
  }

  // 处理文件末尾的表格
  if (tableStartLine !== -1) {
    if (isTableIncomplete || (hasHeader && hasSeparator && !hasDataRow)) {
      // 表格不完整，不添加
    } else {
      result.push(...tableLines);
    }
  }

  return result.join('\n');
}

export function MarkdownContent({ content, className, allowHtml = true, isStreaming = false, onJsonCasePreview, onJsonCaseAppend }: MarkdownContentProps) {
  // 流式更新时，隐藏不完整的表格以避免渲染混乱
  const processedContent = useMemo(() => {
    let result = content ?? '';
    // 流式更新时，隐藏不完整的表格以避免渲染混乱
    if (isStreaming && result) {
      result = hideIncompleteTables(result);
    }
    if (result) {
      // 将松散编号列表（列表项之间有空行）转为紧凑列表
      // 空行会让 markdown 解析器在 <li> 内包裹 <p>，结合 list-inside 样式
      // 导致序号和内容分两行显示（如 "1." 和标题分开）
      result = result.replace(/\n\n(\d+\.\s)/g, '\n$1');
      // 修复 AI 生成的 "1.\n文字" 格式：数字+点单独成行，文字在下一行
      // 将 "1.\n文字" 合并为 "1. 文字"，避免序号和内容分离渲染
      result = result.replace(/^(\d+\.)\s*\n(?!\n)/gm, '$1 ');
    }
    return result;
  }, [content, isStreaming]);

  const components = useMemo(
    () => ({
      // 代码块：语法高亮 + JSON test_cases 拦截
      code({ node, inline, className: codeClassName, children, ...props }: any) {
        const match = /language-(\w+)/.exec(codeClassName || '');

        // 拦截 JSON 代码块：流式输出完毕后，如果内容包含 test_cases，渲染为卡片
        // 流式输出期间保持显示为普通代码高亮，避免卡片与代码块来回跳动
        if (!inline && match && match[1] === 'json' && !isStreaming) {
          const raw = String(children).replace(/\n$/, '');
          // 使用容错解析：支持修复尾逗号、注释等常见 AI 格式错误
          const testCases = extractTestCasesJson(raw);
          if (testCases && testCases.length > 0) {
            return (
              <GeneratedCasesCard
                cases={testCases}
                onPreview={onJsonCasePreview}
                onAppend={onJsonCaseAppend}
              />
            );
          }
        }

        return !inline && match ? (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="!my-4 !rounded-xl !text-[13px] !bg-muted/40 dark:!bg-muted/30 !border !border-border/40"
            customStyle={{ margin: 0 }}
            showLineNumbers={false}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className="px-1.5 py-0.5 rounded-md bg-muted/60 text-foreground text-[13px] font-mono" {...props}>
            {children}
          </code>
        );
      },
      // 链接：新窗口打开
      a({ href, children, ...props }: any) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            {...props}
          >
            {children}
          </a>
        );
      },
      // 表格：基础样式
      table({ children, ...props }: any) {
        return (
          <div className="my-4 overflow-x-auto rounded-xl border border-border/40 overflow-hidden">
            <table className="min-w-full divide-y divide-border/60 text-sm" {...props}>
              {children}
            </table>
          </div>
        );
      },
      thead({ children, ...props }: any) {
        return (
          <thead className="bg-muted/30 dark:bg-muted/20" {...props}>
            {children}
          </thead>
        );
      },
      th({ children, ...props }: any) {
        return (
          <th className="px-3 py-2 text-left font-medium text-foreground" {...props}>
            {children}
          </th>
        );
      },
      td({ children, ...props }: any) {
        return (
          <td className="px-3 py-2 border-t border-border" {...props}>
            {children}
          </td>
        );
      },
      tr({ children, ...props }: any) {
        return <tr className="border-b border-border last:border-0" {...props}>{children}</tr>;
      },
      // 列表
      ul({ children, ...props }: any) {
        return <ul className="my-2 list-disc list-inside space-y-1 pl-2" {...props}>{children}</ul>;
      },
      ol({ children, ...props }: any) {
        return <ol className="my-2 list-decimal list-inside space-y-1 pl-2" {...props}>{children}</ol>;
      },
      li({ children, ...props }: any) {
        return <li className="leading-relaxed" {...props}>{children}</li>;
      },
      // 引用
      blockquote({ children, ...props }: any) {
        return (
          <blockquote
            className="my-3 border-l-4 border-primary/40 pl-4 py-1.5 rounded-r bg-primary/5 dark:bg-primary/10 text-muted-foreground"
            {...props}
          >
            {children}
          </blockquote>
        );
      },
      // 标题
      h1: ({ children, ...props }: any) => <h1 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h1>,
      h2: ({ children, ...props }: any) => <h2 className="text-lg font-semibold mt-3 mb-2" {...props}>{children}</h2>,
      h3: ({ children, ...props }: any) => <h3 className="text-base font-semibold mt-3 mb-1" {...props}>{children}</h3>,
      h4: ({ children, ...props }: any) => <h4 className="text-sm font-semibold mt-2 mb-1" {...props}>{children}</h4>,
      // 段落与换行：break-keep 避免中文在词语中间错误断行
      p: ({ children, ...props }: any) => <p className="my-2 leading-relaxed break-keep" {...props}>{children}</p>,
      hr: () => <hr className="my-4 border-border" />,
      strong: ({ children, ...props }: any) => <strong className="font-semibold" {...props}>{children}</strong>,
      em: ({ children, ...props }: any) => <em className="italic" {...props}>{children}</em>,
    }),
    [isStreaming, onJsonCasePreview, onJsonCaseAppend]
  );

  const remarkPlugins = useMemo(() => [remarkGfm, remarkBreaks], []);
  const rehypePlugins = useMemo(() => (allowHtml ? [rehypeRaw] : []), [allowHtml]);

  if (!content?.trim()) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none text-foreground break-keep',
        'prose-p:my-2 prose-p:leading-[1.7] prose-p:break-keep prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight',
        'prose-code:text-[13px] prose-pre:bg-muted/40 prose-pre:rounded-xl prose-pre:border prose-pre:border-border/40',
        'prose-ul:my-2 prose-ol:my-2 prose-li:leading-[1.65] prose-li:break-keep prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r prose-blockquote:break-keep',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
