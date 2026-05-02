import { createApp } from '../src/lambda';
import { IncomingMessage, ServerResponse } from 'http';

let appPromise: Promise<any>;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = createApp();
  }
  const app = await appPromise;
  app(req, res);
}
