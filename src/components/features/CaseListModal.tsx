/**
 * 用例列表弹窗组件（按需求分组）
 * 用于变更原因/阻塞原因的用例详情展示
 */

import { useMemo } from 'react';
import { X, FileText, Target, Layers } from 'lucide-react';
import type { CaseWithRequirement } from '@/services/case-management/service-case-metrics';

interface CaseListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;                          // 弹窗标题（如"用例设计变更"）
  cases: CaseWithRequirement[];           // 用例列表
  type: 'change' | 'block';               // 类型：变更或阻塞
}

export function CaseListModal({
  isOpen,
  onClose,
  title,
  cases,
  type
}: CaseListModalProps) {
  // 按需求分组
  const groupedCases = useMemo(() => {
    const groups: {
      storyId: string | null;
      storyName: string;
      cases: CaseWithRequirement[];
    }[] = [];

    // 按需求ID分组
    const storyMap = new Map<string | null, CaseWithRequirement[]>();

    cases.forEach(caseItem => {
      const key = caseItem.storyId || null;
      if (!storyMap.has(key)) {
        storyMap.set(key, []);
      }
      storyMap.get(key)!.push(caseItem);
    });

    // 转换为数组，有需求的放前面
    storyMap.forEach((casesInGroup, storyId) => {
      groups.push({
        storyId,
        storyName: storyId ? (casesInGroup[0].storyName || storyId) : '未关联需求',
        cases: casesInGroup
      });
    });

    // 排序：有需求的在前，没有需求的在后
    groups.sort((a, b) => {
      if (a.storyId === null) return 1;
      if (b.storyId === null) return -1;
      return 0;
    });

    return groups;
  }, [cases]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-2xl w-[800px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <span className="text-sm text-gray-400">({cases.length}个用例)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 用例列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {groupedCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p>暂无用例数据</p>
            </div>
          ) : (
            groupedCases.map((group, groupIndex) => (
              <div key={group.storyId || 'no-story'} className="space-y-3">
                {/* 需求分组标题 */}
                <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                  <Target className={`w-4 h-4 ${group.storyId ? 'text-green-400' : 'text-gray-500'}`} />
                  <span className="text-sm font-semibold text-white">
                    {group.storyName}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({group.cases.length}个用例)
                  </span>
                  {group.storyId && (
                    <span className="text-xs font-mono text-gray-500">
                      {group.storyId}
                    </span>
                  )}
                </div>

                {/* 该需求下的用例列表 */}
<div className="space-y-2 pl-6">
                  {group.cases.map((caseItem, caseIndex) => (
                    <div
                      key={`${caseItem.caseId}-${caseItem.createTime}-${caseIndex}`}
                      className="flex items-start gap-3 p-3 rounded bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white line-clamp-1">
                            {caseItem.caseName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="font-mono">#{caseItem.caseNum}</span>
                          <span>·</span>
                          <span>CS分值: {caseItem.csScore?.toFixed(1) || 0}</span>
                          <span>·</span>
                          <span>复杂度: {caseItem.complexityLevel || 'N/A'}</span>
                          {caseItem.testPlanName && (
                            <>
                              <span>·</span>
                              <span className="text-purple-400">{caseItem.testPlanName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

