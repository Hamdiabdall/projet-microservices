pipeline {
    agent any
    
    stages {
        stage('Test') {
            steps {
                sh '''
                    echo "Testing Docker access..."
                    whoami
                    docker --version
                    docker ps
                    
                    # Create a test Dockerfile
                    echo "FROM alpine:latest" > test.Dockerfile
                    echo 'CMD ["echo", "Hello from Docker!"]' >> test.Dockerfile
                    
                    # Build and run test image
                    docker build -t test-image -f test.Dockerfile .
                    docker run --rm test-image
                    
                    # Clean up
                    docker rmi test-image
                    rm test.Dockerfile
                    
                    echo "✅ Docker is working!"
                '''
            }
        }
    }
}