//在form与table配置中，yao可以只配置简单的与模型的绑定关系就能带出所有的配置，
//但是这些配置都是默认项，一般情况是够用了，如果需要更多的配置，就需要手动修改配置文件。
function MakeDefaultTable(table) {
  let filename = `tables/${table.split(".").join("/")}.tab.json`;
  let fs = new FS("dsl");
  let default1 = {
    name: table,
    action: {
      bind: {
        model: table,
        option: {
          withs: {},
          form: table, //有form才会生成创建按钮
        },
      },
    },
  };
  if (!fs.Exists(filename)) {
    let paths = `tables/${table.split(".").join("/")}`.split("/");
    paths.pop();
    let folder = paths.join("/");
    fs.MkdirAll(folder);
    fs.WriteFile(filename, JSON.stringify(default1));
    console.log("已生成最小化配置Table:", filename);
    return false;
  } else {
    return true;
  }
}
function MakeDefaultForm(form) {
  let filename = `forms/${form.split(".").join("/")}.form.json`;
  let fs = new FS("dsl");
  let default1 = {
    name: form,
    action: {
      bind: {
        model: form,
        option: {
          withs: {},
        },
      },
    },
  };
  if (!fs.Exists(filename)) {
    let paths = `tables/${form.split(".").join("/")}`.split("/");
    paths.pop();
    let folder = paths.join("/");
    fs.MkdirAll(folder);
    fs.WriteFile(filename, JSON.stringify(default1));
    console.log("已生成最小化配置Form:", filename);
    return false;
  } else {
    return true;
  }
}
/**
 * 初始化表格的配置文件。
 * @param table 表格名称
 */
function CreateTable(table) {
  const exist = MakeDefaultTable(table);
  if (exist == false) {
    console.log("需要生成全配置Table,请再执行一次命令");
    return;
  }
  //如果不存在，需要执行两次，要不然yao.table.Setting无法加载文件
  let filename = `tables/${table.split(".").join("/")}.tab.json`;
  // let table_file = `tables/${table.split(".").join("/")}.tab.json`;
  let setting = Process("yao.table.Setting", table);
  if (setting.code && setting.message) {
    throw new Exception(setting.message, setting.code);
  }
  delete setting["hooks"];
  //重新近排布局
  let newTable = {
    name: table,
    action: {
      bind: {
        model: table,
        option: {
          form: table,
          withs: {},
        },
      },
    },
    layout: {},
    fields: {},
  };
  let fields = setting.fields;
  delete setting.fields;
  newTable.layout = setting;
  newTable.fields = fields;
  if (newTable.layout) {
    newTable.config = newTable.layout.config;
    delete newTable.layout.config;
    delete newTable.layout.name;
  }
  let createAction = {
    action: [
      {
        type: "Common.historyPush",
        payload: {
          pathname: `/x/Form/${table}/0/edit`,
        },
        name: "HistoryPush",
      },
    ],
    title: "创建",
    width: 3,
    icon: "icon-plus",
  };
  if (!newTable?.layout) {
    newTable.layout = {};
  }
  if (!newTable?.layout?.filter) {
    newTable.layout.filter = {};
  }
  if (!newTable?.layout?.filter?.actions) {
    newTable.layout.filter.actions = [];
  }
  if (newTable.layout.filter.actions.length == 0) {
    newTable.layout.filter.actions.push(createAction);
  }
  deleteObjectKey(newTable, "id");
  let fs = new FS("dsl");
  if (fs.Exists(filename)) {
    let template = JSON.parse(fs.ReadFile(filename));
    //如果不存在配置，增加，不要直接替换
    newTable.action = template.action;
    newTable.name = template.name;
    // for (const key in template) {
    //   if (!newTable[key]) {
    //     newTable[key] = template[key];
    //   }
    // }
  }
  //make sure the folder exist
  let folder = filename.split("/").slice(0, -1);
  if (!fs.Exists(folder.join("/"))) {
    fs.MkdirAll(folder.join("/"));
  }
  let rc = fs.WriteFile(
    filename.slice(0, -4) + "default.json",
    JSON.stringify(newTable)
  );
  console.log(rc);
}
/**
 * 创建表单的配置文件，适用于初始化表单配置
 * @param form 表单名称
 */
function CreateForm(form) {
  const exist = MakeDefaultForm(form);
  if (exist == false) {
    console.log("需要生成全配置Form,请再执行一次");
    return;
  }
  //如果不存在，需要执行两次，要不然yao.form.Setting无法加载文件
  let filename = `forms/${form.split(".").join("/")}.form.json`;
  let setting = Process("yao.form.Setting", form);
  // createSetting(setting, filename);
  if (setting.code && setting.message) {
    throw new Exception(setting.message, setting.code);
  }
  delete setting["hooks"];
  let newForm = {
    //{ [key: string]: any } = {
    name: form,
    action: {
      bind: {
        model: form,
        option: {},
      },
    },
    layout: {},
    fields: {},
  };
  let fields = setting.fields;
  delete setting.fields;
  newForm.layout = setting;
  newForm.fields = fields;
  if (newForm.layout) {
    newForm.config = newForm.layout.config;
    delete newForm.layout.config;
    delete newForm.layout.name;
  }
  deleteObjectKey(newForm, "id");
  // 合并原来的配置
  let fs = new FS("dsl");
  if (fs.Exists(filename)) {
    let template = JSON.parse(fs.ReadFile(filename));
    newForm.action = template.action;
    newForm.name = template.name;
    // for (const key in template) {
    //   if (!newForm[key]) {
    //     newForm[key] = template[key];
    //   }
    // }
  }
  let actions = [
    {
      title: "返回",
      icon: "icon-arrow-left",
      showWhenAdd: true,
      showWhenView: true,
      action: [
        {
          name: "CloseModal",
          type: "Common.closeModal",
          payload: {},
        },
      ],
    },
    {
      title: "保存",
      icon: "icon-check",
      style: "primary",
      showWhenAdd: true,
      action: [
        {
          name: "Submit",
          type: "Form.submit",
          payload: {},
        },
        {
          name: "Back",
          type: "Common.closeModal",
          payload: {},
        },
      ],
    },
    {
      icon: "icon-trash-2",
      style: "danger",
      title: "Delete",
      action: [
        {
          name: "Confirm",
          type: "Common.confirm",
          payload: {
            title: "确认删除",
            content: "删除后不可撤销！",
          },
        },
        {
          name: "Delete",
          payload: {
            model: form,
          },
          type: "Form.delete",
        },
        {
          name: "Back",
          type: "Common.closeModal",
          payload: {},
        },
      ],
    },
  ];
  newForm.layout.actions = actions;
  //make sure the folder exist
  let folder = filename.split("/").slice(0, -1);
  if (!fs.Exists(folder.join("/"))) {
    fs.MkdirAll(folder.join("/"));
  }
  let rc = fs.WriteFile(
    filename.slice(0, -4) + "default.json",
    JSON.stringify(newForm)
  );
  console.log(rc);
}
/**
 * delete special key in object
 * @param obj object or arry
 * @param delete_id key to be delete
 * @returns void
 */
function deleteObjectKey(obj, delete_id) {
  if (!(obj instanceof Object) && !(obj instanceof Array)) {
    return;
  }
  if (obj instanceof Array) {
    for (let index = 0; index < obj.length; index++) {
      deleteObjectKey(obj[index], delete_id);
    }
    return;
  }
  for (const key in obj) {
    if (obj[key] instanceof Object) {
      deleteObjectKey(obj[key], delete_id);
    } else if (obj[key] instanceof Array) {
      deleteObjectKey(obj[key], delete_id);
    }
    if (key == delete_id) {
      delete obj[delete_id];
    }
  }
}
function test_delete_object_key() {
  let obj = {
    test: {
      id: "test",
    },
    fields: [
      {
        id: "test2",
      },
    ],
  };
  deleteObjectKey(obj, "id");
  console.log(obj);
}
/**
 * create default table and table config json file
 * @param model yao model name
 */
function CreateTableAndForm(model) {
  CreateTable(model);
  CreateForm(model);
}
//如果不存在，需要执行两次，要不然yao无法加载文件
//直接ts执行
// CreateTable("chat.prompt_template1");
// CreateForm("chat.prompt_template");
// CreateTableAndForm("chat.prompt_template");
// 使用命令行
// yao studio run init.CreateTable supplier
// yao studio run init.CreateForm supplier
// yao studio run init.CreateTableAndForm supplier
