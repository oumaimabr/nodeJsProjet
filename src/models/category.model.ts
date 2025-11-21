import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  parentCategory?: mongoose.Types.ObjectId;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les méthodes d'instance
interface ICategoryInstanceMethods {
  hasSubCategories(): Promise<boolean>;
}

// Interface pour les méthodes statiques
interface ICategoryStaticMethods {
  findActive(): mongoose.Query<ICategory[], ICategory>;
  findMainCategories(): mongoose.Query<ICategory[], ICategory>;
}

// Type combiné pour le modèle
type CategoryModel = Model<ICategory, {}, ICategoryInstanceMethods> & ICategoryStaticMethods;

const CategorySchema: Schema<ICategory, CategoryModel, ICategoryInstanceMethods> = new Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Le nom de la catégorie est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    description: { 
      type: String, 
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
      trim: true
    },
    slug: { 
      type: String, 
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets']
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    parentCategory: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category',
      default: null
    },
    image: { 
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true;
          return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i.test(v);
        },
        message: 'URL d\'image invalide'
      }
    },
    metaTitle: { 
      type: String, 
      maxlength: [60, 'Le meta title ne peut pas dépasser 60 caractères'],
      trim: true
    },
    metaDescription: { 
      type: String, 
      maxlength: [160, 'La meta description ne peut pas dépasser 160 caractères'],
      trim: true
    }
  },
  { 
});

// Virtual pour le comptage des produits
CategorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// CORRECTION : Middleware pour générer le slug automatiquement
CategorySchema.pre('save', function(next) {
  // Regenerate slug if name is modified, even if slug exists
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-') // Replace multiple - with single -
      .trim();
  }
  next();
});

// CORRECTION : S'assurer que le slug est unique en ajoutant un suffixe si nécessaire
CategorySchema.pre('save', async function(next) {
  if (!this.isModified('slug') && !this.isNew) return next();

  try {
    let slug = this.slug;
    let counter = 1;
    let existingCategory;

    do {
      existingCategory = await mongoose.model('Category').findOne({ 
        slug, 
        _id: { $ne: this._id } 
      });
      
      if (existingCategory) {
        slug = `${this.slug}-${counter}`;
        counter++;
      }
    } while (existingCategory);

    this.slug = slug;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Méthode statique pour trouver les catégories actives
CategorySchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Méthode statique pour trouver les catégories principales
CategorySchema.statics.findMainCategories = function() {
  return this.find({ parentCategory: null, isActive: true }).sort({ name: 1 });
};

// Méthode d'instance pour vérifier si la catégorie a des sous-catégories
CategorySchema.methods.hasSubCategories = async function() {
  const count = await mongoose.model('Category').countDocuments({ 
    parentCategory: this._id,
    isActive: true 
  });
  return count > 0;
};

// Export avec le bon typage
export const Category = mongoose.model<ICategory, CategoryModel>('Category', CategorySchema);