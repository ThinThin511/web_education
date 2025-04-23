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
        <div class="result-page" v-if="quiz">
            <div class="quiz-info card">
                <h2 class="title">{{ quiz.title }}</h2>
                <p>{{ quiz.description }}</p>
                <p><strong>⏱️ Thời gian làm bài:</strong> {{ quiz.duration }} phút</p>
                <p><strong>📋 Số câu hỏi:</strong> {{ quiz?.questions?.length }}</p>
            </div>
            <div class="kqhs" v-if="!isTeacher">
            <div class="submission-section card" v-if="submissions?.length > 0 ">
                <h3 class="section-title">📊 Kết quả kiểm tra</h3>
                <table class="submission-table">
                <thead>
                    <tr>
                    <th>Lần</th>
                    <th>Thời gian nộp</th>
                    <th>Điểm</th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(sub, index) in submissions" :key="sub._id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ formatDate(sub.submittedAt) }}</td>
                    <td>{{ sub.score }}/10</td>
                    <td>
                        <button v-if="sub.allowReview" class="view-btn" @click="viewDetail(sub._id)">Xem chi tiết</button>
                    </td>
                    </tr>
                </tbody>
                </table>
            </div>

            <div v-else class="card no-submission">
                <p style="text-align: center;">⚠️ Chưa có bài nộp nào.</p>
            </div>
            </div>
        
        <!-- Bảng kết quả của tất cả học sinh -->
        <div class="teacher-submissions card" v-if="isTeacher && allSubmissions.length > 0">
        <h3 class="section-title">📚 Danh sách bài nộp của học sinh</h3>
        <button class="export-btn" @click="exportToExcel">📥 Xuất Excel</button>
        <div class="submission-stats">
            <div class="tooltip-wrapper">
            <span>Đã nộp: {{ submittedStudents.length }}</span>
            <div class="tooltip">
                
                <p v-for="s in submittedStudents" :key="s._id"><img :src="s?.avatar || defaultAvatar" class="avatar" />{{ s.fullname }}</p>
            </div>
            </div>

            <div class="tooltip-wrapper">
            <span>Chưa nộp: {{ notSubmittedStudents.length }}</span>
            <div class="tooltip">
                <p v-for="s in notSubmittedStudents" :key="s._id"><img :src="s?.avatar || defaultAvatar" class="avatar" />{{ s.fullname }}</p>
            </div>
            </div>
        </div>
        <table class="submission-table">
            <thead>
            <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Lần</th>
                <th>Điểm</th>
                <th>Thời gian nộp</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(sub, index) in allSubmissions" :key="sub._id">
                <td>{{ index + 1 }}</td>
                <td>{{ sub.studentId.fullname }}</td>
                <td>{{ sub.attempt }}</td>
                <td>{{ sub.score }}/10</td>
                <td>{{ formatDate(sub.submittedAt) }}</td>
                <td>
                <button class="view-btn" @click="viewDetails(sub._id)">Xem chi tiết</button>
                </td>
            </tr>
            </tbody>
        </table>
        </div>
        <div class="card" v-if="isTeacher && allSubmissions.length > 0">
            <h3 class="section-title">📈 Thống kê điểm</h3>
            <p style="text-align: center;"><strong>🎯 Điểm trung bình lớp:</strong> {{ averageScore }}</p>

            <!-- Biểu đồ phổ điểm -->
            <canvas ref="chartRef" width="400" height="200"></canvas>
            </div>
        </div>
        <QuizSubmissionDetail 
        v-if="showPopup"
        :show="showPopup"
        :quiz="quiz"
        :submission="selectedSubmission"
        @close="showPopup = false"
        />
        
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
import * as XLSX from 'xlsx';
import { Chart, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale);

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

const showPopup = ref(false)
const selectedSubmission = ref(null)

// ví dụ khi nhấn "Chi tiết"
const viewDetail = (submissionId) => {
  const sub = submissions.value.find(s => s._id === submissionId)
  selectedSubmission.value = sub
  showPopup.value = true
}
const viewDetails = (submissionId) => {
  const sub = allSubmissions.value.find(s => s._id === submissionId)
  selectedSubmission.value = sub
  showPopup.value = true
}

const submittedStudents = computed(() => {

  const submittedIds = allSubmissions.value.map(s => s.studentId?._id);
  
  return students.value.filter(s => submittedIds.includes(s._id));
});

const notSubmittedStudents = computed(() => {
  const submittedIds = allSubmissions.value.map(s => s.studentId?._id);
  return students.value.filter(s => !submittedIds.includes(s._id));
});
const averageScore = computed(() => {
  if (allSubmissions.value.length === 0) return 0;

  const total = allSubmissions.value.reduce((sum, sub) => sum + (sub.score || 0), 0);
  return (total / allSubmissions.value.length).toFixed(2);
});

const scoreDistribution = ref([]); // ✅ dùng ref để có thể gán giá trị
const renderChart = () => {
  console.log("🧪 Bắt đầu render chart");
  if (!chartRef.value) {
    console.warn("⚠️ Không tìm thấy chartRef");
    return;
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = chartRef.value.getContext('2d');
  console.log("🎯 Context chart:", ctx);
  console.log("📊 Dữ liệu phổ điểm:", scoreDistribution.value);
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: Array.from({ length: 11 }, (_, i) => i.toString()),
        datasets: [{
            label: 'Số học sinh',
            data: scoreDistribution.value.map(d => d.count), // <-- đây nè
            backgroundColor: '#2d8cf0'
        }]
        },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Phổ điểm lớp học',
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

const exportToExcel = () => {
  if (allSubmissions.value.length === 0) {
    toast.warning("Chưa có dữ liệu để xuất.");
    return;
  }

  const quizInfo = quiz.value;

  const data = allSubmissions.value.map((sub, index) => ({
    "STT": index + 1,
    "Họ tên": sub.studentId?.fullname,
    "Điểm": sub.score,
    "Thời gian nộp": formatDate(sub.submittedAt),
    "Lần nộp": sub.attempt
  }));

  const worksheet = XLSX.utils.json_to_sheet([], { origin: "A5" });

  // Tiêu đề
  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Tiêu đề: ${quizInfo?.title || ""}`],
    [`Mô tả: ${quizInfo?.description || ""}`],
    [`Thời gian làm bài: ${quizInfo?.duration || ""} phút`],
    [],
  ], { origin: "A1" });

  // Dữ liệu bảng
  XLSX.utils.sheet_add_json(worksheet, data, { origin: "A5", skipHeader: false });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng điểm");
  XLSX.writeFile(workbook, `${quizInfo?.title || 'BangDiem'}.xlsx`);
};

watch(allSubmissions, (val) => {
  const raw = val.map(s => Math.round(s.score || 0));
  const dist = Array(11).fill(0);
  raw.forEach(score => {
    if (score >= 0 && score <= 10) dist[score]++;
  });
  scoreDistribution.value = dist.map((count, score) => ({ score, count }));
  console.log(scoreDistribution.value);
  
});

onMounted(()=>{
  fetchClassPeople();
  fetchResults();
  fetchAllSubmissions();
  
});
watch(scoreDistribution, async (distribution) => {
  if (
    isTeacher.value &&
    allSubmissions.value.length > 0 &&
    distribution.length > 0
  ) {
    await nextTick();
    // Delay nhẹ đảm bảo canvas thực sự có mặt
    setTimeout(() => {
      if (!chartRef.value) {
        console.warn("⛔ chartRef chưa sẵn sàng sau delay");
        return;
      }
      console.log("✅ chartRef OK -> renderChart()");
      renderChart();
    }, 50); // delay 50ms đảm bảo canvas đã vào DOM
  }
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

</style>