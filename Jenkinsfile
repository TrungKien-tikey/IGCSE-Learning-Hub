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

        stage('Setup Environment') {
            steps {
                script {
                    // Cách 1: Tạo file .env từ Jenkins Credentials (Khuyên dùng cho bảo mật)
                    // Bạn cần tạo một "Secret File" trong Jenkins Credentials với ID là 'igcse-env-file'
                    /*
                    withCredentials([file(credentialsId: 'igcse-env-file', variable: 'ENV_FILE')]) {
                        sh "cp \$ENV_FILE .env"
                        sh "cp \$ENV_FILE frontend/.env"
                    }
                    */
                    
                    // Cách 2: Tạo file .env thủ công (Dễ nhất cho người mới)
                    // Nếu bạn đã tự tạo file .env trên server Jenkins rồi thì không cần làm gì thêm.
                    echo "Đang kiểm tra file .env..."
                    sh 'ls -la .env || echo "Cảnh báo: Không tìm thấy file .env"'
                }
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
