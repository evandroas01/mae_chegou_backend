import { Router } from 'express';
import { AlunoController } from '../controllers/AlunoController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { createAlunoValidator } from '../validators/aluno.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/', authorize('motorista'), validate(createAlunoValidator), AlunoController.create);
router.get('/', AlunoController.findAll);
router.get('/:id', AlunoController.findById);
router.put('/:id', authorize('motorista'), AlunoController.update);
router.delete('/:id', authorize('admin'), AlunoController.delete);

export default router;

