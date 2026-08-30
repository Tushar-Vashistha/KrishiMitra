const logger = require('../utils/logger');

const processPaymentMock = async (paymentId, amount) => {
  logger.info(`[PAYMENT SERVICE] Processing payment of ₹${amount} for Payment Record ID: ${paymentId}...`);
  
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const randomTxId = 'TXN-BANK-' + Math.floor(1000000000 + Math.random() * 9000000000);
  
  logger.info(`[PAYMENT SERVICE] Payment successful for Payment Record ID: ${paymentId}. Bank Transaction Ref: ${randomTxId}`);

  return {
    success: true,
    referenceId: randomTxId,
  };
};

module.exports = {
  processPayment: processPaymentMock,
};
