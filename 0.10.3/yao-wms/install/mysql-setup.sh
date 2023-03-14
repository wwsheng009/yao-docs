#!/bin/bash
startMySQL() {
    VERSION=$1
    PORT=$2
    NAME=$3
    HOST=$4

INPUT_USER=yao
INPUT_PASSWORD=123456
docker_run='docker run --security-opt="seccomp:unconfined" --restart=always'

    echo "Start MySQL $VERSION $PORT $NAME"
    docker_run="$docker_run -e MYSQL_RANDOM_ROOT_PASSWORD=true -e MYSQL_USER=$INPUT_USER -e MYSQL_PASSWORD=$INPUT_PASSWORD"
    docker_run="$docker_run -e MYSQL_DATABASE=$NAME"
    docker_run="$docker_run --name "$NAME-yao-mysql" -d -p $HOST:$PORT:3306 mysql:$VERSION --port=3306 --sql-mode=''"

    if [ "$VERSION" = "5.6" ]; then
        docker_run="$docker_run --character-set-server=utf8 --collation-server=utf8_general_ci"
    else
        docker_run="$docker_run --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci"
    fi

    sh -c "$docker_run"
}

startMySQL 8.0 3306 db 192.168.1.99
