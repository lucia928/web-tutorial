
#  **Alibaba 服务注册与发现组件Nacos实战**

## **3.1 为什么需要注册中心**

思考：如果服务提供者发生变动，服务调用者如何感知服务提供者的ip和端口变化？

```java
//微服务之间通过RestTemplate调用，ip:port写死,如果ip或者port变化呢？
String url = "http://localhost:8020/order/findOrderByUserId/"+id;
R result = restTemplate.getForObject(url,R.class);
```

服务注册中心的作用就是服务注册与发现

- 服务注册，就是将提供某个服务的模块信息(通常是这个服务的ip和端口)注册到1个公共的组件上去。
- 服务发现，就是新注册的这个服务模块能够及时的被其他调用者发现。不管是服务新增和服务删减都能实现自动发现。

![image-20250106104648861](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061046909.png)

## **3.2 注册中心选型**

![image-20250106104657707](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061046791.png)

## **3.3 Nacos是什么**

官方文档：https://nacos.io/zh-cn/docs/v2/what-is-nacos.html

Nacos /nɑ:kəʊs/ 是 Dynamic Naming and Configuration Service的首字母简称，一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。

Nacos 致力于帮助您发现、配置和管理微服务。Nacos 提供了一组简单易用的特性集，帮助您快速实现动态服务发现、服务配置、服务元数据及流量管理。

**Nacos 优势** 

- **易用**：简单的数据模型，标准的 restfulAPI，易用的控制台，丰富的使用文档。
- **稳定**：99.9% 高可用，脱胎于历经阿里巴巴 10 年生产验证的内部产品，支持具有数百万服务的大规模场景，具备企业级 SLA 的开源产品。 
- **实时**：数据变更毫秒级推送生效；1w 级，SLA 承诺 1w 实例上下线 1s，99.9% 推送完成；10w 级，SLA 承诺 1w 实例上下线 3s，99.9% 推送完成；100w 级别，SLA 承诺 1w 实例上下线 9s 99.9% 推送完成。 
- **规模：**十万级服务/配置，百万级连接，具备强大扩展性。

## **3.4  Nacos 注册中心架构**

![image-20250106104707759](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061047834.png)

### **相关核心概念**

**服务 (Service)**

服务是指一个或一组软件功能（例如特定信息的检索或一组操作的执行），其目的是不同的客户端可以为不同的目的重用（例如通过跨进程的网络调用）。Nacos 支持主流的服务生态，如 Kubernetes Service、gRPC|Dubbo RPC Service 或者 Spring Cloud RESTful Service。

**服务注册中心 (Service Registry)**

服务注册中心，它是服务及其实例和元数据的数据库。服务实例在启动时注册到服务注册表，并在关闭时注销。服务和路由器的客户端查询服务注册表以查找服务的可用实例。服务注册中心可能会调用服务实例的健康检查 API 来验证它是否能够处理请求。

**服务元数据 (Service Metadata)**

服务元数据是指包括服务端点(endpoints)、服务标签、服务版本号、服务实例权重、路由规则、安全策略等描述服务的数据。

**服务提供方 (Service Provider)**

是指提供可复用和可调用服务的应用方。

**服务消费方 (Service Consumer)**

是指会发起对某个服务调用的应用方。

### **核心功能**

**服务注册**：Nacos Client会通过发送REST请求的方式向Nacos Server注册自己的服务，提供自身的元数据，比如ip地址、端口等信息。Nacos Server接收到注册请求后，就会把这些元数据信息存储在一个双层的内存Map中。

**服务心跳**：在服务注册后，Nacos Client会维护一个定时心跳来持续通知Nacos Server，说明服务一直处于可用状态，防止被剔除。默认5s发送一次心跳。

**服务同步**：Nacos Server集群之间会互相同步服务实例，用来保证服务信息的一致性。    

**服务发现**：服务消费者（Nacos Client）在调用服务提供者的服务时，会发送一个REST请求给Nacos Server，获取上面注册的服务清单，并且缓存在Nacos Client本地，同时会在Nacos Client本地开启一个定时任务定时拉取服务端最新的注册表信息更新到本地缓存

**服务健康检查**：Nacos Server会开启一个定时任务用来检查注册服务实例的健康情况，对于超过15s没有收到客户端心跳的实例会将它的healthy属性置为false(客户端服务发现时不会发现)，如果某个实例超过30秒没有收到心跳，直接剔除该实例(被剔除的实例如果恢复发送心跳则会重新注册)

## **3.5 微服务整合Nacos注册中心实战**

### **Nacos Server环境搭建**

官方文档：https://nacos.io/zh-cn/docs/v2/guide/admin/deployment.html

1) 下载[nacos server安装包](https://github.com/alibaba/nacos/releases)

选择安装nacos  server版本： v2.2.1

```shell
wget https://github.com/alibaba/nacos/releases/download/2.2.1/nacos-server-2.2.1.tar.gz
```

2) 进入conf/application.properties，配置nacos.core.auth.plugin.nacos.token.secret.key密钥

```shell
# 默认鉴权插件用于生成用户登陆临时accessToken所使用的密钥，使用默认值有安全风险  (2.2.0.1后无默认值)   nacos.core.auth.plugin.nacos.token.secret.key=aiDLyHlCgaXB08FL5zS3W6YQZssTVNScY
```

注意：在2.2.0.1版本后，社区发布版本需要自行填充`nacos.core.auth.plugin.nacos.token.secret.key`的值，否则无法启动节点。

自定义密钥时，推荐将配置项设置为Base64编码的字符串，且原始密钥长度不得低于32字符。

权限认证：https://nacos.io/zh-cn/docs/v2/guide/user/auth.html

随机字符串生成工具: http://tool.pfan.cn/random?chknumber=1&chklower=1&chkupper=1

3) 解压，进入nacos目录，单机模式启动nacos

```shell
bin/startup.sh -m standalone
```

也可以修改默认启动方式

![image-20250106104903886](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061049948.png)

![image-20250106104908256](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061049314.png)

4） 访问nacos的管理端：`http://192.168.65.1:8848/nacos` ，默认的用户名密码是 nacos/nacos

![image-20250106104925181](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061049250.png)

### **微服务提供者整合Nacos**

使用 Spring Cloud Alibaba Nacos Discovery，可基于 Spring Cloud 的编程模型快速接入 Nacos 服务注册功能。服务提供者可以通过 Nacos 的服务注册发现功能将其服务注册到 Nacos server 上。

#### **以mall-order整合nacos为例**

**1）引入依赖**

mall-order模块pom中引入nacos-client依赖

```xml
<!-- nacos服务注册与发现 -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

**2）启动类上添加@EnableDiscoveryClient注解，此注解可以省略**

**3）yml配置文件中配置nacos注册中心地址**

```yml
server:
  port: 8020

spring:
  application:
    name: mall-order  #微服务名称

  #配置nacos注册中心地址
  cloud:
    nacos:
      discovery:
        server-addr: nacos.mall.com:8848   #注册中心地址，建议用域名替换ip           
```

更多配置：https://github.com/alibaba/spring-cloud-alibaba/wiki/Nacos-discovery

**4）启动mall-order服务，nacos管理端界面查看mall-order是否注册成功**

![image-20250106105002051](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061050113.png)

**5) 测试，通过**[**Open API**](https://nacos.io/zh-cn/docs/v2/guide/user/open-api.html)**查询实例列表**

http://nacos.mall.com:8848/nacos/v2/ns/instance/list?serviceName=mall-order

![image-20250106105011626](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061050672.png)

### **微服务调用者整合Nacos**

服务调用者可以通过 Nacos 的服务注册发现功能从 Nacos server 上获取到它要调用的服务。

#### **以mall-user整合nacos为例**

mall-user模块pom中引入nacos-client依赖

```xml
<!-- nacos服务注册与发现 -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

**2）启动类上添加@EnableDiscoveryClient注解，此注解可以省略**

**3）yml配置文件中配置nacos注册中心地址**

```yml
server:
  port: 8040

spring:
  application:
    name: mall-user  #微服务名称

  #配置nacos注册中心地址
  cloud:
    nacos:
      discovery:
        server-addr: nacos.mall.com:8848
```

**4）启动mall-user服务，nacos管理端界面查看mall-user是否注册成功**

![image-20250106105106347](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061051412.png)

### **整合RestTemplate+Spring Cloud LoadBalancer实现微服务调用**

Spring Cloud LoadBalancer是Spring Cloud官方自己提供的客户端负载均衡器实现，用来替代Ribbon。对于负载均衡机制，增加了ReactiveLoadBalancer接口，并提供了基于round-robin轮询和Random随机的实现。

官方文档：https://docs.spring.io/spring-cloud-commons/docs/4.0.4/reference/html/#spring-cloud-loadbalancer

loadbalancer常用的配置：

```yml
spring:
  cloud:
    # 负载均衡配置
    loadbalancer:
      ribbon:
        #禁用ribbon
        enabled: false
      cache:
        #启用本地缓存, 根据实际情况权衡
        enabled: true
        #缓存空间大小
        capacity: 1000
        #缓存的存活时间, 单位s
        ttl: 2
        #caffeine缓存的配置, 需引入caffeine依赖
        caffeine:
          #initialCapacity初始的缓存空间大小,expireAfterWrite最后一次写入后经过固定时间过期
          spec: initialCapacity=500,expireAfterWrite=5s
      health-check:
        #重新运行运行状况检查计划程序的时间间隔。
        interval: 25s
        #运行状况检查计划程序的初始延迟值
        initial-delay: 30
      retry: #需要引入Spring Retry依赖
        #该参数用来开启重试机制，默认是关闭
        enabled: true
        #切换实例的重试次数
        max-retries-on-next-service-instance: 2
        #对当前实例重试的次数
        max-retries-on-same-service-instance: 0
        #对所有的操作请求都进行重试
        retry-on-all-operations: true
        #Http响应码进行重试
        retryable-status-codes: 500,404,502
```

#### **mall-user调用mall-order获取用户订单信息为例**

**1）引入依赖**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-loadbalancer</artifactId>
</dependency>
```

**2）使用RestTemplate进行服务调用**

给 RestTemplate 实例添加 @LoadBalanced 注解，开启 @LoadBalanced 与 loadbalancer 的集成

```java
@Configuration
public class RestConfig {
    
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

}
```

**3) mall-user中编写调用逻辑，调用mall-order服务**

```java
@RequestMapping(value = "/findOrderByUserId/{id}")
public R  findOrderByUserId(@PathVariable("id") Integer id) {
    //利用@LoadBalanced，restTemplate需要添加@LoadBalanced注解
    String url = "http://mall-order/order/findOrderByUserId/"+id;
    R result = restTemplate.getForObject(url,R.class);
    return result;
}
```

测试：`http://localhost:8040/user/findOrderByUserId/1`，返回数据：

![image-20250106105206351](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061052408.png)

## **3.6** **Nacos注册中心常用配置**

### **服务分级存储模型**

注册中心的核心数据是服务的名字和它对应的网络地址，当服务注册了多个实例时，我们需要对不 健康的实例进行过滤或者针对实例的⼀些特征进行流量的分配，那么就需要在实例上存储⼀些例如 健康状态、权重等属性。随着服务规模的扩大，渐渐的又需要在整个服务级别设定⼀些权限规则、 以及对所有实例都生效的⼀些开关，于是在服务级别又会设立⼀些属性。再往后，我们又发现单个 服务的实例又会有划分为多个子集的需求，例如⼀个服务是多机房部署的，那么可能需要对每个机 房的实例做不同的配置，这样又需要在服务和实例之间再设定⼀个数据级别。

Nacos 在经过内部多年生 产经验后提炼出的数据模型，则是⼀种服务-集群-实例的三层模型。这样基本可以满足 服务在所有场景下的数据存储和管理。

![image-20250106105215109](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061052255.png)

#### **集群配置**

在原有配置加入以下配置

```yml
spring:
  application:
    name: mall-order  #微服务名称

  #配置nacos注册中心地址
  cloud:
    nacos:
      discovery:
        server-addr: nacos.mall.com:8848
        cluster-name: SH
```



#### **案例：跨集群调用优先本地集群的场景实现**

利用cluster-name可以实现跨集群调用时，优先选择本地集群的实例，本地集群不可访问时，再去访问其他集群。

下面是Ribbon的NacosRule实现的负载均衡算法，就是利用了cluster-name实现了优先调用本地集群实例。

![image-20250106105956344](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061059486.png)

LoadBalancer默认情况下使用的ReactiveLoadBalancer实现是RoundRobinLoadBalancer。要切换到不同的实现，无论是针对所选服务还是所有服务，您都可以使用自定义LoadBalancer配置机制。

```java
# 注意： 不要用@Configuration修饰
public class CustomLoadBalancerConfiguration {

    @Bean
    ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(Environment environment,
            LoadBalancerClientFactory loadBalancerClientFactory, NacosDiscoveryProperties nacosDiscoveryProperties){
        String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        return new NacosLoadBalancer(loadBalancerClientFactory
                .getLazyProvider(name, ServiceInstanceListSupplier.class),name,nacosDiscoveryProperties);
    }
}
```

在启动类上添加@LoadBalancerClient注解

```java
@SpringBootApplication
@LoadBalancerClient(value = "mall-order", configuration = CustomLoadBalancerConfiguration.class)
public class MallUserApplication {

    public static void main(String[] args) {
        SpringApplication.run(MallUserApplication.class, args);
    }

}
```

### **服务逻辑隔离**

Nacos 数据模型 Key 由三元组唯一确定, Namespace默认是空串，公共命名空间（public），分组默认是DEFAULT_GROUP。

![image-20250106105922775](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061059834.png)

#### **Namespace 隔离设计**

命名空间(Namespace)用于进行租户（用户）粒度的隔离，Namespace 的常用场景之一是不同环境的隔离，例如开发测试环境和生产环境的资源（如配置、服务）隔离等。	

![image-20250106105916243](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061059316.png)

修改yml配置

```yml
spring:
  application:
    name: mall-user  #微服务名称

  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848   #配置nacos注册中心地址
        namespace: bc50d386-8870-4a26-8803-0187486c57be  # dev 开发环境
```

启动mall-user，进入nacos控制台可以看到mall-user注册成功，所属namespace是dev

![image-20250106105849482](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061058545.png)

测试：`http://localhost:8040/user/findOrderByUserId/1`，报错

![image-20250106105828208](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061058305.png)

原因：mall-order和mall-user使用了不同的namespace，导致服务隔离，mall-user无法发现可用的mall-order服务。

#### **group服务分组**

不同的服务可以归类到同一分组，group也可以起到服务隔离的作用。yml中可以通过spring.cloud.nacos.discovery.group参数配置。group更多应用场景是配置分组。

### **临时实例和持久化实例**

在定义上区分临时实例和持久化 实例的关键是健康检查的方式。临时实例使用客户端上报模式，而持久化实例使用服务端反向探测模式。临时实例需要能够自动摘除不健康实例，而且无需持久化存储实例。持久化实例使用服务端探测的健康检查方式，因为客户端不会上报心跳， 所以不能自动摘除下线的实例。

在大中型的公司里，这两种类型的服务往往都有。⼀些基础的组件例如数据库、缓存等，这些往往不能上报心跳，这种类型的服务在注册时，就需要作为持久化实例注册。而上层的业务服务，例如 微服务，服务的 Provider 端支持添加汇报心跳的逻辑，此时就可以使用动态服务的注册方式。

Nacos 1.x 中持久化及非 持久化的属性是作为实例的⼀个元数据进行存储和识别。Nacos 2.x 中继续沿用了持久化及非持久化的设定，但是有了⼀些调整。在 Nacos2.0 中将是否持久化的数据抽象至服务级别， 且不再允许⼀个服务同时存在持久化实例和非持久化实例，实例的持久化属性继承自服务的持久化属性。

\# 持久化实例 spring.cloud.nacos.discovery.ephemeral: false

### **nacos开启权限认证**

https://nacos.io/zh-cn/docs/v2/guide/user/auth.html

nacos server端 conf/application.properties添加如下配置

\# 开启认证 nacos.core.auth.enabled=true # 配置自定义身份识别的key（不可为空）和value（不可为空） #这两个属性是auth的白名单，用于标识来自其他服务器的请求。具体实现见 com.alibaba.nacos.core.auth.AuthFilter nacos.core.auth.server.identity.key=authKey nacos.core.auth.server.identity.value=nacosSecurty

微服务端 application.yml中添加如下配置

```yml
spring:
  application:
    name: mall-order  #微服务名称

  #配置nacos注册中心地址
  cloud:
    nacos:
      discovery:
        server-addr: nacos.mall.com:8848
        username: nacos
        password: nacos
```

如果没有配置username，password，微服务端启动会抛出如下错误：

![image-20250106105755639](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061057692.png)

## **3.7 Nacos集群搭建**

官网文档： https://nacos.io/zh-cn/docs/v2/guide/admin/cluster-mode-quick-start.html

### **集群部署架构图**

因此开源的时候推荐用户把所有服务列表放到一个vip下面，然后挂到一个域名下面

[http://ip1](http://ip1/):port/openAPI 直连ip模式，机器挂则需要修改ip才可以使用。

[http://SLB](http://slb/):port/openAPI 挂载SLB模式(内网SLB，不可暴露到公网，以免带来安全风险)，直连SLB即可，下面挂server真实ip，可读性不好。

[http://nacos.com](http://nacos.com/):port/openAPI 域名 + SLB模式(内网SLB，不可暴露到公网，以免带来安全风险)，可读性好，而且换ip方便，推荐模式。

![image-20250106105745186](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061057393.png)

| 端口 | 与主端口的偏移量 | 描述                                                       |
| ---- | ---------------- | ---------------------------------------------------------- |
| 8848 | 0                | 主端口，客户端、控制台及OpenAPI所使用的HTTP端口            |
| 9848 | 1000             | 客户端gRPC请求服务端端口，用于客户端向服务端发起连接和请求 |
| 9849 | 1001             | 服务端gRPC请求服务端端口，用于服务间同步等                 |
| 7848 | -1000            | Jraft请求服务端端口，用于处理服务端间的Raft相关请求        |

**使用VIP/nginx请求时，需要配置成TCP转发，不能配置http2转发，否则连接会被nginx断开。** **9849和7848端口为服务端之间的通信端口，请勿暴露到外部网络环境和客户端测。**

### **三节点集群搭建**

**1）环境准备**

- 安装好 JDK，需要 1.8 及其以上版本
- 建议: 2核 CPU / 4G 内存 及其以上
- 建议: 生产环境 3 个节点 及其以上

```shell
# 准备三台centos7服务器
192.168.65.174
192.168.65.192
192.168.65.204
```

- 准备好[nacos安装包](https://github.com/alibaba/nacos/releases/download/2.2.1/nacos-server-2.2.1.tar.gz)

**2）配置集群配置文件**

在nacos的解压目录nacos/的conf目录下，有配置文件cluster.conf，请每行配置成ip:port。

```shell
mv conf/cluster.conf.example conf/cluster.conf
vim  conf/cluster.conf

# ip:port 
192.168.65.174:8848
192.168.65.192:8848
192.168.65.204:8848
```

注意：不要使用localhost或127.0.0.1，针对多网卡环境，nacos可以指定网卡或ip

```properties
#多网卡选择
#ip-address参数可以直接设置nacos的ip
#该参数设置后，将会使用这个IP去cluster.conf里进行匹配，请确保这个IP的值在cluster.conf里是存在的
nacos.inetutils.ip-address=10.11.105.155

#use-only-site-local-interfaces参数可以让nacos使用局域网ip，这个在nacos部署的机器有多网卡时很有用，可以让nacos选择局域网网卡
nacos.inetutils.use-only-site-local-interfaces=true

#ignored-interfaces支持网卡数组，可以让nacos忽略多个网卡
nacos.inetutils.ignored-interfaces[0]=eth0
nacos.inetutils.ignored-interfaces[1]=eth1

#preferred-networks参数可以让nacos优先选择匹配的ip，支持正则匹配和前缀匹配
nacos.inetutils.preferred-networks[0]=30.5.124.
nacos.inetutils.preferred-networks[0]=30.5.124.(25[0-5]|2[0-4]\\d|((1d{2})|([1-9]?\\d))),30.5.124.(25[0-5]|2[0-4]\\d|((1d{2})|([1-9]?\\d)))
```

**3）开启默认鉴权插件**

修改conf目录下的application.properties文件

```properties
nacos.core.auth.enabled=true
nacos.core.auth.system.type=nacos
nacos.core.auth.plugin.nacos.token.secret.key=${自定义，保证所有节点一致}
nacos.core.auth.server.identity.key=${自定义，保证所有节点一致}
nacos.core.auth.server.identity.value=${自定义，保证所有节点一致}
```

**4）配置数据源**

使用外置mysql数据源，生产使用建议至少主备模式

**4.1）初始化 MySQL 数据库**

sql脚本：https://github.com/alibaba/nacos/blob/2.2.1/distribution/conf/mysql-schema.sql

**4.2）修改application.properties配置**

```properties
spring.datasource.platform=mysql
db.num=1
db.url.0=jdbc:mysql://192.168.65.174:3306/nacos_devtest?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
db.user.0=root
db.password.0=root
```

**5) 分别启动三个nacos节点**

以192.168.65.204为例，进入nacos目录，启动nacos

```shell
bin/startup.sh
```

![image-20250106105535776](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061055851.png)

**6) 访问nacos管理界面**

登录`http://192.168.65.204:8848/nacos`，用户名和密码都是nacos

![image-20250106105524163](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061055220.png)

微服务yml中配置

```yml
spring:
  application:
    name: mall-user  #微服务名称

  #配置nacos注册中心地址
  cloud:
    nacos:
      discovery:
        server-addr: 192.168.65.174:8848,192.168.65.192:8848,192.168.65.204:8848
        username: nacos
        password: nacos  
```

### **Nginx配置负载均衡**

**使用VIP/nginx请求时，需要配置成TCP转发，不能配置http2转发，否则连接会被nginx断开。 9849和7848端口为服务端之间的通信端口，请勿暴露到外部网络环境和客户端测。**

![image-20250106105454175](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061054437.png)

**1）准备nginx环境**

**1.1 ）如果安装了nginx，先检查nginx是否有stream模块，输出中包含：--with-stream**

```shell
nginx -V
```

**1.2)  安装nginx**

```shell
#安装依赖包
yum -y install gcc gcc-c++ autoconf automake
yum -y install zlib zlib-devel openssl openssl-devel pcre-devel

# 下载nginx
wget https://nginx.org/download/nginx-1.18.0.tar.gz
tar -zxvf nginx-1.18.0.tar.gz
cd nginx-1.18.0

#编译nginx  如果使用 nginx 的 stream 功能，在编译时一定要加上 “--with-stream”
./configure --with-stream
make && make install
#安装后nginx默认路径/usr/local/nginx
```

**2）配置http模块**

在nginx的http下面配置http协议相关的地址和端口：

```nginx
http {
    # nacos服务器http相关地址和端口
    upstream nacos-server {
        server 192.168.65.174:8848;
        server 192.168.65.192:8848;
        server 192.168.65.204:8848;
    }
    server {
        listen 8848;
        location / {
            proxy_pass http://nacos-server/;
        }
    }
}
```

**3）配置grpc**

需要nginx有stream模块支持

```nginx
# nacos服务器grpc相关地址和端口，需要nginx已经有stream模块
# stream块用于做TCP转发
stream {
    upstream nacos-server-grpc {
        server 192.168.65.174:9848;
        server 192.168.65.192:9848;
        server 192.168.65.204:9848;
    }
    server {
        listen 9848;
        proxy_pass nacos-server-grpc;
    }
}
```

**4) 启动nginx，然后就可以正常使用了。**

```shell
sbin/nginx -c conf/nginx.conf
```

微服务yml中配置

```yml
spring:
  application:
    name: mall-user  #微服务名称

  #配置nacos注册中心地址
  cloud:
    nacos:
      discovery:
        server-addr: nacos.mall.com:8848  #nacos.mall.com 需建立和nginx ip的域名映射
        username: nacos
        password: nacos 
```