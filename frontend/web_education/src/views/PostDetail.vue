<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div v-if="post" class="post">
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
              <div v-if="isDropdownOpen" class="dropdown-menu">
                <button @click="openEditPopup(post)">Chỉnh sửa bài viết</button>
                <EditPostPopup
                  v-if="isEditPopupOpen"
                  :isOpen="isEditPopupOpen"
                  :post="post"
                  @close="() => { isEditPopupOpen = false; console.log('Popup đóng'); }"
                  @updated="fetchPost"
                />
                <button @click="deletePost(post._id)">Xóa bài viết</button>
              </div>
            </div>
          </div>

          <div class="post-content" v-html="post.content"></div>

          <div class="post-attachments" v-if="post.files && post.files.length > 0">
            <ul>
              <li v-for="file in post.files" :key="file">
                <template v-if="isImage(file)">
                  <img :src="file" :alt="file.split('/').pop()" class="attachment-image" />
                </template>
                <template v-else>
                  <a :href="file" target="_blank" class="attachment-link" style=" flex: 1;text-decoration: none;color: black;overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 90%; ">
                    <img :src="getFileIcon(file)" class="attachment-icon" />
                    {{ file.split("/").pop() }}
                  </a>
                </template>
              </li>
            </ul>
          </div>
        </div>

        <div v-else class="loading">Đang tải bài viết...</div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted,computed } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import defaultAvatar from "@/assets/avatar.png";
import EditPostPopup from "@/components/EditPostPopup.vue";
import defaultImage from "@/assets/nen.jpg";
import defaulticon from "@/assets/default-icon.png";
import pdf from "@/assets/pdf-icon.png";
import excel from "@/assets/excel-icon.png";
import word from "@/assets/word-icon.png";

// const toast = useToast();

const authStore = useAuthStore();
const currentUser = ref(authStore.user); // Lưu thông tin người dùng hiện tại

const isTeacher = computed(() => {
   return post.value?.authorId?._id === currentUser.value.id;
 });
const route = useRoute();
const post = ref(null);

const isDropdownOpen = ref(false);
const isEditPopupOpen = ref(false);
const isImage = (file) => {
  return file.match(/\.(jpeg|jpg|png|gif)$/i);
};
const getFileIcon = (file) => {
  if (!file || typeof file !== "string") return defaulticon; // Kiểm tra file trước khi dùng endsWith

  if (file.endsWith(".pdf")) return pdf;
  if (file.endsWith(".doc") || file.endsWith(".docx")) return word;
  if (file.endsWith(".xls") || file.endsWith(".xlsx")) return excel;
  return defaulticon;
};
const fetchPost = async () => {
  try {
    const postId = route.params.postId;
    const response = await axios.get(`http://localhost:5000/api/posts/detail/${postId}`);
    
    post.value = response.data;
    console.log("Dữ liệu bài viết:", post.value); 
  } catch (error) {
    console.error("Lỗi khi tải bài viết:", error);
  }
};

const selectedPost = ref(null)
const toggleDropdown = (postId) => {
  isDropdownOpen.value = isDropdownOpen.value === postId ? null : postId;
};
const openEditPopup = (post) => {
  selectedPost.value = post;
  isEditPopupOpen.value = true;
  console.log("isEditPopupOpen:", isEditPopupOpen.value); // Kiểm tra trạng thái
  fetchPost();
};

const deletePost = async (postId) => {
  try {
    await axios.delete(`/api/posts/${postId}`);
    alert("Bài viết đã bị xóa");
    window.history.back(); // Quay lại trang trước
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
  }
};

onMounted(fetchPost);
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
  justify-content: center;
  
  background-color: #e0e0e0;
}

.post {

  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Tăng độ nổi bật */
  width: 80%;
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  border-left: 5px solid #00ff3c; /* Tạo viền màu để phân biệt */
  height: fit-content;
  margin-top: 30px;
}

.loading {
  font-size: 18px;
  font-weight: bold;
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
</style>
