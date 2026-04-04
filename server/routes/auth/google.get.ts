export default defineOAuthGoogleEventHandler({
  config: {
    emailRequired: true,
    scope: ['openid', 'email', 'profile'],
  },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        id: user.sub,
        name: user.name,
        email: user.email,
        avatar: user.picture,
        provider: 'google',
      },
      loggedInAt: Date.now(),
    })
    return sendRedirect(event, '/admin')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/admin/login')
  },
})
