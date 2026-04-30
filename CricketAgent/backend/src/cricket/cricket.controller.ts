import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CricketService } from './cricket.service';

class AskDto {
  question: string;
}

@Controller()
export class CricketController {
  constructor(private readonly cricketService: CricketService) {}

  @Post('ask')
  async ask(@Body() body: AskDto) {
    if (!body.question?.trim()) {
      throw new BadRequestException('Question is required');
    }
    return this.cricketService.ask(body.question);
  }
}
