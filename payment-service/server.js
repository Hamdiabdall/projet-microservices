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

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', () => {
  console.log('Arrêt du serveur...');
  server.tryShutdown(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
}); 