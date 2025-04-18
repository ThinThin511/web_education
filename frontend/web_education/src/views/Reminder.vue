<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar @classCreated="fetchUserClasses" @classJoined="fetchUserClasses"/>
      <section class="content">
        <div class="reminder-page">
            <div class="header-top">
                <h2>Lời nhắc</h2>
                <select v-model="selectedClassId" class="class-select">
                    <option value="all">Tất cả các lớp học</option>
                    <option v-for="cls in userClasses" :key="cls._id" :value="cls._id">
                    {{ cls.name }}
                    </option>
                </select>
            </div>

            <template v-if="assignments.length">
            <!-- Hạn trong tuần -->
            <div v-if="thisWeek.length" class="section">
                <h3 class="section-title">
                <i class="fas fa-calendar-week"></i> Hạn trong tuần
                </h3>
                <div class="assignment-list">
                <div v-for="a in thisWeek" :key="a._id" class="assignment-card">
                    <div class="icon"><i class="fas fa-clipboard"></i></div>
                    <div class="info">
                        <div class="header">
                            <div class="title"><router-link :to="`/assignment/${a._id}`" class="view-detail">{{ a.title }}</router-link></div>
                            <div class="duedate">Đến hạn: {{ formatDate(a.dueDate) }}</div>
                        </div>
                        <div class="posted-date">{{ a.content}}</div>
                        <div class="class-name">Lớp: {{ a.classId.name }}</div>
                        <div class="posted-date">Đã đăng: {{ formatDate(a.createdAt) }}</div>
                    </div>
                </div>
                </div>
            </div>

            <!-- Hạn tháng này -->
            <div v-if="thisMonth.length" class="section">
                <h3 class="section-title">
                <i class="fas fa-calendar-alt"></i> Hạn tháng này
                </h3>
                <div class="assignment-list">
                <div v-for="a in thisMonth" :key="a._id" class="assignment-card">
                    <div class="icon"><i class="fas fa-clipboard"></i></div>
                    <div class="info">
                        <div class="header">
                            <div class="title"><router-link :to="`/assignment/${a._id}`" class="view-detail">{{ a.title }}</router-link></div>
                            <div class="duedate">Đến hạn: {{ formatDate(a.dueDate) }}</div>
                        </div>
                        <div class="posted-date">{{ a.content}}</div>
                        <div class="class-name">Lớp: {{ a.classId.name }}</div>
                        <div class="posted-date">Đã đăng: {{ formatDate(a.createdAt) }}</div>
                    </div>
                </div>
                </div>
            </div>

            <!-- Không có hạn -->
            <div v-if="noDueDate.length" class="section">
                <h3 class="section-title">
                <i class="fas fa-hourglass-half"></i>Không có hạn
                </h3>
                <div class="assignment-list">
                <div v-for="a in noDueDate" :key="a._id" class="assignment-card">
                    <div class="icon"><i class="fas fa-clipboard"></i></div>
                    <div class="info">
                        <div class="header">
                            <div class="title"><router-link :to="`/assignment/${a._id}`" class="view-detail">{{ a.title }}</router-link></div>
                            <div class="duedate">Đến hạn: {{ formatDate(a.dueDate) }}</div>
                        </div>
                        <div class="posted-date">{{ a.content}}</div>
                        <div class="class-name">Lớp: {{ a.classId.name }}</div>
                        <div class="posted-date">Đã đăng: {{ formatDate(a.createdAt) }}</div>
                    </div>
                </div>
                </div>
            </div>
            </template>

            <div v-else class="empty">Không có bài tập nào cần nhắc.</div>
        </div>
      </section>
    </main>

    <CreateClassPopup v-if="showPopup" @close="showPopup = false" @classCreated="handleClassCreated" />
    <JoinClassPopup v-if="showJoinClassPopup" @close="showJoinClassPopup = false "@classJoined="handleClassJoined" />
  </div>
</template>

<script setup>
import { ref, onMounted,watch,computed } from "vue";
import defaultAvatar from "@/assets/avatar.png";
import defaultImage from "@/assets/nen.jpg";
import axios from "axios";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import CreateClassPopup from "@/components/CreateClassPopup.vue"; // Gọi component popup
import { useAuthStore } from "@/stores/auth";
const showPopup = ref(false);

import JoinClassPopup from "@/components/JoinClassPopup.vue";
let showJoinClassPopup = ref(false);


const authStore = useAuthStore();
const userClasses = ref([]); // Lưu danh sách lớp học của user
const userId = authStore.user?.id; // Thay bằng userId từ store hoặc localStorage
const assignments = ref([]);
const selectedClassId = ref("all");
// Gọi API lấy danh sách lớp học
const fetchUserClasses = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/classes?userId=${userId}`);
    userClasses.value = response.data.studentClasses || []; 
  } catch (error) {
    console.error("Lỗi khi tải danh sách lớp học:", error);
  }
};

const fetchReminders = async () => {
  const { data } = await axios.get(`http://localhost:5000/api/assignments/reminders`, {
    params: {
      userId: userId,
      classId: selectedClassId.value
    }
  });
  assignments.value = data.assignments;
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function isSameWeek(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = (date - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

function isSameMonth(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth()
  );
}

const filteredAssignments = computed(() =>
  assignments.value.filter((a) =>
    selectedClassId.value === "all"
      ? true
      : a.classId._id === selectedClassId.value
  )
);

const thisWeek = computed(() =>
  filteredAssignments.value.filter((a) => a.dueDate && isSameWeek(a.dueDate))
);

const thisMonth = computed(() =>
  filteredAssignments.value.filter(
    (a) => a.dueDate && !isSameWeek(a.dueDate) && isSameMonth(a.dueDate)
  )
);

const noDueDate = computed(() =>
  filteredAssignments.value.filter((a) => !a.dueDate)
);
watch(selectedClassId, fetchReminders);


onMounted(() => {
  fetchUserClasses();
  fetchReminders();
});
const handleClassCreated = () => {
  console.log("✅ Nhận được sự kiện classCreated!");
  showPopup.value = false;
  fetchUserClasses(); // Load lại danh sách lớp
};
const handleClassJoined = () => {
  console.log("✅ Nhận được sự kiện classJoined!");
  showJoinClassPopup = false
  fetchUserClasses(); // Load lại danh sách lớp
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
   flex-direction: column;
  align-items: flex-start; /* Căn về phía trên */
  padding: 20px; /* Thêm khoảng cách cho đẹp */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
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
.custom-link {
  text-decoration: none; /* Xóa gạch chân */
  color: inherit; /* Kế thừa màu chữ từ thẻ cha */
  font-weight: bold; /* Đậm chữ */
}

.custom-link:hover {
  color: greenyellow; /* Đổi màu khi hover */
}
.reminder-page {
  padding: 24px;
  min-width: 60%;
  margin: 0 auto;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.class-select {
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assignment-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: rgb(198, 255, 191);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
}

.icon {
  background-color: #4285f4;
  color: white;
  padding: 12px;
  border-radius: 50%;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto 0;
}

.info {
  flex: 1;
}

.title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.class-name {
  color: #000000;
  font-weight: 500;
  font-size: 14px;
}

.posted-date {
  color: #6d6d6d;
  font-size: 13px;
  font-weight: 300;
}
.duedate {
  color: #505050;
  font-size: 13px;
}

.empty {
  text-align: center;
  color: #888;
  font-style: italic;
  margin-top: 50px;
}
.view-detail {
  text-decoration: none; /* Xóa gạch chân */
  color: inherit; /* Kế thừa màu chữ từ thẻ cha */
  font-weight: bold; /* Đậm chữ */
}
</style>
