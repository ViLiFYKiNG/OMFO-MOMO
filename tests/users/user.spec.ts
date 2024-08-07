import { DataSource } from 'typeorm';
import request from 'supertest';
import createJWKSMock from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app';
import { ROLES } from '../../src/constants';
import { User } from '../../src/entity/User';

describe('GET /auth/self', () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;

  beforeAll(async () => {
    jwks = createJWKSMock('http://localhost:5501');
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should return the 200 status code', async () => {
      const accessToken = jwks.token({
        sub: '1',
        role: ROLES.CUSTOMER,
      });
      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send();
      expect(response.statusCode).toBe(200);
    });

    it('should return the user data', async () => {
      const userData = {
        firstName: 'Anshu',
        lastName: 'Babu',
        email: 'anshu@gmail.com',
        password: 'Abrajput@123',
      };
      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: ROLES.CUSTOMER,
      });

      const accessToken = jwks.token({
        sub: String(data.id),
        role: data.role,
      });

      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken};`])
        .send();

      expect((response.body as Record<string, string>).id).toBe(data.id);
    });

    it('should not return the password field', async () => {
      const userData = {
        firstName: 'Anshu',
        lastName: 'Babu',
        email: 'anshu@gmail.com',
        password: 'Abrajput@123',
      };
      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: ROLES.CUSTOMER,
      });
      const accessToken = jwks.token({
        sub: String(data.id),
        role: data.role,
      });

      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken};`])
        .send();

      expect(response.body as Record<string, string>).not.toHaveProperty(
        'password',
      );
    });

    it('should return 401 status code if token does not exists', async () => {
      // Register user
      const userData = {
        firstName: 'Rakesh',
        lastName: 'K',
        email: 'rakesh@mern.space',
        password: 'password',
      };
      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        role: ROLES.CUSTOMER,
      });

      const response = await request(app).get('/auth/self').send();
      expect(response.statusCode).toBe(401);
    });
  });
});
