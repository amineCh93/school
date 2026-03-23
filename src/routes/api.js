const express = require('express');
const mongoose = require('mongoose');
const { createSchoolsService } = require('../application/schools/schoolsService');
const { createSchoolRepository } = require('../infrastructure/repositories/schoolRepository');
const School = require('../models/schoolModel');

const router = express.Router();
const schoolsService = createSchoolsService({
  schoolRepository: createSchoolRepository()
});
const defaultBranding = {
  schoolName: 'Capgemini School',
  logoUrl: 'https://www.capgemini.com/wp-content/themes/capgemini2020/assets/images/logo.svg',
  source: 'default'
};

// Retourne une liste d'écoles de démonstration pour valider le fonctionnement de l'API.
router.get('/schools', (_req, res) => {
  res.json(schoolsService.listSchools());
});

router.get('/branding', async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    res.json(defaultBranding);
    return;
  }

  const schoolWithLogo = await School.findOne({
    logoUrl: { $exists: true, $ne: '' }
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  if (!schoolWithLogo) {
    res.json(defaultBranding);
    return;
  }

  res.json({
    schoolName: schoolWithLogo.name || defaultBranding.schoolName,
    logoUrl: schoolWithLogo.logoUrl,
    source: 'database'
  });
});

module.exports = router;
