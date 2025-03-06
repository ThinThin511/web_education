<template>
  <Teleport to="body">
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2>Tạo lớp học</h2>
        <form @submit.prevent="createClass">
          <div class="form-group">
            <label>Tên lớp học</label>
            <input v-model="className" type="text" required class="form-control" />
          </div>

          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="description" class="form-control"></textarea>
          </div>

          <div class="form-group">
            <label>Mã lớp học</label>
            <input v-model="classCode" type="text" class="form-control" readonly />
            <button type="button" class="btn btn-secondary" @click="generateClassCode">Tạo lại mã</button>
          </div>

          <div class="form-group">
            <label>Ảnh lớp học (Không bắt buộc)</label>
            <input type="file" @change="uploadImage" class="form-control" />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">Đang tạo...</span>
            <span v-else>Tạo lớp</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Hủy</button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();
const emit = defineEmits(["close", "classCreated"]);
const className = ref("");
const description = ref("");
const classCode = ref("");
const image = ref(null);
const loading = ref(false);

const generateClassCode = () => {
  classCode.value = Math.random().toString(36).substring(2, 8).toUpperCase();
};

onMounted(() => {
  generateClassCode();
});

const uploadImage = (event) => {
  const file = event.target.files[0];
  if (file) {
    image.value = file;
  }
};

const createClass = async () => {
  try {
    loading.value = true;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      alert("Lỗi: Không tìm thấy thông tin người dùng!");
      return;
    }

    const formData = new FormData();
    formData.append("name", className.value);
    formData.append("description", description.value);
    formData.append("classCode", classCode.value);
    formData.append("creatorId", user.id); // Đảm bảo gửi đúng ID
    if (image.value) formData.append("image", image.value);

    console.log([...formData]); // Kiểm tra dữ liệu trước khi gửi

    const response = await axios.post("http://localhost:5000/api/classes/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert(response.data.message);
    className.value = "";
    description.value = "";
    generateClassCode();
    image.value = null;
    console.log("Đang phát sự kiện classCreated...");
    emit("classCreated"); // Thông báo cho component cha
    emit("close"); // Đóng popup
  } catch (error) {
    alert("Lỗi khi tạo lớp học");
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
</style>
