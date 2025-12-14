Language Learning Chrome Plugin  Detailed Product Requirements Document PRD

  产品概述（Product Overview）

 产品定位
 一款语言学习向 Chrome 插件，作用于任意网页中的输入框（如搜索框、评论框、发帖框）。
 主打“在真实表达中学习地道表达”，不仅是翻译或纠错工具。
 支持多语种组合，初期建议聚焦如“中文  英语”、“韩语  英语”等核心语言对。
 学习模式为主，同时支持工具模式（沉浸式翻译、快速替换）。

 用户人群
 非母语学习者，如：
   想学英语的中文用户；
   海外浏览外语网站但表达有困难的用户；
   多语种内容创作者；
   对语言表达敏感、想模仿 native 说法的语言爱好者。

  功能设计（Features）

  输入端学习模式主流程

  触发方式
 鼠标聚焦输入框时，右下角浮现悬浮按钮（图标/）。
 快捷键触发建议使用“三击空格（space x3）”。
1. 🧷 输入框右下角「浮动按钮」✅（推荐）

固定在输入框内部或紧贴框体右下角，跟随输入框移动和缩放，不随文字滚动脱离输入区域；

类似 Grammarly 插件、Notion AI 那种样式；

鼠标 hover 上去时显示文字提示，如「查看优化表达」；

不影响用户输入，也不会遮盖文字。
  分析输入逻辑
 后端以句子为单位处理文本内容（依据标点分割）。
 支持识别以下四种输入情形：
  1. 完整母语句子（需翻译+改写）
  2. 混合语言句子（需重点解释混合片段）
  3. 目标语但表达不自然（提供更地道表达+讲解）
  4. 已较地道表达（给予鼓励，可提供替代表达）

  输出字段结构（每句一个 response）：

  "userinputraw" "我想表达我很喜欢这个产品",
  "inputlanguage" "zh",
  "finalrewrite" "I really like this product.",
  "explanation" "‘really like’ 是常见地道表达，语气自然",
  "focuspoint" "really like",
  "expressionintenttag" "表达喜好",
  "pressfeedback" "表达很清晰哦，下面是更自然的说法",
  "sourceurl" "https//reddit.com/post/xxx",
  "timestamp" "20251130T153000Z"

 多句场景：每句作为一项，统一在一个 response list 中返回。

 替换交互
 可逐句点击“替换句子”
 可一键“替换全部”为优化后的内容
 可复制优化建议全文
  Replace 按钮需要将建议准确回填到原始输入框（包括 iframe 内的输入框），即便输入框失焦或侧边栏获得焦点也要能定位并替换。
 替换逻辑：有选区只替换选区，无选区按 select-all 替换；input/textarea 使用 selectionStart/selectionEnd 拼接并派发 input(change)；普通 contenteditable 通过 DOM Range delete+insertText 重置光标；富文本编辑器使用 beforeinput/input（insertReplacementText）模拟用户替换，保持宿主框架状态一致。

  Phrasebook 模块（表达库）

分为 3 个子模块：

1. 表达记录（句级）：按时间倒序记录所有用户发起过的学习请求
2. 重点表达（短语级）：自动抽取 focuspoint 字段中出现频率较高的词组
3. 生词/短语表（词级）：检测每句中较为困难或错误使用的词汇，作为生词收录

 每条表达记录包括：
 用户原始输入 + 系统建议
 中文解释
 来源网站 URL + 标题
 表达意图标签（如表达赞同、否定、推荐、疑问）

  Phrasebook UI 双端设计方案

 插件内提供一个轻量 Phrasebook 视图：
   展示最近 10 条表达记录（按时间倒序）
   支持星标收藏、模糊搜索、快速复制表达
 插件提供入口跳转到完整 Phrasebook 网站版：
   支持更完整的记录筛选、分组、复习、打标签、卡片练习等
   支持后续登录、云同步、跨端访问（需后台数据库）

  UI & 交互设计

 输入侧 UI（浮窗卡片）
逐句卡片式展示优化建议：
  原句  推荐表达  中文讲解
  每卡片配操作：替换 / 收藏 / 标星
底部提供：“替换全部”、“复制全部”按钮
 点击翻译按钮时，在页面右侧弹出固定宽度约 360px 的 Side Panel：
   展示原始输入（灰色小号字体）、推荐表达（加粗主句）
   Focus Point 卡片（source → target + reason），解释内容使用 bullet 列表
   其他表达变体 1-2 条，提供 Replace / Save to Phrasebook / Close 操作按钮
   支持滚动且与主输入脚本解耦，便于扩展最小化或关闭行为
  Side Panel 前端以 React + TSX 组件渲染，样式通过注入式样式表集中管理，保持与内容脚本逻辑解耦
  统一语言偏好获取与透传：
   通用函数 getUserLanguagePreference() 返回 { nativeLanguage, targetLanguage }
   优先读取 chrome.storage.sync 或 popup/options 配置，默认回退到预设语言对
   所有 AI/Mock 请求统一携带 { input, nativeLanguage, targetLanguage } 结构
视觉风格：
  极简、柔和配色（米白、浅蓝、灰）
  字体建议：中文 HarmonyOS Sans，英文 Inter
   轻微动效反馈（卡片 hover、输入框替换动画）

 Phrasebook UI
 插件端：轻量视图，如上所述
 Web 端：三栏结构，支持表达记录 / 焦点短语 / 生词记录
 支持搜索、标签筛选、星标收藏

  定价机制
 免费用户每日使用上限（如每日 5 次学习请求）
 超出后引导订阅付费：
   月付 / 年付订阅（通过 Cream 接入）
   Pro 版支持更多请求、更丰富解析、多模型选择等

  技术方案（Tech Design）

  插件结构
 Manifest v3
 前端框架：React + TailwindCSS
 入口：popup.html + contentscript.js + background service worker
 样式：模块化 Tailwind，组件结构化

  模型接入
 后端支持 OpenAI GPT4/GPT3.5 或 Claude（后期可接入本地模型）
 根据不同语种/场景选择最优 prompt 模板（可扩展）
 Prompt 根据句子类型、目标语、用户表达意图动态组装

  数据存储方案
 初期存储使用 chrome.storage.local（离线）+ IndexedDB
 后期接入远端存储服务（如 Supabase/PostgreSQL）用于：
   用户 phrasebook 同步
   数据跨设备访问
   训练/改进推荐算法

  支付系统
 集成 Cream（https//usecream.com）用于订阅管理和支付接口
 控制接口访问频率 & 高级功能解锁逻辑

  后续可扩展方向（非 MVP 必须）
 表达记录打标签 & AI 自动分类（如：表达赞同/建议/委婉拒绝）
 Phrasebook 内容复习模式（根据熟练度排序）
 用户风格偏好设置（formal / casual / playful）
 插件 UI 多语言化（界面支持用户母语）
