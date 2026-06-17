// Standalone app params - no base44 dependency
const getAppParams = () => ({
  appId: import.meta.env.VITE_APP_ID || 'standalone',
  token: null,
  fromUrl: window.location.href,
});

export const appParams = {
  ...getAppParams()
}