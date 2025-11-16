<template>
  <UiCard clickable hoverable>
    <div class="ui-info-card">
      <div :class="['ui-info-card__icon', `bg-${iconColor}`]">
        <i v-if="icon" :class="`fas fa-${icon}`"></i>
        <slot v-else name="icon" />
      </div>
      <div class="ui-info-card__content">
        <div class="ui-info-card__label">{{ label }}</div>
        <div :class="['ui-info-card__value', `text-${valueColor}`]">
          <slot name="value">
            {{ value }}
          </slot>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from './UiCard.vue';

interface Props {
  label: string;
  value?: string | number;
  icon?: string;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  valueColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  valueColor: 'primary',
});
</script>

<style lang="scss" scoped>
.ui-info-card {
  @include flex-center();
  gap: spacing(4);

  &__icon {
    width: 48px;
    height: 48px;
    @include flex-center();
    border-radius: border-radius(lg);
    color: color(white);
    font-size: font(2xl);

    &.bg-primary {
      background-color: color(primary);
    }

    &.bg-success {
      background-color: color(success);
    }

    &.bg-warning {
      background-color: color(warning);
    }

    &.bg-danger {
      background-color: color(danger);
    }

    &.bg-info {
      background-color: color(info);
    }

    i {
      font-size: inherit;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: font(sm);
    color: text-color(secondary);
    margin-bottom: spacing(1);
  }

  &__value {
    font-size: font(lg);
    font-weight: font(bold);
    color: text-color(primary);

    &.text-primary {
      color: color(primary);
    }

    &.text-secondary {
      color: text-color(secondary);
    }

    &.text-success {
      color: color(success);
    }

    &.text-warning {
      color: color(warning);
    }

    &.text-danger {
      color: color(danger);
    }

    &.text-info {
      color: color(info);
    }
  }
}
</style>
