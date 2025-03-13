<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

onMounted(async () => {
  const classId = route.params.classId;
  if (!authStore.token) {
    toast.error("Bạn cần đăng nhập để tham gia lớp học!");
    setTimeout(() => {
      router.push("/login");
    }, 2000); // Chờ 2 giây trước khi chuyển trang
    
    return;
  }

  try {
    await axios.post(
      `http://localhost:5000/api/classes/join/${classId}`,
      {},
      {
        headers: { Authorization: `Bearer ${authStore.token}` },
      }
    );

    toast.success("Bạn đã tham gia lớp học thành công!");
    router.push(`/class/${classId}/feed`);
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi khi tham gia lớp");
    router.push("/");
  }
});
</script>
