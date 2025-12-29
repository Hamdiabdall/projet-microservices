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
                git branch: 'master', url: 'https://github.com/Hamdiabdall/projet-microservices.git'
                
                sh '''
                    echo "=== Workspace Contents ==="
                    ls -la
                    echo ""
                    echo "=== Checking Service Directories ==="
                    [ -d "api-gateway" ] && echo "✅ api-gateway exists" || echo "❌ api-gateway missing"
                    [ -d "user-service" ] && echo "✅ user-service exists" || echo "❌ user-service missing"
                    [ -d "product-service" ] && echo "✅ product-service exists" || echo "❌ product-service missing"
                    [ -d "order-service" ] && echo "✅ order-service exists" || echo "❌ order-service missing"
                    [ -d "payment-service" ] && echo "✅ payment-service exists" || echo "❌ payment-service missing"
                '''
            }
        }
        
        stage('Test Docker') {
            steps {
                sh '''
                    echo "=== Testing Docker Access ==="
                    docker --version
                    echo ""
                    
                    # Test Docker build with simple image
                    echo "FROM alpine:latest" > test.Dockerfile
                    echo 'RUN echo "Test build successful"' >> test.Dockerfile
                    echo 'CMD ["echo", "✅ Docker is working!"]' >> test.Dockerfile
                    
                    if docker build -t test-image -f test.Dockerfile .; then
                        echo "✅ Docker build test passed"
                        docker run --rm test-image
                        docker rmi test-image
                    else
                        echo "❌ Docker build test failed"
                    fi
                    
                    rm -f test.Dockerfile
                    echo ""
                '''
            }
        }
        
        stage('Build API Gateway') {
            steps {
                dir('api-gateway') {
                    sh '''
                        echo "Building API Gateway..."
                        docker build -t ${DOCKER_HUB_REPO}/api-gateway:${IMAGE_TAG} .
                        docker tag ${DOCKER_HUB_REPO}/api-gateway:${IMAGE_TAG} ${DOCKER_HUB_REPO}/api-gateway:latest
                        echo "✅ API Gateway built successfully"
                    '''
                }
            }
        }
        
        stage('Build User Service') {
            steps {
                dir('user-service') {
                    sh '''
                        echo "Building User Service..."
                        docker build -t ${DOCKER_HUB_REPO}/user-service:${IMAGE_TAG} .
                        docker tag ${DOCKER_HUB_REPO}/user-service:${IMAGE_TAG} ${DOCKER_HUB_REPO}/user-service:latest
                        echo "✅ User Service built successfully"
                    '''
                }
            }
        }
        
        stage('Build Product Service') {
            steps {
                dir('product-service') {
                    sh '''
                        echo "Building Product Service..."
                        docker build -t ${DOCKER_HUB_REPO}/product-service:${IMAGE_TAG} .
                        docker tag ${DOCKER_HUB_REPO}/product-service:${IMAGE_TAG} ${DOCKER_HUB_REPO}/product-service:latest
                        echo "✅ Product Service built successfully"
                    '''
                }
            }
        }
        
        stage('Build Order Service') {
            steps {
                dir('order-service') {
                    sh '''
                        echo "Building Order Service..."
                        docker build -t ${DOCKER_HUB_REPO}/order-service:${IMAGE_TAG} .
                        docker tag ${DOCKER_HUB_REPO}/order-service:${IMAGE_TAG} ${DOCKER_HUB_REPO}/order-service:latest
                        echo "✅ Order Service built successfully"
                    '''
                }
            }
        }
        
        stage('Build Payment Service') {
            steps {
                dir('payment-service') {
                    sh '''
                        echo "Building Payment Service..."
                        docker build -t ${DOCKER_HUB_REPO}/payment-service:${IMAGE_TAG} .
                        docker tag ${DOCKER_HUB_REPO}/payment-service:${IMAGE_TAG} ${DOCKER_HUB_REPO}/payment-service:latest
                        echo "✅ Payment Service built successfully"
                    '''
                }
            }
        }
        
        stage('List Built Images') {
            steps {
                sh '''
                    echo "=== All Built Images ==="
                    docker images | grep hamdiabdallah || echo "No images found"
                    echo ""
                    
                    echo "=== Image Sizes ==="
                    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(hamdiabdallah|REPOSITORY)" || echo "Cannot list images"
                '''
            }
        }
        
        stage('Push to Docker Hub') {
            when {
                expression { params.PUSH_TO_DOCKER_HUB == true }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${env.DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "Logging into Docker Hub..."
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        
                        echo "Pushing API Gateway..."
                        docker push ${DOCKER_HUB_REPO}/api-gateway:${IMAGE_TAG}
                        docker push ${DOCKER_HUB_REPO}/api-gateway:latest
                        
                        echo "Pushing User Service..."
                        docker push ${DOCKER_HUB_REPO}/user-service:${IMAGE_TAG}
                        docker push ${DOCKER_HUB_REPO}/user-service:latest
                        
                        echo "Pushing Product Service..."
                        docker push ${DOCKER_HUB_REPO}/product-service:${IMAGE_TAG}
                        docker push ${DOCKER_HUB_REPO}/product-service:latest
                        
                        echo "Pushing Order Service..."
                        docker push ${DOCKER_HUB_REPO}/order-service:${IMAGE_TAG}
                        docker push ${DOCKER_HUB_REPO}/order-service:latest
                        
                        echo "Pushing Payment Service..."
                        docker push ${DOCKER_HUB_REPO}/payment-service:${IMAGE_TAG}
                        docker push ${DOCKER_HUB_REPO}/payment-service:latest
                        
                        echo "✅ All images pushed to Docker Hub"
                    '''
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                expression { params.DEPLOY_TO_K8S == true }
            }
            steps {
                script {
                    // Check if k8s directory exists
                    if (fileExists('k8s')) {
                        dir('k8s') {
                            sh '''
                                echo "=== Applying Kubernetes Manifests ==="
                                # Apply namespace first
                                [ -f "00-namespace.yaml" ] && kubectl apply -f 00-namespace.yaml || echo "No namespace file"
                                
                                # Apply other manifests
                                for file in *.yaml; do
                                    if [ "$file" != "00-namespace.yaml" ]; then
                                        echo "Applying $file..."
                                        kubectl apply -f $file || echo "Failed to apply $file"
                                    fi
                                done
                                
                                echo ""
                                echo "=== Checking Deployments ==="
                                kubectl get pods,svc,deploy -n microservices-ns || echo "Cannot check deployments"
                            '''
                        }
                    } else {
                        echo "⚠️  Kubernetes manifests directory not found"
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '🎉 Pipeline completed successfully!'
            sh '''
                echo "=== Final Image List ==="
                docker images | grep hamdiabdallah | head -10 || echo "No images"
            '''
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        always {
            echo '🧹 Cleaning up workspace...'
            sh '''
                echo "Removing test images..."
                docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true
                
                echo "Cleaning Docker system..."
                docker system prune -f || true
                
                echo "Disk usage:"
                df -h .
            '''
            
            // Archive artifacts
            archiveArtifacts artifacts: '**/Dockerfile', allowEmptyArchive: true
        }
    }
    
    parameters {
        booleanParam(
            name: 'PUSH_TO_DOCKER_HUB',
            defaultValue: false,
            description: 'Push Docker images to Docker Hub'
        )
        booleanParam(
            name: 'DEPLOY_TO_K8S',
            defaultValue: false,
            description: 'Deploy to Kubernetes cluster'
        )
        choice(
            name: 'BUILD_TYPE',
            choices: ['all', 'api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service'],
            description: 'Select which services to build'
        )
    }
}