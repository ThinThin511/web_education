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
            <div class="feed-content" style="margin-top: 20px;" v-if="isTeacher">
              
              <div class="editor-container" :class="{ 'expanded': isExpanded }" @click="expandEditor">
                <QuillEditor 
                  v-if="editorVisible"
                  v-model:content="postContent" 
                  contentType="html"
                  theme="snow"
                  :options="editorConfig"
                  class="custom-quill"
                />
              </div>
              <div class="file-upload" v-if="isExpanded">
                <input
                  type="file"
                  multiple
                  @change="handleFileUpload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  hidden
                  ref="fileInput"
                />
                <button @click="triggerFileInput">Chọn tệp</button>

                <div v-if="attachedFiles.length" class="file-list">
                  <div v-for="(file, index) in attachedFiles" :key="index" class="file-item">
                    <img v-if="file.preview" :src="file.preview" class="file-thumbnail" />
                    <img v-else :src="getFileIcon(file)" class="file-thumbnail" />
                    <span>{{ file.name }}</span>
                    <button @click="removeFile(index)" class="remove-file">×</button>
                  </div>
                </div>
              </div>

              <div class="post-actions" v-if="isExpanded">
                <button class="btn-cancel" @click="cancelPost">Hủy</button>
                <button class="btn-post" @click="submitPost">Đăng</button>
              </div>
            </div>
            <!-- Danh sách bài viết -->
             <h2 style="margin: 20px 0;">Bảng tin</h2>
            <div class="post-list">
              <div v-for="post in posts" :key="post._id" class="post">
                
                <div class="post-header">
                  <div class="post-header-left">
                    <img :src="post.authorId?.avatar || defaultAvatar" class="avatar" />
                    <div class="post-info">
                      <p class="author-name">{{ post.authorId?.fullname }}</p>
                      <p class="post-time">{{ new Date(post.createdAt).toLocaleString() }}</p>
                    </div>
                  </div>
                  <div class="add-class-menu" v-if="isTeacher" @click="toggleDropdown(post._id)">
                    <i class="fas fa-ellipsis-v"></i>
                    <div v-if="isDropdownOpen === post._id" class="dropdown-menu">
                      <button @click="openEditPopup(post)">Chỉnh sửa bài viết</button>
                      <EditPostPopup
                        v-if="isEditPopupOpen"
                        :isOpen="isEditPopupOpen"
                        :post="selectedPost"
                        @close="() => { isEditPopupOpen = false; console.log('Popup đóng'); }"
                        @updated="fetchPosts"
                      />
                      <button @click="deletePost(post._id)">Xóa bài viết</button>
                    </div>
                  </div>
                </div>
                <router-link :to="'/post/' + post._id" class="post-link">
                <div class="post-content" v-html="post.content"></div>
                </router-link>
                <div class="post-attachments" v-if="post.files && post.files.length > 0">
                  <ul>
                    <li v-for="file in post.files" :key="file">
                      <template v-if="isImage(file)">
                        <img :src="file" :alt="file.split('/').pop()" class="attachment-image" />
                      </template>
                      <template v-else>
                        <a :href="file" target="_blank" style=" flex: 1;text-decoration: none;color: black;overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 90%; ">
                          <img :src="getFileIcon(file)" class="attachment-icon" />
                          {{ file.split("/").pop().substring(14) }}
                        </a>
                      </template>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
        </div>
      </section>
    </main>
  </div>
  <!-- Popup chỉnh sửa bài viết -->
  
</template>
<script setup>
import { ref, watch, onMounted,computed,nextTick } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import defaultAvatar from "@/assets/avatar.png";
import defaultImage from "@/assets/nen.jpg";
import defaulticon from "@/assets/default-icon.png";
import pdf from "@/assets/pdf-icon.png";
import excel from "@/assets/excel-icon.png";
import word from "@/assets/word-icon.png";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";
import EditClassPopup from "@/components/EditClassPopup.vue";
import EditPostPopup from "@/components/EditPostPopup.vue";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import Editor from "@tinymce/tinymce-vue";
const isExpanded = ref(false); 
const editorVisible = ref(true);
const attachedFiles = ref([]);
const fileInput = ref(null);
const isDropdownOpen = ref(false);
const isEditPopupOpen = ref(false);
const selectedPost = ref(null)
const toggleDropdown = (postId) => {
  isDropdownOpen.value = isDropdownOpen.value === postId ? null : postId;
};
const openEditPopup = (post) => {
  selectedPost.value = post;
  isEditPopupOpen.value = true;
  console.log("isEditPopupOpen:", isEditPopupOpen.value); // Kiểm tra trạng thái
  fetchPosts();
};
const isImage = (file) => {
  return file.match(/\.(jpeg|jpg|png|gif)$/i);
};

const handleFileUpload = (event) => {
  attachedFiles.value = Array.from(event.target.files).map((file) => {
    return {
      file, 
      name: file.name,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    };
  });
};
const getFileIcon = (file) => {
  if (!file || typeof file !== "string") return defaulticon; // Kiểm tra file trước khi dùng endsWith

  if (file.endsWith(".pdf")) return pdf;
  if (file.endsWith(".doc") || file.endsWith(".docx")) return word;
  if (file.endsWith(".xls") || file.endsWith(".xlsx")) return excel;
  return defaulticon;
};
const removeFile = (index) => attachedFiles.value.splice(index, 1);
const triggerFileInput = () => fileInput.value.click();

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
  placeholder: "Đăng bài lên lớp...",
  
  modules: {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      
    ],
  },
});

const expandEditor = () => {
  isExpanded.value = true;
  nextTick(() => {
    document.querySelector(".custom-quill .ql-editor").style.minHeight = "150px";
  });
};

const cancelPost = () => {
  postContent.value = "";
  isExpanded.value = false;
  nextTick(() => {
    document.querySelector(".custom-quill .ql-editor").style.minHeight = "50px";
  });
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
  if (!postContent.value.trim() && attachedFiles.value.length === 0) {
    toast.error("Bài viết không thể để trống!");
    return;
  }

  const formData = new FormData();
  formData.append("content", postContent.value);
  formData.append("authorId", currentUser.value.id);
  formData.append("classId", classId.value);

  attachedFiles.value.forEach(({ file }) => {
  if (file instanceof File) {
    formData.append("files", file);
  } else {
    console.error("Không phải File object:", file);
  }
});
for (let pair of formData.entries()) {
  console.log(pair[0], pair[1]);
}
console.log("Attached Files:", attachedFiles.value);
  try {
    await axios.post("http://localhost:5000/api/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Bài viết đã được đăng!");
    postContent.value = "";
    attachedFiles.value = [];
    fetchPosts();
  } catch (error) {
    toast.error("Lỗi khi đăng bài!");
    console.error(error);
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
const deletePost = async (postId) => {
  if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;

  try {
    const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Xóa bài viết thất bại!");

    // Xóa bài viết khỏi danh sách hiển thị
    
    isDropdownOpen.value = null; // Đóng dropdown sau khi xóa
    fetchPosts();
    toast.success("Bài viết đã được xóa thành công!");
  } catch (error) {
    console.error(error);
    toast.error("Đã có lỗi xảy ra khi xóa bài viết!");
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
  top: 0px;
  left: 0px;
  
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
  transition: all 0.3s ease;
  border: 1px solid #ddd;
  padding: 5px;
  border-radius: 5px;
  background-color: white;
  cursor: text;
}

.editor-container.expanded {
  min-height: 150px;
}
.custom-quill {
  width: 100%;
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
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Tăng độ nổi bật */
  margin-bottom: 20px; /* Tạo khoảng cách giữa các bài viết */
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  border-left: 5px solid #00ff3c; /* Tạo viền màu để phân biệt */
}

.post:hover {
  transform: scale(1.02); /* Hiệu ứng phóng to nhẹ khi hover */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.post-header {
  display: flex;
  justify-content: space-between;
}
.post-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #00ff3c; /* Viền avatar giúp nổi bật hơn */
}

.post-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: bold;
  font-size: 16px;
}

.post-time {
  font-size: 14px;
  color: gray;
}

.post-content {
  margin-top: 10px;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}
.file-upload {
  width: 100%;
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
  width: 60px;
  height: 40px;
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
.post-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
</style>
