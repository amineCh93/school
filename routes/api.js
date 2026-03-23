const express = require('express');

const router = express.Router();
const schools = [
  {
    id: 1,
    name: 'Green Valley High School',
    principal: 'Dr. Sarah Ahmed',
    studentCount: 820,
    address: '12 Elm Street'
  },
  {
    id: 2,
    name: 'Sunrise Primary School',
    principal: 'Mr. Daniel Brooks',
    studentCount: 410,
    address: '48 River Road'
  }
];

router.get('/schools', (_req, res) => {
  res.json({
    message: 'School management endpoint is running.',
    count: schools.length,
    data: schools
  });
});

module.exports = router;
