<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import socket from '@/socket';

const unreadCount = ref(0);
const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;

// Lấy số tin chưa đọc ban đầu
async function fetchUnreadCount() {
  const res = await axios.get(`http://localhost:5000/api/chat/unread-count`, {
    params: { userId: currentUserId }
  });
  unreadCount.value = res.data.count;
}

// Khi có tin nhắn mới đến -> tăng nếu là người khác gửi
socket.on("new_message", (msg) => {
  if (msg.receiver === currentUserId) {
    unreadCount.value++;
  }
});

// Khi có tin nhắn được đánh dấu là đã đọc → giảm (tùy logic bạn, hoặc làm lại full)
socket.on("marked_as_read", ({ userId }) => {
  if (userId === currentUserId) fetchUnreadCount(); // hoặc trừ thủ công nếu bạn muốn
});

onMounted(() => {
  socket.connect();
  socket.emit("join", currentUserId);
  fetchUnreadCount();
});

const route = useRoute();
const hiddenPaths = ['/login', '/register','/conversations'];
const isExaminatePath = () => /^\/examinate\/[^/]+$/.test(route.path);
const shouldShowChat = computed(() => {
  return !hiddenPaths.includes(route.path) && !isExaminatePath();
});

function goToChat() {
  unreadCount.value = 0;
  window.location.href = "/conversations";
}
</script>

<template>
  <router-view />
  <div class="chat-floating" v-if="shouldShowChat" @click="goToChat">
    <i class="fas fa-comment-dots"></i>
    <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
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

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: red;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: bold;
}
</style>
