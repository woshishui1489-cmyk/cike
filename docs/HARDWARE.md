# 硬件指纹模拟（0.9.0）

## 内核模式（新增）

0.9.0 新增 **内核模拟（Camoufox / Firefox）**，用于避免 0.8.0 软件模拟产生的网页 API 替换痕迹。它使用固定版本的 Camoufox，在 Firefox 内部设置 CPU 线程数和可选 GPU 标识；不向网页注入硬件脚本，不替换 `navigator` getter、Canvas、WebGL 或音频函数。

1. 进入“设置 → Camoufox 指纹内核”下载安装。下载约 1.3 GB，展开约 2.6 GB，安装前须关闭所有环境。
2. 新建环境，或编辑环境并展开“指纹选项”，选择“内核模拟（Camoufox / Firefox）”。
3. 设置 CPU 线程数。建议显卡标识保持“原生显卡”；可选显卡预设仍只改变标识，不能改变实际能力。
4. 保存并关闭、重新打开环境。

### 固定字体集（本地优化版）

Windows 内核模式新增“字体策略 → 按环境固定 Windows 字体集”。字体名单在首次选择时按环境种子生成，并作为版本化快照保存在该环境配置中；改名、分组、修改代理和重启不会重新生成。旧环境默认继续使用原生字体，需手动选择后保存；切换字体策略或点击“生成另一组”会改变网站观察到的字体，应先用测试环境验证。

固定名单保留基础、中日韩和回退字体，再按种子选择 8 组可选字体，名单组合最多 256 种；字体不可用时，实际可测差异还可能更少。页面、iframe 与 Worker 使用同一个内核字体配置，不注入网页脚本。不同种子可能选中相同名单，因此不保证每个环境唯一。文字的 Canvas 渲染可能随字体改变，纯色像素和音频不添加噪声。屏幕、DPI 和显卡实际能力继续采用原生行为。

Windows 基础字体名称来自锁定版本的 [Camoufox essential-fonts.json](https://github.com/daijro/camoufox/blob/v158.0.1-beta.41/python/src/camoufox/essential-fonts.json)，为兼容 Windows 10 不添加 Windows 11 专属标记字体；可选字体名称来自同版本的 [fonts.json](https://github.com/daijro/camoufox/blob/v158.0.1-beta.41/python/src/camoufox/fonts.json)。这里只保存名称，不分发字体文件；实际字体和许可证由原内核包提供。

“生成另一组”现在按当前策略生成参数：内核模式保持原生显卡、关闭脚本噪声，在 Windows 上启用固定字体集；生成的 CPU 读数不超过本机可用逻辑处理器数（单核主机仍以受支持的最小值 2 为下限）。这不模拟相应 CPU 的实际性能。软件层模式沿用原有生成方式。API `POST /api/fingerprints/generate` 可传 `{"fingerprintMode":"kernel"}`；省略时仍返回软件层配置。

**数据与兼容性：**Firefox 使用环境目录下独立的 `firefox` 子目录；原 Chromium 的 Cookie、站点数据保留，切回 Chromium 后继续使用。两种内核之间不会自动迁移登录状态。Firefox 不支持 Chrome 扩展、Chromium CDP 调试端口和所有仅限 Chrome 的网页功能。

0.10.2 可在设置中选择 Camoufox 图形渲染模式。兼容软件绘制使用 CPU 合成窗口，绕开故障的 GPU/D3D11 合成路径，保留原生网页接口；它可能改变 Canvas/WebGL 的实际结果和性能。显卡标识设置不保证对应的硬件加速能力，无法提供的 WebGL 功能不会用网页脚本补造。自动回退仅针对已识别的 Windows 图形启动崩溃，具体用法见 [Windows 说明](WINDOWS.md)。

**范围：**页面、iframe、专用/模块/共享/Service Worker 共用 CPU 配置。语言与请求头使用同一规范化语言代码，时区由内核处理，UA 使用对应版本的 Firefox。Canvas 和音频不添加种子噪声；字体默认原生，可在 Windows 上显式启用上述固定名单。Firefox 原本不提供 `navigator.deviceMemory`，本模式保持该接口不存在；配置编号不是网站看到的完整指纹，不保证每个环境的完整指纹都不同。

**窗口与下载：**仍默认最大化并记住 F11 全屏。随内核加载的本地后台扩展仅管理真实窗口，没有内容脚本或可被网页读取的资源。窗口控制使用独立、随浏览器关闭失效的能力令牌；该令牌不能访问一般 API。仅随机的 `.localhost` 控制域名绕过环境代理，普通网页请求继续使用配置的代理。下载使用 Firefox 原生下载管理器，保留文件名、处理重名并保存到系统下载目录。

内核固定为 [Camoufox v158.0.1-beta.41](https://github.com/daijro/camoufox/releases/tag/v158.0.1-beta.41)，匹配 Playwright 1.62.0。下载来自该项目官方 Release，先校验固定 SHA-256，再验证版本与启动，完成后才切换可执行文件标记。内核源码、许可证与第三方字体声明由 Camoufox 项目及下载包提供。CIKE 不把第三方内核称作自行编译的内核。

`test/kernel-runtime.test.js` 验证原生 getter、像素/音频、各类 Worker 的首次读数、请求头、重启、数据隔离与真实下载。`test/kernel-window.test.js` 验证 Windows 最大化、F11、新窗口及新环境继承；`scripts/check-native-site.js` 等待 who.1ms.dog 的完整检测后核对“环境被篡改”结果。检测结果仅代表对应版本、配置与测试环境，**不保证所有网站无法识别，也不保证以后版本的检测结果**。性能、驱动和其他底层信号仍可能与报告的 CPU/GPU 不同。

## 软件层模式（0.8.0 保留）

0.8.0 的**软件层硬件指纹模拟**继续保留。它改变网站通过部分浏览器 API 读取到的值与输出，会被检查原生函数或已知像素的检测网站识别，不改变真实硬件、驱动或计算能力。

## 使用

在“新建环境 → 指纹选项”或“编辑环境 → 指纹选项”中，把策略改为“硬件模拟（软件层）”。可设置：

- CPU 线程数：2、4、6、8、12、16、24、32。
- 网页内存值：0.5、1、2、4、8 GB；这表示网页读数，不表示程序实际获得的物理内存。
- 显卡标识：Intel、NVIDIA、AMD 预设，或沿用原生显卡。
- Canvas 读取与音频读取：按环境固定处理，或保留原生输出。

首次保存会生成固定的环境种子。更名、修改代理、关闭重开或重启 CIKE 不会自动更换种子。点击“生成另一组”可以重新生成参数和种子；修改后需要关闭并重新打开环境。

原有环境和默认新建环境仍使用原生一致模式。切换策略会改变网站观察到的特征，Cookie 和站点数据继续保留。不同环境即使配置了相同的 CPU 与显卡，也可通过各自的 Canvas/音频种子得到不同输出；关闭这些选项后，不能据此保证环境指纹互不相同。

## 实现范围

| 表面 | 行为 |
| --- | --- |
| `navigator.hardwareConcurrency` | 返回所选线程数，覆盖页面和 Worker |
| `navigator.deviceMemory` | 在浏览器原本提供该接口的上下文中返回所选值 |
| 内存请求头 | 模拟模式发送相同的 `Device-Memory` 与 `Sec-CH-Device-Memory` 值，避免和 JavaScript 读数冲突；该模式会主动发送这些头部 |
| WebGL / WebGL2 | 替换可用的未屏蔽厂商、渲染器标识；处理 RGBA / UNSIGNED_BYTE 的像素读回 |
| WebGPU | 在接口和适配器可用时替换适配器信息标识，不创建虚构适配器 |
| Canvas / OffscreenCanvas | 对不透明 8 位像素采用按种子固定的最低位处理，覆盖常用读取和 PNG 导出；重复读取不累加变化 |
| AudioBuffer | 对有限、非零 PCM 样本进行固定的最低位处理；协调 `getChannelData`、`copyFromChannel`、`copyToChannel` |
| Worker | 在初始脚本执行前安装，包括专用、模块、嵌套、Blob、SharedWorker 与 ServiceWorker |

Worker 使用原始 URL 和加载方式，保留 CSP、同源规则与浏览器沙盒。启动不额外开放远程调试端口。跨环境的浏览器进程与数据目录继续独立。

## 明确限制

- 操作系统、UA、Client Hints 中的平台/架构/浏览器版本、字体和媒体设备仍来自真实运行环境。
- Windows 窗口仍默认最大化并记住 F11 全屏；本模式不把窗口恢复为固定的页面尺寸，也不伪造显示器和系统 DPI。
- GPU 预设只模拟标识。驱动功能、扩展、限额、着色器精度和性能仍取决于实际设备，不能视为完整的虚拟 GPU。
- 透明像素、浮点 Canvas/WebGL 格式、其他 WebGL 像素格式和自定义 Worklet 不在当前固定像素处理范围内。
- CPU 性能、调度、JS 堆容量、字体栅格化等底层特征没有变成另一台电脑。网站仍可能识别软件模拟或通过其他信号关联环境。
- 稳定性以相同浏览器与系统运行环境为前提，升级内核、显卡驱动或系统可能改变底层渲染/音频结果。

## 维护和验证

Worker 初始化适配当前锁定的 Playwright **1.64.1**。它在 Playwright 恢复 Worker 前排入配置，避免只在 Worker 事件回调中修改而错过首次执行。升级 Playwright 必须同步验证适配器；无法初始化时关闭该环境，不静默降级为部分模拟。

`test/hardware-runtime.test.js` 验证页面/iframe/各类 Worker 的首次读数、内存头部、Canvas 重复读取及导出一致性、环境间差异、音频读取一致性和重启稳定性。`test/desktop.test.js` 验证界面创建和实际打开模拟环境；原生模式与原有窗口、代理、存储回归继续执行。
