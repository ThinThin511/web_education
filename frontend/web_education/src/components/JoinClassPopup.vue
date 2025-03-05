<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal-content">
        <h2>Tham gia lớp học</h2>
        <form @submit.prevent="joinClass">
          <div class="form-group">
            <label>Mã lớp học</label>
            <input v-model="classCode" type="text" class="form-control" placeholder="Nhập mã lớp học" required />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">Đang tham gia...</span>
            <span v-else>Tham gia</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Hủy</button>
        </form>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const classCode = ref("");
const errorMessage = ref("");
const loading = ref(false);

const joinClass = async () => {
  if (!classCode.value) {
    errorMessage.value = "Vui lòng nhập mã lớp học!";
    return;
  }

  try {
    loading.value = true;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      alert("Lỗi: Không tìm thấy thông tin người dùng!");
      return;
    }

    const response = await axios.post("http://localhost:5000/api/classes/join", {
      classCode: classCode.value,
      userId: user.id,
    });

    if (response.data.success) {
      alert("Tham gia lớp thành công!");
      classCode.value = "";
      errorMessage.value = "";
      loading.value = false;
      emit("close");
    } else {
      errorMessage.value = response.data.message;
    }
  } catch (error) {
    errorMessage.value = "Lỗi khi tham gia lớp học!";
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

.error {
  color: red;
  margin-top: 10px;
}

.btn {
  margin-right: 10px;
}
</style>
