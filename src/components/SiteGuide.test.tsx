import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { expect, test } from 'vitest';
import SiteGuide from './SiteGuide';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

test('the avatar helper suggests a lesson from a few words and goes there', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Routes><Route path="*" element={<Where />} /></Routes>
      <SiteGuide />
    </MemoryRouter>,
  );
  const button = screen.getByRole('button', { name: /Where to\?/ });
  await user.click(button);
  expect(screen.getByRole('dialog', { name: 'Where do you want to go?' })).toBeTruthy();
  expect(screen.getByRole('link', { name: /Start here: Lesson 0-1/ })).toBeTruthy();
  await user.type(screen.getByLabelText('Type a topic or a question'), 'logistic regression');
  await user.click(screen.getByRole('link', { name: /Lesson 15-2/ }));
  expect(screen.getByTestId('where').textContent).toBe('/lesson/15-2');
  // Moving to another page closes the panel.
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Escape closes the helper and returns to its button', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><SiteGuide /></MemoryRouter>);
  await user.click(screen.getByRole('button', { name: /Where to\?/ }));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /Where to\?/ }));
});
