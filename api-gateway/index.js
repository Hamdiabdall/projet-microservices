const express = require('express');
const { request, gql } = require('graphql-request');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const app = express();
const { Kafka } = require('kafkajs');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Middleware
app.use(cors());
app.use(express.json());

// Configurer le logging
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};
app.use(logRequest);

// Configuration des URLs de service
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3005';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'localhost:50051';

console.log('Services URLs:');
console.log(`- User service: ${USER_SERVICE_URL}`);
console.log(`- Product service: ${PRODUCT_SERVICE_URL}`);
console.log(`- Order service: ${ORDER_SERVICE_URL}`);
console.log(`- Payment service: ${PAYMENT_SERVICE_URL}`);

// Configuration Kafka
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
console.log(`- Kafka brokers: ${kafkaBrokers}`);

const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: [kafkaBrokers],
  retry: {
    initialRetryTime: 1000,
    retries: 8
  }
});
const producer = kafka.producer();

// Initialisation du producteur Kafka avec tentatives
const initKafka = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Tentative de connexion au producteur Kafka...');
      await producer.connect();
      console.log('Producteur Kafka connecté avec succès');
      return;
    } catch (error) {
      console.error(`Erreur de connexion Kafka: ${error.message}`);
      retries--;
      if (retries === 0) {
        console.error('Impossible de se connecter à Kafka après plusieurs tentatives');
        break;
      }
      console.log(`Nouvelle tentative dans 5 secondes... (${retries} restantes)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Définition du proto directement ici au lieu de charger un fichier externe
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

// Écrire le proto dans un fichier temporaire
const PROTO_PATH = path.join(__dirname, 'payment.proto');
fs.writeFileSync(PROTO_PATH, PROTO_DEFINITION);
console.log(`Fichier proto écrit dans ${PROTO_PATH}`);

// Chargement du fichier proto pour gRPC
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const paymentProto = grpc.loadPackageDefinition(packageDefinition);
console.log('Définition Proto chargée avec succès');

// Initialiser le client gRPC
let paymentClient;
const initGrpcClient = () => {
  try {
    paymentClient = new paymentProto.PaymentService(
      PAYMENT_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
    console.log(`Client gRPC initialisé pour ${PAYMENT_SERVICE_URL}`);
  } catch (error) {
    console.error(`Erreur lors de l'initialisation du client gRPC: ${error.message}`);
  }
};
initGrpcClient();

// Fonction utilitaire pour les requêtes HTTP avec timeout et retries
const fetchWithRetry = async (url, options = {}, retries = 3, timeout = 5000) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      return response;
    } catch (error) {
      console.error(`Tentative ${i+1}/${retries} échouée pour ${url}: ${error.message}`);
      lastError = error;
      // Attendre avant de réessayer
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  throw lastError;
};

// Routes API Gateway

// --- Service utilisateur (REST) ---
app.post('/users/register', async (req, res) => {
  try {
    const result = await fetchWithRetry(`${USER_SERVICE_URL}/users/register`, {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await result.json();
    res.json(data);
  } catch (error) {
    console.error(`Erreur lors de l'inscription: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur de service', error: error.message });
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const result = await fetchWithRetry(`${USER_SERVICE_URL}/users/login`, {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await result.json();
    res.json(data);
  } catch (error) {
    console.error(`Erreur lors de la connexion: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur de service', error: error.message });
  }
});

// --- Service produit (GraphQL) ---
app.get('/products', async (req, res) => {
  try {
    const query = gql`
      {
        products {
          id
          name
          price
          description
        }
      }
    `;
    const data = await request(PRODUCT_SERVICE_URL, query);
    res.json(data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des produits: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur de service', error: error.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = gql`
      {
        product(id: "${id}") {
          id
          name
          price
          description
        }
      }
    `;
    const data = await request(PRODUCT_SERVICE_URL, query);
    res.json(data);
  } catch (error) {
    console.error(`Erreur lors de la récupération du produit ${req.params.id}: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur de service', error: error.message });
  }
});

// --- Service commande (Kafka) ---
app.post('/orders', async (req, res) => {
  try {
    // Créer une requête vers le service de commande
    const result = await fetchWithRetry(`${ORDER_SERVICE_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await result.json();
    res.json(data);
  } catch (error) {
    console.error(`Erreur lors de la création de commande: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur de service', error: error.message });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const result = await fetchWithRetry(`${ORDER_SERVICE_URL}/orders`);
    const data = await result.json();
    res.json(data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des commandes: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur de service', error: error.message });
  }
});

// --- Service paiement (gRPC) ---
app.post('/payments', (req, res) => {
  const { orderId, amount } = req.body;
  
  if (!paymentClient) {
    console.error('Client gRPC non initialisé');
    return res.status(503).json({
      success: false,
      message: 'Service de paiement temporairement indisponible'
    });
  }
  
  // Ajouter un timeout pour éviter de bloquer indéfiniment
  const timeoutId = setTimeout(() => {
    console.error('Timeout lors de la requête de paiement');
    res.status(504).json({
      success: false,
      message: 'Timeout lors du traitement du paiement'
    });
  }, 10000);
  
  // Notez que le nom de la méthode dans le nouveau service est 'pay' (minuscule) au lieu de 'Pay'
  paymentClient.pay({ orderId, amount }, (error, response) => {
    clearTimeout(timeoutId);
    
    if (error) {
      console.error(`Erreur gRPC: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du paiement',
        error: error.message
      });
    }
    
    res.json({
      success: true,
      message: 'Paiement traité avec succès',
      status: response.status
    });
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway pour architecture microservices',
    endpoints: {
      users: '/users/register, /users/login',
      products: '/products, /products/:id',
      orders: '/orders',
      payments: '/payments'
    }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(500).json({
    success: false,
    message: 'Une erreur interne est survenue',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Démarrer le serveur API Gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`API Gateway démarré sur le port ${PORT}`);
  await initKafka().catch(err => console.error(`Erreur Kafka à l'initialisation: ${err.message}`));
});
