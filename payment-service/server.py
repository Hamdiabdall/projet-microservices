import grpc
from concurrent import futures
import payment_pb2
import payment_pb2_grpc
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)

class PaymentService(payment_pb2_grpc.PaymentServiceServicer):
    def Pay(self, request, context):
        logging.info(f"Paiement reçu: {request.amount} pour la commande {request.orderId}")
        return payment_pb2.PaymentResponse(status="SUCCESS")

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    payment_pb2_grpc.add_PaymentServiceServicer_to_server(PaymentService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    logging.info("Serveur de paiement démarré sur le port 50051")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
