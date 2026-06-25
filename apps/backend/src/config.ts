import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cv_generator?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkeythatyoushouldchange',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkeythatyoushouldchange',
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
  nodeEnv: process.env.NODE_ENV || 'development'
};
