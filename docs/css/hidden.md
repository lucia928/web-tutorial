# CSS中隐藏元素的方式

在CSS中，有多种方式可以隐藏元素，每种方式有其特定的用途和效果。以下是一些常用的方法来隐藏元素：
## 方式

### display: none

将元素完全从文档流中移除，元素不会被显示，也不会占据任何空间。

### visibility: hidden

将元素隐藏，但元素仍然占据原来的空间。只是看不到它。

### opacity: 0

将元素设置为完全透明，元素仍然占据空间，但看不到它。

### 设置宽高属性为0

将元素`width`、`height`、`padding`、`border`、`margin`等影响元素盒模型的属性设置成0，如果元素内又子元素或内容，还应该设置`overflow:hidden`来隐藏元素。元素不占据页面空间，无法响应点击事件。

### position: absolute

过将元素的位置设置在屏幕之外，可以使其不可见。

### clip-path

通过裁剪的形式，`clip-path: polygon(0px 0px,0px 0px,0px 0px,0px 0px); `，元素占据页面空间，，无法响应点击事件。

## 总结

以上的方式最常用的还是`display`和`visibility`，其他方式只能认为是奇招，他们真正用途并不是用于隐藏元素，所以不推荐使用。

![隐藏元素](D:\Projects\example\图片\隐藏元素.png)