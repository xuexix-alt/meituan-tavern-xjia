var __webpack_modules__ = {
  "./src/shared/shopCache.ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      SHOP_CACHE_LIMIT: () => SHOP_CACHE_LIMIT,
      mergeShopsById: () => mergeShopsById,
      normalizeShopId: () => normalizeShopId,
      normalizeShopList: () => normalizeShopList,
      normalizeStoredShop: () => normalizeStoredShop,
      removeShopById: () => removeShopById,
      updateShopCacheVariables: () => updateShopCacheVariables
    });
    const SHOP_CACHE_LIMIT = 200;
    function asNonEmptyString(value) {
      if (typeof value !== "string" && typeof value !== "number") return null;
      const text = String(value).trim();
      return text ? text : null;
    }
    function normalizeShopId(shop) {
      return asNonEmptyString(shop.shop_id) ?? asNonEmptyString(shop.id);
    }
    function normalizeStoredShop(value) {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const shop = value;
      const id = normalizeShopId(shop);
      const name = asNonEmptyString(shop.name);
      if (!id || !name) return null;
      return {
        ...shop,
        id,
        shop_id: id,
        name,
        packages: Array.isArray(shop.packages) ? shop.packages : []
      };
    }
    function normalizeShopList(value) {
      if (!Array.isArray(value)) return [];
      return value.map(normalizeStoredShop).filter(shop => shop !== null);
    }
    function mergeShopsById(existing, incoming) {
      const merged = new Map;
      for (const shop of normalizeShopList(existing)) merged.set(shop.shop_id, shop);
      for (const shop of normalizeShopList(incoming)) merged.set(shop.shop_id, shop);
      return Array.from(merged.values()).slice(-SHOP_CACHE_LIMIT);
    }
    function removeShopById(existing, shopId) {
      const target = String(shopId).trim();
      return normalizeShopList(existing).filter(shop => shop.shop_id !== target);
    }
    function updateShopCacheVariables(variables, incoming, key = "shop_store_cache") {
      return {
        ...variables,
        [key]: mergeShopsById(variables[key], incoming)
      };
    }
  },
  zod(module) {
    module.exports = z;
  }
};

const __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
  const cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  const module = __webpack_module_cache__[moduleId] = {
    exports: {}
  };
  if (!(moduleId in __webpack_modules__)) {
    delete __webpack_module_cache__[moduleId];
    const e = new Error("Cannot find module '" + moduleId + "'");
    e.code = "MODULE_NOT_FOUND";
    throw e;
  }
  __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
  return module.exports;
}

(() => {
  __webpack_require__.n = module => {
    const getter = module && module.__esModule ? () => module["default"] : () => module;
    __webpack_require__.d(getter, {
      a: getter
    });
    return getter;
  };
})();

(() => {
  __webpack_require__.d = (exports, definition) => {
    if (Array.isArray(definition)) {
      var i = 0;
      while (i < definition.length) {
        var key = definition[i++];
        var binding = definition[i++];
        if (!__webpack_require__.o(exports, key)) {
          if (binding === 0) {
            Object.defineProperty(exports, key, {
              enumerable: true,
              value: definition[i++]
            });
          } else {
            Object.defineProperty(exports, key, {
              enumerable: true,
              get: binding
            });
          }
        } else if (binding === 0) {
          i++;
        }
      }
    } else {
      for (var key in definition) {
        if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
          Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key]
          });
        }
      }
    }
  };
})();

(() => {
  __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
})();

(() => {
  __webpack_require__.r = exports => {
    if (Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, {
        value: "Module"
      });
    }
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
  };
})();

let __webpack_exports__ = {};

(() => {
  /*!******************************!*\
  !*** ./src/前端占位符脚本/index.ts ***!
  \******************************/
  __webpack_require__.r(__webpack_exports__);
  __webpack_require__.d(__webpack_exports__, {
    getSettings: () => getSettings,
    updateSettings: () => updateSettings
  });
  var zod__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! zod */ "zod");
  var zod__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(zod__WEBPACK_IMPORTED_MODULE_0__);
  var _shared_shopCache__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/shopCache */ "./src/shared/shopCache.ts");
  const ScriptSettings = zod__WEBPACK_IMPORTED_MODULE_0__.z.object({
    enabled: zod__WEBPACK_IMPORTED_MODULE_0__.z.boolean().default(true),
    placeholder_text: zod__WEBPACK_IMPORTED_MODULE_0__.z.string().default("【前端占位符】"),
    auto_insert: zod__WEBPACK_IMPORTED_MODULE_0__.z.boolean().default(true),
    show_notification: zod__WEBPACK_IMPORTED_MODULE_0__.z.boolean().default(true),
    keep_cross_chat: zod__WEBPACK_IMPORTED_MODULE_0__.z.boolean().default(true)
  });
  const settings = ScriptSettings.parse(getVariables({
    type: "script",
    script_id: getScriptId()
  }));
  const SHOP_STORE_KEY = "shop_store_cache";
  const MAX_IMPORT_ITEMS = 200;
  function emitShopEvent(event, payload) {
    try {
      window.dispatchEvent(new CustomEvent(event, {
        detail: payload
      }));
    } catch (e) {
      console.warn("[ShopStore] 事件派发失败", e);
    }
  }
  function hashKey(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = hash * 31 + str.charCodeAt(i) >>> 0;
    return hash.toString(16);
  }
  function checksumPayload(str) {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum = (sum + str.charCodeAt(i)) % 65536;
    }
    return sum.toString(16);
  }
  function buildShopId(s) {
    if (s?.id) return String(s.id);
    if (s?.shop_id) return String(s.shop_id);
    const basis = [ s?.name, s?.address, s?.city ].filter(Boolean).join("|");
    return `shop_${hashKey(basis || JSON.stringify(s || {}))}`;
  }
  function getStoreScope() {
    return {
      type: "global"
    };
  }
  function readShopStore() {
    try {
      const vars = getVariables(getStoreScope()) || {};
      const list = vars[SHOP_STORE_KEY];
      console.log("[ShopStore] 读取全局缓存:", list);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn("[ShopStore] 读取失败", e);
      return [];
    }
  }
  function writeShopStore(shops) {
    try {
      console.log("[ShopStore] 写入全局缓存:", shops);
      updateVariablesWith(variables => ({
        ...variables,
        [SHOP_STORE_KEY]: shops
      }), getStoreScope());
      emitShopEvent("shop:cache:updated", {
        scope: getStoreScope(),
        count: shops.length,
        op: "write"
      });
    } catch (e) {
      console.warn("[ShopStore] 写入失败", e);
    }
  }
  function normalizeShops(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(s => !!s).slice(0, MAX_IMPORT_ITEMS).map(s => {
      const id = buildShopId(s);
      return {
        ...s,
        id,
        __savedAt: Date.now()
      };
    });
  }
  function saveShopsToStore(newShops) {
    const incoming = normalizeShops(newShops);
    if (incoming.length === 0) return readShopStore();
    let merged = [];
    updateVariablesWith(variables => {
      merged = (0, _shared_shopCache__WEBPACK_IMPORTED_MODULE_1__.mergeShopsById)(variables[SHOP_STORE_KEY], incoming);
      return {
        ...variables,
        [SHOP_STORE_KEY]: merged
      };
    }, getStoreScope());
    emitShopEvent("shop:cache:updated", {
      scope: getStoreScope(),
      count: merged.length,
      op: "write"
    });
    return merged;
  }
  function deleteShopFromStore(shopId) {
    let filtered = [];
    updateVariablesWith(variables => {
      filtered = (0, _shared_shopCache__WEBPACK_IMPORTED_MODULE_1__.removeShopById)(variables[SHOP_STORE_KEY], shopId);
      return {
        ...variables,
        [SHOP_STORE_KEY]: filtered
      };
    }, getStoreScope());
    emitShopEvent("shop:cache:updated", {
      scope: getStoreScope(),
      count: filtered.length,
      op: "delete",
      id: shopId
    });
    return filtered;
  }
  function getStoreApi() {
    return {
      getShops: () => readShopStore(),
      saveShops: shops => saveShopsToStore(shops),
      deleteShop: id => deleteShopFromStore(id),
      clear: () => {
        writeShopStore([]);
        emitShopEvent("shop:cache:updated", {
          scope: getStoreScope(),
          count: 0,
          op: "clear"
        });
      }
    };
  }
  function containsPlaceholder(message) {
    return message.includes(settings.placeholder_text);
  }
  function insertPlaceholder(content) {
    if (content.endsWith("\n")) {
      return content + settings.placeholder_text + "\n";
    }
    return content + "\n" + settings.placeholder_text + "\n";
  }
  function getCurrentFloorMessages() {
    const messageId = getCurrentMessageId();
    const messages = getChatMessages(messageId);
    if (!messages || messages.length === 0) {
      return [];
    }
    return messages.map(msg => ({
      role: msg.role,
      content: msg.message || "",
      id: msg.id || ""
    }));
  }
  function checkAndInsertPlaceholder(options = {}) {
    const {silent = false} = options;
    try {
      const messages = getCurrentFloorMessages();
      if (messages.length === 0) {
        console.log("[前端占位符] 当前楼层无消息内容");
        return false;
      }
      const allHavePlaceholder = messages.every(msg => containsPlaceholder(msg.content));
      if (allHavePlaceholder) {
        console.log("[前端占位符] 当前楼层已包含占位符，跳过插入");
        return false;
      }
      if (settings.auto_insert) {
        const updatedMessages = messages.map(msg => ({
          ...msg,
          content: containsPlaceholder(msg.content) ? msg.content : insertPlaceholder(msg.content)
        }));
        const baseMessageId = messages[0].id;
        const fullContent = updatedMessages.map(msg => `${msg.role === "user" ? "你" : msg.role}: ${msg.content}`).join("\n\n");
        triggerSlash(`/chat u ${baseMessageId} ${fullContent}`);
        if (settings.show_notification && !silent) {
          toastr.success("[前端占位符] 已自动插入占位符", "脚本提示");
        }
        console.log("[前端占位符] 已插入占位符到当前楼层");
        return true;
      }
      return false;
    } catch (error) {
      console.error("[前端占位符] 执行失败:", error);
      if (!silent) {
        toastr.error("前端占位符插入失败，请查看控制台", "脚本错误");
      }
      return false;
    }
  }
  function manualCheck() {
    const result = checkAndInsertPlaceholder();
    if (!result && settings.show_notification) {
      toastr.info("当前楼层已包含占位符，无需插入", "脚本提示");
    }
  }
  $(() => {
    console.log("[前端占位符] 脚本已加载");
    if (settings.show_notification) {
      toastr.info('点击下方"检查占位符"按钮手动执行，或启用自动插入模式', "脚本提示");
    }
    try {
      initializeGlobal("ShopStore", getStoreApi());
      console.log("[ShopStore] 已共享全局接口");
    } catch (e) {
      console.warn("[ShopStore] 共享全局接口失败", e);
    }
  });
  eventOn(getButtonEvent("检查占位符"), () => {
    console.log("[前端占位符] 手动检查触发");
    manualCheck();
  });
  eventOn(getButtonEvent("查看已存店铺"), () => {
    const api = getStoreApi();
    if (!api) {
      toastr.warning("ShopStore 未初始化", "店铺存储");
      return;
    }
    const list = api.getShops();
    console.log("[ShopStore] 当前店铺列表:", list);
    toastr.info(`已存 ${list.length} 个店铺`, "店铺存储");
  });
  eventOn(getButtonEvent("清空店铺缓存"), () => {
    const api = getStoreApi();
    if (!api) {
      toastr.warning("ShopStore 未初始化", "店铺存储");
      return;
    }
    api.clear();
    toastr.success("店铺缓存已清空", "店铺存储");
  });
  eventOn(getButtonEvent("导出店铺JSON"), () => {
    const api = getStoreApi();
    if (!api) {
      toastr.warning("ShopStore 未初始化", "店铺存储");
      return;
    }
    const list = api.getShops();
    const payload = {
      version: "v1",
      generatedAt: (new Date).toISOString(),
      checksum: checksumPayload(JSON.stringify(list)),
      shops: list
    };
    const json = JSON.stringify(payload, null, 2);
    console.log("[ShopStore] 导出 JSON:", json);
    try {
      const blob = new Blob([ json ], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const topDoc = (window.top || window).document;
      const a = topDoc.createElement("a");
      const ts = new Date;
      const pad = n => `${n}`.padStart(2, "0");
      const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;
      a.href = url;
      a.download = `shops_${stamp}.json`;
      topDoc.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3e3);
      toastr.success(`已保存 ${list.length} 家店铺为文件 shops_${stamp}.json`, "店铺存储");
    } catch (e) {
      try {
        const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
        window.open(dataUrl, "_blank");
        toastr.info(`已在新标签页打开 JSON（共 ${list.length} 家）`, "店铺存储");
      } catch (err) {
        console.warn("[ShopStore] 文件导出失败，已退回控制台输出", err);
        toastr.warning("文件导出失败，已在控制台输出 JSON", "店铺存储");
      }
    }
  });
  eventOn(getButtonEvent("切换店铺跨聊天保留"), () => {
    if (!settings.keep_cross_chat) {
      settings.keep_cross_chat = true;
      updateVariablesWith(variables => ({
        ...variables,
        keep_cross_chat: true
      }), {
        type: "script",
        script_id: getScriptId()
      });
    }
    toastr.info("店铺缓存已固定为跨聊天共享。", "店铺存储");
  });
  eventOn(tavern_events.MESSAGE_SENT, _messageId => {
    if (settings.auto_insert && settings.enabled) {
      console.log("[前端占位符] 消息发送完成，自动检查");
      setTimeout(() => {
        checkAndInsertPlaceholder({
          silent: true
        });
      }, 100);
    }
  });
  eventOn(tavern_events.CHAT_CHANGED, newChatId => {
    console.log("[前端占位符] 聊天切换到:", newChatId);
  });
  function updateSettings(newSettings) {
    const updated = {
      ...settings,
      ...newSettings
    };
    replaceVariables(updated, {
      type: "script",
      script_id: getScriptId()
    });
    if (settings.show_notification) {
      toastr.success("设置已更新", "脚本提示");
    }
  }
  function getSettings() {
    return ScriptSettings.parse(getVariables({
      type: "script",
      script_id: getScriptId()
    }));
  }
  $(window).on("pagehide", () => {
    console.log("[前端占位符] 脚本已卸载");
  });
})();