/* eslint-disable */
// @ts-nocheck
import _ from 'lodash';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

await Promise.all(
  fs.globSync('src/**/schema.ts').map(async schema_file => {
    try {
      const module = await import(pathToFileURL(path.resolve(import.meta.dirname, schema_file)).href);
      if (_.has(module, 'Schema')) {
        fs.writeFileSync(
          path.join(path.dirname(schema_file), 'schema.json'),
          JSON.stringify(z.toJSONSchema(_.get(module, 'Schema'), { io: 'input', reused: 'ref' }), null, 2),
        );
      }
    } catch (e) {
      /** ignore */
    }
  }),
);
