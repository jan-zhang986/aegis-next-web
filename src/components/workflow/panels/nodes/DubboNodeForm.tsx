import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { InlineAssertionRules } from '../shared/InlineAssertionRules';
import { InlineExtractionRules } from '../shared/InlineExtractionRules';
import { ParamTypesEditor } from '../shared/ParamTypesEditor';
import { INPUT_STYLE, TEXTAREA_STYLE } from '../shared/constants';
import { workflowService } from '@/services/workflow';
import type { DubboConfig } from '../../types';

interface DubboNodeFormProps {
  config: DubboConfig;
  onChange: (config: DubboConfig) => void;
  projectId?: string;
}

export const DubboNodeForm: React.FC<DubboNodeFormProps> = ({ config, onChange, projectId }) => {
  // 保存用户输入的原始字符串，用于 Textarea 的 value（即使不是有效的 JSON 也能显示）
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
  const [paramsError, setParamsError] = useState<string>('');

  // 使用 useRef 保存最新的 onChange 引用
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 初始化 url 字段值（首次创建时设置变量占位符）
  useEffect(() => {
    // 如果 url 为空，则设置为变量占位符
    if (!config.url) {
      onChangeRef.current({ ...config, url: '${dubbo_url}' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateConfig = (updates: Partial<DubboConfig>) => {
    onChange({ ...config, ...updates });
  };


  // 格式化params为JSON字符串用于显示
  const formatParams = (params: any): string => {
    if (params === null || params === undefined) {
      return '';
    }
    try {
      return JSON.stringify(params, null, 2);
    } catch {
      return String(params);
    }
  };

  // 当 config.params 从外部更新时（比如初始化），同步更新 paramsInput
  // 使用 useRef 来跟踪上一次的 config.params 和 paramsInput，避免在用户输入时被重置
  const prevParamsRef = React.useRef(config.params);
  const paramsInputRef = React.useRef(paramsInput);
  const isUserInputtingRef = React.useRef(false);
  
  // 同步 paramsInputRef
  useEffect(() => {
    paramsInputRef.current = paramsInput;
  }, [paramsInput]);

  useEffect(() => {
    // 只有当 config.params 真正变化时才更新（比如从外部初始化或更新）
    if (prevParamsRef.current !== config.params) {
      const formatted = formatParams(config.params);
      const currentInput = paramsInputRef.current;
      
      // 如果格式化后的值不等于当前输入值，且用户不在输入中，说明是从外部更新（比如初始化或保存后重新加载），需要同步
      if (formatted !== currentInput && !isUserInputtingRef.current) {
        setParamsInput(formatted);
        setParamsError(''); // 清除之前的错误
      }
      
      prevParamsRef.current = config.params;
    }
  }, [config.params]);

  // 验证并更新params
  const handleParamsChange = (value: string) => {
    // 标记用户正在输入
    isUserInputtingRef.current = true;
    // 先更新输入状态，这样 Textarea 的 value 会立即更新，用户可以继续输入
    setParamsInput(value);
    setParamsError('');

    if (!value.trim()) {
      updateConfig({ params: undefined });
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 50);
      return;
    }

    // 尝试解析 JSON，但不阻塞用户输入
    try {
      const parsed = JSON.parse(value);
      // 只有解析成功时才更新 config
      updateConfig({ params: parsed });
      // 更新后，延迟重置用户输入标志，确保 useEffect 不会覆盖
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 50);
    } catch (error) {
      // JSON 解析失败时，只显示错误信息，不更新 config
      // 这样用户可以继续输入，直到输入有效的 JSON
      setParamsError('JSON格式错误，请输入有效的JSON格式');
      // 解析失败时，延迟重置用户输入标志
      setTimeout(() => {
        isUserInputtingRef.current = false;
      }, 50);
    }
  };

  return (
    <div className="space-y-0">
      <Section title="Dubbo 配置">
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel required>注册中心地址</FormLabel>
            <Input
              placeholder="nacos://nacos.example.com:8848"
              value={config.url || ''}
              onChange={(e) => updateConfig({ url: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              直接填写地址，如需使用变量请填写 $dubbo_url 或 ${'{dubbo_url}'} 格式
            </p>
          </div>

          <div className="space-y-2">
            <FormLabel>应用名称</FormLabel>
            <Input
              placeholder="spotter-order"
              value={config.application_name || ''}
              onChange={(e) => updateConfig({ application_name: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel required>接口名</FormLabel>
            <Input
              placeholder="com.spotter.order.api.IOrderService"
              value={config.interface_name || ''}
              onChange={(e) => updateConfig({ interface_name: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel required>方法名</FormLabel>
            <Input
              placeholder="getOrderInfo"
              value={config.method_name || ''}
              onChange={(e) => updateConfig({ method_name: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>站点租户</FormLabel>
            <Input
              placeholder="DEFAULT"
              value={config.site_tenant || ''}
              onChange={(e) => updateConfig({ site_tenant: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Dubbo Tag</FormLabel>
            <Input
              placeholder="分支环境标签（可选）"
              value={config.dubbo_tag || ''}
              onChange={(e) => updateConfig({ dubbo_tag: e.target.value || undefined })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>超时时间（毫秒）</FormLabel>
            <Input
              placeholder="30000"
              value={config.timeout !== undefined ? String(config.timeout) : ''}
              onChange={(e) => updateConfig({ timeout: e.target.value ? Number(e.target.value) : undefined })}
              className={INPUT_STYLE}
              type="number"
              autoComplete="off"
            />
          </div>
        </div>
      </Section>

      <Section title="参数类型 (param_types)" defaultOpen={false}>
        <ParamTypesEditor
          value={config.param_types}
          onChange={(value) => {
            updateConfig({ param_types: value.length > 0 ? value : undefined });
          }}
        />
      </Section>

      <Section title="参数 (params)" defaultOpen={false}>
        <div className="space-y-2">
          <Textarea
            placeholder='["value1", 123]'
            value={paramsInput}
            onChange={(e) => handleParamsChange(e.target.value)}
            className={cn("min-h-[100px]", TEXTAREA_STYLE)}
          />
          {paramsError && (
            <p className="text-xs text-red-500">{paramsError}</p>
          )}
          {!paramsError && paramsInput.trim() && (
            <p className="text-xs text-gray-500">
              {(() => {
                try {
                  const parsed = JSON.parse(paramsInput);
                  if (Array.isArray(parsed)) {
                    return `✓ 数组格式，共 ${parsed.length} 个参数`;
                  } else if (typeof parsed === 'object' && parsed !== null) {
                    return `✓ 对象格式，共 ${Object.keys(parsed).length} 个参数`;
                  }
                } catch (e) {
                  return '';
                }
                return '';
              })()}
            </p>
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
              const newConfig = { ...restConfig } as DubboConfig;
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

