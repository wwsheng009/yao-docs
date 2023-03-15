function main() {
  return [
    {
      id: 10,
      name: "看板",
      path: "/kanban/index",
      icon: "icon-activity",
      rank: 10,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 20,
      name: "物资",
      path: "x/Table/material",
      icon: "icon-package",
      rank: 20,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: null,
    },
    {
      id: 30,
      name: "计划",
      path: "x/Table/plan",
      icon: "icon-calendar",
      rank: 30,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 40,
      name: "单位",
      path: "x/Table/supplier",
      icon: "icon-book",
      rank: 40,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 50,
      name: "仓库",
      path: "x/Table/warehouse",
      icon: "icon-home",
      rank: 50,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 60,
      name: "人员",
      path: "x/Table/user",
      icon: "icon-users",
      rank: 60,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 70,
      name: "凭据",
      path: "x/Table/ticket.total",
      icon: "icon-archive",
      rank: 70,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 80,
      name: "标签",
      path: "x/Table/rfid",
      icon: "icon-tag",
      rank: 80,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 90,
      name: "记录",
      path: "x/Table/record.total",
      icon: "icon-clock",
      rank: 90,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
    {
      id: 100,
      name: "导出",
      path: "x/Table/exports",
      icon: "icon-download",
      rank: 100,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: null,
    },
    {
      id: 102,
      name: "导出",
      path: "/iframe?src=/export",
      icon: "icon-download",
      rank: 100,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 100,
    },
    // {
    //   id: 90,
    //   name: "日志",
    //   path: "x/Table/synclog",
    //   icon: "icon-clock",
    //   rank: 90,
    //   status: "enabled",
    //   visible_menu: 0,
    //   blocks: 0,
    //   parent: null,
    // },
    {
      id: 2010,
      name: "物资",
      path: "x/Table/material",
      icon: "icon-package",
      rank: 10,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 20,
    },
    {
      id: 2020,
      name: "单品",
      path: "x/Table/material.sku",
      icon: "icon-package",
      rank: 20,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 20,
    },
    {
      id: 2030,
      name: "库存",
      path: "x/Table/stock",
      icon: "icon-package",
      rank: 30,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 20,
    },
    {
      id: 2040,
      name: "类目",
      path: "x/Table/material.category",
      icon: "icon-package",
      rank: 40,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 20,
    },
    {
      id: 7009,
      name: "全部记录",
      path: "x/Table/record.total",
      icon: "icon-package",
      rank: 9,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 70,
    },
    {
      id: 7010,
      name: "出库记录",
      path: "x/Table/record.material.out",
      icon: "icon-package",
      rank: 10,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 70,
    },
    {
      id: 7020,
      name: "入库记录",
      path: "x/Table/record.material.in",
      icon: "icon-package",
      rank: 20,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 70,
    },
    {
      id: 7030,
      name: "进入记录",
      path: "x/Table/record.user.in",
      icon: "icon-package",
      rank: 30,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 70,
    },
    {
      id: 7040,
      name: "离开记录",
      path: "x/Table/record.user.out",
      icon: "icon-package",
      rank: 30,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 70,
    },
    {
      id: 101,
      name: "导出下载",
      path: "x/Table/exports",
      icon: "icon-download",
      rank: 101,
      status: "enabled",
      visible_menu: 1,
      blocks: 0,
      parent: 100,
    },
    {
      id: 7060,
      name: "扫码录入",
      path: "/iframe?src=/scanner",
      icon: "icon-trello",
      rank: 101,
      status: "enabled",
      visible_menu: 0,
      blocks: 0,
      parent: null,
    },
  ];
}
