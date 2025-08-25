# 类型检测

## 基础检测方法

### typeof操作符

`typeof`操作符返回一个字符串，表示未经计算的操作数的类型

- 底层是按照二进制的方式来检查其类型的，计算机用64位二进制数存储变量（000 对象，1 整数，010 浮点数，100，字符串，110 布尔，000000 null，-2^30 undefined）null为全0所以检测为对象类型，是一个历史遗留问题。

``` javascript
typeof value // 使用形式， 返回字符串 

typeof 42 // 'number'
typeof 'str' // 'stirng'
typeof true // 'booolean'
typeof undefined // 'undefined'
typeof Symbol() // 'symbol'
typeof BigInt(1) // 'bigint'
typeof null // 'object'

typeof {} // 'object'
typeof [] // 'object'
typeof function() {} // 'function'
```

### instanceof

`instanceof`操作符用于检测构造函数的`prototype`属性是否出现在某个实例对象的原型链上

``` javascript
object instanceof constructor // 使用形式，返回布尔值

[] instanceof Array // true
new Date() instanceof Date // true

new Number(1) instanceof Number // true
Number(1) instanceof Number // false
1 instanceof Number // false


let Person = function() {}
let person = new Person()
person instanceof Person // true
```

`instanceof`的实现原理，顺着原型链去找，直到找到相同的原型对象，返回true，否则为false

``` javascript
function myInstanceof(left, right) {
    // 这里先用typeof来判断基础数据类型，如果是，直接返回false
    if(typeof left !== 'object' || left === null) {
        return false;
    }
    // getProtypeOf是Object对象自带的API，能够拿到参数的原型对象
    let proto = Object.getPrototypeOf(left);
    while(true) {                  
        if(proto === null) {
            return false;
        }
        if(proto === right.prototype){
             return true; //找到相同原型对象，返回true
        }
        proto = Object.getPrototypeof(proto);
    }
}
```

## 进阶检测方法

### Object原型检测

- 每个jS内置对象都有一个内部属性`[[Class]]`，其值为该对象的类型标识，当调用Object原型上的`toString()`方法，并通过`call()`方法改变this指向到目标数据时，对于对象类型的数据，该方法会直接读取目标数据的`[[Class]]`属性，并返回对应类型字符串`[object [[Class]]]`；对于基本类型数据，`call()`方法会先自动将其转换为对应的包装对象，再读取其`[[Class]]`属性，最后返回对应类型字符串`[object [[Class]]]`

``` javascript
Object.prototype.toString.call(NaN) // '[object Number]'
Object.prototype.toString.call(undefined) // '[object Undefined]'
Object.prototype.toString.call([]) // '[object Array]'
Object.prototype.toString.call(null) // '[object Null]'
Object.prototype.toString.call({}) // '[object Object]'
Object.prototype.toString.call(document) // '[object HTMLDocument]'
Object.prototype.toString.call(window) // '[object Window]'


class Person {
    get [Symbol.toStringTag]() {
        return 'person'
    }
}
Object.prototype.toString.call(new Person()) // '[object Person]'

```

### 专门检测方法

``` javascript
Array.isArray([]) // true
Number.isNaN(NaN) // true
Number.isInteger(42) // true
```

## 特殊类型检测

### null检测

``` javascript
const isNull = vlaue => value === null
```

### NaN检测

``` javascript
const isNaN = vlaue => value ！== NaN
Number.isNaN(NaN)
```

### 类数组检测

``` javascript
const isArrayLike = obj => {
    return obj !== null && typeof obj.length === 'number' && obj.length >= 0
}
```

## 综合检测方案

``` javascript
const getType = obj => {
   const type = Object.prototype.toString.call(obj)

   return type.slice(8, -1).toLowerCase()
}

getType(1) // number
getType([]) // array
getType(null) // null
```


## 检测方法对比

| 检测目标 | 推荐方法 | 注意事项 |
| ---- | ---- | ---- |
| 基本类型 | typeof | null返回'object' |
| NaN | Number.isNaN()、isNaN() | 能区分undefined<br/>Number.isNaN()直接检查是否是NaN<br/>isNaN()先尝试转为数字，若无法转为数字返回true，否则返回false（判断是否是数字） |
| 数组类型 | Array.isArray() | 兼容IE9+ |
| 自定义对象 | instanceof | 跨框架失效<br/>无法判断基本类型<br/>null和undefined不是任何对象的实例，始终返回false<br/>无法准确判断自定义类的的继承关系<br/>可被手动原型链干扰 |
| 类数组对象 | 检测length属性 | 需要配合其他方式 |
| 精确类型判断 | Object.prototype.toString.call() | 返回[object Type]格式字符串 |

