<script setup>
import { useEntryPoint } from "@biliblitz/blitz";
import { useHead } from "@unhead/vue";

import "./assets/style.css";

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
  ],
});

useEntryPoint();
</script>

<template>
  <router-view />
</template>
