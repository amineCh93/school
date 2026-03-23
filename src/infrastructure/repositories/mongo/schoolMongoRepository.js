const School = require('../../../models/schoolModel');

function createSchoolMongoRepository() {
  return {
    create(payload) {
      return School.create(payload);
    },
    list() {
      return School.find().sort({ createdAt: -1 }).lean();
    },
    getById(id) {
      return School.findById(id).lean();
    },
    getByIdDocument(id) {
      return School.findById(id);
    },
    updateById(id, payload) {
      return School.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
    },
    deleteById(id) {
      return School.findByIdAndDelete(id).lean();
    },
    clearHeadmasterById(id) {
      return School.findByIdAndUpdate(id, { headmaster: null }, { new: true }).lean();
    },
    setHeadmaster(id, headmasterId) {
      return School.findByIdAndUpdate(id, { headmaster: headmasterId }, { new: true, runValidators: true }).lean();
    },
    getDetailsById(id) {
      return School.findById(id)
        .populate('headmaster')
        .populate('students')
        .lean();
    }
  };
}

module.exports = {
  createSchoolMongoRepository
};
