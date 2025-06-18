# this关键字

## 定义

`this` 关键字被自动定义在所有函数的作用域中，只能在函数内部使用，指向调用它的对象。

## 绑定规则

### 默认绑定

直接使用不带任何修饰符的函数引用进行调用；严格模式下，不能将全局对象用于默认绑定，this会绑定到`undefined`，只有函数运行在非严格模式下，默认绑定才能绑定到全局对象。

``` js
// 非严格模式
function foo() {
    console.log(this.a);
}

var a = 18;

foo(); // 18


// 严格模式
"use strict"
function foo() {
    console.log(this.a);
}

var a = 18;

foo(); // VM10846:3 Uncaught TypeError: Cannot read properties of undefined (reading 'a') at foo


// 虽然this的绑定规则完全取决与调用位置，但是只有foo()运行在非严格模式下时，this才能默认绑定到全局对象
// 在严格模式下调用foo()不影响默认绑定
function foo() {
    console.log(this.a);
}

var a = 18;

(function() {
    "use strict"
    foo(); // 18
})();
```

### 隐式绑定

当函数引用有上下文对象时，隐式绑定规则会把函数调用的`this`绑定到这个上下文对象。

``` js
function foo() {
    console.log(this.a);
}

var obj = {
    a: 18,
    foo,
    fn: {
        foo
    }
}

obj.foo(); // 18
// 对象属性引用链中只有上一层（最后一层）在调用位置中起作用
obj.fn.foo(); // undefined

// 此时this指向的是window，
// this永远指向的是最后调用它的对象，虽然foo是对象obj的方法，但是obj.foo赋值给fooFn时候并没有执行，所以最终指向window
var fooFn = obj.foo；
fooFn(); // undefined
```

###  显式绑定

通过`apply()、call()、bind()`函数改变函数的调用对象。

``` js
function foo(param1, params2) {
    console.log(this.a, param1, params2);
}

var obj = {
    a: 18
}

// call函数第一个参数要绑定的对象，后面的参数为foo执行的参数，立即执行一次
foo.call(obj, 1, 2); // 18 1 2
// apply函数第一个参数要绑定的对象，后面的参数为foo执行的参数（数组形式），立即执行一次
foo.apply(obj, [1,2]); // 18 1 2
// bind函数第一个参数要绑定的对象，后面的参数为foo执行的参数（可不传或传全部、部分参数），返回一个新函数，不会执行
var fooFn = foo.bind(obj, 1);
fooFn(2); // 18 1 2
```

### new绑定

通过构建函数`new`关键字生成一个实例对象，此时`this`指向这个实例对象

``` js
function foo(a) {
    this.a = a;
}

var obj = new foo(18);
console.log(obj.a); // 18

// 构造函数执行过程
// 1、创建一个空对象
// 2、设置原型，将对象的隐式原型指向函数的prototype对象
// 3、改变this指向，执行构造函数的代码（为新对象添加属性和方法）
// 4、返回 如果构造函数没有return或者返回的是简单数据类型，直接返回创建的对象
//    如果return的是引用类型，就返回这个引用类型的对象。
```

## 优先级

new绑定优先级 > 显示绑定优先级 > 隐式绑定优先级 > 默认绑定优先级

``` js
// 显式绑定 > 隐式绑定

function foo() {
    console.log(this.a);
}

var obj1 = {
    a: 18,
    foo
}

var obj2 = {
    a: 19,
    foo
}

obj1.foo(); // 18
obj2.foo(); // 19

obj1.foo.call(obj2); // 19
obj2.foo.call(obj1); // 18
```

``` js
// new绑定 > 隐式绑定

function foo(a) {
    this.a = a;
}

var obj1 = {
    foo: foo
};

var obj2 = {};

obj1.foo(18);
console.log(obj1.a); // 18

obj1.foo.call(obj2, 19);
console.log( obj2.a ); // 19

var bar = new obj1.foo(20);
console.log( obj1.a ); // 18
console.log( bar.a ); // 20
```

``` js
// new绑定 > 显式绑定

function foo(a) {
    this.a = a;
}

var obj1 = {};

var bar = foo.bind(obj1);
bar(18);
console.log(obj1.a); // 18

var baz = new bar(19);
console.log(obj1.a); // 18
console.log(baz.a); // 19
```

## this的判断

1. 是否由new调用？绑定到新创建的对象上
2. 由call、applay、bind调用？绑定到指定的对象
3. 由上下文对象调用？绑定到上下文对象
4. 默认：在严格模式下绑定到undefined，否则绑定到全局对象

## 箭头函数的this

箭头函数的`this`在编译的时候就确定了`this`的指向（根据函数或者全局作用域来确定），并且无法修改。

``` js
const obj = {
  sayThis: () => {
    console.log(this);
  }
};

obj.sayThis(); // window
const globalSay = obj.sayThis;
globalSay(); // window

function foo() {
    return (a) => {
        // this继承自foo()
        console.log(this.a);
    }
}

var obj2 = {
    a: 18,
    foo
}

var doFoo1 = obj2.foo();
doFoo1(); // 18

var doFoo2 = foo();
foo(); // undefined
```