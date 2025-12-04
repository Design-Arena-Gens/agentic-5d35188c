'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };

const BOARD_SIZE = 20;
const INITIAL_SPEED = 160;

const DIRECTIONS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
};

const isOpposite = (current: Point, next: Point) =>
  current.x + next.x === 0 && current.y + next.y === 0;

const spawnFood = (occupied: Point[]) => {
  const freeCells: Point[] = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!occupied.some((cell) => cell.x === x && cell.y === y)) {
        freeCells.push({ x, y });
      }
    }
  }
  if (!freeCells.length) {
    return { x: 0, y: 0 };
  }
  return freeCells[Math.floor(Math.random() * freeCells.length)];
};

export default function HomePage() {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ]);
  const [direction, setDirection] = useState<Point>(DIRECTIONS.ArrowRight);
  const [food, setFood] = useState<Point>(() => spawnFood([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]));
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [status, setStatus] = useState<"ready" | "running" | "over">("ready");
  const pendingDirection = useRef<Point | null>(null);

  const grid = useMemo(() => {
    const cells: ("empty" | "snake" | "food")[][] = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => "empty")
    );
    snake.forEach((segment) => {
      cells[segment.y][segment.x] = "snake";
    });
    cells[food.y][food.x] = "food";
    return cells;
  }, [snake, food]);

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    setSnake(initialSnake);
    setDirection(DIRECTIONS.ArrowRight);
    setFood(spawnFood(initialSnake));
    setSpeed(INITIAL_SPEED);
    setScore(0);
    setStatus("running");
    pendingDirection.current = null;
  }, []);

  const tick = useCallback(() => {
    setSnake((currentSnake) => {
      const activeDirection = pendingDirection.current ?? direction;
      pendingDirection.current = null;
      const head = currentSnake[0];
      const nextHead = {
        x: head.x + activeDirection.x,
        y: head.y + activeDirection.y
      };

      const hitWall =
        nextHead.x < 0 ||
        nextHead.x >= BOARD_SIZE ||
        nextHead.y < 0 ||
        nextHead.y >= BOARD_SIZE;

      const hitSelf = currentSnake.some(
        (segment) => segment.x === nextHead.x && segment.y === nextHead.y
      );

      if (hitWall || hitSelf) {
        setStatus("over");
        setBestScore((prev) => Math.max(prev, score));
        return currentSnake;
      }

      const hasEaten = nextHead.x === food.x && nextHead.y === food.y;
      const newSnake = [nextHead, ...currentSnake];

      if (!hasEaten) {
        newSnake.pop();
      } else {
        setFood(spawnFood(newSnake));
        setScore((prev) => prev + 1);
        setSpeed((prev) => Math.max(60, prev - 5));
      }

      return newSnake;
    });
  }, [direction, food.x, food.y, score]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }
    const interval = window.setInterval(() => {
      tick();
    }, speed);
    return () => {
      window.clearInterval(interval);
    };
  }, [speed, status, tick]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " " && status !== "running") {
        event.preventDefault();
        resetGame();
        return;
      }

      const next = DIRECTIONS[event.key];
      if (!next) {
        return;
      }

      event.preventDefault();
      if (status === "ready") {
        setStatus("running");
      }
      if (status !== "running") {
        return;
      }

      const currentDirection = pendingDirection.current ?? direction;
      if (isOpposite(currentDirection, next)) {
        return;
      }
      pendingDirection.current = next;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [direction, resetGame, status]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedBest = window.localStorage.getItem("snake-best-score");
    if (storedBest) {
      setBestScore(Number(storedBest));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("snake-best-score", String(bestScore));
  }, [bestScore]);

  return (
    <main className="page">
      <section className="panel">
        <header className="panel-header">
          <h1>لعبة الدودة</h1>
          <p>استعمل الأسهم للتحكم بالدودة، واضغط على المسطرة لإعادة اللعب.</p>
        </header>
        <div className="scoreboard">
          <div>
            <span className="label">النقاط الحالية</span>
            <span className="value">{score}</span>
          </div>
          <div>
            <span className="label">أفضل نتيجة</span>
            <span className="value">{bestScore}</span>
          </div>
        </div>
        <div className="board" role="grid" aria-label="لوح اللعبة">
          {grid.map((row, rowIndex) =>
            row.map((cell, cellIndex) => (
              <div
                key={`${rowIndex}-${cellIndex}`}
                className={`cell cell-${cell}`}
                role="gridcell"
                aria-hidden="true"
              />
            ))
          )}
        </div>
        <footer className="panel-footer">
          {status === "ready" && <p>ابدأ بالضغط على أي سهم.</p>}
          {status === "running" && <p>كلما أكلت التفاحة ستزداد سرعتك!</p>}
          {status === "over" && (
            <div className="game-over">
              <p>انتهت اللعبة! اضغط مسطرة لإعادة المحاولة.</p>
              <button type="button" onClick={resetGame}>
                إعادة اللعب
              </button>
            </div>
          )}
        </footer>
      </section>
    </main>
  );
}
