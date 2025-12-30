pipeline {
    agent any
    
    // Skip the default checkout to avoid "Git installation does not exist" errors
    options {
        skipDefaultCheckout()
    }
    
    environment {
        DOCKER_HUB_REPO = 'hamdiabdallah'
        // Using Jenkins credentials for security
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Cleaning workspace and cloning...'
                deleteDir()
                sh 'git clone https://github.com/Hamdiabdall/projet-microservices.git .'
            }
        }
        
        stage('Login to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    }
                }
            }
        }
        
        stage('Build and Push Services') {
            stages {
                stage('API Gateway') {
                    steps {
                        dir('api-gateway') {
                            script {
                                sh "docker build -t ${DOCKER_HUB_REPO}/api-gateway:${env.BUILD_NUMBER} ."
                                echo "Scanning API Gateway for vulnerabilities..."
                                sh "trivy image --exit-code 0 --no-progress --severity HIGH,CRITICAL ${DOCKER_HUB_REPO}/api-gateway:${env.BUILD_NUMBER}"
                                sh "docker tag ${DOCKER_HUB_REPO}/api-gateway:${env.BUILD_NUMBER} ${DOCKER_HUB_REPO}/api-gateway:latest"
                                sh "docker push ${DOCKER_HUB_REPO}/api-gateway:${env.BUILD_NUMBER}"
                                sh "docker push ${DOCKER_HUB_REPO}/api-gateway:latest"
                            }
                        }
                    }
                }
                
                stage('User Service') {
                    steps {
                        dir('user-service') {
                            script {
                                sh "docker build -t ${DOCKER_HUB_REPO}/user-service:${env.BUILD_NUMBER} ."
                                echo "Scanning User Service for vulnerabilities..."
                                sh "trivy image --exit-code 0 --no-progress --severity HIGH,CRITICAL ${DOCKER_HUB_REPO}/user-service:${env.BUILD_NUMBER}"
                                sh "docker tag ${DOCKER_HUB_REPO}/user-service:${env.BUILD_NUMBER} ${DOCKER_HUB_REPO}/user-service:latest"
                                sh "docker push ${DOCKER_HUB_REPO}/user-service:${env.BUILD_NUMBER}"
                                sh "docker push ${DOCKER_HUB_REPO}/user-service:latest"
                            }
                        }
                    }
                }
                
                stage('Product Service') {
                    steps {
                        dir('product-service') {
                            script {
                                sh "docker build -t ${DOCKER_HUB_REPO}/product-service:${env.BUILD_NUMBER} ."
                                echo "Scanning Product Service for vulnerabilities..."
                                sh "trivy image --exit-code 0 --no-progress --severity HIGH,CRITICAL ${DOCKER_HUB_REPO}/product-service:${env.BUILD_NUMBER}"
                                sh "docker tag ${DOCKER_HUB_REPO}/product-service:${env.BUILD_NUMBER} ${DOCKER_HUB_REPO}/product-service:latest"
                                sh "docker push ${DOCKER_HUB_REPO}/product-service:${env.BUILD_NUMBER}"
                                sh "docker push ${DOCKER_HUB_REPO}/product-service:latest"
                            }
                        }
                    }
                }
                
                stage('Order Service') {
                    steps {
                        dir('order-service') {
                            script {
                                sh "docker build -t ${DOCKER_HUB_REPO}/order-service:${env.BUILD_NUMBER} ."
                                echo "Scanning Order Service for vulnerabilities..."
                                sh "trivy image --exit-code 0 --no-progress --severity HIGH,CRITICAL ${DOCKER_HUB_REPO}/order-service:${env.BUILD_NUMBER}"
                                sh "docker tag ${DOCKER_HUB_REPO}/order-service:${env.BUILD_NUMBER} ${DOCKER_HUB_REPO}/order-service:latest"
                                sh "docker push ${DOCKER_HUB_REPO}/order-service:${env.BUILD_NUMBER}"
                                sh "docker push ${DOCKER_HUB_REPO}/order-service:latest"
                            }
                        }
                    }
                }
                
                stage('Payment Service') {
                    steps {
                        dir('payment-service') {
                            script {
                                sh "docker build -t ${DOCKER_HUB_REPO}/payment-service:${env.BUILD_NUMBER} ."
                                echo "Scanning Payment Service for vulnerabilities..."
                                sh "trivy image --exit-code 0 --no-progress --severity HIGH,CRITICAL ${DOCKER_HUB_REPO}/payment-service:${env.BUILD_NUMBER}"
                                sh "docker tag ${DOCKER_HUB_REPO}/payment-service:${env.BUILD_NUMBER} ${DOCKER_HUB_REPO}/payment-service:latest"
                                sh "docker push ${DOCKER_HUB_REPO}/payment-service:${env.BUILD_NUMBER}"
                                sh "docker push ${DOCKER_HUB_REPO}/payment-service:latest"
                            }
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo 'Pipeline completed'
                try {
                    sh 'docker system prune -f'
                    sh 'docker logout'
                } catch (Exception e) {
                    echo 'Failed to cleanup docker: ' + e.message
                }
            }
        }
        success {
            echo 'Build and Push successful!'
        }
        failure {
            echo 'Build failed.'
        }
    }
}