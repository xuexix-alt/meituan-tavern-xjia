// Declare global functions available in the Tavern environment
declare function getVariables(scope: { type: string; script_id?: string }): any;
declare function replaceVariables(variables: any, scope: { type: string; script_id?: string }): void;

import { MvuState } from './mvuSchema';

export type MvuShop = MvuState['店铺列表'][string];
export type MvuPackage = MvuShop['packages'][number];

export interface AppShop {
  id: string; // The record key in MVU
  shop_id?: string | number; // internal numeric/string id
  name?: string;
  shoptags?: string[];
  slogan?: string; // Not in MVU schema, might be lost or mapped to description?
  theme?: string; // Not in MVU schema
  packages: AppPackage[];
}

export interface AppPackage {
  id?: string;
  name: string;
  price: string | number;
  stars: number;
  icon?: string | null;
  tags: string[];
  image1: string;
  image2: string;
  image3: string;
  description: string;
  content: string[];
  reviews: string[];
  // App might have extras not in MVU
}

export const shopStoreMvu = {
  getShops(): AppShop[] {
    try {
      const vars = getVariables({ type: 'global' });
      const statData = vars?.stat_data || vars || {};
      const shopRecord: Record<string, MvuShop> = statData['店铺列表'] || {};

      return Object.entries(shopRecord).map(([key, mvuShop]) => {
        return {
          id: key,
          shop_id: String(mvuShop.shop_id || ''),
          name: mvuShop.shopname,
          shoptags: mvuShop.shoptags || [],
          slogan: (mvuShop.shoptags && mvuShop.shoptags.join(' / ')) || '优质服务', // Infer slogan
          theme: (mvuShop.shoptags && mvuShop.shoptags[0]) || '默认', // Infer theme
          packages: (mvuShop.packages || []).map(pkg => ({
            name: pkg.name,
            price: pkg.price,
            stars: pkg.stars,
            icon: pkg.icon,
            tags: pkg.tags || [],
            image1: pkg.image1 || '',
            image2: pkg.image2 || '',
            image3: pkg.image3 || '',
            description: pkg.description || '',
            content: pkg.content || [],
            reviews: pkg.reviews || [],
            // Reconstruct derived fields if needed
          })),
        };
      });
    } catch (e) {
      console.error('[ShopStoreMVU] getShops failed', e);
      return [];
    }
  },

  saveShops(shops: AppShop[]) {
    try {
      const shopRecord: Record<string, MvuShop> = {};

      shops.forEach(shop => {
        const key = shop.id || `shop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        // Convert AppShop to MvuShop
        const mvuShop: MvuShop = {
          shopname: shop.name || '未命名店铺',
          shop_id: Number(shop.shop_id) || 0,
          shoptags: shop.shoptags || [],
          packages: (shop.packages || []).map(pkg => ({
            name: pkg.name || '未命名套餐',
            price: Number(pkg.price) || 0,
            stars: Number(pkg.stars) || 0,
            icon: pkg.icon || '',
            tags: pkg.tags || [],
            image1: pkg.image1 || '',
            image2: pkg.image2 || '',
            image3: pkg.image3 || '',
            description: pkg.description || '',
            content: pkg.content || [],
            reviews: pkg.reviews || [],
          })),
        };

        shopRecord[key] = mvuShop;
      });

      // We need to update 'stat_data.店铺列表'
      // To ensure we don't wipe other data in stat_data, we should read, merge and update.
      const vars = getVariables({ type: 'global' }) || {};
      const currentStat = vars.stat_data || {};
      const newStat = { ...currentStat, 店铺列表: shopRecord };

      replaceVariables({ stat_data: newStat }, { type: 'global' });

      // Also trigger an event to notify listeners (like Discover.vue)
      window.dispatchEvent(new CustomEvent('shop:cache:updated'));
    } catch (e) {
      console.error('[ShopStoreMVU] saveShops failed', e);
    }
  },

  deleteShop(id: string) {
    try {
      const currentShops = this.getShops();
      const newShops = currentShops.filter(s => s.id !== id);
      this.saveShops(newShops);
    } catch (e) {
      console.error('[ShopStoreMVU] deleteShop failed', e);
    }
  },
};
