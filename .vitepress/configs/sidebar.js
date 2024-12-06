export default {
  '/docs/basic/': getBasicSiderBar(),
}

function getBasicSiderBar() {
  return [
    {
      text: 'JVM',
      collapsed: false,
      items: [
        {
          text: "类加载机制",
          link: "/docs/basic/jvm"
        },
        {
          text: "Tomcat",
          link: "/docs/basic/tomcat"
        }
      ],
    },
    {
      text: 'Tomcat',
      collapsed: false,
      items: [
        {
          text: "Tomcat整体架构",
          link: "/docs/basic/tomcat"
        },
        {
          text: "Tomcat线程模型",
          link: "/docs/basic/tomcat"
        },
        {
          text: "Tomcat类加载机制",
          link: "/docs/basic/tomcat"
        }
      ],
      
    },
    {
      text: 'Netty',
      collapsed: false,
      items: [
        {
          text: "JVM",
          link: "/docs/basic/jvm"
        },
        {
          text: "Tomcat",
          link: "/docs/basic/tomcat"
        }
      ],
    }
  ]
}
