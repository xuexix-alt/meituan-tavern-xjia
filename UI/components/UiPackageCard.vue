<template>
  <UiCard clickable hoverable @click="handleClick">
    <div class="ui-package-card">
      <div class="ui-package-card__avatar">
        <i v-if="icon" :class="icon"></i>
        <span v-else>{{ fallbackText }}</span>
      </div>
      <div class="ui-package-card__content">
        <h4 class="ui-package-card__name">{{ name }}</h4>
        <div class="ui-package-card__desc">
          <UiBadge
            v-for="tag in tags.slice(0, 4)"
            :key="tag"
            size="sm"
            variant="primary"
          >
            {{ tag }}
          </UiBadge>
          <span v-if="tags.length === 0" class="ui-package-card__fallback">
            {{ description }}
          </span>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from './UiCard.vue';
import UiBadge from './UiBadge.vue';

interface Props {
  id?: string | number;
  name: string;
  description?: string;
  tags?: string[];
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
});

const emit = defineEmits<{
  click: [id?: string | number];
}>();

const fallbackText = computed(() => {
  return props.name.charAt(0);
});

const handleClick = () => {
  emit('click', props.id);
};
</script>

<style lang="scss" scoped>
.ui-package-card {
  @include flex-center();
  gap: spacing(4);
  width: 100%;

  &__avatar {
    width: 48px;
    height: 48px;
    @include flex-center();
    background: rgba(color(primary), 0.1);
    color: color(primary);
    border-radius: border-radius(lg);
    font-size: font(xl);
    font-weight: font(bold);
    flex-shrink: 0;

    i {
      font-size: inherit;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__name {
    margin: 0 0 spacing(1) 0;
    font-size: font(base);
    font-weight: font(semibold);
    color: text-color(primary);
    @include text-truncate();
  }

  &__desc {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(1);

    .ui-badge {
      font-size: font(2xs);
    }
  }

  &__fallback {
    font-size: font(sm);
    color: text-color(secondary);
    @include text-truncate-multiple(2);
  }
}
</style>
