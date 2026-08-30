const express = require('express');
const { askChatbot } = require('../controllers/chatbot.controller');

const router = express.Router();

router.post('/', askChatbot);

module.exports = router;
