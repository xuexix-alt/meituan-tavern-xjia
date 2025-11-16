<template>
  <div class="ui-list-section">
    <div v-if="title" class="ui-list-section__header">
      <h3 class="ui-list-section__title">{{ title }}</h3>
      <slot name="header-actions" />
    </div>
    <div class="ui-list-section__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.ui-list-section {
  margin-bottom: spacing(6);

  &__header {
    @include flex-between();
    margin-bottom: spacing(4);
  }

  &__title {
    margin: 0;
    font-size: font(xl);
    font-weight: font(semibold);
    color: text-color(primary);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: spacing(4);
  }
}
</style>
