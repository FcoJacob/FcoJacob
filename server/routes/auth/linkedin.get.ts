export default defineOAuthLinkedInEventHandler({
  config: {
    scope: ['openid', 'profile', 'email'],
  },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        id: user.sub,
        name: user.name,
        email: user.email,
        avatar: user.picture,
        provider: 'linkedin',
      },
      loggedInAt: Date.now(),
    })
    return sendRedirect(event, '/admin')
  },
  onError(event, error) {
    console.error('LinkedIn OAuth error:', error)
    return sendRedirect(event, '/admin/login')
  },
})
