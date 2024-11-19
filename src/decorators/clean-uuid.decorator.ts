import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class CleanUuidPipe implements PipeTransform {
  transform(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }
    return value.replace(/^["']|["']$/g, '').trim();
  }
}
