<template>
  <div class="homepage">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Lớp học" />
        <span>Lớp học</span>
      </div>
      <nav class="menu">
        <button class="menu-item active"><i class="fas fa-home"></i> Trang chủ</button>
        <button class="menu-item"><i class="fas fa-calendar"></i> Lịch</button>
        <button class="menu-item"><i class="fas fa-folder"></i> Tài liệu</button>
        <button class="menu-item"><i class="fas fa-cog"></i> Cài đặt</button>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <header class="topbar">
        <div class="left">
          <!-- <button class="menu-toggle"><i class="fas fa-bars"></i></button> -->
          <h2>Lớp học</h2>
        </div>
        <div class="right">
  
  <!-- Avatar và Họ tên -->
            <div class="user-menu" @click="toggleDropdown">
                <<img :src="authStore.user?.avatar ||defaultAvatar " alt="Avatar" class="avatar" />
                <span>{{ authStore.user?.fullname || "Người dùng" }}</span>
            </div>

            <!-- Dropdown menu -->
            <div v-if="isDropdownOpen" class="dropdown-menu">
                <router-link to="/edituser">Thông tin người dùng</router-link>
                <router-link to="/editpassword">Đổi mật khẩu</router-link>
                <router-link to="/order">Đơn hàng</router-link>
                <button class="logout-btn" @click="handleLogout"> <i class="fa-solid fa-right-from-bracket"></i>Đăng xuất</button>
            </div>
        </div>

      </header>

      <section class="content">
        <div class="empty-state">
          <img src="@/assets/noclass.png" alt="No classes" />
          <p>Thêm một lớp học để bắt đầu</p>
          <div class="actions">
            <button class="btn btn-link">Tạo lớp học</button>
            <button class="btn btn-primary">Tham gia lớp học</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import defaultAvatar from "@/assets/avatar.png";

const authStore = useAuthStore();
const isDropdownOpen = ref(false);
import router from "../routers"; // Lấy router từ Vue Router

const handleLogout = () => {
  authStore.logout(); // Gọi hàm logout từ auth store
  router.push("/login"); // Điều hướng về trang đăng nhập
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};
</script>


<style scoped>
.homepage {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  background: #f8f9fa;
  padding: 20px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.menu {
  margin-top: 20px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.empty-state {
  text-align: center;
}

.empty-state img {
  width: 200px;
  margin-bottom: 10px;
}
.logo img {
  width: 60px;
  margin: 10px;
  border-radius: 40px;
  border: 1px solid rgb(117, 117, 117);
  
}

.actions {
  margin-top: 10px;
}

.actions .btn {
  margin: 5px;
}

.right {
  display: flex;
  align-items: center;
  position: relative;
}

/* Avatar và Họ tên */
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

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  overflow: hidden;
  width: 200px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.dropdown-menu a, .logout-btn {
  padding: 10px;
  text-decoration: none;
  color: black;
  text-align: left;
  display: block;
  background: white;
  border: none;
  width: 100%;
  cursor: pointer;
}

.dropdown-menu a:hover, .logout-btn:hover {
  background: #f1f1f1;
}
</style>
