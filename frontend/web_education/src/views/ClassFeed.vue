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
        <div class="class-feed">
            <!-- Phần header với ảnh, tên lớp và mô tả -->
            <div class="class-header" :style="{ backgroundImage: `url(${classroom?.image || defaultImage})` }">
                <div class="class-info">
                    <h1>{{ classroom?.name }}</h1>
                    <p>{{ classroom?.description }}</p>
                </div>
            </div>

            <!-- Nội dung bảng tin -->
            <div class="feed-content">
              <h2>Bảng tin</h2>
              <div class="editor-container" :class="{ 'expanded': isExpanded }" @click="expandEditor">
                <editor
                  v-if="editorVisible"
                  v-model="postContent" 
                  api-key="agxk6am9f2ziuovlmqqo6ggnmg9khr0ie7gjarcqe723ib0d"
                  :init="editorConfig" 
                />
              </div>

              <div class="post-actions" v-if="isExpanded">
                <button class="btn-cancel" @click="cancelPost">Hủy</button>
                <button class="btn-post" @click="submitPost">Đăng</button>
              </div>
            </div>
            <!-- Danh sách bài viết -->
            <div class="post-list">
              <div v-for="post in posts" :key="post._id" class="post">
                <div class="post-header">
                  <img :src="post.authorId?.avatar || defaultAvatar" class="avatar" />
                  <div class="post-info">
                    <p class="author-name">{{ post.authorId?.fullname }}</p>
                    <p class="post-time">{{ new Date(post.createdAt).toLocaleString() }}</p>
                  </div>
                </div>
                <div class="post-content" v-html="post.content"></div>
              </div>
            </div>
        </div>
      </section>
    </main>
  </div>
</template>
<script setup>
import { ref, watch, onMounted,computed,nextTick } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import defaultAvatar from "@/assets/avatar.png";
import defaultImage from "@/assets/nen.jpg";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";
import EditClassPopup from "@/components/EditClassPopup.vue";
import Editor from "@tinymce/tinymce-vue";
const isExpanded = ref(false); 
const editorVisible = ref(true);
watch(isExpanded, (newVal) => {
  console.log("TinyMCE đang cập nhật:", newVal);
  console.log("Editor config trước:", editorConfig.value);

  nextTick(() => {
    editorConfig.value = {
      ...editorConfig.value,
      height: newVal ? 300 : 120,
    };
    console.log("Editor config sau:", editorConfig.value);
  });
});

const editorConfig = ref({
  menubar: false,
  height: 200, // Ban đầu nhỏ
  placeholder: "Đăng bài lên lớp..."
});

const expandEditor = () => {
  isExpanded.value = true;
};

const cancelPost = () => {
  postContent.value = "";
  isExpanded.value = false;
};

const postContent = ref("");



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
const posts = ref([]);

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
  fetchPosts();
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
const submitPost = async () => {
  if (!postContent.value.trim()) {
    toast.error("Nội dung không được để trống!");
    return;
  }

  try {
    await axios.post(`http://localhost:5000/api/posts`, {
      content: postContent.value,
      authorId: currentUser.value.id,
      classId:classId.value,
    });
    toast.success("Đã đăng bài!");
    postContent.value = ""; // Reset nội dung sau khi đăng
    fetchPosts();
  } catch (error) {
    toast.error("Lỗi khi đăng bài!");
    console.error("Lỗi khi đăng bài:", error);
  }
};
const fetchPosts = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/posts/${classId.value}`);
    posts.value = response.data;
  } catch (error) {
    console.error("Lỗi khi lấy bài viết:", error);
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


.class-feed {
  max-width: 800px; /* Giới hạn chiều rộng */
  margin: 0 auto;
  padding: 20px;
  align-items: center;
}

.class-header {
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  color: white;
  padding: 40px;
  border-radius: 10px;
  max-width: 100%;
  height: 250px;
  position: relative;
  
}

/* Để đảm bảo văn bản hiển thị rõ ràng, thêm lớp phủ */
.class-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4); /* Lớp tối nhẹ để dễ đọc chữ */
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
}

.class-info {
  position: absolute; /* Giữ cố định vị trí trong .class-header */
  bottom: 20px; /* Đưa xuống sát đáy */
  left: 20px; /* Đưa về bên trái */
  text-align: left; /* Căn lề trái */
  z-index: 2;
}


.class-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 20px;
  object-fit: cover;
}

.class-info h1 {
  font-size: 40px;
  margin: 0;
}

.class-info p {
  margin: 5px 0 0;
  font-size: 20px;
  opacity: 0.9;
}
.editor-container {
  width: 100%;
  min-height: 50px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: text;
  border: 1px solid #ddd;
  padding: 5px;
  border-radius: 5px;
  background-color: white;
}

.editor-container.expanded {
  min-height: 200px;
}

.post-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: right;
}

.btn-post {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-post:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.btn-cancel {
  background-color: #ffffff;
  color: blue;
  padding: 10px 15px;
  border: 1px solid blue;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-cancel:hover {
  background-color: rgba(0, 0, 255, 0.1);
  transform: scale(1.05);
}
.feed-content h2{
  margin: 30px 0;
}
.post {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.post-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: bold;
}

.post-time {
  font-size: 12px;
  color: gray;
}

.post-content {
  margin-top: 10px;
  line-height: 1.6;
}
</style>
