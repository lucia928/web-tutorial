#  **GraalVM诞生的背景**

## **Java在微服务/云原生时代的困境**

**事实**

Java总体上是面向大规模、长时间的服务端应用而设计的。

严(luō)谨(suō)的语法利于约束所有人写出较一致的代码，利于软件规模的提升；

但是像即时编译器(JIT)、性能优化、垃圾回收等有代表性的特征都是面向程序长时间运行设计的，需要一段时间来达到最佳性能，才能享受硬件规模提升带来的红利。

**矛盾**

在微服务的背景下，提倡服务围绕业务能力构建，不再追求实现上的严谨一致；

1、单个微服务就不再需要再面对数十、数百GB乃至TB的内存；

2、有了高可用的服务集群，也无须追求单个服务要7×24小时不可间断地运行，它们随时可以中断和更新。

所以微服务对应用的容器化（Docker）亲和度（包容量、内存消耗等）、启动速度、达到最高性能的时间等方面提出了新的要求，这些恰恰是Java的弱项。

比如：现在启动一个微服务项目（Docker运行6个子服务），动不动就1分钟。

## **问题根源**

**Java离不开虚拟机**

所以Java应用启动的时候，必须要启动虚拟机，进行类加载，无论是启动时间，还是占用空间都不是最优解

## **解决方案**

**革命派**

直接革掉Java和Java生态的性命，创造新世界，譬如Golang

**保守派**

尽可能保留原有主流Java生态和技术资产，在原有的Java生态上做改进，朝着微服务、云原生环境靠拢、适应。**其中最大的技术运用就是GraalVM！**

# **GraalVM入门**

GraalVM 是一个高性能 JDK 发行版，旨在加速用Java和其他JVM语言编写的应用程序的执行，并支持 JavaScript、Ruby、Python 和许多其他流行语言（翻译自官网 https://www.graalvm.org/）

![image-20241224103033010](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241030123.png)

GraalVM想成为一统天下的“最终”虚拟机！而GraalVM要做到原因也很简单：

大部分脚本语言或者有动态特效的语言都需要一个语言虚拟机运行，比如CPython，Lua，Erlang，Java，Ruby，R，JS，PHP，Perl，APL等等，但是这些语言的虚拟机水平很烂，比如CPython的VM就不忍直视，而HotSpotVM是虚拟机的大神级别，如果能用上HotSpot，能用上顶级的即时编译器(JIT)、性能优化、垃圾回收等技术，岂不爽歪歪！

# **GraalVM特征**

**GraalVM是一款高性能的可嵌入式多语言虚拟机，它能运行不同的编程语言**

- 基于JVM的语言，比如Java, Scala, Kotlin和Groovy
- 解释型语言，比如JavaScript, Ruby, R和Python
- 配合LLVM一起工作的原生语言，比如C， C++， Rust和Swift

**GraalVM的设计目标是可以在不同的环境中运行程序**

- 在JVM中
- 编译成独立的本地镜像（不需要JDK环境）
- 将Java及本地代码模块集成为更大型的应用

# **GraalVM下载和安装**

GraalVM分成了社区版与企业版(好消息目前都免费！)

企业版肯定比社区版好，所以推荐下载企业版，因为演示的原因，我使用的是20的版本

![image-20241224103131153](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241031213.png)

   ![image-20241224103146239](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241031302.png)

https://www.oracle.com/downloads/graalvm-downloads.html

![image-20241224103201059](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241032133.png)

使用 GraalVM Enterprise，您可以将 Java 字节码编译为特定于平台的、自包含的本机可执行文件（本机映像  [Native Image](https://docs.oracle.com/en/graalvm/enterprise/21/docs/reference-manual/native-image/)），以实现更快的启动和更小的应用程序占用空间。

安装命令如下：

![image-20241224103327053](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241033715.png)

![image-20241224103410850](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241034892.png)

如果是在windows中如果要使用 本机映像 （[Native Image](https://docs.oracle.com/en/graalvm/enterprise/21/docs/reference-manual/native-image/)）需要安装VC，具体见：https://www.jianshu.com/p/a5cdf85e4ffa

**linux安装及配置**

![image-20241224103423274](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241034311.png)

解压

![image-20241224103438345](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241034390.png)

![image-20241224103448884](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241034915.png)

配置环境变量

![image-20241224104155607](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241041638.png)

修改环境变量改

![image-20241224104139428](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241041464.png)

![image-20241224104127693](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241041727.png)

![image-20241224104121130](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241041161.png)

使用 GraalVM Enterprise，您可以将 Java 字节码编译为特定于平台的、自包含的本机可执行文件（本机映像  [Native Image](https://docs.oracle.com/en/graalvm/enterprise/21/docs/reference-manual/native-image/)），以实现更快的启动和更小的应用程序占用空间。

安装命令如下：

![image-20241224104110238](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241041288.png)

![image-20241224104047167](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241040201.png)

**GraalVM初体验(Linux)**

写一个简单的类

![image-20241224104038660](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241040700.png)

编译->执行

  ![image-20241224104030599](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241040639.png)

打包成一个本地可执行文件（[Native Image](https://docs.oracle.com/en/graalvm/enterprise/21/docs/reference-manual/native-image/)功能）

![image-20241224104022731](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241040776.png)

这样就会生成一个可执行文件。这个过程我就称之为将Java 字节码编译为特定于平台的、自包含的本机可执行文件（本机映像  [Native Image](https://docs.oracle.com/en/graalvm/enterprise/21/docs/reference-manual/native-image/)），以实现更快的启动和更小的应用程序占用空间。

更快速的启动：

**对比下，通过 time命令来对比**

1、通过java 走虚拟机来运行

![image-20241224104008774](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241040805.png)

2、不通过java虚拟机直接运行

![image-20241224104000307](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241040343.png)

对比发现，通过这种方式启动一个简单的类，启动速度要快很多。

**阿里早就通过这种方式加快容器的启动速度，直接启动速度提升20倍**

https://www.graalvm.org/native-image/

![image-20241224103938881](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241039002.png)

**另外这种可执行文件是不需要JDK的环境的，所以可以非常方便的完成快速的容器化部署，符合云原生的要求，例如：**

**我们把这个可执行文件拷贝到另外一台没有任何JDK的环境的服务器上，照样可以运行。**

![image-20241224103929481](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241039531.png)

 **graal 的 aot  属于“GraalVM ”中的一项技术。**

 Ahead-of-time compile（提前编译），他在编译期时，会把所有相关的东西，包含一个基底的 VM，一起编译成机器码(二进制)。

好处是可以更快速的启动一个 java 应用（以往如果要启动 java程序，需要先启动 jvm 再载入 java 代码，然后再即时的将 .class 字节码编译成机器码，交给机器执行，非常耗时间和耗内存，而如果使用AOT，可以取得一个更小更快速的镜像，适合用在云部署上）

# **GraalCompiler**

Graal Compiler是GraalVM与HotSpotVM（从JDK10起）共同拥有的服务端即时编译器，是C2编译器的替代者。

**C2还存在一些小BUG，例如：**

```java
public class C2Bug {
    public void test() {
        int i = 8;
        while ((i -= 3) > 0);
        System. out .println("i = " + i);
    }
    public static void main(String[] args) {
        C2Bug c2bug = new C2Bug();
        for (int i = 0; i < 50_000; i++) {
            c2bug.test();
        }
    }
```

 ![image-20241224103829448](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241038519.png)

使用-Xint  参数强制虚拟机运行于只有解释器的编译模式，就不会出现问题。

 ![image-20241224103821969](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241038025.png)

另外把循环次数降低，降低到5000次，就不会触发JIT，就不会触发C2的优化也不会出现问题。

![image-20241224103808415](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241038462.png)

 ![image-20241224103759339](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241037384.png)

![image-20241224103751359](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241037435.png)

**即时编译器是 Java 虚拟机中相对独立的模块，它主要负责接收 Java 字节码，并生成可以直接运行的二进制码。**

传统情况下(JDK8)，即时编译器是与 Java 虚拟机紧耦合的。也就是说，对即时编译器的更改需要重新编译整个 Java 虚拟机。这对于开发相对活跃的 Graal 来说显然是不可接受的。

为了让 Java 虚拟机与 Graal 解耦合，我们引入了[Java 虚拟机编译器接口](http://openjdk.java.net/jeps/243)（JVM Compiler Interface，JVMCI），将即时编译器的功能抽象成一个 Java 层面的接口。这样一来，在 Graal 所依赖的 JVMCI 版本不变的情况下，我们仅需要替换 Graal 编译器相关的 jar 包（Java 9 以后的 jmod 文件），便可完成对 Graal 的升级

## **Graal 和 C2 的区别**

Graal 和 C2 最为明显的一个区别是：Graal 是用 Java 写的，而 C2 是用 C++ 写的。相对来说，Graal 更加模块化，也更容易开发与维护，毕竟，连C2的开发者都不想去维护C2了。

许多人会觉得用 C++ 写的 C2 肯定要比 Graal 快。实际上，在充分预热的情况下，Java 程序中的热点代码早已经通过即时编译转换为二进制码，在执行速度上并不亚于静态编译的 C++ 程序。

Graal 的内联算法对新语法、新语言更加友好，例如 Java 8 的 lambda 表达式以及 Scala 语言。

例如：

![image-20241224103726218](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241037277.png)

![image-20241224103717676](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241037723.png)

![image-20241224103708559](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202412241037608.png)

## **GraalVM与SpringBoot**

2021年03月11日官方宣布的Spring Native只是beta版本，请不要用于生产环境！！！

**我来谈谈 GraalVM的未来发展。**

spring 6.0和spring boot3.0都会基于jdk17构建，spring官方也写的很清晰，会继续维护和升级spring 2.的版本，如果有人不愿意升级，一样可以使用老的版本。

spring 6.0和spring boot3.0总体来说是彻底拥抱aot，让spring native变得更加流行，所以在Spring6与SpringBoot3广泛应用之前spring native还肯定不是主流而已。