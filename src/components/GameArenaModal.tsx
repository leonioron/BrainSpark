import {
  Anchor,
  Bell,
  CheckCircle2,
  Compass,
  Crown,
  Diamond,
  Feather,
  Flame,
  Heart,
  HelpCircle,
  Moon,
  Music,
  RotateCcw,
  Shield,
  Star,
  Sun,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAME_CATALOG } from '../data/catalog';
import type {
  DifficultyTier,
  GameMode,
  GamePhase,
  GameResultInput,
  SessionRecord,
} from '../types/brainspark';
import { soundFx } from '../utils/audio';
import { calculateStarRating } from '../utils/brainAge';
import { createSudokuPuzzle, type SudokuPuzzle } from '../utils/sudoku';
import { getModeAccentClasses, ModeIcon } from './ModeIcon';

interface GameArenaModalProps {
  mode: GameMode;
  difficulty: DifficultyTier;
  nodeId: string | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
  onCompleteSession: (result: GameResultInput) => SessionRecord;
}

interface MathPrompt {
  expression: string;
  answer: number;
  options: number[];
}

interface StroopColorDef {
  id: 'red' | 'blue' | 'green' | 'amber';
  label: string;
  hex: string;
  buttonClass: string;
}

interface PairCard {
  uid: number;
  pairId: number;
  matched: boolean;
}

const PAIR_SYMBOLS = [
  { icon: Sun, color: 'text-amber-400' },
  { icon: Moon, color: 'text-sky-400' },
  { icon: Flame, color: 'text-orange-400' },
  { icon: Heart, color: 'text-rose-400' },
  { icon: Diamond, color: 'text-cyan-400' },
  { icon: Crown, color: 'text-yellow-300' },
  { icon: Anchor, color: 'text-indigo-400' },
  { icon: Bell, color: 'text-emerald-400' },
  { icon: Compass, color: 'text-teal-400' },
  { icon: Feather, color: 'text-pink-400' },
  { icon: Music, color: 'text-violet-400' },
  { icon: Shield, color: 'text-lime-400' },
];

const STROOP_COLORS: StroopColorDef[] = [
  {
    id: 'red',
    label: 'VERMELHO',
    hex: '#F43F5E',
    buttonClass: 'pixel-stroop-red active:translate-y-0.5 active:border-b-2',
  },
  {
    id: 'blue',
    label: 'AZUL',
    hex: '#0EA5E9',
    buttonClass: 'pixel-stroop-blue active:translate-y-0.5 active:border-b-2',
  },
  {
    id: 'green',
    label: 'VERDE',
    hex: '#10B981',
    buttonClass: 'pixel-stroop-green active:translate-y-0.5 active:border-b-2',
  },
  {
    id: 'amber',
    label: 'ÂMBAR',
    hex: '#F59E0B',
    buttonClass: 'pixel-stroop-amber active:translate-y-0.5 active:border-b-2',
  },
];

interface StroopPrompt {
  wordLabel: string;
  inkColor: StroopColorDef;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getPairsConfig(difficulty: DifficultyTier): {
  totalCards: number;
  totalPairs: number;
  maxMistakes: number;
} {
  if (difficulty === 'warmup') return { totalCards: 10, totalPairs: 5, maxMistakes: 2 };
  if (difficulty === 'standard') return { totalCards: 16, totalPairs: 8, maxMistakes: 4 };
  return { totalCards: 24, totalPairs: 12, maxMistakes: 6 };
}

function buildPairDeck(difficulty: DifficultyTier): PairCard[] {
  const { totalPairs } = getPairsConfig(difficulty);
  const deck: PairCard[] = [];
  let uid = 0;
  for (let pairId = 0; pairId < totalPairs; pairId += 1) {
    deck.push({ uid: uid++, pairId, matched: false });
    deck.push({ uid: uid++, pairId, matched: false });
  }
  return shuffle(deck);
}

function generateMathPrompt(difficulty: DifficultyTier): MathPrompt {
  let a = 0;
  let b = 0;
  let answer = 0;
  let expression = '';

  if (difficulty === 'warmup') {
    const isAdd = Math.random() > 0.4;
    a = Math.floor(Math.random() * 14) + 3;
    b = Math.floor(Math.random() * 12) + 2;
    if (isAdd) {
      answer = a + b;
      expression = `${a} + ${b}`;
    } else {
      const high = Math.max(a, b) + 4;
      const low = Math.min(a, b);
      answer = high - low;
      expression = `${high} − ${low}`;
    }
  } else if (difficulty === 'standard') {
    const opRoll = Math.random();
    if (opRoll < 0.36) {
      a = Math.floor(Math.random() * 35) + 12;
      b = Math.floor(Math.random() * 28) + 8;
      answer = a + b;
      expression = `${a} + ${b}`;
    } else if (opRoll < 0.7) {
      a = Math.floor(Math.random() * 45) + 20;
      b = Math.floor(Math.random() * 19) + 5;
      answer = a - b;
      expression = `${a} − ${b}`;
    } else {
      a = Math.floor(Math.random() * 8) + 3;
      b = Math.floor(Math.random() * 9) + 3;
      answer = a * b;
      expression = `${a} × ${b}`;
    }
  } else {
    const opRoll = Math.random();
    if (opRoll < 0.4) {
      a = Math.floor(Math.random() * 9) + 4;
      b = Math.floor(Math.random() * 9) + 4;
      const c = Math.floor(Math.random() * 12) + 3;
      answer = a * b + c;
      expression = `(${a} × ${b}) + ${c}`;
    } else if (opRoll < 0.75) {
      a = Math.floor(Math.random() * 70) + 25;
      b = Math.floor(Math.random() * 45) + 14;
      answer = a + b;
      expression = `${a} + ${b}`;
    } else {
      a = Math.floor(Math.random() * 65) + 45;
      b = Math.floor(Math.random() * 32) + 12;
      answer = a - b;
      expression = `${a} − ${b}`;
    }
  }

  const distractors = new Set<number>([answer]);
  const offsets = [-10, -4, -3, -2, -1, 1, 2, 3, 4, 10];
  let safety = 0;
  while (distractors.size < 4 && safety < 40) {
    safety += 1;
    const delta = offsets[Math.floor(Math.random() * offsets.length)];
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) {
      distractors.add(candidate);
    }
  }
  while (distractors.size < 4) {
    distractors.add(answer + distractors.size + 1);
  }

  return {
    expression,
    answer,
    options: shuffle(Array.from(distractors)),
  };
}

function generateStroopPrompt(difficulty: DifficultyTier): StroopPrompt {
  const wordDef = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
  const congruentChance = difficulty === 'warmup' ? 0.3 : difficulty === 'standard' ? 0.15 : 0.08;
  if (Math.random() < congruentChance) {
    return { wordLabel: wordDef.label, inkColor: wordDef };
  }
  const otherColors = STROOP_COLORS.filter((c) => c.id !== wordDef.id);
  const inkColor = otherColors[Math.floor(Math.random() * otherColors.length)];
  return { wordLabel: wordDef.label, inkColor };
}

function generateSequenceForRound(roundIndex: number, difficulty: DifficultyTier): number[] {
  const baseLen = difficulty === 'warmup' ? 3 : 4;
  const targetLen = Math.min(9, baseLen + roundIndex);
  const seq: number[] = [];
  for (let i = 0; i < targetLen; i += 1) {
    let next = Math.floor(Math.random() * 9);
    if (seq.length > 0 && next === seq[seq.length - 1]) {
      next = (next + Math.floor(Math.random() * 8) + 1) % 9;
    }
    seq.push(next);
  }
  return seq;
}

export function GameArenaModal({
  mode,
  difficulty,
  nodeId,
  soundEnabled,
  onToggleSound,
  onClose,
  onCompleteSession,
}: GameArenaModalProps) {
  const gameDef = GAME_CATALOG[mode];
  const tierConfig = gameDef.tiers[difficulty];
  const accent = getModeAccentClasses(mode);

  const [phase, setPhase] = useState<GamePhase>('COUNTDOWN');
  const [countdown, setCountdown] = useState<number>(3);
  const [roundIdx, setRoundIdx] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    ok: boolean;
    label: string;
  } | null>(null);
  const [completedSession, setCompletedSession] = useState<SessionRecord | null>(null);

  // Cálculo Rápido & Stroop
  const [mathPrompt, setMathPrompt] = useState<MathPrompt>(() =>
    generateMathPrompt(difficulty),
  );
  const [stroopPrompt, setStroopPrompt] = useState<StroopPrompt>(() =>
    generateStroopPrompt(difficulty),
  );

  // Memória em Sequência (Working Memory)
  const [sequenceTarget, setSequenceTarget] = useState<number[]>([]);
  const [sequenceInput, setSequenceInput] = useState<number[]>([]);
  const [sequenceStage, setSequenceStage] = useState<'SHOWING' | 'INPUT' | 'FEEDBACK'>('SHOWING');
  const [litTile, setLitTile] = useState<number | null>(null);
  const [maxSpanAchieved, setMaxSpanAchieved] = useState<number>(0);

  // Reflexo Veloz
  const [reflexSignal, setReflexSignal] = useState<'WAIT' | 'GO' | 'NOGO' | 'RESULT'>('WAIT');
  const [reflexMessage, setReflexMessage] = useState<string>('Aguarde o sinal Âmbar...');

  // Pares de Memória (10, 16, 24 cartas com limite 2, 4, 6 erros)
  const pairsConfig = useMemo(() => getPairsConfig(difficulty), [difficulty]);
  const [pairDeck, setPairDeck] = useState<PairCard[]>(() => buildPairDeck(difficulty));
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [pairMistakes, setPairMistakes] = useState<number>(0);

  // Sudoku (2x2 -> 4x4, 3x3 bastante preenchido, 3x3 pouco preenchido)
  const [sudokuPuzzle, setSudokuPuzzle] = useState<SudokuPuzzle>(() =>
    createSudokuPuzzle(difficulty),
  );
  const [sudokuBoard, setSudokuBoard] = useState<(number | null)[][]>(() =>
    sudokuPuzzle.puzzle.map((r) => [...r]),
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errorCellKey, setErrorCellKey] = useState<string | null>(null);
  const [sudokuMistakes, setSudokuMistakes] = useState<number>(0);

  const promptStartRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);
  const lockedRef = useRef<boolean>(false);
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const statsRef = useRef({
    correctCount: 0,
    reactionTimes: [] as number[],
    maxSpan: 0,
    mistakes: 0,
  });

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const finishGame = useCallback(
    (overrideAccuracy?: number) => {
      clearAllTimers();
      const finalCorrect = statsRef.current.correctCount;
      const times = statsRef.current.reactionTimes;
      const totalRounds =
        mode === 'sudoku' ? sudokuPuzzle.emptyCount : tierConfig.roundCount;
      const accuracy =
        overrideAccuracy !== undefined
          ? overrideAccuracy
          : Math.round((finalCorrect / Math.max(1, totalRounds)) * 100);
      const avgReactionMs =
        times.length > 0
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : tierConfig.targetMs;

      const score = Math.round(
        finalCorrect * 120 + Math.max(0, 1500 - avgReactionMs) * 0.4,
      );

      soundFx.complete(soundEnabledRef.current);
      const saved = onCompleteSession({
        mode,
        difficulty,
        nodeId,
        score,
        correctCount: finalCorrect,
        totalRounds,
        accuracy,
        avgReactionMs,
        maxSpan: mode === 'sequence' ? statsRef.current.maxSpan : null,
      });
      setCompletedSession(saved);
      setPhase('ROUND_SUMMARY');
    },
    [
      clearAllTimers,
      difficulty,
      mode,
      nodeId,
      onCompleteSession,
      sudokuPuzzle.emptyCount,
      tierConfig.roundCount,
      tierConfig.targetMs,
    ],
  );

  const startSequenceRound = useCallback(
    (nextRoundIdx: number) => {
      clearAllTimers();
      lockedRef.current = true;
      const seq = generateSequenceForRound(nextRoundIdx, difficulty);
      setSequenceTarget(seq);
      setSequenceInput([]);
      setSequenceStage('SHOWING');
      setLitTile(null);

      const stepMs = difficulty === 'blitz' ? 460 : difficulty === 'standard' ? 580 : 680;
      const flashMs = difficulty === 'blitz' ? 300 : 380;

      seq.forEach((tileIdx, stepIdx) => {
        scheduleTimer(() => {
          setLitTile(tileIdx);
          soundFx.tile(soundEnabledRef.current, tileIdx);
        }, 320 + stepIdx * stepMs);

        scheduleTimer(() => {
          setLitTile(null);
        }, 320 + stepIdx * stepMs + flashMs);
      });

      scheduleTimer(() => {
        setLitTile(null);
        setSequenceStage('INPUT');
        lockedRef.current = false;
        promptStartRef.current = performance.now();
      }, 320 + seq.length * stepMs + 140);
    },
    [clearAllTimers, difficulty, scheduleTimer],
  );

  const startReflexRound = useCallback(() => {
    clearAllTimers();
    lockedRef.current = false;
    setReflexSignal('WAIT');
    setReflexMessage('Mantenha o foco... Aguarde o Âmbar');

    const delayMs = 850 + Math.floor(Math.random() * 1450);
    const noGoChance = difficulty === 'warmup' ? 0 : difficulty === 'standard' ? 0.25 : 0.35;
    const isNoGo = Math.random() < noGoChance;

    scheduleTimer(() => {
      if (isNoGo) {
        setReflexSignal('NOGO');
        setReflexMessage('SEGURE! Não toque');
        soundFx.wrong(soundEnabledRef.current);
        promptStartRef.current = performance.now();

        scheduleTimer(() => {
          lockedRef.current = true;
          statsRef.current.correctCount += 1;
          statsRef.current.reactionTimes.push(280);
          setCorrectCount(statsRef.current.correctCount);
          setReactionTimes([...statsRef.current.reactionTimes]);
          setReflexSignal('RESULT');
          setReflexMessage('Controle perfeito! +1');
          soundFx.correct(soundEnabledRef.current);

          scheduleTimer(() => {
            setRoundIdx((prev) => {
              const next = prev + 1;
              if (next >= tierConfig.roundCount) {
                finishGame();
              } else {
                startReflexRound();
              }
              return next;
            });
          }, 520);
        }, 1150);
      } else {
        setReflexSignal('GO');
        setReflexMessage('TOQUE AGORA!');
        soundFx.go(soundEnabledRef.current);
        promptStartRef.current = performance.now();
      }
    }, delayMs);
  }, [clearAllTimers, difficulty, finishGame, scheduleTimer, tierConfig.roundCount]);

  const startPlayingPhase = useCallback(() => {
    setRoundIdx(0);
    setCorrectCount(0);
    setReactionTimes([]);
    setFeedbackBanner(null);
    setMaxSpanAchieved(0);
    setPairMistakes(0);
    setSudokuMistakes(0);
    setFlippedIndices([]);
    setSelectedCell(null);
    setErrorCellKey(null);
    statsRef.current = { correctCount: 0, reactionTimes: [], maxSpan: 0, mistakes: 0 };
    lockedRef.current = false;

    if (mode === 'math') {
      setMathPrompt(generateMathPrompt(difficulty));
      promptStartRef.current = performance.now();
    } else if (mode === 'stroop') {
      setStroopPrompt(generateStroopPrompt(difficulty));
      promptStartRef.current = performance.now();
    } else if (mode === 'sequence') {
      startSequenceRound(0);
    } else if (mode === 'reflex') {
      startReflexRound();
    } else if (mode === 'pairs') {
      setPairDeck(buildPairDeck(difficulty));
      promptStartRef.current = performance.now();
    } else if (mode === 'sudoku') {
      const freshPuzzle = createSudokuPuzzle(difficulty);
      setSudokuPuzzle(freshPuzzle);
      setSudokuBoard(freshPuzzle.puzzle.map((r) => [...r]));
      // Seleciona automaticamente a primeira célula vazia
      outer: for (let r = 0; r < freshPuzzle.gridSize; r += 1) {
        for (let c = 0; c < freshPuzzle.gridSize; c += 1) {
          if (freshPuzzle.puzzle[r][c] === null) {
            setSelectedCell([r, c]);
            break outer;
          }
        }
      }
      promptStartRef.current = performance.now();
    }
  }, [difficulty, mode, startReflexRound, startSequenceRound]);

  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;
    const countdownIds: number[] = [];
    setCountdown(3);
    soundFx.tick(soundEnabledRef.current);

    countdownIds.push(
      window.setTimeout(() => {
        setCountdown(2);
        soundFx.tick(soundEnabledRef.current);
      }, 650),
    );

    countdownIds.push(
      window.setTimeout(() => {
        setCountdown(1);
        soundFx.tick(soundEnabledRef.current);
      }, 1300),
    );

    countdownIds.push(
      window.setTimeout(() => {
        setPhase('PLAYING');
        startPlayingPhase();
      }, 1950),
    );

    return () => {
      countdownIds.forEach((id) => window.clearTimeout(id));
    };
  }, [phase, startPlayingPhase]);

  const handleRestart = () => {
    clearAllTimers();
    setCompletedSession(null);
    setPhase('COUNTDOWN');
  };

  const submitQuickResponse = useCallback(
    (isCorrect: boolean, detailText: string) => {
      if (lockedRef.current || phase !== 'PLAYING') return;
      lockedRef.current = true;

      const elapsedMs = Math.max(120, Math.round(performance.now() - promptStartRef.current));
      statsRef.current.reactionTimes.push(elapsedMs);
      setReactionTimes([...statsRef.current.reactionTimes]);

      if (isCorrect) {
        statsRef.current.correctCount += 1;
        setCorrectCount(statsRef.current.correctCount);
        soundFx.correct(soundEnabledRef.current);
        setFeedbackBanner({ ok: true, label: `Correto · ${elapsedMs}ms` });
      } else {
        soundFx.wrong(soundEnabledRef.current);
        setFeedbackBanner({ ok: false, label: detailText });
      }

      scheduleTimer(() => {
        setFeedbackBanner(null);
        const nextRound = roundIdx + 1;
        if (nextRound >= tierConfig.roundCount) {
          finishGame();
        } else {
          setRoundIdx(nextRound);
          if (mode === 'math') {
            setMathPrompt(generateMathPrompt(difficulty));
          } else if (mode === 'stroop') {
            setStroopPrompt(generateStroopPrompt(difficulty));
          }
          lockedRef.current = false;
          promptStartRef.current = performance.now();
        }
      }, 260);
    },
    [difficulty, finishGame, mode, phase, roundIdx, scheduleTimer, tierConfig.roundCount],
  );

  // Entrada de dígito no Sudoku
  const handleSudokuDigitInput = useCallback(
    (digit: number) => {
      if (phase !== 'PLAYING' || mode !== 'sudoku' || !selectedCell || lockedRef.current) return;
      const [r, c] = selectedCell;
      if (sudokuBoard[r]?.[c] !== null) return;

      const expected = sudokuPuzzle.solution[r][c];
      const elapsedMs = Math.max(250, Math.round(performance.now() - promptStartRef.current));

      if (digit === expected) {
        const nextBoard = sudokuBoard.map((row, ri) =>
          row.map((val, ci) => (ri === r && ci === c ? digit : val)),
        );
        setSudokuBoard(nextBoard);
        setErrorCellKey(null);

        statsRef.current.correctCount += 1;
        statsRef.current.reactionTimes.push(elapsedMs);
        setCorrectCount(statsRef.current.correctCount);
        setReactionTimes([...statsRef.current.reactionTimes]);
        setRoundIdx(statsRef.current.correctCount);
        soundFx.correct(soundEnabledRef.current);
        setFeedbackBanner({ ok: true, label: `Célula preenchida · ${elapsedMs}ms` });
        promptStartRef.current = performance.now();

        if (statsRef.current.correctCount >= sudokuPuzzle.emptyCount) {
          lockedRef.current = true;
          const totalAttempts = statsRef.current.correctCount + statsRef.current.mistakes;
          const acc = Math.max(
            40,
            Math.round((statsRef.current.correctCount / Math.max(1, totalAttempts)) * 100),
          );
          scheduleTimer(() => finishGame(acc), 350);
          return;
        }

        // Seleciona próxima célula vazia automaticamente para fluidez
        let foundNext: [number, number] | null = null;
        for (let nr = 0; nr < sudokuPuzzle.gridSize; nr += 1) {
          for (let nc = 0; nc < sudokuPuzzle.gridSize; nc += 1) {
            if (nextBoard[nr][nc] === null) {
              foundNext = [nr, nc];
              break;
            }
          }
          if (foundNext) break;
        }
        setSelectedCell(foundNext);
      } else {
        statsRef.current.mistakes += 1;
        setSudokuMistakes(statsRef.current.mistakes);
        soundFx.wrong(soundEnabledRef.current);
        const key = `${r}-${c}`;
        setErrorCellKey(key);
        setFeedbackBanner({
          ok: false,
          label: `Número ${digit} conflita nesta linha, coluna ou bloco`,
        });
        scheduleTimer(() => {
          setErrorCellKey((prev) => (prev === key ? null : prev));
        }, 500);
      }
    },
    [finishGame, mode, phase, scheduleTimer, selectedCell, sudokuBoard, sudokuPuzzle],
  );

  // Atalhos de teclado
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (mode === 'math' && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const chosen = mathPrompt.options[idx];
        if (chosen !== undefined) {
          submitQuickResponse(
            chosen === mathPrompt.answer,
            `Resposta: ${mathPrompt.answer}`,
          );
        }
      } else if (mode === 'stroop' && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        const chosen = STROOP_COLORS[idx];
        if (chosen) {
          submitQuickResponse(
            chosen.id === stroopPrompt.inkColor.id,
            `A tinta era ${stroopPrompt.inkColor.label}`,
          );
        }
      } else if (mode === 'sudoku') {
        const num = Number(e.key);
        if (num >= 1 && num <= sudokuPuzzle.gridSize) {
          handleSudokuDigitInput(num);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleSudokuDigitInput,
    mathPrompt,
    mode,
    phase,
    stroopPrompt,
    sudokuPuzzle.gridSize,
    submitQuickResponse,
  ]);

  // Pares de Memória
  const handlePairCardTap = (cardIndex: number) => {
    if (phase !== 'PLAYING' || mode !== 'pairs' || lockedRef.current) return;
    const targetCard = pairDeck[cardIndex];
    if (!targetCard || targetCard.matched || flippedIndices.includes(cardIndex)) return;

    soundFx.tick(soundEnabledRef.current);
    const nextFlipped = [...flippedIndices, cardIndex];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length < 2) return;

    lockedRef.current = true;
    const [firstIdx, secondIdx] = nextFlipped;
    const firstCard = pairDeck[firstIdx];
    const secondCard = pairDeck[secondIdx];

    if (firstCard.pairId === secondCard.pairId) {
      const elapsedMs = Math.max(250, Math.round(performance.now() - promptStartRef.current));
      statsRef.current.reactionTimes.push(elapsedMs);
      statsRef.current.correctCount += 1;
      setReactionTimes([...statsRef.current.reactionTimes]);
      setCorrectCount(statsRef.current.correctCount);
      setRoundIdx(statsRef.current.correctCount);

      const updatedDeck = pairDeck.map((c, idx) =>
        idx === firstIdx || idx === secondIdx ? { ...c, matched: true } : c,
      );
      setPairDeck(updatedDeck);
      setFlippedIndices([]);
      soundFx.correct(soundEnabledRef.current);
      setFeedbackBanner({
        ok: true,
        label: `Par encontrado! (${statsRef.current.correctCount}/${pairsConfig.totalPairs})`,
      });
      promptStartRef.current = performance.now();

      if (statsRef.current.correctCount >= pairsConfig.totalPairs) {
        const acc = Math.max(
          55,
          Math.round(
            (pairsConfig.totalPairs /
              (pairsConfig.totalPairs + statsRef.current.mistakes)) *
              100,
          ),
        );
        scheduleTimer(() => finishGame(acc), 420);
      } else {
        lockedRef.current = false;
      }
    } else {
      statsRef.current.mistakes += 1;
      const nextMistakes = statsRef.current.mistakes;
      setPairMistakes(nextMistakes);
      soundFx.wrong(soundEnabledRef.current);

      const exceededLimit = nextMistakes > pairsConfig.maxMistakes;
      setFeedbackBanner({
        ok: false,
        label: exceededLimit
          ? `Limite de ${pairsConfig.maxMistakes} erros excedido!`
          : `Não combinou · Erro ${nextMistakes}/${pairsConfig.maxMistakes}`,
      });

      scheduleTimer(() => {
        setFlippedIndices([]);
        if (exceededLimit) {
          const acc = Math.round(
            (statsRef.current.correctCount / pairsConfig.totalPairs) * 100,
          );
          finishGame(acc);
        } else {
          lockedRef.current = false;
        }
      }, 680);
    }
  };

  // Memória em Sequência
  const handleSequenceTileTap = (tileIdx: number) => {
    if (phase !== 'PLAYING' || sequenceStage !== 'INPUT' || lockedRef.current) return;

    const stepPos = sequenceInput.length;
    const expectedTile = sequenceTarget[stepPos];
    const nextInput = [...sequenceInput, tileIdx];
    setSequenceInput(nextInput);

    setLitTile(tileIdx);
    scheduleTimer(() => {
      setLitTile((prev) => (prev === tileIdx ? null : prev));
    }, 160);

    if (tileIdx !== expectedTile) {
      lockedRef.current = true;
      soundFx.wrong(soundEnabledRef.current);
      setSequenceStage('FEEDBACK');
      setFeedbackBanner({ ok: false, label: 'Sequência incorreta' });
      const elapsedPerTile = Math.max(
        200,
        Math.round((performance.now() - promptStartRef.current) / Math.max(1, nextInput.length)),
      );
      statsRef.current.reactionTimes.push(elapsedPerTile);
      setReactionTimes([...statsRef.current.reactionTimes]);

      scheduleTimer(() => {
        setFeedbackBanner(null);
        const nextRound = roundIdx + 1;
        if (nextRound >= tierConfig.roundCount) {
          finishGame();
        } else {
          setRoundIdx(nextRound);
          startSequenceRound(nextRound);
        }
      }, 650);
      return;
    }

    soundFx.tile(soundEnabledRef.current, tileIdx);

    if (nextInput.length === sequenceTarget.length) {
      lockedRef.current = true;
      const elapsedPerTile = Math.max(
        180,
        Math.round((performance.now() - promptStartRef.current) / sequenceTarget.length),
      );
      statsRef.current.correctCount += 1;
      statsRef.current.reactionTimes.push(elapsedPerTile);
      statsRef.current.maxSpan = Math.max(statsRef.current.maxSpan, sequenceTarget.length);
      setCorrectCount(statsRef.current.correctCount);
      setReactionTimes([...statsRef.current.reactionTimes]);
      setMaxSpanAchieved(statsRef.current.maxSpan);
      setSequenceStage('FEEDBACK');
      soundFx.correct(soundEnabledRef.current);
      setFeedbackBanner({ ok: true, label: `Sequência de ${sequenceTarget.length} concluída` });

      scheduleTimer(() => {
        setFeedbackBanner(null);
        const nextRound = roundIdx + 1;
        if (nextRound >= tierConfig.roundCount) {
          finishGame();
        } else {
          setRoundIdx(nextRound);
          startSequenceRound(nextRound);
        }
      }, 650);
    }
  };

  // Reflexo Veloz
  const handleReflexTap = () => {
    if (phase !== 'PLAYING' || lockedRef.current) return;

    if (reflexSignal === 'WAIT') {
      lockedRef.current = true;
      clearAllTimers();
      soundFx.wrong(soundEnabledRef.current);
      statsRef.current.reactionTimes.push(650);
      setReactionTimes([...statsRef.current.reactionTimes]);
      setReflexSignal('RESULT');
      setReflexMessage('Cedo demais! Aguarde o Âmbar');

      scheduleTimer(() => {
        const nextRound = roundIdx + 1;
        if (nextRound >= tierConfig.roundCount) {
          finishGame();
        } else {
          setRoundIdx(nextRound);
          startReflexRound();
        }
      }, 650);
      return;
    }

    if (reflexSignal === 'NOGO') {
      lockedRef.current = true;
      clearAllTimers();
      soundFx.wrong(soundEnabledRef.current);
      statsRef.current.reactionTimes.push(600);
      setReactionTimes([...statsRef.current.reactionTimes]);
      setReflexSignal('RESULT');
      setReflexMessage('Armadilha vermelha! Segure na próxima');

      scheduleTimer(() => {
        const nextRound = roundIdx + 1;
        if (nextRound >= tierConfig.roundCount) {
          finishGame();
        } else {
          setRoundIdx(nextRound);
          startReflexRound();
        }
      }, 680);
      return;
    }

    if (reflexSignal === 'GO') {
      lockedRef.current = true;
      clearAllTimers();
      const reactionMs = Math.max(110, Math.round(performance.now() - promptStartRef.current));
      statsRef.current.correctCount += 1;
      statsRef.current.reactionTimes.push(reactionMs);
      setCorrectCount(statsRef.current.correctCount);
      setReactionTimes([...statsRef.current.reactionTimes]);
      soundFx.correct(soundEnabledRef.current);
      setReflexSignal('RESULT');
      setReflexMessage(`${reactionMs} ms!`);

      scheduleTimer(() => {
        const nextRound = roundIdx + 1;
        if (nextRound >= tierConfig.roundCount) {
          finishGame();
        } else {
          setRoundIdx(nextRound);
          startReflexRound();
        }
      }, 520);
    }
  };

  const totalStepsCount =
    mode === 'sudoku' ? sudokuPuzzle.emptyCount : tierConfig.roundCount;

  const progressPct = useMemo(() => {
    if (phase === 'ROUND_SUMMARY') return 100;
    return Math.round((roundIdx / Math.max(1, totalStepsCount)) * 100);
  }, [phase, roundIdx, totalStepsCount]);

  const liveAvgMs = useMemo(() => {
    if (reactionTimes.length === 0) return null;
    return Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
  }, [reactionTimes]);

  const selectedValue =
    selectedCell && sudokuBoard[selectedCell[0]]?.[selectedCell[1]] !== null
      ? sudokuBoard[selectedCell[0]][selectedCell[1]]
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Arena de Treino: ${gameDef.title}`}
      className="fixed inset-0 z-50 flex flex-col bg-pixel-grid pt-safe-top"
    >
      {/* HUD Superior da Arena 16-bit */}
      <div className="pixel-header mx-auto flex w-full max-w-2xl min-w-0 items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            clearAllTimers();
            onClose();
          }}
          aria-label="Sair da sessão"
          className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-1 min-w-0 flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-300">
            <span className="font-pixel truncate text-[11px] uppercase text-slate-200">
              {gameDef.title} · {tierConfig.label}
            </span>
            <span className="font-mono-tabular shrink-0 text-amber-300">
              {mode === 'pairs' || mode === 'sudoku'
                ? `${roundIdx} / ${totalStepsCount}`
                : `${Math.min(roundIdx + (phase === 'PLAYING' ? 1 : 0), totalStepsCount)} / ${totalStepsCount}`}
            </span>
          </div>
          <div className="pixel-inset h-3 w-full overflow-hidden rounded-sm p-[1px]">
            <div
              className="pixel-gauge-fill h-full bg-amber-500 transition-[width] duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
          className="pixel-btn-secondary flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-slate-300"
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-slate-500" />}
        </button>
      </div>

      {/* Corpo Principal da Arena */}
      <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col justify-center overflow-y-auto px-4 py-5 pb-safe-bottom">
        {phase === 'COUNTDOWN' && (
          <div className="pixel-panel mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-md px-6 py-8 text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-md border-2 ${accent.iconBox}`}>
              <ModeIcon mode={mode} className="h-8 w-8" />
            </div>
            <p className="font-pixel mt-5 text-[11px] uppercase text-amber-400">
              {gameDef.cognitiveDomain}
            </p>
            <div className="font-pixel mt-3 text-6xl font-bold tracking-tight text-amber-300">
              {countdown}
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              {gameDef.instructions}
            </p>
          </div>
        )}

        {phase === 'PLAYING' && (
          <div className="flex w-full min-w-0 flex-col gap-4">
            <div className="pixel-inset flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold text-slate-300 font-mono-tabular">
              {mode === 'pairs' ? (
                <span>
                  PARES: {correctCount}/{pairsConfig.totalPairs} · ERROS: {pairMistakes}/{pairsConfig.maxMistakes}
                </span>
              ) : mode === 'sudoku' ? (
                <span>
                  PREENCHIDAS: {correctCount}/{sudokuPuzzle.emptyCount} · ERROS: {sudokuMistakes}
                </span>
              ) : (
                <span>ACERTOS: {correctCount}</span>
              )}
              <span>MÉDIA: {liveAvgMs !== null ? `${liveAvgMs}ms` : '—'}</span>
            </div>

            {/* CÁLCULO RÁPIDO */}
            {mode === 'math' && (
              <div className="flex flex-col gap-5">
                <div className="pixel-panel flex min-h-[152px] flex-col items-center justify-center rounded-md p-6 text-center">
                  <span className="font-pixel text-[11px] uppercase text-amber-400">
                    Calcule rapidamente
                  </span>
                  <div className="mt-3 text-4xl font-extrabold tracking-tight text-slate-100 font-mono-tabular sm:text-5xl">
                    {mathPrompt.expression} = ?
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mathPrompt.options.map((opt, idx) => (
                    <button
                      key={`${roundIdx}-${opt}-${idx}`}
                      type="button"
                      onClick={() =>
                        submitQuickResponse(
                          opt === mathPrompt.answer,
                          `Resposta: ${mathPrompt.answer}`,
                        )
                      }
                      className="pixel-btn-secondary flex min-h-[68px] items-center justify-center rounded-md px-4 text-2xl font-bold text-slate-100 font-mono-tabular hover:border-amber-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FOCO STROOP */}
            {mode === 'stroop' && (
              <div className="flex flex-col gap-5">
                <div className="pixel-panel flex min-h-[164px] flex-col items-center justify-center rounded-md p-6 text-center">
                  <span className="font-pixel text-[10px] uppercase leading-relaxed text-slate-400">
                    Toque na COR DA TINTA (ignore a palavra)
                  </span>
                  <div
                    className="mt-4 text-5xl font-extrabold tracking-wide sm:text-6xl select-none"
                    style={{ color: stroopPrompt.inkColor.hex }}
                  >
                    {stroopPrompt.wordLabel}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {STROOP_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        submitQuickResponse(
                          c.id === stroopPrompt.inkColor.id,
                          `A tinta era ${stroopPrompt.inkColor.label}`,
                        )
                      }
                      className={`font-pixel flex min-h-[64px] items-center justify-center rounded-md px-4 text-sm font-bold tracking-wide transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${c.buttonClass}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MEMÓRIA EM SEQUÊNCIA (WORKING MEMORY) */}
            {mode === 'sequence' && (
              <div className="flex flex-col items-center gap-5">
                <div className="pixel-inset rounded-md px-4 py-2 text-center">
                  <p className="font-pixel text-xs uppercase text-slate-200">
                    {sequenceStage === 'SHOWING'
                      ? `Observe (${sequenceTarget.length} passos)`
                      : sequenceStage === 'INPUT'
                        ? `Repita (${sequenceInput.length}/${sequenceTarget.length})`
                        : maxSpanAchieved > 0
                          ? `Recorde: ${maxSpanAchieved} passos`
                          : 'Próxima sequência...'}
                  </p>
                </div>

                <div className="pixel-panel grid w-full max-w-[340px] grid-cols-3 gap-3 rounded-md p-3">
                  {Array.from({ length: 9 }).map((_, tileIdx) => {
                    const isLit = litTile === tileIdx;
                    const tapOrder = sequenceInput.indexOf(tileIdx);
                    const wasTapped = tapOrder !== -1;
                    return (
                      <button
                        key={tileIdx}
                        type="button"
                        disabled={sequenceStage !== 'INPUT'}
                        onClick={() => handleSequenceTileTap(tileIdx)}
                        aria-label={`Quadrado ${tileIdx + 1}`}
                        className={`flex aspect-square min-h-[76px] items-center justify-center rounded-md border-2 border-b-4 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          isLit
                            ? 'translate-y-0.5 border-amber-200 border-b-amber-500 bg-amber-400 ring-4 ring-amber-400/35 shadow-[0_0_16px_rgba(245,158,11,0.65)]'
                            : wasTapped && sequenceStage === 'INPUT'
                              ? 'border-emerald-400 border-b-emerald-800 bg-emerald-500/30'
                              : 'pixel-tile-idle hover:border-amber-400/60'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* REFLEXO VELOZ */}
            {mode === 'reflex' && (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={handleReflexTap}
                  className={`flex min-h-[260px] w-full flex-col items-center justify-center rounded-md border-2 border-b-[6px] p-6 text-center shadow-[4px_4px_0_0_var(--bs-shadow)] transition-colors duration-100 select-none active:translate-y-1 active:border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    reflexSignal === 'GO'
                      ? 'border-amber-200 border-b-amber-700 bg-amber-500 text-[#090D14]'
                      : reflexSignal === 'NOGO'
                        ? 'border-rose-300 border-b-rose-900 bg-rose-600 text-white'
                        : 'pixel-reflex-wait'
                  }`}
                >
                  <span className="font-pixel text-2xl font-bold tracking-tight sm:text-3xl">
                    {reflexMessage}
                  </span>
                  <span
                    className={`mt-3 text-xs font-semibold ${
                      reflexSignal === 'GO'
                        ? 'text-[#090D14]/85'
                        : reflexSignal === 'NOGO'
                          ? 'text-rose-100'
                          : 'text-slate-400'
                    }`}
                  >
                    {reflexSignal === 'WAIT'
                      ? 'Toque assim que o painel ficar Âmbar'
                      : reflexSignal === 'GO'
                        ? 'Toque em qualquer lugar do painel'
                        : reflexSignal === 'NOGO'
                          ? 'Vermelho significa não tocar'
                          : 'Preparando próxima rodada...'}
                  </span>
                </button>
              </div>
            )}

            {/* PARES DE MEMÓRIA (10, 16, 24 cartas com limite 2, 4, 6 erros) */}
            {mode === 'pairs' && (
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`grid w-full min-w-0 gap-2 sm:gap-2.5 ${
                    pairsConfig.totalCards === 10
                      ? 'max-w-md grid-cols-5'
                      : pairsConfig.totalCards === 16
                        ? 'max-w-md grid-cols-4'
                        : 'max-w-lg grid-cols-4 sm:grid-cols-6'
                  }`}
                >
                  {pairDeck.map((card, idx) => {
                    const isRevealed = card.matched || flippedIndices.includes(idx);
                    const symbol = PAIR_SYMBOLS[card.pairId % PAIR_SYMBOLS.length];
                    const SymbolIcon = symbol.icon;

                    return (
                      <button
                        key={card.uid}
                        type="button"
                        disabled={card.matched || flippedIndices.includes(idx)}
                        onClick={() => handlePairCardTap(idx)}
                        aria-label={isRevealed ? `Carta ${card.pairId + 1}` : 'Carta virada'}
                        className={`flex aspect-square min-h-[48px] w-full items-center justify-center rounded-md border-2 border-b-4 shadow-[2px_2px_0_0_var(--bs-shadow)] transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          card.matched
                            ? 'border-emerald-400/70 border-b-emerald-800 bg-emerald-500/20'
                            : isRevealed
                              ? 'pixel-card-revealed'
                              : 'pixel-card-back hover:border-amber-500/55 active:translate-y-0.5 active:border-b-2'
                        }`}
                      >
                        {isRevealed ? (
                          <SymbolIcon className={`h-9 w-9 ${symbol.color}`} />
                        ) : (
                          <HelpCircle className="h-6 w-6 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUDOKU LÓGICO (2x2 -> 4x4, 3x3 cheio, 3x3 desafio) */}
            {mode === 'sudoku' && (
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`grid w-full overflow-hidden rounded-md border-2 border-amber-500/60 bg-[var(--bs-canvas)] shadow-[4px_4px_0_0_var(--bs-shadow)] ${
                    sudokuPuzzle.gridSize === 4
                      ? 'max-w-[296px] grid-cols-4'
                      : 'max-w-[396px] grid-cols-9'
                  }`}
                >
                  {sudokuBoard.map((row, r) =>
                    row.map((cellVal, c) => {
                      const isClue = sudokuPuzzle.puzzle[r][c] !== null;
                      const isSelected =
                        selectedCell !== null && selectedCell[0] === r && selectedCell[1] === c;
                      const isBoxRight =
                        (c + 1) % sudokuPuzzle.boxSize === 0 && c + 1 < sudokuPuzzle.gridSize;
                      const isBoxBottom =
                        (r + 1) % sudokuPuzzle.boxSize === 0 && r + 1 < sudokuPuzzle.gridSize;
                      const isRelated =
                        selectedCell !== null &&
                        (selectedCell[0] === r ||
                          selectedCell[1] === c ||
                          (Math.floor(selectedCell[0] / sudokuPuzzle.boxSize) ===
                            Math.floor(r / sudokuPuzzle.boxSize) &&
                            Math.floor(selectedCell[1] / sudokuPuzzle.boxSize) ===
                              Math.floor(c / sudokuPuzzle.boxSize)));
                      const isSameNum = selectedValue !== null && cellVal === selectedValue;
                      const isErr = errorCellKey === `${r}-${c}`;

                      return (
                        <button
                          key={`${r}-${c}`}
                          type="button"
                          onClick={() => setSelectedCell([r, c])}
                          aria-label={`Linha ${r + 1} Coluna ${c + 1}`}
                          className={`flex aspect-square min-h-[36px] items-center justify-center border-b border-r font-mono-tabular transition-colors focus-visible:outline-none ${
                            sudokuPuzzle.gridSize === 4 ? 'text-xl font-extrabold' : 'text-sm sm:text-base font-bold'
                          } ${isBoxRight ? 'border-r-2 border-r-amber-500/60' : ''} ${
                            isBoxBottom ? 'border-b-2 border-b-amber-500/60' : ''
                          } ${
                            isErr
                              ? 'border-[var(--bs-divider)] bg-rose-500/35 text-rose-200'
                              : isSelected
                                ? 'border-[var(--bs-divider)] bg-amber-500/25 ring-2 ring-inset ring-amber-400 text-amber-300'
                                : isSameNum
                                  ? 'border-[var(--bs-divider)] bg-amber-500/15 text-amber-300'
                                  : isRelated
                                    ? 'pixel-sudoku-related'
                                    : 'pixel-sudoku-cell'
                          } ${
                            isClue
                              ? 'text-slate-100'
                              : cellVal !== null
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                          }`}
                        >
                          {cellVal ?? ''}
                        </button>
                      );
                    }),
                  )}
                </div>

                {/* Teclado Numérico do Sudoku */}
                <div
                  className={`grid w-full gap-2 ${
                    sudokuPuzzle.gridSize === 4
                      ? 'max-w-[296px] grid-cols-4'
                      : 'max-w-[396px] grid-cols-5'
                  }`}
                >
                  {Array.from({ length: sudokuPuzzle.gridSize }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={!selectedCell || sudokuBoard[selectedCell[0]]?.[selectedCell[1]] !== null}
                      onClick={() => handleSudokuDigitInput(num)}
                      className="pixel-btn-secondary flex min-h-[46px] items-center justify-center rounded-md text-base font-bold text-slate-100 font-mono-tabular hover:border-amber-400/70 disabled:opacity-40"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Faixa de retorno instantâneo */}
            <div className="flex min-h-[28px] items-center justify-center">
              {feedbackBanner && (
                <div
                  className={`font-pixel flex items-center gap-1.5 text-xs uppercase ${
                    feedbackBanner.ok ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {feedbackBanner.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{feedbackBanner.label}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'ROUND_SUMMARY' && completedSession && (
          <div className="pixel-panel mx-auto w-full max-w-md min-w-0 rounded-md p-6 text-center">
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((idx) => {
                const earnedStars = calculateStarRating(
                  completedSession.accuracy,
                  completedSession.avgReactionMs,
                  mode,
                  difficulty,
                );
                return (
                  <Star
                    key={idx}
                    className={`h-8 w-8 ${
                      idx <= earnedStars
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            <h2 className="font-pixel mt-4 text-xl font-bold uppercase text-slate-100 text-balance">
              Fase Concluída
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {gameDef.title} · {tierConfig.label}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="pixel-inset rounded-md p-4">
                <p className="font-pixel text-[10px] uppercase text-slate-400">XP Ganho</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-400 font-mono-tabular">
                  +{completedSession.earnedXp}
                </p>
              </div>
              <div className="pixel-inset rounded-md p-4">
                <p className="font-pixel text-[10px] uppercase text-slate-400">Precisão</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-400 font-mono-tabular">
                  {completedSession.accuracy}%
                </p>
              </div>
              <div className="pixel-inset rounded-md p-4">
                <p className="font-pixel text-[10px] uppercase text-slate-400">Reação Média</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-100 font-mono-tabular">
                  {completedSession.avgReactionMs}ms
                </p>
              </div>
              <div className="pixel-inset rounded-md p-4">
                <p className="font-pixel text-[10px] uppercase text-slate-400">Idade Mental</p>
                <p className="mt-1 text-2xl font-extrabold text-sky-400 font-mono-tabular">
                  {completedSession.brainAgeAfter}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="pixel-btn-secondary font-pixel flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold uppercase whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Repetir</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="pixel-btn-primary font-pixel flex min-h-[48px] flex-1 items-center justify-center rounded-md px-4 text-xs font-bold uppercase whitespace-nowrap"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
