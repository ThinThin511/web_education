<template>
  <div v-if="authStore.user">
    <h2>Thông tin cá nhân</h2>
    <p><strong>Họ và tên:</strong> {{ authStore.user.fullname }}</p>
    <p><strong>Email:</strong> {{ authStore.user.email }}</p>
    <p><strong>Số điện thoại:</strong> {{ authStore.user.phone || "Chưa cập nhật" }}</p>
    <p><strong>Ngày sinh:</strong> {{ authStore.user.birthday || "Chưa cập nhật" }}</p>
    <img v-if="authStore.user.avatar" :src="authStore.user.avatar" alt="Avatar" width="100" />
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();
</script>
