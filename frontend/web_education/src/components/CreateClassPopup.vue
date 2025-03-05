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

          <button type="submit" class="btn btn-primary">Tạo lớp</button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Hủy</button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from "vue";

const className = ref("");
const description = ref("");
const classCode = ref("");
const image = ref(null);

// Hàm tạo mã lớp học ngẫu nhiên
const generateClassCode = () => {
  classCode.value = Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Gọi tự động khi mở popup
onMounted(() => {
  generateClassCode();
});

const uploadImage = (event) => {
  const file = event.target.files[0];
  if (file) {
    image.value = file;
  }
};

const createClass = () => {
  const newClass = {
    id: classCode.value, // Dùng mã lớp học làm ID
    name: className.value,
    description: description.value,
    image: image.value,
    teacher: "Người tạo lớp",
  };
  console.log("Lớp học mới:", newClass);
  alert("Lớp học đã được tạo!");
  className.value = "";
  description.value = "";
  generateClassCode(); // Reset mã mới sau khi tạo lớp
  image.value = null;
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
