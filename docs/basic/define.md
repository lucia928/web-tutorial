# 变量声明

## 三种方式

### var

在ES5中，顶级对象的属性和全局变量是等价的，用`var`声明的变量即是全局变量，也是顶层变量

注意：顶层对象，在浏览器环境指得是`window`对象，在`Node`指的是`global`对象

``` javascript
var a = 10;
console.log(window.a); // 10
```

使用`var`声明的变量存在变量提升的情况，在编译阶段，编译器会将声明提到最前面执行

``` javascript
console.log(a); // undefined
var a = 10;

// 等同以下代码，可以先声明，后赋值
var a;
console.log(a);
a = 10;
```

可以使用`var`对一个变量进行多次声明，后面声明的变量会覆盖前面的变量声明

``` javascript
var a = 10;
var a = 20;
console.log(a); // 20
```

使用`var`声明的变量具有函数作用域，在函数中使用`var`声明变量时，该变量是局部的，而如果在函数内不使用`var`该变量是全局的

``` javascript
var a = 10;
function change() {
    var a = 20;
    console.log(a); // 20
}
change();
console.log(a); // 10

// 函数内不使用var
var a = 10;
function change() {
    a = 20;
    console.log(a); // 20
}
change();
console.log(a); // 20
```

### let

`let`是`ES6`新增的声明方式，所声明的变量具有块级作用域，只在声明所在的代码块内有效

``` javascript
if (xxx) {
    let a = 10;
    console.log(a);  // 10
}
console.log(a);  // Uncaught ReferenceError: a is not defined
```

不存在变量提升的情况，在`let`声明变量前，该变量是不可用的，也就是“暂时性死区”

``` javascript
console.log(a);  // Uncaught ReferenceError: a is not defined
let a = 10;
```

`let`不允许在相同作用域中重复声明

``` javascript
let a = 10;
let a = 20; // Uncaught SyntaxError: Identifier 'a' has already been declared

// 不能在函数内部重新用let声明参数
function func(arg) {
    let arg;
}
func(); // Uncaught SyntaxError: Identifier 'arg' has already been declared

// 以下情况不会报错
let a = 10;
if (xxx) {
    let a = 20;
}
```

### const

`const`也是`ES6`新增的声明方式，与`let`一样具有块级作用域，不存在变量提升，不允许重复声明

此外声明的常量是只读的，一旦声明必须立即初始化，且不能重新赋值

``` javascript
const a = 10;
a = 20; // Uncaught TypeError: Assignment to constant variable

const b; // Uncaught SyntaxError: Missing initializer in const declaration
```

`const`实际上保证的并不是变量的值不能改动，而是变量指向的内存地址所保存的数据不能改变;对于引用类型的数据，变量指向的内存地址保存的实际上是堆地址，`const`只能保证这个堆地址是固定的，并不能确保堆地址中保存的数据不可变

``` javascript
const str = 1;
str = 2; // Uncaught TypeError: Assignment to constant variable

const obj = {};

// 为 obj 添加一个属性，可以成功
obj.prop = 123;
obj.prop // 123

// 将 obj 指向另一个对象，就会报错
obj = {}; // Uncaught TypeError: Assignment to constant variable
```

## 区别

| 声明方式 | 变量提升 | 重复声明 | 暂时性死区 | 块级作用域 | 修改变量 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| `var` | √ | √ | × | × | √ |
| `let` | × | × | √ | √ | √ |
| `const` | × | × | √ | √ | × |

## 拓展

`块级作用域：`通过词法环境的嵌套结构实现，每个代码块（if/for/while等）会创建新的词法环境，变量查找会从当前环境向外层查找

`暂时性死区（TDZ）：`变量在声明前不可访问的机制，变量从进入作用域到声明语句执行前都处于TDZ，访问TDZ中的变量会抛出ReferenceError

`不可重复声明：`同一作用域内对于同一标识符的let/const声明只能出现一次，引擎会在语法分析阶段检查重复声明

`常量不可修改：`当使用 const 声明变量时，引擎会在当前执行上下文的词法环境中创建一个绑定，标记为"不可变"；在代码编译阶段，引擎会检查是否有对 const 变量的重新赋值，如果有，会直接抛出语法错误（SyntaxError）；在代码执行阶段，当尝试修改 const 变量时，引擎会检查绑定标志，如果绑定被标记为不可变，会抛出类型错误（TypeError）