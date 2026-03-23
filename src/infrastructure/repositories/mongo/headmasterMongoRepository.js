const Headmaster = require('../../../models/headmasterModel');

function createHeadmasterMongoRepository() {
  return {
    create(payload) {
      return Headmaster.create(payload);
    },
    list() {
      return Headmaster.find().sort({ createdAt: -1 }).lean();
    },
    getById(id) {
      return Headmaster.findById(id).lean();
    },
    getByIdDocument(id) {
      return Headmaster.findById(id);
    },
    updateById(id, payload) {
      return Headmaster.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
    },
    deleteById(id) {
      return Headmaster.findByIdAndDelete(id).lean();
    },
    setSchool(id, schoolId) {
      return Headmaster.findByIdAndUpdate(id, { school: schoolId }, { new: true, runValidators: true }).lean();
    },
    clearSchoolById(id) {
      return Headmaster.findByIdAndUpdate(id, { school: null }, { new: true }).lean();
    },
    findBySchoolId(schoolId) {
      return Headmaster.findOne({ school: schoolId }).lean();
    }
  };
}

module.exports = {
  createHeadmasterMongoRepository
};
