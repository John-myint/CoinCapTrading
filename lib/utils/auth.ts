import { getSession, signOut } from 'next-auth/react';

// Authentication utility functions

/**
 * Handle authentication errors consistently across the app
 * Clears invalid sessions and redirects to login
 */
export function handleAuthError(status: number, router: any) {
  if (status === 401 || status === 404) {
    if (status === 404) {
      const message = 'Your account was not found. This may happen if:\n' +
                     '- Your account was deleted\n' +
                     '- The database was reset\n' +
                     '- You\'re using an old session\n\n' +
                     'Please register or log in again.';
      alert(message);
    } else if (status === 401) {
      alert('Your session has expired. Please log in again.');
    }

    void signOut({ redirect: false });
    router.push('/login');
    return true;
  }
  return false;
}

/**
 * Fetch user data with automatic error handling
 */
export async function fetchUserData(router: any) {
  const session = await getSession();

  if (!session) {
    router.push('/login');
    return null;
  }

  try {
    const response = await fetch('/api/auth/me', { method: 'GET' });

    if (handleAuthError(response.status, router)) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load user data');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Fetch user data error:', error);
    throw error;
  }
}

/**
 * Logout user (clear tokens and redirect)
 */
export function logout(router: any) {
  void signOut({ redirect: false });
  router.push('/login');
}

/**
 * Check if user is authenticated (has valid session)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
