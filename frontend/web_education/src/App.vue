<script setup>
import { useRoute } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
const route = useRoute();

// Danh sách các path cần ẩn icon chat
const hiddenPaths = ['/login', '/register'];

// Hàm kiểm tra nếu path hiện tại là `/examinate/:quizAssignmentId`
const isExaminatePath = () => {
  return /^\/examinate\/[^/]+$/.test(route.path);
};

// Tổng hợp điều kiện để ẩn
const shouldShowChat = computed(() => {
  return !hiddenPaths.includes(route.path) && !isExaminatePath();
});

function goToChat() {
  window.location.href = "/conversations";
}
</script>

<template>
  <router-view />
  <div class="chat-floating" v-if="shouldShowChat" @click="goToChat">
    <i class="fas fa-comment-dots"></i>
  </div>
</template>

<style scoped>
.chat-floating {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background-color: #0084ff;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  color: white;
  font-size: 24px;
}
.chat-floating:hover {
  background-color: #006fd3;
}
</style>
