#!/bin/bash
# ./upload.sh 192.168.1.99 
# ./upload.sh 139.199.30.36 2211

# 上传到服务器
scp -P $2 .tmp/dist.tar.gz yao@$1:/home/yao/dist-warehouse.tar.gz
ssh -p $2 yao@$1  '''rm -rf /data/warehouse'''
ssh -p $2 yao@$1  '''mkdir -p /data/warehouse/logs'''
ssh -p $2 yao@$1  '''mkdir -p /data/warehouse/data'''
ssh -p $2 yao@$1  '''cd /data/warehouse && tar xvfz /home/yao/dist-warehouse.tar.gz'''
ssh -p $2 yao@$1  '''sudo supervisorctl stop warehouse-server >> /dev/null'''
ssh -p $2 yao@$1  '''sudo supervisorctl stop warehouse-webcam >> /dev/null'''
ssh -p $2 yao@$1  '''sudo rm -rf /etc/supervisor/conf.d/warehouse.conf'''
ssh -p $2 yao@$1  '''sudo rm -rf /etc/supervisor/conf.d/warehouse-webcam.conf'''
ssh -p $2 yao@$1  '''sudo ln -s  /data/warehouse/supervisor/online.conf /etc/supervisor/conf.d/warehouse.conf'''
ssh -p $2 yao@$1  '''sudo ln -s  /data/warehouse/supervisor/webcam.conf /etc/supervisor/conf.d/warehouse-webcam.conf'''
ssh -p $2 yao@$1  '''sudo supervisorctl reload warehouse-server'''
ssh -p $2 yao@$1  '''sudo supervisorctl reload warehouse-webcam'''
ssh -p $2 yao@$1  '''sudo supervisorctl start warehouse-server >> /dev/null'''
ssh -p $2 yao@$1  '''sudo supervisorctl start warehouse-webcam >> /dev/null'''

# 清理工作目录
rm -rf .tmp