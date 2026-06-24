export const isRcdeSessionTokenValid = (token?: string): boolean => {
  console.log('RCDE session token:', token);

  if (!token) {
    return true;
  }

  return token.length > 0;
};
