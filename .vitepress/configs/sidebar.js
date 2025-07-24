/**
 * @Author: lucia928
 * @Date: 2025-03-30 16:25:06
 * @LastEditors: lucia928
 * @LastEditTime: 2025-07-24 14:41:58
 * @FilePath: \web-tutorial\.vitepress\configs\sidebar.js
 * @Description:
 * @Copyright (c) 2025 by luxuhui1998@163.com, All Rights Reserved.
 */
export default {
  "/docs/basic/": getBasicSideBar(),
  "/docs/css/": getCssSideBar(),
  "/docs/ts/": getTsSideBar(),
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
          text: "数据类型",
          link: "/docs/basic/type.md",
        },
        {
          text: "变量声明",
          link: "/docs/basic/define.md",
        },
        {
          text: "作用域",
          link: "/docs/basic/scope.md",
        },
        {
          text: "类型转换",
          link: "/docs/basic/transform.md",
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
          text: "闭包",
          link: "/docs/basic/closure.md",
        },
        {
          text: "类型检测",
          link: "/docs/basic/type_detection.md",
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
          text: "this关键字",
          link: "/docs/basic/this.md",
        },
        {
          text: "防抖和节流",
          link: "/docs/basic/debounce.md",
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
        }
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
          text: "常见问题",
          link: "/docs/ts/question.md",
        },
      ],
    },
  ]
}