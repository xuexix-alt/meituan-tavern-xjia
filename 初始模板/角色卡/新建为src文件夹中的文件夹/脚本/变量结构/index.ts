// @ts-expect-error URL import provided by Tavern Helper
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';

$(() => {
  void waitGlobalInitialized('Mvu')
    .then(() => registerMvuSchema(Schema))
    .catch((error: unknown) => console.error('[MVU] Schema 注册失败', error));
});
