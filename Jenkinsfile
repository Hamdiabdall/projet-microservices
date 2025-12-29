pipeline {
    agent any
    environment {
        
        DOCKER_HUB_REPO = 'hamdiabdallah' 
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds'
    }
    stages {

        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }
        

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Trivy') {
            steps {
                script {
                    
                    sh '''
                        apt-get update -y
                        apt-get install -y wget apt-transport-https gnupg lsb-release
                        wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -
                        echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee -a /etc/apt/sources.list.d/trivy.list
                        apt-get update -y
                        apt-get install -y trivy
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def services = ['api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service']
                    services.each { service ->
                        echo "Building ${service}..."
                        dir("${service}") {
                            sh "docker build -t ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG} ."
                            sh "docker tag ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG} ${DOCKER_HUB_REPO}/${service}:latest"
                        }
                    }
                }
            }
        }

        stage('Run Trivy Vulnerability Scan') {
            steps {
                script {
                    def services = ['api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service']
                    services.each { service ->
                        echo "Scanning ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG}..."
                        
                        sh "trivy image --severity HIGH,CRITICAL --exit-code 1 ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG} || true"
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    docker.withRegistry("https://index.docker.io/v1/", "${DOCKER_CREDENTIALS_ID}") {
                        def services = ['api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service']
                        services.each { service ->
                            echo "Pushing ${service}..."
                            sh "docker push ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG}"
                            sh "docker push ${DOCKER_HUB_REPO}/${service}:latest"
                        }
                    }
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