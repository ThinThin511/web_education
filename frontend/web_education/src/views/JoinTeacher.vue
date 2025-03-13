<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "vue-toastification";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

onMounted(async () => {
  const inviteCode = route.params.inviteCode;
  if (!authStore.token) {
    toast.error("Bạn cần đăng nhập để tham gia lớp học!");
    setTimeout(() => {
      router.push("/login");
    }, 2000); // Chờ 2 giây trước khi chuyển trang
    
    return;
  }
  try {
    const token = authStore.token;
    await axios.post(`http://localhost:5000/api/classes/join-teacher/${inviteCode}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Bạn đã tham gia lớp học với tư cách là giáo viên!");
    router.push("/"); // Chuyển hướng sau khi tham gia thành công
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi khi tham gia lớp học!");
    router.push("/"); // Chuyển hướng về trang chính nếu lỗi
  }
});
</script>



