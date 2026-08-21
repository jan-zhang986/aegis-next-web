import type { QualityAnalysisInput, QualityAnalysisItem, QualityAnalysisSection } from '@/services/quality-workspace';

export const ANALYSIS_SECTION_ORDER = [
  'OVERVIEW',
  'REQUIREMENT_ANALYSIS',
  'FUNCTIONAL_TEST',
  'NON_FUNCTIONAL',
  'REGRESSION',
  'JOINT_CASE',
] as const;

export const ANALYSIS_SECTION_LABEL: Record<string, string> = {
  OVERVIEW: '概述',
  REQUIREMENT_ANALYSIS: '需求分析',
  FUNCTIONAL_TEST: '功能测试',
  NON_FUNCTIONAL: '非功能',
  REGRESSION: '回归',
  JOINT_CASE: '联调',
};

export interface WorkspaceReferenceLink {
  id: string;
  label: string;
  url?: string;
  source: 'workspace' | 'input';
}

export interface WorkspaceReferenceBundle {
  prdUrl?: string;
  designUrl?: string;
  apiDocUrl?: string;
  targetName?: string;
}

const INPUT_TYPE_LABEL: Record<string, string> = {
  REQUIREMENT: '需求文档',
  PRD: 'PRD',
  TECH_DESIGN: '技术设计',
  API_DOC: '接口文档',
  OTHER: '其他资料',
};

export function sortAnalysisSections(sections: QualityAnalysisSection[] = []) {
  return [...sections].sort((a, b) => {
    const ai = ANALYSIS_SECTION_ORDER.indexOf(a.sectionKey as typeof ANALYSIS_SECTION_ORDER[number]);
    const bi = ANALYSIS_SECTION_ORDER.indexOf(b.sectionKey as typeof ANALYSIS_SECTION_ORDER[number]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || (a.sort ?? 0) - (b.sort ?? 0);
  });
}

export function filterItemsBySection(items: QualityAnalysisItem[] = [], sectionKey?: string | null) {
  if (!sectionKey) return [];
  return items.filter((item) => item.sectionKey === sectionKey);
}

export function filterCasesBySectionItems<T extends { workItemId?: string }>(
  cases: T[],
  items: QualityAnalysisItem[]
) {
  const ids = new Set(items.map((i) => i.workItemId).filter(Boolean));
  return cases.filter((c) => c.workItemId && ids.has(c.workItemId));
}

export function countItemsBySection(items: QualityAnalysisItem[] = [], sectionKey: string) {
  return items.filter((item) => item.sectionKey === sectionKey).length;
}

export function buildWorkspaceReferenceLinks(
  bundle: WorkspaceReferenceBundle = {},
  inputs: QualityAnalysisInput[] = []
): WorkspaceReferenceLink[] {
  const links: WorkspaceReferenceLink[] = [];

  if (bundle.prdUrl) {
    links.push({ id: 'workspace-prd', label: 'PRD', url: bundle.prdUrl, source: 'workspace' });
  }
  if (bundle.designUrl) {
    links.push({ id: 'workspace-design', label: '技术设计', url: bundle.designUrl, source: 'workspace' });
  }
  if (bundle.apiDocUrl) {
    links.push({ id: 'workspace-api', label: '接口文档', url: bundle.apiDocUrl, source: 'workspace' });
  }

  inputs.forEach((input, index) => {
    links.push({
      id: input.inputId || `input-${index}`,
      label: `${INPUT_TYPE_LABEL[input.inputType] || input.inputType}${input.title ? ` · ${input.title}` : ''}`,
      url: input.refUrl,
      source: 'input',
    });
  });

  return links;
}

export function pickPrimaryReferenceUrl(links: WorkspaceReferenceLink[]) {
  return links.find((link) => link.url && /prd|需求/i.test(link.label))?.url
    || links.find((link) => link.url)?.url;
}
