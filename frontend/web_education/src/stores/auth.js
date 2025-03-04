import { defineStore } from "pinia";
import axios from "axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null, // Nạp user từ localStorage
    token: localStorage.getItem("token") || null,
  }),
  actions: {
    async register(userData) {
      try {
        await axios.post("http://localhost:5000/api/auth/register", userData);
      } catch (error) {
        console.error(
          "Lỗi đăng ký:",
          error.response?.data?.message || error.message
        );
        throw error;
      }
    },
    async login(userData) {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/auth/login",
          userData
        );
        this.user = response.data.user;
        this.token = response.data.token;

        // Lưu user và token vào localStorage
        localStorage.setItem("user", JSON.stringify(this.user));
        localStorage.setItem("token", this.token);
      } catch (error) {
        console.error(
          "Lỗi đăng nhập:",
          error.response?.data?.message || error.message
        );
        throw error;
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    async fetchUser() {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/user",
          {
            headers: {
              Authorization: localStorage.getItem("token"),
            },
          }
        );
        this.user = response.data;
        localStorage.setItem("user", JSON.stringify(this.user));
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
      }
    },
  },
});
