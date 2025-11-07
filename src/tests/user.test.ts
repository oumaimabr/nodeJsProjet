import { IUser, User } from '../models/user.model';
import mongoose from 'mongoose';

describe('User Model', () => {
  it('should create a user successfully', async () => {
    const userData: Partial<IUser> = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 19,
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.age).toBe(userData.age);
  });

  it('should fail to create a user without required fields', async () => {
    const userData: Partial<IUser> = {
      email: 'john.doe@example.com',
    };

    const user = new User(userData);

    let err: mongoose.Error.ValidationError | undefined;
    try {
      await user.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        err = error;
      }
    }

    expect(err).toBeDefined();
    expect(err?.errors).toHaveProperty('name');
    expect(err?.errors).toHaveProperty('age');
  });

  it('should fail to create a user with duplicate email', async () => {
    const userData: Partial<IUser> = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 19,
    };

    const user1 = new User(userData);
    await user1.save();

    const user2 = new User(userData);
    let err: mongoose.Error | undefined;
    try {
      await user2.save();
    } catch (error) {
      err = error as mongoose.Error;
    }

    expect(err).toBeDefined();
    expect((err as any).code).toBe(11000); // MongoDB duplicate key error
  });
});
