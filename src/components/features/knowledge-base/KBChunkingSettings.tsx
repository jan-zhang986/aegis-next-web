/**
 * 知识库分块设置
 * 从 aegis-rag-frontend KBChunkingSettings.vue 迁移
 */

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  separators: string[];
}

const DEFAULT_SEPARATORS = ['\n\n', '\n', '。', '！', '？', ';', '；'];

interface KBChunkingSettingsProps {
  config: ChunkingConfig;
  onChange: (config: ChunkingConfig) => void;
}

export function KBChunkingSettings({ config, onChange }: KBChunkingSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-1">分块设置</h3>
        <p className="text-sm text-gray-500">配置文档切分的块大小与分隔符</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm">块大小 (chunk size)</Label>
          <p className="text-xs text-gray-500 mb-2">每个文本块的最大字符数，建议 100-4000</p>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.chunkSize]}
              min={100}
              max={4000}
              step={50}
              onValueChange={([v]) => onChange({ ...config, chunkSize: v })}
              className="flex-1 max-w-[200px] [&_[data-slot=slider-range]]:bg-blue-600 [&_[data-slot=slider-thumb]]:border-blue-600 [&_[data-slot=slider-thumb]]:ring-blue-600/50 [&_[data-slot=slider-thumb]]:hover:ring-blue-600"
            />
            <span className="text-sm text-gray-500 w-16">{config.chunkSize} 字</span>
          </div>
        </div>

        <div>
          <Label className="text-sm">重叠大小 (chunk overlap)</Label>
          <p className="text-xs text-gray-500 mb-2">相邻块之间的重叠字符数，建议 0-500</p>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.chunkOverlap]}
              min={0}
              max={500}
              step={20}
              onValueChange={([v]) => onChange({ ...config, chunkOverlap: v })}
              className="flex-1 max-w-[200px] [&_[data-slot=slider-range]]:bg-blue-600 [&_[data-slot=slider-thumb]]:border-blue-600 [&_[data-slot=slider-thumb]]:ring-blue-600/50 [&_[data-slot=slider-thumb]]:hover:ring-blue-600"
            />
            <span className="text-sm text-gray-500 w-16">{config.chunkOverlap} 字</span>
          </div>
        </div>

        <div>
          <Label className="text-sm">分隔符</Label>
          <p className="text-xs text-gray-500 mb-2">按优先级用于切分文本的分隔符</p>
          <Input
            value={config.separators.join(', ')}
            onChange={(e) =>
              onChange({
                ...config,
                separators: e.target.value
                  ? e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
                  : DEFAULT_SEPARATORS,
              })
            }
            placeholder="换行, 句号等，逗号分隔"
          />
        </div>
      </div>
    </div>
  );
}
