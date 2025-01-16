# 1. SkyWalking 概览

对于一个大型的几十个、几百个微服务构成的微服务架构系统，通常会遇到下面一些问题，比如：

- 如何串联整个调用链路，快速定位问题？
- 如何理清各个微服务之间的依赖关系？
- 如何进行各个微服务接口的性能分折？
- 如何追踪整个业务流程的调用处理顺序？

![image-20250106110919754](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061109860.png)

全链路追踪：对请求源头到底层服务的调用链路中间的所有环节进行监控。

OpenTracing语义规范： https://github.com/opentracing/specification/blob/master/specification.md

**链路追踪组件选型**

1. Zipkin是Twitter开源的调用链分析工具，目前基于springcloud sleuth得到了广泛的使用，特点是轻量，使用部署简单。
2. Pinpoint是韩国人开源的基于字节码注入的调用链分析，以及应用监控分析工具。特点是支持多种插件，UI功能强大，接入端无代码侵入。
3. SkyWalking是本土开源的基于字节码注入的调用链分析，以及应用监控分析工具。特点是支持多种插件，UI功能较强，接入端无代码侵入。目前已加入Apache孵化器。
4. CAT是大众点评开源的基于编码和配置的调用链分析，应用监控分析，日志采集，监控报警等一系列的监控平台工具。

​    ![image-20250106110928630](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061109681.png)

**探针性能对比**

模拟了三种并发用户：500，750，1000。使用jmeter测试，每个线程发送30个请求，设置思考时间为10ms。使用的采样率为1，即100%，这边与生产可能有差别。pinpoint默认的采样率为20，即50%，通过设置agent的配置文件改为100%。zipkin默认也是1。组合起来，一共有12种。下面看下汇总表：

![image-20250106111006434](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061110507.png)

从上表可以看出，在三种链路监控组件中，**skywalking的探针对吞吐量的影响最小，zipkin的吞吐量居中。pinpoint的探针对吞吐量的影响较为明显**，在500并发用户时，测试服务的吞吐量从1385降低到774，影响很大。然后再看下CPU和memory的影响，在内部服务器进行的压测，对CPU和memory的影响都差不多在10%之内。

## **1. skywalking是什么**

skywalking是一个国产开源框架，2015年由吴晟开源 ， 2017年加入Apache孵化器。skywalking是分布式系统的应用程序性能监视工具，专为微服务、云原生架构和基于容器（Docker、K8s、Mesos）架构而设计。SkyWalking 是观察性分析平台和应用性能管理系统，提供分布式追踪、服务网格遥测分析、度量聚合和可视化一体化解决方案。

官网：http://skywalking.apache.org/

下载：http://skywalking.apache.org/downloads/

Github：https://github.com/apache/skywalking

文档：https://skywalking.apache.org/docs/main/v9.1.0/readme/

中文文档： https://skyapm.github.io/document-cn-translation-of-skywalking/

版本： v9.1.0

采集数据——》传输数据——》存储数据——》分析数据——》监控报警

## **1.1 Skywalking主要功能特性**

1. 多种监控手段，可以通过语言探针和service mesh获得监控的数据；
2. 支持多种语言自动探针，包括 Java，.NET Core 和 Node.JS；
3. 轻量高效，无需大数据平台和大量的服务器资源；
4. 模块化，UI、存储、集群管理都有多种机制可选；
5. 支持告警；
6. 优秀的可视化解决方案；

## **1.2 Skywalking整体架构**

![image-20250106111025598](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061110748.png)

**整个架构分成四部分：**

- **上部分Agent** ：负责从应用中，收集链路信息，发送给 SkyWalking OAP 服务器；
- **下部分 SkyWalking OAP** ：负责接收Agent发送的Tracing数据信息，然后进行分析(Analysis Core)，存储到外部存储器(Storage)，最终提供查询(Query)功能；
- **右部分Storage**：Tracing数据存储，目前支持ES、MySQL、Sharding Sphere、TiDB、H2多种存储器，目前采用较多的是ES，主要考虑是SkyWalking开发团队自己的生产环境采用ES为主；
- **左部分SkyWalking UI**：负责提供控制台，查看链路等等；

**SkyWalking支持三种探针：**

- Agent – 基于ByteBuddy字节码增强技术实现，通过jvm的agent参数加载，并在程序启动时拦截指定的方法来收集数据。
- SDK – 程序中显式调用SkyWalking提供的SDK来收集数据，对应用有侵入。
- Service Mesh – 通过Service mesh的网络代理来收集数据。

**后端（Backend）**

接受探针发送过来的数据，进行度量分析，调用链分析和存储。后端主要分为两部分：

- OAP（Observability Analysis Platform）- 进行度量分析和调用链分析的后端平台，并支持将数据存储到各种数据库中，如：ElasticSearch，MySQL，InfluxDB等。
- OAL（Observability Analysis Language）- 用来进行度量分析的DSL，类似于SQL，用于查询度量分析结果和警报。
- **界面(UI)**
- RocketBot UI – SkyWalking 7.0.0 的默认web UI
- CLI – 命令行界面

这三个模块的交互流程：

![image-20250106111106808](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061111866.png)

## **1.3 SkyWalking 环境搭建部署**

![image-20250106111155049](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061111114.png)

- skywalking agent和业务系统绑定在一起，负责收集各种监控数据
- Skywalking oapservice是负责处理监控数据的，比如接受skywalking agent的监控数据，并存储在数据库中;接受skywalking webapp的前端请求，从数据库查询数据，并返回数据给前端。Skywalking oapservice通常以集群的形式存在。
- skywalking webapp，前端界面，用于展示数据。
- 用于存储监控数据的数据库，比如mysql、elasticsearch等。

**下载 SkyWalking** 

下载：http://skywalking.apache.org/downloads/

![image-20250106111204254](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061112309.png)

- SkyWalking APM:  v9.1.0

```shell
wget https://archive.apache.org/dist/skywalking/9.1.0/apache-skywalking-apm-9.1.0.tar.gz
```

- Java Agent: v8.11.0 

```shell
wget https://archive.apache.org/dist/skywalking/java-agent/8.11.0/apache-skywalking-java-agent-8.11.0.tgz    
```

目录结构

![image-20250106111242861](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061112921.png)

**搭建SkyWalking OAP 服务**

1）先使用默认的H2数据库存储,不用修改配置

config/application.yml

![image-20250106114108696](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061141014.png)

2）启动脚本bin/startup.sh

![image-20250106114118492](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061141533.png)

日志信息存储在logs目录

![image-20250106114127487](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061141520.png)

启动成功后会启动两个服务，一个是skywalking-oap-server，一个是skywalking-web-ui

skywalking-oap-server服务启动后会暴露11800 和 12800 两个端口，分别为收集监控数据的端口11800和接受前端请求的端口12800，修改端口可以修改config/applicaiton.yml

![image-20250106114138318](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061141396.png)

skywalking-web-ui服务会占用 8080 端口， 修改端口可以修改webapp/webapp.yml

![image-20250106114146472](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061141682.png)

- server.port：SkyWalking UI服务端口，默认是8080；
- spring.cloud.discovery.client.simple.instances.oap-service：SkyWalking OAP服务地址数组，SkyWalking UI界面的数据是通过请求SkyWalking OAP服务来获得；

访问：[http://192.168.65.206:8080/](http://192.168.65.103:8080/)

![image-20250106114213282](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061142357.png)

**SkyWalking中三个概念**

- **服务(Service) ：**表示对请求提供相同行为的一系列或一组工作负载，在使用Agent时，可以定义服务的名字；
- **服务实例(Service Instance) ：**上述的一组工作负载中的每一个工作负载称为一个实例， 一个服务实例实际就是操作系统上的一个真实进程；
- **端点(Endpoint) ：**对于特定服务所接收的请求路径, 如HTTP的URI路径和gRPC服务的类名 + 方法签名；