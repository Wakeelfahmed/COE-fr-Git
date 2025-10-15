const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController.js');

router.get('/', publicationController.getAllPublications);
router.post('/', publicationController.createPublication);
router.get('/:id', publicationController.getPublicationById);
router.put('/:id', publicationController.updatePublication);
router.delete('/:id', publicationController.deletePublication);

module.exports = router;