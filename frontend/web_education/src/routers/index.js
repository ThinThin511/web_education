import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import ProfileView from "@/views/ProfileView.vue";
import RegisterView from "@/views/RegisterView.vue";
import HomePage from "@/views/HomePage.vue";
import ChangePassword from "@/views/ChangePassword.vue";
import ClassPeople from "@/views/ClassPeople.vue";
import ClassAssignment from "@/views/ClassAssignment.vue";
import ClassFeed from "@/views/ClassFeed.vue";
import JoinLink from "@/views/JoinLink.vue";
import JoinTeacher from "@/views/JoinTeacher.vue";
import { useToast } from "vue-toastification";
import PostDetail from "@/views/PostDetail.vue";
import AssignmentDetail from "@/views/AssignmentDetail.vue";
import MyTeaching from "@/views/MyTeaching.vue";
import Reminder from "@/views/Reminder.vue";
import QuizList from "@/views/QuizList.vue";
import ClassQuiz from "@/views/ClassQuiz.vue";
import Exam from "@/views/exam.vue";
import ExamDetail from "@/views/ExamDetail.vue";
import ExamDetailTest from "@/views/ExamDetailTest.vue";
import Chat from "@/views/Chat.vue";
import Conversation from "@/views/Conversation.vue";

const toast = useToast();

const routes = [
  {
    path: "/",
    component: HomePage,
    meta: { requiresAuth: true, title: "Lớp học" },
  },
  {
    path: "/myteaching",
    component: MyTeaching,
    meta: { title: "Giảng dạy" },
  },
  {
    path: "/reminder",
    component: Reminder,
    meta: { title: "Lời nhắc" },
  },
  {
    path: "/exam",
    component: QuizList,
    meta: { title: "Bài kiểm tra" },
  },
  {
    path: "/examinate/:quizAssignmentId",
    component: Exam,
    meta: { title: "Kiểm tra" },
  },
  {
    path: "/examination/:quizAssignmentId",
    component: ExamDetail,
    meta: { title: "Kết quả kiểm tra" },
  },
  {
    path: "/examination/:quizAssignmentId/detail",
    component: ExamDetailTest,
    meta: { title: "Kết quả kiểm tra" },
  },
  { path: "/register", component: RegisterView },
  { path: "/login", component: LoginView },
  {
    path: "/edituser",
    component: ProfileView,
    meta: { title: "Cập nhật thông tin" },
  },
  {
    path: "/changepassword",
    component: ChangePassword,
    meta: { title: "Thay đổi mật khẩu" },
  },
  {
    path: "/class/:id/people",
    component: ClassPeople,
    meta: { title: "Mọi người" },
  },
  {
    path: "/class/:id/feed",
    component: ClassFeed,
    meta: { title: "Bảng tin" },
  },
  {
    path: "/class/:id/assignments",
    component: ClassAssignment,
    meta: { title: "Bài tập trên lớp" },
  },
  {
    path: "/class/:id/quiz",
    component: ClassQuiz,
    meta: { title: "Bài kiểm tra" },
  },
  {
    path: "/post/:postId",
    component: PostDetail,
    meta: { title: "Chi tiết bảng tin" },
  },
  {
    path: "/assignment/:assignmentId",
    component: AssignmentDetail,
    meta: { title: "Chi tiết bài tập" },
  },
  {
    path: "/join/:classId",
    component: JoinLink,
    meta: { title: "" },
  },
  {
    path: "/join-teacher/:inviteCode",
    component: JoinTeacher,
    meta: { title: "" },
  },
  {
    path: "/messages/:receiverId",
    component: Chat,
    meta: { title: "Tin nhắn" },
  },
  {
    path: "/conversations",
    component: Conversation,
    meta: { title: "Tin nhắn" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Điều hướng nếu chưa đăng nhập
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (!token && to.path !== "/login" && to.path !== "/register") {
    localStorage.setItem("redirectPath", to.fullPath); // Lưu lại đường dẫn trước khi chuyển hướng
    toast.error("Bạn cần đăng nhập để tiếp tục!");
    setTimeout(() => {
      next("/login"); // Chờ 2 giây rồi mới chuyển hướng
    }, 2000);
  } else {
    next();
  }
});

export default router;
