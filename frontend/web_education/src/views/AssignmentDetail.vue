<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div class="assignment-layout">
        <div class="assignment-left">
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
                <p v-html="assignment?.content"></p>
                <div class="bottom-meta">
                  <template v-if="!isTeacher">
                    <span class="score">
                      {{ mySubmission?.score !== undefined ? mySubmission.score : '__' }}/{{ assignment?.maxScore }} điểm
                    </span>
                  </template>
                  <template v-else>
                    <span class="score">{{ assignment?.maxScore }} điểm</span>
                  </template>
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
              <div v-if="!isTeacher"> .</div>
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
        </div>
        <!-- Bên phải: Phần nộp bài -->
        <div v-if="!isTeacher" class="assignment-right">
          <h3 class="text-xl font-semibold mb-4">Bài tập của bạn</h3>

          <!-- Đã nộp -->
          <div v-if="mySubmission" >
            
            <p class="text-green-600 font-medium mb-2">Bạn đã nộp bài</p>
            <div class="attached-files">
            <div class="file-list">
                <div
                v-for="(file, index) in mySubmission.files"
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
            <button
              class="button_re"
              @click="deleteSubmission"
            >
              Hủy nộp bài
            </button>
          </div>

          <!-- Chưa nộp -->
         <div v-else class="submission-box">
          <div class="file-upload-box">
            <label for="fileInput" class="upload-label">
              <span class="upload-icon">＋</span>
              Thêm bài làm
            </label>
            <input id="fileInput" type="file" multiple @change="handleFileChange" style="display: none;" />
          </div>
          <!-- Hiển thị tên file đã chọn -->
          <ul class="selected-files" v-if="selectedFiles.length">
            <li v-for="(file, index) in selectedFiles" :key="index">
              {{ file.name }}
            </li>
          </ul>
          <button class="button_sub" @click="uploadSubmission">
            Nộp bài
          </button>
        </div>

        </div>
        </div>
        <div v-if="isTeacher" class="submission-table">
          <div class="table-header">
            <h3 v-if="submissions.length>0" class="table-title">Danh sách nộp bài</h3>
            <div class="submission-stats">
              <div class="tooltip-wrapper">
                <span>Đã nộp: {{ submittedStudents.length }}</span>
                <div class="tooltip">
                  
                  <p v-for="s in submittedStudents" :key="s._id"><img :src="s?.avatar || defaultAvatar" class="avatar" />{{ s.fullname }}</p>
                </div>
              </div>

              <div class="tooltip-wrapper">
                <span>Chưa nộp: {{ notSubmittedStudents.length }}</span>
                <div class="tooltip">
                  <p v-for="s in notSubmittedStudents" :key="s._id"><img :src="s?.avatar || defaultAvatar" class="avatar" />{{ s.fullname }}</p>
                </div>
              </div>
            </div>
          </div>
          <table v-if="submissions.length>0">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Chấm điểm</th>
                <th>Điểm tối đa</th>
                <th>Bài nộp</th>
                <th>Thời gian nộp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(submission, index) in submissions" :key="submission._id">
                <td>{{ index + 1 }}</td>
                <td>{{ submission.fullname }}</td>
                <td>
                  <input type="number" v-model="submission.score" class="score-input" />
                </td>
                <td>{{ submission.maxScore }}</td>
                <td>
                  <div v-for="(file, idx) in submission.files" :key="idx">
                    <a :href="file" target="_blank" class="attachment-link" style=" flex: 1;text-decoration: none;color: black;overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 90%; ">
                    <img :src="getFileIcon(file)" class="attachment-icon" />
                    {{ file.split("/").pop().substring(14) }}
                  </a>
                  </div>
                </td>
                <td>{{new Date(submission?.submittedAt).toLocaleString() }}</td>
                <td>
                  <button class="save-button" @click="saveScore(submission)">Lưu</button>
                </td>
              </tr>
            </tbody>
          </table>
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
                <p class="comment-time">{{ formatTimeAgo(comment.createdAt) }}</p>
                
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
import { useRoute, useRouter} from "vue-router";
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
const teachers = ref([]);
const students = ref([]);
const classroom = ref(null);
const classId = ref(localStorage.getItem("classId") || route.params.id);
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
const isTeacher = computed(() => {
  return teachers.value.some(teacher => teacher._id === currentUser.value.id);
});
const route = useRoute();
const assignment = ref(null);
const comments = ref([]);
const newComment = ref("");
// Khai báo state
const selectedFiles = ref([]);

// Xử lý khi chọn file
function handleFileChange(event) {
  selectedFiles.value = Array.from(event.target.files);
}

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
  return file.split("/").pop().substring(14);
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
const router = useRouter();
const deleteAssignment = async (assignmentId) => {
  if (confirm("Bạn có chắc chắn muốn xóa bài tập này?")) {
    try {
      await axios.delete(`http://localhost:5000/api/assignments/${assignmentId}`);
      toast.success("Đã xóa bài tập!");
      await router.push(`/class/${classId.value}/assignments`);
    } catch (error) {
      console.error("Lỗi khi xóa bài tập:", error);
      toast.error("Xóa bài tập thất bại!");
    }
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
//nộp bài
const submissionFiles = ref([]);



const uploadSubmission = async () => {
  const now = new Date();
  if (new Date(assignment.value.dueDate) < now) {
    toast.error("Bài tập đã hết hạn!");
    return;
  }
  if (mySubmission.value?.score != null) {
    toast.error("Giáo viên đã chấm điểm bài tập này!");
    return;
  }
  if (selectedFiles.value.length === 0) {
    toast.error("Vui lòng chọn tệp để nộp");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("userId", currentUser.value.id);

    selectedFiles.value.forEach((file) => {
      formData.append("files", file);
    });

    await axios.post(
      `http://localhost:5000/api/assignments/${route.params.assignmentId}/submit`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success("Đã nộp bài thành công!");
    selectedFiles.value = []; // reset lại file sau khi nộp
    document.querySelector('input[type="file"]').value = null;
    await fetchAssignment();
    await fetchMySubmission();
  } catch (error) {
    console.error("❌ Lỗi khi nộp bài:", error.response?.data || error);
    toast.error("Nộp bài thất bại!");
  }
};

const mySubmission = ref(null);

const fetchMySubmission = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/assignments/${route.params.assignmentId}/submission/${currentUser.value.id}`);
    mySubmission.value = res.data;
  } catch (err) {
    const errorCode = err.response?.data?.code;

    if (errorCode === 'SUBMISSION_NOT_FOUND') {
      mySubmission.value = null;
    } else {
      console.error("Lỗi khi lấy bài nộp:", err);
      // Có thể show toast: bài tập không tồn tại hoặc lỗi hệ thống
    }
  }
};


const deleteSubmission = async () => {
  if (!confirm("Bạn có chắc chắn muốn xóa bài đã nộp?")) return;
  const now = new Date();
  if (new Date(assignment.value.dueDate) < now) {
    toast.error("Bài tập đã hết hạn!");
    return;
  }
  if (mySubmission.value?.score != null) {
    toast.error("Giáo viên đã chấm điểm bài tập này!");
    return;
  }

  try {
    await axios.delete(`http://localhost:5000/api/assignments/${route.params.assignmentId}/submission/${currentUser.value.id}`);
    toast.success("Đã xóa bài nộp");
    await fetchMySubmission();
  } catch (err) {
    console.error("Lỗi khi xóa bài nộp:", err);
    toast.error("Không thể xóa bài");
  }
};
const submissions = ref([]);
const fetchSubmissions= async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/assignments/${route.params.assignmentId}/submissions`);
    console.log("Response:", response);
    submissions.value = response.data.submissions;
    console.log("Dữ liệu :", submissions.value);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nộp bài:", error);
  }
}
const saveScore = async (submission) => {
  try {
    const response = await axios.patch(
      `http://localhost:5000/api/assignments/${route.params.assignmentId}/submissions/${submission.id}`,
      { score: submission.score , userId:currentUser.value.id}
    );
    console.log("Cập nhật điểm thành công:", response.data);
    toast.success("Đã cập nhật điểm số");
  } catch (error) {
    console.error("Lỗi cập nhật điểm:", error);
  }
};
const submittedStudents = computed(() => {

  const submittedIds = submissions.value.map(s => s.studentId?._id);
  console.log(submittedIds);
  return students.value.filter(s => submittedIds.includes(s._id));
});

const notSubmittedStudents = computed(() => {
  const submittedIds = submissions.value.map(s => s.studentId?._id);
  return students.value.filter(s => !submittedIds.includes(s._id));
});
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
  fetchAssignment();
  fetchComments();
  fetchClassPeople();
  fetchMySubmission();
  fetchSubmissions();
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
  max-width: 90%;
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
.assignment-layout {
  display: flex;
  align-items: flex-start;
  gap: 50px; /* khoảng cách giữa 2 bên */
  margin-bottom: 20px;

}

.assignment-left {
  flex: 1;
  min-width: 0;
}

.assignment-right {
  width: 300px; /* hoặc 350px, 400px tùy bạn muốn rộng bao nhiêu */
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  border-bottom: 3px solid #e0e0e0;
  padding-bottom: 10px;
  max-width: 80%;
  margin-bottom: 20px;
  margin: 0 auto;
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
  width: 80%;
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

/* .attached-files .file-card {
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
} */

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
  margin-right: 10px;
  border-radius: 50%;
  border: 2px solid #000000; /* Viền avatar giúp nổi bật hơn */
}
.assignment-right {
  max-width: 400px;
  padding: 16px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  font-family: 'Segoe UI', sans-serif;
}

.assignment-right h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.submitted-box {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.submitted-box img {
  width: 40px;
  height: auto;
  border-radius: 4px;
}

.submitted-box a {
  font-weight: 500;
  color: #202124;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.submitted-box a:hover {
  text-decoration: underline;
}

.text-green-600 {
  color: #16a34a; /* tương đương tailwind */
  font-weight: 500;
  margin-bottom: 12px;
  text-align: center;
}

/* Danh sách file đính kèm */
.attached-files {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Chứa các file */
.file-list {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.assignment-right .button_re {
  background-color: #ffffff;
  
  color: red !important;
  border: 1px solid red;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 16px;
  width: 60%;
  display: block;
  margin-left: auto;
  margin-right: auto; /* canh giữa */
  text-align: center;
}

.assignment-right .button_re:hover {
  background-color: #fc0000;
  color: white !important;
}
.submission-box {
  width: 300px;
  background-color: white;
  
 
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Segoe UI", sans-serif;
}

/* Hộp "Thêm hoặc tạo" */
.file-upload-box {
  width: 100%;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin-bottom: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-upload-box:hover {
  background-color: #f8f9fa;
}

.upload-label {
  font-weight: 500;
  color: #1a73e8;
  text-decoration: none;
  cursor: pointer;
}

.upload-icon {
  font-size: 20px;
  margin-right: 6px;
  vertical-align: middle;
}

/* Nút nộp bài */
.button_sub {
  background-color: #1a73e8 !important;
  color: white !important;
  border: none !important;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s ease;
  text-align: center;
}

.button_sub:hover {
  background-color: #1765cc !important;
}
.selected-files {
  list-style-type: none;
  padding: 0;
  margin-bottom: 16px;

  font-size: 14px;
  color: #333;
  text-align: left;
  white-space: nowrap;        /* Không xuống dòng */
  overflow: hidden;           /* Ẩn phần tràn */
  text-overflow: ellipsis;    /* Thêm dấu "..." */
  max-width: 100%;
}

.selected-files li {
  white-space: nowrap;        /* Không xuống dòng */
  overflow: hidden;           /* Ẩn phần tràn */
  text-overflow: ellipsis;    /* Thêm dấu "..." */
  max-width: 80%;
  margin-bottom: 4px;
  padding-left: 8px;
  position: relative;
}
.selected-files li::before {
  content: '📎';
  position: absolute;
  left: 0;
}
/* Container bảng */
.submission-table {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 20px auto;
  max-width: 80%;
  font-family: Arial, sans-serif;
  max-height: 90vh; 
  overflow-y: auto;
  overflow-x: auto;
}

/* Tiêu đề bảng */
.table-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  border-bottom: 2px solid #1a73e8;
  padding-bottom: 8px;
}

/* Bảng chung */
table {
  width: 100%;
  border-collapse: collapse;
}

/* Header của bảng */
thead {
  background-color: #1a73e8;
  color: #fff;
}

thead th {
  padding: 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
}

/* Body bảng */
tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background-color: #f9f9f9;
}

td {
  padding: 12px;
  font-size: 14px;
  color: #333;
  vertical-align: middle;
}

/* Input chấm điểm */
.score-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}



/* Nút lưu riêng cho bảng */
.save-button {
  background-color: #1a73e8;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.save-button:hover {
  background-color: #1765cc;
}

.attachment-icon {
  width: 20px;
  height: auto;
  margin-right: 5px;
  margin-top: 5PX;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.submission-stats span {
  margin-left: 16px;
  font-size: 22px;
  color: #333;
}

.submission-stats {
  display: flex;
  gap: 20px;
  font-weight: 500;
}
.tooltip-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 16px;
  cursor: pointer;
}

.tooltip-wrapper .tooltip {
  visibility: hidden;
  opacity: 0;
  background-color: #fff;
  color: #333;
  text-align: left;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  position: absolute;
  z-index: 1;
  top: 120%;
  left: 0;
  min-width: 200px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  transition: opacity 0.3s ease;
  overflow-y: auto;
  max-height: 25vh;
}

.tooltip-wrapper:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

</style>