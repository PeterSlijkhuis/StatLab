import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Tour, { startTour, TOUR_KEY } from './Tour';

describe('Tour', () => {
  beforeEach(() => {
    localStorage.removeItem(TOUR_KEY);
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('opens on a first visit and is not shown again once skipped', () => {
    const { unmount } = render(<Tour />);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('dialog', { name: 'Welcome to StatLab' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(TOUR_KEY)).toBe('done');
    unmount();

    render(<Tour />);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => startTour());
    expect(screen.getByRole('dialog', { name: 'Welcome to StatLab' })).toBeTruthy();
  });

  it('leaves out steps whose target is not on the page', () => {
    render(<Tour />);
    act(() => vi.advanceTimersByTime(500));
    // jsdom lays nothing out, so only the two steps without a target remain.
    expect(screen.getByText('1 of 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show me around' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start learning' }));
    expect(localStorage.getItem(TOUR_KEY)).toBe('done');
  });
});
