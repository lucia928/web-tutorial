# 常见问题

## **interface和type的对比**

`interface`和`type`都用于定义类型，但它们之间存在一些不同之处：

### 定义和语法
- **interface**：使用`interface`关键字来定义对象类型，它只能定义对象类型（包括函数类型、类类型等特殊对象类型）。
```typescript
interface Person {
    name: string;
    age: number;
}
```
- **type**：使用`type`关键字，它的定义更加灵活，可以定义各种类型，包括基本类型、联合类型、交叉类型等。
```typescript
type PersonType = {
    name: string;
    age: number;
};
```

### 特性对比
| 对比项       | interface                                   | type                                           |
| ------------ | ------------------------------------------- | ---------------------------------------------- |
| 扩展方式     | 可以使用`extends`关键字进行扩展，支持多继承 | 可以使用`&`运算符实现交叉类型扩展              |
| 重复定义     | 可以多次定义同一个`interface`并且合并       | 不能重复定义相同名称的`type`                   |
| 定义类型范围 | 主要用于定义对象类型、函数类型、类类型等    | 可以定义基本类型、联合类型、元组类型等任意类型 |
| 别名使用     | 没有别名的概念                              | 可以为基本类型创建别名                         |

### 代码示例
```typescript
// interface扩展
interface Animal {
    type: string;
}
interface Dog extends Animal {
    bark(): void;
}

// interface重复定义
interface User {
    name: string;
}
interface User {
    age: number;
}
// 此时User包含name和age属性

// ---------------------------------------------

// type扩展
type Color = "red" | "blue";
type Size = "big" | "small";
type ColorfulSize = Color & Size;

// type重复定义会报错
type Point = {
    x: number;
};
// 下面这行代码会报错
// type Point = {
//     y: number;
// };

//type 支持映射类型，允许基于一个已知的类型创建新的类型
type Keys = keyof T;
```

## **any和unknown**的对比

| 对比项   | any                            | unknown                                |
| -------- | ------------------------------ | -------------------------------------- |
| 类型检查 | 禁用类型检查                   | 保留类型检查，操作前需类型断言或者检查 |
| 安全性   | 不安全，容易引入运行错误       | 安全，强制显式处理类型                 |
| 使用场景 | 快速绕过类型检查，临时解决方案 | 需要动态类型，但仍需确保类型安全的场景 |
| 推荐程度 | 不推荐过度使用                 | 推荐使用                               |

### 代码示例

``` ts
let value:any = 'hello';
// 可以重新赋值为任意类型
value = 18;
// 不会报错，即使value可能是字符串
value.toFixed(2);
// 不会报错，即使value可能不是函数
value();

// ---------------------------------------------

let value:unknown = 'hello';
// 可以重新赋值为任意类型
value = 18;
// 报错
value.toFixed(2);

// 需要先进行类型检查
if (typeof value === 'number') {
    // 安全
    value.toFixed(2);
}

// 或者使用类型断言
(value as number).toFixed(2);
```

## **never和void的对比**

| 对比项     | void          | never              |
| ---------- | ------------- | ------------------ |
| 函数执行   | 会执行完成    | 永不完成           |
| 返回值     | undefined     | 无返回值           |
| 后续代码   | 会继续执行    | 不会执行           |
| 类型兼容性 | 可以赋值给any | 是所有类型的子类型 |

### 代码示例

``` ts
// 基本用法
function logMessage(message: string): void {
  console.log(message);
}

// 显式返回 undefined
function doNothing(): void {
  return undefined;
}

// 箭头函数
const logError = (error: Error): void => {
  console.error(error);
};

// ---------------------------------------------
// 抛出异常
function throwError(message: string): never {
  throw new Error(message);
}

// 无限循环
function infiniteLoop(): never {
  while (true) {
    // do something
  }
}
```

