<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div class="edit-profile">
          <div class="profile-picture">
            <img :src="userAvatar " alt="Avatar" class="avatar" />
            <p>JPG hoặc PNG không lớn hơn 5MB</p>
            <input class="form-control " type="file" @change="uploadAvatar" />
          </div>

          <div class="account-details">
            <h3>Thông tin tài khoản</h3>
            <form @submit.prevent="saveChanges">
              <label>Họ và Tên</label>
              <input v-model="fullname" type="text" />



              <label>Số điện thoại</label>
              <input v-model="phone" type="text" />

              <label>Ngày sinh</label>
              <input v-model="birthday" type="date" />

              <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import { useAuthStore } from "@/stores/auth";
import defaultAvatar from "@/assets/avatar.png";

const authStore = useAuthStore();
const userAvatar = ref(defaultAvatar);
const fullname = ref("");
const phone = ref("");
const birthday = ref("");
const userId = authStore.user?.id;

// Lấy dữ liệu người dùng khi component được tạo
onMounted(() => {
  if (authStore.user) {
    console.log(authStore.user.avatar);
    
    userAvatar.value = authStore.user.avatar || defaultAvatar;
    fullname.value = authStore.user.fullname || "";
    phone.value = authStore.user.phone || "";
    if (authStore.user.birthday) {
      birthday.value = new Date(authStore.user.birthday).toISOString().split("T")[0];
    } else {
      birthday.value = "";
    }
  }
});

// Xử lý upload avatar
const uploadAvatar = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);
  formData.append("userId", userId);

  try {
    const response = await fetch("http://localhost:5000/api/auth/upload", {
      method: "POST",
      body: formData, // Gửi theo dạng multipart/form-data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Upload thành công:", data);

    userAvatar.value = `http://localhost:5000${data.imageUrl}`;;
  } catch (error) {
    console.error("Lỗi upload ảnh:", error);
  }
};

// Lưu thay đổi thông tin
const saveChanges = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,  // Thêm ID người dùng
        fullname: fullname.value,
        phone: phone.value,
        birthday: birthday.value,
        avatar: userAvatar.value,
      }),
    });

    if (response.ok) {
      await authStore.fetchUser();
      alert("Cập nhật thành công!");
    } else {
      alert("Cập nhật thất bại!");
    }
  } catch (error) {
    console.error("Lỗi cập nhật thông tin:", error);
  }
};
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
  justify-content: center;
  align-items: center;
}


/* Phần chỉnh sửa hồ sơ */
.edit-profile {
  display: flex;
  gap: 30px;
  background: rgb(255, 255, 255);
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.9);
  max-width: 800px;
  width: 100%;
}

/* Ảnh đại diện */
.profile-picture {
  width: 250px;
  text-align: center;
}

.profile-picture img {
  width: 100%;
  border-radius: 50%;
  border: 5px solid #e0e0e0;
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.profile-picture img:hover {
  transform: scale(1.05);
  border-color: #007bff;
}

.profile-picture p {
  font-size: 14px;
  color: #6c757d;
  margin-top: 10px;
}

/* Ô chọn file */
.profile-picture input {
  margin-top: 10px;
  padding: 5px;
  font-size: 14px;
}

/* Thông tin tài khoản */
.account-details {
  flex: 1;
}

.account-details h3 {
  font-size: 20px;
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

/* Form chỉnh sửa */
form {
  display: flex;
  flex-direction: column;
}

form label {
  margin-top: 10px;
  font-weight: 500;
  color: #555;
}

form input {
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  transition: border 0.3s ease;
}

form input:focus {
  border-color: #007bff;
  outline: none;
}

/* Nút lưu thay đổi */
.btn-primary {
  background-color: #007bff;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  margin-top: 15px;
  transition: background 0.3s ease, transform 0.2s ease;
}

.btn-primary:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}
</style>
