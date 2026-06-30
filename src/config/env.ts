import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : process.env.NODE_ENV === 'production'
        ? ['https://api.chegueimae.com']
        : [
            'http://localhost:8081',
            'http://192.168.15.3:8081', // IP da rede local (ajuste se necessário)
            'http://192.168.15.7:8081', // Novo IP detectado
            /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Aceita qualquer IP da rede local 192.168.x.x
            /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Aceita backend em qualquer IP da rede local
          ],
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || '',
    bucket: process.env.SUPABASE_BUCKET || 'uploads',
  },
};

