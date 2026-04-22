import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { INPUT_STYLE } from '../shared/constants';
import type { VariableExtractorConfig, ExtractionRule } from '../../types';

interface VariableExtractorNodeFormProps {
  config: VariableExtractorConfig;
  onChange: (config: VariableExtractorConfig) => void;
}

export const VariableExtractorNodeForm: React.FC<VariableExtractorNodeFormProps> = ({ config, onChange }) => {
  const extractions = config.extractions || [];

  const updateConfig = (updates: Partial<VariableExtractorConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addExtraction = () => {
    const newExtraction: ExtractionRule = {
      var_name: '',
      source_path: '',
      // type 字段不传，执行机不使用此字段
    };
    updateConfig({ extractions: [...extractions, newExtraction] });
  };

  const updateExtraction = (index: number, updates: Partial<ExtractionRule>) => {
    const newExtractions = [...extractions];
    newExtractions[index] = { ...newExtractions[index], ...updates };
    updateConfig({ extractions: newExtractions });
  };

  const removeExtraction = (index: number) => {
    const newExtractions = extractions.filter((_, i) => i !== index);
    updateConfig({ extractions: newExtractions });
  };

  return (
    <div className="space-y-0">
      <Section title="变量提取规则">
        <div className="space-y-4">
          {extractions.map((extraction, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">提取规则 {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                  onClick={() => removeExtraction(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <FormLabel required>变量名</FormLabel>
                <Input
                  placeholder="token"
                  value={extraction.var_name || ''}
                  onChange={(e) => updateExtraction(index, { var_name: e.target.value })}
                  className={INPUT_STYLE}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <FormLabel required>源路径（JMESPath）</FormLabel>
                <Input
                  placeholder="使用 JMESPath 语法，例如：body.data.token 或 body.data[0].id"
                  value={extraction.source_path || ''}
                  onChange={(e) => updateExtraction(index, { source_path: e.target.value })}
                  className={INPUT_STYLE}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  当前仅支持 JMESPath 语法提取变量
                </p>
              </div>

              <div className="space-y-2">
                <FormLabel>默认值（可选）</FormLabel>
                <Input
                  placeholder="当提取失败时使用的默认值"
                  value={extraction.default !== undefined ? String(extraction.default) : ''}
                  onChange={(e) => updateExtraction(index, { default: e.target.value })}
                  className={INPUT_STYLE}
                  autoComplete="off"
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addExtraction}
          >
            <Plus className="w-3 h-3 mr-1" />
            添加提取规则
          </Button>
        </div>
      </Section>
    </div>
  );
};

