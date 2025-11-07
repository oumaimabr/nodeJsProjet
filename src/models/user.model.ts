import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  age: number;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required:  [true, 'Le nom est obligatoire'] },
    email: { type: String,  required: [true, 'L’adresse email est obligatoire'], unique: true ,  match: [/.+@.+\..+/, 'Adresse email invalide']},
    age: { type: Number, required:  [true, 'Votre age est obligatoire'],min: [18, 'Vous devez avoir au moins 18 ans'], },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
