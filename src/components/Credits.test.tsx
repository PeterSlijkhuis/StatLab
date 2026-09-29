import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test } from 'vitest';
import { getProgress } from '../state/progress';
import { courseStats } from '../state/stats';
import Credits from './Credits';
import Sidebar from './Sidebar';

describe('Credits', () => {
  test('names the authors and the source of the materials', () => {
    const { container } = render(<Credits />);
    expect(container.querySelector('.credits-authors')?.textContent).toBe(
      'Made by dr. P.J.H. Slijkhuis and dr. V.d.C. Resendez Gomez, based on materials provided by dr. S.J. Watson.',
    );
  });

  describe('author names', () => {
    beforeEach(() => localStorage.clear());

    test('each click on a surname adds a point', () => {
      render(<Credits />);
      for (let i = 0; i < 25; i++) fireEvent.click(screen.getByText('Slijkhuis'));
      fireEvent.click(screen.getByText('Resendez Gomez'));
      expect(getProgress().bonus).toBe(26);
      expect(courseStats(getProgress()).points).toBe(26);
    });
  });

  test('links to both partners, each opening in a new tab', () => {
    render(<Credits />);
    const twente = screen.getByRole('link', { name: 'University of Twente' });
    const lab = screen.getByRole('link', { name: 'The BMS Lab' });
    for (const link of [twente, lab]) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
    expect(twente.getAttribute('href')).toBe('https://www.utwente.nl/en/');
  });

  test('names the book licence and the RStudio trademark', () => {
    render(<Credits />);
    const licence = screen.getByRole('link', { name: 'Creative Commons BY-NC-SA licence' });
    expect(licence.getAttribute('href')).toBe('https://creativecommons.org/licenses/by-nc-sa/4.0/');
    expect(screen.getByText(/not affiliated with or endorsed by Posit/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'CC BY-NC-SA 4.0' }).getAttribute('href'))
      .toBe('https://creativecommons.org/licenses/by-nc-sa/4.0/');
  });

  // The home page is not the only way in: a student following a shared lesson
  // link never sees it, so the credit has to be on every page.
  test('shows at the foot of the sidebar, which every page has', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Course navigation' });
    expect(nav.querySelector('.credits-authors')?.textContent).toMatch(/^Made by dr\. P\.J\.H\. Slijkhuis/);
    expect(within(nav).getByRole('link', { name: 'The BMS Lab' })).toBeTruthy();
  });
});
