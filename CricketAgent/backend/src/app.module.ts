import { Module } from '@nestjs/common';
import { CricketModule } from './cricket/cricket.module';

@Module({
  imports: [CricketModule],
})
export class AppModule {}
