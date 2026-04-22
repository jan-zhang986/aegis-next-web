/**
 * 富文本 HTML 内容渲染
 * 使用 DOMPurify 安全渲染 TipTap 输出的 HTML
 * 图片需鉴权：/attachment/ 路径的图片通过 http 带 token 拉取后转 blob URL 显示
 * 参考 metersphere-frontend：img src 存相对路径 /attachment/download/file/{projectId}/{fileId}/true
 * 请求时走 /api 前缀以便代理转发并携带 X-AUTH-TOKEN
 */

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/utils/cn';
import { http } from '@/utils/request';
import { ImagePreview } from '@/components/ui/image-preview';

interface HtmlContentProps {
  content?: string | null;
  className?: string;
}

const ALLOWED_TAGS = ['p', 'span', 'div', 'a', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'hr', 'blockquote', 'code', 'pre', 'img'];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'style', 'class', 'src', 'alt', 'loading'];

const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

/** 从 img src 提取请求路径：支持相对 /attachment/... 或完整 URL，返回带 /api 前缀的相对路径供 http 请求 */
function toAuthRequestPath(src: string): string {
  if (!src?.trim()) return '';
  try {
    if (src.startsWith('http')) {
      const u = new URL(src);
      const path = u.pathname;
      if (path.includes('/attachment/')) {
        // 如果已经是完整 URL，提取路径部分并添加 /api 前缀
        return `${API_PREFIX}${path.startsWith('/') ? path : '/' + path}`;
      }
    } else if (src.startsWith('/attachment/')) {
      // 相对路径：/attachment/... -> /api/attachment/...
      return `${API_PREFIX}${src}`;
    }
  } catch {
    // ignore
  }
  return '';
}

export function HtmlContent({ content, className }: HtmlContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const sanitized = useMemo(() => {
    if (!content?.trim()) return '';
    return DOMPurify.sanitize(content, { ALLOWED_TAGS, ALLOWED_ATTR });
  }, [content]);

  const blobUrlsRef = useRef<string[]>([]);
  const handleImgClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && target instanceof HTMLImageElement && target.src) {
      e.preventDefault();
      setPreviewSrc(target.src);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('click', handleImgClick);
    return () => el.removeEventListener('click', handleImgClick);
  }, [handleImgClick]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !sanitized) return;
    blobUrlsRef.current = [];
    let cancelled = false;
    const imgs = el.querySelectorAll<HTMLImageElement>('img[src]');
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      const requestPath = toAuthRequestPath(src || '');
      if (!requestPath) {
        // 非 /attachment/ 路径的图片直接使用原始 src（如 data URL、外部 URL 等）
        return;
      }
      // 对于 /attachment/ 路径的图片，通过 axios 请求 blob 以携带认证 token
      // 参考 metersphere-frontend：虽然它直接使用图片 URL，但那是基于 cookie 认证
      // 当前项目使用 header 认证（X-AUTH-TOKEN），所以必须通过 axios 请求
      http.get<Blob>(requestPath, { responseType: 'blob' })
        .then((blob) => {
          if (cancelled) return;
          const blobUrl = URL.createObjectURL(blob as unknown as Blob);
          blobUrlsRef.current.push(blobUrl);
          img.src = blobUrl;
        })
        .catch((error) => {
          // 静默处理错误，避免在控制台产生过多错误日志
          // 图片加载失败时保持原始 src（可能显示为破损图片）
          if (process.env.NODE_ENV === 'development') {
            console.debug('[HtmlContent] 图片加载失败:', requestPath, error.message);
          }
        });
    });
    return () => {
      cancelled = true;
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, [sanitized]);

  if (!sanitized) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn('html-content text-gray-900 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:cursor-pointer [&_img]:hover:opacity-90', className)}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
      <ImagePreview
        src={previewSrc || ''}
        open={!!previewSrc}
        onOpenChange={(open) => !open && setPreviewSrc(null)}
      />
    </>
  );
}
