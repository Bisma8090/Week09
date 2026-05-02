import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { IsString, IsArray, IsOptional } from 'class-validator';

class ChatDto {
  @IsString()
  message: string;

  @IsArray()
  @IsOptional()
  history?: { role: string; content: string }[];
}

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  chat(@Body() dto: ChatDto) {
    return this.chatService.chat(dto.message, dto.history || []);
  }
}
