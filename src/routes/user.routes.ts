import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers
} from '../controllers/user.controller'; // Ajustez le chemin selon votre structure

const router = express.Router();

// @route   POST /api/users
// @desc    Créer un nouvel utilisateur
// @access  Public
router.post('/', createUser);

// @route   GET /api/users
// @desc    Récupérer tous les utilisateurs
// @access  Public
router.get('/', getAllUsers);

// @route   GET /api/users/search
// @desc    Rechercher des utilisateurs avec filtres
// @access  Public
router.get('/search', searchUsers);

// @route   GET /api/users/:id
// @desc    Récupérer un utilisateur par son ID
// @access  Public
router.get('/:id', getUserById);

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Public
router.put('/:id', updateUser);

// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur
// @access  Public
router.delete('/:id', deleteUser);

export default router;