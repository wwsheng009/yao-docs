#!/bin/bash
echo backup $(date '+%Y-%m-%d-%H') >> /data/logs/backup-$(date '+%Y-%m').log

# 备份数据库
ROOT=/backup/$(date '+%Y-%m')
mkdir -p $ROOT/db
SQLFILE=$ROOT/db/$(date '+%Y-%m-%d-%H').sql
rm -f $SQLFILE.gz
mysqldump --databases db > $SQLFILE
gzip $SQLFILE

mkdir -p $ROOT/data
tar cvfz $ROOT/data/$(date '+%Y-%m-%d-%H').tar.gz /data/cloud/data 