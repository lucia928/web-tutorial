# declare 关键字

用于声明已经存在的变量、函数、类、模块、接口等。主要作用就是让当前文件可以使用其他文件声明的类型。举例来说，自己的脚本使用外部库定义的函数，编译器会因为不知道外部函数的类型定义而报错，这时就可以在自己的脚本里面使用`declare`关键字，告诉编译器外部函数的类型。这样的话，编译单个脚本就不会因为使用了外部类型而报错。

## 使用场景

### 声明全局变量/函数

```ts
declare const VERSION:string
declare fucntion alert(message:string) : void
```

### 声明模块（用于第三方库）

```ts
declare module "jquery": {
    function $(selector:string): any
    export = $
}

$('$id').show();
```

### 声明命名空间

```ts
declare namespace MyLib {
  function log(message: string): void
}
```

### 声明合并

允许通过`declare`对已有类型进行拓展

```ts
// 拓展Window接口
declare global {
  interface Window {
    customProp: number
  }
}

window.customProp = 1
```

## 注意点

- `declare`仅用于类型声明，不会生成任何 JS 代码
- 类型声明文件通常以`d.ts`为后缀，TS 会自动扫描项目中的这类文件。
- 对于主流的第三方库，通常可以通过安装`@types/xxx`（如`@types/jquery`）获取官方类型声明，无须手动编写。

## 类型声明文件的来源

- 自动生成

```ts
// 只要使用编译选项`declaration`，编译器就会在编译时自动生成单独的类型声明文件

// tsconfig.json
{
  "compilerOptions": {
    "declaration": true
  }
}
```

- 内置声明文件

```ts
// 安装 TypeScript 语言时，会同时安装一些内置的类型声明文件，主要是内置的全局对象（JavaScript 语言接口和运行环境 API）的类型声明。
// TypeScript 编译器会自动根据编译目标target的值，加载对应的内置声明文件，所以不需要特别的配置。但是，可以使用编译选项lib，指定加载哪些内置声明文件。
// 编译选项noLib会禁止加载任何内置声明文件

// tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "es2021"]
  }
}
```

- 外部类型声明文件

```ts
// 安装类型定义
npm i --save-dev @types/jquery

// 配置 tsconfig.json
{
    "compilerOptions": {
    	"types": ["jquery"]
    }
}
```
