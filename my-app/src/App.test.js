import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation menu', () => {
  render(<App />);
  const navMenu = screen.getByRole('navigation');
  expect(navMenu).toBeInTheDocument();
});

test('renders home page by default', () => {
  render(<App />);
  expect(screen.getByText('Главная страница')).toBeInTheDocument();
});

test('navigation menu contains all links', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: 'Главная' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'О нас' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Контакты' })).toBeInTheDocument();
});
