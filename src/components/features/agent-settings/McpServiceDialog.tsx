/**
 * MCP 服务添加/编辑弹窗
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { MCPService } from '@/services/agent-settings';
import { cn } from '@/utils/cn';

interface McpServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: MCPService | null;
  onSubmit: (data: Partial<MCPService>) => Promise<void>;
}

const TRANSPORT_OPTIONS = [
  { value: 'sse', label: 'SSE (Server-Sent Events)' },
  { value: 'http-streamable', label: 'HTTP Streamable' },
  // { value: 'stdio', label: 'Stdio' }, // User image only showed first two, but keeping Stdio as it's implemented
] as const;

function PasswordInput({
  value,
  onChange,
  placeholder,
  className
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  className
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 flex items-center justify-center border border-r-0 rounded-l hover:bg-gray-50 text-gray-500"
      >
        <Minus className="w-3 h-3" />
      </button>
      <div className="w-16 h-8 flex items-center justify-center border-y text-sm">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 flex items-center justify-center border border-l-0 rounded-r hover:bg-gray-50 text-gray-500"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

const FormItem = ({
  label,
  required,
  children,
  className
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex items-start gap-4", className)}>
    <div className="w-24 shrink-0 text-right pt-2">
      <Label className="text-gray-500 font-normal">
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </Label>
    </div>
    <div className="flex-1">
      {children}
    </div>
  </div>
);

export function McpServiceDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: McpServiceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [transportType, setTransportType] = useState<'sse' | 'http-streamable' | 'stdio'>('http-streamable');
  const [url, setUrl] = useState('');

  // Stdio config (Keeping logic even if UI emphasizes HTTP)
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState<string[]>([]);
  const [argInput, setArgInput] = useState('');

  // Auth Config
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');

  // Advanced Config
  const [timeout, setTimeoutValue] = useState(30);
  const [retryCount, setRetryCount] = useState(3);
  const [retryDelay, setRetryDelay] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const initializedEditingIdRef = useRef<string | 'new' | null>(null);

  const editingId = editing?.id;

  useEffect(() => {
    // 只在对话框打开时初始化一次，或者编辑的服务ID变化时重新初始化
    if (open) {
      const currentEditingId = editingId || 'new';
      const shouldInitialize = initializedEditingIdRef.current !== currentEditingId;

      if (shouldInitialize) {
        if (editing) {
          setName(editing.name || '');
          setDescription(editing.description ?? '');
          setEnabled(editing.enabled ?? true);
          setTransportType(editing.transport_type ?? 'http-streamable');
          setUrl(editing.url ?? '');
          setCommand(editing.stdio_config?.command as string || '');
          setArgs((editing.stdio_config?.args as string[]) || []);

          setApiKey(editing.auth_config?.api_key as string || '');
          setToken(editing.auth_config?.token as string || '');

          setTimeoutValue((editing.advanced_config?.timeout as number) ?? 30);
          setRetryCount((editing.advanced_config?.retry_count as number) ?? 3);
          setRetryDelay((editing.advanced_config?.retry_delay as number) ?? 1);
        } else {
          setName('');
          setDescription('');
          setEnabled(true);
          setTransportType('http-streamable');
          setUrl('');
          setCommand('');
          setArgs([]);
          setApiKey('');
          setToken('');
          setTimeoutValue(30);
          setRetryCount(3);
          setRetryDelay(1);
        }
        initializedEditingIdRef.current = currentEditingId;
      }
    }

    // 对话框关闭时重置初始化标记
    if (!open) {
      initializedEditingIdRef.current = null;
    }
  }, [open, editingId]); // 只依赖 editingId，而不是整个 editing 对象

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (transportType !== 'stdio' && !url.trim()) return;

    setSubmitting(true);
    try {
      const data: Partial<MCPService> = {
        name: name.trim(),
        description: description.trim(),
        enabled,
        transport_type: transportType,
        url: transportType !== 'stdio' ? url.trim() : undefined,
        stdio_config: transportType === 'stdio' ? { command: command.trim(), args } : undefined,
        auth_config: { api_key: apiKey || undefined, token: token || undefined },
        advanced_config: { timeout: timeout, retry_count: retryCount, retry_delay: retryDelay }
      };

      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0"
        aria-describedby={undefined}
      // onOpenAutoFocus={(e) => {
      //   // 阻止自动聚焦，避免干扰输入框输入
      //   e.preventDefault();
      // }}
      >
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-medium">
              {editing ? '编辑 MCP 服务' : '添加 MCP 服务'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <FormItem label="服务名称" required>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="请输入服务名称"
              autoComplete="off"
            />
          </FormItem>

          <FormItem label="描述">
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="请输入服务描述"
              rows={3}
              className="resize-none"
            />
          </FormItem>

          <FormItem label="传输类型" required>
            <div className="flex gap-6 pt-1.5">
              {TRANSPORT_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                    transportType === opt.value
                      ? "border-blue-600"
                      : "border-gray-300 group-hover:border-blue-400"
                  )}>
                    {transportType === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    checked={transportType === opt.value}
                    onChange={() => setTransportType(opt.value as any)}
                  />
                  <span className={cn(
                    "text-sm",
                    transportType === opt.value ? "text-gray-900 font-medium" : "text-gray-600"
                  )}>
                    {opt.label}
                  </span>
                </label>
              ))}
              {/* Keeping Stdio option but ensuring it fits the design if enabled */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  transportType === 'stdio'
                    ? "border-blue-600"
                    : "border-gray-300 group-hover:border-blue-400"
                )}>
                  {transportType === 'stdio' && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  checked={transportType === 'stdio'}
                  onChange={() => setTransportType('stdio')}
                />
                <span className={cn(
                  "text-sm",
                  transportType === 'stdio' ? "text-gray-900 font-medium" : "text-gray-600"
                )}>
                  Stdio
                </span>
              </label>
            </div>
          </FormItem>

          {transportType !== 'stdio' ? (
            <FormItem label="服务 URL">
              <div className="space-y-1">
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                  }}
                  placeholder="https://example.com/mcp"
                  className={!url && submitting ? "border-red-500 focus-visible:ring-red-500" : ""}
                  autoComplete="off"
                />
                {!url && submitting && (
                  <p className="text-xs text-red-500">请输入服务 URL</p>
                )}
              </div>
            </FormItem>
          ) : (
            <FormItem label="命令" required>
              <div className="space-y-2">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="e.g. uvx, npx"
                />
                <Input
                  value={argInput}
                  onChange={(e) => setArgInput(e.target.value)}
                  placeholder="参数 (Args)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (argInput.trim()) {
                        setArgs([...args, argInput.trim()]);
                        setArgInput('');
                      }
                    }
                  }}
                />
                {args.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {args.map((a, i) => (
                      <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        {a}
                        <button onClick={() => setArgs(args.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </FormItem>
          )}

          <FormItem label="启用服务">
            <div className="pt-2">
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </FormItem>

          <div className="border rounded-md divide-y">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="auth" className="border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50/50 text-sm font-medium text-gray-700">
                  认证配置
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-2 bg-gray-50/30">
                  <div className="space-y-4 pl-8">
                    <div className="flex items-center gap-4">
                      <Label className="w-24 text-right text-gray-500 font-normal shrink-0">API Key</Label>
                      <PasswordInput
                        value={apiKey}
                        onChange={setApiKey}
                        className="bg-blue-50/30 border-blue-100" // Light blue bg as per image suggestion (subtle)
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-24 text-right text-gray-500 font-normal shrink-0">Bearer Token</Label>
                      <PasswordInput
                        value={token}
                        onChange={setToken}
                        placeholder="可选"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced" className="border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50/50 text-sm font-medium text-gray-700">
                  高级配置
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-2 bg-gray-50/30">
                  <div className="space-y-4 pl-8">
                    <div className="flex items-center gap-4">
                      <Label className="w-24 text-right text-gray-500 font-normal shrink-0">超时时间(秒)</Label>
                      <NumberStepper value={timeout} onChange={setTimeoutValue} />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-24 text-right text-gray-500 font-normal shrink-0">重试次数</Label>
                      <NumberStepper value={retryCount} onChange={setRetryCount} />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-24 text-right text-gray-500 font-normal shrink-0">重试延迟(秒)</Label>
                      <NumberStepper value={retryDelay} onChange={setRetryDelay} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-gray-100 hover:bg-gray-200 border-transparent">
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white w-24">
            {submitting ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
