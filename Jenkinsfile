pipeline {
    agent any
    
    environment {
        DOCKER_HUB_REPO = 'hamdiabdallah'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Setup Workspace') {
            steps {
                echo 'Setting up workspace...'
                sh '''
                    echo "Current directory: $(pwd)"
                    echo "Jenkins user: $(whoami)"
                    echo "Git version: $(git --version 2>/dev/null || echo 'Git not installed')"
                    echo "Docker version: $(docker --version 2>/dev/null || echo 'Docker not available')"
                    
                    # Clean workspace
                    rm -rf *
                '''
            }
        }
        
        stage('Clone Repository') {
            steps {
                sh '''
                    echo "Cloning repository..."
                    git clone https://github.com/Hamdiabdall/projet-microservices.git .
                    
                    echo "Repository contents:"
                    ls -la
                    
                    echo "Checking service directories:"
                    ls -d */ | grep service || true
                '''
            }
        }
        
        stage('Build API Gateway') {
            steps {
                dir('api-gateway') {
                    sh '''
                        echo "Building API Gateway..."
                        docker build -t hamdiabdallah/api-gateway:${BUILD_NUMBER} .
                        docker tag hamdiabdallah/api-gateway:${BUILD_NUMBER} hamdiabdallah/api-gateway:latest
                        echo "✅ API Gateway built"
                    '''
                }
            }
        }
        
        stage('Build User Service') {
            steps {
                dir('user-service') {
                    sh '''
                        echo "Building User Service..."
                        docker build -t hamdiabdallah/user-service:${BUILD_NUMBER} .
                        docker tag hamdiabdallah/user-service:${BUILD_NUMBER} hamdiabdallah/user-service:latest
                        echo "✅ User Service built"
                    '''
                }
            }
        }
        
        stage('Build Product Service') {
            steps {
                dir('product-service') {
                    sh '''
                        echo "Building Product Service..."
                        docker build -t hamdiabdallah/product-service:${BUILD_NUMBER} .
                        docker tag hamdiabdallah/product-service:${BUILD_NUMBER} hamdiabdallah/product-service:latest
                        echo "✅ Product Service built"
                    '''
                }
            }
        }
        
        stage('Build Order Service') {
            steps {
                dir('order-service') {
                    sh '''
                        echo "Building Order Service..."
                        docker build -t hamdiabdallah/order-service:${BUILD_NUMBER} .
                        docker tag hamdiabdallah/order-service:${BUILD_NUMBER} hamdiabdallah/order-service:latest
                        echo "✅ Order Service built"
                    '''
                }
            }
        }
        
        stage('Build Payment Service') {
            steps {
                dir('payment-service') {
                    sh '''
                        echo "Building Payment Service..."
                        docker build -t hamdiabdallah/payment-service:${BUILD_NUMBER} .
                        docker tag hamdiabdallah/payment-service:${BUILD_NUMBER} hamdiabdallah/payment-service:latest
                        echo "✅ Payment Service built"
                    '''
                }
            }
        }
        
        stage('List Images') {
            steps {
                sh '''
                    echo "=== Built Images ==="
                    docker images | grep hamdiabdallah || echo "No images found"
                '''
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed'
            sh 'docker system prune -f 2>/dev/null || true'
        }
    }
}