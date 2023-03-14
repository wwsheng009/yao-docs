#/bin/bash
echo stat $(date '+%Y-%m-%d-%H')  >> /data/logs/stat-$(date '+%Y-%m').log

## 统计上一日库存快照
cd /data/cloud && /usr/local/bin/yao run scripts.cron.stat.Stock $(date '+%Y-%m-%d') >> /data/logs/stat-$(date '+%Y-%m').log

## 统计上一日人员进出
cd /data/cloud && /usr/local/bin/yao run scripts.cron.stat.User $(date '+%Y-%m-%d') >> /data/logs/stat-$(date '+%Y-%m').log
