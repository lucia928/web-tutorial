# TypeScript

## TypeScript 与组合式 API

### 为组件的 `props` 标注类型

```ts
<script setup lang="ts">
// 从参数中推导类型 “运行时声明”
const props = defineProps({
  foo: { type: String, required: true },
  bar: Number
})

// 通过泛型参数来定义 props 的类型 “类型声明”
interface Props {
  foo: string
  bar?: number
}
const props = defineProps<Props>()

// 通过使用响应式 Props 解构为 props 声明默认值 Vue3.5+
const { foo, bar = 1 } = defineProps<Props>()

// 使用 withDefaults 编译器宏声明默认值 Vue3.4-
const props = withDefaults(defineProps<Props>(), {
  bar: 1
})

// 复杂类型 props
import type { PropType } from 'vue'

const props = defineProps({
  obj: Object as PropType<Props>
})
</script>
```

### 为组件的 `emits` 标注类型

```ts
<script setup lang="ts">
// 运行时
const emit = defineEmits(['change', 'update'])

// 基于选项
const emit = defineEmits({
  change: (id: number) => {
    // 返回 `true` 或 `false`
    // 表明验证通过或失败
  },
  update: (value: string) => {
    // 返回 `true` 或 `false`
    // 表明验证通过或失败
  }
})

// 基于类型
const emit = defineEmits<{
  (e: 'change', id: number): void
  (e: 'update', value: string): void
}>()

// 3.3+: 可选的、更简洁的语法
const emit = defineEmits<{
  change: [id: number]
  update: [value: string]
}>()
</script>
```

### 为 `ref()` 标注类型

```ts
import { ref } from "vue"
import type { Ref } from "vue"

// 推导出的类型：Ref<number>
const year = ref(2020)

// 使用 Ref 注解
const year: Ref<string | number> = ref("2020")

// 传入一个泛型参数，来覆盖默认的推导行为
const year = ref<string | number>(2020)

// 推导得到的类型：Ref<number | undefined>
const year = ref<number>()
```

### 为 `reactive()` 标注类型

```ts
import { reactive } from "vue"

// 推导得到的类型：{ title: string }
const book = reactive({ title: "Vue 3 指引" })

// 使用接口注解
interface Book {
  title: string
  year?: number
}

const book: Book = reactive({ title: "Vue 3 指引" })
```

### 为 `computed()` 标注类型

```ts
import { ref, computed } from "vue"

const count = ref(0)
// 推导得到的类型：ComputedRef<number>
const double = computed(() => count.value * 2)

// 通过泛型参数显式指定类型
const double = computed<number>(() => {
  // 若返回值不是 number 类型则会报错
})
```

### 事件处理函数标注类型

```ts
<script setup lang="ts">
// 显式地为事件处理函数的参数标注类型
function handleChange(event: Event) {
  // 访问 event 上的属性时使用类型断言
  console.log((event.target as HTMLInputElement).value)
}
</script>

<template>
  <input type="text" @change="handleChange" />
</template>
```

### 为 provide / inject 标注类型

```ts
import { provide, inject } from "vue"
import type { InjectionKey } from "vue"

const key = Symbol() as InjectionKey<string>

provide(key, "foo") // 若提供的是非字符串值会导致错误

// 当使用字符串注入 key 时，注入值的类型是 unknown，需要通过泛型参数显式声明
const foo = inject(key) // foo 的类型：string | undefined

//注入的值仍然可以是 undefined，因为无法保证提供者一定会在运行时 provide 这个值。
const foo = inject<string>("foo") // 类型：string | undefined

// 当提供了一个默认值后，这个 undefined 类型就可以被移除
const foo = inject<string>("foo", "bar") // 类型：string

// 确定该值将始终被提供，则还可以强制转换该值
const foo = inject("foo") as string
```

### 为模板引用标注类型

```ts
// Vue 3.5  useTemplateRef() 创建的 ref 类型可以基于匹配的 ref attribute 所在的元素自动推断为静态类型
// 在无法自动推断的情况下，仍然可以通过泛型参数将模板 ref 转换为显式类型
const el = useTemplateRef<HTMLInputElement>("el")

// 3.5 前的用法
// 需要通过一个显式指定的泛型参数和一个初始值 null 来创建
const el = ref<HTMLInputElement | null>(null)
```

### 为组件模板引用标注类型

```ts
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import Foo, , {type FooInstance} from './Foo.vue'
import Bar from './Bar.vue'

// 先通过 typeof 获取组件实例类型，然后使用 TypeScript 的内置 InstanceType 工具提取其实例类型
type FooType = InstanceType<typeof Foo>
type BarType = InstanceType<typeof Bar>

const compRef = useTemplateRef<FooType | BarType>('comp')

// 传入子组件导出的类型
const FooRef = useTemplateRef<FooInstance>('comp')

// 如果组件的具体类型无法获得，或者并不关心组件的具体类型，可以使用 ComponentPublicInstance。
// 这只会包含所有组件都共享的属性，比如 $el
const child = useTemplateRef<ComponentPublicInstance>('child')
</script>

<template>
  <component :is="Math.random() > 0.5 ? Foo : Bar" ref="comp" />
</template>
```

```ts
// 引用的组件是一个泛型组件
// 泛型组件是指定义组件的时候不指定具体的数据类型，而是通过“类型参数”来接收具体类型，
// 使得组件能适配多种数据结构，同时保持类型安全的组件
<!-- MyGenericModal.vue -->
<script setup lang="ts" generic="ContentType extends string | number">
import { ref } from 'vue'

const content = ref<ContentType | null>(null)

const open = (newContent: ContentType) => (content.value = newContent)

defineExpose({
  open
})
</script>

<!-- App.vue -->
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import MyGenericModal from './MyGenericModal.vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

// 需要使用 vue-component-type-helpers 库中的 ComponentExposed 来引用组件类型
const modal = useTemplateRef<ComponentExposed<typeof MyGenericModal>>('modal')

const openModal = () => {
  modal.value?.open('newValue')
}
</script>
```

## TypeScript 工具类型

## PropType\<T>

用于在用运行时 props 声明时给一个 prop 标注更复杂的类型定义

``` ts
import type { PropType } from 'vue'

interface Book {
  title: string
  author: string
  year: number
}

export default {
  props: {
    book: {
      // 提供一个比 `Object` 更具体的类型
      type: Object as PropType<Book>,
      required: true
    },
    books: {
        type: Array as PropType<Book[]>,
        default: () => []
	}
  }
}
```

## MaybeRef\<T>

Vue3.3+，`T | Ref<T>` 的别名。可用于对于标注组合式函数的参数， `unref`函数的参数类型。

## MaybeRefOrGetter\<T>

Vue3.3+，`T | Ref<T> | (() => T)` 的别名。可用于对于标注组合式函数的参数，`toValue`函数的参数类型。

## ExtractPropTypes\<T>

Vue3.3+，从运行时的 props 选项对象中提取 props 类型。提取到的是 props 定义的完整类型。

``` ts
import type { ExtractPropTypes } from 'vue'

const propsOptions = {
  foo: String,
  bar: Boolean,
  baz: {
    type: Number,
    required: true
  },
  qux: {
    type: Number,
    default: 1
  }
} as const

type Props = ExtractPropTypes<typeof propsOptions>
// {
//   foo?: string,
//   bar: boolean,
//   baz: number,
//   qux: number
// }
```

## ExtractPublicPropTypes\<T>

Vue3.3+，从运行时的 props 选项对象中提取 prop。提取到的是 props 定义的公开类型，即组件对外暴露、允许用户传入的 props 属性。

``` ts
import type { ExtractPublicPropTypes } from 'vue'

const propsOptions = {
  foo: String,
  bar: Boolean,
  baz: {
    type: Number,
    required: true
  },
  qux: {
    type: Number,
    default: 1
  }
} as const

type Props = ExtractPublicPropTypes<typeof propsOptions>
// {
//   foo?: string,
//   bar?: boolean,
//   baz: number,
//   qux?: number
// }
```

