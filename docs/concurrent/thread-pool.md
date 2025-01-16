# 线程池原理分析

## **线程池执行任务的具体流程是怎样的？**

ThreadPoolExecutor中提供了两种执行任务的方法：

1. void execute(Runnable command)
2. Future submit(Runnable task)

实际上submit中最终还是调用的execute()方法，只不过会返回一个Future对象，用来获取任务执行结果：

```java
public Future<?> submit(Runnable task) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<Void> ftask = newTaskFor(task, null);
    execute(ftask);
    return ftask;
}
```

execute(Runnable command)方法执行时会分为三步：

<img src="https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162239603.png" alt="image-20250116223918575" style="zoom:67%;" />

**注意：提交一个Runnable时，不管当前线程池中的线程是否空闲，只要数量小于核心线程数就会创建新线程。**

**注意：ThreadPoolExecutor相当于是非公平的，比如队列满了之后提交的Runnable可能会比正在排队的Runnable先执行。**

## **线程池的五种状态是如何流转的？**

线程池有五种状态：

- RUNNING：**会**接收新任务并且**会**处理队列中的任务
- SHUTDOWN：**不会**接收新任务并且**会**处理队列中的任务
- STOP：**不会**接收新任务并且**不会**处理队列中的任务，并且会中断在处理的任务（注意：一个任务能不能被中断得看任务本身）
- TIDYING：所有任务都终止了，线程池中也没有线程了，这样线程池的状态就会转为TIDYING，一旦达到此状态，就会调用线程池的terminated()
- TERMINATED：terminated()执行完之后就会转变为TERMINATED

这五种状态并不能任意转换，只会有以下几种转换情况：

1. RUNNING -> SHUTDOWN：手动调用shutdown()触发，或者线程池对象GC时会调用finalize()从而调用shutdown()
2. (RUNNING or SHUTDOWN) -> STOP：调用shutdownNow()触发，如果先调shutdown()紧着调shutdownNow()，就会发生SHUTDOWN -> STOP
3. SHUTDOWN -> TIDYING：队列为空并且线程池中没有线程时自动转换
4. STOP -> TIDYING：线程池中没有线程时自动转换（队列中可能还有任务）
5. TIDYING -> TERMINATED：terminated()执行完后就会自动转换

## **线程池中的线程是如何关闭的？**

我们一般会使用thread.start()方法来开启一个线程，那如何停掉一个线程呢？

Thread类提供了一个stop()，但是标记了@Deprecated，为什么不推荐用stop()方法来停掉线程呢？

因为stop()方法太粗暴了，一旦调用了stop()，就会直接停掉线程，但是调用的时候根本不知道线程刚刚在做什么，任务做到哪一步了，这是很危险的。

这里强调一点，stop()会释放线程占用的synchronized锁（不会自动释放ReentrantLock锁，这也是不建议用stop()的一个因素）。

```java
package com.zhouyu;

import java.util.concurrent.locks.ReentrantLock;

/**
 * 作者：周瑜大都督
 */
public class ThreadTest {

    static int count = 0;
    static final Object lock = new Object();
    static final ReentrantLock reentrantLock = new ReentrantLock();

    public static void main(String[] args) throws InterruptedException {

        Thread thread = new Thread(new Runnable() {
            public void run() {
//                synchronized (lock) {
                reentrantLock.lock();
                    for (int i = 0; i < 100; i++) {
                        count++;
                        try {
                            Thread.sleep(1000);
                        } catch (InterruptedException e) {
                            throw new RuntimeException(e);
                        }
                    }
//                }
                reentrantLock.unlock();
            }
        });

        thread.start();

        Thread.sleep(5*1000);

        thread.stop();
//
//        Thread.sleep(5*1000);

        reentrantLock.lock();
        System.out.println(count);
        reentrantLock.unlock();

//        synchronized (lock) {
//            System.out.println(count);
//        }


    }
}
```

所以，我们建议通过自定义一个变量，或者通过中断来停掉一个线程，比如：

```java
public class ThreadTest {

    static int count = 0;
    static boolean stop = false;

    public static void main(String[] args) throws InterruptedException {

        Thread thread = new Thread(new Runnable() {
            public void run() {

                for (int i = 0; i < 100; i++) {
                    if (stop) {
                        break;
                    }

                    count++;
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                }
            }
        });

        thread.start();

        Thread.sleep(5 * 1000);

        stop = true;

        Thread.sleep(5 * 1000);


        System.out.println(count);


    }
}
```

不同点在于，当我们把stop设置为true时，线程自身可以控制到底要不要停止，何时停止，同样，我们可以调用thread的interrupt()来中断线程：

```java
public class ThreadTest {

    static int count = 0;
    static boolean stop = false;

    public static void main(String[] args) throws InterruptedException {

        Thread thread = new Thread(new Runnable() {
            public void run() {

                for (int i = 0; i < 100; i++) {
                    if (Thread.currentThread().isInterrupted()) {
                        break;
                    }

                    count++;
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        break;
                    }
                }
            }
        });

        thread.start();
        Thread.sleep(5 * 1000);
        thread.interrupt();
        Thread.sleep(5 * 1000);
        System.out.println(count);

    }
}
```

不同的地方在于，线程sleep过程中如果被中断了会接收到异常。

讲了这么多，其实线程池中就是通过interrupt()来停止线程的，比如shutdownNow()方法中会调用：

```java
void interruptIfStarted() {
    Thread t;
    if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) {
        try {
            t.interrupt();
        } catch (SecurityException ignore) {
        }
    }
}
```

## **线程池为什么一定得是阻塞队列？**

线程池中的线程在运行过程中，执行完创建线程时绑定的第一个任务后，就会不断的从队列中获取任务并执行，那么如果队列中没有任务了，线程为了不自然消亡，就会阻塞在获取队列任务时，等着队列中有任务过来就会拿到任务从而去执行任务。

通过这种方法能最终确保，线程池中能保留指定个数的核心线程数，关键代码为：

```java
try {
    Runnable r = timed ?
        workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
        workQueue.take();
    if (r != null)
        return r;
    timedOut = true;
} catch (InterruptedException retry) {
    timedOut = false;
}
```

某个线程在从队列获取任务时，会判断是否使用超时阻塞获取，我们可以认为非核心线程会poll()，核心线程会take()，非核心线程超过时间还没获取到任务后面就会自然消亡了。

## **线程发生异常，会被移出线程池吗？**

答案是会的，那有没有可能核心线程数在执行任务时都出错了，导致所有核心线程都被移出了线程池？

![image-20250116224108738](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162241765.png)

在源码中，当执行任务时出现异常时，最终会执行processWorkerExit()，执行完这个方法后，当前线程也就自然消亡了，但是！processWorkerExit()方法中会额外再新增一个线程，这样就能维持住固定的核心线程数。

## **Tomcat是如何自定义线程池的？**

Tomcat中用的线程池为org.apache.tomcat.util.threads.ThreadPoolExecutor，注意类名和JUC下的一样，但是包名不一样。

Tomcat会创建这个线程池：

```java
public void createExecutor() {
    internalExecutor = true;
    TaskQueue taskqueue = new TaskQueue();
    TaskThreadFactory tf = new TaskThreadFactory(getName() + "-exec-", daemon, getThreadPriority());
    executor = new ThreadPoolExecutor(getMinSpareThreads(), getMaxThreads(), 60, TimeUnit.SECONDS,taskqueue, tf);
    taskqueue.setParent( (ThreadPoolExecutor) executor);
}
```

注入传入的队列为TaskQueue，它的入队逻辑为：

```java
public boolean offer(Runnable o) {
    //we can't do any checks
    if (parent==null) {
        return super.offer(o);
    }

    //we are maxed out on threads, simply queue the object
    if (parent.getPoolSize() == parent.getMaximumPoolSize()) {
        return super.offer(o);
    }

    //we have idle threads, just add it to the queue
    if (parent.getSubmittedCount()<=(parent.getPoolSize())) {
        return super.offer(o);
    }

    //if we have less threads than maximum force creation of a new thread
    if (parent.getPoolSize()<parent.getMaximumPoolSize()) {
        return false;
    }

    //if we reached here, we need to add it to the queue
    return super.offer(o);
}
```

特殊在：

- 入队时，如果线程池的线程个数等于最大线程池数才入队
- 入队时，如果线程池的线程个数小于最大线程池数，会返回false，表示入队失败

这样就控制了，Tomcat的这个线程池，在提交任务时：

1. 仍然会先判断线程个数是否小于核心线程数，如果小于则创建线程
2. 如果等于核心线程数，会入队，但是线程个数小于最大线程数会入队失败，从而会去创建线程

所以随着任务的提交，会优先创建线程，直到线程个数等于最大线程数才会入队。

当然其中有一个比较细的逻辑是：在提交任务时，如果正在处理的任务数小于线程池中的线程个数，那么也会直接入队，而不会去创建线程，也就是上面源码中getSubmittedCount的作用。

## **线程池的核心线程数、最大线程数该如何设置？**

我们都知道，线程池中有两个非常重要的参数：

1. corePoolSize：核心线程数，表示线程池中的常驻线程的个数
2. maximumPoolSize：最大线程数，表示线程池中能开辟的最大线程个数

那这两个参数该如何设置呢？

我们对线程池负责执行的任务分为三种情况：

1. CPU密集型任务，比如找出1-1000000中的素数
2. IO密集型任务，比如文件IO、网络IO
3. 混合型任务

CPU密集型任务的特点时，线程在执行任务时会一直利用CPU，所以对于这种情况，就尽可能避免发生线程上下文切换。

比如，现在我的电脑只有一个CPU，如果有两个线程在同时执行找素数的任务，那么这个CPU就需要额外的进行线程上下文切换，从而达到线程并行的效果，此时执行这两个任务的总时间为：

`任务执行时间*2+线程上下文切换的时间`

而如果只有一个线程，这个线程来执行两个任务，那么时间为：

任务执行时间*2

所以对于CPU密集型任务，线程数最好就等于CPU核心数，可以通过以下API拿到你电脑的核心数：

Runtime.getRuntime().availableProcessors()

只不过，为了应对线程执行过程发生缺页中断或其他异常导致线程阻塞的请求，我们可以额外在多设置一个线程，这样当某个线程暂时不需要CPU时，可以有替补线程来继续利用CPU。

所以，对于CPU密集型任务，我们可以设置线程数为：**CPU核心数+1**

我们在来看IO型任务，线程在执行IO型任务时，可能大部分时间都阻塞在IO上，假如现在有10个CPU，如果我们只设置了10个线程来执行IO型任务，那么很有可能这10个线程都阻塞在了IO上，这样这10个CPU就都没活干了，所以，对于IO型任务，我们通常会设置线程数为：**2\*CPU核心数**

不过，就算是设置为了**2\*CPU核心数**，也不一定是最佳的，比如，有10个CPU，线程数为20，那么也有可能这20个线程同时阻塞在了IO上，所以可以再增加线程，从而去压榨CPU的利用率。

**通常，如果IO型任务执行的时间越长，那么同时阻塞在IO上的线程就可能越多，我们就可以设置更多的线程，但是，线程肯定不是越多越好**，我们可以通过以下这个公式来进行计算：

线程数 = CPU核心数   *（ 1 + 线程等待时间 / 线程运行总时间 ）

- 线程等待时间：指的就是线程没有使用CPU的时间，比如阻塞在了IO
- 线程运行总时间：指的是线程执行完某个任务的总时间

我们可以利用jvisualvm抽样来估计这两个时间：

![image-20250116224216310](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162242341.png)

图中表示，在刚刚这次抽样过程中，run()总共的执行时间为538948ms，利用了CPU的时间为86873ms，所以没有利用CPU的时间为538948ms-86873ms。

所以我们可以计算出：

线程等待时间 = 538948ms-86873ms

线程运行总时间 = 538948ms

所以：线程数 = 8   *（ 1 + （538948ms-86873ms） / 538948ms ）= 14.xxx

所以根据公式算出来的线程为14、15个线程左右。

按上述公式，如果我们执行的任务IO密集型任务，那么：线程等待时间 = 线程运行总时间，所以：

```java
线程数 = CPU核心数   *（ 1 + 线程等待时间 / 线程运行总时间 ） = CPU核心数   *（ 1 + 1 ） = CPU核心数   *  2
```

以上只是理论，实际工作中情况会更复杂，比如一个应用中，可能有多个线程池，除开线程池中的线程可能还有很多其他线程，或者除开这个应用还是一些其他应用也在运行，所以实际工作中如果要确定线程数，最好是压测。

比如我写了一个：

```java
@RestController
public class ZhouyuController {

    @GetMapping("/test")
    public String test() throws InterruptedException {
        Thread.sleep(1000);
        return "zhouyu";
    }

}
```

这个接口会执行1s，我现在利用apipost来压：

![image-20250116224332938](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162243966.png)

这是在Tomcat默认最大200个线程的请求下的压测结果。

当我们把线程数调整为500：

```java
server.tomcat.threads.max=500
```

![image-20250116224401706](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162244736.png)

发现执行效率提高了一倍，假如再增加线程数到1000：

![image-20250116224411903](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501162244928.png)

性能就降低了。

总结，我们再工作中，对于：

1. CPU密集型任务：CPU核心数+1，这样既能充分利用CPU，也不至于有太多的上下文切换成本
2. IO型任务：建议压测，或者先用公式计算出一个理论值（理论值通常都比较小）
3. 对于核心业务（访问频率高），可以把核心线程数设置为我们压测出来的结果，最大线程数可以等于核心线程数，或者大一点点，比如我们压测时可能会发现500个线程最佳，但是600个线程时也还行，此时600就可以为最大线程数
4. 对于非核心业务（访问频率不高），核心线程数可以比较小，避免操作系统去维护不必要的线程，最大线程数可以设置为我们计算或压测出来的结果。



## **线程池源码的基础属性和方法**

在线程池的源码中，会通过一个AtomicInteger类型的变量**ctl**，来表示**线程池的状态**和**当前线程池中的工作线程数量**。

一个Integer占4个字节，也就是32个bit，线程池有5个状态：

1. RUNNING
2. SHUTDOWN
3. STOP
4. TIDYING
5. TERMINATED

2个bit能表示4种状态，那5种状态就至少需要三个bit位，比如在线程池的源码中就是这么来表示的：

```java
private static final int COUNT_BITS = Integer.SIZE - 3;

private static final int RUNNING    = -1 << COUNT_BITS;
private static final int SHUTDOWN   =  0 << COUNT_BITS;
private static final int STOP       =  1 << COUNT_BITS;
private static final int TIDYING    =  2 << COUNT_BITS;
private static final int TERMINATED =  3 << COUNT_BITS;
```

Integer.SIZE为32，所以COUNT_BITS为29，最终各个状态对应的二级制为：

1. RUNNING：**111**00000 00000000 00000000 00000000
2. SHUTDOWN：**000**00000 00000000 00000000 00000000
3. STOP：**001**00000 00000000 00000000 00000000
4. TIDYING：**010**00000 00000000 00000000 00000000
5. TERMINATED：**011**00000 00000000 00000000 00000000

所以，只需要使用一个Integer数字的最高三个bit，就可以表示5种线程池的状态，而剩下的29个bit就可以用来表示工作线程数，比如，假如ctl为：**111**00000 00000000 00000000 0000**1**0**1**0，就表示线程池的状态为RUNNING，线程池中目前在工作的线程有10个，这里说的“在工作”意思是线程活着，要么在执行任务，要么在阻塞等待任务。

同时，在线程池中也提供了一些方法用来获取线程池状态和工作线程数，比如：

```java
// 29，二进制为00000000 00000000 00000000 00011101
private static final int COUNT_BITS = Integer.SIZE - 3;

// 00011111 11111111 11111111 11111111
private static final int CAPACITY   = (1 << COUNT_BITS) - 1;

// ~CAPACITY为11100000 00000000 00000000 00000000
// &操作之后，得到就是c的高3位
private static int runStateOf(int c)     { 
    return c & ~CAPACITY; 
}

// CAPACITY为00011111 11111111 11111111 11111111
// &操作之后，得到的就是c的低29位
private static int workerCountOf(int c)  { 
    return c & CAPACITY; 
}
```

同时，还有一个方法：

```java
private static int ctlOf(int rs, int wc) { 
    return rs | wc; 
}
```

就是用来把运行状态和工作线程数量进行合并的一个方法，不过传入这个方法的两个int数字有限制，rs的低29位都得为0，wc的高3位都得为0，这样经过或运算之后，才能得到准确的ctl。

同时，还有一些相关的方法：

```java
private static final int RUNNING    = -1 << COUNT_BITS;
private static final int SHUTDOWN   =  0 << COUNT_BITS;
private static final int STOP       =  1 << COUNT_BITS;
private static final int TIDYING    =  2 << COUNT_BITS;
private static final int TERMINATED =  3 << COUNT_BITS;

// c状态是否小于s状态，比如RUNNING小于SHUTDOWN
private static boolean runStateLessThan(int c, int s) {
    return c < s;
}

// c状态是否大于等于s状态，比如STOP大于SHUTDOWN
private static boolean runStateAtLeast(int c, int s) {
    return c >= s;
}

// c状态是不是RUNNING，只有RUNNING是小于SHUTDOWN的
private static boolean isRunning(int c) {
    return c < SHUTDOWN;
}

// 通过cas来增加工作线程数量，直接对ctl进行加1
// 这个方法没考虑是否超过最大工作线程数的（2的29次方）限制，源码中在调用该方法之前会进行判断的
private boolean compareAndIncrementWorkerCount(int expect) {
    return ctl.compareAndSet(expect, expect + 1);
}

// 通过cas来减少工作线程数量，直接对ctl进行减1
private boolean compareAndDecrementWorkerCount(int expect) {
    return ctl.compareAndSet(expect, expect - 1);
}
```

前面说到线程池有5个状态，这5个状态分别表示：

1. RUNNING：线程池正常运行中，可以正常的接受并处理任务
2. SHUTDOWN：线程池关闭了，**不能接受新任务**，但是**线程池会把阻塞队列中的剩余任务执行完**，剩余任务都处理完之后，会中断所有工作线程
3. STOP：线程池停止了，**不能接受新任务**，并且也**不会处理阻塞队列中的任务**，会中断所有工作线程
4. TIDYING：当前线程池中的工作线程都被停止后，就会进入TIDYING
5. TERMINATED：线程池处于TIDYING状态后，会执行terminated()方法，执行完后就会进入TERMINATED状态，在ThreadPoolExecutor中terminated()是一个空方法，可以自定义线程池重写这个方法

### **execute方法**

当执行线程池的execute方法时：

```java
public void execute(Runnable command) {
    
    if (command == null)
        throw new NullPointerException();
    
    // 获取ctl
    // ctl初始值是ctlOf(RUNNING, 0)，表示线程池处于运行中，工作线程数为0
    int c = ctl.get();
    
    // 工作线程数小于corePoolSize，则添加工作线程，并把command作为该线程要执行的任务
    if (workerCountOf(c) < corePoolSize) {
        // true表示添加的是核心工作线程，具体一点就是，在addWorker内部会判断当前工作线程数是不是超过了corePoolSize
        // 如果超过了则会添加失败，addWorker返回false，表示不能直接开启新的线程来执行任务，而是应该先入队
        if (addWorker(command, true))
            return;
        
        // 如果添加核心工作线程失败，那就重新获取ctl，可能是线程池状态被其他线程修改了
        // 也可能是其他线程也在向线程池提交任务，导致核心工作线程已经超过了corePoolSize
        c = ctl.get();
    }
    
    // 线程池状态是否还是RUNNING，如果是就把任务添加到阻塞队列中
    if (isRunning(c) && workQueue.offer(command)) {
        
        // 在任务入队时，线程池的状态可能也会发生改变
        // 再次检查线程池的状态，如果线程池不是RUNNING了，那就不能再接受任务了，就得把任务从队列中移除，并进行拒绝策略
        
        // 如果线程池的状态没有发生改变，仍然是RUNNING，那就不需要把任务从队列中移除掉
        // 不过，为了确保刚刚入队的任务有线程会去处理它，需要判断一下工作线程数，如果为0，那就添加一个非核心的工作线程
        // 添加的这个线程没有自己的任务，目的就是从队列中获取任务来执行
        int recheck = ctl.get();
        if (! isRunning(recheck) && remove(command))
            reject(command);
        else if (workerCountOf(recheck) == 0)
            addWorker(null, false);
    }
    // 如果线程池状态不是RUNNING，或者线程池状态是RUNNING但是队列满了，则去添加一个非核心工作线程
    // 实际上，addWorker中会判断线程池状态如果不是RUNNING，是不会添加工作线程的
    // false表示非核心工作线程，作用是，在addWorker内部会判断当前工作线程数已经超过了maximumPoolSize，如果超过了则会添加不成功，执行拒绝策略
    else if (!addWorker(command, false))
        reject(command);
}
```

### **addWorker方法**

addWorker方法是核心方法，是用来添加线程的，core参数表示添加的是核心线程还是非核心线程。

在看这个方法之前，我们不妨先自己来分析一下，什么是添加线程？

实际上就要开启一个线程，不管是核心线程还是非核心线程其实都只是一个普通的线程，而核心和非核心的区别在于：

1. 如果是要添加**核心工作线程**，那么就得判断目前的工作线程数是否超过corePoolSize
   - 如果没有超过，则直接开启新的工作线程执行任务
   - 如果超过了，则不会开启新的工作线程，而是把任务进行入队
2. 如果要添加的是**非核心工作线程**，那就要判断目前的工作线程数是否超过maximumPoolSize
   - 如果没有超过，则直接开启新的工作线程执行任务
   - 如果超过了，则拒绝执行任务

所以在addWorker方法中，首先就要判断工作线程有没有超过限制，如果没有超过限制再去开启一个线程。

并且在addWorker方法中，还得判断线程池的状态，如果线程池的状态不是RUNNING状态了，那就没必要要去添加线程了，当然有一种特例，就是线程池的状态是SHUTDOWN，但是队列中有任务，那此时还是需要添加添加一个线程的。

那这种特例是如何产生的呢？

我们前面提到的都是开启新的工作线程，那么工作线程怎么回收呢？不可能开启的工作线程一直活着，因为如果任务由多变少，那也就不需要过多的线程资源，所以线程池中会有机制对开启的工作线程进行回收，如何回收的，后文会提到，我们这里先分析，有没有可能线程池中所有的线程都被回收了，答案的是有的。

首先非核心工作线程被回收是可以理解的，那核心工作线程要不要回收掉呢？其实线程池存在的意义，就是提前生成好线程资源，需要线程的时候直接使用就可以，而不需要临时去开启线程，所以正常情况下，开启的核心工作线程是不用回收掉的，就算暂时没有任务要处理，也不用回收，就让核心工作线程在那等着就可以了。

**但是！**在线程池中有这么一个参数：**allowCoreThreadTimeOut**，表示是否允许核心工作线程超时，意思就是**是否允许核心工作线程回收**，默认这个参数为false，但是我们可以调用allowCoreThreadTimeOut(boolean value)来把这个参数改为true，只要改了，那么核心工作线程也就会被回收了，那这样线程池中的所有工作线程都可能被回收掉，那如果所有工作线程都被回收掉之后，阻塞队列中来了一个任务，这样就形成了特例情况。

所以，对于addWorker方法，核心逻辑就是：

1. 先判断工作线程数是否超过了限制
2. 修改ctl，使得工作线程数+1
3. 构造Work对象，并把它添加到workers集合中
4. 启动Work对象对应的工作线程

### **runWorker方法**

那工作线程在运行过程中，到底在做什么呢？

我们看看Work的构造方法：

```java
Worker(Runnable firstTask) {
    setState(-1); // inhibit interrupts until runWorker
    this.firstTask = firstTask;
    this.thread = getThreadFactory().newThread(this);
}
```

在利用ThreadFactory创建线程时，会把this，也就是当前Work对象作为Runnable传给线程，所以工作线程运行时，就会执行Worker的run方法：

```java
public void run() {
    // 这个方法就是工作线程运行时的执行逻辑
    runWorker(this);
}
```

```java
final void runWorker(Worker w) {
    // 就是当前工作线程
    Thread wt = Thread.currentThread();
    
    // 把Worker要执行的第一个任务拿出来
    Runnable task = w.firstTask;
    w.firstTask = null;
    
    // 这个地方，后面单独分析中断的时候来分析
    w.unlock(); // allow interrupts
    
    boolean completedAbruptly = true;
    try {
        
        // 判断当前线程是否有自己的第一个任务，如果没有就从阻塞队列中获取任务
        // 如果阻塞队列中也没有任务，那线程就会阻塞在这里
        // 但是并不会一直阻塞，在getTask方法中，会根据我们所设置的keepAliveTime来设置阻塞时间
        // 如果当前线程去阻塞队列中获取任务时，等了keepAliveTime时间，还没有获取到任务，则getTask方法返回null，相当于退出循环
        // 当然并不是所有线程都会有这个超时判断，主要还得看allowCoreThreadTimeOut属性和当前的工作线程数等等，后面单独分析
        // 目前，我们只需要知道工作线程在执行getTask()方法时，可能能直接拿到任务，也可能阻塞，也可能阻塞超时最终返回null
        while (task != null || (task = getTask()) != null) {
            // 只要拿到了任务，就要去执行任务
            
            // Work先加锁，跟shutdown方法有关，先忽略，后面会分析
            w.lock();
            
            
            // If pool is stopping, ensure thread is interrupted;
            // if not, ensure thread is not interrupted.  This
            // requires a recheck in second case to deal with
            // shutdownNow race while clearing interrupt
            
            // 下面这个if，最好把整篇文章都看完之后再来看这个if的逻辑
            
            // 工作线程在运行过程中
            // 如果发现线程池的状态变成了STOP，正常来说当前工作线程的中断标记应该为true，如果发现中断标记不为true，则需要中断自己
            
            // 如果线程池的状态不是STOP，要么是RUNNING，要么是SHUTDOWN
            // 但是如果发现中断标记为true，那是不对的，因为线程池状态不是STOP，工作线程仍然是要正常工作的，不能中断掉
            // 就算是SHUTDOWN，也要等任务都执行完之后，线程才结束，而目前线程还在执行任务的过程中，不能中断
            // 所以需要重置线程的中断标记，不过interrupted方法会自动清空中断标记
            // 清空为中断标记后，再次判断一下线程池的状态，如果又变成了STOP，那就仍然中断自己
            
            // 中断了自己后，会把当前任务执行完，在下一次循环调用getTask()方法时，从阻塞队列获取任务时，阻塞队列会负责判断当前线程的中断标记
            // 如果发现中断标记为true，那就会抛出异常，最终退出while循环，线程执行结束
            if ((runStateAtLeast(ctl.get(), STOP) ||
                 (Thread.interrupted() &&
                  runStateAtLeast(ctl.get(), STOP))) &&
                !wt.isInterrupted())
                wt.interrupt();
            
            
            try {
                // 空方法，给自定义线程池来实现
                beforeExecute(wt, task);
                Throwable thrown = null;
                try {
                    // 执行任务
                    // 注意执行任务时可能会抛异常，如果抛了异常会先依次执行三个finally，从而导致completedAbruptly = false这行代码没有执行
                    task.run();
                } catch (RuntimeException x) {
                    thrown = x; throw x;
                } catch (Error x) {
                    thrown = x; throw x;
                } catch (Throwable x) {
                    thrown = x; throw new Error(x);
                } finally {
                    // 空方法，给自定义线程池来实现
                    afterExecute(task, thrown);
                }
            } finally {
                task = null;
                w.completedTasks++; // 跟踪当前Work总共执行了多少了任务
                w.unlock();
            }
        }
        
        // 正常退出了While循环
        // 如果是执行任务的时候抛了异常，虽然也退出了循环，但是是不会执行这行代码的，只会直接进去下面的finally块中
        
        // 所以，要么是线程从队列中获取任务时阻塞超时了从而退出了循环会进入到这里
        // 要么是线程在阻塞的过程中被中断了，在getTask()方法中会处理中断的情况，如果被中断了，那么getTask()方法会返回null，从而退出循环
        // completedAbruptly=false，表示线程正常退出
        completedAbruptly = false;
    } finally {
        // 因为当前线程退出了循环，如果不做某些处理，那么这个线程就运行结束了，就是上文说的回收（自然消亡）掉了，线程自己运行完了也就结束了
        // 但是如果是由于执行任务的时候抛了异常，那么这个线程不应该直接结束，而应该继续从队列中获取下一个任务
        // 可是代码都执行到这里了，该怎么继续回到while循环呢，怎么实现这个效果呢？
        // 当然，如果是由于线程被中断了，或者线程阻塞超时了，那就应该正常的运行结束
        // 只不过有一些善后工作要处理，比如修改ctl，工作线程数-1
        processWorkerExit(w, completedAbruptly);
    }
}
```

**processWorkerExit方法**

```java
private void processWorkerExit(Worker w, boolean completedAbruptly) {
    
    // 如果completedAbruptly为true，表示是执行任务的时候抛了异常，那就修改ctl，工作线程数-1
    // 如果completedAbruptly为false，表示是线程阻塞超时了或者被中断了，实际上也要修改ctl，工作线程数-1
    // 只不过在getTask方法中已经做过了，这里就不用再做一次了
    if (completedAbruptly) // If abrupt, then workerCount wasn't adjusted
        decrementWorkerCount();
    
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        // 当前Work要运行结束了，将完成的任务数累加到线程池上
        completedTaskCount += w.completedTasks;
        
        // 将当前Work对象从workers中移除
        workers.remove(w);
    } finally {
        mainLock.unlock();
    }
    
    // 因为当前是处理线程退出流程中，所以要尝试去修改线程池的状态为TINDYING
    tryTerminate();
    
    
    int c = ctl.get();
    // 如果线程池的状态为RUNNING或者SHUTDOWN，则可能要替补一个线程
    if (runStateLessThan(c, STOP)) {
        
        // completedAbruptly为false，表示线程是正常要退出了，则看是否需要保留线程
        if (!completedAbruptly) {
            
            // 如果allowCoreThreadTimeOut为true，但是阻塞队列中还有任务，那就至少得保留一个工作线程来处理阻塞队列中的任务
            // 如果allowCoreThreadTimeOut为false，那min就是corePoolSize，表示至少得保留corePoolSize个工作线程活着
            int min = allowCoreThreadTimeOut ? 0 : corePoolSize;
            if (min == 0 && ! workQueue.isEmpty())
                min = 1;
            
            // 如果当前工作线程数大于等于min，则表示符合所需要保留的最小线程数，那就直接return，不会调用下面的addWorker方法新开一个工作线程了
            if (workerCountOf(c) >= min)
                return; // replacement not needed
        }
        
        // 如果线程池的状态为RUNNING或者SHUTDOWN
        // 如果completedAbruptly为true，表示当前线程是执行任务时抛了异常，那就得新开一个工作线程
        // 如果completedAbruptly为false，但是不符合所需要保留的最小线程数，那也得新开一个工作线程
        addWorker(null, false);
    }
}
```

总结一下，某个工作线程正常情况下会不停的循环从阻塞队列中获取任务来执行，正常情况下就是通过阻塞来保证线程永远活着，但是会有一些特殊情况：

1. 如果线程被中断了，那就会退出循环，然后做一些善后处理，比如ctl中的工作线程数-1，然后自己运行结束
2. 如果线程阻塞超时了，那也会退出循环，此时就需要判断线程池中的当前工作线程够不够，比如是否有corePoolSize个工作线程，如果不够就需要新开一个线程，然后当前线程自己运行结束，这种看上去效率比较低，但是也没办法，当然如果当前工作线程数足够，那就正常，自己正常的运行结束即可
3. 如果线程是在执行任务的时候抛了移除，从而退出循环，那就直接新开一个线程作为替补，当然前提是线程池的状态是RUNNING

### **getTask方法**

上面一直提到了getTask这个放，我们来看看这个方法。

```java
private Runnable getTask() {
    boolean timedOut = false; // Did the last poll() time out?
    
    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);
        
        // Check if queue empty only if necessary.
        // 如果线程池状态是STOP，表示当前线程不需要处理任务了，那就修改ctl工作线程数-1
        // 如果线程池状态是SHUTDOWN，但是阻塞队列中为空，表示当前任务没有任务要处理了，那就修改ctl工作线程数-1
        // return null表示当前线程无需处理任务，线程退出
        if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
            decrementWorkerCount();
            return null;
        }
        
        // 当前工作线程数
        int wc = workerCountOf(c);
        
        // Are workers subject to culling?
        // 用来判断当前线程是无限阻塞还是超时阻塞，如果一个线程超时阻塞，那么一旦超时了，那么这个线程最终就会退出
        // 如果是无限阻塞，那除非被中断了，不然这个线程就一直等着获取队列中的任务
    
        // allowCoreThreadTimeOut为true，表示线程池中的所有线程都可以被回收掉，则当前线程应该直接使用超时阻塞，一旦超时就回收
        // allowCoreThreadTimeOut为false，则要看当前工作线程数是否超过了corePoolSize，如果超过了，则表示超过部分的线程要用超时阻塞，一旦超时就回收
        
        boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;
        
        // 如果工作线程数超过了工作线程的最大限制或者线程超时了，则要修改ctl，工作线程数减1，并且return null
        // return null就会导致外层的while循环退出，从而导致线程直接运行结束
        // 直播课程里会细讲timed && timedOut
        if ((wc > maximumPoolSize || (timed && timedOut))
            && (wc > 1 || workQueue.isEmpty())) {
            if (compareAndDecrementWorkerCount(c))
                return null;
            continue;
        }
        
        
        try {
            // 要么超时阻塞，要么无限阻塞
            Runnable r = timed ? workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) : workQueue.take();
            
            // 表示没有超时，在阻塞期间获取到了任务
            if (r != null)
                return r;
            
            // 超时了，重新进入循环，上面的代码会判断出来当前线程阻塞超时了，最后return null，线程会运行结束
            timedOut = true;
        } catch (InterruptedException retry) {
            // 从阻塞队列获取任务时，被中断了，也会再次进入循环，此时并不是超时，但是重新进入循环后，会判断线程池的状态
            // 如果线程池的状态变成了STOP或者SHUTDOWN，最终也会return null，线程会运行结束
            // 但是如果线程池的状态仍然是RUNNING，那当前线程会继续从队列中去获取任务，表示忽略了本次中断
            // 只有通过调用线程池的shutdown方法或shutdownNow方法才能真正中断线程池中的线程
            timedOut = false;
        }
    }
}
```

**特别注意：只有通过调用线程池的shutdown方法或shutdownNow方法才能真正中断线程池中的线程**。

因为在java，中断一个线程，只是修改了该线程的一个标记，并不是直接kill了这个线程，被中断的线程到底要不要消失，由被中断的线程自己来判断，比如上面代码中，线程遇到了中断异常，它可以选择什么都不做，那线程就会继续进行外层循环，如果选择return，那就退出了循环，后续就会运行结束从而消失。

### **shutdown方法**

调用线程池的shutdown方法，表示要关闭线程池，不接受新任务，但是要把阻塞队列中剩余的任务执行完。

根据前面execute方法的源码，只要线程池的状态不是RUNNING，那么就表示线程池不接受新任务，所以shutdown方法要做的第一件事情就是修改线程池状态。

那第二件事情就是要中断线程池中的工作线程，这些工作线程要么在执行任务，要么在阻塞等待任务：

1. 对于在阻塞等待任务的线程，直接中断即可，
2. 对于正在执行任务的线程，其实只要等它们把任务执行完，就可以中断了，因为此时线程池不能接受新任务，所以正在执行的任务就是最后剩余的任务

```java
public void shutdown() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();
        // 修改ctl，将线程池状态改为SHUTDOWN
        advanceRunState(SHUTDOWN);
        // 中断工作线程
        interruptIdleWorkers();
        // 空方法，给子类扩展使用
        onShutdown(); // hook for ScheduledThreadPoolExecutor
    } finally {
        mainLock.unlock();
    }
    // 调用terminated方法
    tryTerminate();
}
```

```java
private void interruptIdleWorkers() {
    interruptIdleWorkers(false);
}


private void interruptIdleWorkers(boolean onlyOne) {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        // 遍历所有正在工作的线程，要么在执行任务，要么在阻塞等待任务
        for (Worker w : workers) {
            Thread t = w.thread;
            
            // 如果线程没有被中断，并且能够拿到锁，就中断线程
            // Worker在执行任务时会先加锁，执行完任务之后会释放锁
            // 所以只要这里拿到了锁，就表示线程空出来了，可以中断了
            if (!t.isInterrupted() && w.tryLock()) {
                try {
                    t.interrupt();
                } catch (SecurityException ignore) {
                } finally {
                    w.unlock();
                }
            }
            if (onlyOne)
                break;
        }
    } finally {
        mainLock.unlock();
    }
}
```

不过还有一个种情况，就是目前所有工作线程都在执行任务，但是阻塞队列中还有剩余任务，那逻辑应该就是这些工作线程执行完当前任务后要继续执行队列中的剩余任务，但是根据我们看到的shutdown方法的逻辑，发现这些工作线程在执行完当前任务后，就会释放锁，那就可能会被中断掉，那队列中剩余的任务怎么办呢？

工作线程一旦被中断，就会进入processWorkerExit方法，根据前面的分析，我们发现，在这个方法中会会线程池状态为SHUTDOWN进行判断，会重新生成新的工作线程，那么这样就能保证队列中剩余的任务一定会被执行完。

### **shutdownNow方法**

看懂了shutdown方法，再来看shutdownNow方法就简单了。

```java
public List<Runnable> shutdownNow() {
    List<Runnable> tasks;
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();
        // 修改ctl，将线程池状态改为STOP
        advanceRunState(STOP);
        // 中断工作线程
        interruptWorkers();
        // 返回阻塞队列中剩余的任务
        tasks = drainQueue();
    } finally {
        mainLock.unlock();
    }
    
    // 调用terminated方法
    tryTerminate();
    return tasks;
}
```

```java
private void interruptWorkers() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        // 中断所有工作线程，不管有没有在执行任务
        for (Worker w : workers)
            w.interruptIfStarted();
    } finally {
        mainLock.unlock();
    }
}


void interruptIfStarted() {
    Thread t;
    
    // 只要线程没有被中断，那就中断线程，中断的线程虽然也会进入processWorkerExit方法，但是该方法中判断了线程池的状态
    // 线程池状态为STOP的情况下，不会再开启新的工作线程了
    // 这里getState>-0表示，一个工作线程在创建好，但是还没运行时，这时state为-1，可以看看Worker的构造方法就知道了
    // 表示一个工作线程还没开始运行，不能被中断，就算中断也没意义，都还没运行
    if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) {
        try {
            t.interrupt();
        } catch (SecurityException ignore) {
        }
    }
}
```

### **mainLock**

在上述源码中，发现很多地方都会用到mainLock，它是线程池中的一把全局锁，主要是用来控制workers集合的并发安全，因为如果没有这把全局锁，就有可能多个线程公用同一个线程池对象，如果一个线程在向线程池提交任务，一个线程在shutdown线程池，如果不做并发控制，那就有可能线程池shutdown了，但是还有工作线程没有被中断，如果1个线程在shutdown，99个线程在提交任务，那么最终就可能导致线程池关闭了，但是线程池中的很多线程都没有停止，仍然在运行，这肯定是不行，所以需要这把全局锁来对workers集合的操作进行并发安全控制。