<template>
  <div class="user-menu-container">
    <!-- Dropdown dấu cộng -->
    <div class="add-class-menu" @click="toggleAddClassDropdown">
      <i class="fa-solid fa-plus"></i>
      <div v-if="isAddClassDropdownOpen" class="dropdown-menu">
        <button  @click="showPopup = true">Tạo lớp học</button>
        <button @click="showJoinClassPopup = true">Tham gia lớp học</button>
      </div>
    </div>

    <!-- Dropdown người dùng -->
    <div class="user-menu" @click="toggleDropdown">
      <img :src="authStore.user?.avatar || defaultAvatar" alt="Avatar" class="avatar" />
      <span>{{ authStore.user?.fullname || "Người dùng" }}</span>

      <div v-if="isDropdownOpen" class="dropdown-menu1">
        <router-link to="/edituser">Chỉnh sửa thông tin</router-link>
        <router-link to="/changepassword">Đổi mật khẩu</router-link>

        <button class="logout-btn" @click="handleLogout">
          <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
        </button>
      </div>
    </div>
  </div>
  <CreateClassPopup v-if="showPopup" @close="showPopup = false" @classCreated="$emit('classCreated')" />
  <JoinClassPopup v-if="showJoinClassPopup" @close="showJoinClassPopup = false" @classJoined="$emit('classJoined')"/>
</template>


<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import defaultAvatar from "@/assets/avatar.png";

const authStore = useAuthStore();
const router = useRouter();

const isDropdownOpen = ref(false);
const isAddClassDropdownOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const toggleAddClassDropdown = () => {
  isAddClassDropdownOpen.value = !isAddClassDropdownOpen.value;
};

// Mở popup hoặc chuyển trang tạo lớp học
import CreateClassPopup from "@/components/CreateClassPopup.vue"; // Gọi component popup

const showPopup = ref(false);

// Mở popup hoặc chuyển trang tham gia lớp học
import JoinClassPopup from "@/components/JoinClassPopup.vue";
const showJoinClassPopup = ref(false);
</script>

<style scoped>
.user-menu-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Nút dấu cộng */
.add-class-menu {
  position: relative;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.add-class-menu:hover {
  background: #0056b3;
}

/* Dropdown dấu cộng */
.dropdown-menu {
  position: absolute;
  top: 50px;
  left: 0;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  width: 160px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.dropdown-menu button {
  padding: 10px;
  text-decoration: none;
  color: black;
  background: white;
  border: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.dropdown-menu button:hover {
  background: #f1f1f1;
}

/* Avatar và menu người dùng */
.user-menu {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.3s;
  position: relative;
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
.dropdown-menu1 {
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
.dropdown-menu1 a,
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
.dropdown-menu1 a:hover,
.logout-btn:hover {
  background: #f1f1f1;
}
</style>
