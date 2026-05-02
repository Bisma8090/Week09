import { Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(
    @Query('q') query?: string,
    @Query('ai') ai?: string,
  ) {
    return this.productsService.findAll(query, ai === 'true');
  }

  @Post('seed')
  seed() {
    return this.productsService.seed();
  }

  @Post('reseed')
  reseed() {
    return this.productsService.reseed();
  }
}
