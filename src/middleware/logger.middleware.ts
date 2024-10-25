import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request:', {
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        origin: req.headers.origin,
      },
      body: req.body,
    });
    next();
  }
}
