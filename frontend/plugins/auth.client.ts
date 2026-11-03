// Restores the saved session before the first route is resolved, so route middleware sees the right state
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  auth.restoreSession();

  if (!auth.token) {
    return;
  }

  try {
    await auth.fetchCurrentUser();
  } catch (error) {
    // A 401 has already cleared the session inside apiRequest; other errors (e.g. backend offline)
    // keep the token so the user is not logged out by a temporary outage
    console.warn("Could not load the current user:", error);
  }
});
