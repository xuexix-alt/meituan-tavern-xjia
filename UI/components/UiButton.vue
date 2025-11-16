<template>
  <component
    :is="tag"
    :class="[
      'ui-button',
      `ui-button--${variant}`,
      `ui-button--${size}`,
      {
        'ui-button--block': block,
        'ui-button--disabled': disabled,
        'ui-button--loading': loading,
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="ui-button__spinner"></span>
    <i v-if="icon && !loading" :class="`fas fa-${icon}`" class="ui-button__icon"></i>
    <span v-if="$slots.default" class="ui-button__text">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'filled' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  tag?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  size: 'md',
  block: false,
  disabled: false,
  loading: false,
  tag: 'button',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style lang="scss" scoped>
.ui-button {
  @include button-base();

  // Variants
  &--filled {
    @include button-filled();
  }

  &--outline {
    @include button-outline();
  }

  &--ghost {
    @include button-ghost();
  }

  &--link {
    @include button-base();
    background: none;
    color: color(primary);
    padding: 0;
    border: none;

    &:hover:not(:disabled) {
      text-decoration: underline;
      background: none;
    }
  }

  // Sizes
  &--sm {
    padding: spacing(1) spacing(3);
    font-size: font(xs);
  }

  &--md {
    @include button-base();
  }

  &--lg {
    padding: spacing(3) spacing(6);
    font-size: font(lg);
  }

  // Block
  &--block {
    width: 100%;
  }

  // Disabled
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  // Loading
  &--loading {
    .ui-button__text {
      margin-left: spacing(2);
    }
  }

  &__spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  &__icon {
    font-size: 1em;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
