import { useCallback, useMemo, useRef, useState } from 'react';
import { correlate, fitLine, makeRng, residualSumOfSquares, type Point } from './rng';
import { useFmt, useT } from '../i18n/t';
import './LeastSquares.css';

const N = 12;
const SIZE = 420;
const PAD = 40;
/** Fixed data window, so dragging a point never rescales the picture under the student's hand. */
const LO = -3;
const HI = 3;

/**
 * Equal x and y scales, which is not a style choice: a residual square drawn on
 * unequal axes is a rectangle, and the whole visual argument of the simulation
 * collapses. One scale, derived once, used for both axes.
 */
const SCALE = (SIZE - 2 * PAD) / (HI - LO);
const toX = (x: number) => PAD + (x - LO) * SCALE;
const toY = (y: number) => SIZE - PAD - (y - LO) * SCALE;
const fromX = (px: number) => (px - PAD) / SCALE + LO;
const fromY = (py: number) => (SIZE - PAD - py) / SCALE + LO;
const clamp = (v: number) => Math.min(HI, Math.max(LO, v));

export default function LeastSquares() {
  const t = useT();
  const f = useFmt();
  const [points, setPoints] = useState<Point[]>(() =>
    correlate(0.65, N, makeRng(4409)).map((p) => ({ x: clamp(p.x), y: clamp(p.y) })),
  );
  // Deliberately away from the OLS fit: the student has to move the line by
  // hand and watch the total shrink before "Show the best line" means anything.
  const [intercept, setIntercept] = useState(1.2);
  const [slope, setSlope] = useState(-0.8);
  const [showBest, setShowBest] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const best = useMemo(() => fitLine(points), [points]);
  const degenerate = !Number.isFinite(best.slope);

  const yourRss = useMemo(
    () => residualSumOfSquares(points, intercept, slope),
    [points, intercept, slope],
  );
  const bestRss = useMemo(
    () => (degenerate ? Number.NaN : residualSumOfSquares(points, best.intercept, best.slope)),
    [points, best, degenerate],
  );

  const moveTo = useCallback((index: number, clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const px = ((clientX - box.left) / box.width) * SIZE;
    const py = ((clientY - box.top) / box.height) * SIZE;
    setPoints((current) =>
      current.map((p, i) => (i === index ? { x: clamp(fromX(px)), y: clamp(fromY(py)) } : p)),
    );
  }, []);

  const nudge = (index: number, dx: number, dy: number) =>
    setPoints((current) =>
      current.map((p, i) => (i === index ? { x: clamp(p.x + dx), y: clamp(p.y + dy) } : p)),
    );

  return (
    <div className="leastsquares">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="group"
        className="leastsquares-svg"
        aria-label={
          t('Twelve points and a line you control. The squared vertical distances from the points to your line add up to {rss}.', { rss: f(yourRss, 2) }) +
          ' ' +
          (degenerate
            ? t('Every point now sits at the same x, so no line can be fitted.')
            : t('The best possible line gets that total down to {rss}.', { rss: f(bestRss, 2) }))
        }
        onPointerMove={(event) => {
          if (dragging !== null) moveTo(dragging, event.clientX, event.clientY);
        }}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        <rect x={0} y={0} width={SIZE} height={SIZE} fill="#f8fafc" />
        <line x1={toX(LO)} y1={toY(0)} x2={toX(HI)} y2={toY(0)} stroke="#e2e8f0" />
        <line x1={toX(0)} y1={toY(LO)} x2={toX(0)} y2={toY(HI)} stroke="#e2e8f0" />

        {points.map((point, index) => {
          const fitted = intercept + slope * point.x;
          const residual = point.y - fitted;
          // Side length equals the residual in data units, so the drawn area is
          // literally the squared residual this point contributes.
          const side = Math.abs(residual) * SCALE;
          return (
            <rect
              key={`square-${index}`}
              data-testid="residual-square"
              data-area={residual * residual}
              x={toX(point.x)}
              y={toY(Math.max(point.y, fitted))}
              width={side}
              height={side}
              fill="#f97316"
              fillOpacity={0.22}
              stroke="#f97316"
              strokeOpacity={0.5}
            />
          );
        })}

        <line
          x1={toX(LO)}
          y1={toY(intercept + slope * LO)}
          x2={toX(HI)}
          y2={toY(intercept + slope * HI)}
          stroke="#1d4ed8"
          strokeWidth={2}
        />
        {showBest && !degenerate && (
          <line
            x1={toX(LO)}
            y1={toY(best.intercept + best.slope * LO)}
            x2={toX(HI)}
            y2={toY(best.intercept + best.slope * HI)}
            stroke="#15803d"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {points.map((point, index) => (
          <circle
            key={`point-${index}`}
            data-testid="point"
            tabIndex={0}
            role="button"
            aria-label={t('Point {number} at x {x}, y {y}. Use the arrow keys to move it.', { number: index + 1, x: f(point.x, 2), y: f(point.y, 2) })}
            cx={toX(point.x)}
            cy={toY(point.y)}
            r={5}
            fill="#0f172a"
            // An invisible ring widens the target to about a fingertip. The
            // drawn dot is 5 units in a 420-unit square, roughly 4px on a phone.
            stroke="transparent"
            strokeWidth={24}
            onPointerDown={(event) => {
              (event.target as Element).releasePointerCapture?.(event.pointerId);
              setDragging(index);
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 0.5 : 0.1;
              if (event.key === 'ArrowUp') nudge(index, 0, step);
              else if (event.key === 'ArrowDown') nudge(index, 0, -step);
              else if (event.key === 'ArrowLeft') nudge(index, -step, 0);
              else if (event.key === 'ArrowRight') nudge(index, step, 0);
              else return;
              event.preventDefault();
            }}
          />
        ))}
      </svg>

      <div className="leastsquares-controls">
        <label className="leastsquares-slider">
          {t('Intercept')}
          <input type="range" min={-3} max={3} step={0.05} value={intercept} onChange={(e) => setIntercept(Number(e.target.value))} />
          <span>{f(intercept, 2)}</span>
        </label>
        <label className="leastsquares-slider">
          {t('Slope')}
          <input type="range" min={-2} max={2} step={0.05} value={slope} onChange={(e) => setSlope(Number(e.target.value))} />
          <span>{f(slope, 2)}</span>
        </label>
      </div>

      <table className="leastsquares-readout">
        <tbody>
          <tr>
            <th scope="row">{t('Your line, sum of squared residuals')}</th>
            <td data-testid="your-rss">{f(yourRss, 3)}</td>
            <th scope="row">{t('Best possible')}</th>
            <td data-testid="best-rss">{degenerate ? '—' : f(bestRss, 3)}</td>
            <th scope="row">{t('You are away by')}</th>
            <td data-testid="rss-gap">{degenerate ? '—' : f(yourRss - bestRss, 3)}</td>
          </tr>
        </tbody>
      </table>

      <p className="leastsquares-equation">
        {degenerate
          ? t('Every point sits at the same x, so there is no line to fit: the slope would be a division by zero.')
          : t('The best line is ŷ = {intercept} {sign} {slope}x, with r = {r}.', {
              intercept: f(best.intercept, 2),
              sign: best.slope < 0 ? '−' : '+',
              slope: f(Math.abs(best.slope), 2),
              r: f(best.r, 2),
            })}
      </p>

      <div className="leastsquares-actions">
        <button
          type="button"
          onClick={() => {
            if (degenerate) return;
            setIntercept(best.intercept);
            setSlope(best.slope);
            setShowBest(true);
          }}
        >
          {t('Show the best line')}
        </button>
        <button type="button" onClick={() => setPoints((current) => current.map((p) => ({ ...p, x: 0 })))}>
          {t('Stack the points')}
        </button>
        <button
          type="button"
          onClick={() => {
            setPoints(correlate(0.65, N, makeRng(4409)).map((p) => ({ x: clamp(p.x), y: clamp(p.y) })));
            setIntercept(1.2);
            setSlope(-0.8);
            setShowBest(false);
          }}
        >
          {t('Start over')}
        </button>
      </div>

      <p className="leastsquares-note">
        {t('The orange squares are the thing being minimised: each one is the vertical distance from a point to your line, squared. Not the perpendicular distance, and not the horizontal one.')}
      </p>
    </div>
  );
}
