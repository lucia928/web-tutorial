# 侦听器（watch）

用于响应数据变化并执行副作用操作。

## 基础用法

### 侦听数据源类型

`watch`函数的第一个参数可以是不同类型的“数据源”

- 一个ref
- 一个reactive
- 一个getter函数
- 多个数据源组成的数组

``` javascript
const x = ref(0)
const y = ref(0)
const z = reactive({})

// 单个 ref
watch(x, (newX) => {
  console.log(`x is ${newX}`)
})

// 单个 reactive
watch(z, (newZ) => {
  console.log(`z is ${newZ}`)
})

// getter 函数
watch(
  () => x.value + y.value,
  (sum) => {
    console.log(`sum of x + y is: ${sum}`)
  }
)

// 多个来源组成的数组
watch([x, () => y.value], ([newX, newY]) => {
  console.log(`x is ${newX} and y is ${newY}`)
})
```

#### 不能直接侦听响应式对象的属性值

``` javascript
const obj = reactive({ count: 0 })
const x = ref(0)

// 不能监听到变化，因为 watch() 得到的参数是一个 number
watch(obj.count, (count) => {
  console.log(`Count is: ${count}`)
})

watch(x.value, (newX) => {
  console.log(`x is ${newX}`)
})

// 应该使用getter函数
watch(
  () => obj.count,
  (count) => {
    console.log(`Count is: ${count}`)
  }
)

watch(() => x.value, (newX) => {
  console.log(`x is ${newX}`)
})
```

## 配置项

`watch`函数的第三个参数是一个配置对象，用于定义如何执行watch函数。

| 配置项                      | 可选值                                                       |
| --------------------------- | ------------------------------------------------------------ |
| immediate                   | true 立即执行一次<br />false 仅在数据变化时触发，默认值      |
| deep                        | true 深度监听<br />false 监听引用变化<br />Vue 3.5+ 中，还可以是一个数字，表示最大遍历深度 |
| flush                       | pre 在DOM更新前执行回调<br />post DOM更新后执行回调<br />sync 同步执行，数据变化后立即执行回调 |
| once（ 3.4 及以上版本支持） | true 回调只在数据变化时触发一次<br />false 默认值            |
| onTrack                     | 用于开发调试，传入一个回调函数，初始化收集依赖时调用         |
| onTrigger                   | 用于开发调试，传入一个回调函数，依赖数据变化时执行           |

## 副作用清理

有时我们可能会在侦听器中执行副作用（比如定时器、网络请求、DOM事件监听等），如果依赖变化或组件卸载时未清理，可能会出现引发静态条件或内存泄漏。需要在以来更新导致watch回调执行前，或组件卸载时调用。

- `onCleanup` 函数

``` javascript
watch(id, (newId, oldId, onCleanup) => {
  // ...
  onCleanup(() => {
    // 清理逻辑
  })
})

watchEffect((onCleanup) => {
  // ...
  onCleanup(() => {
    // 清理逻辑
  })
})
```

- `onWatcherCleanup`函数（Vue3.5+，同步执行期间调用）

``` javascript
import { watch, onWatcherCleanup } from 'vue'

watch(id, (newId) => {
  const controller = new AbortController()

  fetch(`/api/${newId}`, { signal: controller.signal }).then(() => {
    // 回调逻辑
  })

  onWatcherCleanup(() => {
    // 终止过期请求
    controller.abort()
  })
})
```

- 手动清理

``` javascript
let cleanup = null

const stop = watch(data, () => {
    cleanup?.()
    const timer = setTimeout(() => {
        cleanup = () =>{
            clearTimeout(timer)
        }
    })
})

onUnmounted(() =>{
    stop()
    cleanup?.()
})
```

## 停止侦听

在 `setup()` 或 `<script setup>` 中用同步语句创建的侦听器，会自动绑定到宿主组件实例上，并且会在宿主组件卸载时自动停止。如果用异步回调创建一个侦听器，那么不会绑定到当前组件上，必须手动停止它，以防内存泄漏。

``` javascript
<script setup>
import { watch } from 'vue'

// 自动停止
watch(data, () => {})

// ...这个则不会！
setTimeout(() => {
  watch(data, () => {})
}, 100)

// 手动停止一个侦听器，调用 watch 或 watchEffect 返回的函数
const unwatch = watch(data, () => {})
unwatch()
</script>
```

## watch VS watchEffect

| 对比项     | watch                                                    | watchEffect                                                |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| 依赖声明   | 显式（需指定监听源）                                     | 隐式（自动追踪）                                           |
| 初始化执行 | 默认不会初始化执行                                       | 立即执行                                                   |
| 深度监听   | 对于引用类型ref默认不深度监听，需要设置deep              | 只跟踪回调中被使用到的属性<br />而不是递归地跟踪所有的属性 |
| 回调参数   | 有新旧值                                                 | 没有新旧值                                                 |
| 使用场景   | 需要精确控制监听逻辑的场景，例如更新其他数据或判断新旧值 | 快速实现响应式副作用的场景                                 |

