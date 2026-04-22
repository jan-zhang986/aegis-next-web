import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { INPUT_STYLE, TEXTAREA_STYLE } from '../shared/constants';
import { CodeEditorDialog } from '../shared/CodeEditorDialog';
import { Code2 } from 'lucide-react';
import { InlineAssertionRules } from '../shared/InlineAssertionRules';
import { InlineExtractionRules } from '../shared/InlineExtractionRules';
import type { ScriptConfig } from '../../types';

interface ScriptNodeFormProps {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
}

export const ScriptNodeForm: React.FC<ScriptNodeFormProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<ScriptConfig>) => {
    onChange({ ...config, ...updates });
  };

  const [functionArgsError, setFunctionArgsError] = useState<string>('');
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [tempScriptCode, setTempScriptCode] = useState<string>('');
  // 保存用户输入的原始字符串，用于 Textarea 的 value（即使不是有效的 JSON 也能显示）
  // 初始化时从 config.function_args 格式化得到
  const [functionArgsInput, setFunctionArgsInput] = useState<string>(() => {
    if (config.function_args === null || config.function_args === undefined) {
      return '';
    }
    try {
      return JSON.stringify(config.function_args, null, 2);
    } catch {
      return String(config.function_args);
    }
  });

  // 格式化function_args为JSON字符串用于显示
  const formatFunctionArgs = (args: any): string => {
    if (args === null || args === undefined) {
      return '';
    }
    try {
      return JSON.stringify(args, null, 2);
    } catch {
      return String(args);
    }
  };

  // 当 config.function_args 从外部更新时（比如初始化），同步更新 functionArgsInput
  // 使用 useRef 来跟踪上一次的 config.function_args 和 functionArgsInput，避免在用户输入时被重置
  const prevFunctionArgsRef = React.useRef(config.function_args);
  const functionArgsInputRef = React.useRef(functionArgsInput);
  const isUserInputtingRef = React.useRef(false);
  
  // 同步 functionArgsInputRef
  useEffect(() => {
    functionArgsInputRef.current = functionArgsInput;
  }, [functionArgsInput]);

  useEffect(() => {
    // 只有当 config.function_args 真正变化时才更新（比如从外部初始化或更新）
    if (prevFunctionArgsRef.current !== config.function_args) {
      const formatted = formatFunctionArgs(config.function_args);
      const currentInput = functionArgsInputRef.current;
      
      // 如果格式化后的值等于当前输入值，说明是用户输入导致的更新，不需要同步
      // 如果格式化后的值不等于当前输入值，且用户不在输入中，说明是从外部更新（比如初始化或保存后重新加载），需要同步
      if (formatted !== currentInput && !isUserInputtingRef.current) {
        setFunctionArgsInput(formatted);
        setFunctionArgsError(''); // 清除之前的错误
      }
      
      prevFunctionArgsRef.current = config.function_args;
    }
  }, [config.function_args]);

  // 验证并更新function_args
  const handleFunctionArgsChange = (value: string) => {
    // 标记用户正在输入
    isUserInputtingRef.current = true;
    // 先更新输入状态，这样 Textarea 的 value 会立即更新，用户可以继续输入
    setFunctionArgsInput(value);
    setFunctionArgsError('');

    if (!value.trim()) {
      updateConfig({ function_args: null });
      return;
    }

    // 尝试解析 JSON，但不阻塞用户输入
    try {
      const parsed = JSON.parse(value);
      // 只有解析成功时才更新 config
      updateConfig({ function_args: parsed });
      // 更新后，延迟重置用户输入标志，确保 useEffect 不会覆盖
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 200);
    } catch (error) {
      // JSON 解析失败时，只显示错误信息，不更新 config
      // 这样用户可以继续输入，直到输入有效的 JSON
      setFunctionArgsError('JSON格式错误，请输入有效的JSON格式');
      // 解析失败时，延迟重置用户输入标志
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 200);
    }
  };

  const getScriptPlaceholder = () => {
    const type = config.type || 'python';
    if (type === 'expression') {
      return `// 表达式类型：直接返回计算结果
// 示例：len(input_data.get('items', [])) * 100

len(input_data.get('items', []))`;
    } else if (type === 'function') {
      return `// 函数类型：定义并执行函数
// 支持参数传递（通过function_args配置）
// 示例：
def execute(data, threshold):
    result = data.get('value', 0) * threshold
    return {'result': result}`;
    } else {
      return `// Python脚本类型：执行完整的Python代码块
// 可以访问上游节点的输出变量（input_data）
// 返回所有定义的变量和执行输出
// 示例：
data = input_data
items = data.get('items', [])

processed = []
for item in items:
    if item.get('status') == 'active':
        processed.append(item)

result = {
    'total': len(processed),
    'items': processed
}
print(f'处理了 {len(processed)} 个项目')`;
    }
  };

  const getEditorLanguage = () => {
    const type = config.type || 'python';
    if (type === 'expression') {
      return 'python'; // Expression 也使用 Python 语法高亮
    } else if (type === 'function') {
      return 'python';
    } else {
      return 'python';
    }
  };

  const handleOpenEditor = () => {
    setTempScriptCode(config.script || '');
    setIsCodeEditorOpen(true);
  };

  const handleSaveCode = () => {
    updateConfig({ script: tempScriptCode });
    setIsCodeEditorOpen(false);
  };

  const handleEditorChange = (value: string) => {
    setTempScriptCode(value);
  };

  return (
    <div className="space-y-0">
      <Section title="脚本类型">
        <Select
          value={config.type || 'python'}
          onValueChange={(value) => updateConfig({ type: value as ScriptConfig['type'] })}
        >
          <SelectTrigger className="h-9 border-2 border-gray-300 focus-visible:border-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="expression">Expression</SelectItem>
            <SelectItem value="function">Function</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          {config.type === 'python' && '执行完整的Python代码块，返回所有定义的变量'}
          {config.type === 'expression' && '执行单个表达式，直接返回计算结果'}
          {config.type === 'function' && '定义并执行函数，支持参数传递'}
        </p>
      </Section>

      <Section title="脚本代码">
        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenEditor}
              className="h-8 text-xs"
            >
              <Code2 className="w-3 h-3 mr-1.5" />
              在弹窗中编辑
            </Button>
          </div>
          
          {/* 代码编辑区域 - 可以直接编辑 */}
          <Textarea
            placeholder={getScriptPlaceholder()}
            value={config.script || ''}
            onChange={(e) => updateConfig({ script: e.target.value })}
            className={cn("min-h-[240px] font-mono text-sm", TEXTAREA_STYLE)}
          />
          
          <p className="mt-1 text-xs text-muted-foreground">
            支持变量引用：使用 <code className="px-1 py-0.5 bg-muted rounded">{'${variable}'}</code> 语法引用工作流变量
          </p>
        </div>
      </Section>

      {/* 代码编辑器弹窗 */}
      <CodeEditorDialog
        open={isCodeEditorOpen}
        onOpenChange={setIsCodeEditorOpen}
        value={tempScriptCode}
        onChange={handleEditorChange}
        language={getEditorLanguage()}
        title="编辑脚本代码"
        placeholder={getScriptPlaceholder()}
        onSave={handleSaveCode}
      />

      {config.type === 'function' && (
        <>
          <Section title="函数名" defaultOpen={false}>
            <div className="space-y-2">
              <FormLabel>函数名</FormLabel>
              <Input
                placeholder="函数名称（默认：execute）"
                value={config.function_name || ''}
                onChange={(e) => updateConfig({ function_name: e.target.value })}
                className={INPUT_STYLE}
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                函数名，默认为 execute。函数必须在脚本中定义。
              </p>
            </div>
          </Section>

          <Section title="函数参数" defaultOpen={false}>
            <div className="space-y-2">
              <Textarea
                placeholder={`// 函数参数（可选）
// 支持以下格式：
// 1. 关键字参数（字典）：
{
  "data": "\${input_data}",
  "threshold": 100,
  "strict_mode": true
}

// 2. 位置参数（数组）：
[100, 200, "add"]

// 3. 单个参数：
"\${input_data}"

// 4. 不提供参数（向后兼容）：
留空即可`}
                value={functionArgsInput}
                onChange={(e) => handleFunctionArgsChange(e.target.value)}
                className={cn("min-h-[180px]", TEXTAREA_STYLE)}
              />
              {functionArgsError && (
                <p className="mt-1 text-xs text-destructive">{functionArgsError}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                支持JSON格式。字典作为关键字参数，数组作为位置参数，其他值作为单个参数。留空则不传递参数（向后兼容模式）。
              </p>
            </div>
          </Section>
        </>
      )}

      <Section title="断言" defaultOpen={false}>
        <InlineAssertionRules
          rules={config.assertion?.rules || []}
          onChange={(rules) => {
            // 如果 rules 为 null，清空 assertion 对象；否则设置 assertion
            if (rules === null) {
              // 直接传递完整的 config（不包含 assertion），绕过 updateConfig 的合并逻辑
              // 这样可以确保 assertion 被完全删除，不会被重新添加回去
              const { assertion, ...restConfig } = config;
              const newConfig = { ...restConfig } as ScriptConfig;
              // 确保 assertion 被完全删除
              if ('assertion' in newConfig) {
                delete (newConfig as any).assertion;
              }
              onChange(newConfig);
            } else {
              updateConfig({ assertion: { rules } });
            }
          }}
        />
      </Section>

      <Section title="提取" defaultOpen={false}>
        <InlineExtractionRules
          extractions={config.extractions || []}
          onChange={(extractions) => updateConfig({ extractions })}
        />
      </Section>
    </div>
  );
};

