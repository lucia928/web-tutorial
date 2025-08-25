# 指令相关

## v-if与v-for哪个优先级更高？

- `vue2`中，`v-for` 的优先级高于 `v-if`。
- `vue3`中，`v-if` 的优先级高于 `v-for`，且不能放在同一个元素上。

### 注意事项

- 不要把两个指令用在同一个元素上，每次渲染都会先循环再进行条件判断，带来性能方面的浪费；`vue3`中可能报错，绑定的表达式属性可能还未被定义。
- 可以在外层嵌套 `template`，在这一层进行`v-if`判断，然后在内部进行 `v-for`循环。
- 如果条件出现在循环内部，可通过计算属性`computed`提前过滤掉那些不需要显示的项

## v-if和v-show的使用

- **共同点：** 都能控制元素在页面是否显示。
- **不同点：** 

| 不同点                      | v-show                                              | v-if                                                         |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| 控制手段                    | 控制样式为`display:none`来实现隐藏，`dom元素`依然在 | 显示、隐藏是直接将整个`dom元素`添加或者移除                  |
| 编译过程                    | 简单地基于`css`切换，不会触发组件的生命周期变化     | 切换有一个局部编译/卸载的过程<br />切换过程中会销毁或重建内部的事件监听和子组件 |
| 编译条件                    | 不管表达式为真或假，都会渲染                          | 真正的条件渲染<br />它会确保在切换过程中条件块内的事件监听器和子组件适当地被销毁和重建。<br />渲染条件为真时才去渲染 |
| 性能消耗                    | 有更高的初始化渲染开销                              | 更高的切换开销                                               |
| 与\<template\>搭配使用      | 不支持                                              | 支持                                                         |
| 与v-else、v-else-if搭配使用 | 不支持                                              | 支持                                                         |



- **使用场景：** 如果需要频繁切换，使用`v-show`较好；如果条件很少改变，使用`v-if`较好
- **工作中遇到的坑：** 在表单中使用，有个单选控制子表单，前人估计是基于性能考虑（单选项可能频繁切换），使用了`v-show`控制子表单是否展示，在未填写子表单的情况下，切换为不展示，点击提交会遍历校验所有子表单，导致此子表单未展示到页面上，但是报错提示表单未填写完整。所以使用`v-show`还是`v-if`需要根据实际业务场景判断，切勿直接套公式！

## 介绍一下slot和v-slot

- 插槽（*slot*）用于实现组件间内容传递和模板通信的一种机制。通过插槽，父组件可以向子组件指定位置插入HTML结构或内容，从而实现更灵活和可复用的组件设计。
  - **默认插槽：** 子组件用`<slot>`标签来确定渲染位置，标签内可以放`DOM结构`，当父组件使用时没有往插槽传入内容，标签内的`DOM结构`会显示在页面上。
  - **具名插槽： **在`<slot>`标签内指定`name属性`来表示插槽的名字，父组件使用子组件时用`#`或`v-slot`指定插槽。
  - **作用域插槽：** 子组件在作用域上绑定属性来将子组件信息传递给父组件使用，这些属性会被挂在父组件`v-slot`接收的对象上。
- *v-slot* 用于定义插槽的模板内容，允许父组件向子组件的插槽中传递内容（两种写法：`#xxxx`和`v-slot:xxx`）。

``` vue
// 子组件Child.vue
<template>
    <slot>插槽默认的内容</slot>
    <slot name="content">具名插槽默认的内容</slot>
    <slot name="footer" testProps="子组件的值">
        <h3>没传footer插槽</h3>
    </slot>
</template>

// 父组件
<child>
    <template v-slot>默认插槽</template>
    <!-- 具名插槽⽤插槽名做参数 -->
    <template v-slot:content>具名插槽内容...</template>
    <!-- <template #content>具名插槽内容...</template> -->
    <template v-slot:footer="slotProps">
      来⾃⼦组件数据：{{slotProps.testProps}}
    </template>
</child>
```

### 原理

在编译阶段对模板进行解析（slot标签解析为特定的插槽节点）和生成渲染函数（子组件的渲染函数中包含处理插槽的逻辑），在运行阶段根据渲染函数和插槽配置将父组件传递的内容插入到子组件的相应位置，同时支持作用域插槽的数据传递。

## 自定义指令

- 全局注册

``` javascript
const app = Vue.createApp({})
// 注册一个全局自定义指令 `v-focus`
app.directive('focus', {
  // 在绑定元素的 attribute 或事件监听器被应用之前调用
  created() {},
  // 在绑定元素的父组件挂载之前调用
  beforeMount() {},
  // 当被绑定的元素挂载到 DOM 中时
  mounted(el) {
    // 聚焦元素
    el.focus()
  },
  // 在包含组件的 VNode 更新之前调用
  beforeUpdate(el, binding, vnode, prevNode) {
      // el 指令绑定到的元素
      // binding 是一个对象, 包含instance：使用指令的组件实例、value：传递给指令的值、oldValue：先前的值等属性
      // vnode 虚拟节点
      // prevNode 上一个虚拟节点
  },
  // 在包含组件的 VNode 及其子组件的 VNode 更新之后调用
  updated() {},
  // 在绑定元素的父组件卸载之前调用
  beforeUnmount() {},
  // 卸载绑定元素的父组件时调用
  unmounted() {}
})
app.mount('#app')
```

- 局部注册

``` javascript
<div id="app">
    <p>页面载入时，input 元素自动获取焦点：</p>
    <input v-focus>
</div>
 
<script>
const app = {
   data() {
      return {
      }
   },
   directives: {
      focus: {
         // 指令的定义
         mounted(el) {
            el.focus()
         }
      }
   }
}
 
Vue.createApp(app).mount('#app')
</script>
```

### 自定义v-hover-text指令

``` javascript
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App);

app.directive('hover-text', {
  // 当指令绑定到元素上且元素已插入到 DOM 中时调用
  mounted(el) {
    const showTooltip = () => {
      // 创建一个提示框元素
      const tooltip = document.createElement('div');
      tooltip.textContent = el.textContent;
      tooltip.style.position = 'absolute';
      tooltip.style.backgroundColor = 'black';
      tooltip.style.color = 'white';
      tooltip.style.padding = '5px';
      tooltip.style.borderRadius = '3px';
      tooltip.style.zIndex = '1000';
      // 获取元素的位置
      const rect = el.getBoundingClientRect();
      tooltip.style.left = rect.left + 'px';
      tooltip.style.top = rect.bottom + 'px';
      // 将提示框添加到文档中
      document.body.appendChild(tooltip);
      // 将提示框存储在元素的自定义属性中，方便后续移除
      el._tooltip = tooltip;
    };

    const hideTooltip = () => {
      if (el._tooltip) {
        // 移除提示框
        document.body.removeChild(el._tooltip);
        delete el._tooltip;
      }
    };

    // 绑定鼠标悬浮和离开事件
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);
  },
  // 当指令绑定的元素更新时调用
  unmounted(el) {
    // 移除事件监听器
    el.removeEventListener('mouseenter', showTooltip);
    el.removeEventListener('mouseleave', hideTooltip);
    if (el._tooltip) {
      document.body.removeChild(el._tooltip);
      delete el._tooltip;
    }
  },
});

app.mount('#app');


<template>
  <p v-hover-text><i>自定义指令</i></p>
</template>
```

