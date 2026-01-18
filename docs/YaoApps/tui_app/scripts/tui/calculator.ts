/**
 * 计算器应用示例脚本
 * 演示如何在 TUI 中使用 JavaScript/TypeScript 脚本进行数学计算
 */

/**
 * 添加数字到当前输入
 * @param {Object} ctx - TUI 上下文对象
 * @param {string|number} digit - 要添加的数字
 */
export function addDigit(ctx, digit) {
  if (!ctx.tui) {
    console.log('addDigit called without TUI context');
    return;
  }

  const currentInput = ctx.tui.GetState('input') || '0';
  let newInput = currentInput;

  if (currentInput === '0' || currentInput === 'Error') {
    newInput = String(digit);
  } else {
    newInput = currentInput + digit;
  }

  ctx.tui.SetState('input', newInput);
  console.log(`Added digit: ${digit}, current input: ${newInput}`);
}

/**
 * 添加运算符
 * @param {Object} ctx - TUI 上下文对象
 * @param {string} operator - 运算符 (+, -, *, /)
 */
export function addOperator(ctx, operator) {
  if (!ctx.tui) {
    console.log('addOperator called without TUI context');
    return;
  }

  const currentInput = ctx.tui.GetState('input') || '0';
  const currentOperator = ctx.tui.GetState('operator');
  const previousValue = ctx.tui.GetState('previousValue');

  // 如果已经有运算符，先计算结果
  if (currentOperator && previousValue !== undefined) {
    calculateResult(ctx);
  }

  ctx.tui.SetState('previousValue', parseFloat(currentInput));
  ctx.tui.SetState('operator', operator);
  ctx.tui.SetState('input', '0');

  console.log(`Set operator: ${operator}, previous value: ${currentInput}`);
}

/**
 * 计算结果
 * @param {Object} ctx - TUI 上下文对象
 */
export function calculateResult(ctx) {
  if (!ctx.tui) {
    console.log('calculateResult called without TUI context');
    return;
  }

  try {
    const currentValue = parseFloat(ctx.tui.GetState('input') || '0');
    const previousValue = ctx.tui.GetState('previousValue');
    const operator = ctx.tui.GetState('operator');

    if (previousValue === undefined || operator === undefined) {
      return;
    }

    let result;
    switch (operator) {
      case '+':
        result = previousValue + currentValue;
        break;
      case '-':
        result = previousValue - currentValue;
        break;
      case '*':
        result = previousValue * currentValue;
        break;
      case '/':
        if (currentValue === 0) {
          throw new Error('Division by zero');
        }
        result = previousValue / currentValue;
        break;
      default:
        throw new Error('Unknown operator');
    }

    ctx.tui.SetState('input', String(result));
    ctx.tui.SetState('previousValue', undefined);
    ctx.tui.SetState('operator', undefined);

    console.log(
      `Calculated result: ${previousValue} ${operator} ${currentValue} = ${result}`
    );
  } catch (error) {
    console.error('Calculation error:', error.message);
    ctx.tui.SetState('input', 'Error');
    ctx.tui.SetState('previousValue', undefined);
    ctx.tui.SetState('operator', undefined);
  }
}

/**
 * 清除所有内容
 * @param {Object} ctx - TUI 上下文对象
 */
export function clearAll(ctx) {
  if (!ctx.tui) {
    console.log('clearAll called without TUI context');
    return;
  }

  ctx.tui.UpdateState({
    input: '0',
    previousValue: undefined,
    operator: undefined,
    memory: 0
  });

  console.log('Calculator cleared');
}

/**
 * 添加小数点
 * @param {Object} ctx - TUI 上下文对象
 */
export function addDecimal(ctx) {
  if (!ctx.tui) {
    console.log('addDecimal called without TUI context');
    return;
  }

  const currentInput = ctx.tui.GetState('input') || '0';

  // 检查当前输入是否已有小数点
  if (!currentInput.includes('.')) {
    const newInput = currentInput + '.';
    ctx.tui.SetState('input', newInput);
    console.log(`Added decimal point: ${newInput}`);
  }
}

/**
 * 内存加法
 * @param {Object} ctx - TUI 上下文对象
 */
export function memoryAdd(ctx) {
  if (!ctx.tui) {
    console.log('memoryAdd called without TUI context');
    return;
  }

  const currentInput = parseFloat(ctx.tui.GetState('input') || '0');
  const currentMemory = ctx.tui.GetState('memory') || 0;
  const newMemory = currentMemory + currentInput;

  ctx.tui.SetState('memory', newMemory);
  console.log(`Added to memory: ${currentInput}, memory now: ${newMemory}`);
}

/**
 * 内存减法
 * @param {Object} ctx - TUI 上下文对象
 */
export function memorySubtract(ctx) {
  if (!ctx.tui) {
    console.log('memorySubtract called without TUI context');
    return;
  }

  const currentInput = parseFloat(ctx.tui.GetState('input') || '0');
  const currentMemory = ctx.tui.GetState('memory') || 0;
  const newMemory = currentMemory - currentInput;

  ctx.tui.SetState('memory', newMemory);
  console.log(
    `Subtracted from memory: ${currentInput}, memory now: ${newMemory}`
  );
}

/**
 * 内存读取
 * @param {Object} ctx - TUI 上下文对象
 */
export function memoryRecall(ctx) {
  if (!ctx.tui) {
    console.log('memoryRecall called without TUI context');
    return;
  }

  const memoryValue = ctx.tui.GetState('memory') || 0;
  ctx.tui.SetState('input', String(memoryValue));

  console.log(`Recalled from memory: ${memoryValue}`);
}

/**
 * 内存清除
 * @param {Object} ctx - TUI 上下文对象
 */
export function memoryClear(ctx) {
  if (!ctx.tui) {
    console.log('memoryClear called without TUI context');
    return;
  }

  ctx.tui.SetState('memory', 0);
  console.log('Memory cleared');
}
