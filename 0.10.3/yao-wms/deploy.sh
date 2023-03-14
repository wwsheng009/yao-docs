#!/bin/bash
# ./deploy.sh 192.168.31.99
VERSION=$(xiang version)
HOST=$1

# 清理工作目录
rm -rf .tmp

# 创建工作目录
mkdir -p .tmp/source
git clone git@github.com:YaoApp/warehouse.git .tmp/source
mkdir -p .tmp/source/cloud/bin

# 复制文件
cp ~/Code/bin/xiang-$VERSION-linux-amd64 .tmp/source/cloud/bin/warehouse
cp .tmp/source/cloud/online.env .tmp/source/cloud/.env
chmod +x .tmp/source/cloud/bin/warehouse

# 删除 Git 目录
rm -rf .tmp/source/.git
rm -rf .tmp/source/db/*
rm -rf .tmp/source/plugins/*
rm -rf .tmp/source/*.sh


# 应用文件打包
cd .tmp/source/cloud && tar cvfz ../../dist.tar.gz . && cd ../../..

# 上传到服务器
scp .tmp/dist.tar.gz yao@$1:/home/yao/dist-warehouse.tar.gz
ssh yao@$1 '''rm -rf /data/warehouse'''
ssh yao@$1 '''mkdir -p /data/warehouse/logs'''
ssh yao@$1 '''mkdir -p /data/warehouse/data'''
ssh yao@$1 '''cd /data/warehouse && tar xvfz /home/yao/dist-warehouse.tar.gz'''
ssh yao@$1 '''sudo supervisorctl stop warehouse-server >> /dev/null'''
ssh yao@$1 '''sudo supervisorctl stop warehouse-webcam >> /dev/null'''
ssh yao@$1 '''sudo supervisorctl stop yao-ssh >> /dev/null'''
ssh yao@$1 '''sudo rm -rf /etc/supervisor/conf.d/warehouse.conf'''
ssh yao@$1 '''sudo rm -rf /etc/supervisor/conf.d/warehouse-webcam.conf'''
ssh yao@$1 '''sudo rm -rf /etc/supervisor/conf.d/yao-ssh.conf'''
ssh yao@$1 '''sudo ln -s  /data/warehouse/supervisor/online.conf /etc/supervisor/conf.d/warehouse.conf'''
ssh yao@$1 '''sudo ln -s  /data/warehouse/supervisor/webcam.conf /etc/supervisor/conf.d/warehouse-webcam.conf'''
ssh yao@$1 '''sudo ln -s  /data/warehouse/supervisor/ssh.conf /etc/supervisor/conf.d/yao-ssh.conf'''
ssh yao@$1 '''sudo supervisorctl reload'''
ssh yao@$1 '''sudo supervisorctl start warehouse-server >> /dev/null'''
ssh yao@$1 '''sudo supervisorctl start warehouse-webcam >> /dev/null'''
ssh yao@$1 '''sudo supervisorctl start yao-ssh >> /dev/null'''
ssh yao@$1 '''cd /data/warehouse && ./reset.sh'''

# 清理工作目录
rm -rf .tmp