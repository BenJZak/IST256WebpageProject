const sessionKey = 'portalUser';

export function getStoredUser() {
  const savedUser = localStorage.getItem(sessionKey);

  if (!savedUser) {
    return null;
  }

  try {
    const user = JSON.parse(savedUser);

    if (!user || !user.token) {
      localStorage.removeItem(sessionKey);
      return null;
    }

    return user;
  } catch (error) {
    localStorage.removeItem(sessionKey);
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem(sessionKey, JSON.stringify(user));

  if (user && user.email) {
    localStorage.setItem('customerEmail', user.email);
  }

  window.dispatchEvent(new Event('portalUserChanged'));
}

export function clearUser() {
  localStorage.removeItem(sessionKey);
  localStorage.removeItem('customerEmail');
  localStorage.removeItem('cart');
  localStorage.removeItem('cartSessionID');
  window.dispatchEvent(new Event('portalUserChanged'));
}

export function getAuthHeaders(headers) {
  const savedUser = getStoredUser();
  let nextHeaders = {};

  if (headers) {
    nextHeaders = { ...headers };
  }

  if (savedUser && savedUser.token) {
    nextHeaders.Authorization = 'Bearer ' + savedUser.token;
  }

  return nextHeaders;
}

export function userIsAdmin(user) {
  return Boolean(user && user.role === 'admin');
}
