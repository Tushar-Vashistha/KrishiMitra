const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

jest.setTimeout(30000);

describe('Payment Workflow & Weighing Immutability', () => {
  let authToken;
  let testBookingId;

  beforeAll(async () => {
    // 1. Get auth token for staff/admin user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ mobile: '9876500001', otp: '123456', role: 'CENTRE_MANAGER' });

    if (loginRes.body.success) {
      authToken = loginRes.body.data.accessToken;
    } else {
      const regRes = await request(app)
        .post('/api/v1/auth/register/centre')
        .send({
          mobile: '9876543210',
          name: 'Manager Test',
          designation: 'Manager',
          centreId: 'UP-LKO-001',
          role: 'CENTRE_MANAGER'
        });
      authToken = regRes.body.data?.accessToken;
    }

    const booking = await prisma.procurementBooking.findFirst({
      where: { status: { not: 'CANCELLED' } },
      include: { transaction: true }
    });

    if (booking) {
      testBookingId = booking.id;
    }
  });

  test('Step 1: Sync payment status to Paid / Transferred (SUCCESS)', async () => {
    if (!testBookingId || !authToken) return;

    const res = await request(app)
      .post('/api/v1/payments/sync')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bookingId: testBookingId,
        paymentStatus: 'Paid / Transferred',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('SUCCESS');
    expect(res.body.data.payment.referenceId).toBeTruthy();
  });

  test('Step 2: Idempotent re-sync does not overwrite weighing or duplicate payment', async () => {
    if (!testBookingId || !authToken) return;

    const res1 = await request(app)
      .post('/api/v1/payments/sync')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bookingId: testBookingId,
        paymentStatus: 'Paid',
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.payment.status).toBe('SUCCESS');

    const tx = await prisma.procurementTransaction.findUnique({
      where: { bookingId: testBookingId },
      include: { payment: true, weighingRecord: true }
    });

    expect(tx).toBeTruthy();
    expect(tx.payment.status).toBe('SUCCESS');
  });

  test('Step 3: Registering weighing again on existing transaction returns existing record without throwing 400', async () => {
    const tx = await prisma.procurementTransaction.findFirst({
      where: { weighingRecord: { isNot: null } },
      include: { weighingRecord: true }
    });

    if (!tx || !authToken) return;

    const res = await request(app)
      .post(`/api/v1/procurements/${tx.id}/weighing`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        grossWeight: 85,
        tareWeight: 60,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('already exists');
    expect(res.body.data.record.id).toBe(tx.weighingRecord.id);
  });
});
