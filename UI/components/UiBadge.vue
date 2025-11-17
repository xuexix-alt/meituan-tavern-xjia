<template>
  <span
    :class="[
      'ui-badge',
      `ui-badge--${variant}`,
      `ui-badge--${size}`,
      {
        'ui-badge--dot': dot,
      }
    ]"
  >
    <i v-if="icon && !dot" :class="`fas fa-${icon}`" class="ui-badge__icon"></i>
    <span v-if="$slots.default && !dot" class="ui-badge__text">
      <slot />
    </span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'hot' | 'new' | 'recommend' | 'vip';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  dot?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  dot: false,
});
</script>

<style lang="scss" scoped>
.ui-badge {
  @include tag-base();

  // Variants
  &--primary {
    @include tag-status(color(primary));
  }

  &--success {
    @include tag-status(color(success));
  }

  &--warning {
    @include tag-status(color(warning));
  }

  &--danger {
    @include tag-status(color(danger));
  }

  &--info {
    @include tag-status(color(info));
  }

  &--hot {
    @include tag-status(color(hot));
  }

  &--new {
    @include tag-status(color(new));
  }

  &--recommend {
    @include tag-status(color(recommend));
  }

  &--vip {
    @include tag-status(color(vip));
  }

  // Sizes
  &--sm {
    padding: spacing(0.5) spacing(2);
    font-size: font(xs);
  }

  &--md {
    @include tag-base();
  }

  &--lg {
    padding: spacing(2) spacing(3);
    font-size: font(base);
  }

  // Dot style
  &--dot {
    padding: spacing(1);
    border-radius: 50%;
    width: 8px;
    height: 8px;
    min-width: 8px;
  }

  &__icon {
    font-size: 0.9em;
  }

  &__text {
    font-weight: font(medium);
  }
}
</style>
