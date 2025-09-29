import { Controller, Post, Body } from '@nestjs/common';
import { CreateInvoiceUseCase } from '../../application/use-cases/create-invoice.use-case';
import { CreateInvoiceCommand } from '../../application/dto/create-invoice.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly createInvoiceUseCase: CreateInvoiceUseCase) {}

  @Post('invoices')
  async createInvoice(@Body() command: CreateInvoiceCommand) {
    return await this.createInvoiceUseCase.execute(command);
  }
}