import { Body, Controller, Get, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('upload')
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  @Post()
  async upload(@Body() body: { title: string; topic: string; content: string; createdAt?: string }) {
    return this.svc.create(body);
  }

  @Get()
  async list() {
    return this.svc.findAll();
  }
}
