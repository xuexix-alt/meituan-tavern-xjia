import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/MVU_Schema_Definition/index.ts', 'utf8');

assert.match(source, /服务中的订单:\s*z\s*\.array\(/, '服务中的订单必须使用数组 schema');
assert.doesNotMatch(source, /服务中的订单:\s*z\s*\.record\(/, '服务中的订单不能使用 record schema');

console.log('MVU schema source contract passed');
