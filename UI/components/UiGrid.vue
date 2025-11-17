<template>
  <div
    :class="[
      'ui-grid',
      `ui-grid--columns-${columns}`,
      {
        'ui-grid--gap-sm': gap === 'sm',
        'ui-grid--gap-md': gap === 'md',
        'ui-grid--gap-lg': gap === 'lg',
      }
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  columns?: number | 'auto';  // 支持1-12列和auto
  gap?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  columns: 2,
  gap: 'md',
});
</script>

<style lang="scss" scoped>
.ui-grid {
  display: grid;

  &--columns-1 {
    grid-template-columns: 1fr;
  }

  &--columns-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &--columns-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  &--columns-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  &--gap-sm {
    gap: spacing(2);
  }

  &--gap-md {
    gap: spacing(4);
  }

  &--gap-lg {
    gap: spacing(6);
  }

  // 响应式调整
  @include down(sm) {
    &--columns-3,
    &--columns-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr !important;
  }
}
</style>
