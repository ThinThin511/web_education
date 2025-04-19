<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar @classCreated="fetchUserClasses" @classJoined="fetchUserClasses"/>
      <section class="content">
        <div class="quiz-list">
            <div class="header">
            <h1>Bài kiểm tra</h1>
            <button @click="showModal = true">+ Tạo bài kiểm tra</button>
            </div>

            <div class="quiz-grid">
            <div v-for="quiz in quizzes" :key="quiz._id" class="quiz-card">
                <div class="quiz-card-header">
                    <h2>{{ quiz.title }}</h2>

                    <div class="menu-container" @click="toggleMenu(quiz._id)">
                    ⋮
                    <div v-if="activeMenu === quiz._id" class="menu-dropdown">
                        <button @click="editQuiz(quiz)">✏️ Chỉnh sửa</button>
                        <button @click="deleteQuiz(quiz._id)">🗑️ Xóa</button>
                    </div>
                    </div>
                </div>
                <p>{{ quiz.description }}</p>
                <p>❓ Số câu hỏi: {{ quiz.questions?.length || 0 }}</p>
                <p>🕒 Thời gian làm bài: {{ quiz.duration }} phút</p>
                <p>📅 Ngày tạo: {{ formatDate(quiz.createdAt) }}</p>
            </div>
            </div>

            <CreateQuizModal
            v-if="showModal"
            :user-id="userId"
            :edit-data="editingQuiz"
            @close="handleCloseModal"
            @created="addQuiz"
            @updated="updateQuiz"
            />
            
        </div>
      </section>
    </main>

    <CreateClassPopup v-if="showPopup" @close="showPopup = false" @classCreated="handleClassCreated" />
    <JoinClassPopup v-if="showJoinClassPopup" @close="showJoinClassPopup = false "@classJoined="handleClassJoined" />
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
import CreateQuizModal from "@/components/CreateQuizModal.vue";
const showPopup = ref(false);

import JoinClassPopup from "@/components/JoinClassPopup.vue";
import { useToast } from "vue-toastification";
let showJoinClassPopup = ref(false);
const toast = useToast();

const authStore = useAuthStore();
const userClasses = ref([]); // Lưu danh sách lớp học của user
const userId = authStore.user?.id; // Thay bằng userId từ store hoặc localStorage
console.log(userId);
// Gọi API lấy danh sách lớp học
const fetchUserClasses = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/classes?userId=${userId}`);
    userClasses.value = response.data.studentClasses || []; 
  } catch (error) {
    console.error("Lỗi khi tải danh sách lớp học:", error);
  }
};
const quizzes = ref([]);
const showModal = ref(false);
const fetchQuizzes = async () => {
  const res = await axios.get(`http://localhost:5000/api/quizzes/by-creator/${userId}`);
  quizzes.value = res.data;
}

const addQuiz = (newQuiz) => {
  quizzes.value.push(newQuiz);
  toast.success("Tạo bài kiểm tra thành công!");
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString();
}
const activeMenu = ref(null);

const toggleMenu = (id) => {
  activeMenu.value = activeMenu.value === id ? null : id;
};

const editQuiz = (quiz) => {
  editingQuiz.value = { ...quiz }; // clone tránh ảnh hưởng gốc
  showModal.value = true;
};

const deleteQuiz = async (quizId) => {
  if (confirm("Bạn chắc chắn muốn xoá bài kiểm tra này?")) {
    try {
      await axios.delete(`http://localhost:5000/api/quizzes/${quizId}`);
      quizzes.value = quizzes.value.filter(q => q._id !== quizId);
      toast.success("Đã xoá bài kiểm tra!");
    } catch (err) {
      toast.error("Lỗi khi xoá!");
    }
  }
};
const editingQuiz = ref(null);
const handleCloseModal = () => {
  showModal.value = false;
  editingQuiz.value = null;
};

const updateQuiz = (updated) => {
  const idx = quizzes.value.findIndex(q => q._id === updated._id);
  if (idx !== -1) quizzes.value[idx] = updated;
  toast.success("Đã cập nhật bài kiểm tra!");
};
onMounted(() => {
  fetchQuizzes();
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
.quiz-list {
  padding: 32px;
  background: #f3f6fc;
  border-radius: 12px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.02);
  width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header h1 {
  font-size: 28px;
  font-weight: bold;
  color: #1e3a8a;
  margin: 0;
}

.header button {
  background-color: #3b82f6;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.header button:hover {
  background-color: #2563eb;
}

.quiz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  max-width: 100%;
  gap: 20px;
}

.quiz-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 5px solid #3b82f6;
  border-radius: 10px;
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.quiz-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}

.quiz-card h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e3a8a;
}

.quiz-card p {
  font-size: 14px;
  color: #374151;
  margin: 4px 0;
}
.quiz-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-container {
  position: relative;
  font-size: 20px;
  cursor: pointer;
  user-select: none;
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.menu-dropdown button {
  padding: 10px 12px;
  text-align: left;
  background: none;
  border: none;
  width: 100%;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-dropdown button:hover {
  background: #f3f4f6;
}
</style>
