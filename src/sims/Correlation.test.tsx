import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Correlation from './Correlation';
import { fitLine } from './rng';

describe('Correlation', () => {
  test('the answer is hidden until the student commits', () => {
    render(<Correlation />);
    expect(screen.queryByTestId('actual-r')).toBeNull();
    fireEvent.change(screen.getByLabelText(/Your guess/), { target: { value: '0.5' } });
    fireEvent.click(screen.getByRole('button', { name: /Reveal/ }));
    expect(screen.getByTestId('actual-r')).toBeDefined();
  });

  test('the revealed r is the r of the points on screen', () => {
    render(<Correlation />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal/ }));
    const shown = Number(screen.getByTestId('actual-r').textContent);
    const points = screen.getAllByTestId('point').map((node) => ({
      x: Number(node.getAttribute('data-x')), y: Number(node.getAttribute('data-y')),
    }));
    expect(fitLine(points).r).toBeCloseTo(shown, 2);
  });

  test('a new round hides the answer again and changes the points', () => {
    render(<Correlation />);
    fireEvent.click(screen.getByRole('button', { name: /Reveal/ }));
    const first = screen.getByTestId('actual-r').textContent;
    fireEvent.click(screen.getByRole('button', { name: /Next scatterplot/ }));
    expect(screen.queryByTestId('actual-r')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Reveal/ }));
    expect(screen.getByTestId('actual-r').textContent).not.toBe(first);
  });

  test('the running score counts every completed round', () => {
    render(<Correlation />);
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Reveal/ }));
      fireEvent.click(screen.getByRole('button', { name: /Next scatterplot/ }));
    }
    expect(screen.getByTestId('rounds').textContent).toBe('3');
  });

  test('the verdict names underestimation, only after three moderate rs guessed too low', () => {
    render(<Correlation />);
    const actuals: number[] = [];
    let shown = 0;
    for (let i = 0; i < 9; i += 1) {
      // The guess stays at 0, so every nonzero r is underestimated.
      fireEvent.click(screen.getByRole('button', { name: /Reveal/ }));
      actuals.push(Math.abs(Number(screen.getByTestId('actual-r').textContent)));
      const last3 = actuals.slice(-3);
      const expected = last3.length === 3 && last3.every((r) => r >= 0.25 && r <= 0.75 && r > 0.1);
      const verdict = screen.queryByTestId('verdict');
      expect(verdict !== null).toBe(expected);
      if (verdict) {
        expect(verdict.textContent).toMatch(/underestimated/);
        shown += 1;
      }
      fireEvent.click(screen.getByRole('button', { name: /Next scatterplot/ }));
    }
    expect(screen.queryByText(/overestimated/)).toBeNull();
    expect(shown).toBeGreaterThan(0);
  });
});
