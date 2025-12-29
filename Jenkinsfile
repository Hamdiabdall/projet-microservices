pipeline {
    agent any
    
    environment {
        DOCKER_HUB_REPO = 'hamdiabdallah'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/Hamdiabdall/projet-microservices.git'
                sh 'ls -la'
            }
        }
        
        stage('Build All Services') {
            steps {
                sh '''
                    echo "Building all microservices..."
                    
                    # API Gateway
                    cd api-gateway && docker build -t ${DOCKER_HUB_REPO}/api-gateway:${IMAGE_TAG} . && cd ..
                    
                    # User Service
                    cd user-service && docker build -t ${DOCKER_HUB_REPO}/user-service:${IMAGE_TAG} . && cd ..
                    
                    # Product Service
                    cd product-service && docker build -t ${DOCKER_HUB_REPO}/product-service:${IMAGE_TAG} . && cd ..
                    
                    # Order Service
                    cd order-service && docker build -t ${DOCKER_HUB_REPO}/order-service:${IMAGE_TAG} . && cd ..
                    
                    # Payment Service
                    cd payment-service && docker build -t ${DOCKER_HUB_REPO}/payment-service:${IMAGE_TAG} . && cd ..
                    
                    echo "All images built successfully!"
                '''
            }
        }
        
        stage('Verify Builds') {
            steps {
                sh '''
                    echo "Built images:"
                    docker images | grep hamdiabdallah
                '''
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed'
        }
    }
}