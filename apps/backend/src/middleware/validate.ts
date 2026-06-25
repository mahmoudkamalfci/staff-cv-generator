import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if schema expects body/query/params structure
      if ('body' in schema.shape || 'query' in schema.shape || 'params' in schema.shape) {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        req.body = parsed.body || req.body;
        req.query = parsed.query || req.query;
        req.params = parsed.params || req.params;
      } else {
        // Fallback: assume schema is just for req.body
        const parsedBody = await schema.parseAsync(req.body);
        req.body = parsedBody;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
