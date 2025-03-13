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
        <div class="class-people">
          <div class="class-title">
            <h2>Giáo viên</h2>
            <button v-if="isTeacher" @click="inviteTeacher" class="icon-btn">
              <i class="fas fa-user-plus"></i>
            </button>
          </div>
          <!-- Popup mời giáo viên -->
          <div v-if="showInviteTeacherPopup" class="popup-overlay">
            <div class="popup-content">
              <h3>Mời giáo viên vào lớp</h3>
              <h4>{{classroom?.name}}</h4>
              <div class="invite-section">
                <label>Link tham gia nhanh:</label>
                <div class="copy-container">
                  <span>{{ teacherJoinLink }}</span>
                  <button @click="copyToClipboard(teacherJoinLink)">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              <button @click="showInviteTeacherPopup = false" class="close-btn">Đóng</button>
            </div>
          </div>
          <div v-for="teacher in teachers" :key="teacher.id" class="person">
            <div class="person-left">
              <img :src="teacher.avatar || defaultAvatar" alt="Avatar" class="avatar" />
              <span><h5>{{ teacher.fullname }}</h5></span>
            </div>
            
          </div>
          <div class="class-title">
            <h2>Bạn học </h2>
            <div>
              <span class="student-count">{{ students.length }} thành viên</span>
              <button v-if="isTeacher" @click="showInvitePopup = true" class="icon-btn">
                <i class="fas fa-user-plus"></i>
              </button>
            </div>
            <!-- Popup mời học sinh -->
            <div v-if="showInvitePopup" class="popup-overlay">
              <div class="popup-content">
                <h3>Mời học sinh vào lớp</h3>
                <h4>{{classroom?.name}}</h4>
                <div class="invite-section">
                  <label>Mã tham gia:</label>
                  <div class="copy-container">
                    <span>{{ classroom?.classCode }}</span>
                    <button @click="copyToClipboard(classroom?.classCode)">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>

                <div class="invite-section">
                  <label>Link tham gia nhanh:</label>
                  <div class="copy-container">
                    <span>{{ joinLink }}</span>
                    <button @click="copyToClipboard(joinLink)">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>

                <button @click="showInvitePopup = false" class="close-btn">Đóng</button>
              </div>
            </div>
          </div>
          
          <div v-for="student in students" :key="student.id" class="person">
            <div class="person-left">
              <img :src="student.avatar || defaultAvatar" alt="Avatar" class="avatar" />
              <span><h5>{{ student.fullname }}</h5></span>
            </div>
            <button v-if="isTeacher" @click="removeStudent(student._id)" class="icon-btn-delete">
              <i class="fas fa-trash"></i>
            </button>

          </div>
        </div>
      </section>
    </main>
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

</style>
