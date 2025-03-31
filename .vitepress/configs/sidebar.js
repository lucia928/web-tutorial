/**
 * @Author: lucia928
 * @Date: 2025-03-30 16:25:06
 * @LastEditors: lucia928
 * @LastEditTime: 2025-03-31 22:21:05
 * @FilePath: \web-tutorial\.vitepress\configs\sidebar.js
 * @Description:  
 * @Copyright (c) 2025 by luxuhui1998@163.com, All Rights Reserved.
 */
export default {
  '/docs/basic/': getBasicSideBar(),
  '/docs/css/': getCssSideBar(),
}

function getBasicSideBar() {
  return [
    {
      text: 'JS基础',
      collapsed: false,
      items: [
        {
          text: "动态类型语言",
          link: "/docs/basic/dynamic.md"
        },
        {
          text: "数据类型",
          link: "/docs/basic/type.md"
        }
      ],
    }
  ]
}


function getCssSideBar() {
  return [
    {
      text: 'CSS系列',
      items: [
        {
          text: "盒子模型",
          link: "/docs/css/box.md"
        }
      ],
    }
  ]
}
