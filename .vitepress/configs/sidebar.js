/**
 * @Author: lucia928
 * @Date: 2025-03-30 16:25:06
 * @LastEditors: lucia928
 * @LastEditTime: 2025-08-04 10:52:50
 * @FilePath: \web-tutorial\.vitepress\configs\sidebar.js
 * @Description:
 * @Copyright (c) 2025 by luxuhui1998@163.com, All Rights Reserved.
 */
export default {
  "/docs/basic/": getBasicSideBar(),
  "/docs/css/": getCssSideBar(),
  "/docs/ts/": getTsSideBar(),
  "/docs/vue/": getVueSideBar(),
  "/docs/http/": getHttpSideBar(),
}

function getBasicSideBar() {
  return [
    {
      text: "JS基础",
      collapsed: false,
      items: [
        {
          text: "动态类型语言",
          link: "/docs/basic/dynamic.md",
        },
        {
          text: "变量声明",
          link: "/docs/basic/define.md",
        },
        {
          text: "数据类型",
          link: "/docs/basic/type.md",
        },
        {
          text: "类型转换",
          link: "/docs/basic/transform.md",
        },
        {
          text: "类型检测",
          link: "/docs/basic/type_detection.md",
        },
        {
          text: "==和===",
          link: "/docs/basic/equal.md",
        },
        {
          text: "浅拷贝与深拷贝",
          link: "/docs/basic/clone.md",
        },
        {
          text: "作用域",
          link: "/docs/basic/scope.md",
        },
        {
          text: "this关键字",
          link: "/docs/basic/this.md",
        },
        {
          text: "闭包",
          link: "/docs/basic/closure.md",
        },
        {
          text: "内存泄漏",
          link: "/docs/basic/memory_leak.md",
        },
        {
          text: "防抖和节流",
          link: "/docs/basic/debounce.md",
        },
        {
          text: "原型与原型链",
          link: "/docs/basic/prototype.md",
        },
        {
          text: "实现继承方式",
          link: "/docs/basic/inherit.md",
        },
        {
          text: "事件循环机制",
          link: "/docs/basic/eventloop.md",
        },
        {
          text: "本地存储",
          link: "/docs/basic/storage.md",
        },
        {
          text: "前端模块化",
          link: "/docs/basic/module.md",
        },
        {
          text: "Promise",
          link: "/docs/basic/promise.md",
        },
        {
          text: "数据结构Set和Map",
          link: "/docs/basic/set&map.md",
        },
        {
          text: "Ajax VS Axios VS Fetch",
          link: "/docs/basic/ajax.md",
        },
      ],
    },
  ]
}

function getCssSideBar() {
  return [
    {
      text: "CSS系列",
      items: [
        {
          text: "盒子模型",
          link: "/docs/css/box.md",
        },
        {
          text: "格式化上下文",
          link: "/docs/css/fc.md",
        },
        {
          text: "响应式设计",
          link: "/docs/css/responsive.md",
        },
        {
          text: "CSS中隐藏元素的方式",
          link: "/docs/css/hidden.md",
        },
        {
          text: "CSS选择器",
          link: "/docs/css/selector.md",
        },
        {
          text: "回流和重绘",
          link: "/docs/css/reflow.md",
        },
        {
          text: "常见问题",
          link: "/docs/css/questions.md",
        },
      ],
    },
  ]
}


function getTsSideBar() {
  return [
    {
      text: "Typescript",
      items: [
        {
          text: "declare 关键字",
          link: "/docs/ts/declare.md",
        },
        {
          text: "路由守卫",
          link: "/docs/ts/type_guard.md",
        },
        {
          text: "常见问题",
          link: "/docs/ts/question.md",
        },
      ],
    },
  ]
}


function getVueSideBar() {
  return [
    {
      text: "Vue",
      items: [
        {
          text: "应用架构模式",
          link: "/docs/vue/spa.md",
        },
        {
          text: "生命周期",
          link: "/docs/vue/life_cycle.md",
        },
        {
          text: "双向数据绑定",
          link: "/docs/vue/data_binding.md",
        },
        {
          text: "组件间通信",
          link: "/docs/vue/communication.md",
        },
        {
          text: "指令相关",
          link: "/docs/vue/directives.md",
        },
        {
          text: "Mixin",
          link: "/docs/vue/mixin.md",
        },
        {
          text: "nextTick",
          link: "/docs/vue/nexttick.md",
        },
        {
          text:  "侦听器",
           link: "/docs/vue/watch.md"
        },
        {
          text:  "计算属性",
           link: "/docs/vue/computed.md"
        },
        {
          text:  "模板引用",
           link: "/docs/vue/template_ref.md"
        },
        {
          text: "虚拟DOM",
          link: "/docs/vue/virtual_dom.md",
        },
        {
          text: "跨域解决方案",
          link: "/docs/vue/cross_origin.md"
        },
        {
          text:  "响应式解包",
           link: "/docs/vue/unpacking.md"
        },
        {
          text:  "TypeScript 与组合式 API",
           link: "/docs/vue/ts.md"
        },
        {
          text: "常见问题",
          link: "/docs/vue/questions.md",
        },
      ],
    },
  ]
}

function getHttpSideBar() {
  return [
    {
      text: "HTTP系列",
      items: [
        {
          text: "常见问题",
          link: "/docs/http/questions.md",
        },
      ],
    },
  ]
}