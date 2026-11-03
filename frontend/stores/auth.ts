// Explicit imports (instead of Nuxt auto-imports) let this store run in plain Vitest
import { navigateTo } from "#app";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ApiSuccessResponse } from "~/types/api";
import type { LoginResponse, User } from "~/types/auth";
import { apiRequest } from "~/utils/api";

const TOKEN_STORAGE_KEY = "shop_admin_token";

// localStorage can throw (e.g. blocked storage), so treat that as "no saved session"
function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // The session still works for this tab; it just won't survive a reload
  }
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => token.value !== null);

  function restoreSession() {
    token.value = readStoredToken();
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    writeStoredToken(null);
  }

  async function login(email: string, password: string) {
    const response = await apiRequest<ApiSuccessResponse<LoginResponse>>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    token.value = response.data.access_token;
    user.value = response.data.user;
    writeStoredToken(response.data.access_token);
  }

  async function fetchCurrentUser() {
    const response = await apiRequest<ApiSuccessResponse<User>>("/auth/me");
    user.value = response.data;
  }

  async function logout() {
    clearSession();
    await navigateTo("/login");
  }

  return { token, user, isAuthenticated, restoreSession, clearSession, login, fetchCurrentUser, logout };
});
