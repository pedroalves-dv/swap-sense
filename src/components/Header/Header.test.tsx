import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

describe('Header', () => {
  it('renders the app title', () => {
    render(<Header />);
    expect(screen.getByText(/SwapSense/i)).toBeInTheDocument();
  });

  it('toggles theme when button is clicked', () => {
    render(<Header />);
    const toggleBtn = screen.getByLabelText(/Switch to dark mode/i);
    fireEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    fireEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe(null);
  });
});
