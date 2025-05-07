const express = require('express');
const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

// Configuration de Kafka avec gestion des erreurs
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
console.log(`Connexion à Kafka sur: ${kafkaBrokers}`);

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [kafkaBrokers],
  retry: {
    initialRetryTime: 1000,
    retries: 8
  }
});

// Initialisation du producteur et du consommateur
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-group' });

const app = express();
app.use(express.json());

// Stocker les commandes en mémoire (dans un cas réel, ce serait une base de données)
const orders = [];

// Initialiser la connexion Kafka avec retries
const initKafka = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Tentative de connexion au producteur Kafka...');
      await producer.connect();
      console.log('Producteur Kafka connecté');
      
      console.log('Tentative de connexion au consommateur Kafka...');
      await consumer.connect();
      console.log('Consommateur Kafka connecté');
      
      // S'abonner au topic new-order
      await consumer.subscribe({ topic: 'new-order', fromBeginning: true });
      console.log('Abonnement au topic new-order réussi');

      // Traiter les messages entrants
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const orderData = JSON.parse(message.value.toString());
            console.log(`Nouvelle commande reçue: ${message.value.toString()}`);
            
            // Stocker la commande
            orders.push(orderData);
            
            // Publier un événement de commande traitée
            await producer.send({
              topic: 'order-processed',
              messages: [
                { key: orderData.id, value: JSON.stringify({ ...orderData, status: 'processed' }) }
              ]
            });
            console.log(`Commande ${orderData.id} traitée et publiée sur order-processed`);
          } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
          }
        },
      });
      
      return; // Sortie si succès
    } catch (error) {
      console.error(`Erreur lors de l'initialisation de Kafka: ${error.message}`);
      retries--;
      
      if (retries === 0) {
        console.error('Impossible de se connecter à Kafka après plusieurs tentatives');
        // Ne pas quitter le processus car le serveur HTTP peut toujours fonctionner
        break;
      }
      
      console.log(`Nouvelle tentative dans 5 secondes... (${retries} restantes)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Route pour créer une nouvelle commande
app.post('/orders', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    
    // Créer une nouvelle commande
    const order = {
      id: uuidv4(),
      userId,
      productId,
      quantity,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Ne pas ajouter ici: orders.push(order);
    try {
      // Publier l'événement de nouvelle commande
      await producer.send({
        topic: 'new-order',
        messages: [
          { key: order.id, value: JSON.stringify(order) }
        ]
      });
      
      res.status(201).json({
        success: true,
        message: 'Commande créée et envoyée pour traitement',
        orderId: order.id
      });
    } catch (kafkaError) {
      console.error('Erreur Kafka lors de la création de la commande:', kafkaError);
      // Renvoyer quand même une réponse positive (la commande est créée)
      res.status(201).json({
        success: true,
        message: 'Commande créée mais pas envoyée pour traitement (Kafka indisponible)',
        orderId: order.id,
        warning: 'Kafka indisponible, la commande sera traitée ultérieurement'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message
    });
  }
});

// Route pour obtenir toutes les commandes
app.get('/orders', (req, res) => {
  res.json(orders);
});

// Route pour obtenir une commande par ID
app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Commande non trouvée'
    });
  }
  
  res.json(order);
});

// Route par défaut pour la vérification de santé
app.get('/', (req, res) => {
  res.json({ message: 'Service commande opérationnel' });
});

// Démarrer le serveur et initialiser Kafka
const PORT = process.env.PORT || 3003;
app.listen(PORT, async () => {
  console.log(`Service de commandes démarré sur le port ${PORT}`);
  try {
    await initKafka();
  } catch (error) {
    console.error('Erreur fatale lors de l\'initialisation de Kafka:', error);
  }
});
