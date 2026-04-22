
// Mock dependencies
const generateId = () => 'mock-id';

// Extracted logic from CasePreviewAndSavePanel.tsx

const CASE_MD_TITLES = {
    PRE_REQUISITE: '前置条件',
    STEP_DESCRIPTION: '步骤描述',
    TEXT_DESCRIPTION: '文本描述',
    EXPECTED_RESULT: '预期结果',
    DESCRIPTION: '备注',
} as const;

const MD_START_TAG = 'featureCaseStart';

function extractNumberedItems(text: string): string[] {
    const normalized = (text || '').replace(/<br\s*\/?>/gi, '\n').trim();
    const lines = normalized.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const items: string[] = [];
    for (const line of lines) {
        const m = line.match(/^\d+[.)、]\s*(.+)$/);
        items.push(m ? m[1].trim() : line);
    }
    return items;
}

function expandStepCell(stepStr: string, expectedStr: string): any[] {
    const stepItems = extractNumberedItems(stepStr);
    const expectedItems = extractNumberedItems(expectedStr);
    if (stepItems.length <= 1) {
        return [{
            id: generateId(),
            step: (stepStr || '').replace(/<br\s*\/?>/gi, '\n').trim(),
            expected: (expectedStr || '').replace(/<br\s*\/?>/gi, '\n').trim(),
        }];
    }
    const result: any[] = [];
    for (let i = 0; i < stepItems.length; i++) {
        result.push({
            id: generateId(),
            step: stepItems[i] ?? '',
            expected: expectedItems[i] ?? '',
        });
    }
    return result;
}

function parseStepTable(content: string): any[] {
    const steps: any[] = [];
    const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
    let inTable = false;
    const sep = /\|\s*[-:]+\s*\|/;
    for (const line of lines) {
        if (line.startsWith('|') && line.endsWith('|')) {
            if (sep.test(line)) {
                inTable = true;
                continue;
            }
            if (inTable) {
                const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
                if (cells.length >= 2) {
                    const expanded = expandStepCell(cells[0], cells[1]);
                    steps.push(...expanded);
                }
            }
        } else {
            inTable = false;
        }
    }
    return steps;
}

function parseStepList(content: string): any[] {
    const steps: any[] = [];
    const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
        const m1 = line.match(/^(\d+)[.)]\s*(.+?)(?:\s+预期[：:]\s*(.+))?$/i);
        const m2 = line.match(/^[-*]\s*(.+?)(?:\s+预期[：:]\s*(.+))?$/i);
        let step = '';
        let expected = '';
        if (m1) {
            step = m1[2].trim();
            expected = (m1[3] || '').trim();
        } else if (m2) {
            step = m2[1].trim();
            expected = (m2[2] || '').trim();
        } else if (/^\d+[.)]\s+/.test(line) || /^[-*]\s+/.test(line)) {
            step = line.replace(/^[\d.)\-\*]+\s*/, '').trim();
        }
        if (step) {
            steps.push({ id: generateId(), step, expected });
        }
    }
    return steps;
}

function splitByH3(block: string): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = block.split(/(?=^###\s+)/m).filter(Boolean);
    for (const part of parts) {
        const firstLine = part.split('\n')[0] || '';
        const titleMatch = firstLine.match(/^###\s+(.+?)(?:\n|$)/);
        if (titleMatch) {
            const key = titleMatch[1].trim();
            const body = part.replace(/^###\s+.+?\n?/, '').trim();
            result[key] = body;
        }
    }
    return result;
}

// PROPOSED FIX
function truncateToPreconditionOnly(content: string, allowNumberedList = false): string {
    if (!content?.trim()) return '';
    const lines = content.split('\n');
    const result: string[] = [];

    // New flag to auto-enable list allowance if we see a header-like line
    let hasFoundHeader = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'caseExpand') continue;
        if (/^\|/.test(trimmed)) break;
        if (/^###\s+/.test(trimmed)) break;

        // Detect header-like lines and skip them used to enable list mode
        // Regex for: 前置条件, **前置条件**, 前置条件：, **前置条件**：
        if (/^(\*\*)?前置条件(\*\*)?[:：]?$/.test(trimmed)) {
            hasFoundHeader = true;
            continue; // Don't include the header itself in the value
        }

        // if detected header, we allow numbered list
        const effectiveAllowList = allowNumberedList || hasFoundHeader;

        if (!effectiveAllowList && /^\d+[.)、]\s+\S/.test(trimmed)) break;

        result.push(line);
    }
    let out = result.join('\n').trim();
    if (out === '无') return '';
    return out;
}

function parseAiContentToMultipleCases(content: string): any[] {
    const text = (content || '').trim();
    if (!text) return [];

    const cases: any[] = [];
    const blocks = text.split(MD_START_TAG).filter((b) => b.trim());

    for (const block of blocks) {
        const trimmed = block.replace(/featureCaseEnd/g, '').trim();
        if (!trimmed) continue;

        const sections = splitByH3(trimmed);
        const nameMatch = trimmed.match(/^##\s+(.+?)(?:\n|$)/m);
        if (!nameMatch) continue;

        const name = nameMatch[1].trim().replace(/^[#\s]*/, '').slice(0, 255) || '新建用例';

        // implicitPrerequisite logic
        let implicitPrerequisite = '';
        const titleIndex = nameMatch.index! + nameMatch[0].length;
        const afterTitle = trimmed.slice(titleIndex);
        let raw = '';
        const firstSectionIndex = afterTitle.search(/^###\s+/m);
        if (firstSectionIndex !== -1) {
            raw = afterTitle.slice(0, firstSectionIndex).trim();
        } else {
            const tableIndex = afterTitle.search(/^\s*\|/m);
            if (tableIndex !== -1) {
                raw = afterTitle.slice(0, tableIndex).trim();
            }
        }
        implicitPrerequisite = truncateToPreconditionOnly(raw);

        const stepContent = sections[CASE_MD_TITLES.STEP_DESCRIPTION] ?? '';
        const textDesc = sections[CASE_MD_TITLES.TEXT_DESCRIPTION] ?? '';
        let steps = parseStepTable(stepContent);
        if (steps.length === 0) steps = parseStepTable(trimmed);

        const hasStepTable = steps.length > 0;
        let displaySteps: any[];
        if (hasStepTable) {
            displaySteps = steps;
        } else if (textDesc) {
            const expected = sections[CASE_MD_TITLES.EXPECTED_RESULT] ?? '';
            displaySteps = [{ id: generateId(), step: textDesc.slice(0, 2000), expected }];
        } else {
            const listSteps = parseStepList(trimmed);
            displaySteps = listSteps.length > 0
                ? listSteps
                : [{ id: generateId(), step: trimmed.slice(0, 500), expected: '' }];
        }

        const caseEditType = hasStepTable || displaySteps.length > 1 ? 'STEP' : 'TEXT';

        let finalPrerequisite = sections[CASE_MD_TITLES.PRE_REQUISITE];
        if (finalPrerequisite && /^\s*\|/m.test(finalPrerequisite)) {
            const tableIdx = finalPrerequisite.search(/^\s*\|/m);
            if (tableIdx !== -1) finalPrerequisite = finalPrerequisite.slice(0, tableIdx).trim();
        }

        finalPrerequisite = finalPrerequisite ? truncateToPreconditionOnly(finalPrerequisite, true) : (implicitPrerequisite || undefined);

        cases.push({
            id: generateId(),
            name,
            steps: displaySteps,
            selected: true,
            caseLevel: 'P0',
            caseEditType,
            prerequisite: finalPrerequisite,
            textDescription: textDesc || undefined,
            expectedResult: sections[CASE_MD_TITLES.EXPECTED_RESULT] || undefined,
            description: sections[CASE_MD_TITLES.DESCRIPTION] || undefined,
        });
    }
    return cases;
}

// Test cases (fixed indentation for regex matching)
const inputs = [
    // Case 1: Implicit precondition with header-like text
    `featureCaseStart
## Case 1
前置条件
1. Login success

| Step | Expected |
| --- | --- |
| 1 | 1 |
featureCaseEnd`,
    // Case 2: Implicit precondition with bold header
    `featureCaseStart
## Case 2
**前置条件**
1. Login success

| Step | Expected |
| --- | --- |
| 1 | 1 |
featureCaseEnd`,
    // Case 3: Explicit H3 precondition
    `featureCaseStart
## Case 3
### 前置条件
1. Login success

| Step | Expected |
| --- | --- |
| 1 | 1 |
featureCaseEnd`
];

inputs.forEach((input, i) => {
    console.log(`--- Test Case ${i + 1} ---`);
    try {
        const result = parseAiContentToMultipleCases(input);
        console.log('Prerequisite:', JSON.stringify(result[0]?.prerequisite));
    } catch (e) {
        console.error(e);
    }
});
