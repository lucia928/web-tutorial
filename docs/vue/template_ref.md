# 模板引用

用于直接访问DOM元素或子组件实例，常用于集成第三方DOM库，手动聚焦输入框、测量元素尺寸等场景。

## 基础用法

在模板中用`ref`属性记录目标，在逻辑层用同名`ref`变量接收。

``` vue
<template>
	<!-- 绑定DOM元素 -->
	<input ref="inputRef" />
	<!-- 绑定组件 -->
	<child-comp ref="childRef" />

    <ul>
        <!-- 绑定循环生成的元素 -->
        <li v-for="item in list" ref="itemRefs">
        	{{ item }}
        </li>
    </ul>
</template>
<script setup>
    ...
    // 接收DOM元素
    const inputRef = ref<HTMLInputElement | null>(null)
    // 接收组件实例
    const childRef = ref<HTMLInputElement | null>(null)
    // 声明为数组
    const itemsRefs = ref<(HTMLInputElement | null)[]>([])
    
    onMounted(() =>{
        // 访问DOM元素
        inputRef.value.focus()
        // 访问组件方法（需组件暴露）
        childRef.value?.childMethod()
        // ref 数组并不保证与源数组相同的顺序
        itemRefs.value
    })
</script>
```

## 辅助函数 useTemplateRef

Vue3.5+，返回一个浅层 ref，其值将与模板中的具有匹配 ref attribute 的元素或组件同步。

``` javascript
<template>
	<!-- 绑定DOM元素 -->
	<input ref="inputRef" />
	<!-- 绑定组件 -->
	<child-comp ref="childRef" />
        
    <ul>
        <!-- 绑定循环生成的元素 -->
        <li v-for="item in list" ref="itemRefs">
        	{{ item }}
        </li>
    </ul>
</template>

<script setup>
import { useTemplateRef, onMounted } from 'vue'

// 第一个参数必须与模板中的 ref 值匹配
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const childRef = useTemplateRef<InstanceType<typeof ChildCcmp>>('childRef')
const itemRefs = useTemplateRef<HTMLInputElement[]>('items')

onMounted(() => {
  input.value.focus()
  childRef.value?.childMethod()
})
</script>
```

### 源码

``` ts
function useTemplateRef(key) {
  const i = getCurrentInstance();
  const r = reactivity.shallowRef(null);
  if (i) {
    const refs = i.refs === shared.EMPTY_OBJ ? i.refs = {} : i.refs;
    let desc;
    if ((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable) {
      warn$1(`useTemplateRef('${key}') already exists.`);
    } else {
      Object.defineProperty(refs, key, {
        enumerable: true,
        get: () => r.value,
        set: (val) => r.value = val
      });
    }
  } else {
    warn$1(
      `useTemplateRef() is called when there is no active component instance to be associated with.`
    );
  }
  const ret = reactivity.readonly(r) ;
  {
    knownTemplateRefs.add(ret);
  }
  return ret;
}
```

- 通过`getCurrentInstance()`获取上下文实例。
- `i.refs`获取到所有`ref`数据默认为`null`。
- 创建一个`shallowRef`变量`r`作为返回值
- 为`refs`添加`Object.definePropperty`监听`useTemplateRef`的参数`key`。
- 在`getter`中返回`r`，`setter`中更新`r`。

## 函数模板引用

除了使用字符串值作名字，`ref` attribute 还可以绑定为一个函数，会在每次组件更新时都被调用。

``` vue
<!-- 当绑定的元素被卸载时，函数也会被调用一次，此时的 el 参数会是 null -->
<input :ref="(el) => { /* 将 el 赋值给一个数据属性或 ref 变量 */ }">
```

## 组件暴露内容

使用了 `<script setup>` 的组件是**默认私有**的：一个父组件无法访问到一个使用了 `<script setup>` 的子组件中的任何东西，除非子组件在其中通过 `defineExpose` 宏显式暴露（`defineExpose`必须在任何 `await` 操作之前调用。否则，在 `await` 操作后暴露的属性和方法将无法访问。）：

``` javascript
<script setup>
import { ref } from 'vue'

const a = 1
const b = ref(2)

// 像 defineExpose 这样的编译器宏不需要导入
defineExpose({
  a,
  // ref 会自动解包
  b
})
</script>
```

