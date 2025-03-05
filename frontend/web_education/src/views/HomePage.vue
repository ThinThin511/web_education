<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar />
      <section class="content">
        <div class="empty-state">
          <img src="@/assets/noclass.png" alt="No classes" />
          <p>Thêm một lớp học để bắt đầu</p>
          <div class="actions">
            <button class="btn btn-link" @click="showPopup = true">Tạo lớp học</button>
            <button class="btn btn-primary">Tham gia lớp học</button>
          </div>
        </div>
      </section>
    </main>

    <!-- Gọi component Popup -->
    <CreateClassPopup v-if="showPopup" @close="showPopup = false" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import CreateClassPopup from "@/components/CreateClassPopup.vue"; // Gọi component popup

const showPopup = ref(false);
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

.empty-state {
  text-align: center;
}

.empty-state img {
  width: 200px;
  margin-bottom: 10px;
}
</style>
