import { Router } from 'express';
import { 
  createCategory, 
  getAllCategories, 
  getCategoryById, 
  getCategoryBySlug,
  updateCategory, 
  deleteCategory 
} from '../controllers/category.controller';

const router = Router();

// Routes pour les catégories

// GET /api/categories - Récupérer toutes les catégories
router.get('/', getAllCategories);

// GET /api/categories/:id - Récupérer une catégorie par ID
router.get('/:id', getCategoryById);

// GET /api/categories/slug/:slug - Récupérer une catégorie par Slug
router.get('/slug/:slug', getCategoryBySlug);

// POST /api/categories - Créer une nouvelle catégorie
router.post('/', createCategory);

// PUT /api/categories/:id - Mettre à jour une catégorie
router.put('/:id', updateCategory);

// DELETE /api/categories/:id - Supprimer une catégorie
router.delete('/:id', deleteCategory);

export default router;
