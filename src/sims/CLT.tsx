import { useDeferredValue, useMemo, useState } from 'react';
import {
  describeShape,
  histogram,
  makeRng,
  mean,
  POPULATIONS,
  sampleMeans,
  sd,
  skewness,
  type PopulationName,
} from './rng';
import { useFmt, useT } from '../i18n/t';
import './CLT.css';

const REPLICATIONS = 2000;
const BINS = 34;
const WIDTH = 640;
const HEIGHT = 180;

function Histogram({ values, colour, label }: { values: number[]; colour: string; label: string }) {
  const t = useT();
  const f = useFmt();
  const { edges, counts } = useMemo(() => histogram(values, BINS), [values]);
  const skew = useMemo(() => skewness(values), [values]);
  const peak = Math.max(...counts, 1);
  const lo = edges[0];
  const hi = edges[edges.length - 1];
  const span = hi - lo || 1;
  const barWidth = WIDTH / BINS;

  return (
    <figure className="clt-figure">
      <figcaption>{label}</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('{label}. {shape} (skewness {skew}).', { label, shape: t(describeShape(skew)), skew: f(skew, 2) })} className="clt-svg">
        {counts.map((count, index) => {
          const height = (count / peak) * (HEIGHT - 24);
          return (
            <rect
              key={index}
              x={index * barWidth}
              y={HEIGHT - 20 - height}
              width={Math.max(barWidth - 1, 1)}
              height={height}
              fill={colour}
            />
          );
        })}
        <line x1={0} y1={HEIGHT - 20} x2={WIDTH} y2={HEIGHT - 20} stroke="#334155" />
        <text x={2} y={HEIGHT - 6} className="clt-axis">{f(lo, 1)}</text>
        <text x={WIDTH - 4} y={HEIGHT - 6} textAnchor="end" className="clt-axis">{f(hi, 1)}</text>
        <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle" className="clt-axis">
          {f(lo + span / 2, 1)}
        </text>
      </svg>
    </figure>
  );
}

export default function CLT() {
  const t = useT();
  const f = useFmt();
  const [populationName, setPopulationName] = useState<PopulationName>('skewed');
  const [n, setN] = useState(2);
  const [seed, setSeed] = useState(1);
  // At n = 100 a tick costs ~40 ms of simulation, over two frames. The slider
  // and its label use the live values; the simulation and everything read off
  // it use the deferred ones, so the readout never mixes two different n's.
  const deferredN = useDeferredValue(n);
  const deferredPopulationName = useDeferredValue(populationName);
  const deferredPopulation = POPULATIONS[deferredPopulationName];

  const populationDraws = useMemo(() => {
    const rng = makeRng(seed * 7919);
    return Array.from({ length: 4000 }, () => deferredPopulation.draw(rng));
  }, [deferredPopulation, seed]);

  const means = useMemo(
    () => sampleMeans(deferredPopulation, deferredN, REPLICATIONS, makeRng(seed * 104729)),
    [deferredPopulation, deferredN, seed],
  );

  const observedSe = sd(means);
  const predictedSe = deferredPopulation.sd / Math.sqrt(deferredN);

  return (
    <div className="clt">
      <div className="clt-controls">
        <label>
          {t('Population')}
          <select value={populationName} onChange={(event) => setPopulationName(event.target.value as PopulationName)}>
            {(Object.keys(POPULATIONS) as PopulationName[]).map((key) => (
              <option key={key} value={key}>{t(POPULATIONS[key].label)}</option>
            ))}
          </select>
        </label>

        <label className="clt-slider">
          {t('Sample size (n)')} = <strong>{n}</strong>
          <input type="range" min={1} max={100} value={n} onChange={(event) => setN(Number(event.target.value))} />
        </label>

        <button type="button" onClick={() => setSeed((value) => value + 1)}>{t('Draw again')}</button>
      </div>

      <p className="clt-description">{t(deferredPopulation.description)}</p>
      <Histogram values={populationDraws} colour="#94a3b8" label={t('The population (individual people)')} />
      <Histogram values={means} colour="#1d4ed8" label={t('Sampling distribution: {count} sample means, each from n = {n}', { count: REPLICATIONS, n: deferredN })} />

      <table className="clt-readout">
        <tbody>
          <tr><th scope="row">{t('Population mean (μ)')}</th><td>{f(deferredPopulation.mean, 2)}</td><th scope="row">{t('Mean of the sample means')}</th><td>{f(mean(means), 2)}</td></tr>
          <tr><th scope="row">{t('Population SD (σ)')}</th><td>{f(deferredPopulation.sd, 2)}</td><th scope="row">{t('SD of the sample means')}</th><td>{f(observedSe, 2)}</td></tr>
          <tr><th scope="row">{t('σ / √n predicts')}</th><td>{f(predictedSe, 2)}</td><th scope="row">{t('Observed matches prediction')}</th><td>{Math.abs(observedSe - predictedSe) < predictedSe * 0.1 ? t('yes') : t('not within 10%')}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
