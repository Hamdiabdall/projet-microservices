pipeline {
    agent any
    environment {
        // CHANGE THIS: Your Docker Hub username
        DOCKER_HUB_REPO = 'hamdiabdallah' 
        // Image Tag: Build number or 'latest'
        IMAGE_TAG = "${env.BUILD_NUMBER}" 
        // Credentials ID defined in Jenkins (Manage Credentials)
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds' 
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
                            // Tag as latest for easy pulling in dev
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
                        // Fail the build if HIGH or CRITICAL vulnerabilities are found
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
            sh 'docker system prune -f'
        }
    }
}