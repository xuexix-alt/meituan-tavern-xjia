import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
export const app = createApp();
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const clientDist = path.join(projectRoot, 'dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api(?:\/|$)).*/, (_request, response) => {
    response.sendFile(path.join(clientDist, 'index.html'));
});
if (!process.env.VITEST) {
    app.listen(4174, '127.0.0.1', () => {
        console.log('Prompt Lab is running at http://127.0.0.1:4174');
    });
}
