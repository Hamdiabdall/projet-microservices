const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

// Configuration du serveur Apollo
const server = new ApolloServer({ 
  typeDefs, 
  resolvers,
  formatError: (err) => {
    console.error('Apollo Server Error:', err);
    return err;
  },
  context: ({ req }) => {
    return { req };
  }
});

// Démarrage du serveur avec gestion des erreurs
const PORT = process.env.PORT || 3002;

server.listen(PORT).then(({ url }) => {
  console.log(`Service produit démarré sur ${url}`);
}).catch(err => {
  console.error('Erreur lors du démarrage du serveur GraphQL:', err);
  process.exit(1);
});
