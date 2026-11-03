// Pages only for logged-out users, such as the login page
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();

  if (auth.isAuthenticated) {
    return navigateTo("/");
  }
});
