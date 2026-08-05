// 无 UI 的调试脚本：仅注册 Schema 并启用 message → global 的店铺列表合并
// 可在 SillyTavern 后台或测试环境加载此文件，复用正式 Schema 逻辑

// @ts-expect-error URL import provided by Tavern Helper
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import $ from 'jquery';
import _ from 'lodash';

import { Schema } from './index';
import { GlobalSchema } from './global-schema';

declare const getVariables: any;
declare const replaceVariables: any;
declare const eventOn: any;
declare const Mvu: any;

// --- 兼容补丁：旧版脚本会调用 m.getStoredConfigs()，这里兜底一个空实现 ---
const m = (window as any).m || ((window as any).m = {});
if (typeof m.getStoredConfigs !== 'function') {
  m.getStoredConfigs = () => ({});
}
// --- 兼容补丁结束 ---

$(() => {
  try {
    registerMvuSchema(Schema);
    console.log('[MVU Headless] Schema registered');
  } catch (e) {
    console.error('[MVU Headless] register schema failed', e);
  }

  // message -> global 单向合并店铺列表，便于调试跨楼层数据
  if (typeof eventOn === 'function' && typeof Mvu !== 'undefined' && Mvu.events) {
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (vars: any) => {
      const msgShops = _.get(vars, 'stat_data.店铺列表');
      if (!msgShops || _.isEmpty(msgShops)) return;

      try {
        const globalData = getVariables({ type: 'global' }) || {};
        const current = _.get(globalData, 'stat_data.店铺列表') || {};
        const merged = { ...current, ...msgShops };
        if (_.isEqual(merged, current)) return;

        const parsed = GlobalSchema.parse({ 店铺列表: merged }).店铺列表;
        _.set(globalData, 'stat_data.店铺列表', parsed);
        replaceVariables(globalData, { type: 'global' });
        console.log('[MVU Headless] 合并店铺列表至 global');
      } catch (e) {
        console.warn('[MVU Headless] 合并店铺列表失败', e);
      }
    });
  }
});
