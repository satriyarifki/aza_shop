<script setup lang="ts">
import { z } from "zod";

definePageMeta({ layout: false, middleware: "guest" });

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required"),
});

const auth = useAuthStore();

const form = reactive({ email: "", password: "" });
const fieldErrors = ref<FieldErrors>({});
const formError = ref("");
const submitting = ref(false);

async function submit() {
  formError.value = "";

  const { data, errors } = validateForm(loginSchema, form);
  fieldErrors.value = errors ?? {};
  if (!data) {
    return;
  }

  submitting.value = true;
  try {
    await auth.login(data.email, data.password);
    await navigateTo("/");
  } catch (error) {
    if (error instanceof ApiError) {
      fieldErrors.value = toFieldErrors(error.fieldErrors);
      formError.value = error.message;
    } else {
      formError.value = "Something went wrong. Please try again.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
          S
        </div>
        <h1 class="text-xl font-semibold text-slate-900">Sign in to Shop Admin</h1>
        <p class="mt-1 text-sm text-slate-500">Manage products, customers and orders.</p>
      </div>

      <form class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" novalidate @submit.prevent="submit">
        <BaseAlert v-if="formError">{{ formError }}</BaseAlert>

        <BaseInput
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="admin@example.com"
          :error="fieldErrors.email"
        />
        <BaseInput
          v-model="form.password"
          label="Password"
          type="password"
          autocomplete="current-password"
          :error="fieldErrors.password"
        />

        <BaseButton type="submit" class="w-full" :loading="submitting">Sign in</BaseButton>
      </form>
    </div>
  </main>
</template>
