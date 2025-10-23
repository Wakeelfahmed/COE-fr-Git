const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController.js');
const auth = require('../middleware/auth');

router.get('/', auth, publicationController.getAllPublications);
router.post('/', auth, publicationController.createPublication);
router.get('/:id', auth, publicationController.getPublicationById);
router.put('/:id', auth, publicationController.updatePublication);
router.delete('/:id', auth, publicationController.deletePublication);

module.exports = router;