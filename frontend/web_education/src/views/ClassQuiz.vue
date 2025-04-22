<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div class="class-navbar">
          <div class="nav-links">
            <router-link :to="`/class/${classId}/feed`" active-class="active">Bảng tin</router-link>
            <router-link :to="`/class/${classId}/assignments`" active-class="active">Bài tập trên lớp</router-link>
            <router-link :to="`/class/${classId}/people`" active-class="active">Mọi người</router-link>
            <router-link :to="`/class/${classId}/quiz`" active-class="active">Bài kiểm tra</router-link>
          </div>
          <div class="settings" v-if="isTeacher">
            <button @click="openSettings">
              <i class="fas fa-cog"></i> 
            </button>
            <EditClassPopup 
                v-if="isPopupOpen" 
                :isOpen="isPopupOpen" 
                :classData="selectedClass" 
                :is-author="isAuthor"
                @close="isPopupOpen = false" 
                @classUpdated="fetchClassData"
            />
          </div>
        </div>
        <div class="quiz-list">
            <div class="header">
                <h1>Bài kiểm tra</h1>
                <button @click="showModal = true" v-if="isTeacher">+ Giao bài kiểm tra</button>
            </div>

            <!-- Đang diễn ra -->
            <h4>🟢 Đang diễn ra</h4>
            <div v-if="ongoingQuizzes.length>0" class="quiz-grid">
              <div v-for="quiz in ongoingQuizzes" :key="quiz._id" class="quiz-card">
                <div class="quiz-card-header">
                    <h2>{{ quiz.quizId.title }}</h2>
                    <div class="menu-container" @click="toggleMenu(quiz._id)" v-if="isTeacher">
                    ⋮
                    <div v-if="activeMenu === quiz._id" class="menu-dropdown">
                        <button @click="editQuiz(quiz)">✏️ Chỉnh sửa</button>
                        <button @click="deleteQuiz(quiz._id)">🗑️ Xóa</button>
                    </div>
                    </div>
                </div>
                <p>{{ quiz.quizId.description }}</p>
                <p>📅 Bắt đầu: {{ formatDate(quiz.startTime) }}</p>
                <p>📅 Kết thúc: {{ formatDate(quiz.endTime) }}</p>
                
                <p>❓ Số câu hỏi: {{ quiz.quizId.questions?.length || 0 }}</p>
                <p>🕒 Thời gian làm bài: {{ quiz.quizId.duration }} phút</p>
                <p style="text-align: center; font-weight: bold;">Số lượt làm bài: {{ quiz?.maxAttempts  }}</p>
                <button @click="goToDoQuiz(quiz._id)" class="do-quiz-btn" v-if="!isTeacher">
                  🚀 Làm bài
                </button>
                <button @click="viewToDoQuiz(quiz._id)" class="view-quiz-btn" >
                  Xem kết quả
                </button>
              </div>
            </div>
            <div v-else>
              <p style="text-align: center;margin: 10px 0;">Không có bài kiểm tra nào đang diễn ra.</p>
            </div>
            <!-- Sắp diễn ra -->
            <h4>🕓 Sắp diễn ra</h4>
            <div v-if="upcomingQuizzes.length>0" class="quiz-grid">
                <div v-for="quiz in upcomingQuizzes" :key="quiz._id" class="quiz-card">
                <!-- tương tự nội dung ở trên -->
                <div class="quiz-card-header">
                    <h2>{{ quiz.quizId.title }}</h2>
                    <div class="menu-container" @click="toggleMenu(quiz._id)">
                    ⋮
                    <div v-if="activeMenu === quiz._id" class="menu-dropdown">
                        <button @click="editQuiz(quiz)">✏️ Chỉnh sửa</button>
                        <button @click="deleteQuiz(quiz._id)">🗑️ Xóa</button>
                    </div>
                    </div>
                </div>
                <p>{{ quiz.quizId.description }}</p>
                <p>📅 Bắt đầu: {{ formatDate(quiz.startTime) }}</p>
                <p>📅 Kết thúc: {{ formatDate(quiz.endTime) }}</p>
                <p>❓ Số câu hỏi: {{ quiz.quizId.questions?.length || 0 }}</p>
                <p>🕒 Thời gian làm bài: {{ quiz.quizId.duration }} phút</p>
                </div>
            </div>
            <div v-else>
              <p style="text-align: center;margin: 10px 0;">Không có bài kiểm tra nào sắp diễn ra.</p>
            </div>
            <!-- Đã kết thúc -->
            <h4>⚪ Đã kết thúc</h4>
            <div v-if="pastQuizzes.length>0" class="quiz-grid">
                <div v-for="quiz in pastQuizzes" :key="quiz._id" class="quiz-card">
                <!-- tương tự nội dung ở trên -->
                <div class="quiz-card-header">
                    <h2>{{ quiz.quizId.title }}</h2>
                    <div class="menu-container" @click="toggleMenu(quiz._id)">
                    ⋮
                    <div v-if="activeMenu === quiz._id" class="menu-dropdown">
                        <button @click="editQuiz(quiz)">✏️ Chỉnh sửa</button>
                        <button @click="deleteQuiz(quiz._id)">🗑️ Xóa</button>
                    </div>
                    </div>
                </div>
                <p>{{ quiz.quizId.description }}</p>
                <p>📅 Bắt đầu: {{ formatDate(quiz.startTime) }}</p>
                <p>📅 Kết thúc: {{ formatDate(quiz.endTime) }}</p>
                <p>❓ Số câu hỏi: {{ quiz.quizId.questions?.length || 0 }}</p>
                <p>🕒 Thời gian làm bài: {{ quiz.quizId.duration }} phút</p>
                <button @click="viewToDoQuiz(quiz._id)" class="view-quiz-btn" >
                  Xem kết quả
                </button>
                </div>
            </div>
            <div v-else>
              <p style="text-align: center;margin: 10px 0;">Không có bài kiểm tra hết hạn.</p>
            </div>
            <!-- Modal -->
            <AssignQuizModal
                v-if="showModal"
                :available-quizzes="quizzes"
                :class-id="classId"
                :editing-quiz="editingQuiz"
                @close="handleCloseModal"
                @assigned="handleQuizUpdated"
            />
            
        </div>
      </section>
    </main>
  </div>
  <div v-if="showWarning" class="popup-overlay">
  <div class="popup-content">
    <h3>📢 Lưu ý trước khi làm bài</h3>
    <p>🔒 Trong quá trình làm bài, bạn <strong>không được chuyển tab</strong>.</p>
    <p>⛔ Nếu vi phạm quá <strong>3 lần</strong>, hệ thống sẽ tự động <strong>nộp bài</strong>.</p>
    <p>⏱️ Thời gian làm bài sẽ được <strong>tính từ lúc bạn bấm bắt đầu</strong>.</p>
    <div style="margin-top: 20px;">
      <button @click="confirmStartQuiz" class="do-quiz-btn">✅ Tôi đã hiểu, bắt đầu</button>
      <button @click="cancelStartQuiz" class="view-quiz-btn" ><i class="fa-solid fa-x"></i> Huỷ</button>
    </div>
  </div>
</div>
</template>
<script setup>
import { ref, watch, onMounted,computed } from "vue";
import { useRoute,useRouter } from "vue-router";
import axios from "axios";
import defaultAvatar from "@/assets/avatar.png";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";
import EditClassPopup from "@/components/EditClassPopup.vue";
import AssignQuizModal from "@/components/AssignQuizModal.vue";
const router = useRouter();
const isPopupOpen = ref(false);
const selectedClass = ref(null);
const authStore = useAuthStore();
const userId = authStore.user?.id;
const showWarning = ref(false);
const pendingQuizId = ref(null);
const openSettings = () => {
  if (classroom.value) {
    selectedClass.value = {
      _id: classroom.value._id,
      name: classroom.value.name,
      description: classroom.value.description,
      classCode: classroom.value.classCode,
      image: classroom.value.image || "",
    };
    isPopupOpen.value = true;
  } else {
    console.error("Lớp học chưa được tải xong!");
  }
};
const quizzes = ref([]);

const fetchQuizzes = async () => {
  const res = await axios.get(`http://localhost:5000/api/quizzes/by-creator/${userId}`);
  quizzes.value = res.data;
}
const now = new Date();

const ongoingQuizzes = computed(() =>
  classQuizzes.value.filter(q => new Date(q.startTime) <= now && new Date(q.endTime) >= now)
);

const upcomingQuizzes = computed(() =>
  classQuizzes.value.filter(q => new Date(q.startTime) > now)
);

const pastQuizzes = computed(() =>
  classQuizzes.value.filter(q => new Date(q.endTime) < now)
);
const classQuizzes=ref([]);
const fetchClassQuizzes = async () => {
  const res = await axios.get(`http://localhost:5000/api/quizzes/assigned/${classId.value}`);
  classQuizzes.value = res.data;
}
const fetchClassData = () => {
  // Load lại dữ liệu lớp học sau khi cập nhật
  fetchClassPeople();
  fetchQuizzes();
  fetchClassQuizzes();
};

const toast = useToast();
const showModal = ref(false);
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    
  });
};
const activeMenu = ref(null);

const toggleMenu = (id) => {
  activeMenu.value = activeMenu.value === id ? null : id;
};
const editingQuiz = ref(null);
const handleCloseModal = () => {
  showModal.value = false;
  editingQuiz.value = null;
};
const editQuiz = (quiz) => {
  editingQuiz.value = { ...quiz }; // clone tránh ảnh hưởng gốc
  showModal.value = true;
};
const handleQuizUpdated = () => {
  fetchClassQuizzes();
  handleCloseModal();
};
const deleteQuiz = async (assignmentId) => {
  if (confirm("Bạn có chắc muốn xóa bài kiểm tra này?")) {
    try {
      await axios.delete(`http://localhost:5000/api/quizzes/assign/${assignmentId}`);
      toast.success("Đã xóa bài kiểm tra.");
      fetchClassQuizzes(); // cập nhật lại danh sách
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa bài kiểm tra.");
    }
  }
};

const goToDoQuiz = (assignmentId) => {
  if (!assignmentId) {
    console.error('quizAssignmentId bị undefined!');
    return;
  }
  pendingQuizId.value = assignmentId;
  showWarning.value = true;
};
const confirmStartQuiz = () => {
  if (pendingQuizId.value) {
    router.push(`/examinate/${pendingQuizId.value}`);
    showWarning.value = false;
    pendingQuizId.value = null;
  }
};
const cancelStartQuiz = () => {
  showWarning.value = false;
  pendingQuizId.value = null;
};
const viewToDoQuiz = (assignmentId) => {
  console.log(assignmentId)
  if (!assignmentId) {
    console.error('quizAssignmentId bị undefined!');
    return;
  }
  router.push(`/examination/${assignmentId}`);
};
const currentUser = ref(authStore.user); // Lưu thông tin người dùng hiện tại

const isTeacher = computed(() => {
  return teachers.value.some(teacher => teacher._id === currentUser.value.id);
});
const isAuthor = computed(() => {
  return teachers.value[0]?._id === currentUser.value.id;
});
const route = useRoute();
const teachers = ref([]);
const students = ref([]);
const classroom = ref(null);
const classId = ref(localStorage.getItem("classId") || route.params.id);

// Theo dõi sự thay đổi của route.params.id để cập nhật localStorage
watch(() => route.params.id, (newId) => {
  if (newId) {
    localStorage.setItem("classId", newId);
    classId.value = newId;
  }
}, { immediate: true });

onMounted(() => {
  localStorage.setItem("classId", classId.value);
  fetchClassPeople();
  fetchQuizzes();
  fetchClassQuizzes();
});

const fetchClassPeople = async () => {
  try {
    
    const response = await axios.get(`http://localhost:5000/api/classes/${classId.value}/people`);
    teachers.value = response.data.teachers;
    students.value = response.data.students;
    classroom.value = response.data.classroom;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thành viên:", error);
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
  padding: 20px;
}

/* Navbar */
.class-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white; /* Đảm bảo có nền */
  padding: 15px 20px;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
}

.class-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white; /* Đảm bảo có nền */
  
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  margin-top: 20px;
  margin-bottom: 30px;
}

/* Link điều hướng */
.nav-links {
  display: flex;
  gap: 30px;
}

.nav-links a {
  text-decoration: none;
  color: black;
  font-size: 16px;
  padding-bottom: 5px;
  position: relative;
}

.nav-links a.active {
  color: blue;
  font-weight: bold;
}

.nav-links a.active::after {
  content: "";
  display: block;
  width: 100%;
  height: 3px;
  background: blue;
  position: absolute;
  bottom: -3px;
  left: 0;
}

/* Nút cài đặt */
.settings {
  display: flex;
  align-items: center;
}

.settings button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

/* Danh sách giáo viên & học sinh */
.class-people {
  max-width: 800px;
  margin: 50px auto 0; /* Để không bị che khuất bởi navbar */
}

.person {
  display: flex;
  align-items: center;
  padding: 10px 0;
  justify-content: space-between;
}
.person-left {
  display: flex;
  align-items: center;
  padding: 10px 0;
  
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 30px;
}

.student-count {
  font-size: 14px;
  color: gray;
}
.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: rgb(0, 0, 0);
  margin-left: 10px;
}

.icon-btn:hover {
  color: green;
}
.icon-btn-delete {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: red;
  margin-left: 10px;
}

.icon-btn-delete:hover {
  color: darkred;
}

/* Overlay nền mờ */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Nội dung popup */
.popup-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  width: 400px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

/* Phần hiển thị mã & link */
.invite-section {
  margin: 15px 0;
}

.copy-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f8f8;
  padding: 5px 10px;
  border-radius: 5px;
}

.copy-container span {
  flex: 1;
  text-align: left;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
}

.copy-container button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #007bff;
}

.copy-container button:hover {
  color: #0056b3;
}

/* Nút đóng popup */
.close-btn {
  margin-top: 10px;
  padding: 8px 15px;
  background: red;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.close-btn:hover {
  background: darkred;
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 30px;
  max-width: 100%;
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
.do-quiz-btn {
  display: block;
  margin: 16px auto 0;
  background-color: #10b981;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;
  
}
.view-quiz-btn {
  display: block;
  margin: 16px auto 0;
  background-color: #ff0000;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;
  
}
.do-quiz-btn:hover {
  background-color: #059669;
}
</style>
