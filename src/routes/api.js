const express = require('express');
const { createSchoolsService } = require('../application/schools/schoolsService');
const { createSchoolRepository } = require('../infrastructure/repositories/schoolRepository');

const router = express.Router();
const schoolsService = createSchoolsService({
  schoolRepository: createSchoolRepository()
});

// Retourne une liste d'écoles de démonstration pour valider le fonctionnement de l'API.
router.get('/schools', (_req, res) => {
  res.json(schoolsService.listSchools());
});

module.exports = router;
