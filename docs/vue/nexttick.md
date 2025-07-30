# nextTick

## 定义

在下次 DOM 更新循环结束之后执行延迟回调。核心是利用事件循环的微任务或者宏任务，将回调放入DOM更新后的队列中，确保获取到更新后的 DOM。

## 原理

Vue 采用了异步更新策略，当监听到数据变化时，不会立即更新 DOM，而是将这些变化缓存在一个队列中，并在同一事件循环中合并这些变化，这种缓冲行为可以有效去掉重复修改造成的不必要计算和 DOM 操作。在下一个事件循环时清空队列，进行必要 的 DOM 更新。调用 nextTick 也会向任务队列添加一个宏任务或微任务，DOM 更新后进入下一次事件循环，执行该回调。

## 实现

- 把回调函数加入回调队列中。
- 根据环境选择合适的异步方法，依次检查`Promise` -> `MutationObserver` -> `setImmediate` -> `setTimeout`是否存在，存在就使用它创建一个异步任务。
- 在异步任务的回调中清空回调队列，并执行里面的所有nextTick回调函数。

```javascript
const callbacks = []
let pending = false

function flushCallbacks() {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

export function nextTick(cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}

if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (
  !isIE &&
  typeof MutationObserver !== 'undefined' &&
  (isNative(MutationObserver) ||
    MutationObserver.toString() === '[object MutationObserverConstructor]')
) {
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, { characterData: true })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

## 使用场景

- 在修改数据后，得到更新后的DOM结构。
- 数据更新后，获取元素高度。
