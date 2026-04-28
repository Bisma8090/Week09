import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: '*',
    });
    await app.init();
  }
  return app;
}

// Local dev
if (require.main === module) {
  bootstrap().then(async (nestApp) => {
    await nestApp.listen(process.env.PORT ?? 3000);
    console.log(`Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  });
}

// Vercel serverless export
export default async (req: any, res: any) => {
  const nestApp = await bootstrap();
  nestApp.getHttpAdapter().getInstance()(req, res);
};
