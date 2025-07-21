# 事件循环机制

`JavaScript`是一门单线程的语言，意味着同一时间内只能做一件事，但不意味着单线程就是阻塞，实现单线程非阻塞的方法就是事件循环。



在`JavaScript`中，所有的任务都可以分为

- `同步任务：`立即执行的任务，同步任务一般会直接进入到主线程中执行。
- `异步任务：`异步执行的任务，遇到异步任务不会等待它返回结果，而是将这个事件挂起，继续执行主线程的其他任务。当异步任务返回结果，将回调函数放到事件队列中，等到主线程空闲的时候再推入主线程执行。异步任务还可以细分为微任务与宏任务。
  - `微任务：`一个需要异步执行的函数，执行时机是在主函数执行结束之后、当前宏任务结束之前。例如Promise.then/catch/finally、MutationObserver(监视对 DOM 树所做更改)、process.nextTick（Node.js）
  
  - `宏任务`：时间粒度比较大，执行的时间间隔是不能精确控制的，对一些高实时性的需求就不太符合（ajax的onload、script外层同步代码、setTimeout、setInterval、UI rendering/UI事件、postMessage、MessageChannel、requestAnimationFrame、setImmediate、I/O（Node.js））

## 总结

同步任务进入主线程，异步任务进入任务队列，主线程内的任务执行完毕为空，会去任务队列读取对应的任务，先将微任务推入主线程执行，如果微任务执行过程中产生了新的微任务，则继续执行微任务，微任务执行完之后，将宏任务推入主线程执行。上述过程的不断重复就事件循环。



<img src="https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/lu/image-20250721150836919.png" alt="image-20250721150836919" style="zoom:80%;" />



``` javascript
async function async1() {
 console.log('async1 start');
 await async2();
 console.log('async1 end');
}

async function async2() {
 console.log('async2');
}

console.log('script start');

setTimeout(function () {
 console.log('settimeout');
});

async1();

new Promise(function (resolve) {
 console.log('promise1');
 resolve();
}).then(function () {
 console.log('promise2');
});

console.log('script end');

// script start => async1 start => async2 => promise1 => script end => async1 end => promise2 => settimeout
```



## nodejs事件循环机制

NodeJs中，微任务会在事件循环的各个阶段之间执行，也就是一个阶段执行完毕，就会去执行微任务队列的任务。