# Ajax VS Axios VS Fetch

| 对比项   | Ajax                                                                                                               | Axios                                                                                                            | Fetch                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 基本概念 | 一种技术统称，是一种在不刷新整个页面的情况下，与服务器进行异步通信并更新部分网页的技术，依赖于 XMLHttpRequest 对象 | 一个封装库，基于 Promise 的 HTTP 请求，用于在浏览器和 Node.js 环境中发送 HTTP 请求，对 XMLHttpRequest 进行了封装 | 是 ES6 引入的一种新的网络请求 API，它使用 Promise 对象来处理请求和响应，支持链式调用和异步处理 |
| 请求配置 | 需要手动设置请求头、请求方法、请求提等                                                                             | 可以在请求配置对象中设置各种参数                                                                                 | 在第二个参数中设置请求头、请求方法、请求提等                                                   |
| 错误处理 | 需要在 onreadtstatechange 或 onerror 事件中手动处理错误                                                            | 使用 catch 方法捕获请求过程中的错误，错误信息包含详细的请求和响应信息                                            | 只有在网络请求失败时才会触发 catch 方法，对于 HTTP 错误状态码需要手动检查响应状态码            |
| 拦截器   | 没有内置的拦截器功能，需要手动实现                                                                                 | 提供了请求、响应拦截器                                                                                           | 没有内置的拦截器功能，需要手动实现                                                             |
| 取消请求 | 调用 abort()方法取消，触发 onabort 事件                                                                            | - CancelToken.source()<br />- CancelToken 构造函数                                                               | AbortController()                                                                              |

```javascript
// Ajax示例
function ajax(url) {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", url, true)
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.info("响应结果", xhr.responseText)
    }
  }
  xhr.send()
}
ajax("https://example.com/api/data")
```

```javascript
// Axios示例
axios({
  method: "post",
  url: "https://example.com/api/data",
  data: {
    firstName: "John",
    lastName: "Doe",
  },
})
  .then((response) => {
    console.log(response.data)
  })
  .catch((error) => {
    console.error(error)
  })
```

```javascript
// Fetch示例
function fetchRequest(url) {
  fetch(url)
    .then((response) => response.json())
    .then((data) => console.info(data))
    .catch((error) => console.error(error))
}
fetchRequest("https://example.com/api/data")
```

## 相关问题

### 如何取消已经发送的请求

```javascript
const xhr = new XMLHttpRequest()
xhr.open("GET", "/api/data", true)
xhr.send()
xhr.abort() // 取消当前请求
```

```javascript
import axios from "axios"
// 方式一
const source = axios.CancelToken.source()
axios
  .get("/api/data", { cancelToken: source.token })
  .then((response) => console.log(response.data))
  .catch((err) => {
    if (axios.isCancel(err)) {
      console.log("请求已取消")
    }
  })

// 取消请求
source.cancel("操作已取消")

// 方式二
const CancelToken = axios.CancelToken
let cancel
axios.get("/api/data", {
  cancelToken: new CancelToken(function executor(c) {
    cancel = c
  }),
})

cancel("取消请求")
```

```javascript
const controller = new AbortController()
const signal = controller.signal

fetch("/api/data", { signal })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("请求已取消")
    }
  })

// 取消请求
controller.abort()
```
