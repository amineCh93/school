function createSchoolsService({ schoolRepository }) {
  return {
    // Cas d'usage: lister les écoles disponibles.
    listSchools() {
      const schools = schoolRepository.list();
      return {
        message: 'School management endpoint is running.',
        count: schools.length,
        data: schools
      };
    }
  };
}

module.exports = {
  createSchoolsService
};
