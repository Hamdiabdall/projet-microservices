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
