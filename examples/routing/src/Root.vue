<script setup lang="ts">
import { useBlitz } from "@biliblitz/blitz";
import { useHead } from "@unhead/vue";

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
  ],
});

useBlitz();
</script>

<style>
.box {
  border: 2px solid red;
  padding: 5px;
}

.loader {
  border: 2px solid lime;
  padding: 5px;
}
</style>

<template>
  <div class="box">
    <div>Root</div>
    <router-view />
  </div>
</template>
