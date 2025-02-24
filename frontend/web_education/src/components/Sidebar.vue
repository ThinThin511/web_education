<template>
  <aside class="sidebar">
    <div class="logo">
      <img src="@/assets/logo.png" alt="Lớp học" />
      <span>Lớp học</span>
    </div>
    <nav class="menu">
      <router-link to="/" class="menu-item"><i class="fas fa-home"></i> Trang chủ</router-link>
      <router-link to="/schedule" class="menu-item"><i class="fas fa-calendar"></i> Lịch</router-link>
      <router-link to="/documents" class="menu-item"><i class="fas fa-folder"></i> Tài liệu</router-link>
      <router-link to="/settings" class="menu-item"><i class="fas fa-cog"></i> Cài đặt</router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  background: #f8f9fa;
  padding: 20px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.menu {
  margin-top: 20px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
}
.logo img {
  width: 60px;
  margin: 10px;
  border-radius: 40px;
  border: 1px solid rgb(117, 117, 117);
  
}
</style>
