# 生命周期

`Vue实例`从创建到销毁的过程(即指从创建、初始化数据、编译模板、挂载Dom→渲染、更新→渲染、卸载等过程) 。

| vue2          | vue2              | 描述                                                         |
| ------------- | ----------------- | ------------------------------------------------------------ |
| beforeCreate  | setup             | 组件实例还未创建，data没有挂载，通常用于执行一些初始化任务   |
| created       | setup             | 组件初始化完毕，data可以使用，常用于获取异步数据             |
| beforeMount   | onBeforeMount     | dome已创建，未执行渲染                                       |
| mounted       | onMounted         | 初始化结束，dom已挂载，可用于获取数据和dome元素              |
| beforeUpdate  | onBeforeUpdate    | 更新前，可用于获取更新前各种状态                             |
| updated       | onUpdated         | 更新后，所有状态已是最新                                     |
| beforeDestroy | onBeforeUnmount   | 销毁前，可用于一些定时器或事件监听的取消                     |
| destroyed     | onUnmounted       | 组件已销毁，作用同上                                         |
| activated     | onActivated       | keep-alive缓存组件激活时                                     |
| deactivated   | onDeactivated     | keep-alive缓存组件停用时                                     |
| errorCaptured | onErrorCaptured   | 用于捕获子孙组件中的错误                                     |
| -             | onRenderTracked   | 追踪页面依赖的响应式数据，用于调试时查看组件渲染过程中依赖了哪些响应式数据 |
| -             | onRenderTriggered | 追踪引发页面重新渲染的响应式数据，用于调试排查重新渲染的原因 |

## 相关问题

### 在created和mounted请求数据的区别

- `created`是在组件实例创建完成后调用，此时`dom节点`并未生成；如果数据请求不依赖于`dom操作`，此时发送请求的优势在于可以尽早获取到数据。

- `mounted`是在`dom节点`渲染完毕后调用的，可以进行一些`dom`相关的初始化操作后再请求数据。


  两者都能拿到实例对象的属性和方法，调用时机上`created`比`mounted`更早。放在`mounted`中的请求可能会导致页面闪动，但如果在页面加载前完成请求，则不会出现此情况。建议对页面内容有影响的接口请在放在`created`中。

### 父子组件之间命周期钩子的执行顺序是怎么样的？

- **组件挂载阶段：**
  - **vue2：** `父 beforeCreate` → `父 created` → `子 beforeCreate` → `子 created ` → `父 beforeMount` → `子 beforeMount` → `子 mounted` → `父 mounted`
  - **vue3：** `父 setup` → `父 onBeforeMount` → `子 setup` → `子 onBeforeMount` → `子 onMounted` → `父 onMounted`

- **组件更新阶段：**
  - **vue2：** `父 beforeUpdate` → `子 beforeUpdate` → `子 updated` → `父 updated`
  - **vue3：**  `父 onBeforeUpdate` → `子 onBeforeUpdate` → `子 onUpdated` → `父 onUpdated`

- **组件卸载阶段：**

  - **vue2：** `父 beforeDestroy` → `子 beforeDestroy` → `子 destroyed` → `父 destroyed`

  - **vue3：**  `父 onBeforeUnmount` → `子 onBeforeUnmount` → `子 onUnmounted ` → `父 onUnmounted `

- **组件错误捕获阶段：**

  - **vue2：**  `子 errorCaptured` → `父 errorCaptured` 
  - **vue3：**  `子 onErrorCaptured ` → `父 onErrorCaptured `

### 生命周期的实现原理是什么？

生命周期的实现主要基于`发布-订阅模式`。在`Vue实例`初始化过程中，会在不同阶段触发相应事件，而每个生命周期钩子函数就是这些事件的回调函数。例如在实例创建过程中，会依次触发`beforeCreate`和`created`事件，对应的钩子函数会被调用。Vue通过维护一个事件队列，按顺序执行这些事件和回调函数，从而实现了生命周期的管理。

