import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getFileUrl, uploadToSupabase, useSupabase } from '../config/upload';

export class UploadController {
  static async uploadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const fileType = req.body.type || 'general';
      let url: string;

      if (useSupabase) {
        // Produção: envia para o Supabase Storage e retorna URL pública permanente
        url = await uploadToSupabase(req.file, fileType);
      } else {
        // Desenvolvimento: salvo em disco local, retorna caminho relativo
        url = getFileUrl(req.file.filename, fileType as any);
      }

      res.json({
        url,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
  }

  static async uploadMultiple(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const files = (Array.isArray(req.files) ? req.files : Object.values(req.files as any).flat()) as Express.Multer.File[];
      const fileType = req.body.type || 'general';

      const uploadedFiles = await Promise.all(
        files.map(async (file: Express.Multer.File) => {
          let url: string;

          if (useSupabase) {
            url = await uploadToSupabase(file, fileType);
          } else {
            url = getFileUrl(file.filename, fileType as any);
          }

          return {
            url,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          };
        })
      );

      res.json({ files: uploadedFiles });
    } catch (error) {
      console.error('Erro no upload múltiplo:', error);
      res.status(500).json({ error: 'Erro ao fazer upload dos arquivos' });
    }
  }
}
