# 响应式解包

## 解包的核心场景与规则

### 模板中自动解包

- ref解包：模板中直接访问`ref`的值，无需`.value`。
- reactive不解包：`reactive`对象的属性需通过对象访问，不能直接解构（解构后丢失响应式）。

### 脚本中解包规则

| 响应式类型              | 解包场景               | 解包行为         |
| ----------------------- | ---------------------- | ---------------- |
| ref                     | 直接访问               | 需显式用`.value` |
| ref                     | 作为reactive对象的属性 | 自动解包         |
| reactive                | 任何场景               | 不用解包         |
| computed（本质就是ref） | 直接访问               | 需显式用`.value` |

``` javascript
const count = ref(0)
const state = reactive({
  count
})

console.log(count.value) // 必须.value
console.log(state.count) // 自动解包
```

## 容易混淆的解包细节

### ref嵌套在reactive中的特殊情况

- 若替换`reactive`中的`ref`属性，解包会失效。

``` javascript
const count = ref(0)
const state = reactive({
  count
})

state.count = 10 // 此时count变为普通值，不再是ref
```

### 数组/集合中ref不解包

- `reactive`数组或`Map`/`Set`中ref不会自动解包.

``` javascript
const books = reactive([ref('Vue 3 Guide')])
// 这里需要 .value
console.log(books[0].value)

const map = reactive(new Map([['count', ref(0)]]))
// 这里需要 .value
console.log(map.get('count').value)
```

### 解构reactive导致响应式丢失

- 直接解构`reactive`对象属性，得到的是普通值（非响应式）。

``` javascript
const state = reactive({ count: 0 })

// 当解构时，count 已经与 state.count 断开连接
let { count } = state
// 不会影响原始的 state
count++
```

- 解决：用`toRefs`将属性转为`ref`后再解构。

```  toRefs 
import { toRefs } from 'vue';

const { count } = toRefs(state) // count是ref，需.value访问
```

## 解包与响应式的关联

- 解包仅影响访问方式，不改变响应性本质。
  - 对`ref`的`.value`赋值仍会触发更新。
  - 修改`reactive`对象的属性仍会触发更新
- 避免过度依赖自动解包：在脚本中始终用`.value`访问`ref`，可减少逻辑混淆。

## 解包的核心

- `ref`通过`__v_isRef`标记自身类型。
- 内部通过`unref`工具函数，在模板渲染he`reactive`访问时自动获取`.vlaue`。
- 数组/集合中不解包，是为了保留`ref`原始实例的可控性。