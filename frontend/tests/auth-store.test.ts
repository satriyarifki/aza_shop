import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { navigateTo } from "#app";
import { useAuthStore } from "~/stores/auth";
import { ApiError, apiRequest } from "~/utils/api";

vi.mock("~/utils/api", () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const TOKEN_KEY = "shop_admin_token";
const admin = {
  id: 1,
  name: "Administrator",
  email: "admin@example.com",
  role: "ADMIN" as const,
  created_at: "2026-11-03T00:00:00.000Z",
  updated_at: "2026-11-03T00:00:00.000Z",
};

// Node has no localStorage, so give each test a fresh in-memory one
function installLocalStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  installLocalStorage();
  vi.mocked(apiRequest).mockReset();
  vi.mocked(navigateTo).mockReset();
});

describe("auth store", () => {
  it("starts logged out", () => {
    const auth = useAuthStore();

    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
  });

  it("stores the token and user after a successful login", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      success: true,
      message: "Login successful",
      data: { access_token: "jwt-token", token_type: "Bearer", user: admin },
    });
    const auth = useAuthStore();

    await auth.login("admin@example.com", "admin123");

    expect(apiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "admin123" },
    });
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.user).toEqual(admin);
    expect(localStorage.getItem(TOKEN_KEY)).toBe("jwt-token");
  });

  it("stays logged out when login fails", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError(401, "Invalid email or password"));
    const auth = useAuthStore();

    await expect(auth.login("admin@example.com", "wrong")).rejects.toThrow("Invalid email or password");
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("restores a saved token, but never a password", () => {
    localStorage.setItem(TOKEN_KEY, "saved-token");
    const auth = useAuthStore();

    auth.restoreSession();

    expect(auth.token).toBe("saved-token");
    expect(auth.isAuthenticated).toBe(true);
  });

  it("clears everything and returns to the login page on logout", async () => {
    localStorage.setItem(TOKEN_KEY, "saved-token");
    const auth = useAuthStore();
    auth.restoreSession();

    await auth.logout();

    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(navigateTo).toHaveBeenCalledWith("/login");
  });
});
