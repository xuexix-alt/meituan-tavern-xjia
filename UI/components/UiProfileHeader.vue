<template>
  <div class="ui-profile-header">
    <div class="ui-profile-header__background"></div>
    <div class="ui-profile-header__content">
      <div class="ui-profile-header__avatar">
        <img v-if="avatar" :src="avatar" :alt="name" />
        <div v-else class="ui-profile-header__avatar-placeholder">
          {{ name.charAt(0) }}
        </div>
      </div>
      <div class="ui-profile-header__info">
        <h2 class="ui-profile-header__name">{{ name }}</h2>
        <p class="ui-profile-header__subtitle">{{ subtitle }}</p>
        <div class="ui-profile-header__badges">
          <slot name="badges" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;
  subtitle?: string;
  avatar?: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.ui-profile-header {
  position: relative;
  padding: spacing(6);
  overflow: hidden;

  &__background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(135deg, color(primary) 0%, color(primary-light) 100%);
    opacity: 0.1;
  }

  &__content {
    position: relative;
    @include flex-center();
    gap: spacing(4);
  }

  &__avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid color(white);
    box-shadow: map-get($shadows, lg);
    background: color(white);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &-placeholder {
      width: 100%;
      height: 100%;
      @include flex-center();
      background: color(primary);
      color: color(white);
      font-size: font(3xl);
      font-weight: font(bold);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    margin: 0 0 spacing(1) 0;
    font-size: font(2xl);
    font-weight: font(bold);
    color: text-color(primary);
  }

  &__subtitle {
    margin: 0 0 spacing(2) 0;
    font-size: font(base);
    color: text-color(secondary);
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: spacing(2);
  }
}
</style>
