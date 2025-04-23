<template>
  
  
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar/>
      <section class="content">
        
            <div class="conversation-list">
                <div class="chat-header">
                    <h2 class="header">Tin nhắn</h2>

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Tìm kiếm theo tên..."
                        class="search-bar"
                    />
                </div>
                

               <div
                  class="conversation-item"
                  v-for="conv in filteredConversations"
                  :key="conv.userId"
                  @click="goToChat(conv.userId)"
                >
                  <img :src="conv.avatar || defaultAvatar" class="avatar" />
                  <div class="conversation-info">
                    <div class="name-and-time">
                      <span class="name">{{ conv.name }}</span>
                      <span class="time">{{ formatTime(conv.lastMessageAt) }}</span>
                    </div>
                    <div class="last-message">
                      {{ conv.lastMessage }}
                    </div>
                  </div>

                  <!-- 🟢 Badge tin chưa đọc -->
                  <div
                    v-if="conv.unreadCount > 0"
                    class="unread-badge"
                  >
                    {{ conv.unreadCount }}
                  </div>
                </div>

            </div>
        
      </section>
    </main>

    <CreateClassPopup v-if="showPopup" @close="showPopup = false" @classCreated="handleClassCreated" />
    <JoinClassPopup v-if="showJoinClassPopup" @close="showJoinClassPopup = false "@classJoined="handleClassJoined" />
  </div>


</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import defaultAvatar from '@/assets/avatar.png';
import socket from "@/socket";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import CreateClassPopup from "@/components/CreateClassPopup.vue"; // Gọi component popup
import { useAuthStore } from "@/stores/auth";
const showPopup = ref(false);

import JoinClassPopup from "@/components/JoinClassPopup.vue";
let showJoinClassPopup = ref(false);
const router = useRouter();
const conversations = ref([]);
const search = ref('');
const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;

const goToChat = (id) => {
   socket.emit("mark_as_read", {
    userId: currentUserId,
    partnerId: id,
  });

  // Reset local state (hiển thị thôi)
  const index = conversations.value.findIndex(c => c.userId === id);
  if (index !== -1) {
    conversations.value[index].unreadCount = 0;
  }
  router.push(`/messages/${id}`);
};

const formatTime = (time) => {
  const date = new Date(time);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return date.toLocaleDateString();
};

const filteredConversations = computed(() => {
  return conversations.value.filter(conv =>
    conv.name.toLowerCase().includes(search.value.toLowerCase())
  );
});

onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/chat/conversations", {
      headers: { "x-user-id": currentUserId },
    });
    conversations.value = res.data;
  } catch (err) {
    console.error("Lỗi khi tải danh sách hội thoại:", err);
  }
    socket.connect();
    socket.emit("join", currentUserId);
    socket.on('new_message', (message) => {
  const senderId = message.sender._id;
  const receiverId = message.receiver;

  const isIncoming = receiverId === currentUserId; // 🟢 Tin đến từ người khác
  const otherUserId = isIncoming ? senderId : receiverId;

  const convIndex = conversations.value.findIndex(c => c.userId === otherUserId);

  if (convIndex !== -1) {
    const existing = conversations.value[convIndex];

    const updated = {
      ...existing,
      lastMessage: message.text,
      lastMessageAt: message.createdAt,
      unreadCount: isIncoming ? (existing.unreadCount || 0) + 1 : existing.unreadCount,
    };

    conversations.value.splice(convIndex, 1);
    conversations.value.unshift(updated);
  } else {
    conversations.value.unshift({
      userId: otherUserId,
      name: message.sender.fullname || "Người dùng",
      avatar: message.sender.avatar || defaultAvatar,
      lastMessage: message.text,
      lastMessageAt: message.createdAt,
      unreadCount: isIncoming ? 1 : 0, // 🟢 Nếu là tin đến, đếm là 1
    });
  }
});
});
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: 100vh;
  
  
}

.conversation-list {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  max-width: 700px;
  margin: auto;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border-radius: 10px;
}

.header {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #333;
}

.search-bar {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  margin-bottom: 16px;
  font-size: 14px;
}

.conversation-item {
    overflow-y: auto;
  display: flex;
  padding: 12px;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s;
  margin-bottom: 4px;
  scrollbar-width: thin;
}

.conversation-item:hover {
  background-color: #e6f0ff;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid #ddd;
}

.conversation-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name-and-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.name {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
}

.last-message {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.unread-badge {
  background-color: #ff4d4f;
  color: white;
  font-size: 12px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-left: 8px;
}
</style>
