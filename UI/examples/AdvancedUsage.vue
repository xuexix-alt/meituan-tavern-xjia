<template>
  <div class="example-advanced">
    <!-- 高级组合使用示例 -->
    <UiStatusPanel title="服务状态面板" icon="heart">
      <template #actions>
        <UiButton variant="ghost" size="sm" icon="cog">设置</UiButton>
      </template>

      <div class="status-content">
        <UiProfileHeader
          name="美人名称"
          subtitle="25岁 · 学生"
          avatar="/avatar.jpg"
        >
          <template #badges>
            <UiBadge variant="hot">HOT</UiBadge>
            <UiBadge variant="recommend">推荐</UiBadge>
          </template>
        </UiProfileHeader>

        <UiListSection title="基本信息">
          <UiGrid :columns="2" gap="sm">
            <UiInfoCard
              label="亲密度"
              :value="intimacy + '%'"
              icon="heart"
              icon-color="danger"
              value-color="danger"
            />
            <UiInfoCard
              label="好感度"
              :value="affection + '%'"
              icon="star"
              icon-color="warning"
              value-color="warning"
            />
            <UiInfoCard
              label="当前状态"
              value="在线"
              icon="circle"
              icon-color="success"
              value-color="success"
            />
            <UiInfoCard
              label="服务次数"
              :value="serviceCount.toString()"
              icon="history"
              icon-color="info"
              value-color="info"
            />
          </UiGrid>
        </UiListSection>

        <UiListSection title="互动记录">
          <UiCard v-for="record in interactionRecords" :key="record.id">
            <div class="interaction-item">
              <div class="interaction-icon">
                <i :class="`fas fa-${record.icon}`"></i>
              </div>
              <div class="interaction-content">
                <h4>{{ record.title }}</h4>
                <p>{{ record.description }}</p>
                <span class="interaction-time">{{ record.time }}</span>
              </div>
            </div>
          </UiCard>
        </UiListSection>

        <div class="action-section">
          <UiButton variant="filled" size="lg" block icon="heart">
            发起互动
          </UiButton>
          <UiButton variant="outline" size="lg" block icon="comment">
            发送消息
          </UiButton>
        </div>
      </div>
    </UiStatusPanel>
  </div>
</template>

<script setup lang="ts">
import {
  UiStatusPanel,
  UiButton,
  UiProfileHeader,
  UiListSection,
  UiGrid,
  UiInfoCard,
  UiCard,
  UiBadge,
} from '@/UI/components';

// 响应式数据
const intimacy = ref(85);
const affection = ref(92);
const serviceCount = ref(15);

const interactionRecords = ref([
  {
    id: 1,
    title: '赠送礼物',
    description: '收到了一束玫瑰花',
    icon: 'gift',
    time: '2小时前',
  },
  {
    id: 2,
    title: '约会邀请',
    description: '接受了咖啡约会邀请',
    icon: 'coffee',
    time: '1天前',
  },
  {
    id: 3,
    title: '视频通话',
    description: '进行了30分钟视频通话',
    icon: 'video',
    time: '3天前',
  },
]);
</script>

<style lang="scss" scoped>
.example-advanced {
  padding: spacing(6);
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: spacing(6);
}

.interaction-item {
  display: flex;
  gap: spacing(4);
  padding: spacing(4);
  background: rgba(color(primary), 0.02);
  border-radius: border-radius(md);
  border: 1px solid map-get($colors, gray-200);

  .interaction-icon {
    width: 40px;
    height: 40px;
    @include flex-center();
    background: rgba(color(primary), 0.1);
    color: color(primary);
    border-radius: border-radius(lg);
    font-size: font(lg);

    i {
      font-size: inherit;
    }
  }

  .interaction-content {
    flex: 1;

    h4 {
      margin: 0 0 spacing(1) 0;
      font-size: font(base);
      font-weight: font(semibold);
      color: text-color(primary);
    }

    p {
      margin: 0 0 spacing(1) 0;
      font-size: font(sm);
      color: text-color(secondary);
      @include text-truncate-multiple(2);
    }

    .interaction-time {
      font-size: font(xs);
      color: text-color(disabled);
    }
  }
}

.action-section {
  display: flex;
  gap: spacing(3);
  margin-top: spacing(4);
}
</style>
