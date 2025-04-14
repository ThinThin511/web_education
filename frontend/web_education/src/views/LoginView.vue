<template>
  <div class="login-container d-flex justify-content-center align-items-center vh-100">
    <div class="card login-card shadow p-4">
      <div class="text-center mb-3">
        <img src="@/assets/logo.png" alt="Study Icon" class="study-icon mb-2" />
        <h2 class="login-title">Đăng Nhập Học Tập</h2>
        <p class="text-muted">Chào mừng bạn quay lại với nền tảng học tập!</p>
      </div>

      <div class="mb-3">
        <label for="email" class="form-label">📧 Email:</label>
        <input
          type="email"
          v-model="email"
          class="form-control"
          placeholder="Nhập email của bạn"
          required
        />
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">🔒 Mật khẩu:</label>
        <input
          type="password"
          v-model="password"
          class="form-control"
          placeholder="Nhập mật khẩu"
          required
        />
      </div>

      <button class="btn btn-study w-100 mt-2" @click="handleLogin">🚀 Đăng nhập</button>

      <p v-if="errorMessage" class="text-danger mt-3 text-center">{{ errorMessage }}</p>

      <p class="text-center mt-3">
        📚 Chưa có tài khoản?
        <router-link to="/register">Đăng ký ngay</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push("/");
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Đăng nhập thất bại!";
  }
};
</script>

<style scoped>
.login-container {
  background: linear-gradient(to right, #fef9f4, #eaf6ff);
}

.login-card {
  background-color: #ffffff;
  border-radius: 20px;
  max-width: 420px;
  width: 100%;
  padding: 2rem;
}

.login-title {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2b4f81;
}

.btn-study {
  background-color: #2b6cb0;
  color: #fff;
  font-weight: 600;
  transition: background-color 0.3s ease;
  border-radius: 10px;
}

.btn-study:hover {
  background-color: #1a4e80;
}

.study-icon {
  width: 60px;
  height: 60px;
}
</style>
