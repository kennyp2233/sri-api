// src/common/interceptors/parse-form-data.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ParseFormDataInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const body = request.body;

        console.log('=== Interceptor - Original Body ===');
        console.log('Body type:', typeof body);
        console.log('Body keys:', Object.keys(body));
        console.log('Items type:', typeof body.items);
        console.log('Items value:', body.items);

        // Parsear items si es string
        if (body.items && typeof body.items === 'string') {
            try {
                console.log('Parsing items from string...');
                const parsed = JSON.parse(body.items);
                console.log('Parsed items:', parsed);
                body.items = parsed;
            } catch (error) {
                console.error('Error parsing items JSON:', error);
                throw new BadRequestException('Invalid items format: ' + error.message);
            }
        }

        // Verificar que items sea un array
        if (!Array.isArray(body.items)) {
            console.error('Items is not an array after parsing:', typeof body.items);
            throw new BadRequestException('Items must be an array');
        }

        // Transformar cada item
        console.log('Transforming items array...');
        body.items = body.items.map((item, index) => {
            console.log(`Item ${index} before transform:`, item);
            const transformed = {
                descripcion: String(item.descripcion || ''),
                cantidad: parseFloat(item.cantidad) || 0,
                precioUnitario: parseFloat(item.precioUnitario) || 0,
                descuento: item.descuento ? parseFloat(item.descuento) : 0,
                codigoPrincipal: String(item.codigoPrincipal || ''),
            };
            console.log(`Item ${index} after transform:`, transformed);
            return transformed;
        });

        console.log('=== Interceptor - Transformed Body ===');
        console.log('Items count:', body.items.length);
        console.log('Items:', JSON.stringify(body.items, null, 2));

        request.body = body;

        return next.handle();
    }
}