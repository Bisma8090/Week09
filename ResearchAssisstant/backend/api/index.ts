import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Request, Response } from 'express';

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    await app.init();
  }
  return app;
}

export default async (req: Request, res: Response) => {
  const nestApp = await bootstrap();
  nestApp.getHttpAdapter().getInstance()(req, res);
};
