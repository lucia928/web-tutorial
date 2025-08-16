# 响应式设计

响应式设计是一种网络页面设计布局，页面的设计与开发应当根据用户行为以及设备环境（系统平台、屏幕尺寸、屏幕定向等）进行响应和调整。

## 实现方式

通过媒体查询检测不同的设备屏幕尺寸做处理，为了处理移动端，页面头部必须有`meta`声明`viewport`。

``` html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no”>
```

### 媒体查询

`CSS3`中增加了更多的媒体查询，就像`if`条件表达式一样，可以设置不同类型的媒体条件，并根据对应条件给符合条件的媒体调用对应的样式表。

使用`@media`查询，针对不同的媒体定义不同的样式，可以给不同分辨率的屏幕设置不同的背景图片、字体大小以及布局等。

``` css
@media screen and (max-width: 1360px) {
 body {
 	font-size: 14px;
 }
}

@media screen and (max-width: 1920px) {
 body {
 	font-size: 18px;
 }
}
```

**缺点：**

- 代码冗余，同一套代码需要适配多种设备，可能导致移动端和PC端重复加载相同样式文件，增加加载时间。
- 维护困难，不同设备的布局规则分散在多个媒体查询规则中，代码结构复杂，后期维护成本较高。
- 性能问题，多套布局方案可能造成页面元素重复渲染，降低页面加载速度；复杂布局调整可能增加渲染时间。
- 用户体验差异，过度依赖媒体查询可能导致不同设备显示逻辑混乱，例如移动端与PC端交互逻辑不一致，易造成用户混淆。

### 百分比

通过百分比（%）来实现响应式效果，如果浏览器的宽度或者高度发生变化时，通过百分比单位，组件的宽高也会跟着变化。

**缺点：**

- `width`、`height`属性百分比依赖于父标签的宽高，其他盒子属性则不完全以来父元素（top\bottom\padding\margin\borer-radius等），使用起来较为复杂，所以不建议使用百分比来实现响应式。

### vw/wh

`vw`是相对单位，1vw表示屏幕宽度的1%，适配原理简单。基于此，不需要JS即可适配，我们可以把所有需要适配屏的元素都使用`vw`做为单位。不需要适配的元素使用`px`做单位，方案灵活技能实现整体缩放又能实现局部不缩放。

``` css
 // 可以用calc来换算，只不过需要注意新语法的兼容性
:root {
    --ratio: calc(100vw/750);
}
.div {
    font-size: calc(28/750 * 100vw); /* 3.7333333vw 可以直接用calc */
    width: calc(375*var(--ratio)); /* 50vw 也可以用calc配合var使用，IE不支持var */
}

// 使用SCSS
@function px2vw($px) {
    @return $px / 750 * 100vw;
}
.div {
    font-size: px2vw(28); // 3.7333333vw
    width: px2vw(375); // 50vw
}
```
**缺点：**

- 设置需要适配的属性时手动计算转换后的值，（设计稿标记大小/设计稿宽度 * 100vw），在写样式时会发现，虽然不用写JS做适配，但标注尺寸换算为`vw`又麻烦又不直观。

### 动态rem方案

`rem`是相对单位，相对于`html`根节点的`font-size`属性；若`html`的`font-size`为`64px`，则`1rem=64px`；只要调整`html`标签的`font-size`，就能让所有使用`rem`单位的元素跟随着发生变化，而使用`px`单位的元素不受影响。设计稿标注的`px`换算到`rem`计算简单，方案灵活技能实现整体缩放又能实现局部不缩放。

- 方式一：

  - 写样式时，将元素设计稿标记大小 / 100（即64 / 100 = 0.64rem；100可以替换成任何数字，只是100更好计算）。

  - 监听`load、resize`事件，窗口发生变化重新计算根节点`font-size`大小；设置`html`的`font-size` 为 屏幕宽度/设计稿宽度 * 100。

- 方式2：

  - 引用postcss-px2rem，设置remUnit(基准大小 baseSize)为 默认设计稿宽度/10=124.2。

  - 使用时将元素宽高设置为设计稿标记宽高。
  - 监听`load、resize`事件，窗口发生变化重新计算根节点`font-size`大小；设置`html`的`font-size` 为 (屏幕宽度/10)*(默认设计稿宽度1242/实际设计稿宽度)。

**缺点：**

- 初始设置复杂，需动态设置根元素字体大小（通常通过视口宽度计算），不同设备屏幕尺寸差异可能导致根元素字体大小难以确定，影响全局布局效果。

- 精度限制，`rem`在表示小数时存在精度问题，可能导致布局细节不精确，尤其是复杂嵌套结构中可能出现视觉差异。 ‌

- 兼容性问题，旧版本浏览器可能不支持`rem`单位，需使用`polyfill`或备选方案。

### px + viewport适配

`viewport`是用户的网页可视区域，通常`viewport`是指视窗、视口，浏览器上(也可能是一个`app`中的`webview`)用来显示网页的那部分区域。通过动态设置`meta`标签的`viewport`让`css`中的`1px`等于设备的`1px`。

``` javascript
// 1.设置一个基准宽度（BaseWidth = 320）
// 2.获取浏览器(屏幕) 的宽度
// 3.计算实际宽度与基准宽度的比例(window.__clientWidth__/BaseWidth)
// 4.修改meta标签的viewport的content属性

// 例：设计师交付的设计稿宽度是750px，设计稿上一个div的标注尺寸是375px（宽度是设计稿宽度的一半）
// 设置画布宽度，并缩放视口至画布等大
var BaseWidth = 320;
var clientWidth = (window.__clientWidth__ =
    window.__clientWidth__ || document.documentElement.clientWidth || 320);
var initial = clientWidth / BaseWidth;
var content = `width=${BaseWidth}, initial-scale=${initial}, maximum-scale=${initial}, user-scalable=no`;
document.getElementById('viewport').setAttribute('content', content);
```

**缺点：** 

- 只能整体缩放，不能实现局部不缩放。

- `meta viewport` 是用于适配移动设备的，因此此方案`pc端`不生效。
- 在某些情况下，特别是在使用视口缩放功能时，可能会影响到触摸屏设备的交互体验。例如，用户在缩放页面时可能会意外地触发页面上的元素。



