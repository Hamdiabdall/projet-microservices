const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Fonction utilitaire pour hasher un mot de passe
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Nous avons déplacé cette logique vers le contrôleur
// Pas besoin de hook pre-save car le contrôleur gère le hachage

// Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = function(password) {
  // Version sync sans async/await
  const hash = hashPassword(password, this.salt);
  return hash === this.password;
};

module.exports = mongoose.model('User', userSchema);
