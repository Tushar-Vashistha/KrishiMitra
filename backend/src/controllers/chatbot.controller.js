const { getChatbotResponse } = require('../services/chatbot.service');
const { BadRequestError } = require('../utils/errors');

const askChatbot = async (req, res, next) => {
  try {
    const { message, language } = req.body;
    if (message === undefined || message === null || (typeof message === 'string' && !message.trim())) {
      throw new BadRequestError('Message parameter is required in request body');
    }

    const response = await getChatbotResponse(message, language);

    res.status(200).json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askChatbot,
};
