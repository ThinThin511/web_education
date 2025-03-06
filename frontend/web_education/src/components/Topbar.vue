<template>
  <header class="topbar">
    <div class="left">
      <h2>{{ pageTitle }}</h2>
    </div>
    <div class="right">
      <UserMenu @classCreated="$emit('classCreated')" @classJoined="$emit('classJoined')"/>
    </div>
  </header>
  
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import UserMenu from "@/components/UserMenu.vue";

const route = useRoute();
const pageTitle = computed(() => route.meta.title);


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
