import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PValue from './PValue';

describe('PValue', () => {
  test('the p-value is the proportion of null results at least as extreme', () => {
    render(<PValue />);
    const p = screen.getByTestId('p-value').textContent;
    const extreme = Number(screen.getByTestId('extreme-count').textContent);
    const total = Number(screen.getByTestId('replications').textContent);
    expect(extreme).toBeGreaterThan(0);
    expect(p).toBe((extreme / total).toFixed(3));
  });

  test('with no extreme shuffles p is shown as a bound, never zero', () => {
    render(<PValue />);
    fireEvent.change(screen.getByLabelText(/Group size/), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Observed difference/), { target: { value: '5' } });
    expect(screen.getByTestId('extreme-count').textContent).toBe('0');
    expect(screen.getByTestId('p-value').textContent).toBe('< 0.00025 (none of 4000)');
  });

  test('moving the observed effect further out lowers p', () => {
    render(<PValue />);
    const at = (value: string) => {
      fireEvent.change(screen.getByLabelText(/Observed difference/), { target: { value } });
      return Number(screen.getByTestId('p-value').textContent);
    };
    expect(at('4')).toBeLessThan(at('1'));
  });

  test('the verdict follows alpha, and says what it does not mean', () => {
    render(<PValue />);
    fireEvent.change(screen.getByLabelText(/Observed difference/), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/α/), { target: { value: '0.01' } });
    const verdict = screen.getByTestId('verdict').textContent ?? '';
    expect(verdict).toMatch(/reject|not reject/);
    expect(screen.getByTestId('caveat').textContent)
      .toMatch(/not the probability that the null hypothesis is true/i);
  });

  test('a two-tailed test counts both tails', () => {
    render(<PValue />);
    fireEvent.change(screen.getByLabelText(/Observed difference/), { target: { value: '2.5' } });
    const two = Number(screen.getByTestId('p-value').textContent);
    fireEvent.click(screen.getByLabelText(/One-tailed/));
    expect(Number(screen.getByTestId('p-value').textContent)).toBeCloseTo(two / 2, 2);
  });
});
