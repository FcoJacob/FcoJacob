declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    avatar?: string
    provider: 'google' | 'linkedin'
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
