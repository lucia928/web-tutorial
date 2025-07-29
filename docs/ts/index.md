# TS是什么
- `TS`是`JS`的超集，是为大型应用开发而设计的语言，支持`ES6语法`，支持面向对象编程的概念（类、接口、继承、泛型等）。
- 是一种静态类型检查的语言，提供了类型注解，在代码编译阶段就可以检查出数据类型的错误。
- 拓展了`JS语法`，`JS程序`可以不改变任何东西地在`TS`下工作。
- 为了保证兼容性，`TS`需要在编译阶段需要编译器编译成`JS`来运行。

## 特性

- **类型批注和编译时类型检查：** 在编译时批注变量类型。
- **类型推断：** 没有批注变量类型会自动推断变量的类型。
- **类型擦除：** 在编译过程中批注的内容和接口会在运行前利用工具擦除。
- **接口：** 用来定义对象类型。
- **枚举：** 用于取值被限制在一定范围内的场景。
- **Mixin：** 可以接受任意类型的值。
- **泛型：** 使用接口、函数、类时去指定类型。
- **名字空间：** 不同区域可以重复命名。
- **元组：** 合并了不同类型的对象，相当于一个可以装不同类型数据的数组。

## 数据类型

- boolean
- number
- string
- enum
- null
- undefined
- void
- never
- any
- unknown
- object
- array
- tuple

## 高级类型

- 交叉类型（&）
- 联合类型（|）
- 类型别名（type）
- 类型索引（keyof）
- 类型约束（extend）
- 映射类型（in）
- 条件类型（三元表达式）

## 内置工具类型

- 属性修饰类

  - Partial（将某个类型的所有属性变为可选的）

  - Required（将某个类型的所有属性变为必选的）

  - Readonly（将某个类型的所有属性变为只读的）

- 属性筛选类
  - Pick（从某个类型中挑选一些属性来构造一个新的类型）
  - Omit（从某个类型中排除一些属性来构造一个新的类型）
- 类型过滤类
  - Exclude（从联合类型中排除某些成员）
  - Extract（从联合类型中提取某些成员）
  - NoNullable（从联合类型中排除null和undefined）
- 类型推导类
  - ConstructorParameter（获取构造函数的参数类型）
  - InstanceType（获取构造函数的返回类型）
  - ReturnType（获取函数的返回值类型）
- 创建类
  - Record（创建一个对象类型，其属性键来自一个联合类型，且属性值都是相同类型）

``` ts
interface Person {
    name: string;
    age: number;
    sex: string;
}

type PartialPerson = Partial<Person>;
type RequiredPerson = Required<PartialPerson>;
type ReadonlyPerson = Readonly<Person>;

type PickedPerson = Pick<Person, 'name' | 'age'>;
type OmittedPerson = Omit<Person, 'age'>;

type PersonRecord = Record<OmittedPerson, string>;

type T = Exclude<RequiredPerson, 'sex'>; // 'name' | 'age'
type U = Extract<RequiredPerson, 'name' | 'age'>; // 'name' | 'age'
type MaybeString = string | null | undefined;
type DefiniteString = NoNullable<MaybeString>;

class ExampleClass {
	constructor(public name: string, public age: number) {}
}
type Params = ConstructorParameters<typeof ExampleClass>;                                   
type ExampleInstance = InstanceType<typeof ExampleClass>;
type Return = ReturnType<() => string>;
```

## 索引类型

索引类型是一种高级类型，它允许我们通过索引来访问对象的属性或数组的元素。索引类型主要有两种：字符串索引和数字索引。

- 字符串索引类型：允许使用字符串作为键来访问对象的属性。
- 数字索引类型：允许使用数字作为键来访问数组的元素

``` ts
interface StudentObject {
	[key: string]: number;
}

let studentObj: StudentObject = {};
studentObj['Bob'] = 1;
studentObj['Fred'] = 2;


interface StudentArray {
	[index: number]: string;
}

let studentArr: StudentArray = ["Bob", "Fred"];
let student1: string = studentArr[0]; // 'Bob'
let student2: string = studentArr[1]; // 'Fred'


// 两种索引类型同时使用，数字索引的值类型必须是字符串索引值类型的子类型
// 这是因为在 JavaScript 中，对象的键名一律为字符串，数组的索引实际上也是字符串
interface CombindIndexExample {
    [index: number]: number;
    [key: string]: number | string;
}

let combind: CombindIndexExample = {
    0: 0,
    prop: 'prop',
}
```

