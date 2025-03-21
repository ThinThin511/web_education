<template>
  <Teleport to="body" v-if="isOpen">
    <div class="popup-overlay">
      <div class="popup-content">
        <h2>Chỉnh sửa bài viết</h2>

        <Editor v-model="editedContent" api-key="agxk6am9f2ziuovlmqqo6ggnmg9khr0ie7gjarcqe723ib0d" :init="editorConfig" />

        <div class="file-upload">
          <input type="file" multiple @change="handleFileUpload" hidden ref="fileInput" />
          <button @click="triggerFileInput">Chọn tệp</button>

          <div v-if="editedFiles.length" class="file-list">
            <div v-for="(file, index) in editedFiles" :key="index" class="file-item">
              <img v-if="isImage(file)" :src="file" class="file-thumbnail" />
              <img v-else :src="getFileIcon(file)" class="file-thumbnail" />
              <span>{{ getFileName(file) }}</span>
              <button @click="removeFile(index)" class="remove-file">×</button>
            </div>
          </div>
        </div>

        <div class="popup-actions">
          <button class="btn btn-secondary" @click="$emit('close')">Hủy</button>
          <button class="btn btn-primary" @click="updatePost">Lưu</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
import Editor from "@tinymce/tinymce-vue";
import { useToast } from "vue-toastification";
import axios from "axios";
import defaulticon from "@/assets/default-icon.png";
import pdf from "@/assets/pdf-icon.png";
import excel from "@/assets/excel-icon.png";
import word from "@/assets/word-icon.png";

const props = defineProps({
  isOpen: Boolean,
  post: Object
});
const emit = defineEmits(["close", "updated"]);
const toast = useToast();

const editedContent = ref("");
const editedFiles = ref([]);
const fileInput = ref(null);
const originalFiles = ref([]);

const editorConfig = ref({ menubar: false, height: 200, placeholder: "Chỉnh sửa bài viết..." });

watch(() => props.post, (newPost) => {
  if (newPost) {
    editedContent.value = newPost.content;
    editedFiles.value = newPost.files ? [...newPost.files] : [];
    originalFiles.value = [...newPost.files]; 
  }
}, { immediate: true });

const handleFileUpload = (event) => {
  const newFiles = Array.from(event.target.files);
  editedFiles.value.push(...newFiles);
};

const triggerFileInput = () => fileInput.value.click();

const removeFile = (index) => editedFiles.value.splice(index, 1);

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
    return file.split("/").pop(); // Nếu là chuỗi (URL), lấy tên file
  } else if (file instanceof File) {
    return file.name; // Nếu là File object, lấy tên file
  }
  return "unknown"; // Trường hợp khác
};

const updatePost = async () => {
  try {
    const formData = new FormData();
    formData.append("content", editedContent.value);

    // Thêm file cũ vẫn còn giữ lại
    editedFiles.value.forEach((file) => {
      if (typeof file === "string") {
        formData.append("existingFiles[]", file);
      } else {
        formData.append("files", file); // File mới là File object
      }
    });

    // Xác định file đã bị xóa
    const removedFiles = originalFiles.value.filter(file => !editedFiles.value.includes(file));
    if (removedFiles.length > 0) {
      formData.append("removedFiles", JSON.stringify(removedFiles));
    }

    await axios.put(`http://localhost:5000/api/posts/${props.post._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    toast.success("Bài viết đã được cập nhật!");
    emit("updated");
    emit("close");
  } catch (error) {
    toast.error("Lỗi khi cập nhật bài viết!");
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

.popup-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.file-list {
  margin-top: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.file-thumbnail {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.remove-file {
  background: red;
  color: white;
  border: none;
  padding: 2px 5px;
  cursor: pointer;
}
</style>
