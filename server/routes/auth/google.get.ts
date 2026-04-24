export default defineOAuthGoogleEventHandler({
  config: {
    emailRequired: true,
    scope: ['openid', 'email', 'profile'],
  },
  async onSuccess(event, { user }) {
    const allowedEmails = (process.env.NUXT_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    if (allowedEmails.length > 0 && !allowedEmails.includes(user.email?.toLowerCase())) {
      console.warn(`Unauthorized admin login attempt: ${user.email}`)
      return sendRedirect(event, '/admin/login?error=unauthorized')
    }
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
