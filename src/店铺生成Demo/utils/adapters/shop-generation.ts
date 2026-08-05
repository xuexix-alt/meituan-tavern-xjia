import { shopStoreMvu } from '../../../APP后台版/shared/shopStoreMvu';
import { InteractionAdapter } from '../types';

// 声明全局变量
declare const Mvu: any;
declare const waitGlobalInitialized: (name: string) => Promise<void>;
declare const injectPrompts: any;
declare const uninjectPrompts: any;

interface ShopGenerationInput {
  keyword: string;
}

interface ShopGenerationParsedData {
  jsonPatch?: any[];
  analysis?: string;
}

export class ShopGenerationAdapter implements InteractionAdapter<ShopGenerationInput, ShopGenerationParsedData> {
  async buildPrompt(input: ShopGenerationInput): Promise<string> {
    // 注入提示词以激活世界书条目
    // 这些提示词不会发送给AI，但会触发世界书的关键词扫描
    const injectionId = `shop-generation-${Date.now()}`;

    injectPrompts(
      [
        {
          id: injectionId,
          position: 'none', // 不发送给AI，仅用于激活世界书
          depth: 0,
          role: 'system',
          content: '【后台系统触发指南】[mvu_update]变量列表 [mvu_update]变量更新格式',
          should_scan: true, // 作为扫描文本激活世界书
        },
      ],
      { once: true },
    ); // 仅在下一次生成中有效

    // 返回用户搜索指令
    return `用户搜索：${input.keyword}\n\n请根据世界书规则生成店铺数据。`;
  }

  async parseResponse(rawText: string): Promise<ShopGenerationParsedData> {
    console.log('[ShopGenerationAdapter] 开始解析响应，原始文本长度:', rawText.length);
    console.log('[ShopGenerationAdapter] 原始文本前500字:', rawText.substring(0, 500));

    const startTag = '[手机界面开始]';
    const endTag = '[手机界面结束]';

    const startIndex = rawText.indexOf(startTag);
    const endIndex = rawText.indexOf(endTag);

    console.log('[ShopGenerationAdapter] 标签位置 - 开始:', startIndex, '结束:', endIndex);

    if (startIndex === -1 || endIndex === -1) {
      console.warn('[ShopGenerationAdapter] 无法找到[手机界面开始]或[手机界面结束]标签');
      console.warn('[ShopGenerationAdapter] 完整响应文本:', rawText);
      return {};
    }

    const content = rawText.substring(startIndex + startTag.length, endIndex);
    console.log('[ShopGenerationAdapter] 提取的内容长度:', content.length);
    console.log('[ShopGenerationAdapter] 提取的内容:', content);

    // 提取 json_patch
    const jsonPatchMatch = content.match(/<json_patch>([\s\S]*?)<\/json_patch>/);
    console.log('[ShopGenerationAdapter] JSON Patch 匹配结果:', jsonPatchMatch ? '找到' : '未找到');

    let jsonPatch = null;

    if (jsonPatchMatch && jsonPatchMatch[1]) {
      console.log('[ShopGenerationAdapter] JSON Patch 原始字符串:', jsonPatchMatch[1]);
      try {
        jsonPatch = JSON.parse(jsonPatchMatch[1].trim());
        console.log('[ShopGenerationAdapter] JSON Patch 解析成功:', jsonPatch);
      } catch (e) {
        console.error('[ShopGenerationAdapter] JSON Patch 解析失败', e);
        console.error('[ShopGenerationAdapter] 失败的 JSON 字符串:', jsonPatchMatch[1]);
      }
    }

    // 提取分析内容
    const analysisMatch = content.match(/<update_analysis>([\s\S]*?)<\/update_analysis>/);
    const analysis = analysisMatch ? analysisMatch[1].trim() : undefined;

    return {
      jsonPatch,
      analysis,
    };
  }

  async handleSideEffects(parsedData: ShopGenerationParsedData): Promise<void> {
    // MVU框架会自动扫描消息楼层并应用更新命令
    // 但为了确保“店铺列表”更新到全局变量（而不是楼层变量），我们在这里手动拦截并保存到全局

    if (parsedData.jsonPatch && Array.isArray(parsedData.jsonPatch)) {
      console.log('[ShopGenerationAdapter] 检测到 JSON Patch，正在处理全局更新:', parsedData.jsonPatch);

      // 1. 遍历 Patch，查找对 /店铺列表 的修改
      let shopsToSave: any = null;

      for (const patch of parsedData.jsonPatch) {
        // 匹配 /店铺列表 或 /店铺列表/xxx
        if (patch.path === '/店铺列表' && patch.op === 'replace') {
          shopsToSave = patch.value;
        }
        // TODO: 如果有更复杂的局部更新（add/remove），需要读取当前全局变量并应用 patch
        // 目前 prompt.txt 主要使用 replace /店铺列表
      }

      // 2. 如果有全量更新，保存到全局变量
      if (shopsToSave) {
        console.log('[ShopGenerationAdapter] 正在保存店铺列表到全局变量...');
        try {
          // 转换为数组格式（如果 Schema 中是 Record，这里可能需要根据 shopStoreMvu 的期望格式调整）
          // shopStoreMvu.saveShops 期望 MvuShop[] 数组
          // 但 Patch value 是 Record<string, MvuShop>

          let shopsArray: any[] = [];
          if (Array.isArray(shopsToSave)) {
            shopsArray = shopsToSave;
          } else if (typeof shopsToSave === 'object') {
            shopsArray = Object.values(shopsToSave);
          }

          // 使用 shopStoreMvu 保存（它会自动处理到 stat_data.店铺列表）
          shopStoreMvu.saveShops(shopsArray);
          console.log('[ShopGenerationAdapter] 全局变量保存成功');
        } catch (e) {
          console.error('[ShopGenerationAdapter] 全局变量保存失败', e);
        }
      }

      // 3. 通过事件通知 UI 更新（用于立即刷新界面）
      (window as any).__DEMO_SHOP_DATA__ = parsedData.jsonPatch;
      window.dispatchEvent(new CustomEvent('shop-data-updated', { detail: parsedData.jsonPatch }));

      console.log('[ShopGenerationAdapter] 已触发UI更新事件');
    } else {
      console.warn('[ShopGenerationAdapter] 未找到有效的 JSON Patch');
    }
  }
}
