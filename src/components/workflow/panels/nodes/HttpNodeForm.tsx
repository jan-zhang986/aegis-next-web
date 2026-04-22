import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Code2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { InlineAssertionRules } from '../shared/InlineAssertionRules';
import { InlineExtractionRules } from '../shared/InlineExtractionRules';
import { CodeEditorDialog } from '../shared/CodeEditorDialog';
import { INPUT_STYLE, TEXTAREA_STYLE } from '../shared/constants';
import { workflowService } from '@/services/workflow';
import { metadataService } from '@/services/metadata';
import type { HttpConfig } from '../../types';

interface HttpNodeFormProps {
  config: HttpConfig;
  onChange: (config: HttpConfig) => void;
  projectId?: string;
}

export const HttpNodeForm: React.FC<HttpNodeFormProps> = ({ config, onChange, projectId }) => {
  const [paramType, setParamType] = useState<'params' | 'json' | 'data' | 'upload'>('json');
  // 保存用户输入的原始字符串，用于 Textarea 的 value（即使不是有效的 JSON 也能显示）
  const [headersInput, setHeadersInput] = useState<string>(() => {
    if (config.headers === null || config.headers === undefined) {
      return '';
    }
    try {
      return JSON.stringify(config.headers, null, 2);
    } catch {
      return String(config.headers);
    }
  });
  // 请求体输入的本地state
  const [paramsInput, setParamsInput] = useState<string>(() => {
    if (config.params === null || config.params === undefined) {
      return '';
    }
    try {
      return JSON.stringify(config.params, null, 2);
    } catch {
      return String(config.params);
    }
  });
  const [jsonInput, setJsonInput] = useState<string>(() => {
    if (config.json === null || config.json === undefined) {
      return '';
    }
    if (typeof config.json === 'string') {
      return config.json;
    }
    try {
      return JSON.stringify(config.json, null, 2);
    } catch {
      return String(config.json);
    }
  });
  const [dataInput, setDataInput] = useState<string>(() => {
    if (config.data === null || config.data === undefined) {
      return '';
    }
    if (typeof config.data === 'string') {
      return config.data;
    }
    try {
      return JSON.stringify(config.data, null, 2);
    } catch {
      return String(config.data);
    }
  });
  const [uploadInput, setUploadInput] = useState<string>(() => {
    const upload = config.upload || config.files;
    if (upload === null || upload === undefined) {
      return '';
    }
    try {
      return JSON.stringify(upload, null, 2);
    } catch {
      return String(upload);
    }
  });

  // 弹窗编辑器状态
  const [isHeadersEditorOpen, setIsHeadersEditorOpen] = useState(false);
  const [tempHeadersCode, setTempHeadersCode] = useState<string>('');
  const [isParamsEditorOpen, setIsParamsEditorOpen] = useState(false);
  const [tempParamsCode, setTempParamsCode] = useState<string>('');
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  const [tempJsonCode, setTempJsonCode] = useState<string>('');
  const [isDataEditorOpen, setIsDataEditorOpen] = useState(false);
  const [tempDataCode, setTempDataCode] = useState<string>('');
  const [isUploadEditorOpen, setIsUploadEditorOpen] = useState(false);
  const [tempUploadCode, setTempUploadCode] = useState<string>('');
  /** 上传用：表单字段名（multipart 的 key），默认 file */
  const [uploadFormKey, setUploadFormKey] = useState<string>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用 useRef 保存最新的 onChange 引用，避免在 useEffect 中使用过期的闭包
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 始终持有最新的 config，避免在快速连续操作（如先写断言再写请求体）时使用过期闭包导致断言/提取被覆盖
  const configRef = useRef<HttpConfig>(config);
  configRef.current = config;

  // 初始化 domain 值（首次创建时设置变量占位符）
  // 同时规范化 data 和 json 字段：如果是 JSON 字符串，转换为对象
  useEffect(() => {
    let needsUpdate = false;
    const updates: Partial<HttpConfig> = {};

    // 如果 domain 为空，则设置为变量占位符
    if (!config.domain) {
      updates.domain = '${url}';
      needsUpdate = true;
    }

    // 规范化 data 字段：如果是 JSON 字符串，转换为对象
    if (config.data && typeof config.data === 'string') {
      try {
        const parsed = JSON.parse(config.data);
        updates.data = parsed;
        needsUpdate = true;
        console.log('[HttpNodeForm] 初始化时规范化 data 字段：字符串 -> 对象', parsed);
      } catch (error) {
        // 如果不是有效的 JSON，移除换行符
        const cleaned = config.data.replace(/\s+/g, ' ').trim();
        if (cleaned !== config.data) {
          updates.data = cleaned;
          needsUpdate = true;
          console.log('[HttpNodeForm] 初始化时清理 data 字段中的换行符');
        }
      }
    }

    // 规范化 json 字段：如果是 JSON 字符串，转换为对象
    if (config.json && typeof config.json === 'string') {
      try {
        const parsed = JSON.parse(config.json);
        updates.json = parsed;
        needsUpdate = true;
        console.log('[HttpNodeForm] 初始化时规范化 json 字段：字符串 -> 对象', parsed);
      } catch (error) {
        // 如果不是有效的 JSON，移除换行符
        const cleaned = config.json.replace(/\s+/g, ' ').trim();
        if (cleaned !== config.json) {
          updates.json = cleaned;
          needsUpdate = true;
          console.log('[HttpNodeForm] 初始化时清理 json 字段中的换行符');
        }
      }
    }

    if (needsUpdate) {
      onChangeRef.current({ ...config, ...updates });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 从config中推断或获取paramType状态
  // 优先使用config.bodyType（用户选择的参数类型），如果没有则根据实际存在的字段推断
  useEffect(() => {
    if (config.bodyType) {
      setParamType(config.bodyType);
      // 后端按 paramType 恢复请求体，需与 bodyType 一致并持久化
      if ((config as any).paramType !== config.bodyType) {
        onChangeRef.current({ ...config, paramType: config.bodyType });
      }
    } else if (config.upload || config.files) {
      setParamType('upload');
      if ((config as any).paramType !== 'upload') {
        onChangeRef.current({ ...config, bodyType: config.bodyType || 'upload', paramType: 'upload' });
      }
    } else if (config.data) {
      setParamType('data');
    } else if (config.json) {
      setParamType('json');
    } else {
      setParamType('json');
    }
  }, [config.bodyType, config.upload, config.files, config.data, config.json]);

  // 计算完整的 URL 预览（直接拼接 domain 和 path）
  const getFullUrlPreview = () => {
    const domainValue = config.domain || '';
    const path = config.path || '';
    if (domainValue && path) {
      const cleanDomain = domainValue.replace(/\/$/, ''); // 移除末尾斜杠
      return cleanDomain + (path.startsWith('/') ? path : '/' + path);
    }
    if (domainValue) {
      return domainValue;
    }
    if (path) {
      return path;
    }
    return '';
  };

  const updateConfig = (updates: Partial<HttpConfig> | HttpConfig) => {
    // 始终基于最新 config（configRef）合并，避免因闭包滞后导致断言/提取在编写请求体等操作后被清空
    const base = configRef.current;
    const newConfig = { ...base, ...updates } as HttpConfig;
    onChange(newConfig);
  };

  // 格式化headers为JSON字符串用于显示
  const formatHeaders = (headers: any): string => {
    if (headers === null || headers === undefined) {
      return '';
    }
    try {
      return JSON.stringify(headers, null, 2);
    } catch {
      return String(headers);
    }
  };

  // 当 config.headers 从外部更新时（比如初始化），同步更新 headersInput
  // 使用 useRef 来跟踪上一次的 config.headers 和 headersInput，避免在用户输入时被重置
  const prevHeadersRef = useRef(config.headers);
  const headersInputRef = useRef(headersInput);
  const isUserInputtingRef = useRef(false);
  
  // 同步 headersInputRef
  useEffect(() => {
    headersInputRef.current = headersInput;
  }, [headersInput]);

  useEffect(() => {
    // 只有当 config.headers 真正变化时才更新（比如从外部初始化或更新）
    if (prevHeadersRef.current !== config.headers) {
      const formatted = formatHeaders(config.headers);
      const currentInput = headersInputRef.current;
      
      // 如果格式化后的值不等于当前输入值，且用户不在输入中，说明是从外部更新（比如初始化或保存后重新加载），需要同步
      if (formatted !== currentInput && !isUserInputtingRef.current) {
        setHeadersInput(formatted);
      }
      
      prevHeadersRef.current = config.headers;
    }
  }, [config.headers]);

  // 验证并更新headers
  const handleHeadersChange = (value: string) => {
    // 标记用户正在输入
    isUserInputtingRef.current = true;
    // 先更新输入状态，这样 Textarea 的 value 会立即更新，用户可以继续输入
    setHeadersInput(value);

    if (!value.trim()) {
      updateConfig({ headers: undefined });
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 50);
      return;
    }

    // 尝试解析 JSON，但不阻塞用户输入
    try {
      const parsed = JSON.parse(value);
      // 只有解析成功时才更新 config
      updateConfig({ headers: parsed });
      // 更新后，延迟重置用户输入标志，确保 useEffect 不会覆盖
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 50);
    } catch (error) {
      // JSON 解析失败时，不更新 config
      // 这样用户可以继续输入，直到输入有效的 JSON
      // 解析失败时，延迟重置用户输入标志
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 50);
    }
  };

  // 格式化请求体字段为JSON字符串用于显示
  const formatBodyField = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  // params字段的同步逻辑
  const prevParamsRef = useRef(config.params);
  const paramsInputRef = useRef(paramsInput);
  const isUserInputtingParamsRef = useRef(false);
  
  useEffect(() => {
    paramsInputRef.current = paramsInput;
  }, [paramsInput]);

  useEffect(() => {
    if (prevParamsRef.current !== config.params) {
      const formatted = formatBodyField(config.params);
      const currentInput = paramsInputRef.current;
      
      if (formatted !== currentInput && !isUserInputtingParamsRef.current) {
        setParamsInput(formatted);
      }
      
      prevParamsRef.current = config.params;
    }
  }, [config.params]);

  // json字段的同步逻辑
  const prevJsonRef = useRef(config.json);
  const jsonInputRef = useRef(jsonInput);
  const isUserInputtingJsonRef = useRef(false);
  
  useEffect(() => {
    jsonInputRef.current = jsonInput;
  }, [jsonInput]);

  useEffect(() => {
    if (prevJsonRef.current !== config.json) {
      const formatted = formatBodyField(config.json);
      const currentInput = jsonInputRef.current;
      
      if (formatted !== currentInput && !isUserInputtingJsonRef.current) {
        setJsonInput(formatted);
      }
      
      prevJsonRef.current = config.json;
    }
  }, [config.json]);

  // data字段的同步逻辑
  const prevDataRef = useRef(config.data);
  const dataInputRef = useRef(dataInput);
  const isUserInputtingDataRef = useRef(false);
  
  useEffect(() => {
    dataInputRef.current = dataInput;
  }, [dataInput]);

  useEffect(() => {
    if (prevDataRef.current !== config.data) {
      const formatted = formatBodyField(config.data);
      const currentInput = dataInputRef.current;
      
      if (formatted !== currentInput && !isUserInputtingDataRef.current) {
        setDataInput(formatted);
      }
      
      prevDataRef.current = config.data;
    }
  }, [config.data]);

  // upload字段的同步逻辑
  const prevUploadRef = useRef(config.upload || config.files);
  const uploadInputRef = useRef(uploadInput);
  const isUserInputtingUploadRef = useRef(false);
  
  useEffect(() => {
    uploadInputRef.current = uploadInput;
  }, [uploadInput]);

  useEffect(() => {
    const currentUploadValue = config.upload || config.files;
    if (prevUploadRef.current !== currentUploadValue) {
      const formatted = formatBodyField(currentUploadValue);
      const currentInput = uploadInputRef.current;
      
      if (formatted !== currentInput && !isUserInputtingUploadRef.current) {
        setUploadInput(formatted);
      }
      
      prevUploadRef.current = currentUploadValue;
    }
  }, [config.upload, config.files]);

  // 处理params输入变化
  const handleParamsChange = (value: string) => {
    isUserInputtingParamsRef.current = true;
    setParamsInput(value);

    if (!value.trim()) {
      const { params, ...rest } = config;
      updateConfig(rest);
      setTimeout(() => {
        isUserInputtingParamsRef.current = false;
      }, 50);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      updateConfig({ params: parsed });
      setTimeout(() => {
        isUserInputtingParamsRef.current = false;
      }, 50);
    } catch (error) {
      setTimeout(() => {
        isUserInputtingParamsRef.current = false;
      }, 50);
    }
  };

  // 处理json输入变化
  const handleJsonChange = (value: string) => {
    isUserInputtingJsonRef.current = true;
    setJsonInput(value);

    if (!value.trim()) {
      const { json, ...rest } = config;
      updateConfig(rest);
      setTimeout(() => {
        isUserInputtingJsonRef.current = false;
      }, 50);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      // JSON 解析成功，保存为对象而不是字符串
      console.log('[handleJsonChange] ✅ JSON解析成功，保存为对象:', parsed);
      console.log('[handleJsonChange] 对象类型:', typeof parsed);
      updateConfig({ json: parsed });
      setTimeout(() => {
        isUserInputtingJsonRef.current = false;
      }, 50);
    } catch (error) {
      // JSON 解析失败时，移除所有换行符和多余空格后保存
      const cleanedValue = value.replace(/\s+/g, ' ').trim();
      console.log('[handleJsonChange] ⚠️ JSON解析失败，保存清理后的字符串:', cleanedValue);
      console.log('[handleJsonChange] 是否包含换行符:', cleanedValue.includes('\n'));
      updateConfig({ json: cleanedValue });
      setTimeout(() => {
        isUserInputtingJsonRef.current = false;
      }, 50);
    }
  };

  // 处理data输入变化
  const handleDataChange = (value: string) => {
    isUserInputtingDataRef.current = true;
    setDataInput(value);

    if (!value.trim()) {
      const { data, ...rest } = config;
      updateConfig(rest);
      setTimeout(() => {
        isUserInputtingDataRef.current = false;
      }, 50);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      // JSON 解析成功，保存为对象而不是字符串
      // 这样后端可以直接使用，不需要再次解析
      console.log('[handleDataChange] ✅ JSON解析成功，保存为对象:', parsed);
      console.log('[handleDataChange] 对象类型:', typeof parsed);
      updateConfig({ data: parsed });
      setTimeout(() => {
        isUserInputtingDataRef.current = false;
      }, 50);
    } catch (error) {
      // JSON 解析失败时，移除所有换行符和多余空格后保存
      const cleanedValue = value.replace(/\s+/g, ' ').trim();
      console.log('[handleDataChange] ⚠️ JSON解析失败，保存清理后的字符串:', cleanedValue);
      console.log('[handleDataChange] 是否包含换行符:', cleanedValue.includes('\n'));
      updateConfig({ data: cleanedValue });
      setTimeout(() => {
        isUserInputtingDataRef.current = false;
      }, 50);
    }
  };

  // 处理upload输入变化
  const handleUploadChange = (value: string) => {
    isUserInputtingUploadRef.current = true;
    setUploadInput(value);

    if (!value.trim()) {
      const { upload, files, ...rest } = config;
      updateConfig(rest);
      setTimeout(() => {
        isUserInputtingUploadRef.current = false;
      }, 50);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      updateConfig({ upload: parsed, files: parsed });
      setTimeout(() => {
        isUserInputtingUploadRef.current = false;
      }, 50);
    } catch (error) {
      setTimeout(() => {
        isUserInputtingUploadRef.current = false;
      }, 50);
    }
  };

  // 弹窗编辑器处理函数 - 请求头
  const handleOpenHeadersEditor = () => {
    setTempHeadersCode(headersInput);
    setIsHeadersEditorOpen(true);
  };

  const handleSaveHeadersCode = () => {
    handleHeadersChange(tempHeadersCode);
    setIsHeadersEditorOpen(false);
  };

  // 弹窗编辑器处理函数 - params
  const handleOpenParamsEditor = () => {
    setTempParamsCode(paramsInput);
    setIsParamsEditorOpen(true);
  };

  const handleSaveParamsCode = () => {
    handleParamsChange(tempParamsCode);
    setIsParamsEditorOpen(false);
  };

  // 弹窗编辑器处理函数 - json
  const handleOpenJsonEditor = () => {
    setTempJsonCode(jsonInput);
    setIsJsonEditorOpen(true);
  };

  const handleSaveJsonCode = () => {
    handleJsonChange(tempJsonCode);
    setIsJsonEditorOpen(false);
  };

  // 弹窗编辑器处理函数 - data
  const handleOpenDataEditor = () => {
    setTempDataCode(dataInput);
    setIsDataEditorOpen(true);
  };

  const handleSaveDataCode = () => {
    handleDataChange(tempDataCode);
    setIsDataEditorOpen(false);
  };

  // 弹窗编辑器处理函数 - upload
  const handleOpenUploadEditor = () => {
    setTempUploadCode(uploadInput);
    setIsUploadEditorOpen(true);
  };

  const handleSaveUploadCode = () => {
    handleUploadChange(tempUploadCode);
    setIsUploadEditorOpen(false);
  };

  /** 将 formKey -> fileId 合并进 config.upload/files，并同步 uploadInput */
  const mergeUploadEntry = (formKey: string, fileId: string) => {
    const key = formKey.trim() || 'file';
    const current = config.upload ?? config.files ?? {};
    const next = { ...current, [key]: fileId };
    updateConfig({ upload: next, files: next });
    setUploadInput(JSON.stringify(next, null, 2));
    prevUploadRef.current = next;
  };

  /** 从 upload 中移除指定 formKey */
  const removeUploadEntry = (formKey: string) => {
    const current = config.upload ?? config.files ?? {};
    const next = { ...current };
    delete next[formKey];
    if (Object.keys(next).length === 0) {
      const { upload, files, ...rest } = config;
      updateConfig(rest);
      setUploadInput('');
      prevUploadRef.current = undefined;
    } else {
      updateConfig({ upload: next, files: next });
      setUploadInput(JSON.stringify(next, null, 2));
      prevUploadRef.current = next;
    }
  };

  const handleSelectUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!projectId) {
      toast.error('请先选择项目或打开工作流后再上传文件');
      return;
    }
    const formKey = uploadFormKey.trim() || 'file';
    try {
      const { fileId } = await metadataService.uploadFileForWorkflow(file, projectId);
      mergeUploadEntry(formKey, fileId);
      toast.success(`已上传：${file.name}`);
    } catch (err: any) {
      toast.error(err?.message ?? '文件上传失败');
    }
  };

  // 从环境变量中选择参数值的组件
  const VariableSelectParameterList: React.FC<{
    name: string;
    value: Record<string, any>;
    onChange: (value: Record<string, string>) => void;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    availableVariables?: Record<string, any>;
  }> = ({ name, value = {}, onChange, keyPlaceholder = '参数名', valuePlaceholder = '参数值', availableVariables = {} }) => {
    const idMapRef = React.useRef<Map<string, string>>(new Map());
    const nextIdRef = React.useRef(0);
    
    const entries = Object.entries(value);
    
    entries.forEach(([key]) => {
      if (!idMapRef.current.has(key)) {
        idMapRef.current.set(key, `${name}-${nextIdRef.current++}`);
      }
    });
    
    const currentKeys = new Set(entries.map(([key]) => key));
    idMapRef.current.forEach((id, key) => {
      if (!currentKeys.has(key)) {
        idMapRef.current.delete(key);
      }
    });
    
    const handleAdd = () => {
      onChange({ ...value, '': '' });
    };

    const handleRemove = (key: string) => {
      const newValue = { ...value };
      delete newValue[key];
      idMapRef.current.delete(key);
      onChange(newValue);
    };

    const handleKeyChange = (oldKey: string, newKey: string, currentValue: string) => {
      const updated: Record<string, string> = {};
      Object.entries(value).forEach(([k, v]) => {
        if (k !== oldKey) {
          updated[k] = String(v || '');
        }
      });
      if (newKey) {
        updated[newKey] = String(currentValue || '');
        if (oldKey !== newKey && idMapRef.current.has(oldKey)) {
          const id = idMapRef.current.get(oldKey)!;
          idMapRef.current.delete(oldKey);
          idMapRef.current.set(newKey, id);
        }
      }
      onChange(updated);
    };

    const handleValueChange = (key: string, newValue: string) => {
      const updated: Record<string, string> = {};
      Object.entries(value).forEach(([k, v]) => {
        updated[k] = String(v || '');
      });
      updated[key] = String(newValue || '');
      onChange(updated);
    };

    const variableKeys = Object.keys(availableVariables);

    return (
      <div className="space-y-2">
        {entries.map(([key, val]) => {
          const stableId = idMapRef.current.get(key) || `${name}-${key}`;
          return (
            <div key={stableId} className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <Select
                  value={variableKeys.includes(key) ? key : ''}
                  onValueChange={(newKey) => handleKeyChange(key, newKey, String(val || ''))}
                >
                  <SelectTrigger className={cn("w-full", INPUT_STYLE)}>
                    <SelectValue placeholder="从环境变量选择或手动输入" />
                  </SelectTrigger>
                  <SelectContent>
                    {variableKeys.map((varKey) => (
                      <SelectItem key={varKey} value={varKey}>
                        {varKey}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder={keyPlaceholder}
                  value={key}
                  onChange={(e) => handleKeyChange(key, e.target.value, String(val || ''))}
                  className={cn("w-full", INPUT_STYLE)}
                  autoComplete="off"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <Select
                  value={variableKeys.find(k => String(availableVariables[k] || '') === String(val || '')) || ''}
                  onValueChange={(varKey) => {
                    if (varKey) {
                      handleValueChange(key, String(availableVariables[varKey] || ''));
                    }
                  }}
                >
                  <SelectTrigger className={cn("w-full", INPUT_STYLE)}>
                    <SelectValue placeholder="从环境变量选择或手动输入" />
                  </SelectTrigger>
                  <SelectContent>
                    {variableKeys.map((varKey) => {
                      const varValue = String(availableVariables[varKey] || '');
                      return (
                        <SelectItem key={varKey} value={varKey}>
                          {varKey}: {varValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder={valuePlaceholder}
                  value={String(val || '')}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  className={cn("w-full", INPUT_STYLE)}
                  autoComplete="off"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={() => handleRemove(key)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleAdd}
        >
          <Plus className="w-3 h-3 mr-1" />
          添加参数
        </Button>
      </div>
    );
  };

  /** upload 模式下：表单字段（data）key-value 列表，仅当 paramType === 'upload' 时使用 */
  const UploadDataFieldList: React.FC<{
    value: Record<string, string>;
    onChange: (value: Record<string, string>) => void;
  }> = ({ value, onChange }) => {
    const entries = Object.entries(value);

    const handleAdd = () => {
      const next: Record<string, string> = { ...value };
      // 优先使用空 key 作为占位，如果已经存在则生成一个不冲突的占位 key
      let key = '';
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        let index = 1;
        // field_1, field_2 ... 避免覆盖已有字段
        while (Object.prototype.hasOwnProperty.call(next, `field_${index}`)) {
          index += 1;
        }
        key = `field_${index}`;
      }
      next[key] = '';
      onChange(next);
    };

    const handleRemove = (key: string) => {
      const next = { ...value };
      delete next[key];
      onChange(next);
    };

    const handleKeyChange = (oldKey: string, newKey: string, val: string) => {
      const trimmed = newKey.trim();
      const next: Record<string, string> = {};
      Object.entries(value).forEach(([k, v]) => {
        if (k === oldKey) {
          // 如果新 key 为空，则继续用旧 key，占位但不丢值
          const targetKey = trimmed || oldKey;
          next[targetKey] = val;
        } else {
          next[k] = v;
        }
      });
      onChange(next);
    };

    const handleValueChange = (key: string, v: string) => {
      onChange({ ...value, [key]: v });
    };

    return (
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <Input
              placeholder="字段名"
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value, val)}
              className={cn('flex-1 min-w-0', INPUT_STYLE)}
            />
            <Input
              placeholder="字段值"
              value={val}
              onChange={(e) => handleValueChange(key, e.target.value)}
              className={cn('flex-1 min-w-0', INPUT_STYLE)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleRemove(key)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={handleAdd}>
          <Plus className="w-3 h-3 mr-1" />
          添加表单字段
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-0">
      <Section title="API 配置">
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel required>请求方法</FormLabel>
            <Select
              value={config.method || 'GET'}
              onValueChange={(value) => updateConfig({ method: value as HttpConfig['method'] })}
            >
              <SelectTrigger className="w-full h-10 border-2 border-gray-300 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 域名配置 */}
          <div className="space-y-2">
            <FormLabel>域名</FormLabel>
            <Input
              placeholder="http://api.example.com"
              value={config.domain || ''}
              onChange={(e) => {
                const newDomain = e.target.value;
                const path = config.path || '';
                
                // 更新 domain，同时更新 url 为完整路径（域名和路径联动）
                const updates: Partial<HttpConfig> = { 
                  domain: newDomain,
                  url: newDomain && path
                    ? newDomain.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
                    : newDomain || path || undefined
                };
                
                updateConfig(updates);
              }}
              className={cn("w-full", INPUT_STYLE)}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              直接填写域名，如需使用变量请填写 $url 或 ${'{url}'} 格式
            </p>
          </div>

          <div className="space-y-2">
            <FormLabel required>请求路径</FormLabel>
            <Input
              placeholder="/api/v1/users"
              value={config.path || ''}
              onChange={(e) => {
                let inputValue = e.target.value;
                const domainValue = config.domain || '';
                
                // 如果输入的是完整URL（包含域名），自动提取路径部分
                if (domainValue && inputValue.startsWith(domainValue)) {
                  inputValue = inputValue.substring(domainValue.length);
                  // 确保路径以 / 开头
                  if (!inputValue.startsWith('/')) {
                    inputValue = '/' + inputValue;
                  }
                }
                
                // 更新 path，同时更新 url 为完整路径
                const updates: Partial<HttpConfig> = { 
                  path: inputValue,
                  url: domainValue 
                    ? domainValue.replace(/\/$/, '') + (inputValue.startsWith('/') ? inputValue : '/' + inputValue)
                    : inputValue
                };
                
                updateConfig(updates);
              }}
              className={cn("w-full", INPUT_STYLE)}
              autoComplete="off"
            />
            {(config.path || config.domain) && (
              <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                <div className="font-medium text-gray-700 mb-1">完整URL预览：</div>
                <div className="text-gray-600 break-all">{getFullUrlPreview()}</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <FormLabel required>参数类型</FormLabel>
            <Select
              value={paramType}
              onValueChange={(value) => {
                const newParamType = value as 'params' | 'json' | 'data' | 'upload';
                setParamType(newParamType);
                // 后端按 paramType 恢复请求体字段，必须与 bodyType 一起下发给后端
                const updates: Partial<HttpConfig> = { bodyType: newParamType, paramType: newParamType };
                
                // 根据新类型，清除其他类型的字段
                if (newParamType === 'params') {
                  // 保留 params，清除其他
                  const { json, data, upload, files, body, ...rest } = config;
                  updateConfig({ ...rest, ...updates });
                } else if (newParamType === 'json') {
                  // 保留 json，清除其他
                  const { params, data, upload, files, body, ...rest } = config;
                  updateConfig({ ...rest, ...updates });
                } else if (newParamType === 'data') {
                  // 保留 data，清除其他
                  const { params, json, upload, files, body, ...rest } = config;
                  updateConfig({ ...rest, ...updates });
                } else if (newParamType === 'upload') {
                  // 保留 upload/files 和 data（multipart 时 data 为表单文本字段），只清除 params/json/body
                  const { params, json, body, ...rest } = config;
                  updateConfig({ ...rest, ...updates });
                }
              }}
            >
              <SelectTrigger className={cn("w-full", INPUT_STYLE)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="params">params</SelectItem>
                <SelectItem value="json">json</SelectItem>
                <SelectItem value="data">data</SelectItem>
                <SelectItem value="upload">upload</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <FormLabel>超时时间（秒）</FormLabel>
            <Input
              type="number"
              placeholder="120"
              value={config.timeout !== undefined ? String(config.timeout) : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  // 如果为空，移除 timeout 字段
                  const { timeout, ...rest } = config;
                  updateConfig(rest);
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue > 0) {
                    updateConfig({ timeout: numValue });
                  }
                }
              }}
              className={cn("w-full", INPUT_STYLE)}
              min="1"
            />
            <p className="text-xs text-gray-500">默认 120 秒，可不填</p>
          </div>
        </div>
      </Section>

      <Section title="请求头" defaultOpen={false}>
        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenHeadersEditor}
              className="h-8 text-xs"
            >
              <Code2 className="w-3 h-3 mr-1.5" />
              在弹窗中编辑
            </Button>
          </div>
          <FormLabel>JSON 数据</FormLabel>
          <Textarea
            placeholder='{"key": "value"}'
            value={headersInput}
            onChange={(e) => handleHeadersChange(e.target.value)}
            className={cn("min-h-[120px]", TEXTAREA_STYLE)}
          />
        </div>
      </Section>

      <Section title="请求体" defaultOpen={false}>
        <div className="space-y-2">
          {paramType === 'params' && (
            <div className="space-y-2">
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenParamsEditor}
                  className="h-8 text-xs"
                >
                  <Code2 className="w-3 h-3 mr-1.5" />
                  在弹窗中编辑
                </Button>
              </div>
              <FormLabel>JSON 数据</FormLabel>
              <Textarea
                placeholder='{"key": "value"}'
                value={paramsInput}
                onChange={(e) => handleParamsChange(e.target.value)}
                className={cn("min-h-[120px]", TEXTAREA_STYLE)}
              />
            </div>
          )}

          {paramType === 'json' && (
            <div className="space-y-2">
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenJsonEditor}
                  className="h-8 text-xs"
                >
                  <Code2 className="w-3 h-3 mr-1.5" />
                  在弹窗中编辑
                </Button>
              </div>
              <FormLabel>JSON 数据</FormLabel>
              <Textarea
                placeholder='{"key": "value"}'
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                className={cn("min-h-[120px]", TEXTAREA_STYLE)}
              />
            </div>
          )}

          {paramType === 'data' && (
            <div className="space-y-2">
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenDataEditor}
                  className="h-8 text-xs"
                >
                  <Code2 className="w-3 h-3 mr-1.5" />
                  在弹窗中编辑
                </Button>
              </div>
              <FormLabel>JSON 数据</FormLabel>
              <Textarea
                placeholder='{"key": "value"}'
                value={dataInput}
                onChange={(e) => handleDataChange(e.target.value)}
                className={cn("min-h-[120px]", TEXTAREA_STYLE)}
              />
            </div>
          )}

          {paramType === 'upload' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[120px] space-y-1">
                  <FormLabel>表单字段名</FormLabel>
                  <Input
                    placeholder="file"
                    value={uploadFormKey}
                    onChange={(e) => setUploadFormKey(e.target.value)}
                    className={cn("w-full", INPUT_STYLE)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleSelectUploadFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!projectId}
                    className="h-9 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    选择文件
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenUploadEditor}
                    className="h-9 text-xs"
                  >
                    <Code2 className="w-3 h-3 mr-1.5" />
                    在弹窗中编辑
                  </Button>
                </div>
              </div>
              {(() => {
                const uploadObj = config.upload ?? config.files ?? {};
                const entries = Object.entries(uploadObj);
                if (entries.length > 0) {
                  return (
                    <div className="space-y-1">
                      <FormLabel>已选文件（formKey → fileId）</FormLabel>
                      <ul className="rounded border border-border bg-muted/30 p-2 space-y-1.5 max-h-[140px] overflow-y-auto">
                        {entries.map(([key, fileId]) => (
                          <li key={key} className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate font-mono" title={`${key} → ${fileId}`}>
                              {key} → {String(fileId).slice(0, 24)}{String(fileId).length > 24 ? '…' : ''}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={() => removeUploadEntry(key)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="space-y-2">
                <FormLabel>表单字段（data，JSON）</FormLabel>
                <p className="text-xs text-gray-500">
                  与文件一起发送的文本字段，如 name、filename、variationType 等，使用 JSON 对象填写
                </p>
                <Textarea
                  placeholder='{"filename": "xxx.xlsx", "variationType": "variation_create", "name": "测试"}'
                  value={dataInput}
                  onChange={(e) => handleDataChange(e.target.value)}
                  className={cn("min-h-[100px]", TEXTAREA_STYLE)}
                />
              </div>
              <FormLabel>JSON 数据（upload）</FormLabel>
              <Textarea
                placeholder='{"file": "fileId"} 或通过上方选择文件自动填充'
                value={uploadInput}
                onChange={(e) => handleUploadChange(e.target.value)}
                className={cn("min-h-[100px]", TEXTAREA_STYLE)}
              />
            </div>
          )}
        </div>
      </Section>

      <Section title="断言" defaultOpen={false}>
        <InlineAssertionRules
          rules={config.assertion?.rules || []}
          onChange={(rules) => {
            // 如果 rules 为 null，清空 assertion 对象；否则设置 assertion
            if (rules === null) {
              // 直接传递完整的 config（不包含 assertion），绕过 updateConfig 的合并逻辑
              // 这样可以确保 assertion 被完全删除，不会被重新添加回去
              const { assertion, ...restConfig } = config;
              const newConfig = { ...restConfig } as HttpConfig;
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

      {/* 请求头编辑器弹窗 */}
      <CodeEditorDialog
        open={isHeadersEditorOpen}
        onOpenChange={setIsHeadersEditorOpen}
        value={tempHeadersCode}
        onChange={setTempHeadersCode}
        language="json"
        title="编辑请求头"
        placeholder='{"key": "value"}'
        onSave={handleSaveHeadersCode}
      />

      {/* 请求体编辑器弹窗 - params */}
      <CodeEditorDialog
        open={isParamsEditorOpen}
        onOpenChange={setIsParamsEditorOpen}
        value={tempParamsCode}
        onChange={setTempParamsCode}
        language="json"
        title="编辑请求体 (params)"
        placeholder='{"key": "value"}'
        onSave={handleSaveParamsCode}
      />

      {/* 请求体编辑器弹窗 - json */}
      <CodeEditorDialog
        open={isJsonEditorOpen}
        onOpenChange={setIsJsonEditorOpen}
        value={tempJsonCode}
        onChange={setTempJsonCode}
        language="json"
        title="编辑请求体 (json)"
        placeholder='{"key": "value"}'
        onSave={handleSaveJsonCode}
      />

      {/* 请求体编辑器弹窗 - data */}
      <CodeEditorDialog
        open={isDataEditorOpen}
        onOpenChange={setIsDataEditorOpen}
        value={tempDataCode}
        onChange={setTempDataCode}
        language="json"
        title="编辑请求体 (data)"
        placeholder='{"key": "value"}'
        onSave={handleSaveDataCode}
      />

      {/* 请求体编辑器弹窗 - upload */}
      <CodeEditorDialog
        open={isUploadEditorOpen}
        onOpenChange={setIsUploadEditorOpen}
        value={tempUploadCode}
        onChange={setTempUploadCode}
        language="json"
        title="编辑请求体 (upload)"
        placeholder='{"key": "value"}'
        onSave={handleSaveUploadCode}
      />
    </div>
  );
};

