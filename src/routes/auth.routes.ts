import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { loginValidator, registerValidator } from '../validators/auth.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.post('/login', validate(loginValidator), AuthController.login);
router.post('/register', validate(registerValidator), AuthController.register);
router.get('/me', authenticate, AuthController.me);
router.put('/me', authenticate, AuthController.update);
router.get('/responsaveis', authenticate, AuthController.getResponsaveisByMotorista);

export default router;

