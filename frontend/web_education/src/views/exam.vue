<template>
  <div class="quiz-container" v-if="submission && quiz">
    <div class="sticky-header">
      <div class="top-bar">
        <span class="timer">⏳ Còn lại: {{ formattedTime }}</span>
        <button @click="showSubmitConfirm = true" class="submit-btn">Nộp bài</button>
      </div>
      
    </div>
    <div class="title">
        <h1 class="quiz-title">{{ quiz.title }}</h1>
        <div class="des">
            <p>Số câu: {{ quiz?.questions?.length }} </p>
            <p>Thời gian: {{ quiz?.duration }} phút </p>
        </div>
    </div>
    
    <div v-for="(q, index) in quiz.questions" :key="index" class="question">
      <p><strong>Câu {{ index + 1 }}:</strong> {{ q.questionText }}</p>
      <div class="options">
        <label v-for="opt in ['A', 'B', 'C', 'D']" :key="opt">
          <input
            type="radio"
            :name="'q' + index"
            :value="opt"
            v-model="answers[index]"
            @change="saveAnswer(index, opt)"
          />
          {{ opt }}. {{ q.options[opt] }}
        </label>
      </div>
    </div>
  </div>
  
  <div v-if="showSubmitConfirm" class="modal-overlay">
  <div class="modal">
    <h3 style="text-align: center;">Xác nhận nộp bài</h3>
    <p>Xem lại bài làm:</p>
    <div class="question-grid">
      <div
        v-for="(a, i) in answers"
        :key="i"
        class="qbox"
        :class="{ answered: a !== '', unanswered: a === '' }"
      >
        {{ i + 1 }}
      </div>
    </div>
    <div class="modal-actions">
      <button @click="handleFinalSubmit" class="submit-btn">Xác nhận nộp</button>
      <button @click="showSubmitConfirm = false" class="cancel-btn">Huỷ</button>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted , computed} from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/auth";
const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const userId = authStore.user?.id;
const quiz = ref(null);
const submission = ref(null);
const answers = ref([]);
const remainingTime = ref(0);
const isSubmitted = ref(false);
const warningCount = ref(0);
const maxWarnings = 3;
let timer = null;
const classId = ref(localStorage.getItem("classId") || route.params.id);
const formattedTime = computed(() => {
  const min = Math.floor(remainingTime.value / 60);
  const sec = remainingTime.value % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
});
const showSubmitConfirm = ref(false);
const unansweredQuestions = computed(() =>
  answers.value
    .map((a, i) => (a === "" ? i + 1 : null))
    .filter((v) => v !== null)
);
const handleFinalSubmit = () => {
  showSubmitConfirm.value = false;
  submitQuiz(); // gọi hàm nộp thật
};
const fetchSubmission = async () => {
  try {
    const quizAssignmentId = route.params.quizAssignmentId;
    const studentId = userId; 

    const res = await axios.post("http://localhost:5000/api/quizzes/start", {
  quizAssignmentId,
  studentId,
});

submission.value = res.data.submission;
quiz.value = res.data.quiz;

// Khởi tạo đáp án đã chọn
answers.value = Array(quiz.value.questions.length).fill("");
submission.value.answers.forEach((a) => {
  answers.value[a.questionIndex] = a.selectedOption;
});

const startedAt = new Date(submission.value.startedAt);
const now = new Date();
const duration = quiz.value.duration * 60;
const elapsed = Math.floor((now - startedAt) / 1000);
remainingTime.value = Math.max(0, duration - elapsed);

startCountdown();
  } catch (err) {
    toast.error(err.response?.data?.message || "Không thể bắt đầu làm bài.");
    router.push(`/class/${classId.value}/quiz`);
  }
};

const saveAnswer = async (index, option) => {
  try {
    await axios.patch(`http://localhost:5000/api/quizzes/${submission.value._id}/answer`, {
      questionIndex: index,
      selectedOption: option,
    });
  } catch (err) {
    toast.error("Lưu đáp án thất bại.");
  }
};

const submitQuiz = async () => {
  if (isSubmitted.value) return;
  try {
    await axios.post(`http://localhost:5000/api/quizzes/${submission.value._id}/submit`);
    isSubmitted.value = true; // <-- Cập nhật flag
    document.removeEventListener("visibilitychange", visibilityHandler);
    toast.success("Đã nộp bài!");
    router.push(`/examination/${route.params.quizAssignmentId}`); // trang kết quả
  } catch (err) {
    toast.error("Lỗi khi nộp bài.");
  }
};

const startCountdown = () => {
  timer = setInterval(() => {
    if (remainingTime.value <= 0) {
      clearInterval(timer);
      submitQuiz();
    } else {
      remainingTime.value--;
    }
  }, 1000);
};
let visibilityHandler = null;
onMounted(() => {
  fetchSubmission();
  warningCount.value = parseInt(localStorage.getItem("warningCount") || "0");
  // Chống chuyển tab
  visibilityHandler = () => {
  if (!isSubmitted.value && document.hidden) {
    warningCount.value++;

    if (warningCount.value >= maxWarnings) {
      toast.error("Bạn đã chuyển tab quá nhiều lần. Bài làm sẽ bị nộp.");
      submitQuiz();
    } else {
      toast.warning(`Không được chuyển tab! Bạn còn ${maxWarnings - warningCount.value} lần.`);
    }
  }
};

  document.addEventListener("visibilitychange", visibilityHandler);
});

onUnmounted(() => {
  clearInterval(timer);
  document.removeEventListener("visibilitychange", visibilityHandler);
});
</script>

<style scoped>
.quiz-container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  padding-top: 120px; /* chừa khoảng cho phần sticky */
}

.sticky-header {
  background: #f0f4ff;
  padding: 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  text-align: center;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  text-align: center;
  padding: 20px 0;
  background-color: #d1ffcb; /* Nền nhẹ */
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quiz-title {
  font-size: 28px;
  color: #004489;
  margin-bottom: 10px;
}

.des {
  width: 40%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.des p {
  margin: 0;
  font-size: 16px;
  color: #34495e;
  font-weight: 500;
}
.timer {
  font-size: 18px;
  font-weight: bold;
  color: #16a34a;
}

.submit-btn {
  padding: 8px 16px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.quiz-title {
  margin-top: 12px;
  font-size: 24px;
  font-weight: bold;
}

.question {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 50px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #3b82f6; /* màu xanh học tập */
}

.question p {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
  color: #1e293b;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.options label {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #f1f5f9;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  font-size: 15px;
  color: #334155;
}

.options label:hover {
  background-color: #e0e7ff;
  border-color: #6366f1;
}

.options input[type="radio"] {
  accent-color: #3b82f6;
  transform: scale(1.2);
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
    display: block !important;
  opacity: 1 !important;
  z-index: 9999 !important;
  background: white;
  padding: 24px;
  width: 90%;
  max-width: 700px;
  border-radius: 12px;
  position: relative;
  max-height: 80vh;
  height: fit-content;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}


.modal h3 {
  margin-bottom: 12px;
  font-size: 20px;
  color: #1e293b;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 40px);
  gap: 8px;
  margin: 12px 0;
}

.qbox {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.answered {
  background: #4ade80;
  color: white;
}

.unanswered {
  background: #f87171;
  color: white;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn {
  background: #e2e8f0;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

</style>
