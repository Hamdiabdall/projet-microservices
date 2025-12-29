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
                    extensions: [[$class: 'CloneOption', depth: 1, noTags: false, reference: '', shallow: true]],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Hamdiabdall/projet-microservices.git',
                        credentialsId: 'github-credentials' // Add your GitHub credentials ID here
                    ]]
                ])
            }
        }

        stage('Install Trivy') {
            steps {
                script {
                    // Fixed URL with no extra spaces
                    sh '''
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                        trivy --version
                    '''
                }
            }
        }
        
        // Rest of the pipeline stages remain the same
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
                        sh "trivy image --severity HIGH,CRITICAL --exit-code 1 ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG} || echo 'Scan completed with vulnerabilities. Continuing pipeline.'"
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // Fixed registry URL with no extra spaces
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