function main() {
  return [
    {
      name: "看板",
      path: "/kanban/index",
      icon: "icon-activity",
    },
    {
      name: "物资",
      path: "/x/Table/material",
      icon: "icon-package",
      children: [
        {
          name: "物资",
          path: "/x/Table/material",
          icon: "icon-package",
          blocks: 1,
        },
        {
          name: "单品",
          path: "/x/Table/material.sku",
          icon: "icon-package",
        },
        {
          name: "单品标签下载",
          icon: "icon-package",
          path: "/x/Table/material.sku.rfid",
        },
        {
          name: "规格",
          path: "/x/Table/material.spec",
          icon: "icon-package",
        },
        {
          name: "类目",
          path: "/x/Table/material.category",
          icon: "icon-package",
        },
      ],
    },
    {
      name: "仓库",
      path: "/x/Table/warehouse",
      icon: "icon-home",
      children: [
        {
          name: "仓库设置",
          path: "/x/Table/warehouse",
          icon: "icon-home",
        },
        {
          name: "库存",
          path: "/x/Table/stock",
          icon: "icon-package",
        },
        {
          name: "库存快照",
          path: "/x/Table/stat.stock",
          icon: "icon-package",
        },
      ],
    },
    {
      name: "计划",
      path: "/x/Table/plan",
      icon: "icon-calendar",
    },
    {
      name: "供应商",
      path: "/x/Table/supplier",
      icon: "icon-book",
    },
    {
      name: "人员",
      path: "/x/Table/user",
      icon: "icon-users",
      children: [
        {
          name: "进入记录",
          path: "/x/Table/record.user.in",
          icon: "icon-package",
        },
        {
          name: "离开记录",
          path: "/x/Table/record.user.out",
          icon: "icon-package",
        },
      ],
    },
    {
      name: "凭据",
      path: "/x/Table/ticket.total",
      icon: "icon-archive",
      children: [
        {
          name: "凭据",
          path: "/x/Table/ticket.total",
          icon: "icon-archive",
        },
        {
          name: "凭据打印",
          path: "/x/Table/ticket.view",
          icon: "icon-archive",
        },
      ],
    },
    {
      name: "标签",
      path: "/x/Table/rfid",
      icon: "icon-tag",
    },
    {
      name: "扫码录入",
      path: "/iframe?src=/scanner",
      icon: "icon-trello",
    },
    {
      name: "大屏",
      path: "/iframe?src=/screen",
      icon: "icon-activity",
    },
    {
      name: "记录",
      path: "/x/Table/record.total",
      icon: "icon-clock",
      children: [
        {
          name: "全部记录",
          path: "/x/Table/record.total",
          icon: "icon-package",
        },
        {
          name: "出库记录",
          path: "/x/Table/record.material.out",
          icon: "icon-package",
        },
        {
          name: "入库记录",
          path: "/x/Table/record.material.in",
          icon: "icon-package",
        },
      ],
    },
    {
      name: "导出",
      path: "/x/Table/exports",
      icon: "icon-download",
      children: [
        {
          name: "导出",
          path: "/iframe?src=/export",
          icon: "icon-download",
        },
        {
          name: "导出下载",
          path: "/x/Table/exports",
          icon: "icon-download",
        },
      ],
    },
  ];
}
