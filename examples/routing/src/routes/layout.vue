<template>
  <div class="box">
    <div>/layout.vue</div>
    <div class="loader">{{ random }}</div>
    <div>
      <router-link to="/">Home</router-link>
      <span> | </span>
      <router-link to="/about/">About</router-link>
      <span> | </span>
      <router-link to="/hash/">Hash</router-link>
      <span> | </span>
      <router-link to="/user/alice/">User Alice</router-link>
      <span> | </span>
      <router-link to="/user/bob/">User Bob</router-link>
      <span> | </span>
      <router-link to="/post/alice/public/">Post A</router-link>
      <span> | </span>
      <router-link to="/post/bob/private/">Post B</router-link>
    </div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { loader$ } from "@biliblitz/blitz/server";

export const useLayoutRandom = loader$(() => {
  return `loader = ${Math.random()}`;
});
</script>

<script setup lang="ts">
const random = useLayoutRandom();
</script>
