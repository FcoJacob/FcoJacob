export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value && to.path !== '/admin/login') {
    return navigateTo('/admin/login')
  }
})
