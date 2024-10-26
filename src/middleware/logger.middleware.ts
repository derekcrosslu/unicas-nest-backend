import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`, {
      headers: {
        origin: req.headers.origin,
        'content-type': req.headers['content-type'],
        authorization: req.headers.authorization,
      },
    });

    // Log response
    const originalSend = res.send;
    res.send = function (body) {
      console.log('Response:', {
        statusCode: res.statusCode,
        body: body,
        path: req.url,
      });
      return originalSend.call(this, body);
    };

    next();
  }
}
