var __webpack_modules__ = {
  "./src/前端占位符检查脚本/加载和卸载时执行函数.ts"() {
    $(() => {
      toastr.success("前端占位符检查脚本已加载!", "脚本启动");
    });
    $(window).on("pagehide", () => {
      toastr.info("前端占位符检查脚本已卸载!", "脚本关闭");
    });
  },
  "./src/前端占位符检查脚本/添加按钮和注册按钮事件.ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    var _AI___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./监听AI生成完成 */ "./src/前端占位符检查脚本/监听AI生成完成.ts");
    $(() => {
      replaceScriptButtons([ {
        name: "检查占位符",
        visible: true
      } ]);
      eventOn(getButtonEvent("检查占位符"), async () => {
        toastr.info("正在检查最新消息的占位符...", "检查中");
        await (0, _AI___WEBPACK_IMPORTED_MODULE_0__.checkLatestMessage)();
      });
    });
  },
  "./src/前端占位符检查脚本/监听AI生成完成.ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      checkLatestMessage: () => checkLatestMessage
    });
    eventOn(tavern_events.GENERATION_ENDED, async message_id => {
      setTimeout(async () => {
        await checkAndAddPlaceholder(message_id);
      }, 100);
    });
    async function checkAndAddPlaceholder(message_id, mode = "auto") {
      try {
        const modeText = mode === "auto" ? "自动" : "手动";
        console.log(`[前端占位符] ${modeText}检查第 ${message_id} 楼消息`);
        if (typeof message_id !== "number" || message_id < 0) {
          console.log(`[前端占位符] 无效的消息ID: ${message_id}`);
          return;
        }
        let messages;
        try {
          messages = getChatMessages(message_id.toString());
        } catch (rangeError) {
          console.log(`[前端占位符] 消息ID ${message_id} 超出范围，尝试获取最新消息`);
          messages = getChatMessages(-1);
          if (messages && messages.length > 0) {
            message_id = messages[0].message_id;
            console.log(`[前端占位符] 改为${modeText}检查最新消息第 ${message_id} 楼`);
          }
        }
        if (!messages || messages.length === 0) {
          console.log(`[前端占位符] 无法获取消息内容`);
          return;
        }
        const message = messages[0];
        const placeholder = "【前端占位符】";
        if (!message.message.includes(placeholder)) {
          const newMessage = message.message + "\n" + placeholder;
          await setChatMessages([ {
            message_id,
            message: newMessage
          } ]);
          if (mode === "auto") {
            toastr.success(`自动添加界面成功！`, "自动检测完成");
          } else {
            toastr.success(`手动添加界面成功！`, "手动操作完成");
          }
          console.log(`[前端占位符] ${modeText}已在第 ${message_id} 楼添加占位符`);
        } else {
          console.log(`[前端占位符] 第 ${message_id} 楼已包含占位符，跳过${modeText}添加`);
        }
      } catch (error) {
        const modeText = mode === "auto" ? "自动" : "手动";
        toastr.error(`${modeText}处理第 ${message_id} 楼消息时出错: ${error}`, `${modeText}操作失败`);
        console.error(`[前端占位符] ${modeText}处理第 ${message_id} 楼消息时出错:`, error);
      }
    }
    async function checkLatestMessage() {
      try {
        console.log(`[前端占位符] 手动检查最新消息`);
        const message_id = getLastMessageId();
        console.log(`[前端占位符] 获取到最新消息ID: ${message_id}`);
        if (message_id === 0) {
          toastr.warning("当前聊天没有消息", "提示");
          return;
        }
        await checkAndAddPlaceholder(message_id, "manual");
      } catch (error) {
        toastr.error(`获取最新消息时出错: ${error}`, "手动操作失败");
        console.error(`[前端占位符] 获取最新消息时出错:`, error);
      }
    }
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
  /*!********************************!*\
  !*** ./src/前端占位符检查脚本/index.ts ***!
  \********************************/
  __webpack_require__.r(__webpack_exports__);
  var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./加载和卸载时执行函数 */ "./src/前端占位符检查脚本/加载和卸载时执行函数.ts");
  var ___WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(___WEBPACK_IMPORTED_MODULE_0__);
  var _AI___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./监听AI生成完成 */ "./src/前端占位符检查脚本/监听AI生成完成.ts");
  var ___WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./添加按钮和注册按钮事件 */ "./src/前端占位符检查脚本/添加按钮和注册按钮事件.ts");
})();