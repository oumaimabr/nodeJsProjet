import { Request, Response } from 'express';
import crypto from 'crypto';
import { User, IUser } from '../models/user.model';
import jwt from 'jsonwebtoken';

// Helper pour envoyer le token dans un cookie
const sendTokenResponse = (user: IUser, statusCode: number, res: Response) => {
  // Créer le token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 jours par défaut
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};

// @desc    Enregistrer un utilisateur
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, age } = req.body;

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      age
    });

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    // Gestion des doublons (code 11000 pour MongoDB)
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Valider email et mot de passe
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
      return;
    }

    // Vérifier l'utilisateur (inclure le mot de passe qui est exclu par défaut)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
      return;
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Déconnecter l'utilisateur / Effacer le cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie'
  });
};

// @desc    Obtenir l'utilisateur courant
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  // L'utilisateur est déjà attaché à req par le middleware protect
  const user = (req as any).user;

  res.status(200).json({
    success: true,
    data: user
  });
};

// @desc    Mot de passe oublié
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Aucun utilisateur trouvé avec cet email'
      });
      return;
    }

    // Obtenir le token de réinitialisation
    const resetToken = user.getResetPasswordToken();
    // Obtenir le code de réinitialisation (pour l'option code)
    const resetCode = user.getResetPasswordCode();

    await user.save({ validateBeforeSave: false });

    // Créer l'URL de réinitialisation
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    const message = `
      Vous avez demandé la réinitialisation de votre mot de passe.
      
      Option 1 (Lien): Veuillez cliquer sur le lien suivant: \n\n ${resetUrl}
      
      Option 2 (Code): Utilisez le code suivant: ${resetCode}
      
      Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
    `;

    try {
      // Importer dynamiquement pour éviter les erreurs si le fichier n'est pas encore là lors de la compilation initiale
      const sendEmail = require('../utils/sendEmail').default;
      
      await sendEmail({
        email: user.email,
        subject: 'Réinitialisation du mot de passe',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Email envoyé',
        data: {
            resetToken, // Pour le dev uniquement, à retirer en prod
            resetCode   // Pour le dev uniquement, à retirer en prod
        }
      });
    } catch (error: any) {
      console.error(error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.resetPasswordCode = undefined;
      user.resetPasswordCodeExpires = undefined;

      await user.save({ validateBeforeSave: false });

      res.status(500).json({
        success: false,
        message: 'L\'email n\'a pas pu être envoyé'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Réinitialiser le mot de passe (via Token)
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Hacher le token reçu pour comparer avec celui en base
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
      return;
    }

    // Définir le nouveau mot de passe
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Réinitialiser le mot de passe (via Code)
// @route   POST /api/auth/resetpassword-code
// @access  Public
export const resetPasswordWithCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, password } = req.body;

    // Hacher le code reçu
    const resetPasswordCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordCode,
      resetPasswordCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Code invalide ou expiré'
      });
      return;
    }

    // Définir le nouveau mot de passe
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le mot de passe (Connecté)
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Note: req.user sera dispo via middleware
    // Pour l'instant on suppose que l'ID est passé ou géré autrement
    // TODO: Remplacer par req.user.id quand middleware prêt
    const userId = (req as any).user?.id; 
    
    if (!userId) {
        res.status(401).json({ success: false, message: 'Non autorisé' });
        return;
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
        res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        return;
    }

    // Vérifier le mot de passe actuel
    if (!(await user.matchPassword(req.body.currentPassword))) {
      res.status(401).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect'
      });
      return;
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Rafraîchir le token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
       res.status(401).json({ success: false, message: 'Pas de token fourni' });
       return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_temporaire_pour_dev') as any;
        const user = await User.findById(decoded.id);

        if (!user) {
            res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
            return;
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token invalide' });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
