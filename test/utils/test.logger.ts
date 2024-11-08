import { Logger } from '@nestjs/common';

export class TestLogger extends Logger {
  constructor() {
    super('TestLogger');
  }

  private formatMessage(message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
    return `[${timestamp}] ${message}${contextStr}`;
  }

  debug(message: string, context?: any): void {
    super.debug(this.formatMessage(message, context));
  }

  log(message: string, context?: any): void {
    super.log(this.formatMessage(message, context));
  }

  warn(message: string, context?: any): void {
    super.warn(this.formatMessage(message, context));
  }

  error(message: string, context?: any): void {
    super.error(this.formatMessage(message, context));
  }

  verbose(message: string, context?: any): void {
    super.verbose(this.formatMessage(message, context));
  }
}
