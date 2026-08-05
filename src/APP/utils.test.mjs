import { navigateToDefaultPage } from './utils.ts';

const globalScope = globalThis;
globalScope.waitGlobalInitialized = async () => undefined;
globalScope.Mvu = {
  getMvuData: () => ({
    stat_data: {
      服务中的订单: {
        ORDER_ACTIVE: { 订单状态: '服务中' },
      },
    },
  }),
};

const target = await navigateToDefaultPage();
if (target !== '/service') {
  throw new Error(`记录型订单存在时应进入服务页，实际进入: ${target}`);
}

console.log('APP record navigation contract passed');
