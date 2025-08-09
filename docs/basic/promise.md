# Promise

- `Promise`是异步编程的一种解决方案，比传统的解决方案（回调函数）更加合理和更加强大。

- `Promise`是一个构造函数，接收一个回调函数函数作为参数，返回一个 Promise 实例。

## 状态

- `pending`（进行中）
- `fulfilled`（已成功）
- `rejected`（已失败）

状态不受外界影响，只有异步操作的结果，可以决定当前是哪一种状态；一旦状态改变（从 pending 变为 fulfilled 或从 pending 变为 rejected），就不会再变，任何时候都可以得到这个结果。

## 实例方法

- ` then()：`实例状态发生改变时的回调函数，第一个参数是`fulfilled`状态的回调函数，第二个参数是`rejected`状态的回调函数；`then`方法返回的是一个新的 Promise 实例，也就是 Promise 能链式书写的原因。

- `catch()`：用于指定发生错误时的回调函数；Promise 对象的错误具有“冒泡”性质，会一直向后传递，直到被捕获为止。

- `finally()`：用于指定不管 Promise 对象最后状态如何，都会执行的操作。

## 静态方法

- ` Promise.all()：`接收一个可迭代对象（通常是一个数组），并返回一个新的 Promise。当所有给定的 Promise 都被`resolved`时，新的 Promise 才会`resolved`，并且其结果数组将成为新的 Promise 的结果。如果任意一个 Promise 被`rejected`，新的 Promise 就会立即拒绝，并且带有这个原因。（全部`resolved`才`resolved`，第一个`rejected`立马`rejected`）

- `Promise.any()：`接收一个可迭代对象，并返回一个新的 Promise。一旦给定的 Promise 中有一个被`resolved`，新的 Promise 就会`resolved`，并且带有这个 Promise 的值。如果所有的 Promise 都被`rejected`，新的 Promise 就会`rejected`，并且带有一个`AggregateError`（AggregateError: All promises were rejected）。（全部`rejected`才`rejected`，第一个`resolved`立马`resolved`）

- `Promise.allSettled()：`接收一个可迭代对象，并返回一个新的 Promise。当所有给定的 Promise 都被`resolved`或`rejected`时，新的 Promise 才会`resolved`，并且其结果数组将包含每个 Promise 的状态和值或原因。（<u>永远返回`resolved`</u>）

- `Promise.race()：`接收一个可迭代对象，并返回一个新的 Promise。一旦给定的 Promise 中有一个被`resolved`或`rejected`，新的 Promise 就会`resolved`或`rejected`，并且带有这个 Promise 的值或原因。（状态由第一个的状态确定）

- `Promise.resolve():` 返回一个`resolved`的 Promise。参数可以是普通值、另一个 Promise 或者具有`then`方法的对象。

- `Promise.reject()`: 返回一个带有拒绝原因的 Promise。

- `Promise.withResolvers()：`返回一个对象，其包含一个新的 Promise 对象和两个函数，用于解决或拒绝它，对应于传入给 Promise() 构造函数执行器的两个参数。

``` js
const { promise, resolve, reject } = Promise.withResolvers();
resolve("hello");

// 等同于以下代码
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});
```

- `Promise.try()：`接收一个函数`func`（同步或异步），以及`func`所需的参数，会立即执行`func`，并将结果封装为一个 Promise。

```js
// 使用 new Promise
const p = new Promise((resolve, reject) => {
  try {
    resolve(func())
  } catch (err) {
    reject(err)
  }
})
p.then((result) => {
  // 处理结果
}).catch((err) => {
  // 错误处理
})

// 使用 Promise.try
// 统一错误处理：捕获同步和异步错误，简化逻辑。
// 增强兼容性：确保使用一致的 Promise 实现。
// 提升可读性：减少嵌套，保持代码结构清晰。
Promise.try(func)
  .then((result) => {
    // 处理结果
  })
  .catch((err) => {
    // 错误处理
  })

// Promise.try() 的一个近似实现
Promise.try = function (func, ...args) {
  return new Promise((resolve, reject) => {
    try {
      resolve(func(...args))
    } catch (error) {
      reject(error)
    }
  })
}
```

## 创建和使用

使用`new Promise()`构造函数，传入一个执行器函数，该函数有两个参数`resolve`和`reject`，分别用于改变 Promise 的状态为`fulfilled`和`rejected`。

```javascript
const demo = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1)
  }, 2000)
})

demo.then((data) => console.log(data))
```

## 与 async/await 结合使用

`async`函数内部可以使用`await`关键字来等待一个 Promise 的结果。`await`只能在`async`函数中使用，它会暂停函数的执行，直到 Promise 返回结果。

```javascript
function asyncTask() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(1)
    }, 2000)
  })
}

async function main() {
  const result = await asyncTask()
  console.log(result)
}

main()
```

## 自定义 Promise 实现

```javascript
const STATES = {
  // 进行中状态
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
}

class MyPromise {
  constructor(executor) {
    // 初始化状态
    this.state = STATES.PENDING
    // 存储成功时的值
    this.value = undefined
    // 存储失败时的原因
    this.reason = undefined
    // 存储成功回调函数的数组
    this.onFulfilledCallbacks = []
    // 存储失败回调函数的数组
    this.onRejectedCallbacks = []

    // 定义 resolve 函数，用于将 Promise 状态从 pending 变为 fulfilled
    const resolve = (value) => {
      // 状态为 pending 时才进行状态转换
      if (this.state === STATES.PENDING) {
        // 将状态改为 fulfilled
        this.state = STATES.FULFILLED
        // 存储成功的值
        this.value = value
        // 依次执行所有的成功回调函数
        this.onFulfilledCallbacks.forEach((callback) => callback())
      }
    }

    // 定义 reject 函数，用于将 Promise 状态从 pending 变为 rejected
    const reject = (reason) => {
      // 状态为 pending 时才进行状态转换
      if (this.state === STATES.PENDING) {
        // 将状态改为 reject
        this.state = STATES.REJECTED
        // 存储失败的原因
        this.reason = reason
        // 依次执行所有的失败回调函数
        this.onRejectedCallbacks.forEach((callback) => callback())
      }
    }

    try {
      // 执行传入的执行器函数，并将 resolve 和 reject 函数作为参数传递
      executor(resolve, reject)
    } catch (error) {
      // 执行器函数内部抛出异常，Promise 状态设置为 reject
      reject(error)
    }
  }
  // then 静态方法，用于处理 Promise 的成功和失败情况，并支持链式调用
  then(onFulfilled, onRejected) {
    // 如果 onFulfilled 不是函数，将其转换为一个直接返回值的函数
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value
    // 如果 onRejected 不是函数，将其转换为一个抛出错误的函数
    onRejected =
      typeof onRejected === "function" ? onRejected : (error) => error

    // 创建一个新的 MyPromise 实例，用于链式调用
    const newPromise = new MyPromise((resolve, reject) => {
      // 处理成功回调的函数
      const handleFulfilled = () => {
        try {
          // 执行成功回调函数，并获取其返回值
          const result = onFulfilled(this.value)
          // 将新的 Promise 状态设置为成功，并传递结果
          resolve(result)
        } catch (error) {
          // 执行回调函数出错时，将新的 Promise 状态设置为失败
          reject(error)
        }
      }

      // 处理失败回调的函数
      const handleRejected = () => {
        try {
          // 执行失败回调函数，并获取其返回值
          const result = onRejected(this.reason)
          // 将新的 Promise 状态设置为成功，并传递结果
          resolve(result)
        } catch (error) {
          // 执行回调函数出错时，将新的 Promise 状态设置为失败
          reject(error)
        }
      }

      if (this.state === STATES.FULFILLED) {
        // 使用 setTimeout 将处理逻辑放入异步队列，模拟原生 Promise 的异步特性
        setTimeout(handleFulfilled, 0)
      } else if (this.state === STATES.REJECTED) {
        setTimeout(handleRejected, 0)
      } else {
        // 将成功和失败的处理函数分别存入对应的回调数组
        this.onFulfilledCallbacks.push(handleFulfilled)
        this.onRejectedCallbacks.push(handleRejected)
      }
    })

    // 返回新的 Promise 实例
    return newPromise
  }

  catch(onRejected) {
    return this.then(undefined, onRejected)
  }

  finally(onFinally) {
    this.then(
      () => {
        onFinally()
      },
      () => {
        onFinally()
      }
    )
  }

  static resolve(value) {
    return new MyPromise((resolve) => resolve(value))
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason))
  }
}

// 使用示例
// 创建一个 MyPromise 实例，模拟一个异步操作，1 秒后成功并返回 '成功'
const myPromise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("成功")
  }, 1000)
})

// 调用 then 方法处理成功结果
myPromise.then((result) => {
  console.log(result)
})

// 调用静态方法
MyPromise.resolve("成功").then((value) => console.log(value))
```

## 缺点

- `promise`一旦创建，构造函数内部就会立即执行回调函数，无法取消。
- 当处于`pending`状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成？）。
