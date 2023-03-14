#!/bin/bash
# MySQL Client
docker exec db-yao-mysql sh -c 'echo "user=yao" >> /etc/mysql/conf.d/mysql.cnf'
docker exec db-yao-mysql sh -c 'echo "password=123456" >> /etc/mysql/conf.d/mysql.cnf'

# MySQL Dump
docker exec db-yao-mysql sh -c 'echo "[mysqldump]" >> /etc/mysql/conf.d/mysql.cnf'
docker exec db-yao-mysql sh -c 'echo "user=yao" >> /etc/mysql/conf.d/mysql.cnf'
docker exec db-yao-mysql sh -c 'echo "password=123456" >> /etc/mysql/conf.d/mysql.cnf'
