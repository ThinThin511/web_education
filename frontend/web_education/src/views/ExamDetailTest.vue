<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div class="nav-links" v-if="isTeacher">
            <router-link :to="`/examination/${route.params.quizAssignmentId}`" active-class="active">Tổng quan</router-link>
            <router-link :to="`/examination/${route.params.quizAssignmentId}/detail`" active-class="active">Chi tiết</router-link>
          </div>
          <!-- Thông tin chung -->
        <div class="summary">
          <h2>{{ quiz?.title }}</h2>
          
        </div>

        
        <div 
            v-for="(q, index) in quiz?.questions" 
            :key="index" 
            class="question-card"
            >
            <div class="left-content">
            <h3>Câu {{ index + 1 }}: {{ q.questionText }}</h3> 
            <ul class="options">
                <li 
                v-for="(label, key) in q.options" 
                :key="key"
                :class="{
                    'correct-answer': key === q.correctAnswer
                }"
                >
                <span class="label">{{ key }}.</span> {{ label }}
                <span v-if="key === q.correctAnswer" class="icon correct-answer">✔</span>
                </li>
            </ul>
            </div>
            <div  class="chart">
                <canvas :id="'chart-' + index" height="200"></canvas>
            </div>
            
            </div>
        
      </section>
    </main>
  </div>
</template>
<script setup>
import { ref, onMounted,computed,watch,nextTick,watchEffect } from "vue";
import { useRoute, useRouter} from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";
import defaultAvatar from "@/assets/avatar.png";
import EditPostPopup from "@/components/EditPostPopup.vue";
import defaultImage from "@/assets/nen.jpg";
import defaulticon from "@/assets/default-icon.png";
import pdf from "@/assets/pdf-icon.png";
import excel from "@/assets/excel-icon.png";
import word from "@/assets/word-icon.png";
import { useToast } from "vue-toastification";
import QuizSubmissionDetail from "@/components/QuizSubmissionDetail.vue";
import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(ChartDataLabels);


const chartRef = ref(null)
let chartInstance = null


const authStore = useAuthStore();
const currentUser = ref(authStore.user); 
const userId = currentUser.value.id;
const teachers = ref([]);
const students = ref([]);
const classroom = ref(null);
const classId = ref(localStorage.getItem("classId") || route.params.id);
const fetchClassPeople = async () => {
  try {
    
    const response = await axios.get(`http://localhost:5000/api/classes/${classId.value}/people`);
    teachers.value = response.data.teachers;
    students.value = response.data.students;
    classroom.value = response.data.classroom;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thành viên:", error);
  }
};
const isTeacher = computed(() => {
  return teachers.value.some(teacher => teacher._id === currentUser.value.id);
});
const route = useRoute();
const assignment = ref(null);
const comments = ref([]);
const newComment = ref("");
const selectedFiles = ref([]);
const toast = useToast();
const replyTexts = ref({});
const showReplyInput = ref({});
const router = useRouter();
const quiz = ref(null);
const submissions = ref([]);

const fetchResults = async () => {
  const quizAssignmentId = route.params.quizAssignmentId;
  const { data } = await axios.get(`http://localhost:5000/api/quizzes/result/${quizAssignmentId}?studentId=${userId}`);
  quiz.value = data.quiz;
  submissions.value = data.submissions;
};
const allSubmissions = ref([])

const fetchAllSubmissions = async () => {
  const quizAssignmentId = route.params.quizAssignmentId;
  try {
    const { data } = await axios.get(`http://localhost:5000/api/quizzes/submissions/${quizAssignmentId}`);
    allSubmissions.value = data;
    console.log("✅ allSubmissions sau fetch:", allSubmissions.value);
    console.log("✅ Điểm từng bài nộp:", allSubmissions.value.map(s => s.score));
  } catch (err) {
    console.error("Lỗi khi lấy danh sách bài nộp:", err);
  }
}
console.log(allSubmissions);
const formatDate = (iso) => {
  return new Date(iso).toLocaleString("vi-VN");
};



const questionsWithStats = computed(() => {
  console.log("📌 quiz.questions:", quiz.value?.questions);
  console.log("📌 allSubmissions:", allSubmissions.value);

  if (!quiz.value?.questions || !allSubmissions.value) return [];

  return quiz.value.questions.map((q, index) => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };

    allSubmissions.value.forEach(submission => {
      const answer = submission.answers.find(a => a.questionIndex === index);
      const selected = answer?.selectedOption;
      if (selected && counts[selected] !== undefined) {
        counts[selected]++;
      }
    });

    return {
      ...q,
      selectedCount: counts
    };
  });
});
console.log(questionsWithStats.value)
watch(questionsWithStats, async (newVal) => {
  if (newVal.length > 0) {
    await nextTick()
    renderAllCharts()
  }
}, { immediate: true })

function renderAllCharts() {
  console.log("🧠 Rendering charts...");
  questionsWithStats.value.forEach((q, index) => {
    console.log(`📊 Q${index + 1}`, q.selectedCount);

    const ctx = document.getElementById(`chart-${index}`);
    if (!ctx) {
      console.warn("⛔️ Không tìm thấy canvas cho chart index:", index);
      return;
    }

    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    const counts = Object.keys(q.options).map(key => q.selectedCount?.[key] || 0);
    const total = counts.reduce((a, b) => a + b, 0);

    const data = {
      labels: Object.keys(q.options),
      datasets: [
        {
          data: counts,
          backgroundColor: ['#3498db', '#2ecc71', '#e67e22', '#e74c3c']
        }
      ]
    };

    const chart = new Chart(ctx, {
      type: 'pie',
      data,
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          },
          datalabels: {
            formatter: (value) => {
              const percentage = total > 0 ? (value / total * 100).toFixed(1) + '%' : '';
              return percentage;
            },
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    ctx.chartInstance = chart;
  });
}

onMounted(()=>{
  fetchClassPeople();
  fetchResults();
  fetchAllSubmissions();
  
});
</script>
<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column; /* Xếp nội dung theo chiều dọc */
  align-items: center; /* Căn giữa nội dung */
  max-width: 90%;
  padding: 20px;
}
/* Link điều hướng */
.nav-links {
  display: flex;
  left: 0;
  gap: 30px;
}

.nav-links a {
  text-decoration: none;
  color: black;
  font-size: 16px;
  padding-bottom: 5px;
  position: relative;
}

.nav-links a.active {
  color: blue;
  font-weight: bold;
}

.nav-links a.active::after {
  content: "";
  display: block;
  width: 100%;
  height: 3px;
  background: blue;
  position: absolute;
  bottom: -3px;
  left: 0;
}
.tooltip-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 16px;
  cursor: pointer;
}

.tooltip-wrapper .tooltip {
  visibility: hidden;
  opacity: 0;
  background-color: #fff;
  color: #333;
  text-align: left;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  position: absolute;
  z-index: 1;
  top: 120%;
  left: 0;
  min-width: 200px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  transition: opacity 0.3s ease;
  overflow-y: auto;
  max-height: 25vh;
}

.tooltip-wrapper:hover .tooltip {
  visibility: visible;
  opacity: 1;
}
.result-page {
  min-width: 80%;
  margin: 0 auto;
  padding: 20px;
}
.quiz-info {
  background: #f0f9ff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.teacher-submissions .submission-section{
  max-height: 60vh;
  overflow-y: auto;
}
.submission-table {
  width: 100%;
  border-collapse: collapse;
  
}
.submission-table th,
.submission-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: center;
}
.submission-table th {
  background-color: #3b82f6;
  color: white;
}
button {
  padding: 6px 12px;
  border: none;
  background: #10b981;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}
.avatar {
  width: 50px;
  height: 50px;
  margin-right: 10px;
  border-radius: 50%;
  border: 2px solid #000000; /* Viền avatar giúp nổi bật hơn */
}
.submission-stats span {
  margin-left: 16px;
  font-size: 22px;
  color: #333;
}

.submission-stats {
  display: flex;
  gap: 20px;
  font-weight: 500;
  margin: 10px auto;
}
.card{
  margin-top: 16px;
}
.export-btn {
  background-color: #2d8cf0 !important;
  color: white !important;
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  width: 150px;
  margin: 0 auto;
}
.correct-answer {
  background-color: #e0ffe0;
  font-weight: bold;
}
.icon.correct-answer {
  color: green;
  margin-left: 8px;
}
.summary {
  background-color: #f0f8ff; /* xanh nhạt như giấy */
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  text-align: center;
  min-width: 80%;
  margin-top: 20px;
}

.summary h2 {
  font-size: 24px;
  color: #2c3e50;
  font-weight: 600;
  margin: 0;

}

.question-card {
    display: flex;
    justify-content: space-between;
  background-color: #ffffff;
  border-left: 6px solid #3498db;
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.04);
  min-width: 60%;
}

.question-card h3 {
  margin-bottom: 10px;
  color: #34495e;
  font-size: 18px;
}

.options {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.options li {
  background-color: #f9f9f9;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
}

.options li .label {
  font-weight: bold;
  margin-right: 8px;
  color: #555;
}

.options li.correct-answer {
  background-color: #e6ffed;
  border: 1px solid #2ecc71;
  font-weight: bold;
  color: #2e7d32;
}

.icon.correct-answer {
  margin-left: auto;
  color: #2ecc71;
  font-size: 18px;
}
.question-container {
  display: flex;
  align-items: flex-start;
  gap: 20px; /* Khoảng cách giữa phần nội dung và biểu đồ */
}
.left-content {
  flex: 1;
}
.chart {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

</style>