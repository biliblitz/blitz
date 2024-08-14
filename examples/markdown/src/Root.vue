<script setup>
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

<template>
  <router-view />
</template>
