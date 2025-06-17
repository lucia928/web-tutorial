# 类型检测

## 基础检测方法

### typeof操作符

`typeof`操作符返回一个字符串，表示未经计算的操作数的类型

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
| 基本类型 | tyoeof | null返回'object' |
| NaN | Number.isNaN()、isNaN() | 能区分undefined，Number.isNaN()直接检查是否是NaN、isNaN()先尝试转为数字，若无法转为数字返回true，否则返回false（判断是否是数字） |
| 数组类型 | Array.isArray() | 兼容IE9+ |
| 自定义对象 | instanceof | 跨框架失效 |
| 类数组对象 | 检测length属性 | 需要配合其他方式 |
| 精确类型判断 | Object.prototype.toString.call() | 返回[object Type]格式字符串 |

