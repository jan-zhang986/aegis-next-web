/**
 * 复制文本到剪贴板的工具函数
 * 支持 HTTPS 和 HTTP 环境，自动降级处理
 * 使用 copy 事件 + clipboardData.setData 确保内容真正写入剪贴板
 */

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (text == null || typeof text !== 'string' || text.length === 0) {
    return false;
  }

  // 1. 先尝试 copy 事件 + execCommand：在用户点击的同一事件栈内执行，由 clipboardData.setData 注入内容，粘贴最可靠
  const execSuccess = execCommandCopyWithClipboardEvent(text);
  if (execSuccess) return true;

  // 2. 再尝试 Clipboard API（部分环境可能不支持 execCommand）
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 忽略
    }
  }

  return false;
}

function execCommandCopyWithClipboardEvent(text: string): boolean {
  let success = false;

  const onCopy = (e: ClipboardEvent): void => {
    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    success = true;
  };

  try {
    document.addEventListener('copy', onCopy);

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.setAttribute('readonly', '');

    document.body.appendChild(textarea);

    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      textarea.setSelectionRange(0, text.length);
    } else {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
    }

    try {
      document.execCommand('copy');
    } catch {
      success = false;
    }

    document.body.removeChild(textarea);

    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  } catch (err) {
    console.error('复制失败:', err);
    success = false;
  } finally {
    document.removeEventListener('copy', onCopy);
  }

  return success;
}

