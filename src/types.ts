import { Request, Response } from 'express';
import { Redis } from 'ioredis';

export type MyContext = {
  req: Request & {session?: any};
  res: Response;
  redis: Redis
};
