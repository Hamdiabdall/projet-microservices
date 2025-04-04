# Documentation Détaillée du Projet Microservices

## Table des matières
1. [Architecture globale](#architecture-globale)
2. [Services et technologies](#services-et-technologies)
3. [Fonctionnalités et flux de données](#fonctionnalités-et-flux-de-données)
4. [Structure du code](#structure-du-code)
5. [Installation et déploiement](#installation-et-déploiement)
6. [API et endpoints](#api-et-endpoints)
7. [Mécanismes de communication](#mécanismes-de-communication)
8. [Mécanismes de résilience](#mécanismes-de-résilience)
9. [Tests et validation](#tests-et-validation)
10. [Dépannage](#dépannage)

## Architecture globale

Le projet implémente une architecture microservices complète avec 5 composants principaux :

```
┌─────────────┐           ┌─────────────┐
│             │           │             │
│   Client    │───────────▶  API Gateway│
│             │           │             │
└─────────────┘           └──────┬──────┘
                                 │
                                 │
       ┌───────────┬─────────────┼─────────────┬───────────┐
       │           │             │             │           │
       ▼           ▼             ▼             ▼           ▼
┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
│             ││             ││             ││             │
│  User Svc   ││ Product Svc ││  Order Svc  ││ Payment Svc │
│    (REST)   ││  (GraphQL)  ││   (Kafka)   ││   (gRPC)    │
│             ││             ││             ││             │
└─────────────┘└─────────────┘└─────────────┘└─────────────┘
```

### Composants

1. **API Gateway** : Point d'entrée unique pour toutes les requêtes externes
2. **Service Utilisateur** : Gestion des utilisateurs avec authentification REST
3. **Service Produit** : Gestion du catalogue de produits avec GraphQL
4. **Service Commande** : Gestion des commandes avec Kafka
5. **Service Paiement** : Traitement des paiements avec gRPC

### Flux de données

- Les clients communiquent uniquement avec l'API Gateway
- L'API Gateway route les requêtes vers les services appropriés
- Les services communiquent entre eux via Kafka ou via l'API Gateway

## Services et technologies

### API Gateway
- **Technologie** : Node.js, Express
- **Rôle** : Router les requêtes, gérer la traduction de protocoles
- **Ports** : 3000 (HTTP)
- **Dépendances** : Tous les autres services

### Service Utilisateur
- **Technologie** : Node.js, Express, MongoDB
- **Rôle** : Gestion des utilisateurs, authentification JWT
- **Protocole** : REST
- **Ports** : 3005 (HTTP)
- **Modèles** : User (username, email, password, salt)
- **Endpoints** : /register, /login
- **Sécurité** : Utilisation de PBKDF2 avec SHA-512 pour le hachage de mots de passe (via crypto)

### Service Produit
- **Technologie** : Node.js, Apollo Server
- **Rôle** : Gestion du catalogue de produits
- **Protocole** : GraphQL
- **Ports** : 3002 (HTTP)
- **Modèles** : Product (id, name, price, description)
- **Opérations** : query (products, product), mutation (addProduct, updateProduct, deleteProduct)

### Service Commande
- **Technologie** : Node.js, Express, Kafka
- **Rôle** : Gestion des commandes, publication d'événements Kafka
- **Protocole** : REST + Kafka Events
- **Ports** : 3003 (HTTP), 9092 (Kafka)
- **Modèles** : Order (id, userId, productId, quantity, status)
- **Endpoints** : /orders (POST, GET), /orders/:id (GET)
- **Topics Kafka** : new-order, order-processed

### Service Paiement
- **Technologie** : Node.js, gRPC
- **Rôle** : Traitement des paiements
- **Protocole** : gRPC
- **Ports** : 50051 (gRPC)
- **Messages** : PaymentRequest, PaymentResponse
- **Méthode RPC** : pay()

## Fonctionnalités et flux de données

### Flux d'inscription et de connexion
1. Client envoie les identifiants à l'API Gateway
2. API Gateway les transmet au service utilisateur
3. Service utilisateur vérifie les identifiants et génère un token JWT
4. API Gateway renvoie le token au client

### Flux de consultation des produits
1. Client demande les produits à l'API Gateway
2. API Gateway envoie une requête GraphQL au service produit
3. Service produit renvoie les données des produits
4. API Gateway renvoie les produits au client

### Flux de création de commande
1. Client envoie les détails de la commande à l'API Gateway
2. API Gateway les transmet au service commande
3. Service commande crée la commande et publie un événement "new-order" sur Kafka
4. Service commande consomme lui-même cet événement et met à jour le statut
5. Service commande publie un événement "order-processed" sur Kafka
6. API Gateway renvoie la confirmation au client

### Flux de paiement
1. Client envoie les détails du paiement à l'API Gateway
2. API Gateway envoie une requête gRPC au service paiement
3. Service paiement traite le paiement et renvoie le statut
4. API Gateway renvoie la confirmation au client

## Structure du code

### API Gateway
```
api-gateway/
├── Dockerfile         # Configuration Docker
├── index.js           # Point d'entrée principal avec routes et middlewares
└── package.json       # Dépendances NPM
```

### Service Utilisateur
```
user-service/
├── Dockerfile         # Configuration Docker
├── index.js           # Point d'entrée principal
├── package.json       # Dépendances NPM
├── controllers/       # Handlers de requêtes
│   └── userController.js
├── models/            # Schémas Mongoose
│   └── user.js
└── routes/            # Définition des routes REST
    └── userRoutes.js
```

### Service Produit
```
product-service/
├── Dockerfile         # Configuration Docker
├── index.js           # Point d'entrée Apollo Server
├── package.json       # Dépendances NPM
├── resolvers.js       # Fonctions resolvers GraphQL
└── schema.js          # Définition du schéma GraphQL
```

### Service Commande
```
order-service/
├── Dockerfile         # Configuration Docker
├── index.js           # Point d'entrée avec Express + Kafka
└── package.json       # Dépendances NPM
```

### Service Paiement
```
payment-service/
├── Dockerfile         # Configuration Docker
├── package.json       # Dépendances NPM
├── payment.proto      # Définition du service gRPC
└── server.js          # Implémentation du serveur gRPC
```

## Installation et déploiement

### Prérequis
- Node.js v14+ 
- Docker et Docker Compose

### Déploiement avec Docker Compose
```bash
# Cloner le dépôt
git clone <repo-url>
cd <repo-dir>

# Démarrer tous les services
docker-compose up --build
```

### Installation manuelle (pour développement)

1. **Service utilisateur**
```bash
cd user-service
npm install
npm start
```

2. **Service produit**
```bash
cd product-service
npm install
npm start
```

3. **Service commande**
```bash
cd order-service
npm install
npm start
```

4. **Service paiement**
```bash
cd payment-service
npm install
npm start
```

5. **API Gateway**
```bash
cd api-gateway
npm install
npm start
```

## API et endpoints

### API Gateway (http://localhost:3000)

#### Endpoints Utilisateur
- `POST /users/register` - Inscription d'un utilisateur
  ```json
  {
    "username": "utilisateur1",
    "email": "utilisateur1@example.com",
    "password": "motdepasse123"
  }
  ```
  
- `POST /users/login` - Connexion d'un utilisateur
  ```json
  {
    "email": "utilisateur1@example.com",
    "password": "motdepasse123"
  }
  ```
  Réponse:
  ```json
  {
    "success": true,
    "message": "Connexion réussie",
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "username": "utilisateur1",
      "email": "utilisateur1@example.com"
    }
  }
  ```

#### Endpoints Produit
- `GET /products` - Liste de tous les produits
  
  Réponse:
  ```json
  {
    "products": [
      {
        "id": "1",
        "name": "Smartphone",
        "price": 899.99,
        "description": "Dernier modèle de smartphone haut de gamme"
      },
      {
        "id": "2",
        "name": "Ordinateur portable",
        "price": 1299.99,
        "description": "Ordinateur portable pour professionnels"
      }
    ]
  }
  ```

- `GET /products/:id` - Détails d'un produit spécifique

#### Endpoints Commande
- `POST /orders` - Création d'une commande
  ```json
  {
    "userId": "user_id",
    "productId": "product_id",
    "quantity": 2
  }
  ```
  Réponse:
  ```json
  {
    "success": true,
    "message": "Commande créée et envoyée pour traitement",
    "orderId": "order_id"
  }
  ```

- `GET /orders` - Liste de toutes les commandes

#### Endpoints Paiement
- `POST /payments` - Traitement d'un paiement
  ```json
  {
    "orderId": "order_id",
    "amount": 1799.98
  }
  ```
  Réponse:
  ```json
  {
    "success": true,
    "message": "Paiement traité avec succès",
    "status": "SUCCESS"
  }
  ```

## Mécanismes de communication

### REST (Service Utilisateur)
- Communication synchrone HTTP
- Format JSON
- Points forts: Simple, standard, facile à déboguer
- Utilisé pour: Authentification, opérations CRUD simples

### GraphQL (Service Produit)
- Communication synchrone HTTP
- Format requête/réponse flexibles
- Points forts: Récupération efficace des données, réduction de l'over-fetching
- Utilisé pour: Requêtes complexes sur les produits, optimisation des données

### Kafka (Service Commande)
- Communication asynchrone basée sur les événements
- Format JSON sur des topics
- Points forts: Découplage des services, résilience, scalabilité
- Utilisé pour: Gestion des événements de commande, communication asynchrone

### gRPC (Service Paiement)
- Communication synchrone basée sur HTTP/2
- Format Protocol Buffers
- Points forts: Vitesse, contrat strict, efficacité
- Utilisé pour: Communication entre services internes, opérations sensibles

## Mécanismes de résilience

### Tentatives de reconnexion
- Implémentation de stratégies de retry pour MongoDB et Kafka
- Backoff exponentiel pour éviter de surcharger les services

### Gestion des timeouts
- Timeouts configurés pour les requêtes HTTP et gRPC
- Circuit breakers pour éviter les défaillances en cascade

### Healthchecks
- Contrôles de santé configurés dans docker-compose.yml
- Intervalles de vérification de 10 secondes
- Options de redémarrage automatique (restart: on-failure)

### Logging
- Logs détaillés pour toutes les opérations
- Horodatage des événements
- Niveau de verbosité configurable

## Tests et validation

### Tests unitaires
- Tests des modèles et des contrôleurs individuellement

### Tests d'intégration
- Vérification des interactions entre les services
- Tests des endpoints de l'API Gateway

### Tests de bout en bout
- Scénarios complets (inscription, commande, paiement)
- Vérification du bon fonctionnement du système complet

### Scénarios de test suggérés
1. **Inscription et connexion utilisateur**
2. **Consultation du catalogue de produits**
3. **Création d'une commande et vérification de son état**
4. **Traitement d'un paiement pour une commande**
5. **Flux complet de bout en bout**

## Dépannage

### Problèmes courants et solutions

1. **Problèmes de connectivité Docker Hub**
   - Si vous avez des problèmes pour télécharger des images depuis Docker Hub, le service de paiement a été implémenté en Node.js au lieu de Python pour éviter ce problème

2. **Conflits de ports**
   - Si MongoDB ou d'autres services ne démarrent pas en raison de conflits de ports, modifiez les ports dans docker-compose.yml
   - Le port MongoDB a déjà été modifié de 27017 à 27018 pour éviter les conflits

3. **Problèmes de connexion à Kafka**
   - Assurez-vous que Zookeeper démarre correctement avant Kafka
   - Vérifiez les logs avec `docker-compose logs kafka`

4. **Problèmes de communication gRPC**
   - Vérifiez que les fichiers .proto sont identiques côté client et serveur
   - Le proto est maintenant défini directement dans le code pour éviter les problèmes de synchronisation

5. **Délais de démarrage**
   - Les services peuvent nécessiter plusieurs tentatives de connexion aux dépendances
   - Attendez que tous les services soient complètement démarrés avant de tester

6. **Vérification des logs**
   ```bash
   docker-compose logs api-gateway
   docker-compose logs user-service
   docker-compose logs product-service
   docker-compose logs order-service
   docker-compose logs payment-service
   ```

## Implémentation détaillée des services

### Service Utilisateur (REST)

#### Modèle utilisateur (user.js)
```javascript
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

// Fonction de hachage
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Génération d'un sel et hachage du mot de passe
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = hashPassword(this.password, this.salt);
  next();
});

// Vérification du mot de passe
userSchema.methods.comparePassword = async function(password) {
  const hashedPassword = hashPassword(password, this.salt);
  return hashedPassword === this.password;
};

module.exports = mongoose.model('User', userSchema);
```

#### Contrôleur utilisateur (userController.js)
```javascript
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Clé secrète pour JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Inscription utilisateur
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur ou email déjà utilisé'
      });
    }

    // Créer un nouvel utilisateur
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Utilisateur enregistré avec succès',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// Connexion utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Rechercher l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};
```

### Service Produit (GraphQL)

#### Schéma GraphQL (schema.js)
```javascript
const { gql } = require('apollo-server');

module.exports = gql`
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
  }

  type Query {
    products: [Product]
    product(id: ID!): Product
  }

  type Mutation {
    addProduct(name: String!, price: Float!, description: String): Product
    updateProduct(id: ID!, name: String, price: Float, description: String): Product
    deleteProduct(id: ID!): Product
  }
`;
```

#### Resolvers GraphQL (resolvers.js)
```javascript
// Base de données fictive pour les produits
const products = [
  { id: '1', name: 'Smartphone', price: 899.99, description: 'Dernier modèle de smartphone haut de gamme' },
  { id: '2', name: 'Ordinateur portable', price: 1299.99, description: 'Ordinateur portable pour professionnels' },
  { id: '3', name: 'Tablette', price: 499.99, description: 'Tablette puissante et légère' },
  { id: '4', name: 'Écouteurs sans fil', price: 149.99, description: 'Écouteurs avec réduction de bruit active' }
];

const resolvers = {
  Query: {
    // Récupérer tous les produits
    products: () => products,
    
    // Récupérer un produit par ID
    product: (_, { id }) => {
      return products.find(product => product.id === id);
    }
  },
  
  Mutation: {
    // Ajouter un nouveau produit
    addProduct: (_, { name, price, description }) => {
      const newProduct = {
        id: String(products.length + 1),
        name,
        price,
        description
      };
      
      products.push(newProduct);
      return newProduct;
    },
    
    // Mettre à jour un produit existant
    updateProduct: (_, { id, name, price, description }) => {
      const productIndex = products.findIndex(product => product.id === id);
      
      if (productIndex === -1) {
        throw new Error(`Produit avec l'ID ${id} non trouvé`);
      }
      
      const updatedProduct = {
        ...products[productIndex],
        name: name || products[productIndex].name,
        price: price || products[productIndex].price,
        description: description || products[productIndex].description
      };
      
      products[productIndex] = updatedProduct;
      return updatedProduct;
    },
    
    // Supprimer un produit
    deleteProduct: (_, { id }) => {
      const productIndex = products.findIndex(product => product.id === id);
      
      if (productIndex === -1) {
        throw new Error(`Produit avec l'ID ${id} non trouvé`);
      }
      
      const deletedProduct = products[productIndex];
      products.splice(productIndex, 1);
      
      return deletedProduct;
    }
  }
};

module.exports = resolvers;
```

### Service Paiement (gRPC)

#### Définition Proto (payment.proto)
```protobuf
syntax = "proto3";

service PaymentService {
  rpc Pay (PaymentRequest) returns (PaymentResponse);
}

message PaymentRequest {
  string orderId = 1;
  float amount = 2;
}

message PaymentResponse {
  string status = 1;
}
```

#### Serveur gRPC (server.js)
```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');

// Définition du proto directement ici
const PROTO_DEFINITION = `
syntax = "proto3";

service PaymentService {
  rpc Pay (PaymentRequest) returns (PaymentResponse);
}

message PaymentRequest {
  string orderId = 1;
  float amount = 2;
}

message PaymentResponse {
  string status = 1;
}
`;

// Écrire le proto dans un fichier
const PROTO_PATH = path.join(__dirname, 'payment.proto');
fs.writeFileSync(PROTO_PATH, PROTO_DEFINITION);
console.log(`Fichier proto créé: ${PROTO_PATH}`);

// Charger le fichier proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Charger le package proto
const proto = grpc.loadPackageDefinition(packageDefinition);

// Implémentation du service
class PaymentService {
  pay(call, callback) {
    const { orderId, amount } = call.request;
    console.log(`Paiement reçu: ${amount} pour la commande ${orderId}`);
    
    // Simuler un traitement de paiement
    setTimeout(() => {
      callback(null, { status: 'SUCCESS' });
    }, 500);
  }
}

// Créer un serveur gRPC
const server = new grpc.Server();
server.addService(proto.PaymentService.service, {
  pay: (call, callback) => new PaymentService().pay(call, callback)
});

// Démarrer le serveur
const port = process.env.PORT || 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Erreur lors du démarrage du serveur:', err);
    return;
  }
  console.log(`Serveur de paiement démarré sur le port ${port}`);
  server.start();
});
```

## Modifications et optimisations importantes

### Remplacement de bcrypt par crypto
Dans le service utilisateur, nous avons remplacé la bibliothèque bcrypt par le module crypto intégré à Node.js pour les raisons suivantes :
- Problèmes de compatibilité de bcrypt dans certains environnements Docker
- Erreur "Error loading shared library bcrypt_lib.node: Exec format error" fréquente
- Besoin d'une solution sans dépendances externes

La nouvelle implémentation utilise :
- PBKDF2 (Password-Based Key Derivation Function 2) avec SHA-512
- 10 000 itérations pour le hachage
- Sel cryptographique aléatoire de 16 octets
- Stockage séparé du sel et du mot de passe haché

Exemple d'implémentation :
```javascript
const crypto = require('crypto');

// Fonction de hachage
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Génération d'un sel et hachage du mot de passe
const salt = crypto.randomBytes(16).toString('hex');
const hashedPassword = hashPassword(password, salt);

// Vérification du mot de passe
function verifyPassword(password, salt, storedHash) {
  const hash = hashPassword(password, salt);
  return hash === storedHash;
}
```

### Optimisation des configurations Docker
Plusieurs optimisations ont été apportées aux configurations Docker :

1. **Noms de conteneurs explicites**
   - Ajout de `container_name` pour chaque service
   - Amélioration de la résolution de noms entre conteneurs

2. **Configuration réseau améliorée**
   - Sous-réseau Docker dédié (172.20.0.0/16)
   - Isolation du trafic et résolution de noms fiable

3. **Health checks personnalisés**
   - Tests spécifiques pour chaque service
   - Intervalles et timeouts optimisés
   - Nombre de tentatives configuré

4. **Gestion des paramètres d'environnement**
   - Variables d'environnement centralisées dans docker-compose.yml
   - URL de services configurables via variables d'environnement

5. **Optimisation des Dockerfiles**
   - Installation des dépendances nécessaires pour la compilation
   - Couches Docker optimisées pour le cache
   - Multi-staging pour réduire la taille des images finales

## Conclusion

Cette application de microservices démontre la mise en œuvre de différentes architectures de communication (REST, GraphQL, Kafka, gRPC) dans un système cohérent. L'architecture est conçue pour être modulaire, résiliente et extensible, permettant d'ajouter de nouvelles fonctionnalités ou de remplacer des composants sans perturber l'ensemble du système.

Les mécanismes de résilience implémentés assurent que le système peut continuer à fonctionner même en cas de défaillance temporaire de certains composants, tandis que l'API Gateway simplifie l'interface pour les clients tout en gérant la complexité interne de la communication entre les services. 