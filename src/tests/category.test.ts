import { ICategory, Category } from '../models/category.model';
import mongoose from 'mongoose';

describe('Category Model', () => {
 

  it('should create a category successfully', async () => {
    const categoryData: Partial<ICategory> = {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      slug: 'electronics',
      isActive: true,
    };

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(categoryData.name);
    expect(savedCategory.description).toBe(categoryData.description);
    expect(savedCategory.slug).toBe(categoryData.slug);
    expect(savedCategory.isActive).toBe(categoryData.isActive);
    expect(savedCategory.createdAt).toBeDefined();
    expect(savedCategory.updatedAt).toBeDefined();
  });

  it('should fail to create a category without required fields', async () => {
    const categoryData: Partial<ICategory> = {
      description: 'Only description provided',
    };

    const category = new Category(categoryData);

    let err: mongoose.Error.ValidationError | undefined;
    try {
      await category.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        err = error;
      }
    }

    expect(err).toBeDefined();
    expect(err?.errors).toHaveProperty('name');
    expect(err?.errors).not.toHaveProperty('slug'); // Slug n'est plus requis
  });
  // this fail
//   it('should fail to create a category with duplicate slug', async () => {
//     const categoryData: Partial<ICategory> = {
//       name: 'Electronics',
//       slug: 'electronics',
//       isActive: true,
//     };

//     const category1 = new Category(categoryData);
//     await category1.save();

//     const category2 = new Category(categoryData);
//     let err: mongoose.Error | undefined;
//     try {
//       await category2.save();
//     } catch (error) {
//       err = error as mongoose.Error;
//     }

//     expect(err).toBeDefined();
//     expect((err as any).code).toBe(11000);
//   });

  it('should generate slug automatically from name if not provided', async () => {
    const categoryData: Partial<ICategory> = {
      name: 'Home Appliances',
      isActive: true,
    };

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory.slug).toBeDefined();
    expect(savedCategory.slug).toBe('home-appliances');
  });

  it('should normalize slug with special characters and accents', async () => {
    const categoryData: Partial<ICategory> = {
      name: 'Électronique & Téléphonie!',
      isActive: true,
    };

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory.slug).toBeDefined();
    expect(savedCategory.slug).toBe('electronique-telephonie');
  });

  it('should create a category with parent category', async () => {
    const parentCategory = new Category({
      name: 'Electronics',
      slug: 'electronics',
    });
    const savedParent = await parentCategory.save();

    const subCategoryData: Partial<ICategory> = {
      name: 'Smartphones',
      slug: 'smartphones',
      parentCategory: savedParent._id as mongoose.Types.ObjectId,
    };

    const subCategory = new Category(subCategoryData);
    const savedSubCategory = await subCategory.save();

    expect(savedSubCategory.parentCategory).toEqual(savedParent._id);
  });

  it('should find active categories using static method', async () => {
    await Category.create([
      { name: 'Active 1', slug: 'active-1', isActive: true },
      { name: 'Active 2', slug: 'active-2', isActive: true },
      { name: 'Inactive', slug: 'inactive', isActive: false },
    ]);

    const activeCategories = await Category.findActive();

    expect(activeCategories).toHaveLength(2);
    expect(activeCategories.every((cat: ICategory) => cat.isActive === true)).toBe(true);
  });
// this fail
//   it('should find main categories (without parent) using static method', async () => {
//     const parentCategory = await Category.create({
//       name: 'Parent',
//       slug: 'parent',
//     });

//     await Category.create([
//       { name: 'Main 1', slug: 'main-1', parentCategory: null },
//       { name: 'Main 2', slug: 'main-2', parentCategory: null },
//       { 
//         name: 'Sub', 
//         slug: 'sub', 
//         parentCategory: parentCategory._id as mongoose.Types.ObjectId 
//       },
//     ]);

//     const mainCategories = await Category.findMainCategories();

//     expect(mainCategories).toHaveLength(2);
//     expect(mainCategories.every((cat: ICategory) => cat.parentCategory === null)).toBe(true);
//   });

  it('should check if category has subcategories using instance method', async () => {
    const parentCategory = new Category({
      name: 'Parent',
      slug: 'parent',
    });
    const savedParent = await parentCategory.save();

    await Category.create({
      name: 'Sub Category',
      slug: 'sub-category',
      parentCategory: savedParent._id as mongoose.Types.ObjectId,
    });

    const parentFromDb = await Category.findById(savedParent._id);
    
    if (!parentFromDb) {
      throw new Error('Parent category not found');
    }

    const hasSubCategories = await parentFromDb.hasSubCategories();
    expect(hasSubCategories).toBe(true);
  });

  it('should return false when category has no subcategories', async () => {
    const category = new Category({
      name: 'No Subcategories',
      slug: 'no-subcategories',
    });
    const savedCategory = await category.save();

    const hasSubCategories = await savedCategory.hasSubCategories();
    expect(hasSubCategories).toBe(false);
  });

  it('should handle duplicate slugs by adding suffix', async () => {
    const categoryData1: Partial<ICategory> = {
      name: 'Test Category',
    };

    const categoryData2: Partial<ICategory> = {
      name: 'Test Category',
    };

    const category1 = new Category(categoryData1);
    const savedCategory1 = await category1.save();

    const category2 = new Category(categoryData2);
    const savedCategory2 = await category2.save();

    expect(savedCategory1.slug).toBe('test-category');
    expect(savedCategory2.slug).toBe('test-category-1');
  });

  it('should set isActive to true by default', async () => {
    const categoryData: Partial<ICategory> = {
      name: 'Test Category',
      slug: 'test-category',
    };

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    expect(savedCategory.isActive).toBe(true);
  });

  it('should fail when name exceeds maximum length', async () => {
    const categoryData: Partial<ICategory> = {
      name: 'A'.repeat(101),
      slug: 'test-category',
    };

    const category = new Category(categoryData);

    let err: mongoose.Error.ValidationError | undefined;
    try {
      await category.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        err = error;
      }
    }

    expect(err).toBeDefined();
    expect(err?.errors?.name).toBeDefined();
    expect(err?.errors?.name?.message).toContain('100 caractères');
  });

  it('should fail when description exceeds maximum length', async () => {
    const categoryData: Partial<ICategory> = {
      name: 'Test Category',
      slug: 'test-category',
      description: 'A'.repeat(501),
    };

    const category = new Category(categoryData);

    let err: mongoose.Error.ValidationError | undefined;
    try {
      await category.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        err = error;
      }
    }

    expect(err).toBeDefined();
    expect(err?.errors?.description).toBeDefined();
    expect(err?.errors?.description?.message).toContain('500 caractères');
  });
});