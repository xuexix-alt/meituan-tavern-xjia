<template>
  <div class="app-view story-view active">
    <StoryReader />
  </div>
</template>

<script setup lang="ts">
import StoryReader from './story/StoryReader.vue';
</script>

<style scoped>
.story-view {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
