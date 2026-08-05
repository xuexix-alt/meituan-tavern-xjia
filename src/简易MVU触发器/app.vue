<template>
  <div class="demo-container">
    <h1>🎯 简易MVU变量更新触发器</h1>
    <p class="subtitle">后台调用AI生成JSON Patch，不触发新楼层</p>

    <div class="card">
      <h2>📋 当前MVU变量状态</h2>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">变量状态:</span>
          <span class="value" :class="{ 'success': mvuReady, 'error': !mvuReady }">
            {{ mvuReady ? '✅ 已连接' : '❌ 未连接' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">测试数据:</span>
          <span class="value">{{ testValue || '未设置' }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>🔧 变量更新操作</h2>
      <div class="button-group">
        <button @click="updateFavorability" :disabled="loading || !mvuReady" class="btn btn-primary">
          {{ loading ? '⏳ 处理中...' : '❤️ 更新好感度' }}
        </button>
        <button @click="addTestData" :disabled="loading || !mvuReady" class="btn btn-success">
          {{ loading ? '⏳ 处理中...' : '➕ 添加测试数据' }}
        </button>
        <button @click="customUpdate" :disabled="loading || !mvuReady" class="btn btn-info">
          {{ loading ? '⏳ 处理中...' : '🎨 自定义更新' }}
        </button>
      </div>
    </div>

    <div class="card" v-if="logMessages.length > 0">
      <h2>📝 操作日志</h2>
      <div class="log-container">
        <div v-for="(log, index) in logMessages" :key="index" class="log-item" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-content">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <div class="card" v-if="errorMessage">
      <h2>⚠️ 错误信息</h2>
      <div class="error-box">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { z } from 'zod';
import _ from 'lodash';

// 响应式数据
const mvuReady = ref(false);
const loading = ref(false);
const testValue = ref('');
const errorMessage = ref('');
const logMessages = ref<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' }>>([]);

// JSON Patch响应格式定义
const JsonPatchSchema = z.object({
  op: z.enum(['replace', 'add', 'remove']),
  path: z.string(),
  value: z.any(),
});

const UpdateResponseSchema = z.object({
  analysis: z.string(),
  updates: z.array(JsonPatchSchema),
});

// 添加日志
function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const time = new Date().toLocaleTimeString();
  logMessages.value.unshift({ time, message, type });
  if (logMessages.value.length > 10) {
    logMessages.value.pop();
  }
}

// 初始化MVU
async function initMvu() {
  try {
    await waitGlobalInitialized('Mvu');
    mvuReady.value = true;
    addLog('MVU框架初始化成功', 'success');

    // 读取当前测试值
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' }) as any;
    testValue.value = _.get(mvuData, 'stat_data.demo_test_value', '未设置');
  } catch (error) {
    mvuReady.value = false;
    errorMessage.value = `MVU初始化失败: ${error}`;
    addLog(`MVU初始化失败: ${error}`, 'error');
  }
}

// 后台调用AI生成变量更新
async function requestVariableUpdate(userInput: string) {
  const systemPrompt = `
你是一个MVU变量更新助手，专门生成JSON Patch格式的变量更新指令。

当前任务：${userInput}

请严格按照以下格式回复：
<update>
<update_analysis>
分析当前需要更新的变量和操作...
</update_analysis>
<json_patch>
[
  { "op": "replace", "path": "/demo_test_value", "value": "新值" }
]
</json_patch>
</update>

规则：
1. 只使用 replace、add、remove 三种操作
2. 路径使用 JSON Pointer 格式，如 /demo_test_value
3. value 可以是任意类型（数字、字符串、对象等）
4. 分析部分要详细说明为什么这样更新
`;

  addLog(`发送请求到AI: ${userInput}`, 'info');

  // 直接调用AI，不创建新楼层
  const result = await generate({
    user_input: systemPrompt,
    overrides: {
      char_description: '',
      char_personality: '',
      scenario: '',
      chat_history: {
        prompts: []
      }
    }
  });

  addLog('AI响应已接收，正在解析...', 'info');

  // 解析AI返回的结果
  const analysisMatch = result.match(/<update_analysis>([\s\S]*?)<\/update_analysis>/);
  const patchMatch = result.match(/<json_patch>([\s\S]*?)<\/json_patch>/);

  if (!patchMatch) {
    throw new Error('AI返回格式不正确：缺少<json_patch>标签');
  }

  const analysis = analysisMatch?.[1]?.trim() || '无分析';
  const jsonStr = patchMatch[1].trim();
  const updates = JSON.parse(jsonStr);

  const response = UpdateResponseSchema.parse({
    analysis,
    updates
  });

  addLog(`AI分析: ${response.analysis}`, 'info');
  return response;
}

// 应用JSON Patch更新到MVU
async function applyJsonPatch(updates: z.infer<typeof JsonPatchSchema>[]) {
  try {
    // 获取当前MVU数据
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' }) as any;
    if (!mvuData) {
      throw new Error('无法获取MVU数据');
    }

    addLog(`应用 ${updates.length} 个更新操作`, 'info');

    // 应用每个更新操作
    for (const update of updates) {
      const path = update.path.replace(/^\//, ''); // 移除开头的/

      if (update.op === 'replace') {
        _.set(mvuData.stat_data, path, update.value);
        addLog(`✓ Replace: ${path} = ${JSON.stringify(update.value)}`, 'success');
      } else if (update.op === 'add') {
        const pathParts = path.split('/');
        const key = pathParts.pop()!;
        const parent = _.get(mvuData.stat_data, pathParts.join('.')) || {};
        parent[key] = update.value;
        _.set(mvuData.stat_data, pathParts.join('.'), parent);
        addLog(`✓ Add: ${path} = ${JSON.stringify(update.value)}`, 'success');
      } else if (update.op === 'remove') {
        const pathParts = path.split('/');
        const key = pathParts.pop()!;
        const parent = _.get(mvuData.stat_data, pathParts.join('.'));
        if (parent && key in parent) {
          delete parent[key];
          addLog(`✓ Remove: ${path}`, 'success');
        }
      }
    }

    // 写回MVU数据
    await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });

    addLog('MVU数据更新完成', 'success');

    // 刷新本地显示
    testValue.value = _.get(mvuData, 'stat_data.demo_test_value', '未设置');

    return true;
  } catch (error) {
    addLog(`应用更新失败: ${error}`, 'error');
    throw error;
  }
}

// 更新好感度
async function updateFavorability() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await requestVariableUpdate('将demo_test_value设置为"好感度已更新"');
    await applyJsonPatch(response.updates);
    addLog('好感度更新成功！', 'success');
  } catch (error) {
    errorMessage.value = `更新失败: ${error}`;
    addLog(`更新失败: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
}

// 添加测试数据
async function addTestData() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const timestamp = new Date().toLocaleTimeString();
    const response = await requestVariableUpdate(`添加测试数据，时间戳为${timestamp}`);
    await applyJsonPatch(response.updates);
    addLog('测试数据添加成功！', 'success');
  } catch (error) {
    errorMessage.value = `添加失败: ${error}`;
    addLog(`添加失败: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
}

// 自定义更新
async function customUpdate() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const newValue = `自定义-${Date.now()}`;
    const response = await requestVariableUpdate(`将demo_test_value设置为复杂对象，包含值${newValue}和一个计数器`);
    await applyJsonPatch(response.updates);
    addLog('自定义更新成功！', 'success');
  } catch (error) {
    errorMessage.value = `更新失败: ${error}`;
    addLog(`更新失败: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  addLog('组件已加载', 'info');
  initMvu();
});
</script>

<style lang="scss" scoped>
.demo-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 8px;
  }

  .subtitle {
    text-align: center;
    color: #7f8c8d;
    margin-bottom: 24px;
  }
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h2 {
    margin-top: 0;
    margin-bottom: 16px;
    color: #34495e;
    font-size: 18px;
  }
}

.status-grid {
  display: grid;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;

  .label {
    font-weight: 500;
    color: #495057;
  }

  .value {
    font-family: 'Courier New', monospace;

    &.success {
      color: #28a745;
      font-weight: bold;
    }

    &.error {
      color: #dc3545;
      font-weight: bold;
    }
  }
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-primary {
    background: #007bff;
    color: white;

    &:hover:not(:disabled) {
      background: #0056b3;
    }
  }

  &.btn-success {
    background: #28a745;
    color: white;

    &:hover:not(:disabled) {
      background: #1e7e34;
    }
  }

  &.btn-info {
    background: #17a2b8;
    color: white;

    &:hover:not(:disabled) {
      background: #117a8b;
    }
  }
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  display: flex;
  gap: 8px;
  font-size: 13px;

  &.info {
    background: #e7f3ff;
    border-left: 3px solid #2196F3;
  }

  &.success {
    background: #e8f5e9;
    border-left: 3px solid #4CAF50;
  }

  &.error {
    background: #ffebee;
    border-left: 3px solid #f44336;
  }

  .log-time {
    color: #666;
    font-weight: 500;
    white-space: nowrap;
  }

  .log-content {
    flex: 1;
    word-break: break-word;
  }
}

.error-box {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #f44336;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}
</style>
