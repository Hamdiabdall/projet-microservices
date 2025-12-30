# Complete Jenkins CI/CD Setup Guide

This guide covers everything from installing Jenkins in Docker to creating a fully functional CI/CD pipeline for microservices.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Install Jenkins in Docker](#install-jenkins-in-docker)
3. [Initial Jenkins Setup](#initial-jenkins-setup)
4. [Install Docker CLI in Jenkins Container](#install-docker-cli-in-jenkins-container)
5. [Create GitHub Repository](#create-github-repository)
6. [Configure Jenkins Credentials](#configure-jenkins-credentials)
7. [Create Jenkins Pipeline](#create-jenkins-pipeline)
8. [Create Jenkinsfile](#create-jenkinsfile)
9. [Manage Jenkins](#manage-jenkins)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Docker installed on your system
- Docker Hub account
- GitHub account
- Basic knowledge of Git and Docker

---

## Install Jenkins in Docker

### Step 1: Create a Docker Network
```bash
docker network create jenkins
```

### Step 2: Run Jenkins Container
```bash
docker run -d \
  --name jenkins \
  --restart=on-failure \
  --network jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

**Explanation:**
- `-d`: Run in detached mode
- `--name jenkins`: Container name
- `--restart=on-failure`: Auto-restart on failure
- `-p 8080:8080`: Jenkins web UI port
- `-p 50000:50000`: Jenkins agent port
- `-v jenkins_home:/var/jenkins_home`: Persist Jenkins data
- `-v /var/run/docker.sock:/var/run/docker.sock`: Allow Jenkins to use Docker

### Step 3: Get Initial Admin Password
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Copy this password for the next step.

---

## Initial Jenkins Setup

### Step 1: Access Jenkins Web UI
1. Open browser: `http://localhost:8080`
2. Paste the initial admin password
3. Click **Continue**

### Step 2: Install Suggested Plugins
1. Select **Install suggested plugins**
2. Wait for installation to complete

### Step 3: Create Admin User
1. Fill in the form:
   - Username: `admin`
   - Password: (choose a strong password)
   - Full name: Your name
   - Email: Your email
2. Click **Save and Continue**

### Step 4: Configure Jenkins URL
1. Keep default: `http://localhost:8080/`
2. Click **Save and Finish**
3. Click **Start using Jenkins**

---

## Install Docker CLI in Jenkins Container

Jenkins needs Docker CLI to build and push images.

### Step 1: Enter Jenkins Container as Root
```bash
docker exec -u 0 -it jenkins bash
```

### Step 2: Install Docker CLI

**For Debian/Ubuntu-based Jenkins image:**
```bash
apt-get update
apt-get install -y docker.io
```

**For Alpine-based Jenkins image:**
```bash
apk add docker-cli
```

### Step 3: Verify Installation
```bash
docker --version
```

### Step 4: Exit Container
```bash
exit
```

### Step 5: Restart Jenkins Container
```bash
docker restart jenkins
```

---

## Create GitHub Repository

### Step 1: Create New Repository
1. Go to [GitHub](https://github.com)
2. Click **New repository**
3. Repository name: `projet-microservices`
4. Choose **Public** or **Private**
5. Click **Create repository**

### Step 2: Initialize Local Repository
```bash
cd /home/hamdi/Desktop/projet-microservices
git init
git add .
git commit -m "Initial commit"
```

### Step 3: Add Remote and Push
```bash
git remote add origin https://github.com/YOUR_USERNAME/projet-microservices.git
git branch -M master
git push -u origin master
```

---

## Configure Jenkins Credentials

### Step 1: Create Docker Hub Access Token
1. Go to [Docker Hub](https://hub.docker.com)
2. Click your profile → **Account Settings**
3. Go to **Security** → **New Access Token**
4. Description: `Jenkins CI/CD`
5. Permissions: **Read, Write, Delete**
6. Click **Generate**
7. **Copy the token** (you won't see it again!)

### Step 2: Add Credentials to Jenkins
1. Go to Jenkins: `http://localhost:8080`
2. Click **Manage Jenkins** → **Credentials**
3. Click **(global)** → **Add Credentials**
4. Fill in:
   - **Kind**: Username with password
   - **Scope**: Global
   - **Username**: Your Docker Hub username
   - **Password**: Paste the access token
   - **ID**: `docker-hub-creds`
   - **Description**: Docker Hub credentials
5. Click **Create**

### Step 3: Add GitHub Credentials (Optional)
For private repositories:
1. **Manage Jenkins** → **Credentials** → **Add Credentials**
2. Fill in:
   - **Kind**: Username with password
   - **Username**: Your GitHub username
   - **Password**: GitHub Personal Access Token
   - **ID**: `github-creds`
3. Click **Create**

---

## Create Jenkins Pipeline

### Step 1: Create New Pipeline Job
1. Click **New Item**
2. Enter name: `projet-microservices-cicd`
3. Select **Pipeline**
4. Click **OK**

### Step 2: Configure Pipeline
1. **Description**: `CI/CD pipeline for microservices project`
2. Scroll to **Pipeline** section
3. **Definition**: Pipeline script from SCM
4. **SCM**: Git
5. **Repository URL**: `https://github.com/YOUR_USERNAME/projet-microservices.git`
6. **Credentials**: Select `github-creds` (if private repo)
7. **Branch Specifier**: `*/master`
8. **Script Path**: `Jenkinsfile`
9. Click **Save**

### Step 3: Disable Lightweight Checkout (Important!)
1. In pipeline configuration
2. Scroll to **Pipeline** section
3. **Uncheck** "Lightweight checkout"
4. Click **Save**

---

## Create Jenkinsfile

Create a file named `Jenkinsfile` in your project root:

```groovy
pipeline {
    agent any
    
    // Skip default checkout to avoid Git plugin issues
    options {
        skipDefaultCheckout()
    }
    
    environment {
        DOCKER_HUB_REPO = 'YOUR_DOCKERHUB_USERNAME'
        DOCKER_CREDENTIALS_ID = 'docker-hub-creds'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Cleaning workspace and cloning...'
                deleteDir()
                sh 'git clone https://github.com/YOUR_USERNAME/projet-microservices.git .'
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
```

**Important:** Replace:
- `YOUR_DOCKERHUB_USERNAME` with your Docker Hub username
- `YOUR_USERNAME` with your GitHub username

### Commit and Push Jenkinsfile
```bash
git add Jenkinsfile
git commit -m "Add Jenkinsfile for CI/CD pipeline"
git push origin master
```

---

## Manage Jenkins

### Run a Build
1. Go to your pipeline: `projet-microservices-cicd`
2. Click **Build Now**
3. Watch the build progress in **Build History**
4. Click on the build number to see logs

### View Build Logs
1. Click on build number (e.g., `#1`)
2. Click **Console Output**
3. Monitor the build process

### Configure Build Triggers

#### Poll SCM (Check for changes periodically)
1. Pipeline configuration → **Build Triggers**
2. Check **Poll SCM**
3. Schedule: `H/5 * * * *` (every 5 minutes)
4. Click **Save**

#### GitHub Webhook (Trigger on push)
1. Go to GitHub repository → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Payload URL: `http://YOUR_JENKINS_URL:8080/github-webhook/`
4. Content type: `application/json`
5. Select **Just the push event**
6. Click **Add webhook**

### Manage Plugins
1. **Manage Jenkins** → **Plugins**
2. **Available plugins** tab
3. Search and install:
   - Docker Pipeline
   - Git Plugin
   - GitHub Integration Plugin
4. Click **Install** and restart Jenkins

### Backup Jenkins
```bash
# Backup Jenkins home directory
docker run --rm \
  -v jenkins_home:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/jenkins-backup-$(date +%Y%m%d).tar.gz -C /source .
```

### Restore Jenkins
```bash
# Restore from backup
docker run --rm \
  -v jenkins_home:/target \
  -v $(pwd):/backup \
  alpine sh -c "cd /target && tar xzf /backup/jenkins-backup-YYYYMMDD.tar.gz"
```

---

## Troubleshooting

### Issue 1: "docker: not found"
**Solution:** Install Docker CLI in Jenkins container (see section above)

### Issue 2: "authentication required - access token has insufficient scopes"
**Solution:** 
1. Create new Docker Hub token with **Read, Write, Delete** permissions
2. Update Jenkins credentials with new token

### Issue 3: "fatal: not in a git directory"
**Solution:** 
- Use `skipDefaultCheckout()` and manual `git clone` in Jenkinsfile
- Disable "Lightweight checkout" in pipeline configuration

### Issue 4: Build fails with "400 Bad Request"
**Solution:** 
- Use sequential builds instead of parallel (as shown in Jenkinsfile above)
- Reduces resource exhaustion

### Issue 5: Permission denied on Docker socket
**Solution:**
```bash
# Add Jenkins user to docker group
docker exec -u 0 jenkins usermod -aG docker jenkins
docker restart jenkins
```

### View Jenkins Logs
```bash
docker logs jenkins
docker logs -f jenkins  # Follow logs in real-time
```

### Restart Jenkins
```bash
docker restart jenkins
```

### Stop/Start Jenkins
```bash
docker stop jenkins
docker start jenkins
```

### Remove Jenkins (Clean slate)
```bash
docker stop jenkins
docker rm jenkins
docker volume rm jenkins_home
```

---

## Quick Reference Commands

### Docker Commands
```bash
# List running containers
docker ps

# Enter Jenkins container
docker exec -it jenkins bash

# View Jenkins logs
docker logs -f jenkins

# Restart Jenkins
docker restart jenkins
```

### Git Commands
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin master

# Pull latest changes
git pull origin master
```

### Jenkins CLI (Optional)

#### Install Jenkins CLI
```bash
# Download jenkins-cli.jar
wget http://localhost:8080/jnlpJars/jenkins-cli.jar
```

#### Use Jenkins CLI
```bash
# Trigger build
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:YOUR_PASSWORD build projet-microservices-cicd

# List jobs
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:YOUR_PASSWORD list-jobs
```

---

## Best Practices

1. **Use Sequential Builds** for stability (avoid parallel builds if resources are limited)
2. **Always use Access Tokens** instead of passwords for Docker Hub
3. **Enable Build Triggers** for automatic builds on code push
4. **Regular Backups** of Jenkins home directory
5. **Monitor Build Logs** for early error detection
6. **Clean Docker Images** regularly to save disk space
7. **Use Environment Variables** for sensitive data
8. **Version Control** your Jenkinsfile

---

## Next Steps

1. ✅ Jenkins installed and running
2. ✅ Docker CLI installed in Jenkins
3. ✅ GitHub repository created
4. ✅ Jenkins credentials configured
5. ✅ Pipeline created
6. ✅ Jenkinsfile committed
7. 🔄 **Run your first build!**
8. 📊 Monitor and optimize

---

## Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Docker Documentation](https://docs.docker.com/)
- [Jenkinsfile Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Docker Hub](https://hub.docker.com/)

---

**Created:** 2025-12-29  
**Author:** Hamdi Abdallah  
**Project:** Microservices CI/CD Pipeline
