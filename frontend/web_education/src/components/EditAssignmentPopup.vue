<template>
  <Teleport to="body" v-if="isOpen">
    <div class="popup-overlay">
      <div class="popup-content">
        <h3>Chỉnh sửa bài tập</h3>
        <form @submit.prevent="updateAssignment">
          <label>Tiêu đề</label>
          <input v-model="editedTitle" placeholder="Nhập tiêu đề bài tập" required />

          <label>Mô tả bài tập</label>
          <textarea v-model="editedContent" placeholder="Nhập mô tả bài tập" rows="2"></textarea>

          <label>Hạn nộp</label>
          <input type="datetime-local" v-model="editedDueDate" required />

          <label>Điểm tối đa</label>
          <input type="number" v-model="editedMaxScore" placeholder="VD: 10" required />

          <label>Tệp đính kèm</label>
          <div class="file-upload">
            <input type="file" multiple @change="handleFileUpload" hidden ref="fileInput" />
            <button @click.prevent="triggerFileInput">Chọn tệp</button>

            <div v-if="editedAttachments.length" class="file-list">
              <div v-for="(file, index) in editedAttachments" :key="index" class="file-item">
                <img v-if="isImage(file)" :src="getFileURL(file)" class="file-thumbnail" />
                <img v-else :src="getFileIcon(file)" class="file-thumbnail" />
                <span>{{ getFileName(file) }}</span>
                <button @click.prevent="removeFile(index)" class="remove-file">×</button>
              </div>
            </div>
          </div>

          <div class="popup-actions" style="margin-top: 10px;">
            <button type="submit" class="btn-submit">Lưu</button>
            <button type="button" @click="$emit('close')" class="close-btn">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>


<script setup>
import { ref, watch } from "vue";
import { useToast } from "vue-toastification";
import axios from "axios";
import defaulticon from "@/assets/default-icon.png";
import pdf from "@/assets/pdf-icon.png";
import excel from "@/assets/excel-icon.png";
import word from "@/assets/word-icon.png";

const props = defineProps({
  isOpen: Boolean,
  assignment: Object
});
const emit = defineEmits(["close", "updated"]);
const toast = useToast();

const editedTitle = ref("");
const editedContent = ref("");
const editedDueDate = ref("");
const editedAttachments = ref([]);
const fileInput = ref(null);
const originalFiles = ref([]);
const editedMaxScore = ref("");


watch(() => props.assignment, (newAssignment) => {
  if (newAssignment && typeof newAssignment === 'object') {
    editedTitle.value = newAssignment.title || "";
    editedContent.value = newAssignment.content || "";
    // Chuyển định dạng ngày về datetime-local
    if (newAssignment.dueDate) {
      const date = new Date(newAssignment.dueDate);
      editedDueDate.value = date.toISOString().slice(0, 16);
    } else {
      editedDueDate.value = "";
    }
    editedMaxScore.value = newAssignment.maxScore || "";
    if (Array.isArray(newAssignment.attachments)) {
      editedAttachments.value = [...newAssignment.attachments];
      originalFiles.value = [...newAssignment.attachments];
    } else {
      editedAttachments.value = [];
      originalFiles.value = [];
    }
  }
}, { immediate: true });


const handleFileUpload = (event) => {
  const newFiles = Array.from(event.target.files);
  editedAttachments.value.push(...newFiles);
};

const triggerFileInput = () => fileInput.value.click();

const removeFile = (index) => editedAttachments.value.splice(index, 1);

const isImage = (file) => /\.(jpeg|jpg|png|gif)$/i.test(file);

const getFileIcon = (file) => {
  if (!file || typeof file !== "string") return defaulticon;
  if (file.endsWith(".pdf")) return pdf;
  if (file.endsWith(".doc") || file.endsWith(".docx")) return word;
  if (file.endsWith(".xls") || file.endsWith(".xlsx")) return excel;
  return defaulticon;
};

const getFileName = (file) => {
  if (typeof file === "string") {
    return file.split("/").pop();
  } else if (file instanceof File) {
    return file.name;
  }
  return "unknown";
};

const updateAssignment = async () => {
  try {
    const formData = new FormData();
    formData.append("title", editedTitle.value);
    formData.append("content", editedContent.value);
    formData.append("dueDate", editedDueDate.value);
    formData.append("maxScore", editedMaxScore.value);

    editedAttachments.value.forEach((file) => {
      if (typeof file === "string") {
        formData.append("existingFiles[]", file);
      } else {
        formData.append("files", file);
      }
    });

    const removedFiles = originalFiles.value.filter(file => !editedAttachments.value.includes(file));
    if (removedFiles.length > 0) {
      formData.append("removedFiles", JSON.stringify(removedFiles));
    }

    await axios.put(`http://localhost:5000/api/assignments/${props.assignment._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    toast.success("Bài tập đã được cập nhật!");
    emit("updated");
    emit("close");
  } catch (error) {
    toast.error("Lỗi khi cập nhật bài tập!");
  }
};
</script>

<style scoped>
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
  z-index: 9999;
}

.popup-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
