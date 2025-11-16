<template>
  <div class="ui-tab">
    <div class="ui-tab__nav">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        :class="[
          'ui-tab__nav-item',
          {
            'ui-tab__nav-item--active': index === modelValue,
          }
        ]"
        @click="handleTabClick(index)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="ui-tab__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  label: string;
  value?: string | number;
}

interface Props {
  modelValue?: number;
  tabs?: Tab[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  tabs: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number, tab: Tab];
}>();

const handleTabClick = (index: number) => {
  emit('update:modelValue', index);
  emit('change', index, props.tabs[index]);
};
</script>

<style lang="scss" scoped>
.ui-tab {
  &__nav {
    @include flex-between();
    gap: spacing(2);
    margin-bottom: spacing(4);
    border-bottom: 1px solid map-get($colors, gray-200);
    overflow-x: auto;
    @include hide-scrollbar();
  }

  &__nav-item {
    padding: spacing(3) spacing(4);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: text-color(secondary);
    font-size: font(base);
    font-weight: font(medium);
    cursor: pointer;
    transition: all duration(fast) easing(smooth);
    white-space: nowrap;

    &:hover {
      color: color(primary);
    }

    &--active {
      color: color(primary);
      border-bottom-color: color(primary);
    }
  }

  &__content {
    min-height: 100px;
  }
}
</style>
