const express = require('express');
const claimController = require('../controllers/claimController');
const { requireAuth } = require('../middleware/auth');
const { uploadClaimEvidence } = require('../middleware/upload');
const { claimIdParamValidator, createClaimValidator } = require('../validators/claimValidators');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth);

router.get('/my', claimController.listMyClaims);
router.post(
  '/',
  uploadClaimEvidence,
  createClaimValidator,
  validate,
  claimController.createClaim
);
router.get('/:id', claimIdParamValidator, validate, claimController.getClaimById);
router.get('/:id/evidence', claimIdParamValidator, validate, claimController.downloadEvidence);
router.put('/:id/withdraw', claimIdParamValidator, validate, claimController.withdrawClaim);

module.exports = router;

