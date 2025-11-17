<template>
  <div class="ui-status-panel">
    <UiHeader :title="title" :icon="icon">
      <template #actions>
        <slot name="actions" />
      </template>
    </UiHeader>

    <div class="ui-status-panel__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiHeader from './UiHeader.vue';

interface Props {
  title: string;
  icon?: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.ui-status-panel {
  background: color(white);
  border-radius: border-radius(lg);
  overflow: hidden;
  box-shadow: map-get($shadows, md);

  &__content {
    padding: spacing(6);
  }
}
</style>
