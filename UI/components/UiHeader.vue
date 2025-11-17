<template>
  <div class="ui-header">
    <div class="ui-header__icon">
      <i v-if="icon" :class="`fas fa-${icon}`"></i>
    </div>
    <div class="ui-header__content">
      <h2 class="ui-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="ui-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="ui-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.ui-header {
  @include flex-between();
  padding: spacing(4) spacing(6);
  background: color(white);
  border-bottom: 1px solid map-get($colors, gray-200);

  &__icon {
    width: 40px;
    height: 40px;
    @include flex-center();
    background: rgba(color(primary), 0.1);
    color: color(primary);
    border-radius: border-radius(lg);
    font-size: font(2xl);

    i {
      font-size: inherit;
    }
  }

  &__content {
    flex: 1;
    margin-left: spacing(4);
  }

  &__title {
    margin: 0;
    font-size: font(2xl);
    font-weight: font(bold);
    color: text-color(primary);
  }

  &__subtitle {
    margin: spacing(1) 0 0 0;
    font-size: font(sm);
    color: text-color(secondary);
  }

  &__actions {
    margin-left: spacing(4);
  }
}
</style>
