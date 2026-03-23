const mongoose = require('mongoose');

// Schéma utilisateur aligné sur les champs déjà utilisés par le flux d'authentification.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      // Normalise l'email pour simplifier la recherche et éviter les doublons liés à la casse.
      lowercase: true,
      maxlength: 254,
      unique: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  {
    // Ajoute createdAt et updatedAt automatiquement.
    timestamps: true
  }
);

// Réutilise le modèle existant si le fichier est rechargé pendant les tests ou en développement.
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
