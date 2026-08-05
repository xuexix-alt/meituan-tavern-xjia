import request from 'supertest';
import { app } from './index';

it('reports that the local API is available', async () => {
  const response = await request(app).get('/api/health');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});

it('serves the production client and its single-page fallback', async () => {
  const home = await request(app).get('/');
  const fallback = await request(app).get('/prompt/session');

  expect(home.status).toBe(200);
  expect(home.text).toContain('<div id="root"></div>');
  expect(fallback.status).toBe(200);
  expect(fallback.text).toContain('<div id="root"></div>');
});
