/**
 * DubboTestPage 站点列表：fetchSites、selectedSite、sites、sitesLoading、sitePopoverOpen
 */

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    chrome?: {
      runtime: { id?: string; sendMessage: (m: unknown, cb?: (r: unknown) => void) => void; lastError?: { message: string } };
    };
  }
}

export function useDubboSites() {
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState<Array<{ code: string; name?: string }>>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitePopoverOpen, setSitePopoverOpen] = useState(false);

  const fetchSites = async () => {
    try {
      setSitesLoading(true);
      const apiUrl = '/rpc/site-tenants';
      let data: { code?: number; data?: Array<{ code: string; name?: string }> };
      if (typeof window !== 'undefined' && window.chrome?.runtime?.id) {
        try {
          const res = await new Promise<{ ok?: boolean; body?: string; error?: string }>((resolve, reject) => {
            window.chrome!.runtime.sendMessage(
              { type: 'SEND_HTTP_REQUEST', payload: { url: apiUrl, method: 'GET', headers: { 'Content-Type': 'application/json' }, body: undefined } },
              (r: unknown) => {
                if (window.chrome?.runtime?.lastError) {
                  reject(new Error(window.chrome.runtime.lastError!.message));
                  return;
                }
                if (!r) { reject(new Error('未收到响应')); return; }
                const x = r as { ok?: boolean; body?: string; error?: string };
                if (x.ok === true) resolve(x);
                else reject(new Error(x?.error || '请求失败'));
              }
            );
          });
          data = JSON.parse(res.body || '{}');
        } catch {
          const r = await fetch(apiUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' }, mode: 'cors' });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          data = await r.json();
        }
      } else {
        const r = await fetch(apiUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' }, mode: 'cors' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        data = await r.json();
      }
      if (data.code === 200 && Array.isArray(data.data)) {
        setSites(data.data);
        if (data.data.length > 0) {
          setSelectedSite((prev) => (prev ? prev : (data.data![0]?.code ?? '')));
        }
      }
    } catch (e) {
      console.error('获取站点列表失败:', e);
    } finally {
      setSitesLoading(false);
    }
  };

  useEffect(() => { fetchSites(); }, []);

  return { selectedSite, setSelectedSite, sites, sitesLoading, sitePopoverOpen, setSitePopoverOpen, fetchSites };
}
