/* eslint-disable */
// @ts-nocheck
import _ from 'lodash';
import fs from 'node:fs';
import path from 'node:path';
<<<<<<< HEAD
import { z } from 'zod';

fs.globSync('src/**/schema.ts').forEach(async schema_file => {
  try {
=======
import z from 'zod';

fs.globSync('src/**/schema.ts').forEach(async schema_file => {
  try {
    globalThis._ = _;
    globalThis.z = z;
>>>>>>> efcef8b9a45aaad11ec3aa11828fb365c306c40b
    const module = await import(path.resolve(import.meta.dirname, schema_file));
    if (_.has(module, 'Schema')) {
      fs.writeFileSync(
        path.join(path.dirname(schema_file), 'schema.json'),
        JSON.stringify(z.toJSONSchema(_.get(module, 'Schema'), { io: 'input', reused: 'ref' }), null, 2),
      );
    }
  } catch (e) {
<<<<<<< HEAD
    /** ignore */
=======
    console.error(`生成 '${schema_file}' 对应的 schema.json 失败: ${e}`);
>>>>>>> efcef8b9a45aaad11ec3aa11828fb365c306c40b
  }
});
