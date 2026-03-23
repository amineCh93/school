const mongoose = require('mongoose');
const { AppError } = require('../../utils/errors');

function assertObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`${label} is invalid.`, 400, 'INVALID_ID');
  }
}

function createManagementService({
  schoolRepository,
  studentRepository,
  headmasterRepository,
  notificationDispatcher
}) {
  async function notifyUsers(recipients, subject, message) {
    if (!notificationDispatcher) {
      return;
    }

    await notificationDispatcher.notifyUsers({
      recipients,
      subject,
      message
    });
  }

  return {
    async createSchool(payload) {
      const school = await schoolRepository.create(payload);

      await notifyUsers(
        [],
        'New school created',
        `The school "${school.name}" has been created.`
      );

      return school;
    },

    async listSchools() {
      return schoolRepository.list();
    },

    async getSchoolById(schoolId) {
      assertObjectId(schoolId, 'School id');
      const school = await schoolRepository.getById(schoolId);

      if (!school) {
        throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
      }

      const students = await studentRepository.listBySchoolId(schoolId);
      const headmaster = await headmasterRepository.findBySchoolId(schoolId);

      return {
        ...school,
        students,
        headmaster
      };
    },

    async updateSchool(schoolId, payload) {
      assertObjectId(schoolId, 'School id');
      const school = await schoolRepository.updateById(schoolId, payload);

      if (!school) {
        throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
      }

      const students = await studentRepository.listBySchoolId(schoolId);
      const headmaster = await headmasterRepository.findBySchoolId(schoolId);
      await notifyUsers(
        [headmaster?.email, ...students.map((student) => student.email)],
        'School updated',
        `School information for "${school.name}" has been updated.`
      );

      return school;
    },

    async deleteSchool(schoolId) {
      assertObjectId(schoolId, 'School id');
      const school = await schoolRepository.deleteById(schoolId);

      if (!school) {
        throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
      }

      const students = await studentRepository.listBySchoolId(schoolId);
      const linkedHeadmaster = await headmasterRepository.findBySchoolId(schoolId);

      await studentRepository.clearBySchoolId(schoolId);
      if (linkedHeadmaster) {
        await headmasterRepository.clearSchoolById(linkedHeadmaster._id);
      }

      await notifyUsers(
        [linkedHeadmaster?.email, ...students.map((student) => student.email)],
        'School removed',
        `School "${school.name}" has been removed and your assignment was cleared.`
      );

      return school;
    },

    async createStudent(payload) {
      if (payload.school) {
        assertObjectId(payload.school, 'School id');
        const school = await schoolRepository.getById(payload.school);
        if (!school) {
          throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
        }
      }

      if (payload.headmaster) {
        assertObjectId(payload.headmaster, 'Headmaster id');
        const headmaster = await headmasterRepository.getById(payload.headmaster);
        if (!headmaster) {
          throw new AppError('Headmaster not found.', 404, 'HEADMASTER_NOT_FOUND');
        }
      }

      const student = await studentRepository.create(payload);

      await notifyUsers(
        [student.email],
        'Student profile created',
        `Your student profile has been created for ${student.firstName} ${student.lastName}.`
      );

      return student;
    },

    async listStudents() {
      return studentRepository.list();
    },

    async getStudentById(studentId) {
      assertObjectId(studentId, 'Student id');
      const student = await studentRepository.getById(studentId);

      if (!student) {
        throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
      }

      return student;
    },

    async updateStudent(studentId, payload) {
      assertObjectId(studentId, 'Student id');

      if (payload.school) {
        assertObjectId(payload.school, 'School id');
        const school = await schoolRepository.getById(payload.school);
        if (!school) {
          throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
        }
      }

      if (payload.headmaster) {
        assertObjectId(payload.headmaster, 'Headmaster id');
        const headmaster = await headmasterRepository.getById(payload.headmaster);
        if (!headmaster) {
          throw new AppError('Headmaster not found.', 404, 'HEADMASTER_NOT_FOUND');
        }
      }

      const student = await studentRepository.updateById(studentId, payload);

      if (!student) {
        throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
      }

      await notifyUsers(
        [student.email],
        'Student profile updated',
        `Your student profile has been updated for ${student.firstName} ${student.lastName}.`
      );

      return student;
    },

    async deleteStudent(studentId) {
      assertObjectId(studentId, 'Student id');
      const student = await studentRepository.deleteById(studentId);

      if (!student) {
        throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
      }

      await notifyUsers(
        [student.email],
        'Student profile removed',
        `Your student profile for ${student.firstName} ${student.lastName} has been removed.`
      );

      return student;
    },

    async createHeadmaster(payload) {
      if (payload.school) {
        assertObjectId(payload.school, 'School id');
        const school = await schoolRepository.getById(payload.school);
        if (!school) {
          throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
        }
      }

      const headmaster = await headmasterRepository.create(payload);

      await notifyUsers(
        [headmaster.email],
        'Headmaster profile created',
        `Your headmaster profile has been created for ${headmaster.firstName} ${headmaster.lastName}.`
      );

      return headmaster;
    },

    async listHeadmasters() {
      return headmasterRepository.list();
    },

    async getHeadmasterById(headmasterId) {
      assertObjectId(headmasterId, 'Headmaster id');
      const headmaster = await headmasterRepository.getById(headmasterId);

      if (!headmaster) {
        throw new AppError('Headmaster not found.', 404, 'HEADMASTER_NOT_FOUND');
      }

      return headmaster;
    },

    async updateHeadmaster(headmasterId, payload) {
      assertObjectId(headmasterId, 'Headmaster id');

      if (payload.school) {
        assertObjectId(payload.school, 'School id');
        const school = await schoolRepository.getById(payload.school);
        if (!school) {
          throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
        }
      }

      const headmaster = await headmasterRepository.updateById(headmasterId, payload);

      if (!headmaster) {
        throw new AppError('Headmaster not found.', 404, 'HEADMASTER_NOT_FOUND');
      }

      await notifyUsers(
        [headmaster.email],
        'Headmaster profile updated',
        `Your headmaster profile has been updated for ${headmaster.firstName} ${headmaster.lastName}.`
      );

      return headmaster;
    },

    async deleteHeadmaster(headmasterId) {
      assertObjectId(headmasterId, 'Headmaster id');
      const headmaster = await headmasterRepository.deleteById(headmasterId);

      if (!headmaster) {
        throw new AppError('Headmaster not found.', 404, 'HEADMASTER_NOT_FOUND');
      }

      if (headmaster.school) {
        await schoolRepository.clearHeadmasterById(headmaster.school);
      }
      await studentRepository.clearHeadmasterByHeadmasterId(headmasterId);

      await notifyUsers(
        [headmaster.email],
        'Headmaster profile removed',
        `Your headmaster profile for ${headmaster.firstName} ${headmaster.lastName} has been removed.`
      );

      return headmaster;
    },

    async assignHeadmasterToSchool({ schoolId, headmasterId }) {
      assertObjectId(schoolId, 'School id');
      assertObjectId(headmasterId, 'Headmaster id');

      const school = await schoolRepository.getById(schoolId);
      if (!school) {
        throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
      }

      const headmaster = await headmasterRepository.getById(headmasterId);
      if (!headmaster) {
        throw new AppError('Headmaster not found.', 404, 'HEADMASTER_NOT_FOUND');
      }

      if (headmaster.school && String(headmaster.school) !== String(schoolId)) {
        await schoolRepository.clearHeadmasterById(headmaster.school);
      }

      await headmasterRepository.setSchool(headmasterId, schoolId);
      const updatedSchool = await schoolRepository.setHeadmaster(schoolId, headmasterId);

      const students = await studentRepository.listBySchoolId(schoolId);
      await notifyUsers(
        [headmaster.email, ...students.map((student) => student.email)],
        'Headmaster assignment',
        `Headmaster ${headmaster.firstName} ${headmaster.lastName} is now assigned to school "${school.name}".`
      );

      return updatedSchool;
    },

    async enrollStudentToSchool({ schoolId, studentId }) {
      assertObjectId(schoolId, 'School id');
      assertObjectId(studentId, 'Student id');

      const school = await schoolRepository.getById(schoolId);
      if (!school) {
        throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
      }

      const student = await studentRepository.getById(studentId);
      if (!student) {
        throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
      }

      const updatedStudent = await studentRepository.assignToSchool(
        studentId,
        schoolId,
        school.headmaster || null
      );

      const headmaster = school.headmaster
        ? await headmasterRepository.getById(school.headmaster)
        : null;

      await notifyUsers(
        [updatedStudent.email, headmaster?.email],
        'Student enrollment',
        `Student ${updatedStudent.firstName} ${updatedStudent.lastName} has been enrolled in school "${school.name}".`
      );

      return updatedStudent;
    },

    async transferStudent({ studentId, targetSchoolId }) {
      assertObjectId(studentId, 'Student id');
      assertObjectId(targetSchoolId, 'Target school id');

      const student = await studentRepository.getById(studentId);
      if (!student) {
        throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
      }

      const sourceSchool = student.school
        ? await schoolRepository.getById(student.school)
        : null;

      const targetSchool = await schoolRepository.getById(targetSchoolId);
      if (!targetSchool) {
        throw new AppError('School not found.', 404, 'SCHOOL_NOT_FOUND');
      }

      const updatedStudent = await studentRepository.assignToSchool(
        studentId,
        targetSchoolId,
        targetSchool.headmaster || null
      );

      const sourceHeadmaster = sourceSchool?.headmaster
        ? await headmasterRepository.getById(sourceSchool.headmaster)
        : null;
      const targetHeadmaster = targetSchool.headmaster
        ? await headmasterRepository.getById(targetSchool.headmaster)
        : null;

      await notifyUsers(
        [updatedStudent.email, sourceHeadmaster?.email, targetHeadmaster?.email],
        'Student transfer',
        `Student ${updatedStudent.firstName} ${updatedStudent.lastName} has been transferred from "${sourceSchool?.name || 'Unassigned'}" to "${targetSchool.name}".`
      );

      return updatedStudent;
    }
  };
}

module.exports = {
  createManagementService
};
