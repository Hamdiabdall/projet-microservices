pipeline {
    agent any
    
    environment {
        DOCKER_HUB_REPO = 'hamdiabdallah'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    extensions: [[$class: 'CloneOption', timeout: 30, depth: 1]],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Hamdiabdall/projet-microservices.git'
                    ]]
                ])
                sh 'ls -la'
            }
        }
        
        stage('Build API Gateway') {
            steps {
                dir('api-gateway') {
                    sh "docker build -t ${env.DOCKER_HUB_REPO}/api-gateway:${env.IMAGE_TAG} ."
                }
            }
        }
        
        stage('Build User Service') {
            steps {
                dir('user-service') {
                    sh "docker build -t ${env.DOCKER_HUB_REPO}/user-service:${env.IMAGE_TAG} ."
                }
            }
        }
        
        stage('Build Product Service') {
            steps {
                dir('product-service') {
                    sh "docker build -t ${env.DOCKER_HUB_REPO}/product-service:${env.IMAGE_TAG} ."
                }
            }
        }
        
        stage('Build Order Service') {
            steps {
                dir('order-service') {
                    sh "docker build -t ${env.DOCKER_HUB_REPO}/order-service:${env.IMAGE_TAG} ."
                }
            }
        }
        
        stage('Build Payment Service') {
            steps {
                dir('payment-service') {
                    sh "docker build -t ${env.DOCKER_HUB_REPO}/payment-service:${env.IMAGE_TAG} ."
                }
            }
        }
        
        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${env.DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                        docker push ${env.DOCKER_HUB_REPO}/api-gateway:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/user-service:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/product-service:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/order-service:${env.IMAGE_TAG}
                        docker push ${env.DOCKER_HUB_REPO}/payment-service:${env.IMAGE_TAG}
                    """
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up...'
            sh 'docker system prune -f || true'
        }
    }
}