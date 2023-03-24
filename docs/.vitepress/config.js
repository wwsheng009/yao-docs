export default {
  title: "Yao Docs",
  base: "/yao-docs/",
  themeConfig: {
    siteTitle: "Yao Documents",
    // logo: '/authing-logo.svg',

    algolia: {
      appId: "XO4ITI7GEQ",
      apiKey: "7175502f11c76d375047ebea8b71e9ac",
      indexName: "yao-docs",
    },

    nav: [
      { text: "0.10.3", link: "/0.10.3/" },
      { text: "流程图", link: "/drawio/" },
      // {
      //   text: 'Dropdown Menu',
      //   items: [
      //     { text: 'Item A', link: '/item-1' },
      //     { text: 'Item B', link: '/item-2' },
      //     { text: 'Item C', link: '/item-3' }
      //   ]
      // },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/wwsheng009/yao-docs" },
    ],

    sidebar: {
      // This sidebar gets displayed when user is
      // under `guide` directory.
      "/0.10.3/": [
        {
          text: "版本差异",
          items: [
            {
              text: "0.10.2与0.10.3差异",
              link: "/0.10.3/Form/0.10.2与0.10.3差异",
            },
          ],
        },
        {
          text: "Form",
          items: [
            { text: "在Form里使用子表", link: "/0.10.3/Form/在Form里使用子表" },
            { text: "Form使用技巧", link: "/0.10.3/Form/Form使用技巧" },
          ],
        },
        {
          text: "Table",
          items: [
            { text: "Table使用技巧", link: "/0.10.3/Table/Table使用技巧" },
            {
              text: "在table界面上增加创建按钮",
              link: "/0.10.3/Table/在table界面上增加创建按钮",
            },
            {
              text: "在table中设置字段只读",
              link: "/0.10.3/Table/在table中设置字段只读",
            },
            {
              text: "增加查看，编辑，删除按钮",
              link: "/0.10.3/Table/增加查看，编辑，删除按钮",
            },
            { text: "Table最小化配置", link: "/0.10.3/Table/Table最小化配置" },
            {
              text: "TableA跳转到FormB",
              link: "/0.10.3/Table/TableA跳转到FormB",
            },
            {
              text: "搜索默认值",
              link: "/0.10.3/Table/搜索默认值",
            },
          ],
        },
        {
          text: "Xgen控件",
          items: [
            {
              text: "富文本控件",
              link: "/0.10.3/xgen控件/富文本控件/",
            },
            {
              text: "禁用编辑控件",
              link: "/0.10.3/xgen控件/禁用编辑控件",
            },
            {
              text: "有条件禁用`Table_Form Action`按钮",
              link: "/0.10.3/xgen控件/有条件禁用`Table_Form Action`按钮",
            },
            {
              text: "使用Hook转换日期控件的值",
              link: "/0.10.3/xgen控件/使用Hook转换日期控件的值",
            },
            {
              text: "图片控件",
              link: "/0.10.3/xgen控件/图片控件",
            },
            {
              text: "设置控件的必输属性",
              link: "/0.10.3/xgen控件/设置控件的必输属性",
            },
            {
              text: "远程select控件",
              link: "/0.10.3/xgen控件/远程select控件",
            },
            {
              text: "Switch控件",
              link: "/0.10.3/xgen控件/Switch控件",
            },
          ],
        },
        {
          text: "Studio",
          items: [
            {
              text: "自动生成table_form定义文件",
              link: "/0.10.3/Studio/自动生成table_form定义文件",
            },
          ],
        },
      ],
      "/drawio/": [
        {
          text: "数据库",
          items: [
            {
              text: "yao migrate",
              link: "/drawio/yao-migrate",
            },
          ],
        },
      ],
    },

    footer: {
      message: "Released under the MIT License.",
    },
  },
};
