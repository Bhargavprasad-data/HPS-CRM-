const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, assignTeamMember, removeTeamMember, getProjectStats, updateProjectProgress } = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', authenticate, getProjectStats);
router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProject);
router.post('/', authenticate, authorize('Admin', 'Manager'), createProject);
router.put('/:id', authenticate, authorize('Admin', 'Manager'), updateProject);
router.put('/:id/progress', authenticate, updateProjectProgress);
router.delete('/:id', authenticate, authorize('Admin'), deleteProject);
router.post('/:id/assign', authenticate, authorize('Admin', 'Manager'), assignTeamMember);
router.delete('/:id/assign/:employee_id', authenticate, authorize('Admin', 'Manager'), removeTeamMember);

module.exports = router;
