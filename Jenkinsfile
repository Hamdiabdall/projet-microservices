pipeline {
    agent any
    
    environment {
        DOCKER_HUB_REPO = 'hamdiabdallah'
        // Using Jenkins credentials for security
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
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
            parallel {
                stage('API Gateway') {
                    steps {
                        dir('api-gateway') {
                            script {
                                sh "docker build -t ${DOCKER_HUB_REPO}/api-gateway:${env.BUILD_NUMBER} ."
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
            echo 'Pipeline completed'
            sh 'docker system prune -f'
            sh 'docker logout'
        }
        success {
            echo 'Build and Push successful!'
        }
        failure {
            echo 'Build failed.'
        }
    }
}