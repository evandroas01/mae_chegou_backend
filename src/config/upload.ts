import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// ─────────────────────────────────────────────
// Modo de storage: 'supabase' em produção,
// 'disk' em desenvolvimento (sem variáveis do Supabase)
// ─────────────────────────────────────────────
const useSupabase = config.nodeEnv === 'production' && !!config.supabase.url;

// Cliente Supabase (inicializado apenas se as variáveis estiverem presentes)
export const supabaseClient = useSupabase
  ? createClient(config.supabase.url, config.supabase.key)
  : null;

// ─────────────────────────────────────────────
// Storage local (usado apenas em desenvolvimento)
// ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!useSupabase && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let subDir = 'general';
    if (file.fieldname === 'documento') subDir = 'documentos';
    else if (file.fieldname === 'anexo') subDir = 'anexos';
    else if (file.fieldname === 'foto') subDir = 'fotos';

    const dir = path.join(uploadDir, subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Em produção usa memória para repassar ao Supabase
const memoryStorage = multer.memoryStorage();

// ─────────────────────────────────────────────
// Filtro de tipos permitidos
// ─────────────────────────────────────────────
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Apenas imagens e documentos PDF/DOC são aceitos.'));
  }
};

// ─────────────────────────────────────────────
// Instância do multer exportada
// ─────────────────────────────────────────────
export const upload = multer({
  storage: useSupabase ? memoryStorage : diskStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─────────────────────────────────────────────
// Upload para Supabase (usado pelo UploadController em produção)
// ─────────────────────────────────────────────
export const uploadToSupabase = async (
  file: Express.Multer.File,
  folder: string = 'general'
): Promise<string> => {
  if (!supabaseClient) {
    throw new Error('Supabase não configurado. Verifique as variáveis SUPABASE_URL e SUPABASE_KEY.');
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
  const filename = `${folder}/${name}-${uniqueSuffix}${ext}`;

  const { error } = await supabaseClient.storage
    .from(config.supabase.bucket)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Erro no upload ao Supabase: ${error.message}`);

  const { data } = supabaseClient.storage
    .from(config.supabase.bucket)
    .getPublicUrl(filename);

  return data.publicUrl;
};

// ─────────────────────────────────────────────
// Helper de URL para desenvolvimento local
// ─────────────────────────────────────────────
export const getFileUrl = (
  filename: string,
  type: 'documento' | 'anexo' | 'foto' | 'general' = 'general'
): string => {
  const subDir =
    type === 'documento' ? 'documentos' :
    type === 'anexo' ? 'anexos' :
    type === 'foto' ? 'fotos' : 'general';
  return `/uploads/${subDir}/${filename}`;
};

// Flag para uso no UploadController saber qual caminho seguir
export { useSupabase };
