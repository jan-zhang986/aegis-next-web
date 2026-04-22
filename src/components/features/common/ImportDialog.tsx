import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle } from 'lucide-react';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: ImportData) => void;
  onImportSwagger?: (groups: SwaggerGroup[]) => void;
}

export interface ImportData {
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  body?: string;
  params?: { key: string; value: string }[];
}

export interface SwaggerEndpoint {
  method: string;
  path: string;
  fullUrl: string;
  headers: { key: string; value: string }[];
  params?: { key: string; value: string }[];
  body?: string;
  summary?: string;
  operationId?: string;
}

export interface SwaggerGroup {
  name: string;
  endpoints: SwaggerEndpoint[];
}

export function ImportDialog({ open, onClose, onImport, onImportSwagger }: ImportDialogProps) {
  const [curlCommand, setCurlCommand] = useState('');
  const [error, setError] = useState('');
  const justOpenedRef = useRef(false);
  const previousOpenRef = useRef(false);

  // 监听 open 状态变化
  useEffect(() => {
    // 如果从 false 变为 true，标记为刚打开
    if (open && !previousOpenRef.current) {
      justOpenedRef.current = true;
      // 300ms 后重置，允许正常关闭（增加时间窗口，确保事件处理完成）
      const timer = setTimeout(() => {
        justOpenedRef.current = false;
      }, 300);
      previousOpenRef.current = open;
      return () => clearTimeout(timer);
    } else if (!open && previousOpenRef.current) {
      // 如果从 true 变为 false，重置 previousOpenRef
      previousOpenRef.current = false;
    }
  }, [open]);

  // 辅助函数：手动解析引号内的内容，正确处理转义字符
  const parseQuotedString = (command: string, startIndex: number, quoteChar: string): { content: string; endIndex: number } => {
    let i = startIndex;
    let inEscape = false;
    let content = '';
    
    while (i < command.length) {
      const char = command[i];
      
      if (inEscape) {
        content += char;
        inEscape = false;
      } else if (char === '\\') {
        inEscape = true;
        content += char; // 保留转义字符，稍后处理
      } else if (char === quoteChar) {
        // 找到匹配的结束引号
        return { content, endIndex: i };
      } else {
        content += char;
      }
      i++;
    }
    
    // 如果没有找到结束引号，返回已解析的内容
    return { content, endIndex: i };
  };

  const parseCurl = (curl: string): ImportData | null => {
    try {
      setError('');

      // 清理命令：处理换行符和反斜杠（多行格式）
      let command = curl.trim();
      
      // 处理 Windows 格式的转义字符：
      // 1. 将 ^\^" 转换为 \"（Windows 转义的引号，需要先处理）
      // 2. 将 ^" 转换为 "（Windows 的引号转义）
      // 3. 将 ^$ 转换为 $（Windows 转义的美元符号）
      command = command.replace(/\^\\\^"/g, '\\"'); // 先处理转义的引号
      command = command.replace(/\^"/g, '"'); // 再处理普通引号
      command = command.replace(/\^\$/g, '$'); // 处理转义的美元符号
      
      // 处理 Windows 行继续符：将行尾的 ^ 后跟换行符转换为空格
      // 匹配模式：行尾的 ^ 后面可能有空格，然后是换行符
      command = command.replace(/\^\s*\r?\n\s*/g, ' ');
      
      // 移除行尾的反斜杠和换行符，合并为单行（Unix/Linux 格式）
      command = command.replace(/\\\s*\r?\n\s*/g, ' ');
      
      // 清理多余的空格
      command = command.replace(/\s+/g, ' ').trim();

      // 移除 curl 关键字
      command = command.replace(/^curl\s+/i, '');

      // 先检查是否有 body 数据（在header之前检查，用于推断方法）
      const hasData = /(?:-d|--data(?:-raw|-binary|-urlencode)?)\s+(['"])/.test(command);

      // 提取方法（支持 -X 和 --request）
      const methodMatch = command.match(/(?:-X|--request)\s+(\w+)/i);
      let method = methodMatch ? methodMatch[1].toUpperCase() : (hasData ? 'POST' : 'GET');

      // 先提取body（在header之前提取，避免干扰）
      // 支持 -d, --data, --data-raw, --data-binary, --data-urlencode
      let body: string | undefined = undefined;
      let dataParamMatch = command.match(/(?:-d|--data(?:-raw|-binary|-urlencode)?)\s+(['"])/);
      if (dataParamMatch) {
        const quoteChar = dataParamMatch[1];
        const startIndex = dataParamMatch.index! + dataParamMatch[0].length;
        const { content: bodyContent, endIndex } = parseQuotedString(command, startIndex, quoteChar);
        
        if (bodyContent) {
          // 处理 Windows 转义字符（在引号内，可能还有未转换的）
          // 1. 先处理 ^\^" -> \"（如果还有未转换的）
          let processedBody = bodyContent.replace(/\^\\\^"/g, '\\"');
          // 2. 再处理 ^" -> "（如果还有未转换的）
          processedBody = processedBody.replace(/\^"/g, '"');
          // 3. 处理 ^$ -> $（如果还有未转换的）
          processedBody = processedBody.replace(/\^\$/g, '$');
          // 4. 移除剩余的单独 ^ 字符（比如 ^{ -> {，^} -> }，^, -> ,）
          processedBody = processedBody.replace(/\^/g, '');
          
          // 处理转义字符：\n -> 换行，\t -> tab，\" -> "，\' -> '
          body = processedBody.replace(/\\(.)/g, (_match, char) => {
            if (char === 'n') return '\n';
            if (char === 't') return '\t';
            if (char === 'r') return '\r';
            if (char === quoteChar) return quoteChar; // \" -> " 或 \' -> '
            return char; // 其他转义字符保持原样
          });
        }
      }

      // 提取headers - 使用手动解析方式，正确处理转义字符
      const headers: { key: string; value: string }[] = [];
      const headerRegex = /(?:-H|--header)\s+(['"])/g;
      let headerMatch;
      while ((headerMatch = headerRegex.exec(command)) !== null) {
        const quoteChar = headerMatch[1];
        const startIndex = headerMatch.index! + headerMatch[0].length;
        const { content: headerStr } = parseQuotedString(command, startIndex, quoteChar);
        
        // 处理转义字符
        let processedHeader = headerStr.replace(/\\(.)/g, (_match, char) => {
          if (char === 'n') return '\n';
          if (char === 't') return '\t';
          if (char === 'r') return '\r';
          return char; // 其他转义字符保持原样，如 \" -> "
        });
        
        const colonIndex = processedHeader.indexOf(':');
        if (colonIndex > 0) {
          const key = processedHeader.substring(0, colonIndex).trim();
          const value = processedHeader.substring(colonIndex + 1).trim();
          headers.push({
            key: key,
            value: value
          });
        }
      }

      // 提取Cookie（-b 参数），转换为Cookie header
      // 使用更健壮的方式：找到 -b 参数，然后手动解析引号内的内容
      let cookieValue = '';
      let cookieParamMatch = command.match(/-b\s+(['"])/);
      if (cookieParamMatch) {
        const quoteChar = cookieParamMatch[1];
        const startIndex = cookieParamMatch.index! + cookieParamMatch[0].length;
        const { content: cookieContent } = parseQuotedString(command, startIndex, quoteChar);
        
        // 处理转义字符
        cookieValue = cookieContent.replace(/\\(.)/g, (_match, char) => {
          if (char === 'n') return '\n';
          if (char === 't') return '\t';
          if (char === 'r') return '\r';
          return char; // 其他转义字符保持原样，如 \" -> "
        });
      }
      
      if (cookieValue) {
        // 将cookie添加到headers中，key为Cookie
        headers.push({
          key: 'Cookie',
          value: cookieValue
        });
      }

      // 提取URL - 移除已匹配的header和body部分后，URL通常是最后剩余的部分
      // 需要从命令中移除已匹配的部分，然后提取URL
      let url = '';

      // 收集所有需要移除的范围（从后往前移除，避免索引变化）
      interface RemovalRange {
        start: number;
        end: number;
      }
      const removals: RemovalRange[] = [];
      
      // 收集所有header匹配项的范围
      const headerRegexForRemoval = /(?:-H|--header)\s+(['"])/g;
      let headerMatchForRemoval;
      while ((headerMatchForRemoval = headerRegexForRemoval.exec(command)) !== null) {
        const quoteChar = headerMatchForRemoval[1];
        const startIndex = headerMatchForRemoval.index!;
        const { endIndex } = parseQuotedString(command, headerMatchForRemoval.index! + headerMatchForRemoval[0].length, quoteChar);
        removals.push({ start: startIndex, end: endIndex + 1 });
      }
      
      // 收集cookie匹配项的范围
      if (cookieParamMatch) {
        const quoteChar = cookieParamMatch[1];
        const startIndex = cookieParamMatch.index!;
        const { endIndex } = parseQuotedString(command, cookieParamMatch.index! + cookieParamMatch[0].length, quoteChar);
        removals.push({ start: startIndex, end: endIndex + 1 });
      }
      
      // 收集body匹配项的范围
      if (dataParamMatch) {
        const quoteChar = dataParamMatch[1];
        const startIndex = dataParamMatch.index!;
        const { endIndex } = parseQuotedString(command, dataParamMatch.index! + dataParamMatch[0].length, quoteChar);
        removals.push({ start: startIndex, end: endIndex + 1 });
      }
      
      // 收集方法匹配项的范围
      if (methodMatch) {
        removals.push({ start: methodMatch.index!, end: methodMatch.index! + methodMatch[0].length });
      }
      
      // 从后往前移除，避免索引变化
      removals.sort((a, b) => b.start - a.start);
      let tempCommand = command;
      for (const removal of removals) {
        tempCommand = tempCommand.substring(0, removal.start) + tempCommand.substring(removal.end);
      }
      
      // 清理多余空格
      tempCommand = tempCommand.trim().replace(/\s+/g, ' ');

      // 从清理后的命令中提取URL
      // 先尝试匹配引号内的URL（单引号或双引号）
      const singleQuoteUrlMatch = tempCommand.match(/'([^']+)'/);
      const doubleQuoteUrlMatch = tempCommand.match(/"([^"]+)"/);

      if (singleQuoteUrlMatch) {
        url = singleQuoteUrlMatch[1].trim();
      } else if (doubleQuoteUrlMatch) {
        url = doubleQuoteUrlMatch[1].trim();
      } else {
        // 如果没有引号，匹配第一个看起来像URL的部分（包括路径参数和查询参数）
        // 改进正则：匹配完整的 URL，包括路径参数（如 /api/users/123）和查询参数（如 ?key=value）
        // 匹配到第一个空格、引号或命令结束为止，确保路径参数不被截断
        const urlMatch = tempCommand.match(/(https?:\/\/[^\s'"]+(?:\?[^\s'"]*)?)/);
        if (urlMatch) {
          url = urlMatch[1].trim();
        } else {
          // 如果上面的正则没匹配到，尝试更宽松的匹配（可能 URL 后面有引号或其他字符）
          const looseMatch = tempCommand.match(/(https?:\/\/[^\s]+)/);
          if (looseMatch) {
            // 提取 URL，但需要处理可能的查询参数和哈希
            let extractedUrl = looseMatch[1].trim();
            // 移除可能的尾随字符（如果不是 URL 的一部分）
            // 保留查询参数和哈希片段，以及路径参数
            extractedUrl = extractedUrl.replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=%]+$/, '');
            url = extractedUrl;
          }
        }
      }

      // 验证URL是否有效
      if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        throw new Error('未找到有效的URL');
      }

      // 保存原始 URL（包含路径参数和查询参数）
      const originalUrl = url;

      // 从URL中提取查询参数（只提取 ? 后面的查询参数，不影响路径参数）
      const params: { key: string; value: string }[] = [];
      try {
        const urlObj = new URL(url);
        // 提取查询参数（query parameters），这些是 ?key=value 格式的参数
        urlObj.searchParams.forEach((value, key) => {
          params.push({
            key: key,
            value: value
          });
        });
        // 移除URL中的查询参数部分（? 及其后面的内容），但保留路径参数（路径中的部分）
        // 例如：/api/users/123?page=1 -> /api/users/123
        // 路径参数（如 /api/users/123 中的 123）会保留在 pathname 中，不会被移除
        urlObj.search = '';
        url = urlObj.toString();
        // 注意：不要移除路径末尾的斜杠，因为可能是路径的一部分
        // 路径参数应该完整保留在 URL 路径中
      } catch (e) {
        // 如果URL解析失败，尝试手动提取查询参数
        const queryMatch = url.match(/\?([^#]*)/);
        if (queryMatch) {
          const queryString = queryMatch[1];
          queryString.split('&').forEach(param => {
            const [key, value = ''] = param.split('=');
            if (key) {
              params.push({
                key: decodeURIComponent(key),
                value: decodeURIComponent(value)
              });
            }
          });
          // 移除查询参数部分（? 及其后面的内容），但保留路径参数
          url = url.split('?')[0];
        }
      }

      // 调试日志：输出原始 URL 和解析后的 URL，确保路径参数没有被丢失
      console.log('URL 解析:', {
        originalUrl,
        parsedUrl: url,
        pathname: new URL(url).pathname,
        paramsCount: params.length
      });

      // 调试日志
      console.log('解析结果:', { method, url, headersCount: headers.length, paramsCount: params.length, body: body ? (body as string).substring(0, 100) + '...' : undefined });

      return { method, url, headers, params, body };
    } catch (err) {
      console.error('解析错误:', err);
      setError(err instanceof Error ? err.message : '解析失败');
      return null;
    }
  };

  const handleCurlImport = () => {
    const result = parseCurl(curlCommand);
    if (result) {
      onImport(result);
      setCurlCommand('');
      setError('');
      onClose();
    } else {
      // 如果解析失败，错误信息已经在 parseCurl 中设置
      // 这里不需要额外处理，错误会显示在界面上
    }
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // 只有当对话框要关闭时才调用 onClose
      if (!isOpen) {
        // 如果刚打开就被关闭，可能是按钮点击事件冒泡，忽略这次关闭
        if (justOpenedRef.current) {
          return;
        }
        onClose();
      }
    }}>
      <DialogContent
        className="max-w-3xl bg-white flex flex-col"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '600px',
          maxHeight: '90vh',
          maxWidth: '48rem',
          width: 'calc(100% - 2rem)',
          zIndex: 10000,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        } as React.CSSProperties}
        onPointerDownOutside={(e) => {
          // 如果刚打开，阻止点击外部关闭（防止按钮点击冒泡）
          if (justOpenedRef.current) {
            e.preventDefault();
            return;
          }
          // 默认行为：点击外部关闭对话框
        }}
        onInteractOutside={(e) => {
          // 如果刚打开，阻止外部交互关闭（防止按钮点击冒泡）
          if (justOpenedRef.current) {
            e.preventDefault();
            return;
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            导入接口
          </DialogTitle>
          <DialogDescription className="sr-only">
            从 cURL 命令导入接口配置
          </DialogDescription>
        </DialogHeader>

        <div className="w-full flex flex-col flex-1 min-h-0">
          {/* cURL Import */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="space-y-2">
                <Label>粘贴cURL命令</Label>
                <Textarea
                  value={curlCommand}
                  onChange={(e) => setCurlCommand(e.target.value)}
                  placeholder={`curl 'https://api.example.com/users' -H 'Authorization: Bearer token' -H 'Content-Type: application/json' --data-raw '{"name":"test"}'`}
                  className="font-mono text-sm h-[300px] resize-none overflow-y-auto w-full break-words"
                  style={{ maxHeight: '300px', minHeight: '300px', wordBreak: 'break-all', overflowWrap: 'break-word' }}
                />
                <p className="text-xs text-gray-500">
                  支持从浏览器开发者工具中复制的cURL命令
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700">示例cURL命令：</p>
                <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto font-mono text-gray-800 whitespace-pre-wrap break-words">
                  <code>{`curl 'https://api.example.com/users' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  --data-raw '{"name":"John","email":"john@example.com"}'`}</code>
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 flex-shrink-0">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleCurlImport} disabled={!curlCommand.trim()}>
                导入
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

