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
          text: "JVM类加载机制详解",
          link: "/docs/basic/jvm/classloader.md"
        },
        {
          text: "JVM内存模型深度剖析与优化",
          link: "/docs/basic/jvm/jmm.md"
        },
        {
          text: "JVM对象创建与内存分配机制深度剖析",
          link: "/docs/basic/jvm/object.md"
        },
        {
          text: "垃圾收集器ParNew&CMS与底层三色标记算法详解",
          link: "/docs/basic/jvm/garbage-collection.md"
        },
        {
          text: "垃圾收集器G1&ZGC详解",
          link: "/docs/basic/jvm/g1-zgc.md"
        },
        {
          text: "JVM调优工具详解及调优实战",
          link: "/docs/basic/jvm/optimization.md"
        },
        {
          text: "JVM调优实战及常量池详解",
          link: "/docs/basic/jvm/constant-pool.md"
        },
        {
          text: "为Java开疆拓土的ZGC深度剖析",
          link: "/docs/basic/jvm/zgc.md"
        },
        {
          text: "让Java性能提升的JIT深度剖析",
          link: "/docs/basic/jvm/jit.md"
        },
        {
          text: "GraalVM云原生时代的Java虚拟机",
          link: "/docs/basic/jvm/graalvm.md"
        }
      ],
    },
    {
      text: 'Tomcat',
      collapsed: false,
      items: [
        {
          text: "Tomcat整体架构",
          link: "/docs/basic/tomcat/overview.md"
        },
        {
          text: "Tomcat线程模型",
          link: "/docs/basic/tomcat/thread-model.md"
        },
        {
          text: "Tomcat类加载机制",
          link: "/docs/basic/tomcat/classloader.md"
        }
      ],
      
    },
    {
      text: 'Netty',
      collapsed: false,
      items: [
        {
          text: "深入理解网络通信和TCPIP协议",
          link: "/docs/basic/netty/"
        },
        {
          text: "BIO实战、NIO编程与直接内存、零拷贝深入辨析",
          link: "/docs/basic/netty/"
        },
        {
          text: "深入Linux内核理解epoll",
          link: "/docs/basic/netty/"
        },
        {
          text: "Netty使用和常用组件辨析",
          link: "/docs/basic/netty/"
        },
        {
          text: "Netty实战-手写通信框架与面试难题分析",
          link: "/docs/basic/netty/"
        },
        {
          text: "Netty使用和常用组件辨析",
          link: "/docs/basic/netty/"
        },
        {
          text: "Netty使用和常用组件辨析",
          link: "/docs/basic/netty/"
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
          text: "Spring概览",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Spring核心对象",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Bean的生成过程",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Bean的销毁过程",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Spring中到底有几种依赖注入的方式?",
          link: "/docs/source-code/spring/"
        },
        {
          text: "什么是循环依赖?",
          link: "/docs/source-code/spring/"
        },
        {
          text: "推断构造方法",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Spring启动流程",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Spring整合Mybatis",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Spring Aop实现原理",
          link: "/docs/source-code/spring/"
        },
        {
          text: "Spring事务",
          link: "/docs/source-code/spring/"
        },
        {
          text: "SpringBoot 3.0",
          link: "/docs/source-code/spring/"
        },
      ]
    },
    {
      text: 'Spring MVC 源码解析',
      collapsed: false,
      items: [
        {
          text: "什么是Handler",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "什么是HandlerMapping",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "什么是HandlerAdapter",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "@RequestMapping方法参数解析",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "@RequestMapping方法返回值解析",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "SpringMVC父子容器",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "SpringMVC初始化",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "WebApplicationInitializer",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "方法参数解析",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "MultipartFile解析",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "拦截器解析",
          link: "/docs/source-code/spring-mvc/"
        },
        {
          text: "@EnableWebMvc解析",
          link: "/docs/source-code/spring-mvc/"
        },
      ]
    },
    {
      text: 'Mybatis 源码解析',
      collapsed: false,
      items: [
        {
          text: "Mybatis 介绍",
          link: "/docs/source-code/mybatis/"
        },
        {
          text: "传统JDBC和Mybatis对比",
          link: "/docs/source-code/mybatis/"
        },
        {
          text: "Mybatis概览",
          link: "/docs/source-code/mybatis/"
        },
        {
          text: "Mybatis 介绍",
          link: "/docs/source-code/mybatis/"
        },
        {
          text: "openSession的过程",
          link: "/docs/source-code/mybatis/"
        },
        {
          text: "Mapper方法的执行流程",
          link: "/docs/source-code/mybatis/"
        },
        {
          text: "Mybatis重要类",
          link: "/docs/source-code/mybatis/"
        },
      ]
    },
    {
      text: 'SpringBoot 源码解析',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/spring-boot/"
        },
      ]
    },
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
          text: "Explain详解与索引优化最佳实践",
          link: "/docs/database/mysql/"
        },
        {
          text: "Mysql索引优化实战",
          link: "/docs/database/mysql/"
        },
        {
          text: "Mysql事务原理与优化最佳实践",
          link: "/docs/database/mysql/"
        },
        {
          text: "Mysql索引优化实战二",
          link: "/docs/database/mysql/"
        },
        {
          text: "Mysql锁机制与优化实践以及MVCC底层原理剖析",
          link: "/docs/database/mysql/"
        },
        {
          text: "Innodb底层原理与Mysql日志机制深入剖析",
          link: "/docs/database/mysql/"
        },
        {
          text: "Mysql全局优化与Mysql 8.0新特性详解",
          link: "/docs/database/mysql/"
        },
        // {
        //   text: "MySQL中的锁",
        //   link: "/docs/database/mysql/"
        // },
      ]
    },
    {
      text: 'Redis',
      collapsed: false,
      items: [
        {
          text: "Redis核心数据结构与高性能原理",
          link: "/docs/database/redis"
        },
        {
          text: "Redis持久化、主从与哨兵架构详解",
          link: "/docs/database/redis"
        },
        {
          text: "Redis核心数据结构与高性能原理",
          link: "/docs/database/redis"
        },
        {
          text: "Redis高可用集群之水平扩展",
          link: "/docs/database/redis"
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
          text: "MongoDB快速实战与基本原理",
          link: "/docs/database/mongodb/"
        },
        {
          text: "MongoDB聚合操作与索引使用详解",
          link: "/docs/database/mongodb/"
        },
        {
          text: "MongoDB复制集实战及其原理分析",
          link: "/docs/database/mongodb/"
        },
        {
          text: "MongoDB分片集群&高级集群架构详解",
          link: "/docs/database/mongodb/"
        },
        {
          text: "MongoDB存储原理&多文档事务详解",
          link: "/docs/database/mongodb/"
        },
        {
          text: "MongoDB建模调优&change stream实战",
          link: "/docs/database/mongodb/"
        }
      ]
    },
  ]
}

function getMqSiderBar() {
  return [
    {
      text: 'Kafka',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/mq/Kafka/"
        },
      ]
    },
    {
      text: 'RocketMQ',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/mq/rocketmq/"
        },
      ]
    },
    {
      text: 'RabbitMQ',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/mq/rabbitmq/"
        },
      ]
    },
  ]
}

function getMicroservicesSiderBar() {
  return [
    {
      text: '微服务架构',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/spring-boot/"
        },
      ]
    },
    {
      text: 'Nacos',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/nacos/"
        },
      ]
    },
    {
      text: 'Sentinel',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/sentinel/"
        },
      ]
    },
    {
      text: 'Open Feign',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/open-feign/"
        },
      ]
    },
    {
      text: '分布式事务',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/open-feign/"
        },
      ]
    },
    {
      text: 'Spring Cloud Gateway',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/gateway/"
        },
      ]
    },
    {
      text: 'Skywalking',
      collapsed: false,
      items: [
        {
          text: "spring",
          link: "/docs/microservices/skywalking/"
        },
      ]
    },
    {
      text: '分布式鉴权',
      collapsed: false,
      items: [
        {
          text: "auth",
          link: "/docs/microservices/auth/"
        },
      ]
    },
  ]
}