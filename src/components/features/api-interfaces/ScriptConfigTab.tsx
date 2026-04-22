import { Plus, Trash2, Maximize, Minimize, Play, Copy, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { useState, useEffect, useRef, useCallback } from "react";
import { http } from "@/utils/request";
import { runDataCodeAsync } from "@/services/data-forge-run";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trackAction } from '@/utils/analytics';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserParam {
  required: boolean;
  paramName: string;
  paramType: string;
  paramLabel: string;
  description?: string;
  defaultValue?: string;
  options?: string[];
}

interface ScriptConfigTabProps {
  userParams: UserParam[];
  chainCallTemplate: string;
  scriptContent: string;
  scriptId: string | null;
  isFullscreen: boolean;
  paramTypes: Array<{ value: string; label: string }>;
  enableGlobalsVariables: boolean;
  tags: string[];
  onUserParamsChange: (params: UserParam[]) => void;
  onChainCallTemplateChange: (value: string) => void;
  onScriptContentChange: (value: string) => void;
  onFullscreenChange: (value: boolean) => void;
  onAddUserParam: () => void;
  onUpdateUserParam: (index: number, field: keyof UserParam, value: any) => void;
  onRemoveUserParam: (index: number) => void;
  onEnableGlobalsVariablesChange: (enabled: boolean) => void;
  onTagsChange: (tags: string[]) => void;
}

export function ScriptConfigTab({
  userParams,
  chainCallTemplate,
  scriptContent,
  scriptId,
  isFullscreen,
  paramTypes,
  enableGlobalsVariables,
  tags,
  onUserParamsChange,
  onChainCallTemplateChange,
  onScriptContentChange,
  onFullscreenChange,
  onAddUserParam,
  onUpdateUserParam,
  onRemoveUserParam,
  onEnableGlobalsVariablesChange,
  onTagsChange,
}: ScriptConfigTabProps) {
  const [debugResult, setDebugResult] = useState<string>('');
  const [isDebugging, setIsDebugging] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const fullscreenEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const fullscreenEditorContainerRef = useRef<HTMLDivElement | null>(null);
  const generateParamsRef = useRef<(text: string) => void>();

  // 检测暗色模式
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // 监听暗色模式变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleDebugRun = async () => {
    if (!scriptContent.trim()) {
      toast.error('请先编写Python脚本');
      return;
    }

    // 埋点：记录执行开始时间
    const executeStartTime = Date.now();
    const finalScriptId = scriptId || `DATA${new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]}`;
    const userEmail = localStorage.getItem('currentemail') || '';

    try {
      setIsDebugging(true);
      setDebugResult('');

      if (!userEmail) {
        toast.error('无法获取用户邮箱，请先登录');
        setIsDebugging(false);
        return;
      }

      const requestData = {
        textCode: scriptContent.trim(),
        bizCode: finalScriptId,
        author: userEmail,
      };

      const result = await runDataCodeAsync(requestData, (msg) => setDebugResult(msg));

      const outputContent = result.output || result.message;
      if (outputContent) {
        setDebugResult(outputContent);
      } else {
        setDebugResult(result.success ? '执行完成' : result.message || '执行失败');
      }

      if (result.success) {
        toast.success('脚本执行成功');
      } else {
        toast.error(result.message || '脚本执行失败');
      }

      const executeEndTime = Date.now();
      const duration = executeEndTime - executeStartTime;
      trackAction('SCRIPT', {
        protocol: 'SCRIPT',
        page: 'SCRIPT',
        action: 'debug_execute',
        scriptId: finalScriptId,
        success: result.success,
        duration: duration,
        email: userEmail || undefined,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '执行失败';
      setDebugResult(`错误: ${errorMessage}\n${error?.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`);
      toast.error(`执行失败: ${errorMessage}`);

      // 埋点：记录执行失败事件
      const executeEndTime = Date.now();
      const duration = executeEndTime - executeStartTime;
      trackAction('SCRIPT', {
        protocol: 'SCRIPT',
        page: 'SCRIPT',
        action: 'debug_execute',
        scriptId: finalScriptId,
        success: false,
        error: errorMessage,
        duration: duration,
        email: userEmail || undefined,
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const copyDebugResult = () => {
    navigator.clipboard.writeText(debugResult).then(
      () => toast.success('已复制到剪贴板'),
      () => toast.error('复制失败'),
    );
  };

  // 解析 Python 函数签名，提取函数名和参数名
  const parsePythonFunctionSignature = (text: string): { functionName: string; params: string[] } => {
    if (!text || !text.trim()) {
      return { functionName: '', params: [] };
    }

    // 移除注释
    let cleaned = text
      .replace(/#.*$/gm, '') // 移除行注释
      .replace(/""".*?"""/gs, '') // 移除多行字符串注释
      .replace(/'''.*?'''/gs, ''); // 移除多行字符串注释

    // 匹配函数定义：def function_name(...):
    // 使用更灵活的正则，支持多行，同时捕获函数名
    // 注意：[\s\S]*? 会匹配包括换行符在内的所有字符，直到遇到第一个 )
    let funcMatch = cleaned.match(/def\s+(\w+)\s*\(([\s\S]*?)\)/);
    
    // 如果没有匹配到，尝试匹配不带 def 的情况（用户可能只选中了函数名和参数）
    if (!funcMatch) {
      funcMatch = cleaned.match(/(\w+)\s*\(([\s\S]*?)\)/);
    }
    
    if (!funcMatch) {
      return { functionName: '', params: [] };
    }

    const functionName = funcMatch[1].trim();
    let paramsStr = funcMatch[2].trim();
    
    if (!paramsStr) {
      return { functionName, params: [] };
    }

    // 规范化空白：将换行和多个空格替换为单个空格
    paramsStr = paramsStr.replace(/\s+/g, ' ').trim();

    // 分割参数，处理多行参数和默认值
    const params: string[] = [];
    let currentParam = '';
    let parenDepth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < paramsStr.length; i++) {
      const char = paramsStr[i];
      const prevChar = i > 0 ? paramsStr[i - 1] : '';

      // 处理字符串
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        currentParam += char;
        continue;
      }

      if (inString) {
        currentParam += char;
        continue;
      }

      // 处理括号嵌套（用于类型注解和默认值中的元组/列表）
      if (char === '(' || char === '[' || char === '{') {
        parenDepth++;
        currentParam += char;
        continue;
      }
      if (char === ')' || char === ']' || char === '}') {
        parenDepth--;
        currentParam += char;
        continue;
      }

      // 在顶层且遇到逗号时，保存当前参数
      if (parenDepth === 0 && char === ',') {
        const paramName = currentParam
          .split(':')[0] // 移除类型注解
          .split('=')[0] // 移除默认值
          .trim();
        if (paramName) {
          params.push(paramName);
        }
        currentParam = '';
        continue;
      }

      currentParam += char;
    }

    // 处理最后一个参数
    if (currentParam.trim()) {
      const paramName = currentParam
        .split(':')[0] // 移除类型注解
        .split('=')[0] // 移除默认值
        .trim();
      if (paramName) {
        params.push(paramName);
      }
    }

    const filteredParams = params.filter(p => p && !p.startsWith('*')); // 过滤掉 *args 和 **kwargs
    return { functionName, params: filteredParams };
  };

  // 从函数签名生成用户参数
  const generateParamsFromFunctionSignature = useCallback((selectedText: string) => {
    const { functionName, params: paramNames } = parsePythonFunctionSignature(selectedText);
    
    if (!functionName) {
      toast.error('未能解析出函数名。请确保选中了函数定义，格式如：def main(...) 或 main(...)');
      return;
    }
    
    if (paramNames.length === 0) {
      toast.error('未能解析出函数参数。请确保选中了包含参数列表的函数定义');
      return;
    }

    // 如果链式调用模板为空，自动填充为 函数名({{userParams}})
    if (!chainCallTemplate.trim() && functionName) {
      const template = `${functionName}({{userParams}})`;
      onChainCallTemplateChange(template);
    }

    // 生成新的参数列表
    const newParams: UserParam[] = paramNames.map((paramName) => {
      // 检查是否已存在同名参数
      const existingParam = userParams.find(p => p.paramName === paramName);
      if (existingParam) {
        return existingParam; // 保留现有配置
      }

      // 生成新参数
      return {
        required: true,
        paramName: paramName,
        paramType: 'str', // 默认类型为字符串
        paramLabel: paramName,
        description: paramName,
        defaultValue: '',
      };
    });

    // 合并现有参数和新参数（避免重复）
    const existingParamNames = new Set(userParams.map(p => p.paramName));
    const mergedParams = [
      ...userParams, // 保留现有参数
      ...newParams.filter(p => !existingParamNames.has(p.paramName)), // 添加新参数
    ];

    onUserParamsChange(mergedParams);
    const newParamCount = newParams.filter(p => !existingParamNames.has(p.paramName)).length;
    const message = functionName && !chainCallTemplate.trim() 
      ? `已生成 ${newParamCount} 个参数，并自动填充链式调用模板为 ${functionName}({{userParams}})`
      : `已生成 ${newParamCount} 个参数`;
    toast.success(message);
  }, [userParams, onUserParamsChange, chainCallTemplate, onChainCallTemplateChange]);

  // 更新 ref，确保右键菜单能访问最新的函数
  useEffect(() => {
    generateParamsRef.current = generateParamsFromFunctionSignature;
  }, [generateParamsFromFunctionSignature]);


  return (
    <TabsContent value="config" className="flex-none m-0 h-full overflow-y-auto">
      <div className="px-8 pt-6 pb-8 space-y-8">

        {/* 参数配置区域 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">用户参数配置</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                配置脚本执行所需的参数（userParams）
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50/50">
                <Checkbox
                  id="enableGlobalsVariables"
                  checked={enableGlobalsVariables}
                  onCheckedChange={(checked) => onEnableGlobalsVariablesChange(checked === true)}
                />
                <Label
                  htmlFor="enableGlobalsVariables"
                  className="text-sm font-medium text-gray-700 cursor-pointer select-none whitespace-nowrap"
                >
                  环境变量启用
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={onAddUserParam}
              >
                <Plus className="w-4 h-4" />
                添加参数
              </Button>
            </div>
          </div>

          <div className="overflow-hidden">
            {userParams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <div className="w-6 h-6 border-2 border-gray-300 border-dashed rounded-full" />
                </div>
                <p className="text-sm">暂无参数配置</p>
                <Button
                  variant="link"
                  size="sm"
                  className="text-blue-600 mt-1"
                  onClick={onAddUserParam}
                >
                  点击添加
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="w-16 text-center h-10 text-xs font-semibold text-gray-600">必填</TableHead>
                    <TableHead className="w-[20%] h-10 text-xs font-semibold text-gray-600">参数名称 (中文)</TableHead>
                    <TableHead className="w-[15%] h-10 text-xs font-semibold text-gray-600">参数类型</TableHead>
                    <TableHead className="w-[20%] h-10 text-xs font-semibold text-gray-600">参数名 (Code)</TableHead>
                    <TableHead className="w-[30%] h-10 text-xs font-semibold text-gray-600">默认值</TableHead>
                    <TableHead className="w-10 h-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userParams.map((param, index) => (
                    <TableRow key={index} className="group border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                      <TableCell className="text-center py-2">
                        <Checkbox
                          checked={param.required}
                          onCheckedChange={(checked) =>
                            onUpdateUserParam(index, 'required', checked === true)
                          }
                          className="translate-y-0.5"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          value={param.description || ''}
                          onChange={(e) =>
                            onUpdateUserParam(index, 'description', e.target.value)
                          }
                          placeholder="例如: 订单ID"
                          className="h-8 text-sm border border-transparent bg-gray-50/50 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all px-2 -mx-2"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Select
                          value={param.paramType}
                          onValueChange={(value) =>
                            onUpdateUserParam(index, 'paramType', value)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm border border-transparent bg-gray-50/50 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all px-2 -mx-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paramTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          value={param.paramName}
                          onChange={(e) =>
                            onUpdateUserParam(index, 'paramName', e.target.value)
                          }
                          placeholder="例如: order_id"
                          className="h-8 text-sm font-mono border border-transparent bg-gray-50/50 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all px-2 -mx-2"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        {param.paramType === 'bool' ? (
                          <Select
                            value={(() => {
                              const v = param.defaultValue;
                              if (v === true || v === 'true' || v === 'True') return 'True';
                              if (v === false || v === 'false' || v === 'False') return 'False';
                              return v && String(v).trim() ? (String(v).toLowerCase() === 'true' ? 'True' : 'False') : 'False';
                            })()}
                            onValueChange={(value) =>
                              onUpdateUserParam(index, 'defaultValue', value)
                            }
                          >
                            <SelectTrigger className="h-8 text-sm border border-transparent bg-gray-50/50 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all px-2 -mx-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="True">True</SelectItem>
                              <SelectItem value="False">False</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={param.defaultValue || ''}
                            onChange={(e) =>
                              onUpdateUserParam(index, 'defaultValue', e.target.value)
                            }
                            placeholder="可选..."
                            className="h-8 text-sm border border-transparent bg-gray-50/50 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all px-2 -mx-2"
                          />
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <button
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-red-50"
                          onClick={() => onRemoveUserParam(index)}
                          title="删除参数"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="mb-3 space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                链式调用模板
                <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-gray-500">
                配置调用模板，用 <code className="bg-gray-100 px-1 rounded text-xs text-blue-600 font-mono">{"{{userParams}}"}</code> 表示参数
              </p>
            </div>
            <div className="relative">
              <Textarea
                value={chainCallTemplate}
                onChange={(e) => onChainCallTemplateChange(e.target.value)}
                placeholder='DfOrder({{userParams}}).withItems().generate()'
                className="font-mono text-sm h-20 resize-none border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
        </div>

        <div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                Python 脚本逻辑
                <span className="text-red-500">*</span>
              </h3>
              <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <Label className="text-xs font-medium text-gray-500">标签：</Label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="tag-WORKFLOW"
                      checked={tags.includes('WORKFLOW')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onTagsChange([...tags, 'WORKFLOW']);
                        } else {
                          onTagsChange(tags.filter(tag => tag !== 'WORKFLOW'));
                        }
                      }}
                    />
                    <Label
                      htmlFor="tag-WORKFLOW"
                      className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                    >
                      WORKFLOW
                    </Label>
                  </div>
                  <div className="w-px h-3 bg-gray-200" />
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="tag-SCRIPT"
                      checked={tags.includes('SCRIPT')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onTagsChange([...tags, 'SCRIPT']);
                        } else {
                          onTagsChange(tags.filter(tag => tag !== 'SCRIPT'));
                        }
                      }}
                    />
                    <Label
                      htmlFor="tag-SCRIPT"
                      className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                    >
                      SCRIPT
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>            <p className="text-sm text-gray-600">
            配置脚本内容（scriptContent），入口函数 execute_script 由后端自动生成
          </p>
        </div>

        {isFullscreen ? (
          <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-blue-400">Python</span>
                <span>•</span>
                <span>script.py</span>
              </div>
              <button
                onClick={() => onFullscreenChange(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded hover:bg-gray-700"
                title="退出全屏"
              >
                <Minimize className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* 代码编辑器区域 - 固定宽度 */}
              <div className="w-1/2 flex flex-col border-r border-gray-700 overflow-hidden">
                <Editor
                  value={scriptContent}
                  onChange={(value) => onScriptContentChange(value || '')}
                  language="python"
                  height="100%"
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "Fira Code, Consolas, 'Courier New', monospace",
                    fontWeight: "normal",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fixedOverflowWidgets: true,
                    autoIndent: "full",
                    formatOnPaste: true,
                    formatOnType: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: "on",
                    wrappingIndent: "same",
                    smoothScrolling: true,
                    mouseWheelZoom: false,
                    // 光标配置
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    cursorStyle: "line",
                    cursorWidth: 2,
                    // 高亮配置
                    occurrencesHighlight: "singleFile",
                    selectionHighlight: true,
                    renderLineHighlight: "all",
                    renderLineHighlightOnlyWhenFocus: true,
                    // 滚动条配置
                    scrollbar: {
                      vertical: "auto",
                      horizontal: "auto",
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                    // 行号配置
                    lineNumbersMinChars: 3,
                    // 概览配置
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: false,
                  }}
                  onMount={(editor) => {
                    fullscreenEditorRef.current = editor;

                    // 配置选中高亮
                    editor.onDidChangeCursorSelection(() => {
                      setTimeout(() => {
                        const position = editor.getPosition();
                        if (position) {
                          editor.revealLineInCenterIfOutsideViewport(position.lineNumber, 1);
                        }
                      }, 0);
                    });

                    // 添加右键菜单：从函数签名生成参数
                    editor.addAction({
                      id: 'generate-params-from-function-fullscreen',
                      label: '从函数签名生成参数',
                      contextMenuGroupId: 'navigation',
                      contextMenuOrder: 1.5,
                      run: (ed) => {
                        const selection = ed.getSelection();
                        if (!selection) {
                          toast.error('请先选中函数定义');
                          return;
                        }

                        const selectedText = ed.getModel()?.getValueInRange(selection) || '';
                        if (!selectedText.trim()) {
                          toast.error('请先选中函数定义（包括函数名和参数列表）');
                          return;
                        }

                        if (generateParamsRef.current) {
                          generateParamsRef.current(selectedText);
                        } else {
                          toast.error('生成参数功能未初始化，请刷新页面重试');
                        }
                      },
                    });

                    // 确保在移动设备上的光标行为正常
                    if (window.innerWidth < 768) {
                      editor.updateOptions({
                        mouseWheelZoom: false,
                        smoothScrolling: false,
                      });
                    }
                  }}
                />
              </div>
              {/* 执行结果区域 - 固定宽度 */}
              <div className="w-1/2 flex flex-col bg-gray-800 overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
                  <h4 className="text-sm font-semibold text-gray-200">执行结果</h4>
                  <div className="flex items-center gap-2">
                    {debugResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                        onClick={copyDebugResult}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        复制
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleDebugRun}
                      disabled={isDebugging}
                    >
                      {isDebugging ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          执行中...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          执行
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-900 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
                  {debugResult ? (
                    <pre className="text-xs font-mono bg-gray-800 text-gray-100 p-3 rounded border border-gray-700 overflow-x-auto whitespace-pre break-words min-w-full" style={{ width: 'max-content' }}>
                      {debugResult}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      <p>执行结果将显示在这里</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-blue-400">Python</span>
                <span>•</span>
                <span>script.py</span>
              </div>
              <button
                onClick={() => onFullscreenChange(true)}
                className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded hover:bg-gray-700"
                title="全屏"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
            {/* 使用 Monaco Editor */}
            <Editor
              value={scriptContent}
              onChange={(value) => onScriptContentChange(value || '')}
              language="python"
              height="500px"
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "Fira Code, Consolas, 'Courier New', monospace",
                fontWeight: "normal",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fixedOverflowWidgets: true,
                autoIndent: "full",
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
                insertSpaces: true,
                wordWrap: "on",
                wrappingIndent: "same",
                smoothScrolling: true,
                mouseWheelZoom: false,
                // 光标配置
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                cursorStyle: "line",
                cursorWidth: 2,
                // 高亮配置
                occurrencesHighlight: "singleFile",
                selectionHighlight: true,
                renderLineHighlight: "all",
                renderLineHighlightOnlyWhenFocus: true,
                // 滚动条配置
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
                // 行号配置
                lineNumbersMinChars: 3,
                // 概览配置
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: false,
              }}
              onMount={(editor) => {
                editorRef.current = editor;

                // 配置选中高亮
                editor.onDidChangeCursorSelection(() => {
                  setTimeout(() => {
                    const position = editor.getPosition();
                    if (position) {
                      editor.revealLineInCenterIfOutsideViewport(position.lineNumber, 1);
                    }
                  }, 0);
                });

                // 添加右键菜单：从函数签名生成参数
                editor.addAction({
                  id: 'generate-params-from-function',
                  label: '从函数签名生成参数',
                  contextMenuGroupId: 'navigation',
                  contextMenuOrder: 1.5,
                  run: (ed) => {
                    const selection = ed.getSelection();
                    if (!selection) {
                      toast.error('请先选中函数定义');
                      return;
                    }

                    const selectedText = ed.getModel()?.getValueInRange(selection) || '';
                    if (!selectedText.trim()) {
                      toast.error('请先选中函数定义（包括函数名和参数列表）');
                      return;
                    }

                    if (generateParamsRef.current) {
                      generateParamsRef.current(selectedText);
                    } else {
                      toast.error('生成参数功能未初始化，请刷新页面重试');
                    }
                  },
                });

                // 确保在移动设备上的光标行为正常
                if (window.innerWidth < 768) {
                  editor.updateOptions({
                    mouseWheelZoom: false,
                    smoothScrolling: false,
                  });
                }
              }}
            />
          </div>
        )}
      </div>
    </TabsContent>
  );
}


