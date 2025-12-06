import { createMemoryHistory, createRouter } from 'vue-router';

// 路由懒加载 - 使用动态导入减少初始包大小
const SplashScreen = () => import('./SplashScreen.vue');
const Home = () => import('./Home.vue');
const Discover = () => import('./Discover.vue');
const Service = () => import('./Service.vue');
const History = () => import('./History.vue');
const Me = () => import('./Me.vue');
const ShopDetail = () => import('./ShopDetail.vue');
const ItemDetail = () => import('./ItemDetail.vue');

/**
 * 智能导航函数 - 根据服务状态决定默认页面
 */
export async function navigateToDefaultPage() {
  try {
    // 等待MVU初始化 (最多等待2秒)
    await Promise.race([
      waitGlobalInitialized('Mvu'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MVU初始化超时')), 2000)),
    ]);

    // 获取MVU数据
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' }) as any;

    if (!mvuData) {
      console.log('[智能导航] MVU数据为空，跳转到首页');
      return '/home';
    }

    // 检查订单数据
    const orders = mvuData.stat_data?.['服务中的订单'] || mvuData['服务中的订单'];

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      console.log('[智能导航] 未找到服务中的订单，跳转到首页');
      return '/home';
    }

    // 过滤出服务中的订单（排除服务结束的）
    const activeOrders = orders.filter((order: any) => {
      const orderStatus = order.订单状态 || '';
      return !orderStatus.includes('服务结束');
    });

    if (activeOrders.length === 0) {
      console.log('[智能导航] 所有订单都已结束，跳转到首页');
      return '/home';
    }

    console.log(`[智能导航] 找到 ${activeOrders.length} 个服务中的订单，跳转到服务页面`);
    return '/service';
  } catch (error) {
    console.error('[智能导航] 检查服务状态失败:', error);
    return '/home';
  }
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: SplashScreen, name: 'SplashScreen' },
    { path: '/home', component: Home, name: 'Home' },
    { path: '/discover', component: Discover, name: 'Discover' },
    { path: '/service', component: Service, name: 'Service' },
    { path: '/history', component: History, name: 'History' },
    { path: '/me', component: Me, name: 'Me' },
    { path: '/shop/:id', component: ShopDetail, name: 'ShopDetail', props: true },
    { path: '/item/:id', component: ItemDetail, name: 'ItemDetail', props: true },
  ],
  // 路由性能优化
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

export default router;
