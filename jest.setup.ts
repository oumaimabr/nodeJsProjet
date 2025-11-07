import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connexion à MongoDB
  await mongoose.connect(uri, {
 //   useNewUrlParser: true,
   // useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Arrêter et nettoyer la connexion
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Vérification que la connexion est active avant de nettoyer les collections
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  } else {
    throw new Error('Database connection is not established');
  }
});
