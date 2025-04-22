<template>
  <header class="topbar">
    <div class="left">
      <h2>{{ pageTitle }}</h2>
    </div>
    <div class="right">
      <UserMenu @classCreated="$emit('classCreated')" @classJoined="$emit('classJoined')" />
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import UserMenu from "@/components/UserMenu.vue";

const route = useRoute();
const className = ref(""); // Lưu tên lớp học

// Lấy tiêu đề dựa trên route
const pageTitle = computed(() => {
  if (route.path.startsWith("/class/")) {
    return className.value || "Đang tải...";
  }
  return route.meta.title;
});

// Hàm lấy tên lớp học từ API
const fetchClassName = async () => {
  if (route.params.id) {
    try {
      const response = await axios.get(`http://localhost:5000/api/classes/${route.params.id}/people`);
      className.value = response.data.classroom.name; // Giả sử API trả về { name: "Lớp A" }
    } catch (error) {
      console.error("Lỗi khi lấy tên lớp học:", error);
    }
  }
};

// Cập nhật khi route thay đổi
watch(() => route.params.id, fetchClassName, { immediate: true });

</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #e0f7fa; /* Xanh nhạt, học tập */
  border-bottom: 2px solid #00acc1; /* Tạo viền dưới rõ nét */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.left h2 {
  font-size: 30px;
  font-weight: 600;
  color: #00796b; /* Xanh ngọc đậm */
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
}

.right {
  display: flex;
  align-items: center;
}
</style>
