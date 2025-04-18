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
                :is-author="isAuthor" 
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
          <h2>Bài tập đang diễn ra</h2>
          <div v-if="upcomingAssignments.length === 0">Chưa có bài tập nào đang diễn ra.</div>
          <div v-else class="assignment-card upcoming-assignment" v-for="assignment in upcomingAssignments" :key="assignment._id">
            <!-- Hiển thị bài tập đang diễn ra -->
            <div class="assignment-header">
              <h3>{{ assignment.title }}</h3>
              <small>Hạn nộp: {{ new Date(assignment.dueDate).toLocaleString() }}</small>
              <div class="add-class-menu" v-if="isTeacher" @click="toggleDropdown(assignment._id)">
                <i class="fas fa-ellipsis-v"></i>
                <div v-if="isDropdownOpen === assignment._id" class="dropdown-menu">
                  <button @click="openEditPopup(assignment)">Chỉnh sửa bài tập</button>
                  <EditAssignmentPopup
                      v-if="isEditPopupOpen && selectedAssignment"
                      :isOpen="isEditPopupOpen"
                      :assignment="selectedAssignment"
                      @close="() => { isEditPopupOpen = false; console.log('Popup đóng'); }"
                      @updated="fetchAssignments"
                    />
                  <button @click="deleteAssignment(assignment._id)">Xóa bài tập</button>
                </div>
              </div>
            </div>
            <p v-html="assignment.content"></p>
            <div class="assignment-meta">
              <span>Điểm tối đa: {{ assignment.maxScore }}</span>
              <span>Người giao: {{ assignment.teacherId.fullname }}</span>
            </div>
            <router-link :to="`/assignment/${assignment._id}`" class="view-detail">Xem chi tiết</router-link>
          </div>

          <h2>Bài tập đã hết hạn</h2>
          <div v-if="pastAssignments.length === 0">Chưa có bài tập nào đã hết hạn.</div>
          <div v-else class="assignment-card past-assignment" v-for="assignment in pastAssignments" :key="assignment._id">
            <!-- Hiển thị bài tập đã hết hạn -->
            <div class="assignment-header">
              <h3>{{ assignment.title }}</h3>
              <small>Hạn nộp: {{ new Date(assignment.dueDate).toLocaleString() }}</small>
              <div class="add-class-menu" v-if="isTeacher" @click="toggleDropdown(assignment._id)">
                <i class="fas fa-ellipsis-v"></i>
                <div v-if="isDropdownOpen === assignment._id" class="dropdown-menu">
                  <button @click="openEditPopup(assignment)">Chỉnh sửa bài tập</button>
                  <EditAssignmentPopup
                      v-if="isEditPopupOpen && selectedAssignment"
                      :isOpen="isEditPopupOpen"
                      :assignment="selectedAssignment"
                      @close="() => { isEditPopupOpen = false; console.log('Popup đóng'); }"
                      @updated="fetchAssignments"
                    />
                  <button @click="deleteAssignment(assignment._id)">Xóa bài tập</button>
                </div>
              </div>
            </div>
            <p v-html="assignment.content"></p>
            <div class="assignment-meta">
              <span>Điểm tối đa: {{ assignment.maxScore }}</span>
              <span>Người giao: {{ assignment.teacherId.fullname }}</span>
            </div>
            <router-link :to="`/assignment/${assignment._id}`" class="view-detail">Xem chi tiết</router-link>
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
      <textarea v-model="newAssignment.content" placeholder="Nhập nội dung bài tập" rows="2"></textarea>

      <label>Hạn nộp</label>
      <input type="datetime-local" v-model="newAssignment.dueDate" required />

      <label>Điểm tối đa</label>
      <input type="number" v-model="newAssignment.maxScore" placeholder="VD: 10" required />

      <label>Tệp đính kèm</label>
      <div class="file-upload">
        <input type="file" multiple @change="handleFileUpload" hidden ref="fileInput" />
        <button @click.prevent="triggerFileInput">Chọn tệp</button>

        <div v-if="selectedFiles.length" class="file-list">
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <img v-if="isImage(file)" :src="getFileURL(file)" class="file-thumbnail" />
            <img v-else :src="getFileIcon(file)" class="file-thumbnail" />
            <span>{{ getFileName(file) }}</span>
            <button @click.prevent="removeFile(index)" class="remove-file">×</button>
          </div>
        </div>
      </div>


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
import EditAssignmentPopup from "@/components/EditAssignmentPopup.vue";

import EditClassPopup from "@/components/EditClassPopup.vue";
const showCreatePopup = ref(false);
const isPopupOpen = ref(false);
const selectedClass = ref(null);
const selectedAssignment = ref(null);
const isEditPopupOpen = ref(false);
const openEditPopup = (assignment) => {
  selectedAssignment.value = assignment;
  isEditPopupOpen.value = true;
  console.log("isEditPopupOpen:", isEditPopupOpen.value); // Kiểm tra trạng thái
  fetchAssignments();
};
import defaulticon from "@/assets/default-icon.png";
import pdf from "@/assets/pdf-icon.png";
import excel from "@/assets/excel-icon.png";
import word from "@/assets/word-icon.png";

const selectedFiles = ref([]);
const fileInput = ref(null);

const triggerFileInput = () => fileInput.value.click();

const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);
  selectedFiles.value.push(...files);
};

const removeFile = (index) => selectedFiles.value.splice(index, 1);

const isImage = (file) => {
  const name = typeof file === 'string' ? file : file.name;
  return /\.(jpeg|jpg|png|gif)$/i.test(name);
};

const getFileIcon = (file) => {
  const name = typeof file === 'string' ? file : file.name;
  if (name.endsWith(".pdf")) return pdf;
  if (name.endsWith(".doc") || name.endsWith(".docx")) return word;
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return excel;
  return defaulticon;
};

const getFileName = (file) => {
  return typeof file === "string" ? file.split("/").pop() : file.name;
};

const getFileURL = (file) => {
  return typeof file === "string" ? file : URL.createObjectURL(file);
};
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
});

const newAssignment = ref({
  title: "",
  content: "",
  dueDate: "",
  maxScore: "",
  files: [],
});

const previewFiles = ref([]);

const handleFiles = (e) => {
  const files = Array.from(e.target.files);
  newAssignment.value.files = files;

  // Tạo preview nếu là ảnh
  previewFiles.value = files
    .filter(file => file.type.startsWith("image/"))
    .map(file => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));
};

const createAssignment = async () => {
  try {
    const formData = new FormData();
    formData.append("title", newAssignment.value.title);
    formData.append("content", newAssignment.value.content);
    formData.append("dueDate", newAssignment.value.dueDate);
    formData.append("maxScore", newAssignment.value.maxScore);
    formData.append("classId", classId.value);
    formData.append("teacherId", currentUser.value.id);
    selectedFiles.value.forEach((file) => {
      formData.append("attachments", file);
    });

    await axios.post("http://localhost:5000/api/assignments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Tạo bài tập thành công!");
    newAssignment.value = {
      title: "",
      content: "",
      dueDate: "",
      maxScore: "",
      files: [],
    };
    selectedFiles.value = []; // reset file
    document.querySelector('input[type="file"]').value = null;
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
const upcomingAssignments = computed(() => {
  const now = new Date();
  return assignments.value.filter(assignment => new Date(assignment.dueDate) >= now);
});

const pastAssignments = computed(() => {
  const now = new Date();
  return assignments.value.filter(assignment => new Date(assignment.dueDate) < now);
});


const fetchAssignments = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/assignments/class/${classId.value}`);
    assignments.value = res.data;
  } catch (err) {
    console.error("Lỗi khi lấy bài tập:", err);
  }
};

const isDropdownOpen = ref(false);

const toggleDropdown = (assignmentId) => {
  isDropdownOpen.value = isDropdownOpen.value === assignmentId ? null : assignmentId;
};

const editAssignment = (assignment) => {
  // TODO: mở popup chỉnh sửa
  console.log("Chỉnh sửa bài tập:", assignment);
  toast.info("Chức năng chỉnh sửa đang được phát triển...");
};

const deleteAssignment = async (assignmentId) => {
  if (confirm("Bạn có chắc chắn muốn xóa bài tập này?")) {
    try {
      await axios.delete(`http://localhost:5000/api/assignments/${assignmentId}`);
      toast.success("Đã xóa bài tập!");
      fetchAssignments(); // cập nhật danh sách sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa bài tập:", error);
      toast.error("Xóa bài tập thất bại!");
    }
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
.upcoming-assignment {
  background-color: #e0ffe0 ; /* Màu nền nhẹ nhàng, xanh lá cây */
  border: 1px solid #0013e1;
}

.past-assignment {
  background-color: #f8d7da !important; /* Màu nền nhạt, đỏ */
  border: 1px solid #dc3545;
}

.assignment-card {
  
  margin-bottom: 15px;
  
  transition: background-color 0.3s ease-in-out;
}

.assignment-card:hover {
  transform: scale(1.02);
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
.uploaded-files ul {
  list-style: none;
  padding: 0;
  margin-top: 10px;
}

.uploaded-files li {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f1f5f9;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 5px;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: red;
  font-size: 14px;
}
.file-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f1f1;
  padding: 8px;
  border-radius: 5px;
  margin: 5px;
}
.file-thumbnail {
  width: 30px;
  height: 30px;
  object-fit: cover;
}
.remove-file {
  background: red !important;
  color: white;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
}
.attachment-image {
  width: 100px;
  height: auto;
  border-radius: 5px;
  margin-right: 10px;
}

.attachment-icon {
  width: 50px;
  height: auto;
  margin-right: 5px;
  margin-top: 5PX;
}
.file-upload button {
  background-color: #77ff22;
  color: white;
  font-weight: bold;
  font-size: 16px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.file-upload button:hover {
  background-color: #6aff00;
  transform: scale(1.05);
}
.add-class-menu {
  position: relative;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;

 
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.add-class-menu:hover {
  background: #a6a6a6;
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


</style>
