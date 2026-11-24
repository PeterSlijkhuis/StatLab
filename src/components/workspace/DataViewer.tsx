import type { DataPreview } from '../../r/workspace';
import { useT } from '../../i18n/t';

/** RStudio's data viewer, opened by `View(df)` or by clicking a data frame in Environment. */
export default function DataViewer({ name, data }: { name: string; data: DataPreview | null | undefined }) {
  const t = useT();
  if (data === undefined) return <p className="ide-empty">{t('Opening {name}…', { name })}</p>;
  if (data === null) return <p className="ide-empty">{t('‘{name}’ is not a data frame, or no longer exists.', { name })}</p>;
  return (
    <>
      <div className="ide-toolbar">
        <span className="ide-toolbar-label">
          {data.shown < data.rows
            ? t('Showing the first {shown} of {rows} rows, {columns} columns', { shown: data.shown, rows: data.rows, columns: data.columns.length })
            : t('{rows} rows, {columns} columns', { rows: data.rows, columns: data.columns.length })}
        </span>
      </div>
      <div className="ide-scroll ide-scroll-both">
        <table className="ide-data" aria-label={t('Data in {name}', { name })}>
          <thead>
            <tr>
              <th scope="col"><span className="visually-hidden">{t('Row')}</span></th>
              {data.columns.map((column, index) => (
                <th key={index} scope="col">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.cells.map((row, index) => (
              <tr key={index}>
                <th scope="row">{index + 1}</th>
                {row.map((cell, col) => (
                  <td key={col} className={cell === 'NA' ? 'ide-na' : undefined}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
