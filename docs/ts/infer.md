# infer 关键字

用于类型推断，常与条件类型配合使用，用于从复杂类型中提取嵌套的类型信息。核心作用是“捕获”类型中的某一部分，以便在条件类型的分支中复用。

## 基本用法

当T符合“某种类型结构”时，infer会自动捕获该结构中对应位置的类型，并将其赋值给一个“类型变量”，随后可以在条件类型的“真分支”中使用这个捕获的类型。

``` TS
type 条件类型<T> = T extends 某种类型结构<infer 提取的类型变量> ? 提取的类型变量 : 其他类型
```

## 常见场景示例

- 提取函数的返回值类型

``` ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function add(a: number, b: number) {
    return a + b
}

// 当T是一个函数时，infer R捕获函数的返回值类型，赋值给R，最终ReturnType<T>就是R
type addReturn = ReturnType<typeof add> // number
```

- 提取数组的元素类型

``` ts
type ElementType<T> = T extends Array<infer E> ? E : never

type Arr = number[]
type EType = ElementType<Arr> // number
```

- 提取Promise的resolve类型

``` ts
type PromiseType<T> = T extends Promise<infer P> ? P : T

type P = Promise<string>
type ResolveType = PromiseType<P> // string
```

- 提取元组的第一个元素类型

``` ts
type FirstElement<T> = T extends [infer F, ...any[]] ? F : never

type Tuple = [string, number, boolean]
type First = FirstElement<Tuple> // string
```

- 递归提取，复杂类型（如嵌套数组、嵌套Promise）可以通过递归结合infer提取深层类型

``` ts
type DeepPromiseType<T> = T extends Promise<infer P> ? DeepPromiseType<P> : T

type NestedP = Promise<Promise<number>>
type DeepType = DeepPromiseType<NestedP> // number
```

## 注意事项

- 仅在条件类型中使用：infer只能出现在条件类型中的extends字句中，不能在其他地方单独使用。

- 非唯一匹配时的处理：如果infer捕获的类型可能有多种情况（比如函数重载），会优先选择最宽泛的类型。