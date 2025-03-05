<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div class="change-password-card">
          <h2>Đổi mật khẩu</h2>
          <form @submit.prevent="changePassword">
            <div class="mb-3">
              <label class="form-label">Mật khẩu hiện tại</label>
              <input v-model="oldPassword" type="password" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Mật khẩu mới</label>
              <input v-model="newPassword" type="password" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Xác nhận mật khẩu mới</label>
              <input v-model="confirmPassword" type="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Lưu thay đổi</button>
          </form>
          <p v-if="errorMessage" class="text-danger mt-2">{{ errorMessage }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const oldPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Mật khẩu xác nhận không khớp!";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: authStore.user?.id,
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
      }),
    });

    if (response.ok) {
      alert("Đổi mật khẩu thành công!");
      oldPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
      errorMessage.value = "";
    } else {
      const data = await response.json();
      errorMessage.value = data.message || "Đổi mật khẩu thất bại!";
    }
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    errorMessage.value = "Lỗi hệ thống!";
  }
};
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.change-password-card {
  width: 400px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.9);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}
</style>
