<template>
  <header class="topbar">
    <div class="left">
      <h2>Lớp học</h2>
    </div>
    <div class="right">
      <UserMenu />
    </div>
  </header>
</template>

<script setup>
import UserMenu from "@/components/UserMenu.vue";
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
