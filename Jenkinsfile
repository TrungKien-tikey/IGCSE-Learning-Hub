pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Artifacts') {
            parallel {
                stage('AI Service') {
                    steps {
                        dir('ai-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Auth Service') {
                    steps {
                        dir('auth-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('User Service') {
                    steps {
                        dir('user-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Exam Service') {
                    steps {
                        dir('exam-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Course Service') {
                    steps {
                        dir('course-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Payment Service') {
                    steps {
                        dir('payment-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
                stage('Communication Service') {
                    steps {
                        dir('communication-service') {
                            sh './mvnw clean package -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed. Please check logs.'
        }
    }
}
