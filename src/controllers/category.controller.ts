import { Request, Response } from 'express';
import { Category, ICategory } from '../models/category.model';
import mongoose from 'mongoose';

// CREATE - Créer une nouvelle catégorie
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, parentCategory, image, metaTitle, metaDescription } = req.body;

    // Vérifier si une catégorie avec le même nom existe déjà (optionnel, car le slug gère l'unicité, mais bon pour l'UX)
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      // Note: On pourrait autoriser des noms dupliqués si les slugs sont différents, 
      // mais souvent on veut éviter la confusion. Ici on laisse passer car le slug sera unique.
      // Si on voulait bloquer:
      // return res.status(400).json({ success: false, message: 'Une catégorie avec ce nom existe déjà' });
    }

    const category: ICategory = new Category({
      name,
      description,
      parentCategory: parentCategory || null,
      image,
      metaTitle,
      metaDescription
    });

    const savedCategory = await category.save();

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: savedCategory
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la création de la catégorie',
        error: error.message
      });
    }
  }
};

// READ - Récupérer toutes les catégories
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name slug').sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
    });
  }
};

// READ - Récupérer une catégorie par ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID catégorie invalide'
      });
      return;
    }

    const category = await Category.findById(id).populate('parentCategory', 'name slug');

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
      return;
    }

    // Récupérer les sous-catégories
    const subCategories = await Category.find({ parentCategory: id });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        subCategories
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie',
      error: error.message
    });
  }
};

// READ - Récupérer une catégorie par Slug
export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug }).populate('parentCategory', 'name slug');

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
      return;
    }

    // Récupérer les sous-catégories
    const subCategories = await Category.find({ parentCategory: category._id });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        subCategories
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie',
      error: error.message
    });
  }
};

// UPDATE - Mettre à jour une catégorie
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, parentCategory, isActive, image, metaTitle, metaDescription } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID catégorie invalide'
      });
      return;
    }

    // Éviter qu'une catégorie soit son propre parent
    if (parentCategory && parentCategory === id) {
      res.status(400).json({
        success: false,
        message: 'Une catégorie ne peut pas être son propre parent'
      });
      return;
    }

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
      return;
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || undefined;
    if (isActive !== undefined) category.isActive = isActive;
    if (image !== undefined) category.image = image;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined) category.metaDescription = metaDescription;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: updatedCategory
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la catégorie',
        error: error.message
      });
    }
  }
};

// DELETE - Supprimer une catégorie
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'ID catégorie invalide'
      });
      return;
    }

    // Vérifier si la catégorie a des sous-catégories
    const hasSubCategories = await Category.findOne({ parentCategory: id });
    if (hasSubCategories) {
      res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette catégorie car elle contient des sous-catégories. Veuillez d\'abord supprimer ou déplacer les sous-catégories.'
      });
      return;
    }

    // Note: On pourrait aussi vérifier s'il y a des produits liés à cette catégorie

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Catégorie supprimée avec succès',
      data: deletedCategory
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
      error: error.message
    });
  }
};
