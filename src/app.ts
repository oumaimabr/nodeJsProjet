import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import authRoutes from './routes/auth.routes';
import cookieParser from 'cookie-parser';


const app = express();
const port = 1515;

// Middleware pour parser le JSON
app.use(express.json());
app.use(cookieParser());

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données MongoDB et démarrage du serveur
// On ne connecte pas si on est en mode test
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI || '', {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    .then(() => console.log('Connecté à MongoDB'))
    .catch((error) => {
      console.error('Erreur de connexion à MongoDB:', error);
      process.exit(1);
    });

  app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
}

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Serveur opérationnel ! 🚀' });
});

// Exemple de middleware de journalisation (placé avant les routes pour tout logger)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);

// Gestion des erreurs 404
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Ressource non trouvée' });
});

export default app;