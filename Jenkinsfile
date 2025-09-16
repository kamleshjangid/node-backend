pipeline {
    // This should match the label of your self-hosted Jenkins agent
    // that has Docker installed.
    agent { label 'self-hosted' }

    environment {
        PORT = '8080'
        // This corresponds to `vars.ALLOW_ORIGIN` in your GitHub workflow.
        // Update this with your actual allowed origin.
        ALLOW_ORIGIN = 'http://localhost:3000'
    }

    stages {
        stage('Build Docker Image') {
            steps {
                echo 'Building backend Docker image...'
                sh '''
                docker buildx build --no-cache --load \\
                  --build-arg PORT=${env.PORT} \\
                  -t bakery-backend:latest .
                '''
            }
        }

        stage('Create Environment File') {
            steps {
                echo 'Creating backend.env file...'
                // These credentials must be created in Jenkins as "Secret text"
                withCredentials([
                    string(credentialsId: 'DATABASE_NAME', variable: 'DATABASE_NAME'),
                    string(credentialsId: 'DATABASE_USERNAME', variable: 'DATABASE_USERNAME'),
                    string(credentialsId: 'DATABASE_PASSWORD', variable: 'DATABASE_PASSWORD'),
                    string(credentialsId: 'DB_PORT', variable: 'DB_PORT')
                ]) {
                    sh '''
                    cat <<EOF > backend.env
                    PORT=${env.PORT}
                    DATABASE_NAME=${DATABASE_NAME}
                    ALLOW_ORIGIN=${env.ALLOW_ORIGIN}
                    DATABASE_USERNAME=${DATABASE_USERNAME}
                    DATABASE_PASSWORD=${DATABASE_PASSWORD}
                    HOST=postgres-container
                    DB_PORT=${DB_PORT}
                    EOF
                    echo "backend.env created:"
                    cat backend.env
                    '''
                }
            }
        }

        stage('Setup Docker Network') {
            steps {
                echo 'Creating Docker network...'
                sh 'docker network create bakery-network || true'
            }
        }

        stage('Run PostgreSQL Container') {
            steps {
                echo 'Checking for PostgreSQL container...'
                withCredentials([
                    string(credentialsId: 'DATABASE_NAME', variable: 'DATABASE_NAME'),
                    string(credentialsId: 'DATABASE_USERNAME', variable: 'DATABASE_USERNAME'),
                    string(credentialsId: 'DATABASE_PASSWORD', variable: 'DATABASE_PASSWORD')
                ]) {
                    sh '''
                    if [ "$(docker ps -q -f name=postgres-container)" ]; then
                      echo "PostgreSQL container is already running.";
                    elif [ "$(docker ps -aq -f name=postgres-container)" ]; then
                      echo "Starting existing PostgreSQL container.";
                      docker start postgres-container;
                    else
                      echo "Creating and starting new PostgreSQL container.";
                      docker run -d --name postgres-container \\
                        --network bakery-network \\
                        -p 5432:5432 \\
                        -e POSTGRES_DB=${DATABASE_NAME} \\
                        -e POSTGRES_USER=${DATABASE_USERNAME} \\
                        -e POSTGRES_PASSWORD=${DATABASE_PASSWORD} \\
                        -v pgdata:/var/lib/postgresql/data \\
                        postgres:latest;
                    fi
                    '''
                }
            }
        }

        stage('Run PgAdmin Container') {
            steps {
                echo 'Checking for PgAdmin container...'
                withCredentials([
                    string(credentialsId: 'PGADMIN_EMAIL', variable: 'PGADMIN_EMAIL'),
                    string(credentialsId: 'PGADMIN_PASSWORD', variable: 'PGADMIN_PASSWORD')
                ]) {
                    sh '''
                    if [ "$(docker ps -q -f name=pgadmin-container)" ]; then
                      echo "PgAdmin container is already running.";
                    elif [ "$(docker ps -aq -f name=pgadmin-container)" ]; then
                      echo "Starting existing PgAdmin container.";
                      docker start pgadmin-container;
                    else
                      echo "Creating and starting new PgAdmin container.";
                      docker run -d --name pgadmin-container \\
                        --network bakery-network \\
                        -e PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL} \\
                        -e PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD} \\
                        -p 8000:80 \\
                        dpage/pgadmin4;
                    fi
                    '''
                }
            }
        }

        stage('Deploy Backend Container') {
            steps {
                echo 'Deploying backend container...'
                sh '''
                if [ "$(docker ps -aq -f name=bakery-backend-container)" ]; then
                  docker stop bakery-backend-container || true
                  docker rm bakery-backend-container || true
                fi

                docker run -d \\
                  --name bakery-backend-container \\
                  --network bakery-network \\
                  --env-file backend.env \\
                  -p 8080:8080 \\
                  bakery-backend:latest
                '''
            }
        }
    }
}
