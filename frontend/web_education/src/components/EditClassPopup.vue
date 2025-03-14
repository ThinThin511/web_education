<template> 
  <Teleport to="body">
    <div class="modal-backdrop" v-if="isOpen">
      <div class="modal-content">
        <h2>Cập nhật lớp học</h2>
        <form @submit.prevent="updateClass">
          <div class="form-group">
            <label>Tên lớp học</label>
            <input v-model="className" type="text" required class="form-control" />
          </div>

          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="description" class="form-control" value="{{ className.value }}"></textarea>
          </div>

          <div class="form-group">
            <label>Mã lớp học</label>
            <input v-model="classCode" type="text" class="form-control" readonly />
            <button type="button" class="btn btn-secondary" @click="generateClassCode">Tạo lại mã</button>
          </div>

          <div class="form-group">
            <label>Ảnh lớp học (Không bắt buộc)</label>
            <input type="file" @change="uploadImage" class="form-control" />
            <!-- Hiển thị ảnh cũ nếu có -->
            <div v-if="previewImage || classImage" class="image-preview">
                <img :src="previewImage || classImage" alt="Ảnh lớp học" class="preview" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">Đang cập nhật...</span>
            <span v-else>Cập nhật</span>
          </button>
          <button type="button" class="btn btn-danger" @click="deleteClass" :disabled="loading">
            <span v-if="loading">Đang xóa...</span>
            <span v-else>Xóa lớp</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Hủy</button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";

const router = useRouter();

const toast = useToast();

const props = defineProps(["classData", "isOpen"]);
const emit = defineEmits(["close", "classUpdated"]);

const className = ref("");
const description = ref("");
const classCode = ref("");
const image = ref(null);
const loading = ref(false);

const classImage = ref("");
const generateClassCode = () => {
  classCode.value = Math.random().toString(36).substring(2, 8).toUpperCase();
};

watch(
  () => props.classData,
  (newData) => {
    if (newData) {
      className.value = newData.name;
      description.value = newData.description;
      classCode.value = newData.classCode;
      classImage.value = newData.image; // Lưu ảnh cũ
    }
  },
  { immediate: true }
);

const previewImage = ref(null);

const uploadImage = (event) => {
  const file = event.target.files[0];
  if (file) {
    previewImage.value = URL.createObjectURL(file);
    image.value = file;
  }
};

const updateClass = async () => {
  try {
    loading.value = true;
    const formData = new FormData();
    formData.append("name", className.value);
    formData.append("description", description.value);
    formData.append("classCode", classCode.value);
    if (image.value) formData.append("image", image.value);

    await axios.put(`http://localhost:5000/api/classes/${props.classData._id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Cập nhật thành công!");
    emit("classUpdated");
    emit("close");
  } catch (error) {
    alert("Lỗi khi cập nhật lớp học!");
    console.error(error);
  } finally {
    loading.value = false;
  }
};
const deleteClass = async () => {
  if (!confirm("Bạn có chắc chắn muốn xóa lớp này?")) return;

  try {
    loading.value = true;
    await axios.delete(`http://localhost:5000/api/classes/${props.classData._id}`);

    toast.success("Xóa lớp thành công!");
    emit("classUpdated");
    emit("close");
    
    router.push("/"); // Chuyển hướng về trang chủ
  } catch (error) {
    toast.error("Lỗi khi xóa lớp!");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
}

.form-group {
  margin-bottom: 15px;
}

.btn {
  margin-right: 10px;
}
.image-preview {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview img {
  width: 100%;
  max-width: 300px; /* Giới hạn kích thước ảnh */
  height: 200px;
  border-radius: 10px; /* Bo góc ảnh */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Thêm hiệu ứng đổ bóng */
  object-fit: cover;
}
</style>
