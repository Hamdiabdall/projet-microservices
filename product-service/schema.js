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
