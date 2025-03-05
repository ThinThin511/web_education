<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <!-- Kiểm tra nếu có lớp học -->
        <div v-if="userClasses.length > 0" class="class-list">
          <div v-for="classItem in userClasses" :key="classItem._id" class="class-card">
  <div class="class-header" :style="{ backgroundImage: `url(${classItem.image || defaultImage})` }">
    <div class="overlay"></div>
    <h3>{{ classItem.name }}</h3>
    <p v-if="classItem.teachers.length > 0">
      Giáo viên: {{ classItem.teachers.map(teacher => teacher.fullname).join(", ") }}
    </p>
    <img v-if="classItem.teachers.length > 0" 
         :src="classItem.teachers[0].avatar || defaultAvatar" 
         class="teacher-avatar" />
  </div>
</div>

        </div>

        <!-- Nếu không có lớp học -->
        <div v-else class="empty-state">
          <img src="@/assets/noclass.png" alt="No classes" />
          <p>Thêm một lớp học để bắt đầu</p>
          <div class="actions">
            <button class="btn btn-link" @click="showPopup = true">Tạo lớp học</button>
            <button class="btn btn-primary" @click="showJoinClassPopup = true">Tham gia lớp học</button>
          </div>
        </div>
      </section>
    </main>

    <CreateClassPopup v-if="showPopup" @close="showPopup = false" />
    <JoinClassPopup v-if="showJoinClassPopup" @close="showJoinClassPopup = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import defaultAvatar from "@/assets/avatar.png";
import defaultImage from "@/assets/nen.jpg";
import axios from "axios";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import CreateClassPopup from "@/components/CreateClassPopup.vue"; // Gọi component popup
import { useAuthStore } from "@/stores/auth";
const showPopup = ref(false);

import JoinClassPopup from "@/components/JoinClassPopup.vue";
const showJoinClassPopup = ref(false);


const authStore = useAuthStore();
const userClasses = ref([]); // Lưu danh sách lớp học của user
const userId = authStore.user?.id; // Thay bằng userId từ store hoặc localStorage

// Gọi API lấy danh sách lớp học
const fetchUserClasses = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/classes?userId=${userId}`);
    userClasses.value = response.data.classes || []; 
  } catch (error) {
    console.error("Lỗi khi tải danh sách lớp học:", error);
  }
};

onMounted(() => {
  fetchUserClasses();
});
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
   flex-direction: column;
  align-items: flex-start; /* Căn về phía trên */
  padding: 20px; /* Thêm khoảng cách cho đẹp */
}

.empty-state {
  text-align: center;
}

.empty-state img {
  width: 200px;
  margin-bottom: 10px;
}
.class-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 30px;
  max-width: 100%; /* Đảm bảo lưới mở rộng toàn bộ */
}

.class-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: 0.3s;
  text-align: center;
}

.class-card:hover {
  transform: scale(1.05);
}

.class-header {
  padding: 15px;
  color: white;
  position: relative;
  background-size: cover;
  background-position: center;
  height: 240px; /* Chiều cao cho ô */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.class-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  position: absolute;
  bottom: -10px;
  right: 10px;
  border: 3px solid white;
}


.empty-state {
  text-align: center;
}
.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-left: 10px;
  border: 2px solid white;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3); /* Màu tối với độ trong suốt */
  z-index: 1;
  border-radius: 10px; /* Giống bo góc của class-card */
}

.class-header h3,
.class-header p,
.class-header img {
  position: relative;
  z-index: 2; /* Để nội dung hiển thị trên overlay */
}
</style>
