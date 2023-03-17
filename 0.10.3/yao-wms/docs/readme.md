## demo 数据初始化

```bash
# 创建数据表

yao migrate --reset
# 演示数据
yao run flows.demo.data
# 演示数据
yao run scripts.tools.demo.Import
```

## 操作流程

- 主数据

  - 维护物料
  - 维护单品
  - 维护标签
  - 维护

- 业务操作

  - 物料入库操作
  - 物料出库操作
