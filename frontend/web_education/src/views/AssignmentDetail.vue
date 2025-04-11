<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div class="assignment-header">
            <div class="header-left">
                <h1 class="title">{{ assignment?.title }}</h1>
                <div class="subtitle">
                <span>{{ assignment?.teacherId?.fullname }}</span>
                
                <span class="dot">•</span>
                <span>{{ formatDate(assignment?.createdAt) }}</span>
                <span v-if="assignment?.updatedAt && assignment?.updatedAt !== assignment?.createdAt">
                    (Đã chỉnh sửa {{ formatDate(assignment.updatedAt) }})
                </span>
                </div>
                <p v-html="assignment.content"></p>
                <div class="bottom-meta">
                <span class="score">{{ assignment?.maxScore }} điểm</span>
                </div>
            </div>

            <div class="header-right" >
                
                <div class="add-class-menu" v-if="isTeacher" @click="toggleDropdown(assignment._id)">
                    <i class="fas fa-ellipsis-v"></i>
                    <div v-if="isDropdownOpen === assignment._id" class="dropdown-menu">
                        <button @click="openEditPopup(assignment)">Chỉnh sửa bài tập</button>
                        <EditAssignmentPopup
                        v-if="isEditPopupOpen && selectedAssignment"
                        :isOpen="isEditPopupOpen"
                        :assignment="selectedAssignment"
                        @close="() => { isEditPopupOpen = false }"
                        @updated="fetchAssignment"
                        />
                        <button @click="deleteAssignment(assignment._id)">Xóa bài tập</button>
                    </div>
                </div>
                <div> .</div>
                <div> .</div>
                <span class="due-date">Đến hạn {{ new Date(assignment?.dueDate).toLocaleString() }}</span>
            </div>
        </div>
        <!-- Tệp đính kèm -->
        <div v-if="assignment?.attachments?.length" class="attached-files">
            
            <div class="file-list">
                <div
                v-for="(file, index) in assignment.attachments"
                :key="index"
                class="file-card"
                >
                <!-- Hiện icon file -->
                <img
                    :src="getFileIcon(file)"
                    alt="icon"
                    class="file-icon"
                />
                <!-- Tên file -->
                <a :href="file" target="_blank" class="file-name">
                    {{ getFileName(file) }}
                </a>
                <div class="file-type">{{ getFileType(file) }}</div>
                </div>
            </div>
        </div>
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
                <p class="comment-time">{{ new Date(comment.createdAt).toLocaleString() }}</p>
                
                <div class="actions">
                  <button @click="showReplyInput[comment._id] = !showReplyInput[comment._id]">
                    Trả lời
                  </button>
                  <div class="comment-actions" v-if="user === comment.userId._id || isTeacher">
                  
                    <button v-if="user === comment.userId._id" @click="editComment(comment)">Chỉnh sửa</button>
                    <button @click="deleteComment(comment._id)">Xóa {{ currentUser._id }}</button>
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
                        <p class="comment-time">{{ new Date(reply.createdAt).toLocaleString() }}</p>
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
import EditAssignmentPopup from "@/components/EditAssignmentPopup.vue";


const authStore = useAuthStore();
const currentUser = ref(authStore.user); // Lưu thông tin người dùng hiện tại
const user = currentUser.value.id;
const isTeacher = computed(() => {
   return assignment.value?.teacherId?._id === currentUser.value.id;
 });
const route = useRoute();
const assignment = ref(null);
const comments = ref([]);
const newComment = ref("");

const isDropdownOpen = ref(false);
const isEditPopupOpen = ref(false);
const selectedAssignment = ref(null);
const openEditPopup = (assignment) => {
  selectedAssignment.value = assignment;
  isEditPopupOpen.value = true;
  console.log("isEditPopupOpen:", isEditPopupOpen.value); // Kiểm tra trạng thái
  fetchAssignment();
};
const toggleDropdown = (assignmentId) => {
  isDropdownOpen.value = isDropdownOpen.value === assignmentId ? null : assignmentId;
};
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
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};
const getFileName = (file) => {
  return file.split("/").pop();
};

const getFileType = (file) => {
  const extension = file.split(".").pop().toLowerCase();
  switch (extension) {
    case "pdf":
      return "PDF";
    case "zip":
    case "rar":
      return "Tệp lưu trữ nén";
    case "txt":
      return "Văn bản";
    case "doc":
    case "docx":
      return "Word";
    case "xls":
    case "xlsx":
      return "Excel";
    default:
      return "Tệp đính kèm";
  }
};


const fetchAssignment = async () => {
  try {
    const assignmentId = route.params.assignmentId;
    const response = await axios.get(`http://localhost:5000/api/assignments/detail/${assignmentId}`);
    
    assignment.value = response.data;
    console.log("Dữ liệu bài viết:", assignment.value); 
  } catch (error) {
    console.error("Lỗi khi tải bài viết:", error);
  }
};
const fetchComments = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/assignments/${route.params.assignmentId}/comments`);
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
      `http://localhost:5000/api/assignments/${route.params.assignmentId}/comments`,
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
      `http://localhost:5000/api/assignments/${route.params.assignmentId}/comments/${commentId}/replies`,
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
  await axios.delete(`http://localhost:5000/api/assignments/${route.params.assignmentId}/comments/${commentId}`)
  await fetchComments()
  toast.success("Xóa nhận xét thành công");
}

const deleteReply = async (commentId, replyId) => {
  await axios.delete(`http://localhost:5000/api/assignments/${route.params.assignmentId}/comments/${commentId}/replies/${replyId}`)
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
  await axios.put(`http://localhost:5000/api/assignments/${route.params.assignmentId}/comments/${editingCommentId.value}`, { text: editingText.value })
  editingCommentId.value = null
  editingText.value = ""
  await fetchComments()
  toast.success("Đã cập nhật nhận xét");
}

const saveEditReply = async (commentId) => {
  await axios.put(`http://localhost:5000/api/assignments/${route.params.assignmentId}/comments/${commentId}/replies/${editingReplyId.value}`, { text: editingText.value })
  editingReplyId.value = null
  editingText.value = ""
  await fetchComments()
  toast.success("Đã cập nhật câu trả lời");
}
onMounted(()=>{
  fetchAssignment();
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
  
  padding: 20px;
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
  margin-left: 200px;
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
.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 5px;
  margin-bottom: 10px;
}

.header-left {
  flex: 1;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #5f6368;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.subtitle .dot {
  font-size: 12px;
}

.bottom-meta {
  margin-top: 8px;
}

.score {
  font-weight: 500;
  color: #3c4043;
}

.header-right {
  text-align: right ;
  position: relative;
}

.due-date {
  font-size: 14px;
  color: #5f6368;
}




.attached-files {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
  max-width: 80%;
  margin-bottom: 20px;
}

.attached-files h4 {
  font-size: 16px;
  font-weight: 600;
  color: #3c4043;
  margin-bottom: 12px;
}
.attached-files .file-list {
  display: flex;
  flex-wrap: wrap; /* Cho phép tự xuống dòng khi hết chỗ */
  gap: 16px;
}

.attached-files .file-card {
  width: 220px;
  border: 1px solid #dadce0;
  border-radius: 12px;
  background-color: white;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: box-shadow 0.2s ease;
}

.attached-files .file-card:hover {
  box-shadow: 0 2px 8px rgba(60, 64, 67, 0.15);
}

.attached-files .file-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
}

.attached-files .file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a73e8;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.attached-files .file-type {
  font-size: 13px;
  color: #5f6368;
  margin-top: 4px;
}

.attached-files .file-card {
  width: 200px;
  height: 120px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  background-color: white;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: box-shadow 0.2s ease;
}

.attached-files .file-card:hover {
  box-shadow: 0 2px 8px rgba(60, 64, 67, 0.2);
}

.attached-files .file-thumbnail {
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 6px;
}

.attached-files .file-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 6px;
}

.attached-files .file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a73e8;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.attached-files .file-type {
  font-size: 12px;
  color: #5f6368;
  margin-top: 2px;
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
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #00ff3c; /* Viền avatar giúp nổi bật hơn */
}
</style>