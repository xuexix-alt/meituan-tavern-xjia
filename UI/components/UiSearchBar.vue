<template>
  <div class="ui-search-bar">
    <i class="fas fa-search ui-search-bar__icon"></i>
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="ui-search-bar__input"
      @input="handleInput"
      @keyup.enter="handleEnter"
    />
    <UiButton
      v-if="showButton"
      :variant="'ghost'"
      :size="'sm'"
      class="ui-search-bar__button"
      @click="handleSearch"
    >
      {{ buttonText }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  showButton?: boolean;
  buttonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索...',
  disabled: false,
  showButton: true,
  buttonText: '搜索',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [value: string];
  enter: [value: string];
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleSearch = () => {
  emit('search', props.modelValue);
};

const handleEnter = (event: KeyboardEvent) => {
  const target = event.target as HTMLInputElement;
  emit('enter', target.value);
};
</script>

<style lang="scss" scoped>
.ui-search-bar {
  @include flex-between();
  gap: spacing(2);
  padding: spacing(2);
  background: color(white);
  border-radius: border-radius(lg);
  border: 1px solid map-get($colors, gray-200);

  &:focus-within {
    border-color: color(primary);
    box-shadow: 0 0 0 3px rgba(color(primary), 0.1);
  }

  &__icon {
    color: text-color(disabled);
    font-size: font(lg);
  }

  &__input {
    flex: 1;
    border: none;
    outline: none;
    font-size: font(base);
    color: text-color(primary);
    background: transparent;

    &::placeholder {
      color: text-color(disabled);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__button {
    flex-shrink: 0;
  }
}
</style>
