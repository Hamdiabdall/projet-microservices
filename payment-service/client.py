import grpc
import payment_pb2
import payment_pb2_grpc

def run():
    # Création du canal gRPC
    with grpc.insecure_channel('localhost:50051') as channel:
        # Création du stub client
        stub = payment_pb2_grpc.PaymentServiceStub(channel)
        
        # Préparation de la requête de paiement
        payment_request = payment_pb2.PaymentRequest(
            orderId="order123",
            amount=150.75
        )
        
        # Appel de la méthode RPC
        try:
            response = stub.Pay(payment_request)
            print(f"Réponse du service de paiement: {response.status}")
        except grpc.RpcError as e:
            print(f"Erreur RPC: {e.details()}")

if __name__ == '__main__':
    run()
