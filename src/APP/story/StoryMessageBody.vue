<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="story-message-body" v-html="html"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderStreamingStoryHtml } from './storyDisplay';
import type { StoryTranscriptItem } from './storyTypes';

const props = defineProps<{ item: StoryTranscriptItem }>();
const html = computed(() =>
  props.item.isStreaming
    ? renderStreamingStoryHtml(props.item.raw, props.item.role)
    : props.item.finalHtml || props.item.preview,
);
</script>

<style scoped lang="scss">
.story-message-body {
  min-width: 0;
  max-width: 100%;
  color: var(--text-primary);
  font-size: 17px;
  line-height: 1.82;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;

  :deep(*) {
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :deep(p) {
    margin: 0;
    text-indent: 2em;
  }

  :deep(p + p) {
    margin-top: 1em;
  }

  :deep(pre),
  :deep(code) {
    white-space: pre-wrap !important;
  }

  :deep(table) {
    width: 100%;
    table-layout: fixed;
  }

  :deep(img),
  :deep(video),
  :deep(canvas),
  :deep(svg),
  :deep(iframe) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1em auto;
    text-indent: 0;
  }
}

@media (max-width: 520px) {
  .story-message-body {
    font-size: 16px;
    line-height: 1.76;
  }
}
</style>
