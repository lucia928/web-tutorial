# **2.高性能内存队列Disruptor详解**

## **2.1 juc包下阻塞队列的缺陷**

1） juc下的队列大部分采用加ReentrantLock锁方式保证线程安全。在稳定性要求特别高的系统中，为了防止生产者速度过快，导致内存溢出，只能选择有界队列。

2）加锁的方式通常会严重影响性能。线程会因为竞争不到锁而被挂起，等待其他线程释放锁而唤醒，这个过程存在很大的开销，而且存在死锁的隐患。

3） 有界队列通常采用数组实现。但是采用数组实现又会引发另外一个问题false sharing(伪共享)。

## **2.2 Disruptor介绍**

Disruptor是英国外汇交易公司LMAX开发的一个高性能队列，研发的初衷是解决内存队列的延迟问题（在性能测试中发现竟然与I/O操作处于同样的数量级）。基于Disruptor开发的系统单线程能支撑每秒600万订单，2010年在QCon演讲后，获得了业界关注。2011年，企业应用软件专家Martin Fowler专门撰写长文介绍。同年它还获得了Oracle官方的Duke大奖。

目前，包括Apache Storm、Camel、Log4j 2在内的很多知名项目都应用了Disruptor以获取高性能。

Github：https://github.com/LMAX-Exchange/disruptor

Disruptor实现了队列的功能并且是一个有界队列，可以用于生产者-消费者模型。

**2.3 Disruptor的高性能设计方案**

Disruptor通过以下设计来解决队列速度慢的问题：

- **环形数组结构**

为了避免垃圾回收，采用数组而非链表。同时，数组对处理器的缓存机制更加友好（空间局部性原理）。

- 元素位置定位

数组长度2^n，通过位运算，加快定位的速度。下标采取递增的形式。不用担心index溢出的问题。index是long类型，即使100万QPS的处理速度，也需要30万年才能用完。

- **无锁设计**

每个生产者或者消费者线程，会通过先申请可以操作的元素在数组中的位置，申请到之后，直接在该位置写入或者读取数据。整个过程通过原子变量CAS，保证操作的线程安全。

- **利用缓存行填充解决了伪共享的问题**
- 实现了基于事件驱动的生产者消费者模型（观察者模式）  

消费者时刻关注着队列里有没有消息，一旦有新消息产生，消费者线程就会立刻把它消费

**RingBuffer数据结构**

使用RingBuffer来作为队列的数据结构，RingBuffer就是一个可自定义大小的环形数组。除数组外还有一个序列号(sequence)，用以指向下一个可用的元素，供生产者与消费者使用。原理图如下所示：

![image-20250116221756310](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162217342.png)

- Disruptor要求设置数组长度为2的n次幂。在知道索引(index)下标的情况下，存与取数组上的元素时间复杂度只有O(1)，而这个index我们可以通过序列号与数组的长度取模来计算得出，index=sequence % entries.length。也可以用位运算来计算效率更高，此时array.length必须是2的幂次方，index=sequece&(entries.length-1)
- 当所有位置都放满了，再放下一个时，就会把0号位置覆盖掉

思考：覆盖数据是否会导致数据丢失呢？

**等待策略**

| 名称                        | 措施                      | 适用场景                                                     |
| --------------------------- | ------------------------- | ------------------------------------------------------------ |
| BlockingWaitStrategy        | 加锁                      | CPU资源紧缺，吞吐量和延迟并不重要的场景                      |
| BusySpinWaitStrategy        | 自旋                      | 通过不断重试，减少切换线程导致的系统调用，而降低延迟。推荐在线程绑定到固定的CPU的场景下使用 |
| PhasedBackoffWaitStrategy   | 自旋 + yield + 自定义策略 | CPU资源紧缺，吞吐量和延迟并不重要的场景                      |
| SleepingWaitStrategy        | 自旋 + yield + sleep      | 性能和CPU资源之间有很好的折中。延迟不均匀                    |
| TimeoutBlockingWaitStrategy | 加锁，有超时限制          | CPU资源紧缺，吞吐量和延迟并不重要的场景                      |
| YieldingWaitStrategy        | 自旋 + yield + 自旋       | 性能和CPU资源之间有很好的折中。延迟比较均匀                  |

**Disruptor在日志框架中的应用**

Log4j 2相对于Log4j 1最大的优势在于多线程并发场景下性能更优。该特性源自于Log4j 2的异步模式采用了Disruptor来处理。 在Log4j 2的配置文件中可以配置WaitStrategy，默认是Timeout策略。

![image-20250116221813991](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162218020.png)

loggers all async采用的是Disruptor，而Async Appender采用的是ArrayBlockingQueue队列。

由图可见，单线程情况下，loggers all async与Async Appender吞吐量相差不大，但是在64个线程的时候，loggers all async的吞吐量比Async Appender增加了12倍，是Sync模式的68倍。

## **2.4 Disruptor实战**

引入依赖

```xml
<!-- disruptor -->
<dependency>
    <groupId>com.lmax</groupId>
    <artifactId>disruptor</artifactId>
    <version>3.3.4</version>
</dependency>
```

Disruptor构造器

```java
public Disruptor(
        final EventFactory<T> eventFactory,
        final int ringBufferSize,
        final ThreadFactory threadFactory,
        final ProducerType producerType,
        final WaitStrategy waitStrategy)
```

- EventFactory：创建事件（任务）的工厂类。
- ringBufferSize：容器的长度。
- ThreadFactory ：用于创建执行任务的线程。
- ProductType：生产者类型：单生产者、多生产者。
- WaitStrategy：等待策略。

使用流程：

1）构建消息载体（事件）

2） 构建生产者

3）构建消费者

4） 生产消息，消费消息的测试

**单生产者单消费者模式**

**1）创建Event(消息载体/事件)和EventFactory（事件工厂）**

创建 OrderEvent 类，这个类将会被放入环形队列中作为消息内容。创建OrderEventFactory类，用于创建OrderEvent事件

```java
@Data
public class OrderEvent {
    private long value;
    private String name; 
}

public class OrderEventFactory implements EventFactory<OrderEvent> {
    
    @Override
    public OrderEvent newInstance() {
        return new OrderEvent();
    }
}
```

**2） 创建消息（事件）生产者**

创建 OrderEventProducer 类，它将作为生产者使用

```java
public class OrderEventProducer {
    //事件队列
    private RingBuffer<OrderEvent> ringBuffer;

    public OrderEventProducer(RingBuffer<OrderEvent> ringBuffer) {
        this.ringBuffer = ringBuffer;
    }

    public void onData(long value,String name) {
        // 获取事件队列 的下一个槽
        long sequence = ringBuffer.next();
        try {
            //获取消息（事件）
            OrderEvent orderEvent = ringBuffer.get(sequence);
            // 写入消息数据
            orderEvent.setValue(value);
            orderEvent.setName(name);
        } catch (Exception e) {
            // TODO  异常处理
            e.printStackTrace();
        } finally {
            System.out.println("生产者发送数据value:"+value+",name:"+name);
            //发布事件
            ringBuffer.publish(sequence);
        }
    }
}
```

**3）创建消费者**

创建 OrderEventHandler 类，并实现 EventHandler ，作为消费者。

```java
public class OrderEventHandler implements EventHandler<OrderEvent> {

    @Override
    public void onEvent(OrderEvent event, long sequence, boolean endOfBatch) throws Exception {
        // TODO 消费逻辑
        System.out.println("消费者获取数据value:"+ event.getValue()+",name:"+event.getName());
    }
}
```

**4） 测试**

```java
public class DisruptorDemo {

    public static void main(String[] args) throws Exception {

        //创建disruptor
        Disruptor<OrderEvent> disruptor = new Disruptor<>(
                new OrderEventFactory(),
                1024 * 1024,
                Executors.defaultThreadFactory(),
                ProducerType.SINGLE, //单生产者
                new YieldingWaitStrategy()  //等待策略
        );
        //设置消费者用于处理RingBuffer的事件
        disruptor.handleEventsWith(new OrderEventHandler());
        disruptor.start();

        //创建ringbuffer容器
        RingBuffer<OrderEvent> ringBuffer = disruptor.getRingBuffer();
        //创建生产者
        OrderEventProducer eventProducer = new OrderEventProducer(ringBuffer);
        //发送消息
        for(int i=0;i<100;i++){
            eventProducer.onData(i,"Fox"+i);
        }
        
        disruptor.shutdown();
    }
}
```

**单生产者多消费者模式**

如果消费者是多个，只需要在调用 handleEventsWith 方法时将多个消费者传递进去。

```java
//设置多消费者,消息会被重复消费
disruptor.handleEventsWith(new OrderEventHandler(), new OrderEventHandler());
```

上面传入的两个消费者会重复消费每一条消息，如果想实现一条消息在有多个消费者的情况下，只会被一个消费者消费，那么需要调用 handleEventsWithWorkerPool 方法。

```java
//设置多消费者,消费者要实现WorkHandler接口，一条消息只会被一个消费者消费
disruptor.handleEventsWithWorkerPool(new OrderEventHandler(), new OrderEventHandler());
```

注意：消费者要实现WorkHandler接口

```java
public class OrderEventHandler implements EventHandler<OrderEvent>, WorkHandler<OrderEvent> {

    @Override
    public void onEvent(OrderEvent event, long sequence, boolean endOfBatch) throws Exception {
        // TODO 消费逻辑
        System.out.println("消费者"+ Thread.currentThread().getName()
                +"获取数据value:"+ event.getValue()+",name:"+event.getName());
    }

    @Override
    public void onEvent(OrderEvent event) throws Exception {
        // TODO 消费逻辑
        System.out.println("消费者"+ Thread.currentThread().getName()
                +"获取数据value:"+ event.getValue()+",name:"+event.getName());
    }
}
```

**多生产者多消费者模式**

在实际开发中，多个生产者发送消息，多个消费者处理消息才是常态。

```java
public class DisruptorDemo2 {

    public static void main(String[] args) throws Exception {

        //创建disruptor
        Disruptor<OrderEvent> disruptor = new Disruptor<>(
                new OrderEventFactory(),
                1024 * 1024,
                Executors.defaultThreadFactory(),
                ProducerType.MULTI, //多生产者
                new YieldingWaitStrategy()  //等待策略
        );
        
        //设置消费者用于处理RingBuffer的事件
        //disruptor.handleEventsWith(new OrderEventHandler());
        //设置多消费者,消息会被重复消费
        //disruptor.handleEventsWith(new OrderEventHandler(),new OrderEventHandler());
        //设置多消费者,消费者要实现WorkHandler接口，一条消息只会被一个消费者消费
        disruptor.handleEventsWithWorkerPool(new OrderEventHandler(), new OrderEventHandler());

        //启动disruptor
        disruptor.start();

        //创建ringbuffer容器
        RingBuffer<OrderEvent> ringBuffer = disruptor.getRingBuffer();

        new Thread(()->{
            //创建生产者
            OrderEventProducer eventProducer = new OrderEventProducer(ringBuffer);
            // 发送消息
            for(int i=0;i<100;i++){
                eventProducer.onData(i,"Fox"+i);
            }
        },"producer1").start();

        new Thread(()->{
            //创建生产者
            OrderEventProducer eventProducer = new OrderEventProducer(ringBuffer);
            // 发送消息
            for(int i=0;i<100;i++){
                eventProducer.onData(i,"monkey"+i);
            }
        },"producer2").start();


        //disruptor.shutdown();
    }
}
```