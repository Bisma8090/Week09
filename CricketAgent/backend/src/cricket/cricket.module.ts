import { Module } from '@nestjs/common';
import { CricketController } from './cricket.controller';
import { CricketService } from './cricket.service';

@Module({
  controllers: [CricketController],
  providers: [CricketService],
})
export class CricketModule {}
