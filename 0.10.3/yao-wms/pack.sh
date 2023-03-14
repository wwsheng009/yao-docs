#!/bin/bash
VERSION=$(yao version)
HOST=$1

# 清理工作目录
rm -rf .tmp

# 创建工作目录
mkdir -p .tmp/source
git clone git@github.com:YaoApp/warehouse.git .tmp/source
mkdir -p .tmp/source/cloud/bin

# 复制文件
# cp ~/Code/bin/xiang-$VERSION-linux-amd64 .tmp/source/cloud/bin/warehouse
cp .tmp/source/cloud/online.env .tmp/source/cloud/.env
# chmod +x .tmp/source/cloud/bin/warehouse

# 删除 Git 目录
rm -rf .tmp/source/.git
rm -rf .tmp/source/db/*
rm -rf .tmp/source/plugins/*
rm -rf .tmp/source/*.sh


# 应用文件打包
cd .tmp/source/cloud && tar cvfz ../../dist.tar.gz . && cd ../../..
