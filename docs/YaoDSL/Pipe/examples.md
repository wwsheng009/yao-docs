# 示例代码

> ⚠️ **重要**: 所有配置示例使用 **JSON 格式**，不是 YAML！
>
> 📖 查看 [JSON 格式说明](./JSON-格式说明.md) 了解详细的转换指南

本节提供了 Pipe 的实际应用示例，从简单到复杂，涵盖各种使用场景。

## 基础示例

### 1. 简单的数据处理

```json
{
  "name": "simple-data-processor",
  "label": "简单数据处理器",
  "description": "演示基本的输入、处理和输出流程",
  "whitelist": ["utils.*"],
  "nodes": [
    // 1. 获取用户输入
    {
      "name": "get-input",
      "ui": "cli",
      "label": "请输入要处理的数据："
    },
    // 2. 数据转换
    {
      "name": "transform-data",
      "process": {
        "name": "utils.transform",
        "args": [
          "{{ $in[0] }}",
          "uppercase" // 转换为大写
        ]
      },
      "output": "{{ $out.result }}"
    },
    // 3. 显示结果
    {
      "name": "show-result",
      "ui": "cli",
      "label": "处理结果：",
      "autofill": {
        "value": "{{ $out }}",
        "action": "exit"
      }
    }
  ]
}
```

**使用方法：**

```bash
# 运行简单处理器
yao run pipes.simple-data-processor

# 或者从 JSON 创建并运行
yao run pipe.Create '{"name":"simple-data-processor","nodes":[...]}' "input_data"
```

### 2. 条件分支示例

```yaml
# age-classifier.pip.yao
name: 'age-classifier'
label: '年龄分类器'
description: '根据年龄将用户分为不同类别'

whitelist:
  - 'user.*'
  - 'utils.*'

input:
  - '{{ $global.age }}'

nodes:
  # 1. 年龄验证
  - name: 'validate-age'
    process:
      name: 'utils.validate_age'
      args: ['{{ $in[0] }}']

  # 2. 年龄分类
  - name: 'classify-age'
    switch:
      '{{ $in[0] >= 65 }}':
        name: 'senior'
        nodes:
          - name: 'senior-message'
            process:
              name: 'utils.generate_message'
              args:
                - 'senior'
                - '您是老年用户'

      '{{ $in[0] >= 18 }}':
        name: 'adult'
        nodes:
          - name: 'adult-message'
            process:
              name: 'utils.generate_message'
              args:
                - 'adult'
                - '您是成年用户'

      default:
        name: 'minor'
        nodes:
          - name: 'minor-message'
            process:
              name: 'utils.generate_message'
              args:
                - 'minor'
                - '您是未成年用户'

  # 3. 显示分类结果
  - name: 'display-result'
    ui: 'cli'
    label: '分类结果：'
    autofill:
      value: '{{ $out }}'
      action: 'exit'

# 最终输出
output:
  category: '{{ $out[0] }}'
  message: '{{ $out[1] }}'
  processed_at: '{{ now() }}'
```

**使用方法：**

```bash
# 设置年龄为 25
yao run pipe.CreateWith '{"name":"age-classifier","nodes":[...]}' '{"age": 25}'

# 设置年龄为 70
yao run pipe.CreateWith '{"name":"age-classifier","nodes":[...]}' '{"age": 70}'
```

## AI 集成示例

### 3. 智能翻译助手

```yaml
# smart-translator.pip.yao
name: 'smart-translator'
label: '智能翻译助手'
description: '基于 AI 的多语言翻译工具'

whitelist:
  - 'ai.*'
  - 'utils.*'
  - 'language.*'

nodes:
  # 1. 检测源语言
  - name: 'detect-language'
    ui: 'cli'
    label: '请输入要翻译的文本：'

  - name: 'language-detection'
    prompts:
      - role: 'system'
        content: '你是一个语言检测专家，请检测输入文本的语言，只返回语言代码（如：zh, en, ja, fr 等）'
      - role: 'user'
        content: '{{ $in[0] }}'
    model: 'gpt-3.5-turbo'
    output:
      source_text: '{{ $in[0] }}'
      detected_language: '{{ $out.choices[0].message.content }}'

  # 2. 选择目标语言
  - name: 'select-target-language'
    ui: 'cli'
    label: '请选择目标语言（en/ja/fr/es/de）：'

  # 3. 执行翻译
  - name: 'translate'
    prompts:
      - role: 'system'
        content: '你是一个专业翻译，请将文本从{{ $node.language-detection.out.detected_language }}翻译成{{ $in[0] }}，保持原文的语气和风格'
      - role: 'user'
        content: '{{ $node.language-detection.out.source_text }}'
    model: 'gpt-4'
    options:
      temperature: 0.3
      max_tokens: 1000
    output:
      original_text: '{{ $node.language-detection.out.source_text }}'
      source_language: '{{ $node.language-detection.out.detected_language }}'
      target_language: '{{ $in[0] }}'
      translated_text: '{{ $out.choices[0].message.content }}'
      translator: 'AI Assistant'

  # 4. 显示翻译结果
  - name: 'show-translation'
    ui: 'cli'
    label: '翻译结果：'
    autofill:
      value: |
        原文（{{ $node.translate.out.source_language }}）: {{ $node.translate.out.original_text }}
        译文（{{ $node.translate.out.target_language }}）: {{ $node.translate.out.translated_text }}
        翻译者：{{ $node.translate.out.translator }}
      action: 'exit'

# 最终输出
output:
  translation_result: '{{ $node.translate.out }}'
  timestamp: '{{ now() }}'
  session_id: '{{ $sid }}'
```

**使用方法：**

```bash
# 启动翻译助手
yao run pipes.smart-translator

# 或者直接指定文本和目标语言
yao run pipe.CreateWith "$(cat smart-translator.pip.yao)" '{"user_id": "123"}' "Hello, world!" "zh"
```

### 4. AI 内容生成器

```yaml
# content-generator.pip.yao
name: 'content-generator'
label: 'AI 内容生成器'
description: '根据用户需求生成各种类型的内容'

whitelist:
  - 'ai.*'
  - 'content.*'
  - 'utils.*'

nodes:
  # 1. 内容类型选择
  - name: 'select-content-type'
    ui: 'cli'
    label: '请选择内容类型（blog/email/social/ad/story）：'

  # 2. 获取主题
  - name: 'get-topic'
    ui: 'cli'
    label: '请输入内容主题：'

  # 3. 内容生成
  - name: 'generate-content'
    prompts:
      - role: 'system'
        content: |
          你是一个专业的内容创作者。请根据用户要求生成高质量的{{ $node.select-content-type.out[0] }}内容。
          要求：
          1. 内容要专业、准确、有价值
          2. 语言要流畅自然
          3. 结构要清晰合理
          4. 符合{{ $node.select-content-type.out[0] }}的写作规范

          {{ $node.select-content-type.out[0] }}类型的具体要求：
          - blog: 需要有引言、正文、结论，字数800-1200字
          - email: 需要有主题、正文、署名，简洁明了
          - social: 需要有吸引力，适合社交媒体传播，包含相关标签
          - ad: 需要有标题、正文、行动号召，具有说服力
          - story: 需要有开头、发展、高潮、结尾，情节生动有趣

      - role: 'user'
        content: |
          内容类型：{{ $node.select-content-type.out[0] }}
          主题：{{ $node.get-topic.out[0] }}
          请生成相关内容。

          附加要求：
          {{ $global.additional_requirements ?? "无" }}
    model: 'gpt-4'
    options:
      temperature: 0.7
      max_tokens: 2000
      stream: true
    output:
      content_type: '{{ $node.select-content-type.out[0] }}'
      topic: '{{ $node.get-topic.out[0] }}'
      generated_content: '{{ $out.choices[0].message.content }}'
      word_count: "{{ len($out.choices[0].message.content.split(' ')) }}"
      generated_at: '{{ now() }}'

  # 4. 内容优化（可选）
  - name: 'optimize-content'
    switch:
      '{{ $global.auto_optimize == true }}':
        name: 'optimize'
        nodes:
          - name: 'ai-optimize'
            prompts:
              - role: 'system'
                content: '你是一个内容优化专家，请优化以下内容，使其更加完善和专业'
              - role: 'user'
                content: '{{ $node.generate-content.out.generated_content }}'
            model: 'gpt-4'
            options:
              temperature: 0.3
            output:
              optimized_content: '{{ $out.choices[0].message.content }}'
              original_content: '{{ $node.generate-content.out.generated_content }}'
      default:
        name: 'no-optimize'
        output:
          optimized_content: '{{ $node.generate-content.out.generated_content }}'
          original_content: '{{ $node.generate-content.out.generated_content }}'

  # 5. 显示结果
  - name: 'show-result'
    ui: 'cli'
    label: '生成的内容：'
    autofill:
      value: |
        ┌─────────────────────────────────────┐
        │ 内容类型：{{ $node.generate-content.out.content_type }}
        │ 主题：{{ $node.generate-content.out.topic }}
        │ 字数：{{ $node.generate-content.out.word_count }}
        │ 生成时间：{{ $node.generate-content.out.generated_at }}
        └─────────────────────────────────────┘

        {{ $node.optimize-content.out.optimized_content }}
      action: 'exit'

# 最终输出
output:
  content_info: '{{ $node.generate-content.out }}'
  optimized_content: '{{ $node.optimize-content.out.optimized_content }}'
  metadata:
    session_id: '{{ $sid }}'
    processing_time: '{{ now() }}'
    version: '1.0'
```

**使用方法：**

```bash
# 基础使用
yao run pipes.content-generator

# 带自动优化
yao run pipe.CreateWith "$(cat content-generator.pip.yao)" '{"auto_optimize": true}'
```

## 业务流程示例

### 5. 用户注册流程

```yaml
# user-registration.pip.yao
name: 'user-registration'
label: '用户注册流程'
description: '完整的用户注册流程，包括验证、创建和通知'

whitelist:
  - 'user.*'
  - 'validation.*'
  - 'notification.*'
  - 'security.*'

nodes:
  # 1. 获取用户信息
  - name: 'collect-user-info'
    ui: 'cli'
    label: '请输入用户信息（格式：邮箱,用户名,密码）：'

  # 2. 解析输入信息
  - name: 'parse-input'
    process:
      name: 'utils.parse_user_input'
      args: ['{{ $in[0] }}']
    output:
      email: '{{ $out.email }}'
      username: '{{ $out.username }}'
      password: '{{ $out.password }}'

  # 3. 输入验证
  - name: 'validate-input'
    process:
      name: 'validation.comprehensive'
      args:
        - '{{ $node.parse-input.out }}'
        - email:
            required: true
            pattern: "^[^@]+@[^@]+\\.[^@]+$"
          username:
            required: true
            min_length: 3
            max_length: 20
            pattern: '^[a-zA-Z0-9_]+$'
          password:
            required: true
            min_length: 8
            complexity: true
    output:
      is_valid: '{{ $out.valid }}'
      errors: '{{ $out.errors }}'
      cleaned_data: '{{ $out.cleaned }}'

  # 4. 处理验证结果
  - name: 'handle-validation'
    switch:
      '{{ $node.validate-input.out.is_valid == true }}':
        name: 'valid-input'
        nodes:
          # 5. 检查邮箱唯一性
          - name: 'check-email-unique'
            process:
              name: 'user.check_email_unique'
              args: ['{{ $node.validate-input.out.cleaned_data.email }}']
            output:
              email_available: '{{ $out.available }}'

          # 6. 检查用户名唯一性
          - name: 'check-username-unique'
            process:
              name: 'user.check_username_unique'
              args: ['{{ $node.validate-input.out.cleaned_data.username }}']
            output:
              username_available: '{{ $out.available }}'

          # 7. 处理唯一性检查结果
          - name: 'handle-uniqueness'
            switch:
              '{{ $node.check-email-unique.out.email_available == true and $node.check-username-unique.out.username_available == true }}':
                name: 'unique-data'
                nodes:
                  # 8. 密码加密
                  - name: 'hash-password'
                    process:
                      name: 'security.hash_password'
                      args:
                        ['{{ $node.validate-input.out.cleaned_data.password }}']
                    output:
                      hashed_password: '{{ $out.hash }}'

                  # 9. 创建用户记录
                  - name: 'create-user'
                    process:
                      name: 'user.create'
                      args:
                        - '{{ $node.validate-input.out.cleaned_data.email }}'
                        - '{{ $node.validate-input.out.cleaned_data.username }}'
                        - '{{ $node.hash-password.out.hashed_password }}'
                        - '{{ now() }}'
                    output:
                      user_id: '{{ $out.user_id }}'
                      user_data: '{{ $out }}'

                  # 10. 生成验证令牌
                  - name: 'generate-verification-token'
                    process:
                      name: 'security.generate_token'
                      args:
                        - '{{ $node.create-user.out.user_id }}'
                        - 'email_verification'
                        - 3600 # 1小时过期
                    output:
                      token: '{{ $out.token }}'
                      expires_at: '{{ $out.expires_at }}'

                  # 11. 发送验证邮件
                  - name: 'send-verification-email'
                    process:
                      name: 'notification.send_email'
                      args:
                        - '{{ $node.validate-input.out.cleaned_data.email }}'
                        - 'email_verification'
                        - token: '{{ $node.generate-verification-token.out.token }}'
                          username: '{{ $node.validate-input.out.cleaned_data.username }}'
                          expires_at: '{{ $node.generate-verification-token.out.expires_at }}'
                    output:
                      email_sent: '{{ $out.sent }}'
                      message_id: '{{ $out.message_id }}'

                  # 12. 显示注册成功信息
                  - name: 'show-success'
                    ui: 'cli'
                    label: '注册成功！'
                    autofill:
                      value: |
                        🎉 注册成功！

                        用户ID：{{ $node.create-user.out.user_id }}
                        用户名：{{ $node.validate-input.out.cleaned_data.username }}
                        邮箱：{{ $node.validate-input.out.cleaned_data.email }}

                        📧 验证邮件已发送，请检查邮箱并点击链接激活账户。
                        验证链接有效期：1小时

                        如未收到邮件，请联系客服。
                      action: 'exit'

              default:
                name: 'not-unique'
                nodes:
                  - name: 'show-duplicate-error'
                    ui: 'cli'
                    label: '注册失败：'
                    autofill:
                      value: |
                        ❌ 注册失败

                        {{ $node.check-email-unique.out.email_available == false ? "• 该邮箱已被注册\n" : "" }}
                        {{ $node.check-username-unique.out.username_available == false ? "• 该用户名已被使用\n" : "" }}

                        请使用其他邮箱或用户名重新注册。
                      action: 'exit'

      default:
        name: 'invalid-input'
        nodes:
          - name: 'show-validation-errors'
            ui: 'cli'
            label: '输入验证失败：'
            autofill:
              value: |
                ❌ 输入验证失败

                错误详情：
                {{ join($node.validate-input.out.errors, '\n') }}

                请修正后重新输入。
                格式：邮箱,用户名,密码

                要求：
                • 邮箱：有效的邮箱地址
                • 用户名：3-20位字母数字下划线
                • 密码：至少8位，包含大小写字母和数字
              action: 'exit'

# 最终输出
output:
  registration_result: |
    {{
      $node.handle-validation.out.valid-input != null ? (
        $node.handle-validation.out.valid-input.unique-data != null ? {
          "status": "success",
          "user_id": $node.handle-validation.out.valid-input.unique-data.show-success.context.data.$node.create-user.out.user_id,
          "email": $node.handle-validation.out.valid-input.unique-data.show-success.context.data.$node.validate-input.out.cleaned_data.email,
          "message": "Registration successful"
        } : {
          "status": "failed",
          "reason": "duplicate",
          "message": "Email or username already exists"
        }
      ) : {
        "status": "failed", 
        "reason": "validation_error",
        "errors": $node.handle-validation.out.invalid-input.show-validation-errors.context.data.$node.validate-input.out.errors
      }
    }}
  timestamp: '{{ now() }}'
  session_id: '{{ $sid }}'
```

**使用方法：**

```bash
# 启动注册流程
yao run pipes.user-registration

# 模拟输入
# 输入格式：test@example.com,username,password123
```

### 6. 订单处理系统

```yaml
# order-processing.pip.yao
name: 'order-processing'
label: '订单处理系统'
description: '完整的电商订单处理流程'

whitelist:
  - 'order.*'
  - 'inventory.*'
  - 'payment.*'
  - 'shipping.*'
  - 'notification.*'

nodes:
  # 1. 接收订单
  - name: 'receive-order'
    input:
      - '{{ $global.order_data }}'
    process:
      name: 'order.validate'
      args: ['{{ $in[0] }}']
    output:
      is_valid: '{{ $out.valid }}'
      order_data: '{{ $out.order_data }}'
      errors: '{{ $out.errors }}'

  # 2. 库存检查
  - name: 'check-inventory'
    switch:
      '{{ $node.receive-order.out.is_valid == true }}':
        name: 'valid-order'
        nodes:
          - name: 'inventory-check'
            process:
              name: 'inventory.check_availability'
              args: ['{{ $node.receive-order.out.order_data.items }}']
            output:
              all_available: '{{ $out.all_available }}'
              unavailable_items: '{{ $out.unavailable_items }}'
              available_items: '{{ $out.available_items }}'

          # 3. 处理库存状态
          - name: 'handle-inventory'
            switch:
              '{{ $node.inventory-check.out.all_available == true }}':
                name: 'items-available'
                nodes:
                  # 4. 锁定库存
                  - name: 'reserve-inventory'
                    process:
                      name: 'inventory.reserve'
                      args:
                        - '{{ $node.inventory-check.out.available_items }}'
                        - '{{ $node.receive-order.out.order_data.id }}'
                    output:
                      reservation_id: '{{ $out.reservation_id }}'

                  # 5. 计算订单金额
                  - name: 'calculate-total'
                    process:
                      name: 'order.calculate_total'
                      args:
                        - '{{ $node.inventory-check.out.available_items }}'
                        - '{{ $node.receive-order.out.order_data.shipping_method }}'
                    output:
                      subtotal: '{{ $out.subtotal }}'
                      shipping_cost: '{{ $out.shipping_cost }}'
                      tax: '{{ $out.tax }}'
                      total: '{{ $out.total }}'
                      currency: '{{ $out.currency }}'

                  # 6. 支付处理
                  - name: 'process-payment'
                    prompts:
                      - role: 'system'
                        content: '你是一个支付处理助手，请协助处理订单支付'
                      - role: 'user'
                        content: |
                          订单信息：
                          订单ID：{{ $node.receive-order.out.order_data.id }}
                          金额：{{ $node.calculate-total.out.total }} {{ $node.calculate-total.out.currency }}

                          请选择支付方式：
                          1. 信用卡
                          2. 支付宝
                          3. 微信支付
                          4. 银行转账
                    ui: 'cli'
                    label: '请选择支付方式：'
                    output:
                      payment_method: '{{ $out[0] }}'

                  - name: 'execute-payment'
                    process:
                      name: 'payment.process'
                      args:
                        - '{{ $node.calculate-total.out.total }}'
                        - '{{ $node.process-payment.out.payment_method }}'
                        - '{{ $node.receive-order.out.order_data }}'
                    output:
                      payment_id: '{{ $out.payment_id }}'
                      payment_status: '{{ $out.status }}'
                      transaction_id: '{{ $out.transaction_id }}'

                  # 7. 处理支付结果
                  - name: 'handle-payment-result'
                    switch:
                      "{{ $node.execute-payment.out.payment_status == 'success' }}":
                        name: 'payment-success'
                        nodes:
                          # 8. 确认库存扣减
                          - name: 'confirm-inventory-deduction'
                            process:
                              name: 'inventory.confirm_deduction'
                              args:
                                [
                                  '{{ $node.reserve-inventory.out.reservation_id }}'
                                ]
                            output:
                              deduction_confirmed: '{{ $out.confirmed }}'

                          # 9. 创建发货单
                          - name: 'create-shipment'
                            process:
                              name: 'shipping.create_shipment'
                              args:
                                - '{{ $node.receive-order.out.order_data }}'
                                - '{{ $node.inventory-check.out.available_items }}'
                            output:
                              shipment_id: '{{ $out.shipment_id }}'
                              tracking_number: '{{ $out.tracking_number }}'
                              estimated_delivery: '{{ $out.estimated_delivery }}'

                          # 10. 更新订单状态
                          - name: 'update-order-status'
                            process:
                              name: 'order.update_status'
                              args:
                                - '{{ $node.receive-order.out.order_data.id }}'
                                - 'paid'
                                - payment_id: '{{ $node.execute-payment.out.payment_id }}'
                                  shipment_id: '{{ $node.create-shipment.out.shipment_id }}'
                            output:
                              order_status: '{{ $out.status }}'
                              updated_at: '{{ $out.updated_at }}'

                          # 11. 发送确认通知
                          - name: 'send-confirmation'
                            process:
                              name: 'notification.send_order_confirmation'
                              args:
                                - '{{ $node.receive-order.out.order_data.customer_email }}'
                                - '{{ $node.receive-order.out.order_data }}'
                                - '{{ $node.create-shipment.out }}'
                                - '{{ $node.calculate-total.out }}'
                            output:
                              notification_sent: '{{ $out.sent }}'
                              message_id: '{{ $out.message_id }}'

                          # 12. 显示成功信息
                          - name: 'show-order-success'
                            ui: 'cli'
                            label: '订单处理成功！'
                            autofill:
                              value: |
                                🛒 订单处理成功！

                                订单号：{{ $node.receive-order.out.order_data.id }}
                                支付金额：{{ $node.calculate-total.out.total }} {{ $node.calculate-total.out.currency }}
                                支付方式：{{ $node.process-payment.out.payment_method }}
                                交易号：{{ $node.execute-payment.out.transaction_id }}

                                📦 发货信息：
                                发货单号：{{ $node.create-shipment.out.shipment_id }}
                                快递单号：{{ $node.create-shipment.out.tracking_number }}
                                预计送达：{{ $node.create-shipment.out.estimated_delivery }}

                                📧 确认邮件已发送至：{{ $node.receive-order.out.order_data.customer_email }}

                                感谢您的购买！
                              action: 'exit'

                      default:
                        name: 'payment-failed'
                        nodes:
                          # 释放库存
                          - name: 'release-inventory'
                            process:
                              name: 'inventory.release'
                              args:
                                [
                                  '{{ $node.reserve-inventory.out.reservation_id }}'
                                ]

                          # 更新订单状态为支付失败
                          - name: 'update-payment-failed'
                            process:
                              name: 'order.update_status'
                              args:
                                - '{{ $node.receive-order.out.order_data.id }}'
                                - 'payment_failed'
                                - payment_error: '{{ $node.execute-payment.out.payment_status }}'
                            output:
                              order_status: '{{ $out.status }}'

                          - name: 'show-payment-error'
                            ui: 'cli'
                            label: '支付失败：'
                            autofill:
                              value: |
                                ❌ 支付失败

                                错误原因：{{ $node.execute-payment.out.payment_status }}
                                订单状态：{{ $node.update-payment-failed.out.order_status }}

                                库存已释放，您可以重新尝试支付。
                              action: 'exit'

              default:
                name: 'items-unavailable'
                nodes:
                  - name: 'show-inventory-error'
                    ui: 'cli'
                    label: '库存不足：'
                    autofill:
                      value: |
                        ❌ 库存不足

                        以下商品库存不足：
                        {{ join($node.inventory-check.out.unavailable_items, '\n') }}

                        可购买商品：
                        {{ join($node.inventory-check.out.available_items.map(#item => `${#item.name} x ${#item.quantity}`), '\n') }}

                        请调整订单后重新提交。
                      action: 'exit'

      default:
        name: 'invalid-order'
        nodes:
          - name: 'show-validation-error'
            ui: 'cli'
            label: '订单验证失败：'
            autofill:
              value: |
                ❌ 订单验证失败

                错误信息：
                {{ join($node.receive-order.out.errors, '\n') }}

                请检查订单信息后重新提交。
              action: 'exit'

# 最终输出
output:
  order_result: '{{ $node.receive-order.out.is_valid ? ($node.handle-inventory.out.valid-order != null ? ($node.handle-inventory.out.valid-order.items-available != null ? ($node.handle-inventory.out.valid-order.items-available.handle-payment-result.out.payment-success != null ? { "status": "success", "order_id": $node.handle-inventory.out.valid-order.items-available.handle-payment-result.out.payment-success.show-order-success.context.data.$node.receive-order.out.order_data.id, "shipment_id": $node.handle-inventory.out.valid-order.items-available.handle-payment-result.out.payment-success.show-order-success.context.data.$node.create-shipment.out.shipment_id } : { "status": "payment_failed", "order_id": $node.handle-inventory.out.valid-order.items-available.handle-payment-result.out.payment-failed.show-payment-error.context.data.$node.receive-order.out.order_data.id }) : { "status": "inventory_unavailable", "unavailable_items": $node.handle-inventory.out.valid-order.items-available.show-inventory-error.context.data.$node.inventory-check.out.unavailable_items }) : { "status": "invalid_order", "errors": $node.handle-inventory.out.invalid-order.show-validation-error.context.data.$node.receive-order.out.errors }) : { "status": "invalid_order", "errors": $node.receive-order.out.errors }}'
  processing_summary:
    started_at: '{{ now() }}'
    session_id: '{{ $sid }}'
    order_id: "{{ $node.receive-order.out.order_data.id ?? 'N/A' }}"
```

**使用方法：**

```bash
# 创建测试订单数据
order_data='{
  "id": "ORD-2024001",
  "customer_email": "customer@example.com",
  "items": [
    {"product_id": "P001", "name": "商品A", "quantity": 2, "price": 99.99},
    {"product_id": "P002", "name": "商品B", "quantity": 1, "price": 199.99}
  ],
  "shipping_method": "standard"
}'

# 运行订单处理
yao run pipe.CreateWith "$(cat order-processing.pip.yao)" "{\"order_data\": $order_data}"
```

## 高级示例

### 7. 多语言智能客服

```yaml
# smart-customer-service.pip.yao
name: 'smart-customer-service'
label: '多语言智能客服'
description: '基于 AI 的智能客服系统，支持多语言和多种服务类型'

whitelist:
  - 'ai.*'
  - 'customer.*'
  - 'knowledge.*'
  - 'translation.*'
  - 'ticket.*'

nodes:
  # 1. 欢迎界面
  - name: 'welcome'
    ui: 'cli'
    label: |
      🤖 智能客服系统

      请选择服务类型：
      1. 产品咨询
      2. 技术支持
      3. 订单问题
      4. 账户问题
      5. 投诉建议
      0. 人工客服

      请输入数字选择：
    output:
      service_type: '{{ $out[0] }}'

  # 2. 语言检测和选择
  - name: 'language-setup'
    ui: 'cli'
    label: |
      🌐 语言设置 / Language

      请选择语言 / Please select language：
      1. 中文
      2. English
      3. 日本語
      4. Français
      5. Español

      请输入数字选择：
    output:
      language_code: "{{ $out[0] == '1' ? 'zh' : ($out[0] == '2' ? 'en' : ($out[0] == '3' ? 'ja' : ($out[0] == '4' ? 'fr' : 'es')))}"
      language_name: "{{ $out[0] == '1' ? '中文' : ($out[0] == '2' ? 'English' : ($out[0] == '3' ? '日本語' : ($out[0] == '4' ? 'Français' : 'Español')))}"

  # 3. 获取用户信息
  - name: 'get-user-info'
    ui: 'cli'
    label: |
      👤 用户信息

      请输入您的邮箱或手机号（可选）：
    output:
      user_contact: '{{ $out[0] }}'

  # 4. 查询用户历史
  - name: 'lookup-user-history'
    switch:
      "{{ $node.get-user-info.out.user_contact != null and $node.get-user-info.out.user_contact != '' }}":
        name: 'has-contact'
        nodes:
          - name: 'search-user'
            process:
              name: 'customer.search_by_contact'
              args: ['{{ $node.get-user-info.out.user_contact }}']
            output:
              user_found: '{{ $out.found }}'
              user_data: '{{ $out.user_data }}'
              recent_tickets: '{{ $out.recent_tickets }}'

      default:
        name: 'no-contact'
        output:
          user_found: false
          user_data: {}
          recent_tickets: []

  # 5. 主要对话处理
  - name: 'main-dialog'
    switch:
      "{{ $node.welcome.out.service_type == '5' }}":
        name: 'human-agent'
        nodes:
          - name: 'transfer-to-human'
            ui: 'cli'
            label: |
              📞 正在为您转接人工客服...

              预计等待时间：3-5分钟
              请保持在线，客服人员将尽快为您服务。
            autofill:
              value: |
                🎫 人工客服请求已创建
                工单号：{{ $now().Unix() }}
                等待位置：队列第{{ $global.queue_position ?? 3 }}位

                如需紧急服务，请拨打客服热线：400-123-4567
              action: 'exit'

      default:
        name: 'ai-service'
        nodes:
          # 6. 获取用户问题描述
          - name: 'get-problem-description'
            ui: 'cli'
            label: |
              💬 请详细描述您的问题：

              （支持文字输入，建议包含以下信息）
              • 问题发生的具体时间
              • 相关的产品或服务名称
              • 问题现象的详细描述
              • 您期望的解决方案
            output:
              problem_description: '{{ $out[0] }}'

          # 7. 智能分析和回复
          - name: 'ai-analysis'
            prompts:
              - role: 'system'
                content: |
                  你是一个专业的AI客服助手，请根据用户提供的信息进行分析和回复。

                  当前服务类型：{{ $node.welcome.out.service_type == '1' ? '产品咨询' : ($node.welcome.out.service_type == '2' ? '技术支持' : ($node.welcome.out.service_type == '3' ? '订单问题' : ($node.welcome.out.service_type == '4' ? '账户问题' : '其他')) }}
                  用户语言：{{ $node.language-setup.out.language_name }}

                  {{ $node.lookup-user-history.out.user_found == true ? `用户历史信息：${$json($node.lookup-user-history.out.user_data)} 最近工单：${$json($node.lookup-user-history.out.recent_tickets)}` : '新用户' }}

                  回复要求：
                  1. 使用{{ $node.language-setup.out.language_name }}回复
                  2. 语气友好专业
                  3. 针对具体问题提供解决方案
                  4. 如果无法解决，建议升级到人工客服
                  5. 提供相关的帮助链接或联系方式

              - role: 'user'
                content: |
                  服务类型：{{ $node.welcome.out.service_type }}
                  用户联系方式：{{ $node.get-user-info.out.user_contact ?? '未提供' }}
                  问题描述：{{ $node.get-problem-description.out.problem_description }}

                  请分析并回复。
            model: 'gpt-4'
            options:
              temperature: 0.3
              max_tokens: 1500
            output:
              ai_response: '{{ $out.choices[0].message.content }}'
              analysis_result: '{{ $out.choices[0].message.content }}'

          # 8. 知识库查询
          - name: 'knowledge-search'
            process:
              name: 'knowledge.search'
              args:
                - '{{ $node.get-problem-description.out.problem_description }}'
                - '{{ $node.language-setup.out.language_code }}'
                - '{{ $node.welcome.out.service_type }}'
            output:
              knowledge_results: '{{ $out.results }}'
              relevant_articles: '{{ $out.articles }}'

          # 9. 生成增强回复
          - name: 'enhanced-response'
            prompts:
              - role: 'system'
                content: |
                  基于AI分析和知识库查询结果，生成更准确和详细的回复。

                  AI分析：{{ $node.ai-analysis.out.ai_response }}
                  知识库结果：{{ $json($node.knowledge-search.out.knowledge_results) }}

                  请生成最终的客服回复，包含：
                  1. 问题确认和理解
                  2. 具体解决方案
                  3. 相关资源链接
                  4. 后续跟进建议
              - role: 'assistant'
                content: '基于AI分析和知识库，我将为您提供详细的解决方案。'
            model: 'gpt-4'
            options:
              temperature: 0.2
              max_tokens: 2000
            output:
              final_response: '{{ $out.choices[0].message.content }}'
              solution_type: "{{ $out.choices[0].message.content.contains('解决') ? 'resolved' : 'escalated' }}"

          # 10. 显示回复
          - name: 'show-response'
            ui: 'cli'
            label: |
              🤖 AI客服回复
            autofill:
              value: |
                {{ $node.enhanced-response.out.final_response }}

                ──────────────────────────────────
                📊 服务统计
                服务类型：{{ $node.welcome.out.service_type == '1' ? '产品咨询' : ($node.welcome.out.service_type == '2' ? '技术支持' : ($node.welcome.out.service_type == '3' ? '订单问题' : ($node.welcome.out.service_type == '4' ? '账户问题' : '其他')) }}
                处理时间：{{ now().Format('15:04:05') }}
                语言：{{ $node.language-setup.out.language_name }}

                {{ $node.enhanced-response.out.solution_type == 'escalated' ? '⚠️ 如需进一步协助，请回复 "转人工" 联系人工客服。' : '✅ 问题已解决，如还有疑问请继续提问。' }}
              action: 'exit'

  # 11. 创建服务记录
  - name: 'create-service-record'
    process:
      name: 'ticket.create'
      args:
        - '{{ $node.get-user-info.out.user_contact }}'
        - '{{ $node.welcome.out.service_type }}'
        - '{{ $node.get-problem-description.out.problem_description }}'
        - '{{ $node.enhanced-response.out.final_response }}'
        - language: '{{ $node.language-setup.out.language_code }}'
          user_found: '{{ $node.lookup-user-history.out.user_found }}'
          ai_response: '{{ $node.ai-analysis.out.ai_response }}'
          knowledge_used: '{{ $node.knowledge-search.out.knowledge_results }}'
    output:
      ticket_id: '{{ $out.ticket_id }}'
      created_at: '{{ $out.created_at }}'

# 最终输出
output:
  service_result:
    service_type: '{{ $node.welcome.out.service_type }}'
    language: '{{ $node.language-setup.out.language_code }}'
    user_contact: '{{ $node.get-user-info.out.user_contact }}'
    problem_description: '{{ $node.get-problem-description.out.problem_description }}'
    ai_response: '{{ $node.enhanced-response.out.final_response }}'
    solution_type: '{{ $node.enhanced-response.out.solution_type }}'
    ticket_id: '{{ $node.create-service-record.out.ticket_id }}'

  session_summary:
    session_id: '{{ $sid }}'
    start_time: '{{ now() }}'
    user_found: '{{ $node.lookup-user-history.out.user_found }}'
    knowledge_search_results: '{{ $node.knowledge-search.out.knowledge_results }}'
```

**使用方法：**

```bash
# 启动智能客服
yao run pipes.smart-customer-service

# 或者预设置用户信息
yao run pipe.CreateWith "$(cat smart-customer-service.pip.yao)" '{"queue_position": 2}'
```

这些示例展示了 Pipe 的各种应用场景，从简单的数据处理到复杂的业务流程，从基础的 AI 集成到智能客服系统。您可以根据这些示例作为参考，开发适合自己业务需求的 Pipe 应用。
