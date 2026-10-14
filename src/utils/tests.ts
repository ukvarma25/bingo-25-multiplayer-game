import {
  checkCompletedLines,
  checkWinningLines,
  generateBoard,
  validateBoard,
  createEmptyBoard,
} from './gameLogic';

export interface TestCaseResult {
  id: number;
  name: string;
  passed: boolean;
  details: string;
}

export function runBingoAlgorithmTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Test 1: Valid board with numbers 1–25
  const validBoard = Array.from({ length: 25 }, (_, i) => i + 1);
  const val1 = validateBoard(validBoard);
  results.push({
    id: 1,
    name: 'Valid board with numbers 1–25 accepted',
    passed: val1.valid,
    details: val1.valid ? 'Board containing 1..25 validated successfully.' : val1.error || 'Failed',
  });

  // Test 2: Incomplete / missing number rejected
  const incompleteBoard = [...validBoard];
  incompleteBoard[24] = 0; // cell 24 empty
  const val2 = validateBoard(incompleteBoard);
  results.push({
    id: 2,
    name: 'Incomplete board (missing number) rejected',
    passed: !val2.valid && val2.filledCount === 24,
    details: `Properly rejected: "${val2.error}"`,
  });

  // Test 3: Duplicate number rejected
  const dupBoard = [...validBoard];
  dupBoard[1] = 1; // number 1 appears twice (at index 0 and index 1)
  const val3 = validateBoard(dupBoard);
  results.push({
    id: 3,
    name: 'Duplicate number rejected',
    passed: !val3.valid && val3.duplicates.includes(1),
    details: `Properly detected duplicates: ${val3.duplicates.join(', ')}`,
  });

  // Test 4: Empty board initialization
  const empty = createEmptyBoard();
  const val4 = validateBoard(empty);
  results.push({
    id: 4,
    name: 'Empty board initialization',
    passed: empty.length === 25 && empty.every((n) => n === 0) && !val4.valid,
    details: `Empty board initialized with 25 unplaced cells.`,
  });

  // Test 5: Horizontal line detected (Row 1)
  const markedRow1 = [1, 2, 3, 4, 5];
  const evalRow = checkCompletedLines(validBoard, markedRow1);
  results.push({
    id: 5,
    name: 'Horizontal line detected (Row 1)',
    passed: evalRow.count === 1 && evalRow.lines[0].label === 'Row 1',
    details: `Detected ${evalRow.count} line: ${evalRow.lines.map((l) => l.label).join(', ')}`,
  });

  // Test 6: Vertical line detected (Column 1)
  const markedCol1 = [1, 6, 11, 16, 21];
  const evalCol = checkCompletedLines(validBoard, markedCol1);
  results.push({
    id: 6,
    name: 'Vertical line detected (Column 1)',
    passed: evalCol.count === 1 && evalCol.lines[0].label === 'Column 1',
    details: `Detected ${evalCol.count} line: ${evalCol.lines.map((l) => l.label).join(', ')}`,
  });

  // Test 7: Main diagonal detected [0, 6, 12, 18, 24]
  const markedDiagMain = [1, 7, 13, 19, 25];
  const evalDiag1 = checkCompletedLines(validBoard, markedDiagMain);
  results.push({
    id: 7,
    name: 'Main diagonal detected [0, 6, 12, 18, 24]',
    passed: evalDiag1.count === 1 && evalDiag1.lines[0].label === 'Main Diagonal',
    details: `Detected: ${evalDiag1.lines.map((l) => l.label).join(', ')}`,
  });

  // Test 8: Opposite diagonal detected [4, 8, 12, 16, 20]
  const markedDiagOpp = [5, 9, 13, 17, 21];
  const evalDiag2 = checkCompletedLines(validBoard, markedDiagOpp);
  results.push({
    id: 8,
    name: 'Opposite diagonal detected [4, 8, 12, 16, 20]',
    passed: evalDiag2.count === 1 && evalDiag2.lines[0].label === 'Opposite Diagonal',
    details: `Detected: ${evalDiag2.lines.map((l) => l.label).join(', ')}`,
  });

  // Test 9: Example from Section 11 of master prompt:
  // Row 1, Row 5, Column 1, Column 5 are complete (TOTAL = 4 lines).
  // Must NOT produce a winner! Game must continue!
  const markedPromptExample = [
    // Row 1: 1, 2, 3, 4, 5
    1, 2, 3, 4, 5,
    // Row 5: 21, 22, 23, 24, 25
    21, 22, 23, 24, 25,
    // Col 1 remaining: 6, 11, 16
    6, 11, 16,
    // Col 5 remaining: 10, 15, 20
    10, 15, 20,
    // Plus center 13 marked as shown in diagram
    13,
  ];
  const evalExample = checkCompletedLines(validBoard, markedPromptExample);
  const isWinnerAt4 = evalExample.count >= 5;
  results.push({
    id: 9,
    name: 'Section 11 Example: 4 completed lines does NOT produce a winner',
    passed: evalExample.count === 4 && !isWinnerAt4,
    details: `Lines detected: ${evalExample.count} (${evalExample.lines.map((l) => l.label).join(', ')}). Winner claimed = ${isWinnerAt4} (expected false).`,
  });

  // Test 10: 5th line completed triggers winning condition
  // Adding Column 3 (cells 2, 7, 12, 17, 22 -> numbers 3, 8, 13, 18, 23).
  // 3, 13, 23 already marked; add 8 and 18!
  const marked5th = [...markedPromptExample, 8, 18];
  const eval5th = checkCompletedLines(validBoard, marked5th);
  const isWinnerAt5 = eval5th.count >= 5;
  results.push({
    id: 10,
    name: 'Reaching 5 lines produces a winner',
    passed: eval5th.count >= 5 && isWinnerAt5,
    details: `Lines detected: ${eval5th.count} lines. Winner claimed = ${isWinnerAt5} (expected true).`,
  });

  // Test 11: Any combination of 5 lines produces a winner (e.g. 3 Rows + 2 Columns)
  // Rows 2, 3, 4 (numbers 6..20) + Col 2 (2, 7, 12, 17, 22) + Col 4 (4, 9, 14, 19, 24)
  const comboMarked = [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, // Rows 2, 3, 4
    2, 22, // Complete Col 2
    4, 24, // Complete Col 4
  ];
  const evalCombo = checkCompletedLines(validBoard, comboMarked);
  results.push({
    id: 11,
    name: 'Arbitrary combination of 5 lines (3 rows + 2 columns) produces win',
    passed: evalCombo.count === 5,
    details: `Detected exactly 5 lines: ${evalCombo.lines.map((l) => l.label).join(', ')}`,
  });

  // Test 12: One number completing multiple lines simultaneously
  // Center cell 13 is at intersection of Row 3, Column 3, Main Diag, Opposite Diag
  const aroundCenter = [
    // Row 3 except 13:
    11, 12, 14, 15,
    // Col 3 except 13:
    3, 8, 18, 23,
    // Main diag except 13:
    1, 7, 19, 25,
    // Opp diag except 13:
    5, 9, 17, 21,
  ];
  const before13 = checkCompletedLines(validBoard, aroundCenter);
  const after13 = checkCompletedLines(validBoard, [...aroundCenter, 13]);
  results.push({
    id: 12,
    name: 'Single number simultaneously completing 4 lines counted correctly',
    passed: before13.count === 0 && after13.count === 4,
    details: `Before 13: ${before13.count} lines. After 13: ${after13.count} lines (Row 3, Col 3, Main Diag, Opp Diag).`,
  });

  // Test 13: Same line is never counted twice
  const repeatedCalls = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
  const evalRepeated = checkCompletedLines(validBoard, repeatedCalls);
  results.push({
    id: 13,
    name: 'Same line is never counted twice',
    passed: evalRepeated.count === 1,
    details: `Completed lines: ${evalRepeated.count} (expected 1).`,
  });

  // Test 14: Custom player arrangement preserved
  const customArrangement = [
    5, 17, 2, 24, 9,
    13, 1, 20, 7, 15,
    22, 8, 11, 19, 3,
    6, 25, 14, 4, 21,
    18, 10, 23, 12, 16,
  ];
  const valCustom = validateBoard(customArrangement);
  // Mark custom Row 1 (5, 17, 2, 24, 9)
  const evalCustom = checkCompletedLines(customArrangement, [5, 17, 2, 24, 9]);
  results.push({
    id: 14,
    name: 'Custom player board arrangement validates and detects lines correctly',
    passed: valCustom.valid && evalCustom.count === 1 && evalCustom.lines[0].label === 'Row 1',
    details: `Custom player arrangement valid: ${valCustom.valid}. Row 1 detected: ${evalCustom.lines[0]?.label}.`,
  });

  // Test 15: Out of bounds number (e.g. 26 or 0) rejected
  const invalidNumBoard = [...validBoard];
  invalidNumBoard[0] = 26; // 26 is invalid for Bingo 25
  const val15 = validateBoard(invalidNumBoard);
  results.push({
    id: 15,
    name: 'Numbers outside 1–25 (e.g. 26) rejected',
    passed: !val15.valid,
    details: `Rejected out-of-range number with error: "${val15.error}"`,
  });

  // Test 16: All 25 numbers called yields exactly 12 lines (5 rows + 5 cols + 2 diags)
  const allCalled = Array.from({ length: 25 }, (_, i) => i + 1);
  const evalAll = checkCompletedLines(validBoard, allCalled);
  results.push({
    id: 16,
    name: 'All 25 cells marked produces exactly 12 winning lines',
    passed: evalAll.count === 12,
    details: `Expected 12 lines, detected: ${evalAll.count} lines (${evalAll.lines.map((l) => l.label).join(', ')}).`,
  });

  // Test 17: Both diagonals intersect at center (cell index 12) and are distinct
  const bothDiagsMarked = [
    // Main diag: 1, 7, 13, 19, 25 (indices 0, 6, 12, 18, 24)
    1, 7, 13, 19, 25,
    // Opp diag: 5, 9, 17, 21 (indices 4, 8, 16, 20 with shared 13 at index 12)
    5, 9, 17, 21,
  ];
  const evalBothDiags = checkCompletedLines(validBoard, bothDiagsMarked);
  results.push({
    id: 17,
    name: 'Both diagonals intersecting at center evaluated as 2 distinct lines',
    passed: evalBothDiags.count === 2 && evalBothDiags.lines.some((l) => l.label === 'Main Diagonal') && evalBothDiags.lines.some((l) => l.label === 'Opposite Diagonal'),
    details: `Detected ${evalBothDiags.count} diagonal lines: ${evalBothDiags.lines.map((l) => l.label).join(' & ')}.`,
  });

  // Test 18: Random board generator creates valid 1..25 permutations
  const randomB = generateBoard();
  const valRandom = validateBoard(randomB);
  results.push({
    id: 18,
    name: 'Board generator produces strict 1..25 permutations without duplicates',
    passed: valRandom.valid && randomB.length === 25,
    details: `Generated board passes full validation: ${valRandom.valid}.`,
  });

  return results;
}
