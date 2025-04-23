<template>
  <div class="popup-overlay">
    <div class="popup-content">
      <h2>Giao bài kiểm tra</h2>
      <form @submit.prevent="assignQuiz">
        <label>Chọn đề kiểm tra:</label>
        <select v-model="form.quizId" required>
          <option v-for="quiz in availableQuizzes" :key="quiz._id" :value="quiz._id">
            {{ quiz.title }}
          </option>
        </select>

        <label>Thời gian bắt đầu:</label>
        <input type="datetime-local" v-model="form.startTime"  required />

        <label>Thời gian kết thúc:</label>
        <input type="datetime-local" v-model="form.endTime" :min="minDueDate" required />

        <label>Số lần làm tối đa:</label>
        <input type="number" v-model="form.maxAttempts" min="1" required />
        <label>
          <input type="checkbox" v-model="form.allowReview" />
          Cho phép xem lại bài làm
        </label>
        <button type="submit">Giao bài</button>
        <button @click.prevent="$emit('close')">Hủy</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref,onMounted, computed } from "vue";
import axios from "axios";
import { useToast } from "vue-toastification";

const props = defineProps({
  availableQuizzes: Array,
  classId: String,
  editingQuiz: Object
});

const emit = defineEmits(["close", "assigned"]);

const toast = useToast();
const minDueDate = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // xử lý timezone cho đúng định dạng
  return now.toISOString().slice(0, 16); // format YYYY-MM-DDTHH:mm
});
const form = ref({
  quizId: "",
  startTime: "",
  endTime: "",
  maxAttempts: 1,
  allowReview: false,
});

const assignQuiz = async () => {
    const start = new Date(form.value.startTime);
    const end = new Date(form.value.endTime);
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      alert("Lỗi: Không tìm thấy thông tin người dùng!");
      return;
    }
    if (end <= start) {
        toast.error("Thời gian kết thúc phải sau thời gian bắt đầu!");
        return;
    }
  try {
    const payload = {
      userId:user.id,
      quizId: form.value.quizId,
      classId: props.classId,
      startTime: new Date(form.value.startTime),
      endTime: new Date(form.value.endTime),
      maxAttempts: form.value.maxAttempts,
      allowReview: form.value.allowReview,
    };

    if (props.editingQuiz) {
      // Update
      await axios.put(`http://localhost:5000/api/quizzes/assign/${props.editingQuiz._id}`, payload);
      toast.success("Cập nhật bài kiểm tra thành công!");
    } else {
      // Create
      await axios.post("http://localhost:5000/api/quizzes/assign", payload);
      toast.success("Đã giao bài kiểm tra!");
    }
    emit("assigned", payload);
    emit("close");
  } catch (err) {
    console.error(err);
    toast.error("Giao bài kiểm tra thất bại!");
  }
};
function formatDateForInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
onMounted(() => {
  if (props.editingQuiz) {
    form.value.quizId = props.editingQuiz.quizId._id;
    form.value.startTime = formatDateForInput(props.editingQuiz.startTime);
    form.value.endTime = formatDateForInput(props.editingQuiz.endTime);
    form.value.maxAttempts = props.editingQuiz.maxAttempts;
    form.value.allowReview = props.editingQuiz.allowReview ?? false;
  }
});
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 0 12px rgba(0,0,0,0.15);
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input, select {
  padding: 8px;
  font-size: 16px;
}

button {
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background-color: #3b82f6;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #2563eb;
}
</style>
