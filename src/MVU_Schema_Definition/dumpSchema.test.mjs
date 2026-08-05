import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['dump_schema.ts'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

assert.equal(result.status, 0, `dump_schema.ts 失败:\n${result.stdout}\n${result.stderr}`);
assert.ok(existsSync('src/美人团/schema.json'), 'dump_schema.ts 必须生成 src/美人团/schema.json');

const schema = JSON.parse(readFileSync('src/美人团/schema.json', 'utf8'));
assert.ok(schema.properties?.经济, '生成的 schema 必须包含经济结构');
assert.ok(schema.properties?.服务中的订单, '生成的 schema 必须包含服务中的订单结构');

console.log('美人团 schema dump 契约通过');
