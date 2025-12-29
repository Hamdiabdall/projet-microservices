pipeline {
    agent any
    
    environment {
        DOCKER_HUB_REPO = 'hamdiabdallah'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds'
        GIT_REPO = 'https://github.com/Hamdiabdall/projet-microservices.git'
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Cloning repository..."
                    git branch: 'main',
                        url: "${GIT_REPO}"
                }
            }
        }
        
        stage('Install Trivy') {
            steps {
                script {
                    echo "Installing Trivy..."
                    sh '''
                        # Vérifier si Trivy est déjà installé
                        if ! command -v trivy &> /dev/null; then
                            echo "Trivy not found, installing..."
                            apt-get update -y
                            apt-get install -y wget apt-transport-https gnupg lsb-release
                            wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -
                            echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee -a /etc/apt/sources.list.d/trivy.list
                            apt-get update -y
                            apt-get install -y trivy
                        else
                            echo "Trivy is already installed"
                            trivy --version
                        fi
                    '''
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    def services = ['api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service']
                    
                    services.each { service ->
                        echo "=========================================="
                        echo "Building ${service}..."
                        echo "=========================================="
                        
                        dir("${service}") {
                            sh """
                                docker build -t ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG} .
                                docker tag ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG} ${DOCKER_HUB_REPO}/${service}:latest
                            """
                        }
                        
                        echo "✓ ${service} built successfully"
                    }
                }
            }
        }
        
        stage('Run Trivy Vulnerability Scan') {
            steps {
                script {
                    def services = ['api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service']
                    def scanFailed = false
                    
                    services.each { service ->
                        echo "=========================================="
                        echo "Scanning ${service} for vulnerabilities..."
                        echo "=========================================="
                        
                        try {
                            sh """
                                trivy image \
                                    --severity HIGH,CRITICAL \
                                    --exit-code 1 \
                                    --no-progress \
                                    ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG}
                            """
                            echo "✓ ${service} scan passed"
                        } catch (Exception e) {
                            echo "⚠ WARNING: ${service} has HIGH or CRITICAL vulnerabilities"
                            scanFailed = true
                            
                            // Scanner à nouveau sans exit-code pour voir les détails
                            sh """
                                trivy image \
                                    --severity HIGH,CRITICAL \
                                    --no-progress \
                                    ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG} || true
                            """
                        }
                    }
                    
                    if (scanFailed) {
                        echo "⚠ Some images have vulnerabilities, but continuing..."
                        // Décommentez la ligne suivante pour échouer le build en cas de vulnérabilités
                        // error("Build failed due to security vulnerabilities")
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "=========================================="
                    echo "Pushing images to Docker Hub..."
                    echo "=========================================="
                    
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDENTIALS_ID}") {
                        def services = ['api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service']
                        
                        services.each { service ->
                            echo "Pushing ${service}:${IMAGE_TAG} and ${service}:latest..."
                            
                            sh """
                                docker push ${DOCKER_HUB_REPO}/${service}:${IMAGE_TAG}
                                docker push ${DOCKER_HUB_REPO}/${service}:latest
                            """
                            
                            echo "✓ ${service} pushed successfully"
                        }
                    }
                }
            }
        }
        
        stage('Update Helm Values') {
            steps {
                script {
                    echo "=========================================="
                    echo "Updating Helm values with new image tag..."
                    echo "=========================================="
                    
                    sh """
                        # Mettre à jour le tag d'image dans values.yaml
                        sed -i 's|tag:.*|tag: ${IMAGE_TAG}|g' helm/microservices/values.yaml
                        
                        # Afficher les modifications
                        echo "Updated values.yaml:"
                        grep "tag:" helm/microservices/values.yaml
                    """
                    
                    // Optionnel : Commit et push si vous utilisez GitOps
                    /*
                    sh """
                        git config user.email "jenkins@example.com"
                        git config user.name "Jenkins CI"
                        git add helm/microservices/values.yaml
                        git commit -m "Update image tag to ${IMAGE_TAG}" || true
                        git push origin main || true
                    """
                    */
                }
            }
        }
    }
    
    post {
        success {
            echo "=========================================="
            echo "✓ Pipeline completed successfully!"
            echo "=========================================="
            echo "Docker Hub Repository: ${DOCKER_HUB_REPO}"
            echo "Image Tag: ${IMAGE_TAG}"
            echo "=========================================="
        }
        
        failure {
            echo "=========================================="
            echo "✗ Pipeline failed!"
            echo "=========================================="
        }
        
        always {
            echo "Cleaning up Docker resources..."
            sh '''
                # Nettoyer les images non utilisées
                docker system prune -f || true
                
                # Supprimer les images de build (optionnel)
                # docker rmi $(docker images -q ${DOCKER_HUB_REPO}/*:${IMAGE_TAG}) || true
            '''
        }
    }
}