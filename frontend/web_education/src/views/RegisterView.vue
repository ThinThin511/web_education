<template>
  <div class="register-container">
    <div class="card shadow-lg p-4">
      <h2 class="text-center mb-4">Đăng Ký</h2>
      <form @submit.prevent="register">
        <div class="form-group">
          <label for="fullname">Họ và tên:</label>
          <input type="text" id="fullname" v-model="fullname" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="email" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="password">Mật khẩu:</label>
          <input type="password" id="password" v-model="password" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Xác nhận mật khẩu:</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="phone">Số điện thoại:</label>
          <input type="text" id="phone" v-model="phone" class="form-control" />
        </div>
        <div class="form-group">
          <label for="birthday">Ngày sinh:</label>
          <input type="date" id="birthday" v-model="birthday" class="form-control" />
        </div>

        <div class="d-flex justify-content-center">
            <button type="submit" class="btn btn-primary mt-3 px-4">Đăng Ký</button>
        </div>

        <!-- Hiển thị lỗi -->
        <div v-if="errorMessage" class="alert alert-danger mt-3">
          {{ errorMessage }}
        </div>
      </form>

      <p class="text-center mt-3">
        Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      birthday: "",
      errorMessage: "", // Biến để lưu lỗi
    };
  },
  methods: {
    async register() {
      this.errorMessage = ""; // Reset lỗi trước khi gửi yêu cầu

      // Kiểm tra xác nhận mật khẩu
      if (this.password !== this.confirmPassword) {
        this.errorMessage = "Mật khẩu xác nhận không khớp!";
        return;
      }

      try {
        await axios.post("http://localhost:5000/api/auth/register", {
          fullname: this.fullname,
          email: this.email,
          password: this.password,
          phone: this.phone,
          birthday: this.birthday,
        });

        // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
        this.$router.push("/login");
      } catch (error) {
        // Lấy lỗi từ backend và hiển thị ra giao diện
        this.errorMessage = error.response?.data?.message || "Lỗi đăng ký!";
      }
    },
  },
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
}

.card {
  border-radius: 10px;
  background: #fff;
  border: none;
}

.card h2 {
  color: #007bff;
  font-weight: bold;
}

.form-group label {
  font-weight: 500;
}

.btn-primary {
  background-color: #007bff;
  border: none;
  transition: 0.3s;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.alert {
  text-align: center;
}

.text-center a {
  color: #007bff;
  text-decoration: none;
}

.text-center a:hover {
  text-decoration: underline;
}
</style>
