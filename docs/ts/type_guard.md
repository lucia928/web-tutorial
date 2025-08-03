# 类型守卫

类型守卫是一种运行时检查机制，用于缩小变量的类型范围，让TS编译器在特定代码块中准确推断变量类型，减少类型错误。

## 常见类型守卫

### typeof类型守卫

用于判断基本类型（string/number/boolean/symbol等）。

``` ts
function printValue(value: string | number) {
    if (typeof value === 'string') {
        // 此处推断value为string
        console.log(value.toUpperCase())
    } esle {
        // 此处推断value为number
        console.log(value.toFixed(2))
    }
}
```

### instanceof类型守卫

用于判断对象是否为某个类的实例。

``` ts
class Dog {
    bark() {}
}
class Cat {
    meow() {}
}

function animalSound(animal: DOg | Cat) {
	if(animal instanceof Dog) ) {
        // 此处推断animal为Dog类型
        animal.bark()
	} else {
        // 此处推断animal为Cat类型
        animal.meow()
    }
}
```

### 自定义类型守卫

通过返回`变量is类型`的函数，自定义类型判断逻辑，适用于接口、联合类型等复杂场景。

``` ts
interface Fish {
    swim:() =>void
}
interface Brid {
    fly: () =>void
}

// 自定义类型守卫：判断是否为Fish
function isFish(animal: Fish | Brid): animal is Fish {
    return (animal as Fish).swim !== undefined
}

function move(animal: Fish | Brid) {
    // 此处推断animal为Fish类型
    if (isFish(animal)) {
        animal.swim()
    } else {
        // 此处推断animal为Brid类型
        animal.fly()
    }
}
```

### in操作符

通过判断对象是否包含某个属性，缩小类型范围。

``` ts
interface Fish {
    swim:() =>void
}
interface Brid {
    fly: () =>void
}

function move(animal: Fish | Brid) {
    // 此处推断animal为Fish类型
    if ('swim' in animal) {
        animal.swim()
    } else {
        // 此处推断animal为Brid类型
        animal.fly()
    }
}
```

