# Prompt 工程

## 提示模板

在非聊天应用中，提示词的精准性对 ai 返回结果会有很大的影响，解决方法：

- 动态提示词=提示模板+变量，通过引入给提示词引入变量的方式，一方面保证了灵活性，一方面又能保证 Prompt 内容结构达到最佳

- 聊天提示模板 聊天场景中，消息可以与 AI、人类或系统角色相关联，模型应该更加密切地遵循系统聊天消息的指示。一般 ai 输入都会有以下的角色抽象：

  - 用户，表示用户的输入
  - 助手，模型的输出
  - 系统，系统预设

    比如对 OpenAI gpt-3.5-tubor API 中 role 字段（role 的属性用于显式定义角色，其中 system 用于系统预设，比如”你是一个翻译家“，“你是一个写作助手”，user 表示用户的输入， assistant 表示模型的输出）的一种抽象，以便应用于其他大语言模型。SystemMessage 对应系统预设，HumanMessage 用户输入，AIMessage 表示模型输出，使用 ChatMessagePromptTemplate 可以使用任意角色接收聊天消息。

## 输出解析器

    针对机器人返回的消息，需要作内容抽取与规范。解析器需要分析模型输出,判断是否符合预期结构。
