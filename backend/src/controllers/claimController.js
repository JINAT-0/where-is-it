const claimService = require('../services/claimService');
const { sendSuccess } = require('../utils/apiResponse');

async function listMyClaims(req, res, next) {
  try {
    const result = await claimService.listMyClaims(req.user.id, req.query);
    return sendSuccess(res, {
      message: 'Claims fetched successfully.',
      data: { claims: result.claims },
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    return next(err);
  }
}

async function createClaim(req, res, next) {
  try {
    const evidenceFilename = req.file ? req.file.filename : null;
    const claim = await claimService.createClaim(req.user.id, req.body, evidenceFilename);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Ownership claim submitted successfully.',
      data: { claim },
    });
  } catch (err) {
    return next(err);
  }
}

async function getClaimById(req, res, next) {
  try {
    const claim = await claimService.getClaimById(parseInt(req.params.id, 10), req.user);
    return sendSuccess(res, {
      message: 'Claim details fetched successfully.',
      data: { claim },
    });
  } catch (err) {
    return next(err);
  }
}

async function downloadEvidence(req, res, next) {
  try {
    const filePath = await claimService.getClaimEvidenceFile(
      parseInt(req.params.id, 10),
      req.user
    );
    return res.sendFile(filePath);
  } catch (err) {
    return next(err);
  }
}

async function withdrawClaim(req, res, next) {
  try {
    const claim = await claimService.withdrawClaim(parseInt(req.params.id, 10), req.user.id);
    return sendSuccess(res, {
      message: 'Claim withdrawn successfully.',
      data: { claim },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMyClaims,
  createClaim,
  getClaimById,
  downloadEvidence,
  withdrawClaim,
};

