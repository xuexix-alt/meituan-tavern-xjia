<template>
  <div class="ui-star-rating">
    <button
      v-for="n in maxStars"
      :key="n"
      :class="[
        'ui-star-rating__star',
        {
          'ui-star-rating__star--filled': n <= rating,
          'ui-star-rating__star--readonly': readonly,
        }
      ]"
      :disabled="readonly"
      @click="handleStarClick(n)"
      @mouseenter="handleStarHover(n)"
      @mouseleave="handleStarHover(null)"
    >
      <i :class="n <= hoverRating ? hoverIcon : icon"></i>
    </button>
    <span v-if="showText && text" class="ui-star-rating__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: number;
  maxStars?: number;
  readonly?: boolean;
  showText?: boolean;
  text?: string;
  icon?: string;
  hoverIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  maxStars: 5,
  readonly: false,
  showText: false,
  icon: 'fa-star',
  hoverIcon: 'fa-star',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const rating = ref(props.modelValue);
const hoverRating = ref<number | null>(null);

watch(() => props.modelValue, (newValue) => {
  rating.value = newValue;
});

const handleStarClick = (star: number) => {
  if (props.readonly) return;
  rating.value = star;
  emit('update:modelValue', star);
  emit('change', star);
};

const handleStarHover = (star: number | null) => {
  if (props.readonly) return;
  hoverRating.value = star;
};
</script>

<style lang="scss" scoped>
.ui-star-rating {
  @include flex-center();
  gap: spacing(1);

  &__star {
    background: none;
    border: none;
    cursor: pointer;
    padding: spacing(1);
    color: map-get($colors, gray-300);
    font-size: font(xl);
    transition: color duration(fast) easing(smooth);

    &:hover {
      transform: scale(1.1);
    }

    &--readonly {
      cursor: default;

      &:hover {
        transform: none;
      }
    }

    &--filled {
      color: color(warning);
    }

    i {
      display: block;
    }
  }

  &__text {
    margin-left: spacing(2);
    font-size: font(sm);
    color: text-color(secondary);
    font-weight: font(medium);
  }
}
</style>
