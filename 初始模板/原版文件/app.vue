<template>
  <div class="phone-frame">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
// 根容器组件，使用路由视图
</script>

<style lang="scss" scoped>
.phone-frame {
  width: 360px;
  height: 680px;
  background-color: #f8f9fa;
  border: 8px solid #111111;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 20px 25px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  @media (max-width: 480px) {
    width: 95vw;
    max-width: 380px;
    height: 85vh;
    max-height: 700px;
    border-width: 6px;
  }

  @media (max-width: 360px) {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    border: none;
    max-width: none;
    max-height: none;
  }
}
</style>
