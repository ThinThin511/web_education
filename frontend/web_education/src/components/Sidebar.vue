<template>
  <aside class="sidebar">
    <div class="logo">
      <img src="@/assets/logo.png" alt="Lớp học" />
      <span>Lớp học</span>
    </div>
    <nav class="menu">
      <router-link to="/" class="menu-item">
        <i class="fas fa-home"></i> <span>Trang chủ</span>
      </router-link>
      <router-link to="/calendar" class="menu-item">
        <i class="fas fa-calendar"></i> <span>Lịch</span>
      </router-link>
      <router-link to="/documents" class="menu-item">
        <i class="fas fa-folder"></i> <span>Tài liệu</span>
      </router-link>
      <router-link to="/settings" class="menu-item">
        <i class="fas fa-cog"></i> <span>Cài đặt</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #ddd;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  gap: 10px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.logo img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #bbb;
}

.menu {
  margin-top: 20px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  color: #555;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  transition: 0.3s;
}

.menu-item:hover {
  background: #007bff;
  color: white;
}

.menu-item i {
  font-size: 18px;
}
</style>
