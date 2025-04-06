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
          </div>
          <div class="settings" v-if="isTeacher">
            <button @click="openSettings">
              <i class="fas fa-cog"></i> 
            </button>
            <EditClassPopup 
                v-if="isPopupOpen" 
                :isOpen="isPopupOpen" 
                :classData="selectedClass" 
                @close="isPopupOpen = false" 
                @classUpdated="fetchClassData"
            />
          </div>
        </div>
        <div v-if="isTeacher" class="create-btn-container">
          <button class="create-btn" @click="showCreatePopup = true">
            <i class="fas fa-plus"></i> Tạo
          </button>
        </div>

        <div class="assignments-list">
          <h2>Bài tập đã giao</h2>
          <div v-if="assignments.length === 0">Chưa có bài tập nào.</div>
          <div v-else class="assignment-card" v-for="assignment in assignments" :key="assignment._id">
            <div class="assignment-header">
              <h3>{{ assignment.title }}</h3>
              <small>Hạn nộp: {{ new Date(assignment.dueDate).toLocaleString() }}</small>
            </div>
            <p v-html="assignment.description"></p>
            <div class="assignment-meta">
              <span>Điểm tối đa: {{ assignment.maxScore }}</span>
              <span>Người giao: {{ assignment.teacherId.fullname }}</span>
            </div>
            <router-link :to="`/assignments/${assignment._id}`" class="view-detail">Xem chi tiết</router-link>
          </div>
        </div>

      </section>
    </main>
  </div>
  <!-- POPUP TẠO BÀI TẬP -->
<div v-if="showCreatePopup" class="popup-overlay">
  <div class="popup-content">
    <h3>Tạo bài tập</h3>
    <form @submit.prevent="createAssignment">
      <label>Tiêu đề</label>
      <input v-model="newAssignment.title" placeholder="Nhập tiêu đề bài tập" required />

      <label>Nội dung bài tập</label>
      <textarea v-model="newAssignment.description" placeholder="Nhập nội dung bài tập" rows="4"></textarea>

      <label>Hạn nộp</label>
      <input type="datetime-local" v-model="newAssignment.dueDate" required />

      <label>Điểm tối đa</label>
      <input type="number" v-model="newAssignment.maxScore" placeholder="VD: 10" required />

      <label>Tệp đính kèm</label>
      <input type="file" multiple @change="handleFiles" />

      <div style="margin-top: 10px;">
        <button type="submit" class="btn-submit">Tạo</button>
        <button type="button" @click="showCreatePopup = false" class="close-btn">Hủy</button>
      </div>
    </form>
  </div>
</div>


</template>
<script setup>
import { ref, watch, onMounted,computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import defaultAvatar from "@/assets/avatar.png";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";

import EditClassPopup from "@/components/EditClassPopup.vue";
const showCreatePopup = ref(false);
const isPopupOpen = ref(false);
const selectedClass = ref(null);

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

const fetchClassData = () => {
  // Load lại dữ liệu lớp học sau khi cập nhật
  fetchClassPeople();
};
const toast = useToast();

const authStore = useAuthStore();
const currentUser = ref(authStore.user); // Lưu thông tin người dùng hiện tại

const isTeacher = computed(() => {
  return teachers.value.some(teacher => teacher._id === currentUser.value.id);
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
});

const newAssignment = ref({
  title: "",
  description: "",
  dueDate: "",
  maxScore: "",
  files: [],
});

const handleFiles = (e) => {
  newAssignment.value.files = Array.from(e.target.files);
};

const createAssignment = async () => {
  try {
    const formData = new FormData();
    formData.append("title", newAssignment.value.title);
    formData.append("description", newAssignment.value.description);
    formData.append("dueDate", newAssignment.value.dueDate);
    formData.append("maxScore", newAssignment.value.maxScore);
    formData.append("classId", classId.value);
    formData.append("teacherId", currentUser.value.id);
    newAssignment.value.files.forEach((file) => {
      formData.append("attachments", file);
    });

    await axios.post("http://localhost:5000/api/assignments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Tạo bài tập thành công!");
    showCreatePopup.value = false;
    fetchAssignments(); // cập nhật lại danh sách
  } catch (err) {
    console.error("Lỗi khi tạo bài tập:", err);
    toast.error("Tạo bài tập thất bại!");
  }
};


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
const removeStudent = async (studentId) => {
  if (confirm("Bạn có chắc muốn xóa học sinh này?")) {
    try {
      const token = authStore.token;
      console.log("Token hiện tại:", token); // Kiểm tra token

      await axios.delete(`http://localhost:5000/api/classes/${classId.value}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      students.value = students.value.filter(student => student.id !== studentId);
      toast.success("Xóa học sinh thành công!");
      fetchClassPeople();
    } catch (error) {
      console.error("Lỗi khi xóa học sinh:", error);
    }
  }
};

const showInvitePopup = ref(false); // Trạng thái hiển thị popup
const showInviteTeacherPopup = ref(false);
const joinLink = ref(`http://localhost:5173/join/${classId.value}`); // Link tham gia
const teacherJoinLink = ref("");
const inviteTeacher = async () => {
  try {
    const token = authStore.token;
    const response = await axios.post(
      `http://localhost:5000/api/classes/${classId.value}/invite-teacher`,
      {}, // Không cần gửi dữ liệu trong body
      { headers: { Authorization: `Bearer ${token}` } } // Truyền token vào headers
    );

    teacherJoinLink.value = response.data.inviteLink; // Gán link nhận được từ API
    showInviteTeacherPopup.value = true;
  } catch (error) {
    console.error("Lỗi khi tạo link mời giáo viên:", error);
    toast.error("Không thể tạo link mời giáo viên");
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    toast.success("Đã sao chép vào clipboard!");
  }).catch(() => {
    toast.error("Lỗi khi sao chép!");
  });
};
const assignments = ref([]);

const fetchAssignments = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/assignments/class/${classId.value}`);
    assignments.value = res.data;
  } catch (err) {
    console.error("Lỗi khi lấy bài tập:", err);
  }
};

onMounted(() => {
  fetchAssignments(); // gọi khi trang được tải
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
.assignments-list {
  margin-top: 30px;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.assignment-card {
  background-color: #e8f0fe;
  border-radius: 12px;
  padding: 16px;
  
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin-top: 12px;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-header h3 {
  margin: 0;
  font-size: 18px;
}

.due-date {
  font-size: 14px;
  color: #555;
}

.score, .creator {
  font-size: 14px;
  margin-top: 4px;
  color: #555;
}

.detail-link {
  margin-top: 8px;
  display: inline-block;
  color: #1a73e8;
  text-decoration: underline;
}

.assignment-meta {
  margin-top: 10px;
  color: gray;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
}

.view-detail {
  margin-top: 10px;
  display: inline-block;
  color: blue;
  text-decoration: underline;
  font-weight: 500;
}
.create-btn-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  margin-top: 10px;
  margin-right: 10px;
}

.create-btn {
  background-color: #1a73e8;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.create-btn i {
  margin-right: 5px;
}

.popup-content form input,
.popup-content form textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.btn-submit {
  background-color: #28a745;
  border: none;
  color: white;
  padding: 8px 16px;
  margin-right: 10px;
  border-radius: 5px;
  cursor: pointer;
}
.popup-content label {
  display: block;
  font-weight: 600;
  margin-top: 10px;
  margin-bottom: 5px;
}

</style>
