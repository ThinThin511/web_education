<template>
  <div class="register-container d-flex justify-content-center align-items-center">
    <div class="register-wrapper">
      <div class="card register-card shadow-sm p-4">
        <div class="text-center mb-3">
          <img src="@/assets/logo.png" alt="Register Icon" class="register-icon mb-2" />
          <h2 class="register-title">Đăng Ký Thành Viên</h2>
          <p class="text-muted">Tham gia cộng đồng học tập cùng chúng tôi!</p>
        </div>

        <form @submit.prevent="register">
          <div class="form-group mb-3">
            <label for="fullname">👤 Họ và tên:</label>
            <input type="text" id="fullname" v-model="fullname" class="form-control" required />
          </div>

          <div class="form-group mb-3">
            <label for="email">📧 Email:</label>
            <input type="email" id="email" v-model="email" class="form-control" required />
          </div>

          <div class="form-group mb-3">
            <label for="password">🔒 Mật khẩu:</label>
            <input type="password" id="password" v-model="password" class="form-control" required />
          </div>

          <div class="form-group mb-3">
            <label for="confirmPassword">✅ Xác nhận mật khẩu:</label>
            <input type="password" id="confirmPassword" v-model="confirmPassword" class="form-control" required />
          </div>

          <div class="form-group mb-3">
            <label for="phone">📱 Số điện thoại:</label>
            <input type="text" id="phone" v-model="phone" class="form-control" />
          </div>

          <div class="form-group mb-3">
            <label for="birthday">🎂 Ngày sinh:</label>
            <input type="date" id="birthday" v-model="birthday" class="form-control" />
          </div>

          <button type="submit" class="btn btn-study w-100 mt-2">🚀 Đăng ký</button>

          <div v-if="errorMessage" class="alert alert-danger mt-3 text-center">
            {{ errorMessage }}
          </div>
        </form>

        <p class="text-center mt-3">
          🔐 Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link>
        </p>
      </div>
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
      errorMessage: "",
    };
  },
  methods: {
    async register() {
      this.errorMessage = "";

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

        this.$router.push("/login");
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "Lỗi đăng ký!";
      }
    },
  },
};
</script>

<style scoped>
.register-container {
  background: linear-gradient(to right, #e3f2fd, #fff8f2);
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-wrapper {
  width: 100%;
  max-width: 500px;
}

.register-card {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
}

.register-title {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2b4f81;
  font-weight: bold;
}

.btn-study {
  background-color: #2b6cb0;
  color: #fff;
  font-weight: 600;
  border-radius: 10px;
  transition: background-color 0.3s ease;
}

.btn-study:hover {
  background-color: #1a4e80;
}

.register-icon {
  width: 64px;
  height: 64px;
}

@media (max-width: 576px) {
  .register-card {
    padding: 1.5rem;
  }

  .register-icon {
    width: 48px;
    height: 48px;
  }

  .register-title {
    font-size: 1.5rem;
  }
}
</style>
