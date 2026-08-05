import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import _ from 'lodash';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const root = new URL('../../', import.meta.url);
const read = relativePath => readFileSync(new URL(relativePath, root), 'utf8');

const schemaSource = read('初始模板/角色卡/新建为src文件夹中的文件夹/schema.ts');
const scriptSource = read('初始模板/角色卡/新建为src文件夹中的文件夹/脚本/变量结构/index.ts');
const initvarSource = read('初始模板/角色卡/新建为src文件夹中的文件夹/世界书/变量/initvar.yaml');
const referenceInitvarSource = read('初始模板/zod mvu/initvar.yaml');

assert.doesNotMatch(schemaSource, /registerMvuSchema|\$\(\s*\(\)/, 'schema.ts 必须是无副作用的纯 Schema 文件');
assert.match(scriptSource, /registerMvuSchema\(Schema\)/, '变量结构脚本必须注册 Schema');
assert.match(scriptSource, /import\s+\{\s*Schema\s*\}\s+from\s+'\.\.\/\.\.\/schema'/);
assert.match(scriptSource, /waitGlobalInitialized\('Mvu'\)/, '变量结构脚本必须等待 MVU 初始化');
assert.doesNotMatch(scriptSource, /export\s+const\s+Schema/, '变量结构脚本不应重复定义 Schema');

const schemaStart = schemaSource.indexOf('export const Schema = ');
const schemaEnd = schemaSource.indexOf('\nexport type Schema', schemaStart);
assert.ok(schemaStart >= 0 && schemaEnd > schemaStart, 'schema.ts 必须导出 Schema 和类型');

const schemaExpression = schemaSource
  .slice(schemaStart + 'export const Schema = '.length, schemaEnd)
  .trim()
  .replace(/;$/, '');
const Schema = Function('z', '_', `return ${schemaExpression}`)(z, _);

const initialVariables = parseYaml(initvarSource);
const referenceInitialVariables = parseYaml(referenceInitvarSource);

assert.deepEqual(initialVariables, referenceInitialVariables, '角色卡 initvar 必须与 zod mvu 模板保持一致');
assert.deepEqual(initialVariables.服务中的订单, {}, '服务中的订单必须从空 record 开始');
assert.equal(initialVariables.系统状态.当前模式, 'PLAY');
assert.equal(initialVariables.订单模板.新订单原型.服务统计.心跳, 60);

const canonicalResult = Schema.safeParse(initialVariables);
assert.equal(canonicalResult.success, true, canonicalResult.error?.message);

const boundedVariables = structuredClone(initialVariables);
boundedVariables.经济.订单消费 = -12.7;
boundedVariables.订单模板.新订单原型.心理状态.好感度 = 150;
boundedVariables.订单模板.新订单原型.性经验.性伴侣数量 = -3.9;
const boundedResult = Schema.parse(boundedVariables);
assert.equal(boundedResult.经济.订单消费, 0, '累计消费必须归一化为非负整数');
assert.equal(boundedResult.订单模板.新订单原型.心理状态.好感度, 100);
assert.equal(boundedResult.订单模板.新订单原型.性经验.性伴侣数量, 0);

const legacyVariables = structuredClone(initialVariables);
const legacyOrder = legacyVariables.订单模板.新订单原型;
delete legacyVariables.系统状态.当前模式;
legacyOrder.心理状态.心跳 = 88;
delete legacyOrder.服务统计.心跳;
legacyVariables.服务中的订单 = { ORDER_legacy_01: legacyOrder };
const legacyResult = Schema.safeParse(legacyVariables);
assert.equal(legacyResult.success, true, legacyResult.error?.message);
assert.equal(legacyResult.data.系统状态.当前模式, 'PLAY');
assert.equal(
  legacyResult.data.服务中的订单.ORDER_legacy_01.服务统计.心跳,
  60,
  '旧 beta 心跳字段应允许迁移，并为新路径提供默认值',
);

const legacyArrayVariables = structuredClone(initialVariables);
legacyArrayVariables.服务中的订单 = [structuredClone(initialVariables.订单模板.新订单原型)];
assert.equal(
  Schema.safeParse(legacyArrayVariables).success,
  false,
  '服务中的订单不能继续接受 beta 数组，避免索引路径与订单 ID 路径混用',
);

console.log('tavern helper zod mvu schema contract passed');
