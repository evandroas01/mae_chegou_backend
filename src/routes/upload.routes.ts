import { Router } from 'express';
import { UploadController } from '../controllers/UploadController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { upload } from '../config/upload';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/', authorize('admin', 'motorista'), upload.single('file'), UploadController.uploadFile);
router.post('/multiple', authorize('admin', 'motorista'), upload.array('files', 10), UploadController.uploadMultiple);

export default router;

