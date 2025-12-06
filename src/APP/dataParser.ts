/**
 * 数据解析工具模块
 * 统一管理从酒馆消息中提取和解析店铺、套餐数据的逻辑
 */

/**
 * 从酒馆消息提取数据 - 增强版，支持回退到最近楼层
 * @returns 包含店铺和套餐数据的对象
 */
export function extractDataFromMessage(): { shops: any[]; packages: any[] } {
  try {
    // 尝试从当前楼层获取数据
    const currentMessageId = String(getCurrentMessageId());
    const currentData = extractDataFromSpecificMessage(currentMessageId);
    if (currentData) {
      console.log('[DataParser] 从当前楼层获取到数据');
      return currentData;
    }

    // 当前楼层没有数据，尝试从最近楼层获取
    console.log('[DataParser] 当前楼层无数据，尝试从最近楼层获取...');
    // 确保 currentMessageId 是字符串
    const currentIdStr = String(currentMessageId || '');
    const currentIdNum = parseInt(currentIdStr.replace('msg_', ''));

    if (!isNaN(currentIdNum)) {
      for (let i = 1; i <= 10; i++) {
        const historicalMessageId = `msg_${currentIdNum - i}`;
        const historicalData = extractDataFromSpecificMessage(historicalMessageId);
        if (historicalData) {
          console.log(`[DataParser] 从 ${i} 个楼层前找到数据`);
          return historicalData;
        }
      }
    } else {
      console.warn('[DataParser] 无法解析当前消息ID，跳过历史回溯:', currentIdStr);
    }

    // 所有方式都失败，返回空数据
    console.warn('[DataParser] 未找到任何楼层的手机界面数据，显示空状态');
    return { shops: [], packages: [] };
  } catch (e) {
    console.warn('[DataParser] 数据提取失败:', e);
    return { shops: [], packages: [] };
  }
}

/**
 * 从指定楼层提取数据
 * @param messageId 消息楼层ID
 * @returns 包含店铺和套餐数据的对象，如果失败返回null
 */
export function extractDataFromSpecificMessage(messageId: string): { shops: any[]; packages: any[] } | null {
  try {
    const messages = getChatMessages(messageId);
    if (!messages || messages.length === 0) {
      return null;
    }

    const messageContent = messages[0].message;
    // 支持不区分大小写的标签匹配，并处理可能的空白字符
    const match = messageContent.match(/\[手机界面开始\]([\s\S]*?)\[手机界面结束\]/i);

    if (!match || !match[1]) {
      return null;
    }

    const dataText = match[1].trim();
    if (!dataText) return null;

    return parseShopData(dataText);
  } catch (e) {
    return null;
  }
}

/**
 * 解析店铺数据
 * @param text 包含店铺和套餐信息的文本
 * @returns 包含解析后的店铺和套餐数组的对象
 */
export function parseShopData(text: string): { shops: any[]; packages: any[] } {
  const shops: any[] = [];
  const packages: any[] = [];
  let packageCounter = 0;

  const shopSections = text.split('[店铺]').slice(1);

  shopSections.forEach((shopSection, shopIndex) => {
    const shopMatch = shopSection.match(/([\s\S]*?)\[套餐\]/);
    if (!shopMatch) return;

    const shopLines = shopMatch[1]
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const shop: any = {
      id: `shop_${shopIndex}`,
      name: '未命名店铺',
      shoptags: [],
      slogan: '优质服务',
      theme: '默认',
      packages: [],
    };

    // 解析店铺信息
    const nameLine = shopLines.find(line => line.startsWith('name:'));
    if (nameLine) {
      shop.name = nameLine.substring(5).trim();
    }

    const shoptagsIndex = shopLines.findIndex(line => line.startsWith('shoptags:'));
    if (shoptagsIndex !== -1) {
      for (let i = shoptagsIndex + 1; i < shopLines.length; i++) {
        if (shopLines[i].startsWith('- ')) {
          shop.shoptags.push(shopLines[i].substring(2).trim());
        } else if (shopLines[i].includes(':')) {
          break;
        }
      }
    }

    if (shop.shoptags.length > 0) {
      shop.slogan = shop.shoptags.join(' / ');
      shop.theme = shop.shoptags[0] || '默认';
    }

    // 解析套餐
    const packageSections = shopSection.split('[套餐]').slice(1);

    packageSections.forEach(pkgSection => {
      const pkgLines = pkgSection
        .split('[/套餐]')[0]
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      if (pkgLines.length === 0) return;

      const pkg: any = {
        id: `pkg_${packageCounter++}`,
        shop_id: shop.id,
        shop_name: shop.name,
        name: '',
        price: 'N/A',
        stars: 0,
        tags: [],
        icon: null,
        image1: '',
        image2: '',
        image3: '',
        description: '',
        content: [],
        reviews: [],
      };

      let currentArrayField: string | null = null;

      pkgLines.forEach(line => {
        const match = line.match(/^([^:]+):(.*)$/);
        if (match) {
          const fieldName = match[1].trim();
          const value = match[2].trim();

          if (['name', 'price', 'stars', 'icon', 'image1', 'image2', 'image3', 'description'].includes(fieldName)) {
            pkg[fieldName] = fieldName === 'stars' ? parseFloat(value) || 0 : value;
            currentArrayField = null;
          } else if (['tags', 'content', 'reviews'].includes(fieldName)) {
            currentArrayField = fieldName;
            if (value) {
              pkg[fieldName].push(
                value
                  .replace(/^- /, '')
                  .trim()
                  .replace(/^["']|["']$/g, ''),
              );
            }
          }
        } else if (line.startsWith('- ') && currentArrayField) {
          pkg[currentArrayField].push(
            line
              .substring(2)
              .trim()
              .replace(/^["']|["']$/g, ''),
          );
        }
      });

      if (pkg.name) {
        shop.packages.push(pkg);
        packages.push(pkg);
      }
    });

    shops.push(shop);
  });

  return { shops, packages };
}
