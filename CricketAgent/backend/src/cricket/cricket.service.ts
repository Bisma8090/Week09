import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ask } from './workflow';

@Injectable()
export class CricketService {
  async ask(question: string): Promise<{ answer: string }> {
    try {
      const answer = await ask(question);
      return { answer };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to process question',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
