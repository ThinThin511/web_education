import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import ProfileView from "@/views/ProfileView.vue";
import RegisterView from "@/views/RegisterView.vue";
import HomePage from "@/views/HomePage.vue";
import ChangePassword from "@/views/ChangePassword.vue";
import ClassPeople from "@/views/ClassPeople.vue";

const routes = [
  {
    path: "/",
    component: HomePage,
    meta: { requiresAuth: true, title: "Lớp học" },
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Điều hướng nếu chưa đăng nhập
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (!token && to.path !== "/login" && to.path !== "/register") {
    next("/login");
  } else {
    next();
  }
});

export default router;
