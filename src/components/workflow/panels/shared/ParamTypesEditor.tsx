import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { INPUT_STYLE } from './constants';

// 常见参数类型列表
const COMMON_PARAM_TYPES = [
  'java.lang.String',
  'java.lang.Integer',
  'java.lang.Long',
  'java.lang.Boolean',
  'java.lang.Double',
  'java.util.List',
  'java.util.Map',
  'java.util.Set',
];

// 参数类型项
interface ParamTypeItem {
  id: string;
  type: 'basic' | 'custom';
  value: string;
  enabled: boolean;
}

interface ParamTypesEditorProps {
  value?: string[];  // param_types数组
  onChange: (value: string[]) => void;
}

export const ParamTypesEditor: React.FC<ParamTypesEditorProps> = ({ value = [], onChange }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'custom'>('basic');
  const [items, setItems] = useState<ParamTypeItem[]>([]);

  // 序列化为字符串数组
  const serializeItems = useCallback((itemsToSerialize: ParamTypeItem[]): string[] => {
    return itemsToSerialize
      .filter(item => item.enabled && item.value.trim() !== '')
      .map(item => item.value);
  }, []);

  // 从value解析为内部结构（只在value真正变化时更新，避免编辑时丢失状态）
  useEffect(() => {
    // 比较当前items的序列化结果和新的value，如果相同则不更新
    const currentSerialized = serializeItems(items);
    const valueChanged = 
      currentSerialized.length !== value.length ||
      currentSerialized.some((v, i) => v !== value[i]);

    if (!valueChanged && items.length > 0) {
      return; // 值没有变化，不更新
    }

    const parsed: ParamTypeItem[] = value.map((type, index) => {
      const isCustom = !COMMON_PARAM_TYPES.includes(type);
      return {
        id: `param-${index}-${type}-${index}`, // 使用更稳定的id生成方式
        type: isCustom ? 'custom' : 'basic',
        value: type,
        enabled: true,
      };
    });

    setItems(parsed);

    // 根据解析结果设置默认Tab
    if (parsed.length > 0) {
      const hasCustom = parsed.some(item => item.type === 'custom');
      if (hasCustom && activeTab === 'basic') {
        setActiveTab('custom');
      } else if (!hasCustom && activeTab === 'custom') {
        setActiveTab('basic');
      }
    } else if (items.length === 0 && parsed.length === 0) {
      // 如果都是空，保持当前Tab
    } else {
      setActiveTab('basic');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, serializeItems]);

  // 更新项
  const updateItem = (index: number, updates: Partial<ParamTypeItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
    onChange(serializeItems(newItems));
  };

  // 删除项
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(serializeItems(newItems));
  };

  // 添加基础类型项
  const addBasicItem = () => {
    const newItem: ParamTypeItem = {
      id: `param-${Date.now()}-${Math.random()}`,
      type: 'basic',
      value: 'java.lang.String',
      enabled: true,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setActiveTab('basic');
    onChange(serializeItems(newItems));
  };

  // 添加自定义类型项
  const addCustomItem = () => {
    const newItem: ParamTypeItem = {
      id: `param-${Date.now()}-${Math.random()}`,
      type: 'custom',
      value: '',
      enabled: true,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setActiveTab('custom');
    onChange(serializeItems(newItems));
  };

  // 分离基础类型和自定义类型
  const basicItems = useMemo(() => items.filter(item => item.type === 'basic'), [items]);
  const customItems = useMemo(() => items.filter(item => item.type === 'custom'), [items]);

  // 处理类型选择（从基础类型切换到自定义类型）
  const handleTypeChange = (index: number, selectedValue: string) => {
    if (selectedValue === 'custom') {
      // 切换到自定义类型Tab并添加新项
      setActiveTab('custom');
      addCustomItem();
    } else {
      // 更新为选中的基础类型
      updateItem(index, { value: selectedValue });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'basic' | 'custom')}>
        <TabsList>
          <TabsTrigger value="basic">
            基础类型 ({basicItems.length})
          </TabsTrigger>
          <TabsTrigger value="custom">
            自定义类型 ({customItems.length})
          </TabsTrigger>
        </TabsList>

        {/* 基础类型Tab */}
        <TabsContent value="basic" className="mt-4">
          {basicItems.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center">
              暂无基础类型参数，点击下方按钮添加
            </div>
          ) : (
            <div className="space-y-2">
              {basicItems.map((item, originalIndex) => {
                const index = items.findIndex(i => i.id === item.id);
                return (
                  <div key={item.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white">
                    <Checkbox
                      checked={item.enabled}
                      onCheckedChange={(checked) => updateItem(index, { enabled: checked as boolean })}
                    />
                    <Select
                      value={item.value}
                      onValueChange={(value) => handleTypeChange(index, value)}
                    >
                      <SelectTrigger className={cn("flex-1", INPUT_STYLE)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_PARAM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.split('.').pop()}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">自定义类型</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={addBasicItem}
            className="w-full mt-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            添加基础类型参数
          </Button>
        </TabsContent>

        {/* 自定义类型Tab */}
        <TabsContent value="custom" className="mt-4">
          {customItems.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center">
              暂无自定义类型参数，点击下方按钮添加
            </div>
          ) : (
            <div className="space-y-2">
              {customItems.map((item, originalIndex) => {
                const index = items.findIndex(i => i.id === item.id);
                return (
                  <div key={item.id} className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={item.enabled}
                          onCheckedChange={(checked) => updateItem(index, { enabled: checked as boolean })}
                        />
                        <Label className="text-xs text-gray-600">启用</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">自定义类型</Label>
                      <Input
                        value={item.value}
                        onChange={(e) => updateItem(index, { value: e.target.value })}
                        placeholder="请输入自定义类型，如：com.example.CustomType"
                        className={cn("font-mono", INPUT_STYLE)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={addCustomItem}
            className="w-full mt-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            添加自定义类型参数
          </Button>
        </TabsContent>
      </Tabs>

      {items.length === 0 && (
        <div className="text-xs text-gray-400 text-center py-2">
          提示：参数类型将按照启用顺序保存为数组
        </div>
      )}
    </div>
  );
};

