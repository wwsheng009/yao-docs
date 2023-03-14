#!/bin/bash
# ./yao.sh 0.9.2
VERSION=$1
wget https://release-sv-1252011659.cos.na-siliconvalley.myqcloud.com/archives/yao-$VERSION-linux-amd64
supervisorctl stop all
chmod +x yao-$VERSION-linux-amd64
rm -f /usr/local/bin/yao
mv yao-$VERSION-linux-amd64 /usr/local/bin/yao
supervisorctl start all