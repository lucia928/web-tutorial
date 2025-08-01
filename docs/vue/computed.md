# 计算属性（computed）

用于处理依赖响应式数据的复杂计算，并缓存结果以提升性能。核心价值在于**自动追踪依赖、结果缓存，避免重复计算、惰性求值**。

## 为什么要用computed？

- 模板中的表达式虽然方便，但也只能用来做简单的操作。如果在模板中写太多逻辑，会让模板变得臃肿，难以维护，可读性差。
- 每次渲染都需要重新计算，浪费性能。

## 计算属性缓存 vs 方法

| 对比项   | computed                 | methods                                |
| -------- | ------------------------ | -------------------------------------- |
| 缓存     | 有（依赖不变则复用）     | 无（每次调用都重新计算）               |
| 调用方式 | 在模板中直接写名称       | 需要加括号调用                         |
| 适用场景 | 基于响应式数据的计算逻辑 | 事件处理或不依赖响应式数据的一次性计算 |

## 可写计算属性

计算属性默认是只读的。当你尝试修改一个计算属性时，你会收到一个运行时警告。可以通过传入`setter`函数实现`可写计算属性`。

``` javascript
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed({
  // getter
  get() {
    return firstName.value + ' ' + lastName.value
  },
  // setter
  set(newValue) {
    // 注意：我们这里使用的是解构赋值语法
    [firstName.value, lastName.value] = newValue.split(' ')
  }
})
</script>
```

## 获取上一个值

- 仅 3.4+ 支持，通过`getter`的第一个参数来获取计算属性返回的上一个值

``` javascript
<script setup>
import { ref, computed } from 'vue'

const count = ref(2)

const alwaysSmall = computed((previous) => {
  if (count.value <= 3) {
    return count.value
  }

  return previous
})
</script>
```

## 注意事项

- 避免副作用：computed应该仅用于计算，不要在里面修改数据，这样会导致逻辑混乱。
- 依赖必须是响应式的：如果依赖是非响应式数据，computed不会自动更新。
- 需要有返回值：不然computed的结果为undefined。