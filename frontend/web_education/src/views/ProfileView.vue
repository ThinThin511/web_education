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
            <input type="file" @change="uploadAvatar" />
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


.edit-profile {
  display: flex;
  gap: 20px;
}

.profile-picture {
  width: 250px;
  text-align: center;
}

.profile-picture img {
  width: 100%;
  border-radius: 50%;
}

.account-details {
  flex: 1;
}

form {
  display: flex;
  flex-direction: column;
}

form label {
  margin-top: 10px;
}

form input {
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
}
</style>
