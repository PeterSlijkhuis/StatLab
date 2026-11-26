import { useT } from '../i18n/t';
import './Primer.css';

/** RStudio's four panes in their default layout, drawn rather than screenshotted. */
export const PANES = [
  { name: 'Source', where: 'Top left', job: 'Your script: the lines you write, save and run again tomorrow.' },
  { name: 'Environment', where: 'Top right', job: 'Every object you have stored, with its size and a preview.' },
  { name: 'Console', where: 'Bottom left', job: 'Where R runs each line and prints the answer. Nothing typed here is saved.' },
  { name: 'Files, Plots, Help', where: 'Bottom right', job: 'The project folder, your figures, and the help pages from ?mean.' },
] as const;

export default function RStudioPanes() {
  const t = useT();
  return (
    <figure className="rstudio">
      <div className="rstudio-bar" aria-hidden="true">
        <span>File  Edit  Code  View  Session  Tools  Help</span>
        <span>survey-analysis</span>
      </div>
      <div className="rstudio-grid">
        {PANES.map((pane) => (
          <div key={pane.name} className="rstudio-pane">
            <small>{t(pane.where)}</small>
            <strong>{t(pane.name)}</strong>
            <p>{t(pane.job)}</p>
          </div>
        ))}
      </div>
      <figcaption>
        {t('RStudio\'s default layout. The name at the top right is the open project; it reads "Project: (None)" when no project is open.')}
      </figcaption>
    </figure>
  );
}
