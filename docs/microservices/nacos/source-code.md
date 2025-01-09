# **1. Nacos配置中心源码分析**

Nacos2.1.0源码分析图：https://www.processon.com/view/link/62d678c31e08531cf8db16ef

![image-20250109113046831](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091130368.png)

## **Nacos架构图**

![image-20250109113227752](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091132828.png)

**Nacos核心功能点**

**服务注册**：Nacos Client会通过发送REST请求的方式向Nacos Server注册自己的服务，提供自身的元数据，比如ip地址、端口等信息。Nacos Server接收到注册请求后，就会把这些元数据信息存储在一个双层的内存Map中。 

**服务心跳**：在服务注册后，Nacos Client会维护一个定时心跳来持续通知Nacos Server，说明服务一直处于可用状态，防止被剔除。默认5s发送一次心跳。

**服务健康检查**：Nacos Server会开启一个定时任务用来检查注册服务实例的健康情况，对于超过15s没有收到客户端心跳的实例会将它的healthy属性置为false(客户端服务发现时不会发现)，如果某个实例超过30秒没有收到心跳，直接剔除该实例(被剔除的实例如果恢复发送心跳则会重新注册)

**服务发现**：服务消费者（Nacos Client）在调用服务提供者的服务时，会发送一个REST请求给Nacos Server，获取上面注册的服务清单，并且缓存在Nacos Client本地，同时会在Nacos Client本地开启一个定时任务定时拉取服务端最新的注册表信息更新到本地缓存

**服务同步**：Nacos Server集群之间会互相同步服务实例，用来保证服务信息的一致性。

**Nacos核心功能源码架构图**

![image-20250109113243374](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091132705.png)

Nacos服务注册表结构：`Map<namespace, Map<group::serviceName, Service>>`

![image-20250109113316836](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091133898.png)

举例说明：

![image-20250109113325337](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091133388.png)

## **1.1 配置中心架构**

![image-20250109113023222](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091130270.png)

## **1.2 Config Client源码分析**

配置中心核心接口ConfigService

```java
public class ConfigServerDemo {

    public static void main(String[] args) throws NacosException, InterruptedException {
        String serverAddr = "localhost";
        String dataId = "nacos-config-demo.yaml";
        String group = "DEFAULT_GROUP";
        Properties properties = new Properties();
        properties.put(PropertyKeyConst.SERVER_ADDR, serverAddr);
        //获取配置服务
        ConfigService configService = NacosFactory.createConfigService(properties);
        //获取配置
        String content = configService.getConfig(dataId, group, 5000);
        System.out.println(content);
        //注册监听器
        configService.addListener(dataId, group, new Listener() {
            @Override
            public void receiveConfigInfo(String configInfo) {
                System.out.println("===recieve:" + configInfo);
            }

            @Override
            public Executor getExecutor() {
                return null;
            }
        });

        //发布配置
        //boolean isPublishOk = configService.publishConfig(dataId, group, "content");
        //System.out.println(isPublishOk);
        //发送properties格式
        configService.publishConfig(dataId,group,"common.age=30", ConfigType.PROPERTIES.getType());

        Thread.sleep(3000);
        content = configService.getConfig(dataId, group, 5000);
        System.out.println(content);

//        boolean isRemoveOk = configService.removeConfig(dataId, group);
//        System.out.println(isRemoveOk);
//        Thread.sleep(3000);

//        content = configService.getConfig(dataId, group, 5000);
//        System.out.println(content);
//        Thread.sleep(300000);

    }
}
```

### **获取配置**

获取配置的主要方法是 NacosConfigService 类的 getConfig 方法，通常情况下该方法直接从本地文件中取得配置的值，如果本地文件不存在或者内容为空，则再通过grpc从远端拉取配置，并保存到本地快照中。

![image-20250109112923849](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091129892.png)

### **注册监听器**

配置中心客户端会通过对配置项注册监听器达到在配置项变更的时候执行回调的功能。

```java
ConfigService#getConfigAndSignListener
ConfigService#addListener
```

Nacos 可以通过以上方式注册监听器，它们内部的实现均是调用 ClientWorker 类的 addCacheDataIfAbsent。其中 CacheData 是一个维护配置项和其下注册的所有监听器的实例，所有的 CacheData 都保存在 ClientWorker 类中的原子 cacheMap 中，其内部的核心成员有：

![image-20250109112945486](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091129524.png)

## **1.3 Config Server源码分析**

###  **配置dump**

![image-20250109112954662](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091129696.png)

服务端启动时就会依赖 DumpService 的 init 方法，从数据库中 load 配置存储在本地磁盘上，并将一些重要的元信息例如 MD5 值缓存在内存中。服务端会根据心跳文件中保存的最后一次心跳时间，来判断到底是从数据库 dump 全量配置数据还是部分增量配置数据（如果机器上次心跳间隔是 6h 以内的话）。

全量 dump 当然先清空磁盘缓存，然后根据主键 ID 每次捞取一千条配置刷进磁盘和内存。增量 dump 就是捞取最近六小时的新增配置（包括更新的和删除的），先按照这批数据刷新一遍内存和文件，再根据内存里所有的数据全量去比对一遍数据库，如果有改变的再同步一次，相比于全量 dump 的话会减少一定的数据库 IO 和磁盘 IO 次数。

### **配置发布**

发布配置的代码位于 ConfigController#publishConfig中。集群部署，请求一开始也只会打到一台机器，这台机器将配置插入Mysql中进行持久化。服务端并不是针对每次配置查询都去访问 MySQL ，而是会依赖 dump 功能在本地文件中将配置缓存起来。因此当单台机器保存完毕配置之后，需要通知其他机器刷新内存和本地磁盘中的文件内容，因此它会发布一个名为 ConfigDataChangeEvent 的事件，这个事件会通过grpc调用通知所有集群节点（包括自身），触发本地文件和内存的刷新。

![image-20250109113002262](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501091130312.png)