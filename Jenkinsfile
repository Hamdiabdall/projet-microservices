pipeline {
    agent any
    
    environment {
        DOCKER_HUB_REPO = 'hamdiabdallah'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                script {
                    // Clean workspace first
                    cleanWs()
                    
                    // Explicit checkout
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions: [[$class: 'CloneOption', timeout: 30, depth: 1]],
                        userRemoteConfigs: [[
                            url: 'https://github.com/Hamdiabdall/projet-microservices.git'
                        ]]
                    ])
                    
                    // Verify checkout
                    sh 'ls -la'
                    sh 'pwd'
                }
            }
        }
        
        stage('Verify Structure') {
            steps {
                sh '''
                    echo "Checking project structure..."
                    ls -la
                    
                    echo "--- Service Directories ---"
                    [ -d "api-gateway" ] && echo "✓ api-gateway exists" || echo "✗ api-gateway missing"
                    [ -d "user-service" ] && echo "✓ user-service exists" || echo "✗ user-service missing"
                    [ -d "product-service" ] && echo "✓ product-service exists" || echo "✗ product-service missing"
                    [ -d "order-service" ] && echo "✓ order-service exists" || echo "✗ order-service missing"
                    [ -d "payment-service" ] && echo "✓ payment-service exists" || echo "✗ payment-service missing"
                    
                    echo "--- Dockerfiles ---"
                    [ -f "api-gateway/Dockerfile" ] && echo "✓ api-gateway/Dockerfile exists" || echo "✗ api-gateway/Dockerfile missing"
                    [ -f "user-service/Dockerfile" ] && echo "✓ user-service/Dockerfile exists" || echo "✗ user-service/Dockerfile missing"
                    [ -f "product-service/Dockerfile" ] && echo "✓ product-service/Dockerfile exists" || echo "✗ product-service/Dockerfile missing"
                    [ -f "order-service/Dockerfile" ] && echo "✓ order-service/Dockerfile exists" || echo "✗ order-service/Dockerfile missing"
                    [ -f "payment-service/Dockerfile" ] && echo "✓ payment-service/Dockerfile exists" || echo "✗ payment-service/Dockerfile missing"
                '''
            }
        }
        
        stage('Build Images') {
            steps {
                script {
                    // Build API Gateway
                    dir('api-gateway') {
                        sh "docker build -t ${env.DOCKER_HUB_REPO}/api-gateway:${env.IMAGE_TAG} ."
                        sh "docker tag ${env.DOCKER_HUB_REPO}/api-gateway:${env.IMAGE_TAG} ${env.DOCKER_HUB_REPO}/api-gateway:latest"
                    }
                    
                    // Build User Service
                    dir('user-service') {
                        sh "docker build -t ${env.DOCKER_HUB_REPO}/user-service:${env.IMAGE_TAG} ."
                        sh "docker tag ${env.DOCKER_HUB_REPO}/user-service:${env.IMAGE_TAG} ${env.DOCKER_HUB_REPO}/user-service:latest"
                    }
                    
                    // Build Product Service
                    dir('product-service') {
                        sh "docker build -t ${env.DOCKER_HUB_REPO}/product-service:${env.IMAGE_TAG} ."
                        sh "docker tag ${env.DOCKER_HUB_REPO}/product-service:${env.IMAGE_TAG} ${env.DOCKER_HUB_REPO}/product-service:latest"
                    }
                    
                    // Build Order Service
                    dir('order-service') {
                        sh "docker build -t ${env.DOCKER_HUB_REPO}/order-service:${env.IMAGE_TAG} ."
                        sh "docker tag ${env.DOCKER_HUB_REPO}/order-service:${env.IMAGE_TAG} ${env.DOCKER_HUB_REPO}/order-service:latest"
                    }
                    
                    // Build Payment Service
                    dir('payment-service') {
                        sh "docker build -t ${env.DOCKER_HUB_REPO}/payment-service:${env.IMAGE_TAG} ."
                        sh "docker tag ${env.DOCKER_HUB_REPO}/payment-service:${env.IMAGE_TAG} ${env.DOCKER_HUB_REPO}/payment-service:latest"
                    }
                    
                    // List all built images
                    sh 'docker images | grep hamdiabdallah'
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    // Login to Docker Hub (add your credentials in Jenkins)
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-hub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                        """
                    }
                    
                    // Push all images
                    sh """
                        docker push ${env.DOCKER_HUB_REPO}/api-gateway:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/api-gateway:latest
                        
                        docker push ${env.DOCKER_HUB_REPO}/user-service:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/user-service:latest
                        
                        docker push ${env.DOCKER_HUB_REPO}/product-service:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/product-service:latest
                        
                        docker push ${env.DOCKER_HUB_REPO}/order-service:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/order-service:latest
                        
                        docker push ${env.DOCKER_HUB_REPO}/payment-service:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/payment-service:latest
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        always {
            echo '🧹 Cleaning up...'
            sh 'docker system prune -f || true'
        }
    }
}