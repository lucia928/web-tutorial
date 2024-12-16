export default {
  '/docs/basic/': getBasicSiderBar(),
  '/docs/concurrent/': getConcurrentSiderBar(),
  '/docs/source-code/': getSourceCodeSiderBar(),
  '/docs/distributed/': getDistributedSiderBar(),
  '/docs/database/': getDataBaseSiderBar(),
  '/docs/mq/': getMqSiderBar(),
  '/docs/microservices/': getMicroservicesSiderBar()
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

function getConcurrentSiderBar() {
  return [
    {
      text: 'Java 并发编程',
      items: [
        {
          text: "并发、线程与等待通知机制",
          link: "/docs/concurrent/1.md"
        },
        {
          text: "ThreadLocal详解",
          link: "/docs/concurrent/2.md"
        },
        {
          text: "CAS&Atomic 原子操作详解",
          link: "/docs/concurrent/3.md"
        },
        {
          text: "并发安全问题",
          link: "/docs/concurrent/4.md"
        },
        {
          text: "并发工具类应用场景",
          link: "/docs/concurrent/5.md"
        },
        {
          text: "AQS原理分析",
          link: "/docs/concurrent/6.md"
        },
        {
          text: "JUC包下的并发容器",
          link: "/docs/concurrent/7.md"
        },
        {
          text: "阻塞队列介绍",
          link: "/docs/concurrent/8.md"
        },
        {
          text: "线程池",
          link: "/docs/concurrent/9.md"
        },
        {
          text: "Fork/Join框架介绍",
          link: "/docs/concurrent/10.md"
        },
        {
          text: "Java内存模型详解",
          link: "/docs/concurrent/11.md"
        },
        {
          text: "CPU缓存架构详解",
          link: "/docs/concurrent/12.md"
        },
        {
          text: "高性能内存队列Disruptor详解",
          link: "/docs/concurrent/13.md"
        },
        {
          text: "常用并发设计模式",
          link: "/docs/concurrent/14.md"
        }
      ],
    }
  ]
}

function getSourceCodeSiderBar() {
  return [
    {
      text: 'Spring 源码解析',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/source-code/spring"
        },
      ]
    },
    {
      text: 'Spring MVC 源码解析',
      collapsed: false,
      items: [
        {
          text: "Spring MVC",
          link: "/docs/source-code/spring"
        },
      ]
    },
    {
      text: 'Mybatis 源码解析',
      collapsed: false,
      items: [
        {
          text: "Mybatis",
          link: "/docs/source-code/spring"
        },
      ]
    }
  ]
}

function getDistributedSiderBar() {
  return [
    {
      text: 'Zookeeper',
      items: [
        {
          text: " Zookeeper特性与节点数据类型",
          link: "/docs/distributed/zk"
        },
        {
          text: " Zookeeper Java客户端实战",
          link: "/docs/distributed/zk"
        },
        {
          text: " Zookeeper经典应用场景",
          link: "/docs/distributed/zk"
        },
        {
          text: " Zookeeper源码分析",
          link: "/docs/distributed/zk"
        },
        {
          text: "Zookeeper ZAB协议分析",
          link: "/docs/distributed/zk"
        },
      ]
    },
    {
      text: 'Sharding Sphere',
      items: [
        {
          text: "分库分表入门",
          link: "/docs/distributed/sharding-sphere"
        },
        {
          text: "ShardingJDBC分库分表实战指南",
          link: "/docs/distributed/sharding-sphere"
        },
        {
          text: "ShardingJDBC源码与内核解析",
          link: "/docs/distributed/sharding-sphere"
        },
        {
          text: "深入理解ShardingProxy服务端数据分片",
          link: "/docs/distributed/sharding-sphere"
        },
        {
          text: "CosID分布式主键生成框架",
          link: "/docs/distributed/sharding-sphere"
        },
      ]
    }
  ]
}

function getDataBaseSiderBar() {
  return [
    {
      text: 'MySQL',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/database/spring"
        },
      ]
    },
    {
      text: 'Redis',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/database/spring"
        },
      ]
    },
    {
      text: 'ElaticSearch',
      collapsed: false,
      items: [
        {
          text: "ElasticSearch快速入门实战",
          link: "/docs/database/es/quickstart-guide.md"
        },
        {
          text: "ElasticSearch高级查询语法Query DSL实战",
          link: "/docs/database/es/query-dsl.md"
        },
        {
          text: "ElasticSearch搜索技术深入与聚合查询实战",
          link: "/docs/database/es/analyze-aggregation.md"
        },
        {
          text: "ElasticSearch集群架构实战及其原理剖析",
          link: "/docs/database/es/cluster-architecture.md"
        },
        {
          text: "ElasticSearch高级功能详解与原理剖析",
          link: "/docs/database/es/advanced-features.md"
        },
        {
          text: "Logstash与FileBeat详解以及ELK整合详解",
          link: "/docs/database/es/logstash-fileBeat.md"
        },
      ]
    },
    {
      text: 'Mongodb',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/database/spring"
        },
      ]
    },
  ]
}

function getMqSiderBar() {
  return [
    {
      text: 'MySQL',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/database/spring"
        },
      ]
    },
  ]
}

function getMicroservicesSiderBar() {
  return [
    {
      text: 'MySQL',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/database/spring"
        },
      ]
    },
  ]
}