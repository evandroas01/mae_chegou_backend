import { Router } from 'express';
import authRoutes from './auth.routes';
import alunosRoutes from './alunos.routes';
import manutencoesRoutes from './manutencoes.routes';
import notificacoesRoutes from './notificacoes.routes';
import contratosRoutes from './contratos.routes';
import financeiroRoutes from './financeiro.routes';
import rotasRoutes from './rotas.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/alunos', alunosRoutes);
router.use('/manutencoes', manutencoesRoutes);
router.use('/notificacoes', notificacoesRoutes);
router.use('/contratos', contratosRoutes);
router.use('/financeiro', financeiroRoutes);
router.use('/rotas', rotasRoutes);
router.use('/upload', uploadRoutes);

export default router;

