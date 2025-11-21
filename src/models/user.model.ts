import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface IUser extends Document {
  name: string;
  email: string;
  age: number;
  password?: string;
  role: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetPasswordCode?: string;
  resetPasswordCodeExpires?: Date;
  refreshToken?: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  getResetPasswordToken(): string;
  getResetPasswordCode(): string;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: [true, 'Le nom est obligatoire'] },
    email: { 
      type: String, 
      required: [true, 'L’adresse email est obligatoire'], 
      unique: true, 
      match: [/.+@.+\..+/, 'Adresse email invalide']
    },
    age: { 
      type: Number, 
      required: [true, 'Votre age est obligatoire'],
      min: [18, 'Vous devez avoir au moins 18 ans']
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: 6,
      select: false // Ne pas renvoyer le mot de passe par défaut
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordCode: String,
    resetPasswordCodeExpires: Date,
    refreshToken: String
  },
  { timestamps: true }
);

// Crypter le mot de passe avant de sauvegarder
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Comparer le mot de passe entré avec le mot de passe haché
UserSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password || '');
};

// Générer un token JWT
UserSchema.methods.getSignedJwtToken = function(): string {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'secret_temporaire_pour_dev', {
    expiresIn: (process.env.JWT_EXPIRE || '30d') as any
  });
};

// Générer un token de réinitialisation de mot de passe (lien)
UserSchema.methods.getResetPasswordToken = function(): string {
  // Générer un token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hacher le token et le définir dans le champ resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Définir l'expiration (10 minutes)
  this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Générer un code de réinitialisation de mot de passe (code à 6 chiffres)
UserSchema.methods.getResetPasswordCode = function(): string {
  // Générer un code à 6 chiffres
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Hacher le code et le définir dans le champ resetPasswordCode
  this.resetPasswordCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // Définir l'expiration (10 minutes)
  this.resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetCode;
};

export const User = mongoose.model<IUser>('User', UserSchema);
