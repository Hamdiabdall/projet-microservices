# Projet Microservices

Ce projet implémente une architecture de microservices utilisant différentes technologies de communication : REST, GraphQL, gRPC et Kafka.

## Architecture

Le projet est composé des microservices suivants :

1. **Service Utilisateur** (REST) - Gestion des utilisateurs avec API REST
2. **Service Produit** (GraphQL) - Catalogue de produits avec API GraphQL
3. **Service Commande** (Kafka) - Traitement des commandes avec Kafka
4. **Service Paiement** (gRPC) - Traitement des paiements avec gRPC
5. **API Gateway** - Point d'entrée unique qui communique avec tous les services

## Diagramme d'architecture

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

## Prérequis

- Node.js v14+
- Docker et Docker Compose

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/projet-microservices.git
cd projet-microservices
```

### 2. Démarrer avec Docker Compose

La méthode la plus simple est d'utiliser Docker Compose qui configurera automatiquement tous les services :

```bash
docker-compose up --build
```

Pour arrêter tous les services :

```bash
docker-compose down
```

### 3. Installation manuelle (alternative)

Si vous préférez exécuter les services individuellement, suivez ces étapes :

#### Service Utilisateur
```bash
cd user-service
npm install
npm start
```

#### Service Produit
```bash
cd product-service
npm install
npm start
```

#### Service Commande
```bash
cd order-service
npm install
npm start
```

#### Service Paiement
```bash
cd payment-service
npm install
npm start
```

#### API Gateway
```bash
cd api-gateway
npm install
npm start
```

## Endpoints API

### API Gateway (http://localhost:3000)

#### Utilisateurs
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

#### Produits
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

#### Commandes
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

#### Paiements
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

## Flux de données

### Inscription et connexion utilisateur
1. Client envoie les identifiants à l'API Gateway
2. API Gateway les transmet au service utilisateur
3. Service utilisateur vérifie les identifiants et génère un token JWT
4. API Gateway renvoie le token au client

### Consultation des produits
1. Client demande les produits à l'API Gateway
2. API Gateway envoie une requête GraphQL au service produit
3. Service produit renvoie les données des produits
4. API Gateway renvoie les produits au client

### Création de commande
1. Client envoie les détails de la commande à l'API Gateway
2. API Gateway les transmet au service commande
3. Service commande crée la commande et publie un événement "new-order" sur Kafka
4. Service commande consomme lui-même cet événement et met à jour le statut
5. Service commande publie un événement "order-processed" sur Kafka
6. API Gateway renvoie la confirmation au client

### Traitement de paiement
1. Client envoie les détails du paiement à l'API Gateway
2. API Gateway envoie une requête gRPC au service paiement
3. Service paiement traite le paiement et renvoie le statut
4. API Gateway renvoie la confirmation au client

## Technologies utilisées

- **Service Utilisateur** : Express.js, MongoDB, JWT
- **Service Produit** : Apollo Server, GraphQL
- **Service Commande** : Express.js, Kafka
- **Service Paiement** : Node.js, gRPC
- **API Gateway** : Express.js

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

## Dépannage

### Problèmes courants et solutions

1. **Problèmes de connectivité Docker Hub**
   - Si vous avez des problèmes pour télécharger des images depuis Docker Hub, comme `python:3.9-slim`, vous pouvez utiliser les images Node.js pour tous les services.
   - Nous avons remplacé le service de paiement Python par une implémentation Node.js compatible.

2. **Conflits de ports**
   - Si MongoDB ou d'autres services ne démarrent pas en raison de conflits de ports, modifiez les ports exposés dans `docker-compose.yml`
   - Le port MongoDB a déjà été modifié de 27017 à 27018 pour éviter les conflits

3. **Problèmes de connexion à Kafka**
   - Assurez-vous que Zookeeper démarre correctement avant Kafka
   - Vérifiez que les services peuvent résoudre le nom d'hôte "kafka" dans le réseau Docker

4. **Problèmes de communication gRPC**
   - Vérifiez que le service de paiement est accessible depuis l'API Gateway
   - Les fichiers .proto doivent être identiques entre le client et le serveur
   - Le proto est maintenant défini directement dans le code pour éviter les problèmes de synchronisation

5. **Délais de démarrage**
   - Les services peuvent nécessiter plusieurs tentatives pour se connecter aux dépendances
   - Utilisez l'option `restart: on-failure` dans docker-compose pour les redémarrages automatiques

6. **Vérification des logs**
   ```bash
   docker-compose logs api-gateway
   docker-compose logs user-service
   docker-compose logs product-service
   docker-compose logs order-service
   docker-compose logs payment-service
   ```

## Documentation complète

Pour une documentation plus détaillée, veuillez consulter le fichier [DOCUMENTATION.md](./DOCUMENTATION.md) qui contient :
- Une explication détaillée de l'architecture
- Des informations complètes sur les services
- Des détails sur l'implémentation des mécanismes de résilience
- Des exemples de code complets
- Des guides de test et de validation
- Et bien plus encore...

## Auteurs

- Votre Nom

## Licence

MIT
