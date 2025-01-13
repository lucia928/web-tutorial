## **常用并发同步工具类的真实应用场景**

jdk提供了比synchronized更加高级的各种同步工具，包括ReentrantLock、Semaphore、CountDownLatch、CyclicBarrier等，可以实现更加丰富的多线程操作。

![image-20250107234650197](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501072346245.png)

## **1. ReentrantLock**

ReentrantLock是一种可重入的独占锁，它允许同一个线程多次获取同一个锁而不会被阻塞。

它的功能类似于synchronized是一种互斥锁，可以保证线程安全。相对于 synchronized， ReentrantLock具备如下特点：

- 可中断 
- 可以设置超时时间
- 可以设置为公平锁 
- 支持多个条件变量
- 与 synchronized 一样，都支持可重入

它的主要应用场景是在多线程环境下对共享资源进行独占式访问，以保证数据的一致性和安全性。

![image-20250113225951594](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132259666.png)

![image-20250113230007739](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132300754.png)

### **1.1 常用API**

#### **Lock接口**

ReentrantLock实现了Lock接口规范，常见API如下：

| void lock()                                                  | 获取锁，调用该方法当前线程会获取锁，当锁获得后，该方法返回   |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| void lockInterruptibly() throws InterruptedException         | 可中断的获取锁，和lock()方法不同之处在于该方法会响应中断，即在锁的获取中可以中断当前线程 |
| boolean tryLock()                                            | 尝试非阻塞的获取锁，调用该方法后立即返回。如果能够获取到返回true，否则返回false |
| boolean tryLock(long time, TimeUnit unit) throws InterruptedException | 超时获取锁，当前线程在以下三种情况下会被返回:当前线程在超时时间内获取了锁当前线程在超时时间内被中断超时时间结束，返回false |
| void unlock()                                                | 释放锁                                                       |
| Condition newCondition()                                     | 获取等待通知组件，该组件和当前的锁绑定，当前线程只有获取了锁，才能调用该组件的await()方法，而调用后，当前线程将释放锁 |

#### **基本语法**

```java
//加锁  阻塞 
lock.lock(); 
try {  
    ...
} finally { 
    // 解锁 
    lock.unlock();  
}


//尝试加锁   非阻塞
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try {
        ...
    } finally {
        lock.unlock();
    }
}
```

在使用时要注意 4 个问题：

1. 默认情况下 ReentrantLock 为非公平锁而非公平锁;
2. 加锁次数和释放锁次数一定要保持一致，否则会导致线程阻塞或程序异常;
3. 加锁操作一定要放在 try 代码之前，这样可以避免未加锁成功又释放锁的异常;
4. 释放锁一定要放在 finally 中，否则会导致线程阻塞。

### **1.2 ReentrantLock使用**

#### **独占锁：模拟抢票场景**

8张票，10个人抢，如果不加锁，会出现什么问题？

```java
/**
 *  模拟抢票场景
 */
public class ReentrantLockDemo {

    private final ReentrantLock lock = new ReentrantLock();//默认非公平
    private static int tickets = 8; // 总票数

    public void buyTicket() {
        lock.lock(); // 获取锁
        try {
            if (tickets > 0) { // 还有票
                try {
                    Thread.sleep(10); // 休眠10ms,模拟出并发效果
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread().getName() + "购买了第" + tickets-- + "张票");
            } else {
                System.out.println("票已经卖完了，" + Thread.currentThread().getName() + "抢票失败");
            }

        } finally {
            lock.unlock(); // 释放锁
        }
    }


    public static void main(String[] args) {
        ReentrantLockDemo ticketSystem = new ReentrantLockDemo();
        for (int i = 1; i <= 10; i++) {
            Thread thread = new Thread(() -> {
                ticketSystem.buyTicket(); // 抢票

            }, "线程" + i);
            // 启动线程
            thread.start();
        }


        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        System.out.println("剩余票数：" + tickets);
    }
}
```

不加锁的效果： 出现超卖的问题

![image-20250113230126589](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132301610.png)

加锁效果： 正常，两个人抢票失败

![image-20250113230133956](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132301978.png)

#### **公平锁和非公平锁**

ReentrantLock支持公平锁和非公平锁两种模式：

- 公平锁：线程在获取锁时，按照等待的先后顺序获取锁。
- 非公平锁：线程在获取锁时，不按照等待的先后顺序获取锁，而是随机获取锁。ReentrantLock默认是非公平锁

```java
ReentrantLock lock = new ReentrantLock(); //参数默认false，不公平锁  
ReentrantLock lock = new ReentrantLock(true); //公平锁  
```

比如买票的时候就有可能出现插队的场景，允许插队就是非公平锁，如下图：

![image-20250113230206033](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132302060.png)

#### **可重入锁**

可重入锁又名递归锁，是指在同一个线程在外层方法获取锁的时候，再进入该线程的内层方法会自动获取锁（前提锁对象得是同一个对象），不会因为之前已经获取过还没释放而阻塞。Java中ReentrantLock和synchronized都是可重入锁，可重入锁的一个优点是可一定程度避免死锁。在实际开发中，可重入锁常常应用于递归操作、调用同一个类中的其他方法、锁嵌套等场景中。

```java
class Counter {
    private final ReentrantLock lock = new ReentrantLock(); // 创建 ReentrantLock 对象

    public void recursiveCall(int num) {
        lock.lock(); // 获取锁
        try {
            if (num == 0) {
                return;
            }
            System.out.println("执行递归，num = " + num);
            recursiveCall(num - 1);
        } finally {
            lock.unlock(); // 释放锁
        }
    }
    
    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter(); // 创建计数器对象

        // 测试递归调用
        counter.recursiveCall(10);
    }
}
```

#### **结合Condition实现生产者消费者模式**

java.util.concurrent类库中提供Condition类来实现线程之间的协调。调用Condition.await() 方法使线程等待，其他线程调用Condition.signal() 或 Condition.signalAll() 方法唤醒等待的线程。

注意：调用Condition的await()和signal()方法，都必须在lock保护之内。

案例：基于ReentrantLock和Condition实现一个简单队列

```java
public class ReentrantLockDemo3 {

    public static void main(String[] args) {
        // 创建队列
        Queue queue = new Queue(5);
        //启动生产者线程
        new Thread(new Producer(queue)).start();
        //启动消费者线程
        new Thread(new Customer(queue)).start();

    }
}

/**
 * 队列封装类
 */
class Queue {
    private Object[] items ;
    int size = 0;
    int takeIndex;
    int putIndex;
    private ReentrantLock lock;
    public Condition notEmpty; //消费者线程阻塞唤醒条件，队列为空阻塞，生产者生产完唤醒
    public Condition notFull; //生产者线程阻塞唤醒条件，队列满了阻塞，消费者消费完唤醒

    public Queue(int capacity){
        this.items = new Object[capacity];
        lock = new ReentrantLock();
        notEmpty = lock.newCondition();
        notFull =  lock.newCondition();
    }


    public void put(Object value) throws Exception {
        //加锁
        lock.lock();
        try {
            while (size == items.length)
                // 队列满了让生产者等待
                notFull.await();

            items[putIndex] = value;
            if (++putIndex == items.length)
                putIndex = 0;
            size++;
            notEmpty.signal(); // 生产完唤醒消费者

        } finally {
            System.out.println("producer生产：" + value);
            //解锁
            lock.unlock();
        }
    }

    public Object take() throws Exception {
        lock.lock();
        try {
            // 队列空了就让消费者等待
            while (size == 0)
                notEmpty.await();

            Object value = items[takeIndex];
            items[takeIndex] = null;
            if (++takeIndex == items.length)
                takeIndex = 0;
            size--;
            notFull.signal(); //消费完唤醒生产者生产
            return value;
        } finally {
            lock.unlock();
        }
    }
}

/**
 * 生产者
 */
class Producer implements Runnable {

    private Queue queue;

    public Producer(Queue queue) {
        this.queue = queue;
    }

    @Override
    public void run() {
        try {
            // 隔1秒轮询生产一次
            while (true) {
                Thread.sleep(1000);
                queue.put(new Random().nextInt(1000));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

/**
 * 消费者
 */
class Customer implements Runnable {

    private Queue queue;

    public Customer(Queue queue) {
        this.queue = queue;
    }

    @Override
    public void run() {
        try {
            // 隔2秒轮询消费一次
            while (true) {
                Thread.sleep(2000);
                System.out.println("consumer消费：" + queue.take());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### **1.3 应用场景总结**

ReentrantLock具体应用场景如下：

1. 解决多线程竞争资源的问题，例如多个线程同时对同一个数据库进行写操作，可以使用ReentrantLock保证每次只有一个线程能够写入。
2. 实现多线程任务的顺序执行，例如在一个线程执行完某个任务后，再让另一个线程执行任务。
3. 实现多线程等待/通知机制，例如在某个线程执行完某个任务后，通知其他线程继续执行任务。

### 

## **2. Semaphore**

Semaphore（信号量）是一种用于多线程编程的同步工具，用于控制同时访问某个资源的线程数量。

![image-20250113230258824](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132302848.png)

Semaphore维护了一个计数器，线程可以通过调用acquire()方法来获取Semaphore中的许可证，当计数器为0时，调用acquire()的线程将被阻塞，直到有其他线程释放许可证；线程可以通过调用release()方法来释放Semaphore中的许可证，这会使Semaphore中的计数器增加，从而允许更多的线程访问共享资源。

### **2.1 常用API**

#### **构造器**

![image-20250113230309344](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132303388.png)

- permits 表示许可证的数量（资源数）
- fair 表示公平性，如果这个设为 true 的话，下次执行的线程会是等待最久的线程

#### **常用方法**

- acquire() 表示阻塞并获取许可
- tryAcquire() 方法在没有许可的情况下会立即返回 false，要获取许可的线程不会阻塞
- release() 表示释放许可

### **2.2 Semaphore使用**

#### **Semaphore实现服务接口限流**

```java
@Slf4j
public class SemaphoreDemo {

    /**
     * 同一时刻最多只允许有两个并发
     */
    private static Semaphore semaphore = new Semaphore(2);

    private static Executor executor = Executors.newFixedThreadPool(10);

    public static void main(String[] args) {
        for(int i=0;i<10;i++){
            executor.execute(()->getProductInfo2());
        }
    }

    public static String getProductInfo() {
        try {
            semaphore.acquire();
            log.info("请求服务");
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }finally {
            semaphore.release();
        }
        return "返回商品详情信息";
    }

    public static String getProductInfo2() {

        if(!semaphore.tryAcquire()){
            log.error("请求被流控了");
            return "请求被流控了";
        }
        try {
            log.info("请求服务");
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }finally {
            semaphore.release();
        }
        return "返回商品详情信息";
    }
}
```

#### **Semaphore实现数据库连接池**

```java
public class SemaphoreDemo2 {

    public static void main(String[] args) {
        final ConnectPool pool = new ConnectPool(2);
        ExecutorService executorService = Executors.newCachedThreadPool();

        //5个线程并发来争抢连接资源
        for (int i = 0; i < 5; i++) {
            final int id = i + 1;
            executorService.execute(new Runnable() {
                @Override
                public void run() {
                    Connect connect = null;
                    try {
                        System.out.println("线程" + id + "等待获取数据库连接");
                        connect = pool.openConnect();
                        System.out.println("线程" + id + "已拿到数据库连接:" + connect);
                        //进行数据库操作2秒...然后释放连接
                        Thread.sleep(2000);
                        System.out.println("线程" + id + "释放数据库连接:" + connect);

                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } finally {
                        pool.releaseConnect(connect);
                    }

                }
            });
        }
    }
}

//数据库连接池
class ConnectPool {
    private int size;
    private Connect[] connects;

    //记录对应下标的Connect是否已被使用
    private boolean[] connectFlag;
    //信号量对象
    private Semaphore semaphore;

    /**
     * size:初始化连接池大小
     */
    public ConnectPool(int size) {
        this.size = size;
        semaphore = new Semaphore(size, true);
        connects = new Connect[size];
        connectFlag = new boolean[size];
        initConnects();//初始化连接池
    }

    private void initConnects() {
        for (int i = 0; i < this.size; i++) {
            connects[i] = new Connect();
        }
    }

    /**
     * 获取数据库连接
     *
     * @return
     * @throws InterruptedException
     */
    public Connect openConnect() throws InterruptedException {
        //得先获得使用许可证，如果信号量为0，则拿不到许可证，一直阻塞直到能获得
        semaphore.acquire();
        return getConnect();
    }

    private synchronized Connect getConnect() {
        for (int i = 0; i < connectFlag.length; i++) {
            if (!connectFlag[i]) {
                //标记该连接已被使用
                connectFlag[i] = true;
                return connects[i];
            }
        }
        return null;
    }

    /**
     * 释放某个数据库连接
     */
    public synchronized void releaseConnect(Connect connect) {
        for (int i = 0; i < this.size; i++) {
            if (connect == connects[i]) {
                connectFlag[i] = false;
                semaphore.release();
            }
        }
    }
}

/**
 * 数据库连接
 */
class Connect {

    private static int count = 1;
    private int id = count++;

    public Connect() {
        //假设打开一个连接很耗费资源，需要等待1秒
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("连接#" + id + "#已与数据库建立通道！");
    }

    @Override
    public String toString() {
        return "#" + id + "#";

    }

}
```

### **2.3 应用场景总结**

以下是一些使用Semaphore的常见场景：

1. 限流：Semaphore可以用于限制对共享资源的并发访问数量，以控制系统的流量。
2. 资源池：Semaphore可以用于实现资源池，以维护一组有限的共享资源。

## **3. CountDownLatch**

CountDownLatch（闭锁）是一个同步协助类，允许一个或多个线程等待，直到其他线程完成操作集。

![image-20250113230411541](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132304580.png)

CountDownLatch使用给定的计数值（count）初始化。await方法会阻塞直到当前的计数值（count），由于countDown方法的调用达到0，count为0之后所有等待的线程都会被释放，并且随后对await方法的调用都会立即返回。这是一个一次性现象 —— count不会被重置。

### **3.1 常用API**

#### **构造器**

![image-20250113230425194](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132304222.png)

#### **常用方法**

```java
 // 调用 await() 方法的线程会被挂起，它会等待直到 count 值为 0 才继续执行
public void await() throws InterruptedException { };  
// 和 await() 类似，若等待 timeout 时长后，count 值还是没有变为 0，不再等待，继续执行
public boolean await(long timeout, TimeUnit unit) throws InterruptedException { };  
// 会将 count 减 1，直至为 0
public void countDown() { }; 
```

### **3.2 CountDownLatch使用**

#### **模拟实现百米赛跑**

```java
public class CountDownLatchDemo {
    // begin 代表裁判 初始为 1
    private static CountDownLatch begin = new CountDownLatch(1);

    // end 代表玩家 初始为 8
    private static CountDownLatch end = new CountDownLatch(8);

    public static void main(String[] args) throws InterruptedException {

        for (int i = 1; i <= 8; i++) {
            new Thread(new Runnable() {
                @SneakyThrows
                @Override
                public void run() {
                    // 预备状态
                    System.out.println("参赛者"+Thread.currentThread().getName()+ "已经准备好了");
                    // 等待裁判吹哨
                    begin.await();
                    // 开始跑步
                    System.out.println("参赛者"+Thread.currentThread().getName() + "开始跑步");
                    Thread.sleep(1000);
                    // 跑步结束, 跑完了
                    System.out.println("参赛者"+Thread.currentThread().getName()+ "到达终点");
                    // 跑到终点, 计数器就减一
                    end.countDown();
                }
            }).start();
        }
        // 等待 5s 就开始吹哨
        Thread.sleep(5000);
        System.out.println("开始比赛");
        // 裁判吹哨, 计数器减一
        begin.countDown();
        // 等待所有玩家到达终点
        end.await();
        System.out.println("比赛结束");

    }
```

#### **多任务完成后合并汇总**

很多时候，我们的并发任务，存在前后依赖关系；比如数据详情页需要同时调用多个接口获取数据，并发请求获取到数据后、需要进行结果合并；或者多个数据操作完成后，需要数据check。

```java
public class CountDownLatchDemo2 {
    public static void main(String[] args) throws Exception {

        CountDownLatch countDownLatch = new CountDownLatch(5);
        for (int i = 0; i < 5; i++) {
            final int index = i;
            new Thread(() -> {
                try {
                    Thread.sleep(1000 + ThreadLocalRandom.current().nextInt(2000));
                    System.out.println("任务" + index +"执行完成");
                    countDownLatch.countDown();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }

        // 主线程在阻塞，当计数器为0，就唤醒主线程往下执行
        countDownLatch.await();
        System.out.println("主线程:在所有任务运行完成后，进行结果汇总");
    }
}
```

### **3.3 应用场景总结**

以下是使用CountDownLatch的常见场景：

1. 并行任务同步：CountDownLatch可以用于协调多个并行任务的完成情况，确保所有任务都完成后再继续执行下一步操作。
2. 多任务汇总：CountDownLatch可以用于统计多个线程的完成情况，以确定所有线程都已完成工作。
3. 资源初始化：CountDownLatch可以用于等待资源的初始化完成，以便在资源初始化完成后开始使用。

## **4. CyclicBarrier**

CyclicBarrier（回环栅栏或循环屏障），是 Java 并发库中的一个同步工具，通过它可以实现让一组线程等待至某个状态（屏障点）之后再全部同时执行。叫做回环是因为当所有等待线程都被释放以后，CyclicBarrier可以被重用。

![image-20250113230522365](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132305392.png)

#### **4.1 常用API**

##### **构造器**

```java
 // parties表示屏障拦截的线程数量，每个线程调用 await 方法告诉 CyclicBarrier 我已经到达了屏障，然后当前线程被阻塞。
 public CyclicBarrier(int parties)
 // 用于在线程到达屏障时，优先执行 barrierAction，方便处理更复杂的业务场景(该线程的执行时机是在到达屏障之后再执行)
 public CyclicBarrier(int parties, Runnable barrierAction)
```

![image-20250113230544966](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132305021.png)

##### **常用方法**

```java
//指定数量的线程全部调用await()方法时，这些线程不再阻塞
// BrokenBarrierException 表示栅栏已经被破坏，破坏的原因可能是其中一个线程 await() 时被中断或者超时
public int await() throws InterruptedException, BrokenBarrierException
public int await(long timeout, TimeUnit unit) throws InterruptedException, BrokenBarrierException, TimeoutException

//循环  通过reset()方法可以进行重置
public void reset()
```

### **4.2 CyclicBarrier使用**

#### **模拟人满发车**

利用CyclicBarrier的计数器能够重置，屏障可以重复使用的特性，可以支持类似“人满发车”的场景

```java
public class CyclicBarrierDemo {

    public static void main(String[] args) {

        ExecutorService executorService = Executors.newFixedThreadPool(5);

        CyclicBarrier cyclicBarrier = new CyclicBarrier(5,
                () -> System.out.println("人齐了，准备发车"));

        for (int i = 0; i < 10; i++) {
            final int id = i + 1;
            executorService.submit(new Runnable() {
                @Override
                public void run() {
                    try {
                        System.out.println(id + "号马上就到");
                        int sleepMills = ThreadLocalRandom.current().nextInt(2000);
                        Thread.sleep(sleepMills);
                        System.out.println(id + "号到了，上车");
                        cyclicBarrier.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }catch(BrokenBarrierException e){
                        e.printStackTrace();
                    }
                }
            });
        }

    }

}
```

#### **多线程批量处理数据**

```java
public class CyclicBarrierBatchProcessorDemo {

    public static void main(String[] args) {
        //生成数据
        List<Integer> data = new ArrayList<>();
        for (int i = 1; i <= 50; i++) {
            data.add(i);
        }

        //指定数据处理大小
        int batchSize = 5;
        CyclicBarrierBatchProcessor processor = new CyclicBarrierBatchProcessor(data, batchSize);
        //处理数据
        processor.process(batchData -> {
            for (Integer i : batchData) {
                System.out.println(Thread.currentThread().getName() + "处理数据" + i);
            }
        });
    }
}


class CyclicBarrierBatchProcessor {
    private List<Integer> data;
    private int batchSize;
    private CyclicBarrier barrier;
    private List<Thread> threads;

    public CyclicBarrierBatchProcessor(List<Integer> data, int batchSize) {
        this.data = data;
        this.batchSize = batchSize;
        this.barrier = new CyclicBarrier(batchSize);
        this.threads = new ArrayList<>();
    }

    public void process(BatchTask task) {
        // 对任务分批，获取线程数
        int threadCount = (data.size() + batchSize - 1) / batchSize;
        for (int i = 0; i < threadCount; i++) {
            int start = i * batchSize;
            int end = Math.min(start + batchSize, data.size());
            //获取每个线程处理的任务数
            List<Integer> batchData = data.subList(start, end);
            Thread thread = new Thread(() -> {
                task.process(batchData);
                try {
                    barrier.await();
                } catch (InterruptedException | BrokenBarrierException e) {
                    e.printStackTrace();
                }
            });
            threads.add(thread);
            thread.start();
        }

    }

    public interface BatchTask {
        void process(List<Integer> batchData);
    }
}
```



### **4.3 应用场景总结**

以下是一些常见的 CyclicBarrier 应用场景：

1. 多线程任务：CyclicBarrier 可以用于将复杂的任务分配给多个线程执行，并在所有线程完成工作后触发后续操作。
2. 数据处理：CyclicBarrier 可以用于协调多个线程间的数据处理，在所有线程处理完数据后触发后续操作。

### **4.4 CyclicBarrier 与 CountDownLatch 区别**

- CountDownLatch 是一次性的，CyclicBarrier 是可循环利用的
- CountDownLatch 参与的线程的职责是不一样的，有的在倒计时，有的在等待倒计时结束。CyclicBarrier 参与的线程职责是一样的。

## **5. Exchanger**

Exchanger是一个用于线程间协作的工具类，用于两个线程间交换数据。具体交换数据是通过exchange方法来实现的，如果一个线程先执行exchange方法，那么它会同步等待另一个线程也执行exchange方法，这个时候两个线程就都达到了同步点，两个线程就可以交换数据。

![image-20250113230826059](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132308085.png)

### **5.1 常用API**

```java
public V exchange(V x) throws InterruptedException
public V exchange(V x, long timeout, TimeUnit unit) throws InterruptedException, TimeoutException
```

- V exchange(V v)：等待另一个线程到达此交换点（除非当前线程被中断），然后将给定的对象传送给该线程，并接收该线程的对象。
- V exchange(V v, long timeout, TimeUnit unit)：等待另一个线程到达此交换点，或者当前线程被中断——抛出中断异常；又或者是等候超时——抛出超时异常，然后将给定的对象传送给该线程，并接收该线程的对象。

### **5.2 Exchanger使用**

#### **模拟交易场景**

用一个简单的例子来看下Exchanger的具体使用。两方做交易，如果一方先到要等另一方也到了才能交易，交易就是执行exchange方法交换数据。

```java
public class ExchangerDemo {
    private static Exchanger exchanger = new Exchanger();
    static String goods = "电脑";
    static String money = "$4000";
    public static void main(String[] args) throws InterruptedException {

        System.out.println("准备交易，一手交钱一手交货...");
        // 卖家
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("卖家到了，已经准备好货：" + goods);
                try {
                    String money = (String) exchanger.exchange(goods);
                    System.out.println("卖家收到钱：" + money);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }).start();

        Thread.sleep(3000);

        // 买家
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("买家到了，已经准备好钱：" + money);
                    String goods = (String) exchanger.exchange(money);
                    System.out.println("买家收到货：" + goods);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }).start();

    }
}
```

#### **模拟对账场景**

```java
public class ExchangerDemo2 {

    private static final Exchanger<String> exchanger = new Exchanger();
    private static ExecutorService threadPool = Executors.newFixedThreadPool(2);

    public static void main(String[] args) {

        threadPool.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String A = "12379871924sfkhfksdhfks";
                    exchanger.exchange(A);
                } catch (InterruptedException e) {
                }
            }
        });

        threadPool.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String B = "32423423jknjkfsbfj";
                    String A = exchanger.exchange(B);
                    System.out.println("A和B数据是否一致：" + A.equals(B));
                    System.out.println("A= "+A);
                    System.out.println("B= "+B);
                } catch (InterruptedException e) {
                }
            }
        });

        threadPool.shutdown();

    }
}
```

#### **模拟队列中交换数据场景**

```java
public class ExchangerDemo3 {

    private static ArrayBlockingQueue<String> fullQueue
            = new ArrayBlockingQueue<>(5);
    private static ArrayBlockingQueue<String> emptyQueue
            = new ArrayBlockingQueue<>(5);
    private static Exchanger<ArrayBlockingQueue<String>> exchanger
            = new Exchanger<>();


    public static void main(String[] args) {
        new Thread(new Producer()).start();
        new Thread(new Consumer()).start();

    }

    /**
     * 生产者
     */
    static class Producer implements Runnable {
        @Override
        public void run() {
            ArrayBlockingQueue<String> current = emptyQueue;
            try {
                while (current != null) {
                    String str = UUID.randomUUID().toString();
                    try {
                        current.add(str);
                        System.out.println("producer：生产了一个序列：" + str + ">>>>>加入到交换区");
                        Thread.sleep(2000);
                    } catch (IllegalStateException e) {
                        System.out.println("producer：队列已满，换一个空的");
                        current = exchanger.exchange(current);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 消费者
     */
    static class Consumer implements Runnable {
        @Override
        public void run() {
            ArrayBlockingQueue<String> current = fullQueue;
            try {
                while (current != null) {
                    if (!current.isEmpty()) {
                        String str = current.poll();
                        System.out.println("consumer：消耗一个序列：" + str);
                        Thread.sleep(1000);
                    } else {
                        System.out.println("consumer：队列空了，换个满的");
                        current = exchanger.exchange(current);
                        System.out.println("consumer：换满的成功~~~~~~~~~~~~~~~~~~~~~~");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


}
```

### **5.3 应用场景总结**

Exchanger 可以用于各种应用场景，具体取决于具体的 Exchanger 实现。常见的场景包括：

1. 数据交换：在多线程环境中，两个线程可以通过 Exchanger 进行数据交换。
2. 数据采集：在数据采集系统中，可以使用 Exchanger 在采集线程和处理线程间进行数据交换。

## **6. Phaser**

Phaser（阶段协同器）是一个Java实现的并发工具类，用于协调多个线程的执行。它提供了一些方便的方法来管理多个阶段的执行，可以让程序员灵活地控制线程的执行顺序和阶段性的执行。Phaser可以被视为CyclicBarrier和CountDownLatch的进化版，它能够自适应地调整并发线程数，可以动态地增加或减少参与线程的数量。所以Phaser特别适合使用在重复执行或者重用的情况。

![image-20250113231121009](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501132311049.png)

### **6.1 常用API**

**构造方法**

- Phaser(): 参与任务数0
- Phaser(int parties) :指定初始参与任务数
- Phaser(Phaser parent) :指定parent阶段器， 子对象作为一个整体加入parent对象， 当子对象中没有参与者时，会自动从parent对象解除注册
- Phaser(Phaser parent，int parties) : 集合上面两个方法

**增减参与任务数方法**

- int register() 增加一个任务数，返回当前阶段号。
- int bulkRegister(int parties) 增加指定任务个数，返回当前阶段号。
- int arriveAndDeregister() 减少一个任务数，返回当前阶段号。

**到达、等待方法**

- int arrive() 到达(任务完成)，返回当前阶段号。
- int arriveAndAwaitAdvance() 到达后等待其他任务到达，返回到达阶段号。
- int awaitAdvance(int phase) 在指定阶段等待(必须是当前阶段才有效)
- int awaitAdvanceInterruptibly(int phase) 阶段到达触发动作
- int awaitAdvanceInterruptiBly(int phase，long timeout，TimeUnit unit)
- protected boolean onAdvance(int phase，int registeredParties)类似CyclicBarrier的触发命令，通过重写该方法来增加阶段到达动作，该方法返回true将终结Phaser对象。

### **6.2 Phaser使用**

#### **多线程批量处理数据**

```java
public class PhaserBatchProcessorDemo {

    private final List<String> data;
    private final int batchSize;  //一次处理多少数据
    private final int threadCount; //处理的线程数
    private final Phaser phaser;
    private final List<String> processedData;

    public PhaserBatchProcessorDemo(List<String> data, int batchSize, int threadCount) {
        this.data = data;
        this.batchSize = batchSize;
        this.threadCount = threadCount;
        this.phaser = new Phaser(1);
        this.processedData = new ArrayList<>();
    }

    public void process() {
        for (int i = 0; i < threadCount; i++) {

            phaser.register();
            new Thread(new BatchProcessor(i)).start();
        }

        phaser.arriveAndDeregister();
    }

    private class BatchProcessor implements Runnable {

        private final int threadIndex;

        public BatchProcessor(int threadIndex) {
            this.threadIndex = threadIndex;
        }

        @Override
        public void run() {
            int index = 0;
            while (true) {
                // 所有线程都到达这个点之前会阻塞
                phaser.arriveAndAwaitAdvance();

                // 从未处理数据中找到一个可以处理的批次
                List<String> batch = new ArrayList<>();
                synchronized (data) {
                    while (index < data.size() && batch.size() < batchSize) {
                        String d = data.get(index);
                        if (!processedData.contains(d)) {
                            batch.add(d);
                            processedData.add(d);
                        }
                        index++;
                    }
                }

                // 处理数据
                for (String d : batch) {
                    System.out.println("线程" + threadIndex + "处理数据" + d);
                }

                // 所有线程都处理完当前批次之前会阻塞
                phaser.arriveAndAwaitAdvance();

                // 所有线程都处理完当前批次并且未处理数据已经处理完之前会阻塞
                if (batch.isEmpty() || index >= data.size()) {
                    phaser.arriveAndDeregister();
                    break;
                }
            }
        }
    }

    public static void main(String[] args) {
        //数据准备
        List<String> data = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            data.add(String.valueOf(i));
        }

        int batchSize = 4;
        int threadCount = 3;
        PhaserBatchProcessorDemo processor = new PhaserBatchProcessorDemo(data, batchSize, threadCount);
        //处理数据
        processor.process();
    }
}
```

#### **阶段性任务：模拟公司团建**

```java
public class PhaserDemo {
    public static void main(String[] args) {
        final Phaser phaser = new Phaser() {
            //重写该方法来增加阶段到达动作
            @Override
            protected boolean onAdvance(int phase, int registeredParties) {
                // 参与者数量，去除主线程
                int staffs = registeredParties - 1;
                switch (phase) {
                    case 0:
                        System.out.println("大家都到公司了，出发去公园，人数：" + staffs);
                        break;
                    case 1:
                        System.out.println("大家都到公园门口了，出发去餐厅，人数：" + staffs);
                        break;
                    case 2:
                        System.out.println("大家都到餐厅了，开始用餐，人数：" + staffs);
                        break;

                }

                // 判断是否只剩下主线程（一个参与者），如果是，则返回true，代表终止
                return registeredParties == 1;
            }
        };

        // 注册主线程 ———— 让主线程全程参与
        phaser.register();
        final StaffTask staffTask = new StaffTask();

        // 3个全程参与团建的员工
        for (int i = 0; i < 3; i++) {
            // 添加任务数
            phaser.register();
            new Thread(() -> {
                try {
                    staffTask.step1Task();
                    //到达后等待其他任务到达
                    phaser.arriveAndAwaitAdvance();

                    staffTask.step2Task();
                    phaser.arriveAndAwaitAdvance();

                    staffTask.step3Task();
                    phaser.arriveAndAwaitAdvance();

                    staffTask.step4Task();
                    // 完成了，注销离开
                    phaser.arriveAndDeregister();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }

        // 两个不聚餐的员工加入
        for (int i = 0; i < 2; i++) {
            phaser.register();
            new Thread(() -> {
                try {
                    staffTask.step1Task();
                    phaser.arriveAndAwaitAdvance();

                    staffTask.step2Task();
                    System.out.println("员工【" + Thread.currentThread().getName() + "】回家了");
                    // 完成了，注销离开
                    phaser.arriveAndDeregister();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }).start();
        }

        while (!phaser.isTerminated()) {
            int phase = phaser.arriveAndAwaitAdvance();
            if (phase == 2) {
                // 到了去餐厅的阶段，又新增4人，参加晚上的聚餐
                for (int i = 0; i < 4; i++) {
                    phaser.register();
                    new Thread(() -> {
                        try {
                            staffTask.step3Task();
                            phaser.arriveAndAwaitAdvance();

                            staffTask.step4Task();
                            // 完成了，注销离开
                            phaser.arriveAndDeregister();
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }).start();
                }
            }
        }
    }

    static final Random random = new Random();

    static class StaffTask {
        public void step1Task() throws InterruptedException {
            // 第一阶段：来公司集合
            String staff = "员工【" + Thread.currentThread().getName() + "】";
            System.out.println(staff + "从家出发了……");
            Thread.sleep(random.nextInt(5000));
            System.out.println(staff + "到达公司");
        }

        public void step2Task() throws InterruptedException {
            // 第二阶段：出发去公园
            String staff = "员工【" + Thread.currentThread().getName() + "】";
            System.out.println(staff + "出发去公园玩");
            Thread.sleep(random.nextInt(5000));
            System.out.println(staff + "到达公园门口集合");

        }

        public void step3Task() throws InterruptedException {
            // 第三阶段：去餐厅
            String staff = "员工【" + Thread.currentThread().getName() + "】";
            System.out.println(staff + "出发去餐厅");
            Thread.sleep(random.nextInt(5000));
            System.out.println(staff + "到达餐厅");

        }

        public void step4Task() throws InterruptedException {
            // 第四阶段：就餐
            String staff = "员工【" + Thread.currentThread().getName() + "】";
            System.out.println(staff + "开始用餐");
            Thread.sleep(random.nextInt(5000));
            System.out.println(staff + "用餐结束，回家");
        }
    }
}
```

### **6.3 应用场景总结**

以下是一些常见的 Phaser 应用场景：

1. 多线程任务分配：Phaser 可以用于将复杂的任务分配给多个线程执行，并协调线程间的合作。
2. 多级任务流程：Phaser 可以用于实现多级任务流程，在每一级任务完成后触发下一级任务的开始。
3. 模拟并行计算：Phaser 可以用于模拟并行计算，协调多个线程间的工作。
4. 阶段性任务：Phaser 可以用于实现阶段性任务，在每一阶段任务完成后触发下一阶段任务的开始。