const express =  require('express');
const router  =  express.Router();
const notesController = require('@controller/v1/notesManagement/notesController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-notes').post(auth(PLATFORM.ADMIN),notesController.addNotes);
router.route('/update-notes').put(auth(PLATFORM.ADMIN),notesController.addNotes);
router.route('/get-notes-details/:id').get(auth(PLATFORM.ADMIN),notesController.getDetails);
router.route('/delete-notes/:id').delete(auth(PLATFORM.ADMIN),notesController.deleteNotes);
router.route('/get-notes-list').post(auth(PLATFORM.ADMIN),notesController.getNotesList);

module.exports = router;
