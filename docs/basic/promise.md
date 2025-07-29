# Promise

- `Promise`是异步编程的一种解决方案，比传统的解决方案（回调函数）更加合理和更加强大。

- `Promise`是一个构造函数，接收一个回调函数函数作为参数，返回一个Promise实例。

## 状态

- `pending`（进行中）
- `fulfilled`（已成功）
- `rejected`（已失败）

状态不受外界影响，只有异步操作的结果，可以决定当前是哪一种状态；一旦状态改变（从pending变为fulfilled或从pending变为rejected），就不会再变，任何时候都可以得到这个结果。

## 实例方法

` then()：`实例状态发生改变时的回调函数，第一个参数是`fulfilled`状态的回调函数，第二个参数是`rejected`状态的回调函数；`then`方法返回的是一个新的Promise实例，也就是Promise能链式书写的原因。

`catch()`：用于指定发生错误时的回调函数；Promise对象的错误具有“冒泡”性质，会一直向后传递，直到被捕获为止。

`finally()`：用于指定不管 Promise 对象最后状态如何，都会执行的操作。

## 静态方法

` Promise.all()：`用于将多个 Promise实例，包装成一个新的 Promise实例；全部成功才`fulfilled`，有一个失败就立即返回`rejected `。

`Promise.race()：`同上；状态就跟着第一个改变状态的实例。

`Promise.allSettled()：`用于将多个 Promise实例，包装成一个新的 Promise实例；只有等到所有实例都返回结果，才会结束。

## 创建和使用

使用`new Promise()`构造函数，传入一个执行器函数，该函数有两个参数`resolve`和`reject`，分别用于改变Promise的状态为`fulfilled`和`rejected`。

``` javascript
const demo = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(1);
    }, 2000);
});

demo.then(data => console.log(data));
```

## 与async/await结合使用

`async`函数内部可以使用`await`关键字来等待一个Promise的结果。`await`只能在`async`函数中使用，它会暂停函数的执行，直到Promise返回结果。

``` javascript
function asyncTask() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(1);
        }, 2000);
    });
}

async function main() {
    const result = await asyncTask();
    console.log(result);
}

main();
```

## 自定义Promise实现

``` javascript
const STATES = {
    // 进行中状态
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
};

class MyPromise {
    constructor(executor) {
        // 初始化状态
        this.state = STATES.PENDING;
        // 存储成功时的值
        this.value= undefined;
        // 存储失败时的原因
        this.reason = undefined;
        // 存储成功回调函数的数组
        this.onFulfilledCallbacks = [];
        // 存储失败回调函数的数组
        this.onRejectedCallbacks = [];
    
    
        // 定义 resolve 函数，用于将 Promise 状态从 pending 变为 fulfilled
        const resolve = (value) => {
            // 状态为 pending 时才进行状态转换
            if (this.state === STATES.PENDING) {
            // 将状态改为 fulfilled
            this.state = STATES.FULFILLED; 
            // 存储成功的值
            this.value = value;
            // 依次执行所有的成功回调函数
            this.onFulfilledCallbacks.forEach(callback => callback());
            }
        }
        
        // 定义 reject 函数，用于将 Promise 状态从 pending 变为 rejected
        const reject = (reason) => {
            // 状态为 pending 时才进行状态转换
            if (this.state === STATES.PENDING) {
            // 将状态改为 reject
            this.state = STATES.REJECTED; 
            // 存储失败的原因
            this.reason = reason;
            // 依次执行所有的失败回调函数
            this.onRejectedCallbacks.forEach(callback => callback());
            }
        }
        
        try {
            // 执行传入的执行器函数，并将 resolve 和 reject 函数作为参数传递
            executor(resolve, reject);
        } catch (error) {
            // 执行器函数内部抛出异常，Promise 状态设置为 reject
            reject(error);
        }
    }
	// then 静态方法，用于处理 Promise 的成功和失败情况，并支持链式调用
	then(onFulfilled, onRejected) {
        // 如果 onFulfilled 不是函数，将其转换为一个直接返回值的函数
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value;
        // 如果 onRejected 不是函数，将其转换为一个抛出错误的函数
        onRejected = typeof onRejected === 'function' ? onRejected : (error) => error;
        
        // 创建一个新的 MyPromise 实例，用于链式调用
        const newPromise = new MyPromise((resolve, reject) => {
            // 处理成功回调的函数
            const handleFulfilled = () => {
                try {
                    // 执行成功回调函数，并获取其返回值
                    const result = onFulfilled(this.value);
                    // 将新的 Promise 状态设置为成功，并传递结果
                    resolve(result);
                } catch (error) {
                    // 执行回调函数出错时，将新的 Promise 状态设置为失败
                    reject(error);
                }
            }
            
            // 处理失败回调的函数
            const handleRejected = () => {
                try {
                    // 执行失败回调函数，并获取其返回值
                    const result = onRejected(this.reason);
                    // 将新的 Promise 状态设置为成功，并传递结果
                    resolve(result);
                } catch (error) {
                    // 执行回调函数出错时，将新的 Promise 状态设置为失败
                    reject(error);
                }
            }     
            
            if (this.state === STATES.FULFILLED) {
               // 使用 setTimeout 将处理逻辑放入异步队列，模拟原生 Promise 的异步特性
               setTimeout(handleFulfilled, 0);
            } else if (this.state === STATES.REJECTED) {
                setTimeout(handleRejected, 0);
            } else {
                // 将成功和失败的处理函数分别存入对应的回调数组
                this.onFulfilledCallbacks.push(handleFulfilled);
                this.onRejectedCallbacks.push(handleRejected);
            }
        });
        
        // 返回新的 Promise 实例
        return newPromise;
    }
    
    catch(onRejected) {
      return this.then(undefined, onRejected);
    }

    finally(onFinally) {
      this.then(
        () => {
          onFinally();
        },
        () => {
          onFinally();
        }
      );
    }
    
    static resolve(value) {
      return new MyPromise((resolve) => resolve(value));
    }

    static reject(reason) {
      return new MyPromise((resolve, reject) => reject(reason));
    }
}

// 使用示例
// 创建一个 MyPromise 实例，模拟一个异步操作，1 秒后成功并返回 '成功'
const myPromise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('成功');
    }, 1000);
});

// 调用 then 方法处理成功结果
myPromise.then((result) => {
	console.log(result);
});

// 调用静态方法
MyPromise.resolve('成功').then(value => console.log(value));
```

## 缺点

- `promise`一旦创建，构造函数内部就会立即执行回调函数，无法取消。
- 当处于`pending`状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成？）。
