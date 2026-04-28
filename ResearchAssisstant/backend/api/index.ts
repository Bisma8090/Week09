import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { Request, Response } from 'express';

const server = express();
let isReady = false;

const appPromise = NestFactory.create(AppModule, new ExpressAdapter(server)).then(app => {
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  return app.init();
}).then(() => {
  isReady = true;
});

export default async (req: Request, res: Response) => {
  await appPromise;
  server(req, res);
};
