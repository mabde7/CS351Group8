import { render, screen } from '@testing-library/react';
import App from './App';

test('renders homepage title', () => {
  render(<App />);
  const heading = screen.getByText(/CS351Group8/i);
  expect(heading).toBeInTheDocument();
});
