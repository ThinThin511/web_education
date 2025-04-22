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

        // Kiểm tra nếu có đường dẫn cần chuyển hướng
        const redirectPath = localStorage.getItem("redirectPath");
        if (redirectPath) {
          localStorage.removeItem("redirectPath"); // Xóa sau khi dùng
          window.location.href = redirectPath; // Chuyển hướng ngay lập tức
        } else {
          window.location.href = "/"; // Nếu không có đường dẫn trước đó thì về trang chính
        }
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
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Không có token");

        const response = await axios.get(
          "http://localhost:5000/api/auth/user",
          {
            headers: {
              Authorization: token,
            },
          }
        );

        // Thêm id từ _id để tiện sử dụng
        const userWithId = { ...response.data, id: response.data._id };

        this.user = userWithId;
        localStorage.setItem("user", JSON.stringify(userWithId));
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
      }
    },
  },
});
