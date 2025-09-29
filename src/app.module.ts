import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SriIntegrationModule } from './modules/sri-integration/sri-integration.module';
import { DigitalSignatureModule } from './modules/digital-signature/digital-signature.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    SriIntegrationModule,
    DigitalSignatureModule,
    BillingModule,
  ],
})
export class AppModule {}
