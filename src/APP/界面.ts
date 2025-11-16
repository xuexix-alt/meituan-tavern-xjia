import { createMemoryHistory, createRouter } from 'vue-router';

// 路由懒加载 - 使用动态导入减少初始包大小
const Home = () => import('./Home.vue');
const Discover = () => import('./Discover.vue');
const Service = () => import('./Service.vue');
const History = () => import('./History.vue');
const Me = () => import('./Me.vue');
const ShopDetail = () => import('./ShopDetail.vue');
const ItemDetail = () => import('./ItemDetail.vue');

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home, name: 'Home' },
    { path: '/discover', component: Discover, name: 'Discover' },
    { path: '/service', component: Service, name: 'Service' },
    { path: '/history', component: History, name: 'History' },
    { path: '/me', component: Me, name: 'Me' },
    { path: '/shop/:id', component: ShopDetail, name: 'ShopDetail', props: true },
    { path: '/item/:id', component: ItemDetail, name: 'ItemDetail', props: true },
  ],
  // 路由性能优化
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

export default router;
