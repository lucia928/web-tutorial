/*
 * @Author: lucia928
 * @Date: 2025-03-30 16:02:11
 * @LastEditors: lucia928
 * @LastEditTime: 2025-03-30 16:03:00
 * @FilePath: \web-tutorial\.vitepress\config.mts
 * @Description:  
 * Copyright (c) 2025 by luxuhui1998@163.com, All Rights Reserved.
 */
import { defineConfig } from 'vitepress'
import nav from './configs/nav'
import sidebar from './configs/sidebar'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Web Tutorial',
  description: '',
  lastUpdated: true,
  cleanUrls: true,
  base: '/',
  markdown: {
    math: true,
    headers: {
      level: [1, 6], // 确保解析1-6级标题
    }
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],
  themeConfig: {
    outline: {
      level: [1, 3], // 支持显示从1级到3级标题
    },
    outlineTitle: '本页目录',
    lastUpdatedText: '上次更新',
    logo: '/logo.svg',
    search: {
      provider: 'local',
    },
    
    // 导航栏
    nav,

    // 侧边栏
    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/lucia928' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present luxuhui'
    }
  }
})
