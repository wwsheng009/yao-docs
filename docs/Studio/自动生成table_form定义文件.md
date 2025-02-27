# 自动的生成 form/table 定义文件

## 下载工具脚本

请把工具脚本[`init.js`](https://github.com/wwsheng009/yao-init/blob/main/studio/init.js)脚本复制到`Yao`应用的`scripts`目录下。

```sh
wget -O scripts/init.js https://raw.githubusercontent.com/wwsheng009/yao-init/main/studio/init.js
```

## 使用脚本

使用脚本生成模型对应的界面配置文件。

### 生成最小化配置

首先生成最小化配置文件：

```sh
yao run  scripts.init.CreateTable material
yao run  scripts.init.CreateForm material
```

执行后会生成以下文件：

- `tables/material.tab.json`：表格的最小化配置文件
- `forms/material.form.json`：表单的最小化配置文件

最小化配置的特点：

- 只包含最基本的配置信息，其他配置由 Yao 框架在运行时自动生成
- 适合开发阶段使用，对模型的修改能实时在管理界面上预览
- 配置文件结构简单，易于理解和维护
- 注意：最小化配置的 Form 可能缺少一些功能按钮（如保存按钮）

### 生成全量配置

如果需要更细致的界面定制，可以再次执行相同的命令生成全量配置：

```sh
yao run  scripts.init.CreateTable material
yao run  scripts.init.CreateForm material
```

执行后会生成以下文件：

- `tables/material.tab.default.json`：表格的全量配置文件
- `forms/material.form.default.json`：表单的全量配置文件

全量配置的特点：

- 包含模型的所有可配置项
- 可以进行精细化的界面调整
- 配置固化在文件中，不依赖框架的默认行为
- 适合生产环境使用

### 文件覆盖说明

如果模型对应的`table/form`定义文件已经存在，脚本不会覆盖现有的文件，而是直接生成全量配置文件（带.default 后缀）。这样可以保护你已经修改过的配置不被覆盖。

### 配置文件使用建议

1. 开发阶段：

   - 使用最小化配置，方便快速调试和预览
   - 可以频繁修改模型定义，界面会自动适应变化

2. 生产环境：

   - 建议使用全量配置
   - 确认配置无误后，将.default 文件的内容复制到正式配置文件中
   - 或直接将.default 文件重命名为正式配置文件

3. 配置迁移：

   ```sh
   # 方式1：手动复制内容
   # 从.default文件复制内容到正式配置文件

   # 方式2：重命名文件
   mv tables/material.tab.default.json tables/material.tab.json
   mv forms/material.form.default.json forms/material.form.json
   ```

### 常见问题

1. 最小化配置缺少按钮：

   - 这是正常现象，可以切换到全量配置
   - 或手动添加需要的按钮配置

2. 配置文件不生效：

   - 检查文件名是否正确（.json 后缀）
   - 确认文件路径在正确的目录下（tables/forms）
   - 验证 JSON 格式是否正确

3. 模型变更后界面未更新：
   - 使用最小化配置时，尝试刷新浏览器
   - 使用全量配置时，需要手动更新配置文件
