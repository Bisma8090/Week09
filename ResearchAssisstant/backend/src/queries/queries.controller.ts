import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QueriesService } from './queries.service';

@Controller()
export class QueriesController {
  constructor(private readonly svc: QueriesService) {}

  @Post('ask')
  async ask(@Body() body: { question: string }) {
    return this.svc.ask(body.question);
  }

  @Get('trace/:id')
  async trace(@Param('id') id: string) {
    return this.svc.getTrace(id);
  }
}
