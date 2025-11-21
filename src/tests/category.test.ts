import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import categoryRoutes from '../routes/category.routes';
import { Category } from '../models/category.model';

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Ensure we are disconnected from any previous connection (e.g. from app.ts if it was imported)
  await mongoose.disconnect();
  
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Category.deleteMany({});
});

describe('Category Controller', () => {
  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({
          name: 'Electronics',
          description: 'All kinds of electronics',
          image: 'https://example.com/image.png'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Electronics');
      expect(res.body.data.slug).toBe('electronics');
    });

    it('should fail if name is missing', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({
          description: 'Missing name'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      await Category.create({ name: 'Cat 1' });
      await Category.create({ name: 'Cat 2' });

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a category by id', async () => {
      const category = await Category.create({ name: 'Target Category' });

      const res = await request(app).get(`/api/categories/${category._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Target Category');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/categories/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/categories/slug/:slug', () => {
    it('should return a category by slug', async () => {
      const category = await Category.create({ name: 'Slug Category' });

      const res = await request(app).get(`/api/categories/slug/${category.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Slug Category');
      expect(res.body.data.slug).toBe('slug-category');
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/categories/slug/non-existent-slug');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category', async () => {
      const category = await Category.create({ name: 'Old Name' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.slug).toBe('new-name');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      const category = await Category.create({ name: 'To Delete' });

      const res = await request(app).delete(`/api/categories/${category._id}`);

      expect(res.status).toBe(200);
      
      const check = await Category.findById(category._id);
      expect(check).toBeNull();
    });
  });
});