<template>
  <aside class="sidebar">
    <div class="logo">
      <img src="@/assets/logo.png" alt="Lớp học" />
      <span>Lớp học</span>
    </div>
    <nav class="menu">
      <router-link to="/" class="menu-item" active-class="active">
        <i class="fas fa-home"></i> <span>Trang chủ</span>
      </router-link>
      <router-link to="/myteaching" class="menu-item" active-class="active">
        <i class="fas fa-chalkboard-teacher"></i> <span>Giảng dạy</span>
      </router-link>
      <router-link to="/reminder" class="menu-item" active-class="active">
        <i class="fas fa-bell"></i> <span>Lời nhắc</span>
      </router-link>
      <router-link to="/exam" class="menu-item" active-class="active">
        <i class="fas fa-pen"></i> <span>Bài kiểm tra</span>
      </router-link>
    </nav>
  </aside>
</template>


<style scoped>
.sidebar {
  width: 250px;
  min-height: 100vh;
  background: linear-gradient(180deg, #e0f7fa, #ffffff);
  padding: 20px;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: bold;
  color: #0277bd;
  gap: 10px;
  margin-bottom: 30px;
}

.logo img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #81d4fa;
}

.menu {
  flex-grow: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: #01579b;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: #0288d1;
  color: white;
}

.menu-item.active {
  background-color: #0288d1;
  color: white;
  font-weight: 600;
  box-shadow: inset 3px 0 0 #01579b;
}

.menu-item i {
  font-size: 18px;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    background: white;
    width: 220px;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  }

  .sidebar.active {
    transform: translateX(0);
  }
}

</style>
