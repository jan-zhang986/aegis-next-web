
import { parseAiContentToMultipleCases } from './src/components/features/case-management/components/CasePreviewAndSavePanel.tsx';

// Mock generateId
// We need to bypass the import in the original file or mock it.
// Since we are running in node, we might have issues with imports.
// Let's try to just copy the relevant functions to test them in isolation if imports fail.

const inputs = [
    `
  featureCaseStart
  ## Case 1
  前置条件
  1. Login success
  
  | Step | Expected |
  | --- | --- |
  | 1 | 1 |
  featureCaseEnd
  `,
    `
  featureCaseStart
  ## Case 2
  **前置条件**
  1. Login success
  
  | Step | Expected |
  | --- | --- |
  | 1 | 1 |
  featureCaseEnd
  `,
    `
  featureCaseStart
  ## Case 3
  ### 前置条件
  1. Login success
  
  | Step | Expected |
  | --- | --- |
  | 1 | 1 |
  featureCaseEnd
  `
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
