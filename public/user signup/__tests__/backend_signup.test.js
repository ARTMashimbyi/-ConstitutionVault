jest.mock('../firebase-service-account.json', () => ({}), { virtual: true });

const request = require('supertest');
const app = require('../index');


jest.mock('firebase-admin', () => {
  const getMock = jest.fn();
  const addMock = jest.fn();

  const whereMock = jest.fn(() => ({ get: getMock }));
  const collectionMock = jest.fn(() => ({
    where: whereMock,
    add: addMock
  }));

  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn()
    },
    firestore: jest.fn(() => ({
      collection: collectionMock
    }))
  };
});

const admin = require('firebase-admin');

describe('POST /api/signup', () => {
  const mockToken = 'test_id_token';

  beforeEach(() => {
    // Reset mocks before each test
    admin.firestore().collection().where().get.mockReset();
    admin.firestore().collection().add.mockReset();
  });

  it('returns 400 if id_token is missing', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Missing ID token');
  });

  it('returns 200 if user already signed up', async () => {
    admin.firestore().collection().where().get.mockResolvedValue({
      empty: false
    });

    const res = await request(app)
      .post('/api/signup')
      .send({ id_token: mockToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User already signed up');
  });

  it('signs up a new user successfully', async () => {
    admin.firestore().collection().where().get.mockResolvedValue({
      empty: true
    });

    const res = await request(app)
      .post('/api/signup')
      .send({ id_token: mockToken });

    expect(admin.firestore().collection().add).toHaveBeenCalledWith({ id_token: mockToken });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Signup successful');
  });

  it('returns 500 on internal server error', async () => {
    admin.firestore().collection().where().get.mockRejectedValue(new Error('Firestore error'));

    const res = await request(app)
      .post('/api/signup')
      .send({ id_token: mockToken });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});
