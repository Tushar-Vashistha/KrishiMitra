const request = require('supertest');
const app = require('../src/app');

describe('Chatbot API Endpoint (/api/v1/chatbot)', () => {
  it('should return 400 when message is missing or empty', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should respond to greetings in English', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'Hello! How are you?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('Hello');
  });

  it('should respond to greetings in Hindi', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'नमस्ते, आप कैसे हैं?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('कृषिमित्र');
  });

  it('should respond to mandi rates / MSP queries', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'What is Wheat MSP price?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('2,275');
  });

  it('should respond to slot booking queries in Hindi', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'स्लॉट कैसे बुक करें?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('स्लॉट बुक');
  });

  it('should respond to payment status questions', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'When will I get payment in my bank?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('2 to 3 working days');
  });

  it('should respond to trust score questions', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'How does credit score penalty work?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('Credit / Trust Score');
  });

  it('should respect language parameter when language is hi', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'hello', language: 'hi' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('कृषिमित्र');
  });

  it('should respect language parameter when language is en', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot')
      .send({ message: 'hello', language: 'en' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.response).toContain('Hello');
  });
});
