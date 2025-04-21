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

- JSON方法（`JSON.parse(JSON.stringify())`），会忽略`undefined`、`symbol`和`函数`，不支持循环引用
- lodash（`_.cloneDeep()`）
- jQuery（`jQuery.extend()`)

## 区别

![image-20250421222142059](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/lu/image-20250421222142059.png)

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

