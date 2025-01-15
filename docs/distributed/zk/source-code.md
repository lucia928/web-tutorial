

# **从源码启动zookeeper**

zookeeper源码下载地址：https://github.com/apache/zookeeper.git  

![image-20250115140238562](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151402780.png)

源码导入idea后，org.apache.zookeeper.Version类会报错，需要建一个辅助类

```java
package org.apache.zookeeper.version;

public interface Info {
    int MAJOR = 1;
    int MINOR = 0;
    int MICRO = 0;
    String QUALIFIER = null;
    int REVISION = -1;
    String REVISION_HASH = "1";
    String BUILD_DATE = "2020-10-15";
}
```

然后在根目录编译执行：

```shell
mvn clean install -DskipTests
```

开源项目找入口类一般都是从启动脚本去找，可以从bin目录下的zkServer.sh或zkServer.cmd里找到启动主类运行即可

```java
org.apache.zookeeper.server.quorum.QuorumPeerMain
```

**注意**：

1、将conf文件夹里的zoo_sample.cfg文件复制一份改名为zoo.cfg，将zoo.cfg文件位置配置到启动参数里

![image-20250115140341622](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151403664.png)

2、启动之前需要先将zookeeper-server项目里pom.xml文件里依赖的包(除了jline)的scope为provided这一行全部注释掉

3、将conf文件夹里的log4j.properties文件复制一份到zookeeper-server项目的 \target\classes 目录下，这样项目启动时才会打印日志

**用客户端命令连接源码启动的server：**

```shell
bin/zkCli.sh -server 192.168.50.190:2181
```

**从源码里运行客户端(**org.apache.zookeeper.ZooKeeperMain**)，注意需要加入启动参数，见下图：**

![image-20250115140407941](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151404987.png)

![image-20250115140416125](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151404158.png)

# **从源码启动zookeeper集群(参考视频讲解)**

复制3个zoo.cfg文件，修改对应集群配置，并在data目录里分别建各自的myid文件填入机器id，并创建三个不同配置的启动节点，见下图：

![image-20250115140424763](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151404805.png)

分别运行每个节点，集群启动完毕！

# **启动或leader宕机选举leader流程**

![image-20250115140454701](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151404794.png)

# **leader选举多层队列架构**

整个zookeeper选举底层可以分为选举应用层和消息传输层，应用层有自己的队列统一接收和发送选票，传输层也设计了自己的队列，但是按发送的机器分了队列，避免给每台机器发送消息时相互影响，比如某台机器如果出问题发送不成功则不会影响对正常机器的消息发送。

![image-20250115140506517](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151405616.png)

# **Leader选举源码流程图**

![Leader选举源码剖析](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501151405742.jpg)