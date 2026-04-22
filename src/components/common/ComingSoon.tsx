/**
 * 即将开放占位组件
 * 用于显示功能即将开放的提示页面
 */

import { Clock, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({ 
  title = '即将开放，敬请期待',
  description = '该功能正在开发中，敬请期待...'
}: ComingSoonProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-0 overflow-hidden">
      <div className="text-center space-y-6 px-6 max-w-md">
        {/* 图标 */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-2xl" />
          <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
            <Clock className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-900" />
            </div>
          </div>
        </div>

        {/* 标题 */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-600 text-lg">
            {description}
          </p>
        </div>

        {/* 装饰性元素 */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

