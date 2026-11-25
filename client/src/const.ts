export const startLogin = () => {
  const nonce = crypto.randomUUID();
  document.cookie = `oauth_state=${nonce}; Path=/; Max-Age=600; Secure; SameSite=None`;
  window.location.href = `/api/oauth/google?state=${nonce}`;
};
