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
    
    <div class="notification-wrapper">
      <div class="notification-icon" @click="toggleNotificationDropdown">
        <i class="fa fa-bell"></i>
        <span v-if="hasUnread" class="notification-dot"></span>
      </div>

      <div v-if="dropdownOpen" class="notification-dropdown">
        <div v-if="notifications.length === 0" class="notification-empty">
          Không có thông báo
        </div>
        <div v-else>
          <div
            class="notification-item"
            v-for="noti in notifications"
            :key="noti._id"
            :class="{ unread: !noti.isRead }"
            @click="goToEvent(noti)"
          >
            <img :src="noti.type || defaultAvatar" class="avatar" />
            <div class="noti-content">
              <div class="sender-name">{{ noti?.name }}</div>
              <div class="message-text">{{ noti.message }}</div>
              <div class="noti-time">{{ formatTimeAgo(noti.createdAt) }}</div>
            </div>
          </div>
        </div>
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
import { ref,computed,onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import defaultAvatar from "@/assets/avatar.png";
import axios from 'axios';
import { defineProps } from 'vue';
defineEmits(["classCreated", "classJoined"]);

const authStore = useAuthStore();
const currentUser = ref(authStore.user);
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
//thông báo
// const props = defineProps({
//   userId: String
// });

const notifications = ref([]);
const dropdownOpen = ref(false);

const hasUnread = computed(() => {
  return notifications.value.some(n => !n.isRead);
});

const fetchNotifications = async () => {
  const res = await axios.get(`http://localhost:5000/api/notifications/${currentUser.value.id}`);
  notifications.value = res.data;
};

const toggleNotificationDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
  if (dropdownOpen.value) fetchNotifications();
};

const goToEvent = async (noti) => {
  if (!noti.isRead) {
    await axios.patch(`http://localhost:5000/api/notifications/${noti._id}/read`);
    noti.isRead = true;
  }
  router.push(noti.link);
};
const formatTimeAgo = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000); // seconds

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString();
};

onMounted(() => {
  fetchNotifications();
});


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
/* thông báo */
.notification-wrapper {
  position: relative;
  display: inline-block;
}

.notification-icon {
  cursor: pointer;
  position: relative;
  font-size: 24px;
}

.notification-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  height: 10px;
  width: 10px;
  background-color: red;
  border-radius: 50%;
  border: 2px solid white;
}

.notification-dropdown {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-item.unread {
  font-weight: bold;
  background-color: #f0f8ff;
}

.notification-empty {
  padding: 15px;
  text-align: center;
  color: #888;
}

.noti-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.sender-name {
  font-weight: bold;
  font-size: 15px;
  color: #000000;
}

.message-text {
  font-size: 14px;
  color: #858585;
}

.noti-time {
  font-size: 12px;
  color: #71b4ff;
}
</style>
