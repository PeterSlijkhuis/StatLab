import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import Advanced from './Advanced';
import { setAdvanced } from '../state/settings';

beforeEach(() => localStorage.clear());

test('an advanced section stays hidden behind a note until Advanced topics is on', () => {
  render(<Advanced><p>Fisher's exact test</p></Advanced>);
  expect(screen.queryByText("Fisher's exact test")).toBeNull();
  expect(screen.getByText(/Switch on Advanced topics under Settings/)).toBeDefined();
  act(() => setAdvanced(true));
  expect(screen.getByText("Fisher's exact test")).toBeDefined();
});
