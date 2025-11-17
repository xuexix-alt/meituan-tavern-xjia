<template>
  <div
    :class="[
      'ui-card',
      {
        'ui-card--hoverable': hoverable,
        'ui-card--clickable': clickable,
        'ui-card--selected': selected,
      }
    ]"
    @click="handleClick"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  hoverable?: boolean;
  clickable?: boolean;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  clickable: false,
  selected: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event);
  }
};
</script>

<style lang="scss" scoped>
.ui-card {
  @include card-base();
  transition: all duration(fast) easing(smooth);

  &--hoverable,
  &--clickable {
    @include hover-card();
  }

  &--selected {
    border: 2px solid color(primary);
    box-shadow: 0 0 0 4px rgba(color(primary), 0.1);
  }
}
</style>
