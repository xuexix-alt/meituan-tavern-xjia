import { checkLatestMessage } from './监听AI生成完成';

// 添加手动检查按钮
$(() => {
  // 注册脚本按钮
  replaceScriptButtons([{ name: '检查占位符', visible: true }]);

  // 注册按钮点击事件
  eventOn(getButtonEvent('检查占位符'), async () => {
    toastr.info('正在检查最新消息的占位符...', '检查中');
    await checkLatestMessage();
  });
});
