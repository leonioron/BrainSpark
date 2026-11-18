export interface SudokuPuzzle {
  gridSize: 4 | 9;
  boxSize: 2 | 3;
  solution: number[][];
  puzzle: (number | null)[][];
  cluesCount: number;
  emptyCount: number;
}

function shuffleArr<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Gera um tabuleiro válido de Sudoku 4x4 (blocos 2x2) ou 9x9 (blocos 3x3)
 * usando permutação de linhas, colunas, bandas e dígitos.
 */
function generateSolvedBoard(boxSize: 2 | 3): number[][] {
  const gridSize = boxSize * boxSize;
  const digits = shuffleArr(Array.from({ length: gridSize }, (_, i) => i + 1));

  // Base Latina canônica válida para blocos boxSize x boxSize
  const basePattern = (r: number, c: number) =>
    (boxSize * (r % boxSize) + Math.floor(r / boxSize) + c) % gridSize;

  const bandIndices = shuffleArr(Array.from({ length: boxSize }, (_, i) => i));
  const rowOrder: number[] = [];
  for (const band of bandIndices) {
    const inner = shuffleArr(Array.from({ length: boxSize }, (_, i) => i));
    for (const r of inner) {
      rowOrder.push(band * boxSize + r);
    }
  }

  const stackIndices = shuffleArr(Array.from({ length: boxSize }, (_, i) => i));
  const colOrder: number[] = [];
  for (const stack of stackIndices) {
    const inner = shuffleArr(Array.from({ length: boxSize }, (_, i) => i));
    for (const c of inner) {
      colOrder.push(stack * boxSize + c);
    }
  }

  return rowOrder.map((r) => colOrder.map((c) => digits[basePattern(r, c)]));
}

export function createSudokuPuzzle(
  difficulty: 'warmup' | 'standard' | 'blitz',
): SudokuPuzzle {
  const boxSize: 2 | 3 = difficulty === 'warmup' ? 2 : 3;
  const gridSize: 4 | 9 = boxSize === 2 ? 4 : 9;
  const solution = generateSolvedBoard(boxSize);

  const totalCells = gridSize * gridSize;
  // Warm-Up (2x2): 16 células, remove 8 (8 preenchidas)
  // Padrão (3x3 bastante preenchido): 81 células, remove 24 (57 preenchidas)
  // Blitz (3x3 pouco preenchido): 81 células, remove 48 (33 preenchidas)
  const cellsToRemove =
    difficulty === 'warmup' ? 8 : difficulty === 'standard' ? 24 : 48;

  const allCoords: [number, number][] = [];
  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      allCoords.push([r, c]);
    }
  }

  const removeSet = new Set(
    shuffleArr(allCoords)
      .slice(0, cellsToRemove)
      .map(([r, c]) => `${r}-${c}`),
  );

  const puzzle: (number | null)[][] = solution.map((row, r) =>
    row.map((val, c) => (removeSet.has(`${r}-${c}`) ? null : val)),
  );

  return {
    gridSize,
    boxSize,
    solution,
    puzzle,
    cluesCount: totalCells - cellsToRemove,
    emptyCount: cellsToRemove,
  };
}
