import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FolderGit2,
  Plus,
  GitBranch,
  ArrowRight,
  Sparkles,
  PackageCheck,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface CaseRepositorySpaceManagerProps {
  repoList: string[];
  selectedRepo: string;
  onSelectRepo: (repo: string) => void;
  onCreateRepo: () => void;
}

export function CaseRepositorySpaceManager({
  repoList,
  selectedRepo,
  onSelectRepo,
  onCreateRepo,
}: CaseRepositorySpaceManagerProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* 头部大盘 Banner */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  测试用例库与空间中心 (Case Repositories Hub)
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  代码库全统一管理
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                每个用例库类似于独立的代码仓库，支持独立的模块划分与以 <code className="bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded font-mono text-[11px]">master</code> 为首的主干版本基线管理。点击卡片进入对应用例库。
              </p>
            </div>
          </div>

          <Button
            onClick={onCreateRepo}
            className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            新建测试用例库
          </Button>
        </div>

        {/* 用例库卡片大盘网格 (Card Grid) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              现有用例库 ({repoList.length})
            </h3>
            <span className="text-xs text-slate-400">当前活跃: <strong className="text-blue-600">{selectedRepo}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repoList.map((r) => {
              const isSelected = selectedRepo === r;
              return (
                <Card
                  key={r}
                  className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-lg translate-y-[-2px]'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:translate-y-[-2px]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                          }`}
                        >
                          <PackageCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {r}
                          </h4>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold mt-1">
                            <GitBranch className="w-3 h-3" />
                            master 主干分支
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                      {r === '示例用例库'
                        ? '系统默认主示例用例库，全量关联现存测试用例集、功能模块树与 Workflow 执行步骤。'
                        : `核心功能业务用例库，包含独立模块划分与 master 版本基线管控。`}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>⚡ 128 用例</span>
                      <span>•</span>
                      <span>🌿 3 分支</span>
                    </div>

                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSelectRepo(r)}
                      className={`rounded-xl font-bold gap-1 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <span>{isSelected ? '已进入用例库' : '进入用例库'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}

            {/* 新建用例库 虚线卡片 */}
            <div
              onClick={onCreateRepo}
              className="group cursor-pointer rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-6 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
                  新建测试用例库
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  创建新的项目用例库，拥有独立模块划分与 master 主干版本
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
