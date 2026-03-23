const express = require('express');
const { z } = require('zod');
const env = require('../../config/env');
const { validateBody } = require('../middleware/validate');
const { createManagementService } = require('../application/management/managementService');
const { createSchoolMongoRepository } = require('../infrastructure/repositories/mongo/schoolMongoRepository');
const { createStudentMongoRepository } = require('../infrastructure/repositories/mongo/studentMongoRepository');
const { createHeadmasterMongoRepository } = require('../infrastructure/repositories/mongo/headmasterMongoRepository');
const { createNotificationDispatcher } = require('../infrastructure/services/notificationDispatcher');

const router = express.Router();

const service = createManagementService({
  schoolRepository: createSchoolMongoRepository(),
  studentRepository: createStudentMongoRepository(),
  headmasterRepository: createHeadmasterMongoRepository(),
  notificationDispatcher: createNotificationDispatcher({
    baseUrl: env.notificationServiceUrl
  })
});

const schoolSchema = z.object({
  name: z.string().trim().min(1).max(150),
  address: z.string().trim().min(1).max(255),
  logoUrl: z.string().trim().url().max(500).optional()
}).strict();

const schoolUpdateSchema = schoolSchema.partial();

const studentSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  school: z.string().trim().optional(),
  headmaster: z.string().trim().optional()
}).strict();

const studentUpdateSchema = studentSchema.partial();

const headmasterSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  school: z.string().trim().optional()
}).strict();

const headmasterUpdateSchema = headmasterSchema.partial();

const assignHeadmasterSchema = z.object({
  schoolId: z.string().trim().min(1),
  headmasterId: z.string().trim().min(1)
}).strict();

const enrollStudentSchema = z.object({
  schoolId: z.string().trim().min(1),
  studentId: z.string().trim().min(1)
}).strict();

const transferStudentSchema = z.object({
  studentId: z.string().trim().min(1),
  targetSchoolId: z.string().trim().min(1)
}).strict();

router.post('/schools', validateBody(schoolSchema), async (req, res, next) => {
  try {
    const school = await service.createSchool(req.body);
    res.status(201).json({ message: 'School created successfully.', data: school });
  } catch (error) {
    next(error);
  }
});

router.get('/schools', async (_req, res, next) => {
  try {
    const schools = await service.listSchools();
    res.json({ message: 'Schools retrieved successfully.', count: schools.length, data: schools });
  } catch (error) {
    next(error);
  }
});

router.get('/schools/:id', async (req, res, next) => {
  try {
    const school = await service.getSchoolById(req.params.id);
    res.json({ message: 'School retrieved successfully.', data: school });
  } catch (error) {
    next(error);
  }
});

router.patch('/schools/:id', validateBody(schoolUpdateSchema), async (req, res, next) => {
  try {
    const school = await service.updateSchool(req.params.id, req.body);
    res.json({ message: 'School updated successfully.', data: school });
  } catch (error) {
    next(error);
  }
});

router.delete('/schools/:id', async (req, res, next) => {
  try {
    const school = await service.deleteSchool(req.params.id);
    res.json({ message: 'School deleted successfully.', data: school });
  } catch (error) {
    next(error);
  }
});

router.post('/students', validateBody(studentSchema), async (req, res, next) => {
  try {
    const student = await service.createStudent(req.body);
    res.status(201).json({ message: 'Student created successfully.', data: student });
  } catch (error) {
    next(error);
  }
});

router.get('/students', async (_req, res, next) => {
  try {
    const students = await service.listStudents();
    res.json({ message: 'Students retrieved successfully.', count: students.length, data: students });
  } catch (error) {
    next(error);
  }
});

router.get('/students/:id', async (req, res, next) => {
  try {
    const student = await service.getStudentById(req.params.id);
    res.json({ message: 'Student retrieved successfully.', data: student });
  } catch (error) {
    next(error);
  }
});

router.patch('/students/:id', validateBody(studentUpdateSchema), async (req, res, next) => {
  try {
    const student = await service.updateStudent(req.params.id, req.body);
    res.json({ message: 'Student updated successfully.', data: student });
  } catch (error) {
    next(error);
  }
});

router.delete('/students/:id', async (req, res, next) => {
  try {
    const student = await service.deleteStudent(req.params.id);
    res.json({ message: 'Student deleted successfully.', data: student });
  } catch (error) {
    next(error);
  }
});

router.post('/headmasters', validateBody(headmasterSchema), async (req, res, next) => {
  try {
    const headmaster = await service.createHeadmaster(req.body);
    res.status(201).json({ message: 'Headmaster created successfully.', data: headmaster });
  } catch (error) {
    next(error);
  }
});

router.get('/headmasters', async (_req, res, next) => {
  try {
    const headmasters = await service.listHeadmasters();
    res.json({ message: 'Headmasters retrieved successfully.', count: headmasters.length, data: headmasters });
  } catch (error) {
    next(error);
  }
});

router.get('/headmasters/:id', async (req, res, next) => {
  try {
    const headmaster = await service.getHeadmasterById(req.params.id);
    res.json({ message: 'Headmaster retrieved successfully.', data: headmaster });
  } catch (error) {
    next(error);
  }
});

router.patch('/headmasters/:id', validateBody(headmasterUpdateSchema), async (req, res, next) => {
  try {
    const headmaster = await service.updateHeadmaster(req.params.id, req.body);
    res.json({ message: 'Headmaster updated successfully.', data: headmaster });
  } catch (error) {
    next(error);
  }
});

router.delete('/headmasters/:id', async (req, res, next) => {
  try {
    const headmaster = await service.deleteHeadmaster(req.params.id);
    res.json({ message: 'Headmaster deleted successfully.', data: headmaster });
  } catch (error) {
    next(error);
  }
});

router.post('/interactions/assign-headmaster', validateBody(assignHeadmasterSchema), async (req, res, next) => {
  try {
    const school = await service.assignHeadmasterToSchool(req.body);
    res.json({ message: 'Headmaster assigned successfully.', data: school });
  } catch (error) {
    next(error);
  }
});

router.post('/interactions/enroll-student', validateBody(enrollStudentSchema), async (req, res, next) => {
  try {
    const student = await service.enrollStudentToSchool(req.body);
    res.json({ message: 'Student enrolled successfully.', data: student });
  } catch (error) {
    next(error);
  }
});

router.post('/interactions/transfer-student', validateBody(transferStudentSchema), async (req, res, next) => {
  try {
    const student = await service.transferStudent(req.body);
    res.json({ message: 'Student transferred successfully.', data: student });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
