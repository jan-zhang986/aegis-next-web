import { generateId } from '../utils';
import type { StepListItem } from '../types';
import type { ParsedCaseItem } from '../components/CasePreviewAndSavePanel';

/** AI JSON 返回的单条用例结构 */
export interface JsonTestCase {
    name?: string;
    title?: string;
    level?: string;
    precondition?: string;
    steps?: Array<{ step: string; expected: string }>;
    description?: string;
}

/** 将 AI 返回的 JSON 用例数组转换为 ParsedCaseItem[] */
export function parseJsonCasesToParsedItems(testCases: JsonTestCase[]): ParsedCaseItem[] {
    return testCases.map((tc) => {
        const steps: StepListItem[] = (tc.steps || []).map((s) => ({
            id: generateId(),
            step: s.step || '',
            expected: s.expected || '',
        }));

        // 至少保留一个空步骤
        if (steps.length === 0) {
            steps.push({ id: generateId(), step: '', expected: '' });
        }

        return {
            id: generateId(),
            name: tc.name || tc.title || '新建用例',
            steps,
            selected: true,
            caseLevel: tc.level || 'P0',
            caseEditType: steps.length > 1 ? 'STEP' : 'STEP',
            prerequisite: tc.precondition || undefined,
            description: tc.description || undefined,
        };
    });
}

/**
 * 轻量修复 + 解析 JSON
 * 仅做最基本的修复（尾逗号），由于 AI 经常在 JSON 中输出 URL，不要用简单的正则去掉 //
 */
function safeParse(raw: string): any {
    let text = raw.trim();
    if (!text) return null;
    // 移除 BOM 和不可见字符
    text = text.replace(/^\uFEFF/, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // 直接解析
    try { return JSON.parse(text); } catch { /* continue */ }

    // 修复尾逗号
    const fixed = text.replace(/,\s*([\]}])/g, '$1');
    try { return JSON.parse(fixed); } catch { /* continue */ }

    return null;
}

/** 检查对象是否像一个测试用例（避免把 tool_call、事件等带 name/title 的 JSON 误识别为用例） */
function looksLikeTestCase(obj: any): obj is JsonTestCase {
    if (!obj || typeof obj !== 'object') return false;
    const hasName = typeof obj.name === 'string' && obj.name.trim().length > 0;
    const hasTitle = typeof obj.title === 'string' && obj.title.trim().length > 0;
    if (!hasName && !hasTitle) return false;
    // 必须同时具备用例特征：有 steps 数组，或有 precondition/description/level 等字段
    // 否则会误匹配 Agent 返回的 tool_call（如 name: "list_knowledge_chunks"）、事件（name: "thinking"）等
    const hasSteps = Array.isArray(obj.steps);
    const hasPrecondition = typeof obj.precondition === 'string';
    const hasDescription = typeof obj.description === 'string';
    const hasLevel = typeof obj.level === 'string';
    return hasSteps || hasPrecondition || hasDescription || hasLevel;
}

/** 从解析结果中提取用例数组（支持 {test_cases:[...]}，{data:[...]} 或直接 [...] ） */
function extractCasesFromParsed(parsed: any): JsonTestCase[] | null {
    if (!parsed) return null;
    // {test_cases: [...]}
    if (Array.isArray(parsed.test_cases) && parsed.test_cases.length > 0) {
        const valid = parsed.test_cases.filter(looksLikeTestCase);
        return valid.length > 0 ? valid : null;
    }
    // {data: [...]} 兼容部分大模型将包装返回在 data 数组内
    if (Array.isArray(parsed.data) && parsed.data.length > 0) {
        const valid = parsed.data.filter(looksLikeTestCase);
        return valid.length > 0 ? valid : null;
    }
    // 直接数组 [{name, steps, ...}, ...]
    if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(looksLikeTestCase);
        return valid.length > 0 ? valid : null;
    }
    return null;
}

/**
 * 从文本中提取测试用例 JSON。
 * 策略：直接取能正常解析的 JSON，不做过度修复。
 * 1. 尝试整段解析（纯 JSON 字符串）
 * 2. 扫描所有 ```json 代码块，每个独立解析，合并有效用例
 * 3. 全文搜索 {"test_cases": [...]} 结构
 * 4. 全文搜索可能的 JSON 数组 [...]
 */
export function extractTestCasesJson(text: string): JsonTestCase[] | null {
    if (!text) return null;

    // 策略 1: 尝试直接解析整段文本
    const directCases = extractCasesFromParsed(safeParse(text));
    if (directCases) return directCases;

    // 策略 2: 扫描所有 json 代码块，每个独立尝试，合并能解析的
    const codeBlockMatches = text.match(/```(?:json)?\s*\n([\s\S]*?)```/g);
    let allExtractedCases: JsonTestCase[] = [];
    if (codeBlockMatches && codeBlockMatches.length > 0) {
        for (const block of codeBlockMatches) {
            const inner = block.replace(/```(?:json)?\s*\n?/, '').replace(/```\s*$/, '').trim();
            const cases = extractCasesFromParsed(safeParse(inner));
            if (cases) {
                allExtractedCases.push(...cases);
            }
        }
    }
    if (allExtractedCases.length > 0) return allExtractedCases;

    // 策略 3: 从文本中寻找 {"test_cases": [...]} 结构对应的对象块并解析
    let searchStart = 0;
    while (true) {
        const testCasesIdx = text.indexOf('"test_cases"', searchStart);
        if (testCasesIdx === -1) break;

        const braceStart = text.lastIndexOf('{', testCasesIdx);
        if (braceStart !== -1 && braceStart >= searchStart) {
            let depth = 0;
            let matched = false;
            for (let i = braceStart; i < text.length; i++) {
                if (text[i] === '{') depth++;
                else if (text[i] === '}') {
                    depth--;
                    if (depth === 0) {
                        const cases = extractCasesFromParsed(safeParse(text.slice(braceStart, i + 1)));
                        if (cases) {
                            allExtractedCases.push(...cases);
                        }
                        searchStart = i + 1;
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) {
                searchStart = testCasesIdx + 12;
            }
        } else {
            searchStart = testCasesIdx + 12;
        }
    }
    if (allExtractedCases.length > 0) return allExtractedCases;

    // 仅当文本中可能存在用例 JSON 时才做全文 [...] / {...} 扫描，避免把 Agent 的 tool_call、事件等误当用例
    const hasTestCaseHint = /"test_cases"|```json|"steps"\s*:\s*\[/.test(text);
    if (!hasTestCaseHint) return null;

    // 策略 4: 寻找最外层的 JSON 数组 [...] 并解析（没有 test_cases 包裹的情况）
    searchStart = 0;
    while (true) {
        const arrayStartIdx = text.indexOf('[', searchStart);
        if (arrayStartIdx === -1) break;

        let depth = 0;
        let matched = false;
        for (let i = arrayStartIdx; i < text.length; i++) {
            if (text[i] === '[') depth++;
            else if (text[i] === ']') {
                depth--;
                if (depth === 0) {
                    const cases = extractCasesFromParsed(safeParse(text.slice(arrayStartIdx, i + 1)));
                    if (cases) {
                        allExtractedCases.push(...cases);
                    }
                    searchStart = i + 1; // 找下一个可能的数组
                    matched = true;
                    break;
                }
            }
        }
        if (!matched) break; // 未闭合的括号
    }
    if (allExtractedCases.length > 0) return allExtractedCases;

    // 策略 5: 寻找最外层的 JSON 对象 {...} 并解析（例如被包裹在 { "data": [...] } 中的情况）
    searchStart = 0;
    while (true) {
        const objectStartIdx = text.indexOf('{', searchStart);
        if (objectStartIdx === -1) break;

        let depth = 0;
        let matched = false;
        for (let i = objectStartIdx; i < text.length; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}') {
                depth--;
                if (depth === 0) {
                    const cases = extractCasesFromParsed(safeParse(text.slice(objectStartIdx, i + 1)));
                    if (cases) {
                        allExtractedCases.push(...cases);
                    }
                    searchStart = i + 1; // 找下一个可能的对象
                    matched = true;
                    break;
                }
            }
        }
        if (!matched) break; // 未闭合的括号
    }
    if (allExtractedCases.length > 0) return allExtractedCases;

    return null;
}
