/**
 * Login screen tests
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { mockSupabase } from '../../__mocks__/supabaseMock';

// Must mock supabase before importing the component
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock the components used in login
jest.mock('../../components/AnimatedLogo', () => ({
  AnimatedLogo: () => 'AnimatedLogo',
}));
jest.mock('../../components/sky', () => ({
  NightSky: () => 'NightSky',
}));
jest.mock('../../components/PixelCharacter', () => ({
  PixelCharacter: () => 'PixelCharacter',
  DEFAULT_CHARACTER: {},
}));

import LoginScreen from '../../app/login';
import { router } from 'expo-router';

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome screen with Sign In and Create Account buttons', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText("Gather 'round the fire with friends")).toBeTruthy();
  });

  it('navigates to login form when Sign In is pressed', () => {
    const { getByText, getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText('Sign In'));
    expect(getByLabelText('Email address')).toBeTruthy();
    expect(getByLabelText('Password')).toBeTruthy();
  });

  it('navigates to signup form when Create Account is pressed', () => {
    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText('Create Account'));
    expect(getByLabelText('Email address')).toBeTruthy();
  });

  it('shows back button in auth form', () => {
    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText('Sign In'));
    expect(getByLabelText('Go back')).toBeTruthy();
  });

  it('goes back to welcome from auth form', () => {
    const { getByLabelText, getByText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText('Sign In'));
    fireEvent.press(getByLabelText('Go back'));
    // Should be back on welcome screen
    expect(getByLabelText('Create Account')).toBeTruthy();
  });

  it('calls signInWithPassword on sign in', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      }),
    });

    const { getByLabelText } = render(<LoginScreen />);

    // Go to login form
    fireEvent.press(getByLabelText('Sign In'));

    // Fill in credentials
    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');

    // Press sign in
    fireEvent.press(getByLabelText('Sign In'));

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('redirects to create-character when no username', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { username: null },
        error: null,
      }),
    });

    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText('Sign In'));
    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign In'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/create-character');
    });
  });

  it('redirects to tabs when username exists', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { username: 'existinguser' },
        error: null,
      }),
    });

    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText('Sign In'));
    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign In'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('calls signUp on create account', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'token' } },
      error: null,
    });

    const { getByLabelText } = render(<LoginScreen />);

    // Go to signup form
    fireEvent.press(getByLabelText('Create Account'));

    // Fill in credentials
    fireEvent.changeText(getByLabelText('Email address'), 'new@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');

    // Press create account
    fireEvent.press(getByLabelText('Create Account'));

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
    });
  });
});
