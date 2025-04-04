const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Configuration MongoDB avec retries
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/user-service';
const connectWithRetry = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      console.log('Connexion à MongoDB réussie');
      return;
    } catch (err) {
      console.error(`Erreur de connexion à MongoDB: ${err.message}, nouvelle tentative dans 5 secondes...`);
      retries -= 1;
      // Attendre 5 secondes avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  console.error('Impossible de se connecter à MongoDB après plusieurs tentatives');
  process.exit(1);
};

// Routes
app.use('/users', userRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur le service utilisateur API' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Une erreur est survenue',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Démarrer le serveur
const startServer = async () => {
  try {
    await connectWithRetry();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Service utilisateur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
