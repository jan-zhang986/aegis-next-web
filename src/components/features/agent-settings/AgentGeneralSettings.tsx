/**
 * Agent 常规设置
 * 从 aegis-rag-frontend GeneralSettings.vue 迁移
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Globe } from 'lucide-react';

export function AgentGeneralSettings() {
  const [language, setLanguage] = useState('zh-CN');

  useEffect(() => {
    const saved = localStorage.getItem('locale') || localStorage.getItem('AegisRAG_locale');
    if (saved) setLanguage(saved);
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem('locale', value);
    localStorage.setItem('AegisRAG_locale', value);
    toast.success('语言设置已保存', {
      description: '页面即将刷新以应用更改'
    });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Card className="max-w-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          语言设置
        </CardTitle>
        <CardDescription>选择您习惯的界面显示语言</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
          <Label className="text-sm font-medium text-gray-700">界面语言</Label>
          <div className="space-y-1.5">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full sm:w-64 bg-white border-gray-200 focus:ring-blue-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">🇨🇳 简体中文</SelectItem>
                <SelectItem value="en-US">🇺🇸 English</SelectItem>
                <SelectItem value="ru-RU">🇷🇺 Русский</SelectItem>
                <SelectItem value="ko-KR">🇰🇷 한국어</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              更改语言后，需要刷新页面才能完全生效
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
