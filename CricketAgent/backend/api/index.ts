import 'reflect-metadata';
import { config } from 'dotenv';
config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableCors({ origin: '*' });
    await app.init();
  }
  return server;
}

export default async function handler(req: any, res: any) {
  const expressApp = await bootstrap();
  expressApp(req, res);
}
