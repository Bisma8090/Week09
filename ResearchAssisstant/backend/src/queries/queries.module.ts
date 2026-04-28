import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueriesController } from './queries.controller';
import { QueriesService } from './queries.service';
import { Query, QuerySchema } from '../schemas/query.schema';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Query.name, schema: QuerySchema }]),
    WorkflowModule,
  ],
  controllers: [QueriesController],
  providers: [QueriesService],
})
export class QueriesModule {}
