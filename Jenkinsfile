pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies (root)') {
      steps {
        script {
          if (isUnix()) {
            sh 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'
          } else {
            bat 'if exist package-lock.json (npm ci) else (npm install)'
          }
        }
      }
    }

    stage('Test API (root)') {
      steps {
        script {
          if (isUnix()) {
            sh 'npm test'
          } else {
            bat 'npm test'
          }
        }
      }
    }

    stage('Install dependencies (notification-service)') {
      steps {
        dir('notification-service') {
          script {
            if (isUnix()) {
              sh 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'
            } else {
              bat 'if exist package-lock.json (npm ci) else (npm install)'
            }
          }
        }
      }
    }

    stage('Test notification-service') {
      steps {
        dir('notification-service') {
          script {
            if (isUnix()) {
              sh 'npm test'
            } else {
              bat 'npm test'
            }
          }
        }
      }
    }
  }

  post {
    always {
      echo 'Pipeline completed.'
    }
    success {
      echo 'All tests passed for root API and notification-service.'
    }
    failure {
      echo 'Pipeline failed. Check stage logs for details.'
    }
  }
}