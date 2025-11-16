import { createMemoryHistory, createRouter } from 'vue-router';
import Home from './Home.vue';
import Discover from './Discover.vue';
import Service from './Service.vue';
import History from './History.vue';
import Me from './Me.vue';
import ShopDetail from './ShopDetail.vue';
import ItemDetail from './ItemDetail.vue';

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
});

export default router;
