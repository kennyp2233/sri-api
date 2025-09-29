import { ConfigService } from '@nestjs/config';

export const certificateConfig = (configService: ConfigService) => ({
  path: configService.get<string>('CERTIFICATE_PATH', './certificates/certificate.p12'),
  password: configService.get<string>('CERTIFICATE_PASSWORD', 'password'),
  algorithm: configService.get<string>('SIGNATURE_ALGORITHM', 'sha256'),
});