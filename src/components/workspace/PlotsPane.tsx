import { useEffect, useRef } from 'react';
import { useT } from '../../i18n/t';

type Props = {
  plots: ImageBitmap[];
  index: number;
  onIndex: (index: number) => void;
  onClear: () => void;
};

/** RStudio's Plots pane: the latest figure, with arrows back through earlier ones. */
export default function PlotsPane({ plots, index, onIndex, onClear }: Props) {
  const t = useT();
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const plot = plots[index];

  useEffect(() => {
    const target = canvas.current;
    if (!target || !plot) return;
    const context = target.getContext('2d');
    if (!context) return;
    target.width = plot.width;
    target.height = plot.height;
    context.drawImage(plot, 0, 0);
  }, [plot]);

  function exportPlot() {
    canvas.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plot-${index + 1}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <>
      <div className="ide-toolbar">
        <button type="button" aria-label={t('Previous plot')} disabled={index <= 0} onClick={() => onIndex(index - 1)}>
          ←
        </button>
        <button type="button" aria-label={t('Next plot')} disabled={index >= plots.length - 1} onClick={() => onIndex(index + 1)}>
          →
        </button>
        {plot && <span className="ide-toolbar-label">{t('Plot {n} of {total}', { n: index + 1, total: plots.length })}</span>}
        <span className="ide-toolbar-spacer" />
        <button type="button" disabled={!plot} onClick={exportPlot}>{t('Export')}</button>
        <button type="button" disabled={!plot} onClick={onClear} title={t('Remove every plot')}>{t('Clear')}</button>
      </div>
      <div className="ide-scroll ide-plot-area">
        {!plot && <p className="ide-empty">{t('Plots you draw appear here.')}</p>}
        <canvas ref={canvas} className="ide-plot" hidden={!plot} aria-label={plot ? t('Plot {n}', { n: index + 1 }) : undefined} role="img" />
      </div>
    </>
  );
}
