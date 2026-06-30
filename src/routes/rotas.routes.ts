import { Router } from 'express';
import { RotaController } from '../controllers/RotaController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { createRotaValidator } from '../validators/rota.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/', authorize('admin', 'motorista'), validate(createRotaValidator), RotaController.create);
router.get('/', RotaController.findAll);
router.put('/online', authorize('admin', 'motorista'), RotaController.goOnline);
router.put('/offline', authorize('admin', 'motorista'), RotaController.goOffline);
router.get('/motorista/status', authorize('responsavel'), RotaController.getMotoristaStatus);

router.get('/localizacao/:veiculoId', RotaController.getLocalizacao);
router.get('/localizacao-motorista', authenticate, RotaController.getLocalizacaoMotorista);

router.get('/:id', RotaController.findById);
router.put('/:id', authorize('admin', 'motorista'), RotaController.update);
router.post('/:id/iniciar', authorize('admin', 'motorista'), RotaController.iniciar);
router.post('/:id/finalizar', authorize('admin', 'motorista'), RotaController.finalizar);
router.post('/localizacao', authorize('admin', 'motorista'), RotaController.saveLocalizacao);

export default router;

