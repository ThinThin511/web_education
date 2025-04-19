<template>
  <Teleport to="body">
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2 style="text-align: center;">Tạo bài kiểm tra</h2>
        <form @submit.prevent="createQuiz">
          <div class="form-group">
            <label for="title">Tiêu đề</label>
            <input id="title" v-model="form.title" type="text" required class="form-control" />
          </div>

          <div class="form-group">
            <label for="description">Mô tả</label>
            <textarea id="description" v-model="form.description" required class="form-control"></textarea>
          </div>

          <div class="form-group">
            <label for="duration">Thời lượng (phút)</label>
            <input id="duration" v-model="form.duration" type="number" required class="form-control" />
          </div>
          <div v-for="(q, index) in form.questions" :key="index" class="question-block">
            <h4>Câu hỏi {{ index + 1 }}</h4>
            <div class="form-group">
                <label>Nội dung</label>
                <input v-model="q.questionText" type="text" class="form-control" required />
            </div>

            <div class="form-group" v-for="optKey in ['A', 'B', 'C', 'D']" :key="optKey">
                <label>
                    <input
                    type="radio" required
                    :name="'correct-' + index"   
                    :value="optKey"
                    v-model="q.correctAnswer"
                    />
                    {{ optKey }}.
                    <input
                    v-model="q.options[optKey]"
                    type="text" required
                    class="form-control"
                    placeholder="Nhập đáp án"
                    />
                </label>
            </div>

            <button type="button" class="btn btn-danger" @click="removeQuestion(index)">Xóa câu hỏi</button>
            <hr />
        </div>

        <button type="button" class="btn btn-secondary" @click="addQuestion">+ Thêm câu hỏi</button>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Lưu</button>
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Huỷ</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref,watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from "@/stores/auth";


const authStore = useAuthStore();
const currentUser = ref(authStore.user);

const props = defineProps({
  creatorId: String,
  editData: Object
})

const emit = defineEmits(['close', 'created'])

const form = ref({
  title: '',
  description: '',
  duration: '',
  creatorId: currentUser.value.id,
  questions: []
})
const addQuestion = () => {
  form.value.questions.push({
  questionText: '',
  options: {
    A: '',
    B: '',
    C: '',
    D: '',
  },
  correctAnswer: ''
})
};

const removeQuestion = (index) => {
  form.value.questions.splice(index, 1)
}
const createQuiz = async () => {
  try {
    if (props.editData?._id) {
      // CẬP NHẬT quiz
      const res = await axios.put(`http://localhost:5000/api/quizzes/${props.editData._id}`, form.value);
      emit('updated', res.data.updatedQuiz);
      
    } else {
      // TẠO quiz mới
      const res = await axios.post('http://localhost:5000/api/quizzes/create', form.value);
      emit('created', res.data.quiz);
      
    }
    emit('close')
  } catch (err) {
    console.error('Lỗi tạo bài kiểm tra', err)
    alert('Đã có lỗi xảy ra, vui lòng thử lại.')
  }
}
watch(() => props.editData, (newVal) => {
  if (newVal) {
    // Deep copy và đảm bảo options luôn đầy đủ
    form.value = {
      ...newVal,
      questions: newVal.questions.map(q => ({
        questionText: q.questionText || '',
        correctAnswer: q.correctAnswer || '',
        options: {
          A: q.options?.A || '',
          B: q.options?.B || '',
          C: q.options?.C || '',
          D: q.options?.D || '',
        }
      }))
    };
  }
}, { immediate: true });
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
  z-index: 999;
}

.modal-content {
  background: #fefefe;
  padding: 24px;
  border-radius: 12px;
  width: 80%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #1e3a8a; /* deep blue */
}

.form-group label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  border-color: #3b82f6; /* blue-500 */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.question-block {
    margin-top: 20px;
  margin-bottom: 20px;
  background: #e0f2fe; /* light blue background */
  padding: 16px;
  border-radius: 8px;
  border-left: 5px solid #0284c7; /* cyan-600 */
}

.question-block h4 {
  margin-bottom: 12px;
  color: #0f172a;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: #2563eb; /* blue-600 */
  margin-top: 10px;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
    margin-top: 10px;
  background-color: #e5e7eb; /* gray-200 */
  color: #111827;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-danger {
  background-color: #ef4444; /* red-500 */
  color: white;
  margin-top: 8px;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style>
