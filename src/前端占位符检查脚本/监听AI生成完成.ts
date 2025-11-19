// 监听AI生成完成事件，自动检查并添加前端占位符
eventOn(tavern_events.GENERATION_ENDED, async (message_id: number) => {
  // 延迟100ms确保消息已完全保存
  setTimeout(async () => {
    await checkAndAddPlaceholder(message_id);
  }, 100);
});

/**
 * 检查指定楼层的消息是否包含前端占位符，如果没有则添加
 * @param message_id 消息楼层ID
 * @param mode 触发模式：'auto' 为自动添加，'manual' 为手动添加
 */
async function checkAndAddPlaceholder(message_id: number, mode: 'auto' | 'manual' = 'auto'): Promise<void> {
  try {
    const modeText = mode === 'auto' ? '自动' : '手动';
    console.log(`[前端占位符] ${modeText}检查第 ${message_id} 楼消息`);

    // 验证消息ID是否有效
    if (typeof message_id !== 'number' || message_id < 0) {
      console.log(`[前端占位符] 无效的消息ID: ${message_id}`);
      return;
    }

    // 获取指定楼层的消息，使用字符串格式避免范围错误
    let messages;
    try {
      messages = getChatMessages(message_id.toString());
    } catch (rangeError) {
      console.log(`[前端占位符] 消息ID ${message_id} 超出范围，尝试获取最新消息`);
      // 如果指定的ID无效，则获取最新消息
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
    const placeholder = '【前端占位符】';

    // 检查消息是否已包含占位符
    if (!message.message.includes(placeholder)) {
      // 在消息末尾添加占位符（另起一行）
      const newMessage = message.message + '\n' + placeholder;

      // 修改消息内容
      await setChatMessages([
        {
          message_id: message_id,
          message: newMessage,
        },
      ]);

      // 根据模式显示不同的成功提示
      if (mode === 'auto') {
        toastr.success(`自动添加界面成功！`, '自动检测完成');
      } else {
        toastr.success(`手动添加界面成功！`, '手动操作完成');
      }

      console.log(`[前端占位符] ${modeText}已在第 ${message_id} 楼添加占位符`);
    } else {
      console.log(`[前端占位符] 第 ${message_id} 楼已包含占位符，跳过${modeText}添加`);
    }
  } catch (error) {
    // 根据模式显示不同的错误提示
    const modeText = mode === 'auto' ? '自动' : '手动';
    toastr.error(`${modeText}处理第 ${message_id} 楼消息时出错: ${error}`, `${modeText}操作失败`);
    console.error(`[前端占位符] ${modeText}处理第 ${message_id} 楼消息时出错:`, error);
  }
}

/**
 * 检查当前最新楼层是否包含前端占位符，如果没有则添加（手动模式）
 */
export async function checkLatestMessage(): Promise<void> {
  try {
    console.log(`[前端占位符] 手动检查最新消息`);
    const message_id = getLastMessageId();
    console.log(`[前端占位符] 获取到最新消息ID: ${message_id}`);

    if (message_id === 0) {
      toastr.warning('当前聊天没有消息', '提示');
      return;
    }

    await checkAndAddPlaceholder(message_id, 'manual');
  } catch (error) {
    toastr.error(`获取最新消息时出错: ${error}`, '手动操作失败');
    console.error(`[前端占位符] 获取最新消息时出错:`, error);
  }
}
