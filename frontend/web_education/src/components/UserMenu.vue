<template>
  <div class="user-menu" @click="toggleDropdown">
    <img :src="authStore.user?.avatar || defaultAvatar" alt="Avatar" class="avatar" />
    <span>{{ authStore.user?.fullname || "Người dùng" }}</span>

    <div v-if="isDropdownOpen" class="dropdown-menu">
      <router-link to="/edituser">Chỉnh sửa thông tin </router-link>
      <router-link to="/editpassword">Đổi mật khẩu</router-link>
      
      <button class="logout-btn" @click="handleLogout">
        <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import defaultAvatar from "@/assets/avatar.png";

const authStore = useAuthStore();
const isDropdownOpen = ref(false);
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.3s;
}
.user-menu:hover {
  background: #f1f1f1;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  border: 2px solid #ddd;
}
.dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  width: 200px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}
.dropdown-menu a,
.logout-btn {
  padding: 10px;
  text-decoration: none;
  color: black;
  display: block;
  background: white;
  border: none;
  width: 100%;
  cursor: pointer;
}
.dropdown-menu a:hover,
.logout-btn:hover {
  background: #f1f1f1;
}
</style>
