# 浅拷贝与深拷贝

## 浅拷贝

`定义`：只复制对象的第一层属性，如果属性是基本类型，拷贝的就是基本类型的值。如果属性是引用类型，拷贝的就是内存地址

`相关方法`：

- 展开运算符（`...`）
- `Object.assign()`
- `Array.from()`、`Array.prototype.slice()`、`Array.prototype.concat()`

## 深拷贝

`定义`：开辟一个新的栈，递归复制所有层级的属性，使得两个对象属性完成相同，但是对应两个不同的地址，修改一个对象的属性，不会改变另一个对象的属性

`相关方法`：

- JSON方法（`JSON.parse(JSON.stringify())`），会忽略`undefined`、`symbol`和`函数`，不能拷贝`Date`、`Map`、`Set`等特殊对象，不支持循环引用，丢失原型链
- 新的原生API（`structuredClone()`），不能拷贝`函数`和`DOM`节点，丢失原型链
- lodash（`_.cloneDeep()`）
- jQuery（`jQuery.extend()`）

## 简单实现深拷贝

```javascript
function deepClone(data, hash = new WeakMap()) {
    // 判断传入的待拷贝对象的引用是否存在于hash中
    if (hash.has(data)) {
        return hash.get(data);
    } else if (typeof data !== 'object' || data === null) {
        // 判断数据类型是否是引用数据类型
        return data;
    } else if (data instanceof RegExp) {
        // 实现reg数据的深拷贝
        return new RegExp(data);
    } else if (data instanceof Date) {
        // 实现date数据的深拷贝
        return new Date(data);
    } else if (data instanceof Map) {
        // 实现map数据的深拷贝
        return new Map([...data]);
    } else if (data instanceof Set) {
        // 实现set数据的深拷贝
        return new Set([...data]);
    }

    let newData = Array.isArray(data) ? [] : {};
    hash.set(data, newData);
    Object.keys(data).forEach(key => {
        // 对象则递归赋值
        // 将这个待拷贝对象的引用存于hash中
        newData[key] = deepClone(data[key], hash);
    });
    return newData;
}
```

## 区别

![image-20250421222142059](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/lu/image-20250421222142059.png)

## 性能考量

深拷贝通常比浅拷贝消耗更多资源，特别是对于大型、复杂的数据结构。在选择拷贝策略时，应考虑以下几点：

1. 数据结构的大小和复杂度
2. 性能要求
3. 对象的使用方式（是否需要完全独立的副本）

## 最佳实践

1. 明确需求：首先确定是否真的需要深拷贝。很多时候浅拷贝或者部分深拷贝就够了
2. 选择合适的方式：
    - 浅拷贝： `Object.assign()`或者展开运算符
    - 简单深拷贝： `JSON.parse(JSON.stringify())`或`structuredClone()`
    - 复杂深拷贝：`_.cloneDeep()`或自定义函数
3. 测试边缘情况：特别是当处理包含特殊对象或者循环引用的数据时
4. 考虑不可变数据模式，而不是直接修改对象（`{...user, name: xxx}`），可以减少深拷贝的需求
5. 性能平衡：在深拷贝和性能之间找到平衡点，尤其是在处理大型数据结构时