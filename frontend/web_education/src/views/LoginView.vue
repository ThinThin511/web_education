<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card p-4 shadow-lg" style="width: 400px">
      <h2 class="text-center mb-4">Đăng Nhập</h2>

      <div class="mb-3">
        <label for="email" class="form-label">Email:</label>
        <input type="email" v-model="email" class="form-control" placeholder="Nhập email" required />
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">Mật khẩu:</label>
        <input type="password" v-model="password" class="form-control" placeholder="Nhập mật khẩu" required />
      </div>

      <button class="btn btn-primary w-100" @click="handleLogin">Đăng nhập</button>

      <p v-if="errorMessage" class="text-danger mt-3 text-center">{{ errorMessage }}</p>
      <p class="text-center mt-3">
        Chưa có tài khoản? <router-link to="/register">Đăng ký</router-link>
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
    console.log("Đăng nhập thành công:", authStore.token);
    router.push("/");
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error.response?.data?.message || error.message);
    errorMessage.value = error.response?.data?.message || "Đăng nhập thất bại!";
  }
};
</script>

<style scoped>
.card {
  max-width: 400px;
  width: 100%;
}
</style>
