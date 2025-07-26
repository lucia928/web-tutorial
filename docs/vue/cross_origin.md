# 跨域解决方案

## 跨域是什么

- 跨域本质是浏览器基于同源策略的一种安全手段，浏览器的同源策略限制从一个源加载的文档或脚本与来自另外一个源的资源进行交互。
- 同源：协议（protocol）、域名（host）、端口号（port）均相同，只要有一项不满足就是非同源。
- 跨域是浏览器的限制，用抓包工具抓取接口数据、用 postman 请求接口都可以看到接口已经把数据返回，只是在浏览器中报错。

## 解决方案

### JSONP

- JSONP 是一种非正式传输协议，该协议允许用户传递一个 callback 参数（传递的值为已经定义的一个方法名）给服务端，服务端返回数据为该回调函数的调用。
- 在 web 页面调用 js 文件是不受跨域限制的，而且拥有 src 属性的标签都拥有跨域的能力，都可以通过 GET 请求去请求资源。

#### 实现

- 在客户端预先定义哈奥一个带参数的回调函数，用来接收服务端传来的数据。
- 服务端将要传的数据（以定义好的回调函数加上返回结果的方式）返回给客户端。
- 因为 script 标签的原因，浏览器会把这一段字符串当做 js 来执行，即调用回调函数。

```javascript
// 客户端代码
function handleResponse(response) {
  //处理服务器返回的数据
}

var script = document.createElement("script")
script.src = "https://jsonp.com/data?callback=handleResponse"
document.body.appendChild(script)

// -------------------

// 服务端代码
var data = { name: "John", age: 30 }
var jsonpResponse = "handleResponse(" + JSON.stringify(data) + ");"
res.send(jsonpResponse)
```

#### 优点

- 不像 XML 请求那样收到同源策略的限制。
- 在请求完毕后可以通过调用 callback 的方式回传结果。
- 兼容性好。

#### 缺点

- 只支持 GET 请求，不支持 POST 等其他 HTTP 方法。
- 存在一定的安全风险，因为返回的数据可以被任意 JavaScript 代码调用和处理，可能会导致跨站脚本攻击（XSS）等安全问题。因此，在使用 JSONP 时需要确保请求的数据源是可信的，并且返回的数据不包含恶意代码。
- 因为 JSONP 请求是通过动态创建`script`标签实现的，所以需要确保被请求的数据源返回的是 JSONP 格式的数据，而不是普通的 JSON 格式，否则在处理时会出现语法错误。

### CORS

- CORS（Cross-Origin Resource Sharing 跨站资源共享）是一种基于 HTTP 头的机制，允许服务器标示除了它自己以外的其他源（域、协议或端口），使得浏览器允许这些源访问加载自己的资源。

#### 实现

CORS 通过在 HTTP 请求和响应中添加特定的头信息来实现跨源访问控制。以下是一些关键的 HTTP 头信息：

- **Origin**：请求头中包含的源信息，表示请求来自哪个源（协议 + 主机 + 端口）。
- **Access-Control-Allow-Origin**：响应头中包含的源信息，表示允许哪些源访问资源。
- **Access-Control-Allow-Methods**：响应头中包含的允许的 HTTP 方法列表。
- **Access-Control-Allow-Headers**：响应头中包含的允许的请求头字段列表。
- **Access-Control-Allow-Credentials**：响应头中包含的布尔值，表示是否允许发送 Cookie 和 HTTP 认证信息。

```javascript
app.use(async (ctx, next)=> {
 // 通常设置为目标host
 ctx.set('Access-Control-Allow-Origin', '*');
 ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
 ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
 if (ctx.method == 'OPTIONS') {
 	ctx.body = 200;
 } else {
 	await next();
 }
```

#### 优点

- 支持所有的HTTP请求方法。
- 安全性高，通过在服务端设置响应头来明确允许哪些来源的请求可以访问资源，可以有效减少CSRF等安全风险。

#### 缺点

- 服务器配置复杂，开发者需要对CORS的各种响应头有深入的了解，并根据具体的需求进行正确的配置。
- 有一定的性能开销，在发送实际请求之前，浏览器会先发送一个OPTIONS请求来检查服务器是否允许跨域。预请求会增加额外的网络开胸和服务器负载。

### Proxy

- 通过配置代理服务器，可以将浏览器发送的请求转发到服务器，从而避免跨域问题。

#### 本地服务器

通过 vue-cli 脚手架搭建的项目，可以通过 webpack 起一个本地服务器作为请求的代理对象；通过该服务器转发请求到目标服务器，得到响应结果再转发到前端，但是最终发布上线时，如果web应用和接口服务器不在一起仍会跨域。

``` javascript
module.exports = {
    devServer: {
        host: '127.0.0.1',
        port: 8084,
        // vue项目启动时自动打开浏览器
        open: true,
        proxy: {
            // '/api'是代理标识，用于告诉node，url前面是/api的就是使用代理的
            '/api': { 
                //目标地址，一般是指后台服务器地址
                target: "http://xxx.xxx.xx.xx:8080",
                //是否跨域
                changeOrigin: true,
                // pathRewrite 的作用是把实际Request Url中的'/api'用""代替
                pathRewrite: {
                    '^/api': "" 
                }
            }
        }
    }
}
```

#### 服务端实现代理请求

在 Node.js 中，可以使用 *http-proxy* 模块来实现代理服务器。代理服务器可以用于正向代理、反向代理以及其他场景。

``` javascript
// egg-http-proxy
config.httpProxy = {
    '/api/page/proxy': {
        target: 'http://xxx.xxx.xx.xx:8080',
        pathRewrite: {'^/api/page/proxy': ''},
        changeOrigin: true,
        secure: false,
        router: function (req) {
            let proxyArr = req.headers.proxyurl.split(',');
            let proxyurl = proxyArr.splice(0, 1)[0];
            req.headers.proxyurl = proxyArr.join(',');
            console.log(proxyurl);
            return proxyurl;
        }
    }
};
```

#### Nginx

通过 Nginx 解决跨域问题，需要在 Nginx 的配置文件中添加特定的HTTP头部，以允许跨域请求。

``` nginx
server {
    listen    80;
    # server_name www.josephxia.com;
    location / {
        root  /var/www/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass  http://127.0.0.1:3000;
        proxy_redirect   off;
        proxy_set_header  Host       $host;
        proxy_set_header  X-Real-IP     $remote_addr;
        proxy_set_header  X-Forwarded-For  $proxy_add_x_forwarded_for;
    }
}
```

