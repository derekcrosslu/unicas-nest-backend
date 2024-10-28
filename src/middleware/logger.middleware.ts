import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    console.log('1', `[Request] ${req.method} ${req.url}`, {
      headers: {
        origin: req.headers.origin,
        'content-type': req.headers['content-type'],
        authorization: req.headers.authorization,
      },
      query: req.query,
      params: req.params,
      body: req.body,
    });

    // Log response
    const originalSend = res.send;
    res.send = function (body) {
      const responseTime = Date.now() - startTime;
      console.log('2', `[Response] ${req.method} ${req.url}`, {
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        body: typeof body === 'string' ? JSON.parse(body) : body,
      });
      return originalSend.call(this, body);
    };

    next();
  }
}
