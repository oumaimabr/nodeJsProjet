import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

//import 
import userRoutes from './routes/user.routes'; // Ajustez le chemin
const app = express();
const port = 1515;
// Charger les variables d'environnement
dotenv.config();
// Connexion à la base de données MongoDB
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
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Serveur opérationnel ! 🚀' });
});
// Routes
app.use('/api/users', userRoutes);
// Gestion des erreurs 404
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Ressource non trouvée' });
});
// Exemple de middleware de journalisation
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});