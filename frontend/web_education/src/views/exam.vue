<template>
  <div class="quiz-container" v-if="submission && quiz">
    <div class="sticky-header">
      <div class="top-bar">
        <span class="timer">⏳ Còn lại: {{ formattedTime }}</span>
        <button @click="submitQuiz" class="submit-btn">Nộp bài</button>
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
let timer = null;
const classId = ref(localStorage.getItem("classId") || route.params.id);
const formattedTime = computed(() => {
  const min = Math.floor(remainingTime.value / 60);
  const sec = remainingTime.value % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
});

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
  try {
    await axios.post(`http://localhost:5000/api/quizzes/${submission.value._id}/submit`);
    toast.success("Đã nộp bài!");
    router.push("/"); // trang kết quả
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

onMounted(() => {
  fetchSubmission();

  // Chống chuyển tab
//   document.addEventListener("visibilitychange", () => {
//     if (document.hidden) {
//       toast.warning("Không được chuyển tab khi đang làm bài!");
//     }
//   });
});

onUnmounted(() => {
  clearInterval(timer);
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

</style>
