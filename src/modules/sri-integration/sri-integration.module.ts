import { Module } from '@nestjs/common';
import { SriClientService } from './services/sri-client.service';

@Module({
  providers: [SriClientService],
  exports: [SriClientService],
})
export class SriIntegrationModule {}