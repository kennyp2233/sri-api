import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SriClientService } from './infrastructure/services/sri-client.service';
import { RideGeneratorService } from './infrastructure/services/ride-generator.service';

@Module({
  imports: [ConfigModule],
  providers: [SriClientService, RideGeneratorService],
  exports: [SriClientService, RideGeneratorService],
})
export class SriIntegrationModule {}