import { buildTavernGenerateConfig } from './tavern';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} 不一致。`);
  }
}

const payload = {
  model: 'direct-only-model',
  messages: [
    { role: 'system', content: 'system prompt' },
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'calling tool' },
    { role: 'tool', tool_call_id: 'lookup_1', content: 'tool result' },
  ],
  temperature: 0.4,
  top_p: 0.8,
  max_tokens: 512,
};

const config = buildTavernGenerateConfig(payload, 'generation-1');

assertEqual(config.ordered_prompts, [
  { role: 'system', content: 'system prompt' },
  { role: 'user', content: 'hello' },
  { role: 'assistant', content: 'calling tool' },
  { role: 'user', content: '[工具 lookup_1 的返回]\ntool result' },
], 'ordered_prompts');
assertEqual(config.generation_id, 'generation-1', 'generation_id');
assertEqual(config.should_silence, true, 'should_silence');
assertEqual(config.max_chat_history, 0, 'max_chat_history');
assertEqual('custom_api' in config, false, 'custom_api');
assertEqual('model' in config, false, 'model');

console.log('tavern adapter contract passed');
