/**
 * 飞书缺陷管理页面组件
 * 由于飞书安全策略限制（X-Frame-Options），无法在 iframe 中嵌入
 * 改为提供友好的跳转界面
 */

import { ExternalLink, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FeishuBugEmbedProps {
  /** 飞书页面 URL */
  url?: string;
  /** 页面标题 */
  title?: string;
}

export function FeishuBugEmbed({ 
  url = 'https://project.feishu.cn/spotter-tech/bug/homepage',
  title = '缺陷管理'
}: FeishuBugEmbedProps) {
  // 在新窗口打开飞书页面
  const handleOpenInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <Card className="flex-1 flex flex-col m-4 min-h-0">
        <CardContent className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-6 max-w-lg text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Bug className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                由于飞书的安全策略限制，缺陷管理页面无法在当前页面中直接嵌入显示。
                <br />
                请点击下方按钮在新标签页中打开飞书缺陷管理页面。
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleOpenInNewTab} size="lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                在新标签页打开缺陷管理
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border w-full">
              <p className="text-xs text-muted-foreground">
                或者直接访问：
                <br />
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {url}
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
