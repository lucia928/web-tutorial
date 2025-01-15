# **SkyWalking使用指南**

## **2.1 SkyWalking Agent追踪微服务**

### **2.1.1 通过jar包方式接入**

准备一个springboot程序，打成可执行jar包，写一个shell脚本，在启动项目的Shell脚本上，通过 -javaagent 参数进行配置SkyWalking Agent来追踪微服务；

startup.sh脚本：

```shell
#!/bin/sh
# SkyWalking Agent配置
export SW_AGENT_NAME=springboot-skywalking-demo #Agent名字,一般使用`spring.application.name`
export SW_AGENT_COLLECTOR_BACKEND_SERVICES=127.0.0.1:11800 #配置 Collector 地址。
export SW_AGENT_SPAN_LIMIT=2000 #配置链路的最大Span数量，默认为 300。
export JAVA_AGENT=-javaagent:/root/skywalking-agent/skywalking-agent.jar
java $JAVA_AGENT -jar springboot-skywalking-demo-0.0.1-SNAPSHOT.jar #jar启动
```

等同于

```shell
java -javaagent:/root/skywalking-agent/skywalking-agent.jar 
-DSW_AGENT_COLLECTOR_BACKEND_SERVICES=127.0.0.1:11800 
-DSW_AGENT_NAME=springboot-skywalking-demo -jar springboot-skywalking-demo-0.0.1-SNAPSHOT.jar
```

参数名对应agent/config/agent.config配置文件中的属性。

属性对应的源码：org.apache.skywalking.apm.agent.core.conf.Config.java

```shell
# The service name in UI
agent.service_name=${SW_AGENT_NAME:Your_ApplicationName}
# Backend service addresses.
collector.backend_service=${SW_AGENT_COLLECTOR_BACKEND_SERVICES:127.0.0.1:11800}
```

我们也可以使用skywalking.+配置文件中的配置名作为系统配置项来进行覆盖。 javaagent参数配置方式优先级更高

```shell
-javaagent:/root/skywalking-agent/skywalking-agent.jar
-Dskywalking.agent.service_name=springboot-skywalking-demo
-Dskywalking.collector.backend_service=127.0.0.1:11800
```

测试： `http://192.168.65.206:8000/user/list`

### **2.1.2 在IDEA中使用Skywalking**

在运行的程序配置jvm参数

```shell
-javaagent:D:\apache\apache-skywalking-java-agent-8.11.0\skywalking-agent\skywalking-agent.jar
-DSW_AGENT_NAME=springboot-skywalking-demo
-DSW_AGENT_COLLECTOR_BACKEND_SERVICES=192.168.65.206:11800 
```

测试：`http://localhost:8000/user/list`

### **2.1.3 Skywalking跨多个微服务追踪**

Skywalking跨多个微服务追踪，只需要每个微服务启动时添加javaagent参数即可。

启动微服务mall-gateway，mall-order，mall-user ，配置skywalking的jvm参数

测试：http://localhost:8888/user/findOrderByUserId/1

![image-20250106140138134](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061401220.png)

![image-20250106140149974](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061401023.png)

注意：此处存在bug，追踪链路不显示gateway

解决方案：拷贝agent/optional-plugins目录下的gateway插件和webflux插件到agent/plugins目录

![image-20250106140206768](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061402804.png)

查看调用链路

![image-20250106140218147](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061402209.png)

## **2.2 Skywalking集成日志框架**

https://skywalking.apache.org/docs/skywalking-java/latest/en/setup/service-agent/java-agent/application-toolkit-logback-1.x/

引入依赖

```xml
<!-- apm-toolkit-logback-1.x -->
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-logback-1.x</artifactId>
    <version>8.11.0</version>
</dependency>
```

微服务添加logback-spring.xml文件，并配置 %tid 占位符

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
        <!-- 日志的格式化 -->
        <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
            <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
                <Pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%tid] [%thread] %-5level %logger{36} -%msg%n</Pattern>
            </layout>
        </encoder>
    </appender>

    <!-- 设置 Appender -->
    <root level="INFO">
        <appender-ref ref="console"/>
    </root>

</configuration>
```

测试http://localhost:8888/user/findOrderByUserId/1，查看调用日志

### ![image-20250106140330815](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061403959.png)

### **Skywalking通过grpc上报日志** **（需要v8.4.0以上）**

gRPC报告程序可以将收集到的日志转发到SkyWalking OAP服务器上

logback-spring.xml中添加

```xml
 <!-- https://skywalking.apache.org/docs/skywalking-java/latest/en/setup/service-agent/java-agent/application-toolkit-logback-1.x/  -->
<!-- 通过grpc上报日志到skywalking oap-->
<appender name="grpc-log" class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.log.GRPCLogClientAppender">
    <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
        <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
            <Pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%tid] [%thread] %-5level %logger{36} -%msg%n</Pattern>
        </layout>
    </encoder>
</appender>
```

Skywalking UI效果

![image-20250106140356377](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061403473.png)

## **2.3 Skywalking告警通知**

skywalking告警的核心由一组规则驱动，这些规则定义在config/alarm-settings.yml文件中，告警规则的定义分为三部分:

- 告警规则：它们定义了应该如何触发度量警报，应该考虑什么条件；
- 网络钩子(Webhook}：当警告触发时，哪些服务终端需要被通知；
- gRPC钩子：远程gRPC方法的主机和端口，告警触发后调用；

为了方便，skywalking发行版中提供了默认的alarm-setting.yml文件，包括一些规则，每个规则有英文注释，可以根据注释得知每个规则的作用：

- 在最近10分钟的3分钟内服务平均响应时间超过1000ms
- 最近10分钟内，服务成功率在2分钟内低于80%
- 服务实例的响应时间在过去10分钟的2分钟内超过1000ms
- 数据库访问{name}的响应时间在过去10分钟的2分钟内超过1000ms

只要我们的服务请求符合alarm-setting.yml文件中的某一条规则就会触发告警。

比如service_resp_time_rule规则：

该规则表示服务{name}的响应时间在最近10分钟的3分钟内超过1000ms

![image-20250106140412992](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061404043.png)

- metrics-name：度量名称，也是OAL脚本中的度量名。默认配置中可以用于告警的度量有：服务，实例，端点，服务关系，实例关系，端点关系。它只支持long,double和int类型。
- op：操作符。
- threshold：阈值。

- period：多久告警规则需要被检查一下。这是一个时间窗口，与后端部署环境时间相匹配。
- count：在一个周期窗口中，如果按op计算超过阈值的次数达到count，则发送告警
- silence-period：在时间N中触发报警后，在N -> N + silence-period这段时间内不告警。
- message：该规则触发时，发送的通知消息。

测试：编写接口，模拟慢查询

```java
@RequestMapping("/info/{id}")
public User info(@PathVariable("id") Integer id){

    try {
        Thread.sleep(2000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }

    return userService.getById(id);
}
```

访问接口，过段时间会在skywalking控制界面出现了告警信息

![image-20250106140451049](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061404106.png)

**实现回调接口**

```java
@RequestMapping("/notify")
public String notify(@RequestBody Object obj){
    //TODO 告警信息，给技术负责人发短信，钉钉消息，邮件，微信通知等
    System.err.println(obj.toString());
    return "notify successfully";
}
```

在config/alarm-settings.yml中配置回调接口，并重启skywalking服务

![image-20250106140515675](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061405721.png)

测试访问：`http://localhost:8000/user/info/1`，满足告警规则后，控制台输出告警信息

![image-20250106140526294](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061405376.png)

参考： https://github.com/apache/skywalking/blob/master/docs/en/setup/backend/backend-alarm.md

**对接钉钉：**

![image-20250106140539987](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061405033.png)

**Webhook回调通知**

SkyWalking告警Webhook回调要求接收方是一个Web容器（比如tomcat服务），告警的消息会通过HTTP请求进行发送, 请求方法为POST, Content-Type为application/json, JSON格式基于ListAlarmMessage>的集合对象数据, 集合中的每个AlarmMessage包含以下信息：

1. scopeId. 所有可用的Scope，参考：org.apache.skywalking.oap.server.core.source.DefaultScopeDefine；
2. name. 目标 Scope 的实体名称；
3. id0. Scope 实体的 ID；
4. id1. 未使用；
5. ruleName. 在 alarm-settings.yml 中配置的规则名；
6. alarmMessage. 报警消息内容；
7. startTime. 告警时间, 位于当前时间与 UTC 1970/1/1 之间；

```txt
[{
	scopeId = 2,
	scope = SERVICE_INSTANCE,
	name = 98e1839 a6fdf48b0aedb0ecabb8ea5f7 @192 .168 .233 .1 of springboot - skywalking - demo,
	id0 = c3ByaW5nYm9vdC1za3l3YWxraW5nLWRlbW8 = .1 _OThlMTgzOWE2ZmRmNDhiMGFlZGIwZWNhYmI4ZWE1ZjdAMTkyLjE2OC4yMzMuMQ == ,
	id1 = ,
	ruleName = service_instance_resp_time_rule,
	alarmMessage = Response time of service instance 98e1839 a6fdf48b0aedb0ecabb8ea5f7 @192 .168 .233 .1 of springboot - skywalking - demo is more than 1000 ms in 2 minutes of last 10 minutes,
	startTime = 1613913565462
}, {
	scopeId = 6,
	scope = ENDPOINT_RELATION,
	name = User in User to / user / info / {
		id
	} in springboot - skywalking - demo,
	id0 = VXNlcg == .0 _VXNlcg == ,
	id1 = c3ByaW5nYm9vdC1za3l3YWxraW5nLWRlbW8 = .1 _L3VzZXIvaW5mby97aWR9,
	ruleName = endpoint_relation_resp_time_rule,
	alarmMessage = Response time of endpoint relation User in User to / user / info / {
		id
	} in springboot - skywalking - demo is more than 1000 ms in 2 minutes of last 10 minutes,
	startTime = 1613913565462
}]
```

## **2.4 Skywalking持久化追踪数据**

### **2.4.1 基于mysql持久化**

1. 修改config目录下的application.yml，使用mysql作为持久化存储的仓库

![image-20250106140645993](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061406031.png)

2. 修改mysql连接配置

![image-20250106140659848](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061406899.png)

```yml
storage:
  #选择使用mysql   默认使用h2，不会持久化，重启skyWalking之前的数据会丢失
  selector: ${SW_STORAGE:mysql}
  #使用mysql作为持久化存储的仓库
  mysql:
    properties:
      #数据库连接地址  创建swtest数据库
      jdbcUrl: ${SW_JDBC_URL:"jdbc:mysql://1ocalhost:3306/swtest"}
      #用户名
      dataSource.user: ${SW_DATA_SOURCE_USER:root}
      #密码
      dataSource.password: ${SW_DATA_SOURCE_PASSWORD:root}
```

注意：需要添加mysql数据驱动包，因为在lib目录下是没有mysql数据驱动包的，所以修改完配置启动是会报错，启动失败的。

![image-20250106140736907](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061407977.png)

3. 添加mysql数据驱动包到oap-libs目录下

![image-20250106140751487](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061407520.png)

4. 启动Skywalking

   ![image-20250106140806383](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061408428.png)

查看swtest数据库，可以看到生成了很多表。

![image-20250106140816707](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061408771.png)

说明启动成功了，打开配置对应的地址`http://192.168.65.206:8080/`，可以看到skywalking的web界面。

![image-20250106140831683](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061408745.png)

测试：重启skywalking，验证追踪数据会不会丢失

### **2.4.2 基于elasticsearch持久化**

1.准备好elasticsearch环境（参考ES专题）

启动elasticsearch服务

```shell
bin/elasticsearch -d
```

![image-20250106140841208](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061408246.png)

2.修改config/application.yml配置文件，指定存储使用ES，修改elasticsearch的连接配置

![image-20250106140859823](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061408871.png)

3. 启动Skywalking服务

![image-20250106140915351](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061409399.png)

启动时会向elasticsearch中创建大量的index索引用于持久化数据

启动应用程序，查看追踪数据是否已经持久化到elasticsearch的索引中，然后重启skywalking，验证追踪数据会不会丢失。

![image-20250106141048571](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061410639.png)

## **2.5 自定义SkyWalking链路追踪**

如果我们希望对项目中的业务方法，实现链路追踪，方便我们排查问题，可以使用如下的代码

引入依赖

```xml
<!-- SkyWalking 工具类 -->
<dependency>
    <groupId>org.apache.skywalking</groupId>
    <artifactId>apm-toolkit-trace</artifactId>
    <version>8.11.0</version>
</dependency>
```

在业务方法中可以TraceContext获取到traceId

```java
@RequestMapping("/list")
public List<User> list(){

    //TraceContext可以绑定key-value
    TraceContext.putCorrelation("name", "fox");
    Optional<String> op = TraceContext.getCorrelation("name");
    log.info("name = {} ", op.get());
    //获取追踪的traceId
    String traceId = TraceContext.traceId();
    log.info("traceId = {} ", traceId);

    return userService.list();
}
```

测试 `http://localhost:8000/user/list`

![image-20250106141414180](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061414245.png)

在Skywalking UI中查询tranceId

![image-20250106141122284](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061414585.png)

### **2.5.1 @Trace将方法加入追踪链路**

如果一个业务方法想在ui界面的追踪链路上显示出来，只需要在业务方法上加上@Trace注解即可

![image-20250106141437008](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061414071.png)

测试：

![image-20250106141449626](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061414685.png)

### **2.5.2 加入@Tags或@Tag**

我们还可以为追踪链路增加其他额外的信息，比如记录参数和返回信息。实现方式：在方法上增加@Tag或者@Tags。

```java
@Trace
@Tag(key = "list", value = "returnedObj")
public List<User> list() {
    return userMapper.list();
}

@Trace
@Tags({@Tag(key = "param", value = "arg[0]"),
        @Tag(key = "user", value = "returnedObj")})
public User getById(Integer id) {
    return userMapper.getById(id);
}
```

  ![image-20250106141520730](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061415775.png)

![image-20250106141529301](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061415349.png)

## **2.6 Skywalking集群部署(oap服务高可用)**

Skywalking集群是将skywalking oap作为一个服务注册到nacos上，只要skywalking oap服务没有全部宕机，保证有一个skywalking oap在运行，就能进行追踪。

搭建一个skywalking oap集群需要：

1. 至少一个Nacos（也可以是nacos集群）
2. 至少一个ElasticSearch（也可以是es集群）
3. 至少2个skywalking oap服务；
4. 至少1个UI（UI也可以集群多个，用Nginx代理统一入口）

**1.修改config/application.yml文件**

使用nacos作为注册中心

![image-20250106141544814](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061415851.png)

修改nacos配置

![image-20250106141602905](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061416959.png)

可以选择性修改监听端口

![image-20250106141611995](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061416048.png)

修改存储策略，使用elasticsearch作为storage

![image-20250106141620489](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061416531.png)

**2. 配置ui服务webapp.yml文件的oap-service，写多个oap服务地址**

![image-20250106114403960](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501061144085.png)

**3.启动微服务测试**

指定微服务的jvm参数

```shell
-Dskywalking.collector.backend_service=ip1:11800,ip2:11800
```

