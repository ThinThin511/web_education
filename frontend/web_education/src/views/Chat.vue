<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <Topbar/>
      <section class="content">
        <div class="chat-container">
            <div class="chat-header">
                <img :src="receiverInfo.avatar" alt="Avatar" class="avatar" />
                <span class="name">{{ receiverInfo.fullname }}</span>
            </div>

            <div class="messages" ref="messagesContainer">
            <div
                v-for="msg in messages"
                :key="msg._id"
                :class="['message', msg.sender?._id === currentUserId ? 'sent' : 'received']"
            >
                <span>{{ msg.text }}</span>
                <p class="time">{{ formatTimeAgo(msg.createdAt) }}</p>
            </div>
            </div>
            <div class="input-area">
            <input v-model="text" @keyup.enter="sendMessage" placeholder="Nhập tin nhắn..." />
            <button @click="sendMessage">Gửi</button>
            </div>
        </div>
      </section>
    </main>

    <CreateClassPopup v-if="showPopup" @close="showPopup = false" @classCreated="handleClassCreated" />
    <JoinClassPopup v-if="showJoinClassPopup" @close="showJoinClassPopup = false "@classJoined="handleClassJoined" />
  </div>

</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import socket from "@/socket";
import defaultAvatar from "@/assets/avatar.png";
import defaultImage from "@/assets/nen.jpg";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import CreateClassPopup from "@/components/CreateClassPopup.vue"; // Gọi component popup
import { useAuthStore } from "@/stores/auth";
const showPopup = ref(false);

import JoinClassPopup from "@/components/JoinClassPopup.vue";
let showJoinClassPopup = ref(false);
const messagesContainer = ref(null);
const route = useRoute();
const receiverId = route.params.receiverId;
const messages = ref([]);
const text = ref("");
const receiverInfo = ref({});
const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
onMounted(async () => {
  const res = await axios.get(`http://localhost:5000/api/chat/messages/${receiverId}`, {
    headers: {
      "x-user-id": currentUserId,
    },
  });
  console.log("Messages from API:", res.data);
  messages.value = res.data;
  scrollToBottom();
  socket.connect();
  socket.emit("join", currentUserId);
  const firstMessage = messages.value[0];
  if (firstMessage) {
    receiverInfo.value =
      firstMessage.sender._id === currentUserId ? firstMessage.receiver : firstMessage.sender;
  }
  socket.on("new_message", (msg) => {
    if (msg.sender._id === receiverId || msg.receiver === receiverId) {
      messages.value.push(msg);
      scrollToBottom();
    }
  });
});
console.log("Current:", currentUserId);
messages.value.forEach(m => {
  console.log("Message:", m.text, "| From:", m.sender?._id);
});
function sendMessage() {
  if (!text.value.trim()) return;
  socket.emit("send_message", {
  receiverId,
  text: text.value,
  senderId: currentUserId, // <== thêm dòng này
});
  messages.value.push({
    text: text.value,
    sender: { _id: currentUserId },
    receiver: { _id: receiverId },
    createdAt: new Date().toISOString(),
  });
  text.value = "";
   // chờ DOM cập nhật xong
  scrollToBottom();

}
function scrollToBottom() {
  nextTick(() => {
    const container = messagesContainer.value;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}
const formatTimeAgo = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000); // seconds

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString();
};
</script>

<style scoped>
.chat-container {
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

.messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 5px;
  scrollbar-width: thin;
}

.messages::-webkit-scrollbar {
  width: 6px;
}
.messages::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.message {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
  word-wrap: break-word;
  display: inline-block;
  position: relative;
  line-height: 1.4;
  font-size: 14px;
}

.sent {
  background-color: #dcf8c6;
  align-self: flex-end;
  text-align: right;
  border-bottom-right-radius: 4px;
  margin-right: 5px;
}

.received {
  background-color: #f1f0f0;
  align-self: flex-start;
  text-align: left;
  border-bottom-left-radius: 4px;
  margin-left: 5px;
}

.input-area {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

button {
  padding: 10px 20px;
  border: none;
  background-color: #0084ff;
  color: white;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #006fd3;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #0084ff;
}

.name {
  font-weight: 600;
  font-size: 18px;
}

.time {
  font-size: 12px;
  color: rgb(150, 150, 150);
  margin-top: 4px;
  margin: 0 !important;
}
</style>
