import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: [
        'http://localhost:3001',
        process.env.FRONTEND_URL ?? '',
      ].filter(Boolean),
    });
    await app.init();
  }
  return app;
}

// Local dev
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(async (nestApp) => {
    await nestApp.listen(3000);
    console.log('Backend running on http://localhost:3000');
  });
}

// Vercel serverless export
export default async (req: any, res: any) => {
  const nestApp = await bootstrap();
  nestApp.getHttpAdapter().getInstance()(req, res);
};
