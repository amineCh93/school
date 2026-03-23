const { schoolsCatalog } = require('../../domain/schools/schoolsCatalog');

function createSchoolRepository() {
  return {
    // Retourne la liste des écoles depuis la source de données du domaine.
    list() {
      return schoolsCatalog;
    }
  };
}

module.exports = {
  createSchoolRepository
};
