const { getChatbotResponse } = require('../services/chatbot.service');
const { BadRequestError } = require('../utils/errors');

const askChatbot = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      throw new BadRequestError('Message query parameter is required');
    }

    const response = await getChatbotResponse(message);

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
