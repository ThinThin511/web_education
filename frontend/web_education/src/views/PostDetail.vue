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
                <p class="post-time">{{ formatTimeAgo(post.createdAt) }}</p>
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
                    {{ file.split("/").pop().substring(14) }}
                  </a>
                </template>
              </li>
            </ul>
          </div>
        </div>

        <div v-else class="loading">Đang tải bài viết...</div>
        <div class="comment-input">
          <input v-model="newComment" placeholder="Thêm nhận xét trong lớp học..." />
          <button @click="addComment">Gửi</button>
        </div>
        <div class="comments-section">
          <h3 style="margin-bottom: 10px;">Nhận xét của lớp học</h3>
          <div v-if="comments.length > 0">
            <div v-for="comment in comments" :key="comment._id" class="comment">
              <img :src="comment.userId.avatar || defaultAvatar" class="avatar" />

              <div class="comment-content">
                <p class="comment-author">{{ comment.userId.fullname }}</p>
                <p class="comment-text">{{ comment.text }}</p>
                <p class="comment-time">{{ formatTimeAgo(comment.createdAt) }}</p>
                
                <div class="actions">
                  <button @click="showReplyInput[comment._id] = !showReplyInput[comment._id]">
                    Trả lời
                  </button>
                  <div class="comment-actions" v-if="user === comment.userId._id || isTeacher">
                  
                    <button v-if="user === comment.userId._id" @click="editComment(comment)">Chỉnh sửa</button>
                    <button @click="deleteComment(comment._id)">Xóa </button>
                  </div>
                </div>
                <div v-if="editingCommentId === comment._id" class="edit-section">
                  <input v-model="editingText" placeholder="Chỉnh sửa bình luận..." />
                  <div class="edit-buttons">
                    <button @click="saveEditComment()">Lưu</button>
                    <button @click="editingCommentId = null">Hủy</button>
                  </div>
                </div>
                <!-- reply-section nằm TRONG comment-content -->
                <div class="reply-section">
                  <!-- <button @click="showReplyInput[comment._id] = !showReplyInput[comment._id]">
                    Trả lời
                  </button> -->

                  <div v-if="showReplyInput[comment._id]" class="reply-input">
                    <input
                      v-model="replyTexts[comment._id]"
                      placeholder="Nhập phản hồi..."
                    />
                    <button @click="sendReply(comment._id)">Gửi</button>
                  </div>

                  <div v-if="comment.replies && comment.replies.length">
                    <div
                      v-for="reply in comment.replies"
                      :key="reply._id"
                      class="reply"
                    >
                      <img :src="reply.userId.avatar || defaultAvatar" class="avatar" />
                      <div class="comment-content">
                        <p class="comment-author">{{ reply.userId.fullname }}</p>
                        <p class="comment-text">{{ reply.text }}</p>
                        <p class="comment-time">{{ formatTimeAgo(reply.createdAt) }}</p>
                        <div class="comment-actions" v-if="user=== reply.userId._id || isTeacher">
                          <button v-if="user=== reply.userId._id" @click="editReply(comment._id, reply)">Chỉnh sửa</button>
                          <button @click="deleteReply(comment._id, reply._id)">Xóa</button> 
                        </div>
                        <div v-if="editingReplyId === reply._id" class="edit-section">
                          <input v-model="editingText" placeholder="Chỉnh sửa phản hồi..." />
                          <div class="edit-buttons">
                            <button @click="saveEditReply(comment._id)">Lưu</button>
                            <button @click="editingReplyId = null">Hủy</button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p v-else>Chưa có nhận xét nào.</p>
        </div>

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
import { useToast } from "vue-toastification";
// const toast = useToast();

const authStore = useAuthStore();
const currentUser = ref(authStore.user); // Lưu thông tin người dùng hiện tại
const user = currentUser.value.id;
const isTeacher = computed(() => {
   return post.value?.authorId?._id === currentUser.value.id;
 });
const route = useRoute();
const post = ref(null);
const comments = ref([]);
const newComment = ref("");

const isDropdownOpen = ref(false);
const isEditPopupOpen = ref(false);
const toast = useToast();
const replyTexts = ref({});
const showReplyInput = ref({});
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
    toast.success("Bài viết đã bị xóa");
    window.history.back(); // Quay lại trang trước
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
  }
};
const fetchComments = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/posts/${route.params.postId}/comments`);
    comments.value = response.data;
  } catch (error) {
    console.error("Lỗi khi tải bình luận:", error);
  }
};

const addComment = async () => {
  if (!newComment.value.trim()) return;

  try {
    console.log("Gửi bình luận:", { text: newComment.value, userId: currentUser.value.id });

    const response = await axios.post(
      `http://localhost:5000/api/posts/${route.params.postId}/comments`,
      { text: newComment.value, userId: currentUser.value.id } // Gửi userId lên server
    );
    toast.success("Nhận xét đã được đăng");
    console.log("Phản hồi từ server:", response.data);
    comments.value.push(response.data);
    newComment.value = "";
  } catch (error) {
    console.error("Lỗi khi thêm bình luận:", error.response?.data || error);
  }
};
const sendReply = async (commentId) => {
  const reply = replyTexts.value[commentId]?.trim();
  if (!reply) return;

  try {
    const response = await axios.post(
      `http://localhost:5000/api/posts/${route.params.postId}/comments/${commentId}/replies`,
      {
        text: reply,
        userId: currentUser.value.id,
      }
    );
      toast.success("Đã trả lời nhận xét");
    // Cập nhật comment cụ thể
    const updatedReplies = response.data;
    const commentIndex = comments.value.findIndex((c) => c._id === commentId);
    if (commentIndex !== -1) {
      comments.value[commentIndex].replies = updatedReplies;
    }

    replyTexts.value[commentId] = "";
    showReplyInput.value[commentId] = false;
  } catch (error) {
    console.error("Lỗi khi gửi phản hồi:", error.response?.data || error);
  }
};
const editingCommentId = ref(null)
const editingReplyId = ref(null)
const editingText = ref("")

const deleteComment = async (commentId) => {
  await axios.delete(`http://localhost:5000/api/posts/${route.params.postId}/comments/${commentId}`)
  await fetchComments()
  toast.success("Xóa nhận xét thành công");
}

const deleteReply = async (commentId, replyId) => {
  await axios.delete(`http://localhost:5000/api/posts/${route.params.postId}/comments/${commentId}/replies/${replyId}`)
  await fetchComments()
  toast.success("Đã xóa câu trả lời");
}

const editComment = (comment) => {
  editingCommentId.value = comment._id
  editingText.value = comment.text
}

const editReply = (commentId, reply) => {
  editingReplyId.value = reply._id
  editingText.value = reply.text
}

const saveEditComment = async () => {
  await axios.put(`http://localhost:5000/api/posts/${route.params.postId}/comments/${editingCommentId.value}`, { text: editingText.value })
  editingCommentId.value = null
  editingText.value = ""
  await fetchComments()
  toast.success("Đã cập nhật nhận xét");
}

const saveEditReply = async (commentId) => {
  await axios.put(`http://localhost:5000/api/posts/${route.params.postId}/comments/${commentId}/replies/${editingReplyId.value}`, { text: editingText.value })
  editingReplyId.value = null
  editingText.value = ""
  await fetchComments()
  toast.success("Đã cập nhật câu trả lời");
}
const formatTimeAgo = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000); // seconds

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString();
};


onMounted(()=>{
  fetchPost();
  fetchComments();
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
  flex-direction: column; /* Xếp nội dung theo chiều dọc */
  align-items: center; /* Căn giữa nội dung */
  background-color: #f9fbfd; 
  padding: 20px;
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
  margin-bottom: 20px;
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
.comments-section {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 80%;
  
}
.comments-section {
  margin-top: 20px;
}
.comment {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px; /* Tăng khoảng cách giữa các bình luận */
}

.comment-content {
  background: #f1f1f1;
  padding: 10px 12px;
  border-radius: 8px;
  flex: 1;
}

.comment-author {
  font-weight: bold;
}

.comment-time {
  font-size: 12px;
  color: gray;
}

.comment-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  max-width: 800px;
}

.comment-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.comment-input button {
  margin-left: 10px;
  padding: 8px 12px;
  background: #28a745;
  color: white;
  border: none;
  cursor: pointer;
}
.reply-section {
  margin-left: 60px; /* Lùi vào so với bình luận cha */
  margin-top: 8px;
}

.reply {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 10px;
}

.reply .comment-content {
  background: #e9e9e9;
  padding: 8px 10px;
  border-radius: 8px;
  flex: 1;
}

.reply-input {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.reply-input input {
  flex: 1;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.reply-input button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
}

.reply-input button:hover {
  background-color: #218838;
}

.comment-time {
  font-size: 12px;
  color: gray;
  margin-top: 4px;
}

.comment-author {
  font-weight: bold;
}

.reply-section > button {
  margin-top: 4px;
  font-size: 14px;
  color: #007bff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  
}

.reply-section > button:hover {
  text-decoration: underline;
}

.comment-actions > button {
  margin-top: 4px;
  font-size: 14px;
  color: #007bff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 10px;
}
.comment-actions > button:hover {
  text-decoration: underline;
}
.edit-section {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.edit-section input {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.edit-buttons {
  display: flex;
  gap: 8px;
}

.edit-buttons button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.edit-buttons button:first-child {
  background-color: #4CAF50; /* màu xanh lưu */
  color: white;
}

.edit-buttons button:last-child {
  background-color: #ccc; /* màu xám hủy */
  color: black;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.actions button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
}

.actions button:hover {
  text-decoration: underline;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

</style>
