# weishan 全球采购与最低到手价标准 V1

## 1. 产品定位

weishan 是全球个人数字采购代理，帮助用户把自然语言需求转化为安全、可比较、可跳转的购买或预订方案。

weishan 不是单一平台工具，不是 eBay 工具，不是只面向中国市场的工具。weishan 也不是交易平台、不是支付平台或资金托管平台。

在前期阶段，weishan 免费帮助用户找到同等条件下更低的真实购买或预订页面。用户最终仍在外部真实平台完成交易，weishan 不代付款、不自动下单。

## 2. 覆盖范围

weishan 长期覆盖以下全球采购与预订来源：

- 商品电商平台
- 品牌官网 / 商品官网
- 酒店官网
- 酒店 OTA
- 机票 OTA
- 航司官网
- 票务平台
- 本地服务预约平台
- 区域性电商和本地平台

这些来源构成全球多源 provider 候选池。任何单一 provider 都只是候选来源之一，不能代表 weishan 的完整方向。

## 3. 用户体验目标

用户只需要表达需求，例如：

- 买某个商品
- 订某家酒店
- 买某张票
- 订某趟航班
- 预约某项服务

weishan 负责：

- 搜索多个真实 provider
- 比较同等条件
- 计算最低到手价 / 最低预订价
- 最多展示 2-3 条最低结果
- 跳转外部真实平台购买或预订

weishan 的目标不是让用户理解每个平台的搜索规则，而是替用户筛选多个真实来源中同等条件下更低、更清晰、更安全的结果。

## 4. 商业边界

weishan 必须遵守以下商业边界：

- 不代付款
- 不自动下单
- 不提交订单
- 不保存银行卡
- 不保存身份证
- 不保存护照
- 不创建内部付款页
- 不托管资金
- 不承诺收益
- 不保证全网最低价
- 不保证库存
- 不保证税费完全准确

weishan 可以提供搜索、比较、推荐和外部跳转，但交易、付款、身份校验、订单提交必须由用户在外部真实平台完成。

## 5. 价格标准

商品不能只显示裸价并将其当作最低价结论。最低排序应优先使用 `totalLandedCost`。

到手价应尽量包含：

- 商品价
- 运费
- 关税 / 进口税
- VAT / GST / 销售税
- 平台服务费
- 支付手续费
- 清关 / 报关费
- 保险 / 必选服务费
- 其他必选费用

如果费用是预估，必须标注“预估”。如果费用未知，必须标注“待确认”。

如果只有商品价，没有运费、税费、关税或其他必选费用，不能伪装成完整到手价。费用条件不完整时，必须明确提示用户以外部平台、物流商、海关或当地结算结果为准。

## 6. 收货目的地标准

精确最低到手价必须依赖收货目的地，包括：

- 国家 / 地区
- 州 / 省 / 城市
- 邮编 / 邮政编码

Mac 端不应强调 GPS。Mac 定位服务只能作为辅助能力，用于帮助用户填写或确认区域信息。最低到手价必须以收货目的地为准，而不是以原始 GPS 坐标为准。简写标准：Mac 定位服务只辅助。

没有收货目的地时，不能显示精确最低到手价，不能显示购买、预订或付款按钮。

## 6.1. Local Law Compliance Gate 标准

购物、预订和服务预约必须遵守当地法律。weishan 在进入真实 provider 搜索、价格展示或外部跳转前，必须完成当地法律合规 Gate。

合规判断应优先使用定位服务；如果 Mac 或电脑无法提供可靠定位，必须回退到收货地址、服务目的地或用户手动选择的目的地。位置和目的地冲突时，按更严格的一方处理。

如果不确定是否合法，默认阻断搜索、价格展示和跳转购买。合法性未确认前不显示价格、不跳转购买或预订页面。weishan 不提供法律意见，不帮助规避当地法律。

定位隐私必须保持：不保存原始 GPS 坐标，不上传定位到第三方，不用于广告、追踪或画像。

## 7. Provider 标准

Provider 包括但不限于：

- eBay
- Amazon
- Walmart
- Target
- BestBuy
- 京东
- 天猫
- 淘宝
- 拼多多
- 品牌官网
- Booking
- Agoda
- Expedia
- 携程
- 航司官网
- 酒店官网
- 票务平台
- 服务预约平台

任何 provider 在接入前必须经过：

- candidate evaluation
- config safety
- adapter read_only
- read_only adapter
- sandbox dry run
- connector disabled-by-default
- no API key leak
- no real endpoint until approved

Provider 示例只代表候选池范围，不代表已经接入。未通过完整安全链路前，不允许联网搜索、不允许返回价格、不允许展示购买或预订按钮。

## 7.1. Provider Onboarding Checklist 标准

任何真实 provider 接入前必须完成 Provider Onboarding Checklist。无论 provider 类型是商品平台、品牌官网、酒店 OTA、酒店官网、机票 OTA、航司官网、票务平台还是本地服务预约平台，未完成审查前都不得进入 connector 开发或真实连接阶段。

未完成审查前不得配置 API key，未完成审查前不得连接真实 endpoint，未完成审查前不得启用网络搜索，未完成审查前不得显示价格，未完成审查前不得显示购买/预订按钮。

Provider Onboarding Checklist 必须审查：

- 法律条款
- API 文档
- 额度和 rate limit
- 地区覆盖
- 数据字段
- 价格字段
- 税费字段
- 运费 / 预订费字段
- 跳转 URL 策略
- 隐私政策
- API key 存储方案
- no payment / no auto order / no identity storage 的执行边界
- 合规风险
- fallback no_provider 状态

无论 provider 类型如何，都不得自动付款、自动下单、提交订单或保存证件/银行卡。Provider Onboarding Checklist 只允许推进只读搜索准备，不允许绕过 candidate evaluation、config safety、read_only adapter、sandbox dry run 或 connector gate。

## 7.2. Provider Approval Workflow 标准

任何真实 provider 接入前必须完成 Provider Approval Workflow 分级审批。provider 默认状态为未审查，未审查或审查中不得配置 API key、不得连接真实 endpoint、不得启用网络搜索、不得显示价格、不得跳转购买 / 预订页面。

Provider Approval Workflow 至少包括：

- 法律条款审查
- API 文档审查
- 隐私政策审查
- 价格 / 税费 / 运费字段审查
- 安全审查
- 当地法律合规审查
- 人工批准

`approved_for_stub` 只允许开发只读 connector stub，不允许真实网络搜索，不允许配置真实 API key，不允许连接真实 endpoint，不允许显示价格，也不允许展示购买或预订按钮。

任何真实接入前必须同时通过 Local Law Compliance Gate、Provider Onboarding Checklist、config / adapter / sandbox / connector gate。人工批准必须在真实接入前完成。

无论审批状态如何，weishan 都不得自动付款、自动下单、提交订单或保存证件 / 银行卡。

## 7.3. Read-only Connector Stub 标准

真实 provider 接入前只能先开发 Read-only Connector Stub，也就是只读 connector stub。connector stub 默认不可执行，只用于准备代码结构、接口契约、状态展示和安全 gate。

只读 connector stub 默认必须满足：不得连接真实 endpoint，不得配置 API key，不得启用网络搜索，不得返回真实价格，不得返回 fake/demo/mock price，不得跳转购买 / 预订页面。

`approved_for_stub` 只允许开发 stub 结构，不允许真实 provider 连接。标准短语：approved_for_stub 只允许开发 stub 结构。即使 provider 审批状态达到 `approved_for_stub`，也不得连接真实 endpoint、不得配置真实 API key、不得启用网络搜索、不得显示价格、不得跳转购买或预订页面。

任何真实连接仍必须通过 Local Law Compliance Gate、Provider Onboarding Checklist、Provider Approval Workflow、config / adapter / sandbox / connector gate。只读 connector stub 不得绕过这些 gate。

无论 stub 状态如何，weishan 都不得自动付款、自动下单、提交订单或保存证件 / 银行卡。

## 7.4. Provider Stub Profile 标准

Provider Stub Profile 只是候选 provider 档案，用于记录未来可能接入的 provider 基础信息、审批要求、只读 stub 设计边界和安全阻断状态。provider stub profile 只是候选 provider 档案，不代表已接入 provider。

eBay Browse API 只是商品搜索候选之一，不能代表 weishan 的唯一方向。weishan 不是 eBay 工具，也不是单一平台工具。商品、品牌官网、酒店、机票、票务和服务平台仍属于全球多源 provider 候选池。

Provider Stub Profile 默认状态可以是 `profile_only_not_connected`。该状态只允许用于候选档案、approval review 和 read_only_stub_design，不得访问真实 provider，不得配置 API key，不得连接 endpoint，不得启用网络搜索，不得显示真实价格，不得返回 fake/demo/mock price，不得跳转购买。

Provider Stub Profile 不能绕过 Local Law Compliance Gate、Provider Onboarding Checklist、Provider Approval Workflow、Read-only Connector Stub、sandbox dry run、config / adapter / connector gate 或人工批准。任何真实连接仍必须等所有 gate 完成后才允许进入真实 connector 开发。

用户 UI 可以用自然语言展示 provider 档案状态，但不得把 `profile_only_not_connected`、内部布尔值或 raw reason 直接暴露给普通用户。未接入前不得显示“已接入 eBay”“正在搜索 eBay”“eBay 当前最低价”“eBay 已可购买”或类似假接通状态。

## 7.5. Provider Secret Storage Plan 标准

Provider Secret Storage Plan 是真实 provider API key 接入前的安全存储方案审查。任何 provider 在未完成安全存储审查前，不得输入真实 API key，不得保存真实 API key，不得读取真实 API key，不得使用真实 API key 发起网络请求。

Provider Secret Storage Plan 默认状态必须是 `not_configured`，默认阻断原因可以是 `provider_secret_storage_not_approved`。该状态只允许显示自然语言安全说明，不允许把 `secretStatus=not_configured`、`canInputApiKey=false`、`canSaveApiKey=false`、`canReadApiKey=false`、`canUseApiKeyForNetwork=false` 等 raw 字段暴露给普通用户。

密钥安全存储方案必须覆盖全部 provider 类别：商品电商平台、品牌官网、商品官网、区域电商平台、酒店 OTA、酒店官网、机票 OTA、航司官网、票务平台、本地服务预约平台。

Provider Secret Storage Plan 默认必须满足：

- 不允许真实 API key
- 不允许明文密钥
- 不允许明文密钥进入 Git
- 不允许明文密钥进入 UI
- 不允许明文密钥进入日志
- 不允许明文密钥进入 localStorage
- 不允许明文密钥进入 sessionStorage
- 不允许明文密钥进入 query string
- 不允许明文密钥进入 error message
- 不允许读取 provider secret
- 不允许使用 provider secret 发起网络请求
- 不允许连接真实 endpoint
- 不允许启用网络搜索
- 不允许显示真实价格
- 不允许返回 fake/demo/mock price
- 不允许跳转购买或预订页面

真实 provider API key 只能在完成安全存储审查、Provider Approval Workflow、Read-only Connector Stub、sandbox dry run 和 connector gate 后使用。任何真实密钥使用还必须通过 Local Law Compliance Gate、Provider Onboarding Checklist、config safety、read_only adapter 和人工批准。

weishan 不得提供真实 provider 密钥输入框，不得保存真实 key，不得读取 key，不得将 key 用于网络请求，直到 Provider Secret Storage Plan 明确通过。测试可以验证占位符被阻断，但不得让 fake/demo/mock price 或明文 secret 进入生产 UI。

## 7.6. Provider Sandbox Dry Run 标准

Provider Sandbox Dry Run 是真实 provider 接入前的离线沙箱空跑框架。真实 provider 接入前必须完成 sandbox dry run。

sandbox dry run 默认是离线沙箱，只用于检查未来 connector 的请求/响应结构。sandbox dry run 默认不得访问真实 endpoint，默认不得使用真实 API key，默认不得发起网络请求，默认不得返回真实商品结果，默认不得返回真实价格，默认不得返回 fake/demo/mock price，默认不得跳转购买 / 预订页面。

sandbox dry run 通过后也不得自动放开 API key、endpoint、network、price、redirect、checkout/payment/order。任何放开都必须重新经过 Local Law Compliance Gate、Provider Onboarding Checklist、Provider Approval Workflow、Read-only Connector Stub、Provider Stub Profile、Provider Secret Storage Plan、connector gate 和 human approval。

Provider Sandbox Dry Run 只允许审查未来 connector 的请求结构、响应结构、错误处理、超时处理、频率限制、分页、价格字段、税费 / 运费字段、跳转 URL、隐私边界、不付款、不提交订单和不保存证件 / 银行卡。

无论 dry run 状态如何，weishan 都不得自动付款、自动下单、提交订单或保存证件 / 银行卡。

## 7.7. Connector Gate 标准

Connector Gate 是真实 provider 接入前的最终闸门，也是 “真实连接前最终闸门”。任意前置 gate 未完成时，Connector Gate 必须 blocked。

Connector Gate 必须聚合并检查：Global Commerce Standard、Local Law Compliance Gate、Provider Onboarding Checklist、Provider Approval Workflow、Read-only Connector Stub、Provider Stub Profile、Provider Secret Storage Plan、Provider Sandbox Dry Run、config safety、read_only adapter、endpoint review、API key storage review、network policy review、price field review、redirect policy review 和 human approval。

默认状态下，Connector Gate 不得打开 connector，不得连接真实 endpoint，不得使用真实 API key，不得发起网络请求，不得返回真实商品结果，不得返回真实价格，不得返回 fake/demo/mock price，不得跳转购买或预订页面。

Connector Gate 通过后也不得自动放开 checkout/payment/order，不得自动付款，不得自动下单，不得提交订单，不得保存身份证、护照或银行卡。任何真实 connector 放开都必须再次确认当地法律合规、密钥安全、endpoint、network、price、redirect、no payment、no order 和 no identity storage。

用户 UI 只能显示自然语言 Connector Gate 状态，例如 “Gate 状态：已阻断”、“Connector：不可打开”、“Endpoint：不可连接”、“API key：不可使用”、“网络请求：未启用”。不得把 connector_gate_required、connectorGateStatus=blocked、canOpenConnector=false、canConnectEndpoint=false、canUseApiKey=false、canUseNetwork=false、canReturnRealResults=false、canReturnRealPrice=false、canReturnMockPrice=false、noRealEndpoint=true、noRealApiKey=true、noNetworkSearch=true 等 raw/internal 字段裸露给普通用户。

## 7.8. Provider Integration Readiness Summary 标准

Provider Integration Readiness Summary 是真实 provider 接入前的接入准备总览，只用于汇总所有前置 gate 的状态。不代表真实 provider 已接入。

接入准备总览必须覆盖 Global Commerce Standard、Local Law Compliance Gate、Provider Onboarding Checklist、Provider Approval Workflow、Read-only Connector Stub、Provider Stub Profile、Provider Secret Storage Plan、Provider Sandbox Dry Run、Connector Gate 和人工批准。

默认状态下，readiness 必须 not_ready。接入准备总览不得连接真实 endpoint，不得使用真实 API key，不得发起网络请求，不得返回真实商品结果，不得显示真实价格，不得返回 fake/demo/mock price，不得跳转购买，不得自动放开 connector，不得自动放开 checkout/payment/order。

接入准备总览只能显示自然语言，例如 “总体状态：未准备好”、“真实 provider：不可接入”、“API key：不可使用”、“网络请求：未启用”、“真实结果：不可返回”、“真实价格：不可用”、“测试价格：不可用”、“精确跳转：未启用”。不得把 provider_integration_not_ready、readinessStatus=not_ready、canConnectProvider=false、canUseApiKey=false、canUseNetwork=false、canReturnRealResults=false、canDisplayRealPrice=false、canReturnMockPrice=false、noRealEndpoint=true、noRealApiKey=true、noNetworkSearch=true 等 raw/internal 字段裸露给普通用户。

## 7.9. Provider Integration Manual Approval Runbook 标准

Provider Integration Manual Approval Runbook 是真实 provider 接入前的人工审批与运行手册。该手册不代表真实 provider 已接入，不代表真实 provider 已批准。

人工审批与运行手册必须覆盖范围审查、Provider 条款审查、当地法律审查、隐私审查、API 文档审查、Endpoint 审查、API key 存储审查、请求 / 响应结构审查、频率限制审查、价格 / 税费 / 运费字段审查、跳转策略审查、不付款确认、不提交订单确认、不保存证件 / 银行卡确认、回滚方案审查和最终人工批准。

任意审批阶段未完成时，不得连接真实 endpoint，不得使用真实 API key，不得发起网络请求，不得返回真实商品结果，不得显示真实价格，不得返回 fake/demo/mock price，不得跳转购买，不得自动放开 connector，不得自动放开 checkout/payment/order，不得自动付款，不得自动下单，不得提交订单，不得保存身份证、护照或银行卡。

真正接入真实 provider 必须另起版本，经过单独 review、本地 commit、tag 前检查、annotated tag、push main、push tag、release:postcheck PASS 和实机 UI 验收。不得在建立运行手册的同一版本中放开真实 provider 连接。

用户 UI 只能显示自然语言 Provider 接入人工审批手册状态，例如 “手册状态：需要人工审批”、“手册模式：真实接入前运行手册”、“真实 provider：不可批准”、“Endpoint：不可连接”、“API key：不可使用”、“网络请求：未启用”。不得把 provider_manual_approval_runbook_required、runbookStatus=manual_approval_required、canApproveRealProvider=false、canConnectEndpoint=false、canUseApiKey=false、canUseNetwork=false、canReturnRealResults=false、canDisplayRealPrice=false、canReturnMockPrice=false、noRealEndpoint=true、noRealApiKey=true、noNetworkSearch=true 等 raw/internal 字段裸露给普通用户。

## 8. 结果展示标准

结果最多展示 2-3 条。

第一条可以标记为：

- 最低到手价推荐
- 当前可比结果中的较低到手价

禁止写：

- 全网最低价
- 保证最低价
- 已保证最便宜

每条结果必须显示：

- provider / 商家平台
- 商品或服务名称
- 到手总价或预估到手总价
- 费用明细
- 费用完整性
- 发货地 / 收货地
- 外部跳转按钮

如果结果之间服务条件不同，必须展示差异，例如是否含税、是否含运费、是否含行李、是否支持退改、是否官方或授权渠道、是否包含售后。

## 9. 跳转标准

按钮只能跳转真实 provider URL。

只允许：

- `http:`
- `https:`

不允许：

- `javascript:`
- `data:`
- `file:`
- `app:`
- `weishan:`
- 内部付款页

按钮文案只能使用清晰的外部跳转含义：

- 去购买
- 去预订
- 查看详情

点击后必须在外部平台完成交易。weishan 不自动支付，不自动下单，不自动填写订单。

## 10. 安全与隐私标准

weishan 必须遵守以下安全与隐私标准：

- 不保存原始 GPS 坐标
- 不上传定位到第三方
- 不用于广告
- 不用于追踪
- 不用于画像
- 不保存银行卡
- 不保存身份证
- 不保存护照
- API key 不进入 UI
- API key 不进入日志
- `.env` 不提交 Git

任何用户敏感信息、支付信息、身份信息、账号会话信息都不得进入 History、日志、测试快照或前端展示。

## 11. 禁止事项

明确禁止：

- fake price 进入生产 UI
- demo price 进入生产 UI
- mock price 进入生产 UI
- 不允许 fake price
- 不允许 demo price
- 不允许 mock price
- 硬编码真实价格
- 硬编码真实税率并当作确定费用
- 自动支付
- 自动下单
- 内部付款页
- 自动填写证件
- 自动保存银行卡
- 绕过 provider 安全链路
- 绕过 dry run / config / connector gate

任何违反上述标准的开发必须停止，并先进入 review。

## 12. 版本开发标准

每个版本只做一个完整功能模块。

不要因为小文案、小样式单独升版本。小修正应合并进当前正在开发或 review 的版本，除非它本身构成必须独立发布的安全修复。

标准版本流程：

1. 开发
2. 测试
3. review
4. 本地 commit
5. tag 前检查
6. annotated tag
7. push main
8. push tag
9. `release:postcheck` PASS
10. 实机 UI 验收

在 review 前不要 commit、tag 或 push。

### Commerce Local Intent Router 标准

Commerce Local Intent Router 是 weishan 全球采购入口的本地意图识别层。

本地意图识别必须优先处理普通购物、酒店、机票、票务、本地服务和一般全球采购需求。简单 commerce intent 不应调用 AI，目的是减少 AI token 消耗，并避免把明确的采购入口误判为普通问答。

gate / panel 渲染不得调用 AI。静态安全面板、Provider gate、当地法律合规、Connector Gate、Provider Integration Readiness 和 Provider Integration Manual Approval Runbook 的显示必须来自确定性本地状态，不得依赖 AI 输出。

本地路由只能决定是否进入全球采购计划，不得连接真实 provider，不得访问真实 endpoint，不得使用 API key，不得返回真实商品结果，不得显示真实价格，不得返回 fake/demo/mock price，不得跳转购买或预订页面。

复杂自然语言需求可以进入 AI fallback，例如多类别、多城市、复杂预算和约束、明确要求“帮我规划 / 帮我比较方案 / 给我推荐理由”的需求。但 AI fallback 不得绕过当地法律合规、provider onboarding、provider approval、secret storage、sandbox dry run、Connector Gate、人工审批或任何付款 / 下单 / 证件保存边界。

### Complex Commerce Intent AI Fallback 标准

简单 commerce intent 应继续本地识别，不调用 AI。普通商品、酒店、机票、票务、本地服务请求必须优先使用本地规则，避免不必要的 token 消耗。

复杂 commerce intent 可以进入 AI fallback。复杂需求包括多类别组合、时间 / 人员 / 地点 / 预算约束、明确比较 / 规划 / 推荐目标、长句采购或预订需求。

AI fallback 只用于自然语言理解和结构化计划。允许生成的字段仅限于 categories、destination、timeHint、travelerHint、budgetHint、optimizationGoal、missingFields 等结构化计划字段。

AI fallback 不得访问真实 provider，不得连接真实 endpoint，不得使用 API key，不得发起 provider 网络搜索，不得返回真实商品结果，不得显示真实价格，不得返回 fake/demo/mock price，不得跳转购买 / 预订页面。

标准短语：AI fallback 不得连接真实 endpoint。AI fallback 不得使用 API key。AI fallback 不得发起 provider 网络搜索。AI fallback 不得返回真实商品结果。AI fallback 不得显示真实价格。AI fallback 不得返回 fake/demo/mock price。

AI fallback 不得绕过 Local Law、Onboarding、Approval、Secret Storage、Sandbox Dry Run、Connector Gate、Readiness、Runbook。AI fallback 不得自动付款、自动下单、提交订单或保存证件 / 银行卡。

### Complex Intent Split Planner 标准

Complex Intent Split Planner 只负责拆分复合需求，把旅行、商品、票务、本地服务等明显不同的采购目标拆成多个独立子计划。拆分不代表任何真实 provider 已接入，也不代表任何子计划已经可以搜索、报价、跳转或下单。

每个子计划必须独立走 Local Law、Provider Onboarding、Provider Approval、Read-only Connector Stub、Provider Stub Profile、Secret Storage、Sandbox Dry Run、Connector Gate、Readiness、Runbook 和人工批准。子计划之间不得共享 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。

拆分不允许访问真实 provider，拆分不允许连接真实 endpoint，拆分不允许使用 API key，拆分不允许发起 provider 网络搜索，拆分不允许返回真实商品结果，拆分不允许显示真实价格，拆分不允许返回 fake/demo/mock price，拆分不允许跳转购买或预订页面。

复杂输入可以被拆成旅行计划、商品采购计划、门票计划、本地服务计划、酒店计划或机票计划；简单单一需求应保持单计划。拆分阶段只生成结构化计划，不自动付款、不自动下单、不提交订单、不保存身份证 / 护照 / 银行卡，也不保存原始 GPS 坐标。

### SubPlan Gate Matrix 标准

SubPlan Gate Matrix 只整理子计划、缺失信息和下一步动作。矩阵用于帮助用户理解每个子计划当前被哪些 gate 阻断、缺哪些信息、下一步应补什么。

矩阵不代表任何真实 provider 已接入。矩阵不允许访问真实 provider，矩阵不允许连接真实 endpoint，矩阵不允许使用 API key，矩阵不允许发起 provider 网络搜索，矩阵不允许返回真实商品结果，矩阵不允许显示真实价格，矩阵不允许返回 fake/demo/mock price，矩阵不允许跳转购买 / 预订页面。

每个子计划必须独立走 Local Law、Onboarding、Approval、Secret Storage、Sandbox Dry Run、Connector Gate、Readiness、Runbook。矩阵不得让不同子计划共享 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。

SubPlan Gate Matrix 不得自动付款、自动下单、提交订单或保存证件 / 银行卡，也不得保存原始 GPS 坐标。矩阵展示只能使用自然语言，不得向普通用户暴露 raw/internal gate 字段。

### SubPlan Question Generator 标准

SubPlan Question Generator 只根据缺失信息生成补充问题。问题用于帮助用户补齐每个子计划进入后续 gate 前需要确认的信息，不代表任何真实 provider 已接入。

问题生成不代表任何真实 provider 已接入。问题生成不允许访问真实 provider，问题生成不允许连接真实 endpoint，问题生成不允许使用 API key，问题生成不允许发起 provider 网络搜索，问题生成不允许返回真实商品结果，问题生成不允许显示真实价格，问题生成不允许返回 fake/demo/mock price，问题生成不允许跳转购买 / 预订页面。

每个问题必须归属到对应子计划。问题生成不得跨子计划混用问题，也不得让不同子计划共享 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。

SubPlan Question Generator 不得自动付款、自动下单、提交订单或保存证件 / 银行卡，也不得保存原始 GPS 坐标。问题展示只能使用自然语言，不得向普通用户暴露 raw/internal question generator 字段。

### SubPlan Answer Collector 标准

SubPlan Answer Collector 只把用户回答映射到子计划草稿。答案收集不代表任何真实 provider 已接入。答案收集不允许访问真实 provider，答案收集不允许连接真实 endpoint，答案收集不允许使用 API key，答案收集不允许发起 provider 网络搜索。

答案收集不允许返回真实商品结果，答案收集不允许显示真实价格，答案收集不允许返回 fake/demo/mock price，答案收集不允许跳转购买 / 预订页面。每个回答必须归属到对应子计划，不得跨子计划混用回答，也不得让不同子计划共享 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。

本轮不做长期持久化，不得保存身份证、护照、银行卡或敏感身份信息，不得保存原始 GPS 坐标。SubPlan Answer Collector 不得自动付款、自动下单或提交订单，也不得绕过 Local Law、Provider Onboarding、Approval、Secret Storage、Sandbox Dry Run、Connector Gate、Readiness 或 Runbook。

### SubPlan Completion Workspace 标准

SubPlan Completion Workspace 只汇总每个子计划的已补齐字段、仍缺字段、下一问题和下一步动作。补齐工作台只整理临时计划草稿，不代表任何真实 provider 已接入。

补齐工作台不允许访问真实 provider，补齐工作台不允许连接真实 endpoint，补齐工作台不允许使用 API key，补齐工作台不允许发起 provider 网络搜索，补齐工作台不允许返回真实商品结果，补齐工作台不允许显示真实价格，补齐工作台不允许返回 fake/demo/mock price，补齐工作台不允许跳转购买 / 预订页面。

每个工作台项目必须归属到对应子计划。补齐工作台不得跨子计划混用回答、问题、缺失字段或下一步动作，也不得让不同子计划共享 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。

SubPlan Completion Workspace 不得长期保存用户答案，不得保存身份证、护照、银行卡或敏感身份信息，不得保存原始 GPS 坐标。补齐工作台不得自动付款、自动下单或提交订单，也不得绕过 Local Law、Provider Onboarding、Approval、Secret Storage、Sandbox Dry Run、Connector Gate、Readiness 或 Runbook。用户 UI 只能显示自然语言补齐工作台，不得向普通用户暴露 raw/internal completion workspace 字段。

### SubPlan Draft Review Summary 标准

SubPlan Draft Review Summary 只整理可复核的子计划草稿。草稿复核摘要用于让用户检查每个子计划已补齐字段、仍未确认字段、剩余风险和下一步动作，不代表任何真实 provider 已接入。

草稿复核摘要不代表任何真实 provider 已接入。草稿复核摘要不允许访问真实 provider，草稿复核摘要不允许连接真实 endpoint，草稿复核摘要不允许使用 API key，草稿复核摘要不允许发起 provider 网络搜索。

草稿复核摘要不允许返回真实商品结果，草稿复核摘要不允许显示真实价格，草稿复核摘要不允许返回 fake/demo/mock price，草稿复核摘要不允许跳转购买 / 预订页面。

草稿复核摘要不得自动付款、自动下单或提交订单。草稿复核摘要不得保存身份证、护照、银行卡或敏感身份信息，不得保存原始 GPS 坐标，也不得长期保存用户答案。

每个复核字段必须归属到对应子计划。草稿复核摘要不得跨子计划混用字段、问题、回答、风险或下一步动作，也不得让不同子计划共享 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。用户 UI 只能显示自然语言草稿复核摘要，不得向普通用户暴露 raw/internal draft review summary 字段。

### SubPlan Draft Confirmation & Revision Router 标准

SubPlan Draft Confirmation & Revision Router 只处理用户对临时子计划草稿的确认或修正。草稿确认与修正不代表任何真实 provider 已接入，不代表草稿已经通过当地法律合规、provider 审批或 Connector Gate。

草稿确认与修正不允许访问真实 provider，草稿确认与修正不允许连接真实 endpoint，草稿确认与修正不允许使用 API key，草稿确认与修正不允许发起 provider 网络搜索。

草稿确认与修正不允许返回真实商品结果，草稿确认与修正不允许显示真实价格，草稿确认与修正不允许返回 fake/demo/mock price，草稿确认与修正不允许跳转购买 / 预订页面。

用户确认草稿后仍必须经过 Local Law、Provider Onboarding、Approval、Secret Storage、Sandbox Dry Run、Connector Gate、Readiness、Runbook 和人工批准。草稿确认不得自动放开 provider、endpoint、API key、network、price、redirect、checkout、payment、order 或 identity 能力。

每个确认或修正必须归属到对应子计划。草稿确认与修正不得跨子计划混用字段、问题、回答、风险、修正或下一步动作，也不得让不同子计划共享 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。

SubPlan Draft Confirmation & Revision Router 不得长期保存用户答案，不得保存身份证、护照、银行卡或敏感身份信息，不得保存原始 GPS 坐标。用户 UI 只能显示自然语言确认与修正摘要，不得向普通用户暴露 raw/internal draft confirmation 字段。

### Result Summary 标准

Result Summary 默认显示在全球采购页面顶部，让普通用户先看到最终结果摘要卡片，再选择是否查看过程。结果摘要卡片应使用更易读的展示方式，并必须显示旅行计划摘要、商品采购计划摘要、当前状态：“草稿已补齐，等待确认”以及下一步动作。

旅行计划摘要必须体现“成都出发 → 东京”、“7月12日出发，7月12日入住，7月16日离店”、“孩子 8 岁”、“预算一万以内”、“目标：性价比高”。

商品采购计划摘要必须体现“适合剪视频的电脑”、“32G 内存 / 1T 硬盘”、“品牌都可以”、“收货地成都”、“不接受二手”、“预算一万以内”。

下一步动作必须体现“两个都确认”、“确认旅行计划”、“电脑计划确认”、“修改酒店日期”和“修改电脑品牌或预算”。

结果摘要卡片必须明确提示：当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单。结果摘要不得代表真实 provider 已接入，不得连接 endpoint，不得使用 API key，不得发起网络搜索，不得返回真实价格或 fake/demo/mock price。

结果摘要不得新增购买 / 预订 / 付款按钮，不得自动付款、自动下单或提交订单，不得保存身份证、护照、银行卡或长期保存用户答案。结果摘要必须保留草稿确认与修正 chip，并继续遵守默认折叠分析过程和默认压缩安全边界。

### Actionable Checklist 标准

Actionable Checklist 必须显示在结果摘要卡片下方，标题为“可执行清单”，副标题必须说明你可以把下面的条件复制到机票、酒店或购物平台自行搜索，并明确当前不会访问真实平台、不会返回价格、不会跳转购买或预订。

旅行可执行清单必须直接列出机票搜索条件、酒店搜索条件和旅行确认前检查。机票搜索条件必须包含“出发地：成都”、“目的地：东京”、“出发日期：7月12日”、“乘客：1名成人 + 1名8岁儿童”、“预算目标：总预算一万以内”以及“排序建议：优先看总价、转机次数、起飞时间、行李规则”。酒店搜索条件必须包含“目的地：东京”、“入住日期：7月12日”、“离店日期：7月16日”、“人员：带8岁儿童”以及“筛选建议：优先看家庭友好、地铁方便、评分、取消政策、税费是否包含”。旅行确认前检查必须包含“护照 / 签证 / 入境要求需自行确认”、“航班行李规则需自行确认”、“酒店儿童入住政策需自行确认”和“最终价格以真实平台为准”。

商品可执行清单必须直接列出电脑搜索条件、电脑筛选建议和商品确认前检查。电脑搜索条件必须包含“用途：剪视频”、“内存：32G”、“硬盘：1T”、“品牌：都可以”、“收货地：成都”、“是否接受二手：不接受”和“预算：一万以内”。电脑筛选建议必须包含“优先看内存、硬盘、CPU、显卡、屏幕、散热、售后”、“剪视频优先看性能释放和内存容量”、“不接受二手时排除二手 / 翻新 / 展示机”和“比较时看最终到手价、保修、退换政策”。商品确认前检查必须包含“型号是否为新机”、“是否官方保修”、“配置是否真为32G / 1T”、“收货地是否支持配送”和“最终价格以真实平台为准”。

Actionable Checklist 仍然不得访问真实 provider，不得连接 endpoint，不得使用 API key，不得发起网络搜索，不得返回真实价格或 fake/demo/mock price，不得显示购买 / 付款 / 下单入口，不得保存身份证 / 护照 / 银行卡，不得长期保存用户答案。

### Copy Actionable Checklist 标准

Copy Actionable Checklist 必须提供“复制机票搜索条件”、“复制酒店搜索条件”、“复制电脑搜索条件”和“复制全部清单”四个按钮，且只能把对应文本复制到剪贴板。复制按钮只复制文本到剪贴板，不得打开外部平台，不得自动打开外部平台，不得自动搜索，不得自动跳转，不得自动创建任务历史，不得改变当前计划状态，不得返回价格，不得付款或下单，不得保存证件或银行卡。

复制机票搜索条件必须包含机票搜索条件全文，以及“注意：最终价格以真实平台为准。”；复制酒店搜索条件必须包含酒店搜索条件全文，以及“注意：最终价格以真实平台为准。”；复制电脑搜索条件必须包含电脑搜索条件全文，以及“注意：最终价格以真实平台为准。”；复制全部清单必须包含机票、酒店、电脑三段完整内容，以及“当前不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。”。

Copy Actionable Checklist 不得访问真实 provider，不得连接真实 endpoint，不得使用 API key，不得发起网络搜索，不得返回真实价格或 fake/demo/mock price，不得跳转购买 / 预订页面，不得付款，不得下单，不得保存身份证、护照、银行卡或长期保存用户答案。复制失败时只能提示“复制失败，请手动选择文本复制”，不得报错崩溃。


### Platform Search Template Pack 标准

Platform Search Template Pack 必须显示在可执行清单下方，标题必须为“平台搜索模板”，副标题必须说明复制后可以粘贴到对应平台自行搜索，并明确当前不会打开外部平台，不会访问真实 provider，不会返回价格，不会跳转购买或预订。

Platform Search Template Pack 必须显示 5 组模板：机票平台模板、酒店平台模板、中文购物平台模板、英文购物平台模板和全部平台模板。机票平台模板必须包含 Google Flights 模板和 Trip.com / 携程模板；酒店平台模板必须包含 Booking 模板和 Agoda 模板；中文购物平台模板必须包含京东模板和淘宝 / 天猫模板；英文购物平台模板必须包含 Amazon 模板和 Best Buy 模板；全部平台模板必须包含上述八个模板名称以及安全说明。

Google Flights 模板必须包含 From: Chengdu、To: Tokyo、Departure date: July 12、Passengers: 1 adult + 1 child aged 8、Budget target: total trip budget within RMB 10,000、Compare: total price, number of stops, departure time, baggage rules 和 Note: final price must be checked on the real platform. Trip.com / 携程模板必须包含出发地：成都、目的地：东京、出发日期：7月12日、乘客：1名成人 + 1名8岁儿童、预算目标：总预算一万以内、优先比较：总价、转机次数、起飞时间、行李规则 和 注意：最终价格以真实平台为准。

Booking 模板必须包含 Destination: Tokyo、Check-in: July 12、Check-out: July 16、Guests: adult with 8-year-old child、Preferences: family friendly, near subway or convenient transport, good rating, clear cancellation policy, taxes and fees included if possible 和 Note: final price and room policy must be checked on the real platform。Agoda 模板必须包含 Destination: Tokyo、Check-in date: July 12、Check-out date: July 16、Guests: adult + child aged 8、Filter by: family friendly, location convenience, rating, cancellation policy, total price with taxes and fees 和 Note: final price must be checked on the real platform。

京东模板必须包含 用途：剪视频、内存：32G、硬盘：1T、品牌：都可以、收货地：成都、是否接受二手：不接受、预算：一万以内、筛选建议：优先看 CPU、显卡、内存、硬盘、屏幕、散热、售后、官方保修、排除：二手、翻新机、展示机 和 注意：最终价格、库存、保修和退换政策以真实平台为准。淘宝 / 天猫模板必须包含 搜索词：剪视频电脑 32G内存 1T硬盘 新机、预算：一万以内、收货地：成都、品牌：不限、排除：二手、翻新、展示机、重点确认：官方保修、真实配置、最终到手价、退换政策 和 注意：最终价格以真实平台为准。

Amazon 模板必须包含 Use case: video editing、Memory: 32GB RAM、Storage: 1TB SSD、Brand: any brand、Condition: new only, no used or refurbished items、Budget: within RMB 10,000 or equivalent、Compare: CPU, GPU, RAM, storage, display, cooling, warranty, return policy 和 Note: final price, availability, warranty and return policy must be checked on the real platform。Best Buy 模板必须包含 Use case: video editing、RAM: 32GB、Storage: 1TB SSD、Condition: new only、Brand: flexible、Budget: within RMB 10,000 or equivalent、Compare: processor, graphics, memory, storage, screen, cooling, warranty, return policy 和 Note: final price must be checked on the real platform。

Platform Search Template Pack 必须只生成可复制文本，不得打开外部平台，不得访问真实 provider，不得发起网络搜索，不得返回价格，不得返回 fake/demo/mock price，不得跳转购买或预订，不得付款或下单，不得保存证件或银行卡，不得长期保存用户答案。复制按钮必须提供“复制 Google Flights 模板”、“复制 Trip.com / 携程模板”、“复制 Booking 模板”、“复制 Agoda 模板”、“复制京东模板”、“复制淘宝 / 天猫模板”、“复制 Amazon 模板”、“复制 Best Buy 模板”和“复制全部平台模板”。最终价格、库存、政策和合法性以真实平台和当地法律为准。历史回看必须保留平台搜索模板。历史回看必须保留复制按钮。复制失败时只能提示“复制失败，请手动选择文本复制”，不得报错崩溃。

### Collapse Commerce Process By Default 标准

普通用户默认只看结果和确认状态，不看完整过程。默认折叠本地意图识别、复杂意图拆分计划、子计划闸门矩阵、子计划补充问题、子计划答案收集、子计划补齐工作台、Provider 接入准备总览、Provider 审批流程、Provider Sandbox Dry Run、Connector Gate、只读 Connector Stub、Provider 密钥安全方案和 Provider 接入审查面板。

默认只能看到“查看分析过程”入口，点击后再展开完整过程。默认安全边界只能看到一行摘要：“当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单。”；点击“查看安全边界”后再展开完整安全说明。

历史任务回看也必须遵守同样的默认折叠规则，不能默认把完整过程一次性铺开。

### SubPlan Draft Action Bar 标准

SubPlan Draft Action Bar 只提供草稿确认、修正和安全复核的下一步提示。动作提示用于告诉用户可以继续说什么，动作提示不代表任何真实 provider 已接入。

动作提示不允许访问真实 provider，动作提示不允许连接真实 endpoint，动作提示不允许使用 API key，动作提示不允许发起 provider 网络搜索。

动作提示不允许返回真实商品结果，动作提示不允许显示真实价格，动作提示不允许返回 fake/demo/mock price，动作提示不允许跳转购买 / 预订页面。

动作提示不得自动付款、自动下单或提交订单，不得保存身份证、护照、银行卡或敏感身份信息，不得长期保存用户答案，不得保存原始 GPS 坐标。

动作提示只能显示自然语言确认示例、修正示例、返回补充问题示例和安全提醒。用户 UI 不得向普通用户暴露 raw/internal action bar 字段，不得显示 draftActionBarVersion、defaultMode、actionPolicy、actionSuggestions、confirmationSuggestions、revisionSuggestions、rawTask、dispatchPayload 或 commandPayload。

### Task History Detail Restore 标准

Task History Detail Restore 只用于恢复和回看任务历史详情。任务历史回看不代表重新执行任务，也不代表任何真实 provider 已接入。任务历史回看不允许访问真实 provider，任务历史回看不允许连接真实 endpoint，任务历史回看不允许使用 API key，任务历史回看不允许发起 provider 网络搜索。

任务历史回看不允许返回真实商品结果，任务历史回看不允许显示真实价格，任务历史回看不允许返回 fake/demo/mock price，任务历史回看不允许跳转购买 / 预订页面。历史详情只能恢复已生成的本地摘要、gate、子计划、问题或答案收集信息，不得重新运行任务，不得共享或放开 provider、endpoint、API key、价格、跳转、checkout、payment、order 或身份信息。

Task History Detail Restore 不得自动付款、自动下单或提交订单，不得保存身份证、护照、银行卡或敏感身份信息，不得保存原始 GPS 坐标。用户 UI 只能显示自然语言历史详情，不得向普通用户暴露 raw/internal task history 字段。

### History Actionable Checklist 标准

History Actionable Checklist 必须在历史回看中保留可执行清单和复制按钮。
历史回看必须显示结果摘要。
历史回看必须显示可执行清单。
历史回看必须保留复制按钮。
历史回看必须保留可执行清单。
历史回看的复制按钮只复制到剪贴板。
历史回看不得重新执行任务。
历史回看不得新增任务历史。
历史回看不得打开外部平台。
历史回看不得发起网络搜索。
历史回看不得返回价格、付款或下单。
历史回看不得保存身份证、护照或银行卡。

历史回看的复制内容必须继续提示最终价格以真实平台为准，但不能把真实价格、fake/demo/mock price、购买 / 预订 / 付款按钮、内部付款页、自动支付、自动下单或提交订单带给普通用户。

### SubPlan Draft Action Chips 标准

SubPlan Draft Action Chips 只用于把自然语言指令填入输入框。Action Chips 不得自动执行，必须要求用户手动点击开始执行。Action Chips 不代表真实 provider 已接入，Action Chips 不允许访问真实 provider，Action Chips 不允许连接真实 endpoint，Action Chips 不允许使用 API key，Action Chips 不允许发起 provider 网络搜索。

Action Chips 不允许返回真实商品结果，Action Chips 不允许显示真实价格，Action Chips 不允许返回 fake/demo/mock price。Action Chips 不允许跳转购买 / 预订页面，不得自动付款、自动下单或提交订单。Action Chips 不得保存身份证、护照、银行卡或敏感身份信息，不得长期保存用户答案。

Action Chips 只能作为本地快捷提示：点击 chip 只填充输入框，不得触发 dispatch，不得创建任务，不得访问 provider，不得查价，不得跳转，不得付款，不得下单。用户 UI 不得裸露 actionChipsVersion、chipMode、actionChipPolicy、fillInputOnly、neverAutoExecute、canAutoExecuteChip 或 raw/internal payload 字段。

### SubPlan Draft Chip Focus Assist 标准

SubPlan Draft Chip Focus Assist 只用于点击 chip 后聚焦输入框和高亮开始执行按钮。Focus Assist 不得自动执行，必须要求用户手动点击开始执行。Focus Assist 不得自动创建任务，Focus Assist 不得触发 dispatch。

Focus Assist 不代表真实 provider 已接入。Focus Assist 不允许访问真实 provider，Focus Assist 不允许连接真实 endpoint，Focus Assist 不允许使用 API key，Focus Assist 不允许发起 provider 网络搜索。

Focus Assist 不允许返回真实商品结果，Focus Assist 不允许显示真实价格，Focus Assist 不允许返回 fake/demo/mock price。Focus Assist 不允许跳转购买 / 预订页面，不得自动付款、自动下单或提交订单。Focus Assist 不得保存身份证、护照、银行卡或敏感身份信息，不得长期保存用户答案。

Focus Assist 用户 UI 只能显示自然语言提示，不得裸露 focusAssistVersion、focusAssistMode、focusAssistPolicy、focusInputAfterChipClick、highlightStartButton、canFocusCommandInput、canHighlightStartButton、canAutoExecuteChip 或 raw/internal payload 字段。

### One Screen Result Mode 标准

One Screen Result Mode 必须让普通用户默认只看到一个“最终结果”卡片。默认首屏只展示自然语言旅行计划、电脑计划、普通用户安全提示、复制全部搜索条件、复制旅行搜索条件、复制电脑搜索条件，以及“查看可执行清单”“查看平台模板”“查看分析过程”“查看安全边界”“查看技术细节”等入口。

默认不得铺开可执行清单全文、平台搜索模板全文、Google Flights / Trip.com / Booking / Agoda / 京东 / 淘宝 / Amazon / Best Buy 模板全文、机票 / 酒店 / 电脑搜索条件长列表、本地意图识别、子计划拆分、子计划补齐工作台、草稿确认与修正、provider / API key / endpoint / gate / dry run / onboarding / approval 等技术内容。

点击“查看可执行清单”后才能显示旅行可执行清单、商品可执行清单、机票 / 酒店 / 电脑搜索条件。点击“查看平台模板”后才能显示平台搜索模板全文和复制全部平台模板。点击“查看分析过程”“查看安全边界”“查看技术细节”后才能显示对应过程、安全和技术信息。

One Screen Result Mode 只改变展示层，不改变 provider gate，不接真实 provider，不访问真实平台，不返回价格，不返回 fake/demo/mock price，不跳转购买或预订，不付款或下单，不保存身份证、护照、银行卡或长期保存用户答案。复制按钮仍只能复制到剪贴板，不得打开外部平台，不得自动搜索，不得新增历史任务。chip 仍只能填入输入框，不得自动执行。

历史回看也必须默认显示“最终结果”单屏卡片，保留可执行清单和平台模板折叠入口，不得重新执行历史任务，不得清空历史任务。

简单机票请求（例如 7月15日上海到成都最便宜的机票）必须识别为机票搜索，提取出发地：上海、目的地：成都、出发日期：7月15日，并在默认结果区显示“机票搜索条件已整理”。简单机票请求不得误判为商品采购计划或酒店计划，不得默认显示电脑、酒店、京东、淘宝、Amazon、Best Buy 等无关模板。简单机票结果必须明确说明当前不能返回实时价格、当前不能显示最低价两家、最终价格以真实平台为准，只允许复制机票搜索条件、Google Flights 模板和 Trip.com / 携程模板到剪贴板，不得访问真实平台、不得返回假价格、不得跳转购买或预订、不得付款或下单。

## 13. 当前版本链条

- v2.0.25：真实价格只读展示 + 最低价精确跳转
- v2.0.26：商品 provider 选择 readiness gate
- v2.0.27：最低到手价明细
- v2.0.28：定位权限与最低到手价门控
- v2.0.29：收货目的地 gate + UI 版本显示修复
- v2.0.30：全球商品 provider 候选评估
- v2.0.55：Task History Detail Restore / 任务历史详情恢复
- v2.0.56：SubPlan Completion Workspace / 子计划补齐工作台
- v2.0.57：SubPlan Draft Review Summary / 子计划草稿复核摘要
- v2.0.58：SubPlan Draft Confirmation & Revision Router / 子计划草稿确认与修正路由
- v2.0.59：Confirmation Hotfix + SubPlan Draft Action Bar / 确认修复热补丁 + 草稿复核动作栏
- v2.0.60：SubPlan Draft Action Chips / 子计划草稿快捷动作填充
- v2.0.61：SubPlan Draft Chip Focus Assist / 子计划草稿快捷动作聚焦辅助
- v2.0.62：Collapse Commerce Process By Default / 默认折叠全球采购过程
- v2.0.63：Result Summary / 结果摘要
- v2.0.64：Result Summary Card Polish / 结果摘要卡片增强
- v2.0.65：Actionable Commerce Checklist / 可执行采购清单
- v2.0.66：Copy Actionable Commerce Checklist / 一键复制可执行清单
- v2.0.67：Fix History Actionable Checklist / 修复历史回看可执行清单和复制按钮
- v2.0.68：Platform Search Template Pack / 平台搜索模板包
- v2.0.69：Hide Technical Noise / 隐藏多余技术文字
- v2.0.70：Fix Default Technical Noise Leak / 修复默认页技术词泄露
- v2.0.71：Sidebar Version Sync / 修复侧边栏版本号不同步
- v2.0.72：One Screen Result Mode / 单屏结果模式
- v2.0.73：Simple Flight Result Fix / 简单机票结果修正
- v2.0.74：Trusted External Search Router / 可信外部搜索路由
- v2.0.75：Lowest Two Flight Offers Contract / 机票最低两家结果展示合同
- v2.0.76：Flight Provider Candidate Registry / 机票候选 Provider 档案与白名单规则
- v2.0.77：Flight Provider Approval Panel / 机票 Provider 接入审批面板

## 13. 可信外部搜索路线

weishan 当前不做内部支付、不做内部下单、不收用户付款。weishan 只帮用户整理搜索条件，并引导用户去可信外部平台或搜索入口自行查看实时价格。价格、库存、政策、付款、订单全部以外部真实平台为准。

阶段一：外部平台 / 搜索入口跳转。

- 用户主动点击后，打开可信外部搜索入口。
- 不在 weishan 内返回价格。
- 不付款。
- 不下单。

阶段二：只读 provider / 只读搜索结果。

- 仅允许读取公开或授权 provider 的结果。
- 可以返回真实价格。
- 价格必须来自真实 provider。
- 不允许 fake/demo/mock price。
- 不付款。
- 不下单。

阶段三：外部平台付款。

- 只允许跳转到外部平台付款页。
- weishan 不收款。
- weishan 不处理银行卡。
- weishan 不提交订单。
- weishan 不保存身份证 / 护照 / 银行卡。

v2.0.74 只实现阶段一：可信外部搜索路由。外部搜索必须由用户主动点击触发，不得自动打开，不得自动搜索内部 provider，不得新增历史任务，不得改变当前计划状态，不得在 weishan 内显示价格，不得付款或下单。

v2.0.75 在阶段一之上补充机票最低两家结果展示合同。默认必须返回 flightLowestOffersContract，providerStatus / offersStatus / capabilities / safety 默认固定为未接入状态；没有 approved_readonly provider 时不得展示价格卡片、bookingUrl 或最低价前 2 家，只能显示“机票搜索条件已整理”“价格状态：暂未接入真实机票价格源，当前不能显示最低价两家”“接入真实只读价格源后，weishan 会只展示通过安全检查的最低价前 2 家。最终价格、库存、出票规则和付款以外部平台为准。”等 UI 闸门文案。

简单机票请求可以显示固定可信入口：打开全网搜索、打开 Google Flights 搜索、打开 Trip.com / 携程搜索。全网搜索只能打开 Google Search / Bing Search / DuckDuckGo Search 等可信搜索引擎查询页，不得直接展示未知网站结果。按钮附近必须提示：点击后会打开外部搜索或外部平台，实时价格、库存、出票规则和付款均以外部平台为准，weishan 当前不返回价格、不付款、不下单。全网搜索结果由外部搜索引擎提供，weishan 不保证结果网站安全，用户应优先选择官方平台、知名旅行平台和航空公司官网。

AI 只能参与意图识别、搜索词优化和风险提示。AI 可以标记“私人转账”“非官网”“高仿”“低价异常”“短链接”等风险词，但不得直接展示未知网站给用户，不得判定未知网站一定安全，不得生成付款链接，不得生成价格，不得推荐可疑域名。无 AI 时必须使用 weishan 本地规则生成搜索词和可信入口。

后续只读搜索结果接入前必须有网站安全过滤规则。默认不展示短链接、拼写相似的仿冒域名、非 HTTPS 网站、要求微信 / Telegram / WhatsApp 私聊付款的网站、要求先转账再出票的网站、明显低价异常网站、无主体信息的网站、和搜索意图无关的网站，以及成人、赌博、武器、毒品等高风险网站，除非当地法律与产品策略允许且单独通过合规审查。默认优先展示官方平台、官方航空公司、知名旅行平台、知名电商平台、搜索引擎结果页和已人工审核的域名白名单。

后续版本必须继续保持全球多源、只读搜索、安全门控、外部跳转的方向，不能退化为单一平台工具。

## 16. 机票最低两家结果展示合同

未来真实接入后，用户输入简单机票请求（例如 7月15日上海到成都最便宜的机票）时，weishan 只展示通过安全检查的最低价前 2 家可信平台结果。默认状态必须是：

- providerStatus: not_configured
- offersStatus: unavailable
- offers: []
- maxDisplayedOffers: 2
- selectionPolicy: lowest_total_price_first
- canReturnOffers: false
- canReturnPrice: false
- canReturnBookingUrl: false
- canOpenExternalBooking: false
- canCreateOrder: false
- canPay: false
- canStoreIdentity: false

在未获得 approved_readonly provider 时，默认结果区只显示搜索条件、价格状态说明和可信外部搜索入口，不显示价格卡片、bookingUrl、假价格、demo/mock price、购买按钮、付款按钮或下单入口。历史回看也必须保留同样的价格状态说明和外部搜索按钮。

## 17. 机票候选 Provider 档案与白名单规则

v2.0.76 在阶段一之上补充机票候选 Provider 档案与白名单规则。默认必须返回 flightProviderCandidatesRegistry，registryStatus / trustStatus / manualReviewStatus / candidateProfiles 默认固定为候选档案状态；没有人工审核通过的可信候选档案时不得展示价格卡片、bookingUrl、外部跳转、付款或下单入口，只能显示“候选平台档案与白名单规则”“查看候选平台”“候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。”等 UI 闸门文案。

默认优先域名白名单必须包含 Google Flights、Trip.com / 携程、Skyscanner、Kayak、Expedia、Booking Flights 和航司官网占位。默认阻断规则必须覆盖短链接、非 HTTPS、拼写相似的仿冒域名、AI 生成域名、私聊付款、先转账出票、低价异常、无主体信息、和搜索意图无关、成人 / 赌博 / 武器 / 毒品等高风险域名。候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。

候选平台档案只允许描述搜索入口、官方域名、风险等级、人工复核状态和可见的安全边界说明；不允许露出真实 API key、endpoint、真实价格、fake/demo/mock price、付款、下单、证件保存或未知网站结果。

后续版本继续保持阶段一和阶段二的边界，只有在真实只读 provider 获得明确批准后，才可能展示真实价格。

## 18. 机票 Provider 接入审批面板

v2.0.77 在机票候选平台档案之上补充机票 Provider 接入审批面板。默认必须返回 flightProviderApprovalStatus，approvalVersion / approvalStatus / trustStatus / manualReviewStatus / checklist 默认固定为候选审批状态；没有通过人工审核的可信候选档案时不得展示价格卡片、bookingUrl、外部跳转、付款或下单入口，只能显示“查看 Provider 审批状态”“机票 Provider 接入审批”“当前状态：候选平台已建档，尚未批准接入只读价格源。”“审批状态：未审查”“只读价格源：未启用”“bookingUrl：未启用”“付款 / 下单：不支持”“需要 allowlist”“禁止未知域名 / 短链接 / 可疑域名”“AI 不能生成可疑 provider 域名”“人工审核后才允许进入 provider approval”等 UI 闸门文案。

候选平台审批面板只作安全审查档案，不连接 API，不返回价格，不生成 booking 链接。默认允许域名白名单必须包含 Google Flights、Trip.com / 携程、Skyscanner、Kayak、Expedia、Booking Flights 和航司官网占位。默认阻断规则必须覆盖短链接、非 HTTPS、拼写相似的仿冒域名、AI 生成域名、私聊付款、先转账出票、低价异常、无主体信息、和搜索意图无关、成人 / 赌博 / 武器 / 毒品等高风险域名。历史回看也必须保留同样的审批状态说明和外部搜索按钮。

## 14. 默认结果噪音控制

默认结果区必须保持普通用户可读，不得直接泄露 provider / API key / endpoint / Connector Gate / Sandbox Dry Run / Provider Approval / Provider Onboarding / Secret Storage / Stub / raw / dispatch / gate / AI fallback 等技术词。
默认结果区不得泄露 provider / API key / endpoint 等技术词。

默认安全提示必须使用普通用户语言，例如：当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。

这些技术词只能出现在“查看技术细节”展开后。历史回看默认也不得泄露技术词，必须保持结果优先、过程折叠、安全边界压缩。

## 15. Codex 开发规则

每次新功能前必须先读：

`docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md`

任何开发如果违反本文档标准，必须停止并报告。

Codex 不得自行扩大范围，不得接真实 endpoint，不得引入付款、下单、证件保存，不得在 review 前 commit、tag 或 push。

如用户要求接入真实 provider，必须先确认：

- provider 是否经过 candidate evaluation
- provider config 是否安全
- adapter 是否 read_only
- sandbox dry run 是否通过
- connector 是否从 disabled-by-default 状态经过明确批准
- API key 是否只在安全位置存在
- 是否仍不创建内部付款页
- 是否仍不自动支付、不自动下单、不保存证件或银行卡

## 19. 只读适配器开发许可状态

v2.0.79 在机票 Provider 接入审批面板之上新增 “Readonly Stub Permission State / 只读适配器开发许可状态”。默认必须返回 `flightReadonlyStubPermission`，其 `permissionVersion`、`phase`、`overallStatus`、`currentStage`、`checklist` 和 `capabilities` 默认固定为未授予状态；没有人工批准开发只读 stub 时不得展示价格卡片、bookingUrl、外部跳转、付款或下单入口，只能显示“查看只读适配器开发许可”“只读适配器开发许可：未授予”“当前状态：尚未授予只读适配器开发许可。”“当前阶段：需要人工批准”“平台身份确认：未完成”“官方域名 / allowlist 审查：未完成”“Provider 条款审查：未完成”“API 文档审查：未完成”“API key 安全存储方案：未完成”“请求结构审查：未完成”“响应结构审查：未完成”“错误处理审查：未完成”“超时 / 频率限制审查：未完成”“人工批准开发只读 stub：未完成”等 UI 闸门文案。

只读适配器开发许可的状态结构必须至少包含：

- `permissionVersion`
- `phase: "flight_readonly_stub_permission"`
- `overallStatus: not_granted`
- `overallStatus` 可取值：`not_granted`、`granted_for_stub_dev`、`rejected`
- `currentStage: approval_required`
- `currentStage` 可取值：`approval_required`、`stub_dev_allowed`、`sandbox_required`
- `checklist`
- `capabilities`

默认 `capabilities` 必须全部为 false：

- `canDevelopReadonlyStub: false`
- `canUseRealApiKey: false`
- `canConnectRealEndpoint: false`
- `canUseNetwork: false`
- `canReturnPrice: false`
- `canReturnBookingUrl: false`
- `canOpenBookingUrl: false`
- `canCreateOrder: false`
- `canPay: false`
- `canStoreIdentity: false`

默认 `checklist` 至少包括：

- `platformIdentityReview`
- `officialDomainAllowlistReview`
- `providerTermsReview`
- `apiDocumentationReview`
- `apiKeyStoragePlanReview`
- `requestSchemaReview`
- `responseSchemaReview`
- `errorHandlingReview`
- `timeoutRateLimitReview`
- `finalStubDevApproval`

只读适配器只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接，不允许发起网络请求，不允许付款，不允许下单，不允许保存证件 / 银行卡。人工批准开发只读 stub 之前，候选平台默认仍是“未审查”，只读价格源默认仍是“未启用”，bookingUrl 默认仍是“未启用”，付款 / 下单默认仍是“不支持”。

- 不能发起网络请求
- 不能返回 bookingUrl
- 不能保存证件 / 银行卡

## 20. 只读适配器空壳

v2.0.80：Readonly Stub Adapter Scaffold / 只读适配器空壳

v2.0.80 在只读适配器开发许可之上新增 “Readonly Stub Adapter Scaffold / 只读适配器空壳”。默认必须返回 `flightReadonlyStubAdapter`，其 `adapterVersion`、`phase`、`overallStatus`、`currentStage`、`capabilities`、`requestShapeLines`、`responseShapeLines` 和 `display` 默认固定为空壳状态；没有允许连接真实 provider 时不得展示价格卡片、bookingUrl、外部跳转、付款或下单入口，只能显示“查看只读适配器空壳”“只读适配器空壳：已建立”“只读适配器空壳已建立”“尚未允许连接真实 provider”“只读适配器空壳：可用”“真实网络连接：未启用”“真实价格返回：未启用”“bookingUrl 返回：未启用”“可以校验输入形状”“可以构建请求形状”“可以规范化响应形状”“不能读取 API key”“不能连接 endpoint”“不能发起网络请求”“不能返回价格”“不能返回 bookingUrl”“不能打开预订页”“不能付款”“不能下单”“不能保存证件 / 银行卡”等 UI 闸门文案。

只读适配器空壳的状态结构必须至少包含：

- `adapterVersion`
- `phase: "flight_readonly_stub_adapter"`
- `overallStatus: shell_ready`
- `currentStage: shell_ready`
- `capabilities`
- `requestShapeLines`
- `responseShapeLines`

默认 `capabilities` 必须至少包含：

- `canValidateInputShape: true`
- `canBuildRequestShape: true`
- `canNormalizeResponseShape: true`
- `canUseRealApiKey: false`
- `canConnectRealEndpoint: false`
- `canUseNetwork: false`
- `canReturnPrice: false`
- `canReturnBookingUrl: false`
- `canOpenBookingUrl: false`
- `canCreateOrder: false`
- `canPay: false`
- `canStoreIdentity: false`
- `canStorePassport: false`
- `canStoreBankCard: false`

默认 `requestShapeLines` 至少包括：

- `origin：出发地`
- `destination：目的地`
- `departureDate：出发日期`
- `returnDateIfAny：返回日期（如有）`
- `adultsChildrenIfAny：成人 / 儿童（如有）`
- `cabinIfAny：舱位（如有）`
- `currencyIfFuture：币种（未来）`
- `regionIfFuture：区域（未来）`

默认 `responseShapeLines` 至少包括：

- `providerName：提供方名称`
- `airlineName：航司名称`
- `departureTime：起飞时间`
- `arrivalTime：到达时间`
- `duration：时长`
- `stops：中转次数`
- `baggageInfo：行李信息`
- `taxFeeInfo：税费 / 手续费信息`
- `finalPrice：禁用`
- `bookingUrl：禁用`

只读适配器空壳只允许校验输入形状、构建请求形状和规范化响应形状，不允许读取真实 API key，不允许连接真实 endpoint，不允许发起网络请求，不允许返回真实价格，不允许返回 bookingUrl，不允许打开预订页，不允许付款，不允许下单，不允许保存证件 / 银行卡。候选平台与 Provider 审批状态必须继续保留默认未审查和未启用状态。

## 21. Sandbox Dry Run Shell

v2.0.82：Sandbox Dry Run Shell / 机票只读适配器沙箱空跑外壳

v2.0.82 在只读适配器空壳之上新增 “Sandbox Dry Run Shell / 机票只读适配器沙箱空跑外壳”。默认必须返回 `flightSandboxDryRun`，其 `sandboxDryRunVersion`、`phase`、`dryRunStatus`、`networkMode`、`apiKeyMode`、`endpointMode`、`providerMode`、`priceMode`、`bookingUrlMode`、`orderMode`、`paymentMode`、`identityStorageMode`、`capabilities`、`steps` 和 `blockedCapabilities` 默认固定为仅外壳状态；没有启用真实 provider、API key、endpoint、网络、价格、bookingUrl、付款或下单时，不得展示真实结果，只能显示“查看 Sandbox Dry Run”“Sandbox Dry Run：外壳已建立”“沙箱空跑外壳已建立，但未连接真实 provider。”“只允许验证输入、请求和响应结构，不连接真实 endpoint，不读取真实 API key，不返回真实价格，不生成预订链接。”等 UI 闸门文案。

Sandbox Dry Run Shell 的状态结构必须至少包含：

- `sandboxDryRunVersion`
- `phase: "flight_sandbox_dry_run_shell"`
- `dryRunStatus: "shell_only"`
- `networkMode: "disabled"`
- `apiKeyMode: "disabled"`
- `endpointMode: "disabled"`
- `providerMode: "disabled"`
- `priceMode: "disabled"`
- `bookingUrlMode: "disabled"`
- `orderMode: "disabled"`
- `paymentMode: "disabled"`
- `identityStorageMode: "disabled"`

默认 `capabilities` 必须至少包含：

- `canRunDryRunShell: true`
- `canValidateInputShape: true`
- `canValidateRequestShape: true`
- `canValidateResponseShape: true`
- `canSimulateControlFlow: true`
- `canUseFixtureOnly: true`
- `canUseRealApiKey: false`
- `canConnectRealEndpoint: false`
- `canUseNetwork: false`
- `canReturnPrice: false`
- `canReturnBookingUrl: false`
- `canOpenBookingUrl: false`
- `canCreateOrder: false`
- `canPay: false`
- `canStoreIdentity: false`
- `canStorePassport: false`
- `canStoreBankCard: false`

默认 `steps` 必须至少包含：

- `validate_user_input`
- `build_request_shape`
- `validate_request_shape`
- `skip_network_call`
- `build_empty_response_shape`
- `validate_response_shape`
- `block_price_return`
- `block_booking_url_return`
- `block_order_creation`
- `block_payment`

默认 `blockedCapabilities` 必须至少包含：

- `canUseRealApiKey`
- `canConnectRealEndpoint`
- `canUseNetwork`
- `canReturnPrice`
- `canReturnBookingUrl`
- `canOpenBookingUrl`
- `canCreateOrder`
- `canPay`
- `canStoreIdentity`
- `canStorePassport`
- `canStoreBankCard`

Sandbox Dry Run Shell 只允许校验输入、请求和响应结构、模拟控制流和使用 fixture，不允许发起真实网络请求，不允许读取真实 API key，不允许连接真实 endpoint，不允许返回真实价格，不允许返回 bookingUrl，不允许打开预订页，不允许付款，不允许下单，不允许保存证件 / 银行卡。候选平台、Provider 审批状态、只读适配器开发许可和只读适配器空壳必须继续保留默认阻断状态。


## v2.0.83：Sandbox Provider Matrix / 候选平台沙箱矩阵
v2.0.83 在 `Sandbox Dry Run Shell`、`Readonly Stub Permission State`、`Readonly Stub Adapter Scaffold`、`Provider Approval Panel` 和 `Candidate Registry` 之上，新增 `Sandbox Provider Matrix / 候选平台沙箱矩阵`。默认只允许展示候选平台沙箱矩阵，不允许真实 provider 连接，不允许读取真实 API key，不允许连接真实 endpoint，不允许返回真实价格，不允许生成 bookingUrl，不允许付款，不允许下单。

默认必须显示：
- `查看候选平台沙箱矩阵`
- `当前状态：候选平台已进入沙箱矩阵，但尚未允许连接真实 provider。`
- `矩阵摘要`
- `可返回真实价格：0`
- `可返回 bookingUrl：0`
- `可下单：0`
- `可付款：0`
- `网络连接：全部禁用`
- `API key：全部禁用`
- `endpoint：全部禁用`
- `当前结论：不能返回最低价两家`
- `候选平台沙箱矩阵默认全部阻断，只允许审计，不允许真实连接。`
- `候选平台沙箱矩阵只用于审计和准备，不代表已接入真实 provider。`

`flightSandboxProviderMatrix` 默认字段：
- `matrixVersion: "2.0.83"`
- `phase: "flight_sandbox_provider_matrix"`
- `matrixStatus: "readiness_matrix_only"`
- `networkMode: "disabled"`
- `apiKeyMode: "disabled"`
- `endpointMode: "disabled"`
- `providerMode: "candidate_only"`
- `priceMode: "disabled"`
- `bookingUrlMode: "disabled"`
- `orderMode: "disabled"`
- `paymentMode: "disabled"`
- `identityStorageMode: "disabled"`

默认 `capabilities` 必须至少包含：
- `canBuildProviderMatrix: true`
- `canAttachCandidateProviders: true`
- `canAttachDryRunShellStatus: true`
- `canAttachReadonlyStubStatus: true`
- `canAttachApprovalStatus: true`
- `canAuditBlockedCapabilities: true`
- `canShowReadinessState: true`
- `canUseNetwork: false`
- `canUseApiKey: false`
- `canConnectEndpoint: false`
- `canReturnPrice: false`
- `canReturnBookingUrl: false`
- `canOpenBookingUrl: false`
- `canCreateOrder: false`
- `canPay: false`
- `canStoreIdentity: false`

默认 `providerRows` 每一行都必须保持：
- `candidateStatus: "candidate_only"`
- `approvalStatus: "not_reviewed"`
- `readonlyStubPermission: "not_granted"`
- `readonlyStubScaffold: "available"`
- `sandboxDryRunShell: "available_shell_only"`
- `realProviderConnection: "disabled"`
- `apiKey: "disabled"`
- `endpoint: "disabled"`
- `network: "disabled"`
- `priceReturn: "disabled"`
- `bookingUrlReturn: "disabled"`
- `orderCreation: "disabled"`
- `payment: "disabled"`
- `identityStorage: "disabled"`
- `readinessLevel: "not_ready_for_price"`
- `reason: "provider_matrix_no_real_connection"`

默认 `summary` 必须至少包含：
- `totalCandidates`
- `readyForReadonlyPrice: 0`
- `readyForBookingUrl: 0`
- `readyForPayment: 0`
- `blockedFromNetwork: totalCandidates`
- `blockedFromPrice: totalCandidates`
- `blockedFromBookingUrl: totalCandidates`
- `blockedFromOrder: totalCandidates`
- `blockedFromPayment: totalCandidates`
- `overallStatus: "not_ready_for_real_price"`
- `reason: "all_candidates_require_human_approval_and_real_provider_connection"`

`assertFlightSandboxProviderMatrixSafe` 必须拒绝任何可返回真实价格、bookingUrl、下单、付款或身份信息的矩阵。矩阵只用于审计和准备，不代表真实 provider 已接入。

## v2.0.84：Real Result Only Surface / 真实结果优先展示
v2.0.84：Sandbox Provider Matrix / 候选平台沙箱矩阵 保持为只读调试层，默认不展示。
v2.0.84 在 `Sandbox Provider Matrix / 候选平台沙箱矩阵` 之上，调整默认 UI 为真实结果优先展示。默认结果页只展示用户搜索条件、真实价格结果卡片、平台名称、价格、更新时间、可信度、点击跳转外部平台 / 官网和必要安全提示；当没有真实可信价格源时，只显示 `暂无真实价格结果`，并明确说明当前尚未接入真实只读机票价格源，不能展示价格，接入可信价格源后将只显示通过安全检查的真实价格结果，最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。

默认 UI 不展示：
- 分析过程
- Provider 审批状态
- 只读适配器开发许可
- 只读适配器空壳
- Sandbox Dry Run
- 候选平台沙箱矩阵
- 技术细节
- contract
- dry run
- matrix
- API key
- endpoint
- provider 内部状态

默认 UI 不展示分析过程，默认 UI 不展示 Provider 审批状态，默认 UI 不展示只读适配器开发许可，默认 UI 不展示只读适配器空壳，默认 UI 不展示 Sandbox Dry Run，默认 UI 不展示候选平台沙箱矩阵，默认 UI 不展示技术细节。

简单机票请求（例如 7月15日上海到成都最便宜的机票）默认显示：
- `机票搜索结果`
- `出发地：上海`
- `目的地：成都`
- `日期：7月15日`
- `排序：低价优先`
- `暂无真实价格结果`
- `当前尚未接入真实只读机票价格源，不能展示价格。`
- `接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。`
- `weishan 不收款、不下单、不保存身份证、护照或银行卡。`

默认按钮只保留：
- `打开全网搜索`
- `打开 Google Flights 搜索`
- `打开 Trip.com / 携程搜索`
- `复制搜索条件`

价格卡片结构可以保留在代码里，但当没有真实 provider 时必须为空，不得显示 fake/demo/mock price，不得伪造 bookingUrl，不得显示预订、付款或下单入口。

v2.0.84 标准 marker：
- marker:real result only surface
- marker:real result only no fake price
- marker:real result only no mock price
- marker:real result only no demo price
- marker:real result only no booking url
- marker:real result only no payment
- marker:real result only no order submit
- marker:real result only hidden debug panels
- marker:real result only no real provider
- marker:real result only external search fallback
- marker:real result only user api priority future
- marker:real result only trusted price source required

## v2.0.85：User API Priority Search Policy / 用户 API 优先搜索策略
v2.0.85 新增 `commerceUserApiPriorityPolicy.js`，只定义用户 API 优先搜索策略、搜索模式展示和价格来源标签，不接真实 API，不读取 `.env`，不读取 `process.env` 里的真实 provider key，不访问系统钥匙串，不联网，不保存 key。

用户已绑定 API 的未来路径：优先使用用户自己的 API / provider key 做只读搜索和价格分析，只允许读取价格、库存和基础结果信息。即使用户绑定 API，weishan 仍不能付款、不能下单、不能提交身份证 / 护照 / 银行卡或任何身份资料，不能保存银行卡、身份证或护照，不能把写入 API、下单 API、支付 API 作为默认能力。

用户未绑定 API 的当前默认路径：使用 weishan 候选平台 / 外部搜索入口。没有真实用户 API 或真实 provider 时，不显示价格，不显示 bookingUrl，不显示价格卡片，只显示 `暂无真实价格结果`，并保留 `打开全网搜索`、`打开 Google Flights 搜索`、`打开 Trip.com / 携程搜索`、`复制搜索条件`。

默认搜索模式必须展示为：

- 用户 API：未绑定
- weishan 候选平台：可用
- 真实价格结果：暂无
- 绑定 API 后，将优先使用用户授权平台的只读价格结果
- 未绑定 API 时，可使用 weishan 候选平台和外部搜索入口。

价格卡片规则：只有真实可信价格源可用时才允许显示价格卡片。价格卡片必须标明来源、平台、更新时间、是否含税费 / 运费 / 行李，以及 `最终价格以跳转页面为准`。无真实用户 API / 无真实 provider 时，`price` 必须为空，`bookingUrl` 必须为空，不得显示价格卡片。

严禁 fake price、mock price、demo price、AI 估算价格、`约 ¥xxx`、`最低价 ¥xxx`、`已找到价格`、伪造 bookingUrl、预订按钮、付款按钮、下单按钮、内部付款页、自动支付、自动下单、提交订单、身份资料上传、银行卡保存、身份证保存、护照保存。

v2.0.85 标准 marker：
- marker:user api priority search policy
- marker:user api priority not bound fallback
- marker:user api priority readonly only
- marker:user api priority no write api
- marker:user api priority no order api
- marker:user api priority no payment api
- marker:user api priority no identity upload
- marker:user api priority no bank card storage
- marker:user api priority source label required
- marker:user api priority external final price
- marker:user api priority candidate fallback
- marker:user api priority no fake price

## v2.0.86：API Binding Safe Shell / API 绑定安全壳
v2.0.86 新增 `commerceApiBindingSafeShell.js`，只提供 API 绑定入口、权限说明、绑定状态展示和只读 fixture 结构测试。该安全壳不保存真实 API key，不保存明文 key，不读取 `.env`，不读取 `process.env`，不访问系统钥匙串，不连接 endpoint，不发起网络请求，不返回价格，不生成 bookingUrl，不付款，不下单，不上传身份证、护照或银行卡，不保存银行卡。

默认状态必须是：
- 用户 API：未绑定
- weishan 候选平台：可用
- 真实价格结果：暂无
- 搜索优先级：候选平台与外部搜索入口 fallback

`查看 API 绑定说明` 默认折叠。展开后只能说明权限边界：
- 当前状态：用户 API 未绑定。
- 绑定 API 后，可优先使用用户授权平台的只读价格结果。
- API 只用于搜索、读取价格、读取库存、分析结果。
- 点击价格后跳转到外部平台或官网确认。
- 绑定 API 不代表允许付款。
- 绑定 API 不代表允许下单。
- 绑定 API 不代表允许提交身份证、护照或银行卡。
- 只读 API：允许搜索 / 返回价格。
- 写入 API：默认禁止。
- 下单 API：默认禁止。
- 支付 API：禁止。
- 身份资料上传：禁止。
- 银行卡保存：禁止。

只读 fixture 绑定仅可用于测试结构，允许 `canShowPrice: true` 和 `canShowBookingUrl: true` 的测试态，但必须继续禁止 `canCreateOrder`、`canPay`、`canUploadIdentity`、`canStoreIdentity`、`canStoreBankCard`。生产默认不得显示 fixture 价格，不得显示真实价格，不得显示 fake/demo/mock price，不得显示 bookingUrl，不得显示预订、付款或下单入口。

v2.0.87 标准 marker：
- marker:api binding safe shell
- marker:api binding safe shell no real key
- marker:api binding safe shell no plaintext key
- marker:api binding safe shell no endpoint
- marker:api binding safe shell no network
- marker:api binding safe shell no price
- marker:api binding safe shell no booking url
- marker:api binding safe shell no payment
- marker:api binding safe shell no order submit
- marker:api binding safe shell no identity upload
- marker:api binding safe shell no bank card storage
- marker:api binding safe shell readonly only
- marker:api binding safe shell user api not bound

## v2.0.87：User API Provider Catalog / 用户 API 平台目录
v2.0.87 新增 `commerceUserApiProviderCatalog.js`，只展示可绑定 API 平台目录、平台类型、只读潜力、权限说明和未来绑定路径。目录只是目录，不代表已接入真实 provider；当前不输入真实 API key，不保存真实 API key，不明文保存 key，不读取 key，不测试连接，不连接 endpoint，不发起网络请求，不返回真实价格，不返回 fake/demo/mock price，不生成 bookingUrl，不付款，不下单，不上传身份证、护照或银行卡，不保存银行卡。

默认简单机票结果仍显示：
- 用户 API：未绑定
- weishan 候选平台：可用
- 真实价格结果：暂无
- 暂无真实价格结果
- 查看 API 绑定说明
- 查看可绑定 API 平台目录

`查看可绑定 API 平台目录` 默认折叠。展开后只能显示平台目录和权限说明：
- 可绑定 API 平台目录
- 平台目录已建立，但尚未绑定任何真实 API。
- 可选平台类型：机票 / 酒店 / 商品 / 本地服务
- 已绑定 API：0
- 可返回真实价格：0
- 可下单：0
- 可付款：0
- 机票 / 航旅：Trip.com API / Partner API、Skyscanner API / Partner API、Amadeus / GDS 类、Expedia Partner Solutions、Airline official APIs
- 酒店：Booking / partner source、Agoda / partner source、Expedia Partner Solutions、Trip.com hotel partner、Hotel official APIs
- 商品 / 电商：Amazon Product Advertising API、eBay Browse API、Walmart API、京东联盟 / 京东开放平台、淘宝 / 天猫开放平台、拼多多开放平台、Google Shopping / Merchant source
- 本地服务 / 门票：Google Business / Places-like source、Event / ticket provider APIs、Regional local service providers
- 只读潜力：可评估
- 写入能力：禁用
- 下单能力：禁用
- 支付能力：禁用
- 身份资料上传：禁用
- API key 输入：禁用
- endpoint 连接：禁用

`查看 API 绑定说明` 必须联动显示：可绑定 API 平台目录：已建立、当前已绑定 API：0、当前只读价格能力：未启用、真实 API key 输入：未启用、真实 endpoint 连接：未启用。

v2.0.87 标准 marker：
- marker:user api provider catalog
- marker:user api provider catalog only
- marker:user api provider catalog no real key
- marker:user api provider catalog no key input
- marker:user api provider catalog no endpoint
- marker:user api provider catalog no network
- marker:user api provider catalog no price
- marker:user api provider catalog no booking url
- marker:user api provider catalog no payment
- marker:user api provider catalog no order submit
- marker:user api provider catalog no identity upload
- marker:user api provider catalog bound zero
- marker:user api provider catalog provider types
- marker:user api provider catalog readonly potential

## v2.0.88：API Binding Mock Form Disabled State / API 绑定表单禁用态
v2.0.88 新增 `commerceApiBindingMockForm.js`，只展示未来 API 绑定表单的禁用预览。该表单用于让用户理解后续可能需要的平台类型、平台名称、权限类型、API key、API secret、endpoint、地区、币种、回调地址和备注字段，但当前版本不得允许任何真实输入、保存、测试连接或启用价格结果。

默认简单机票结果仍只展示真实结果优先页面，并保留：
- 用户 API：未绑定
- weishan 候选平台：可用
- 真实价格结果：暂无
- 暂无真实价格结果
- 查看 API 绑定说明
- 查看可绑定 API 平台目录
- 查看 API 绑定表单

`查看 API 绑定表单` 默认折叠。展开后只能显示禁用态预览：
- API 绑定表单
- API 绑定表单为禁用预览
- 当前版本不保存真实 API key
- 平台类型
- 平台名称
- 权限类型
- API key
- API secret
- endpoint
- 地区
- 币种
- 回调地址
- 备注
- 保存 API 配置
- 测试连接
- 删除绑定
- 启用只读搜索
- 启用价格结果

所有字段必须 disabled、required false、value 为空。所有动作按钮必须 disabled，包括保存 API 配置、测试连接、删除绑定、启用只读搜索和启用价格结果。该表单不得输入真实 API key，不得保存 key，不得读取 key，不得明文保存 key，不得测试连接，不得连接 endpoint，不得发起网络请求，不得返回真实价格，不得返回 fake/demo/mock price，不得生成 bookingUrl，不得付款，不得下单，不得上传身份证、护照或银行卡，不得保存银行卡。

`查看 API 绑定说明` 必须联动显示：API 绑定表单：禁用预览、当前不能输入真实 API key、当前不能保存 key、当前不能测试连接。

`查看可绑定 API 平台目录` 必须联动显示：API 绑定表单：禁用预览、平台目录只用于了解未来可绑定平台，不代表当前可连接真实 API。

v2.0.88 标准 marker：
- marker:api binding mock form disabled state
- marker:api binding mock form disabled only
- marker:api binding mock form no real key
- marker:api binding mock form no plaintext key
- marker:api binding mock form no editable key input
- marker:api binding mock form no save key
- marker:api binding mock form no test connection
- marker:api binding mock form no endpoint
- marker:api binding mock form no network
- marker:api binding mock form no price
- marker:api binding mock form no booking url
- marker:api binding mock form no payment
- marker:api binding mock form no order submit
- marker:api binding mock form no identity upload
- marker:api binding mock form no bank card storage

## v2.0.89：API Binding Permission Checklist / API 绑定权限清单
v2.0.89 新增 `commerceApiBindingPermissionChecklist.js`，只展示 API 绑定权限清单的只读预览。该清单用于让用户在未来绑定真实平台 API 之前理解允许的只读能力、禁止能力、当前版本禁用项和未来绑定前确认文本；当前版本不得提交绑定确认，不得输入真实 API key，不得保存 key，不得测试连接，不得连接 endpoint，不得发起网络请求。

默认简单机票结果仍只展示真实结果优先页面，并保留：
- 用户 API：未绑定
- weishan 候选平台：可用
- 真实价格结果：暂无
- 暂无真实价格结果
- 查看 API 绑定说明
- 查看可绑定 API 平台目录
- 查看 API 绑定表单
- 查看 API 绑定权限清单

`查看 API 绑定权限清单` 默认折叠。展开后只能显示只读预览：
- API 绑定权限清单
- 权限清单为只读预览，当前版本不能提交绑定确认。
- 允许的未来只读能力：
- 只读搜索
- 读取价格
- 读取库存
- 分析结果
- 显示来源平台
- 点击价格后跳转外部平台确认
- 禁止能力：
- 写入 API：禁止
- 下单 API：禁止
- 支付 API：禁止
- 上传身份证：禁止
- 上传护照：禁止
- 保存银行卡：禁止
- 自动付款：禁止
- 自动下单：禁止
- 后台静默调用 API：禁止
- 明文保存 API key：禁止
- 当前版本禁用：
- API key 输入：禁用
- API key 保存：禁用
- API 连接测试：禁用
- endpoint 连接：禁用
- 真实网络请求：禁用
- 真实价格返回：禁用
- bookingUrl 返回：禁用
- 未来绑定前确认预览：
- 我确认该 API 仅用于只读搜索和价格读取。
- 我理解 weishan 不会替我付款。
- 我理解 weishan 不会替我下单。
- 我理解 weishan 不会上传身份证、护照或银行卡。
- 我理解最终价格以外部平台页面为准。
- 我理解当前版本不会保存真实 API key。
- 我理解未通过安全审查前不会连接真实 endpoint。
- 提交绑定确认

提交绑定确认按钮必须 disabled。权限清单不得输入真实 API key，不得保存 key，不得读取 key，不得明文保存 key，不得测试连接，不得连接 endpoint，不得发起网络请求，不得返回真实价格，不得返回 fake/demo/mock price，不得生成 bookingUrl，不得付款，不得下单，不得上传身份证、护照或银行卡，不得保存银行卡。

`查看 API 绑定说明` 必须联动显示：API 绑定权限清单：只读预览、当前不能提交绑定确认、当前不能输入真实 API key。

`查看可绑定 API 平台目录` 必须联动显示：API 绑定权限清单：只读预览、平台目录不代表已获得 API 权限。

`查看 API 绑定表单` 必须联动显示：API 绑定权限清单：只读预览、未完成权限确认前，表单保持禁用、当前版本不能提交绑定确认。

v2.0.89 标准 marker：
- marker:api binding permission checklist
- marker:api binding permission checklist only
- marker:api binding permission checklist readonly preview
- marker:api binding permission checklist no real binding
- marker:api binding permission checklist no real key
- marker:api binding permission checklist no key input
- marker:api binding permission checklist no save key
- marker:api binding permission checklist no test connection
- marker:api binding permission checklist no endpoint
- marker:api binding permission checklist no network
- marker:api binding permission checklist no price
- marker:api binding permission checklist no booking url
- marker:api binding permission checklist no payment
- marker:api binding permission checklist no order submit
- marker:api binding permission checklist no identity upload
- marker:api binding permission checklist disabled confirmation

## v2.0.91：API Binding Readiness Status / API 绑定准备状态
v2.0.91 新增 `commerceApiBindingReadinessStatus.js`，只做 API 绑定准备状态汇总。该状态用于让用户一眼理解当前不能绑定真实 API、原因、下一步和当前可做事项；不得输入真实 API key，不得保存 key，不得测试连接，不得连接 endpoint，不得发起真实网络请求。

默认简单机票结果仍只展示真实结果优先页面，并保留：
- 用户 API：未绑定
- weishan 候选平台：可用
- 真实价格结果：暂无
- 暂无真实价格结果
- 查看 API 绑定说明
- 查看可绑定 API 平台目录
- 查看 API 绑定表单
- 查看 API 绑定权限清单
- 查看 API 绑定准备状态

`查看 API 绑定准备状态` 默认折叠。展开后必须显示：
- API 绑定准备状态
- 当前结论：当前还不能绑定真实 API。
- 用户 API：未绑定
- 平台目录：已建立
- API 绑定说明：已建立
- API 绑定表单：禁用预览
- API 绑定权限清单：只读预览
- 安全密钥存储方案：方案已建立，尚未实现
- Provider 人工审查：未开始
- 只读沙箱连接：未准备
- 真实价格结果：暂无
- 为什么还不能绑定：
- 安全密钥存储方案尚未实现
- API 绑定权限确认不能提交
- Provider 条款 / API 文档未人工审查
- 只读沙箱连接闸门未完成
- endpoint 连接未启用
- 网络请求未启用
- 真实价格返回未启用
- bookingUrl 返回未启用
- 下一步：安全密钥存储方案
- 当前版本仍不能输入、保存或测试真实 API key。

后续路线必须保持：
1. 平台目录 / 说明 / 禁用表单 / 权限清单：已建立
2. 安全密钥存储方案：下一步
3. 只读 API 绑定草稿：未开始
4. Provider 人工审查：未开始
5. 只读沙箱闸门：未开始
6. 只读价格结果：未开始

永久限制：
- weishan 不付款
- weishan 不下单
- weishan 不上传身份证、护照或银行卡
- weishan 不保存银行卡

`查看 API 绑定说明` 必须联动显示：API 绑定准备状态：未准备、下一步：安全密钥存储方案。

`查看可绑定 API 平台目录` 必须联动显示：API 绑定准备状态：未准备、平台目录只是目录，不代表已经可绑定。

`查看 API 绑定表单` 必须联动显示：API 绑定准备状态：未准备、安全密钥存储方案尚未实现前，表单保持禁用。

`查看 API 绑定权限清单` 必须联动显示：API 绑定准备状态：未准备、权限确认当前不能提交、下一步是安全密钥存储方案。

v2.0.91 标准 marker：
- marker:api binding readiness status
- marker:api binding readiness status only
- marker:api binding readiness not ready
- marker:api binding readiness secure storage next
- marker:api binding readiness no real binding
- marker:api binding readiness no real key
- marker:api binding readiness no key input
- marker:api binding readiness no save key
- marker:api binding readiness no test connection
- marker:api binding readiness no endpoint
- marker:api binding readiness no network
- marker:api binding readiness no price
- marker:api binding readiness no booking url
- marker:api binding readiness no payment
- marker:api binding readiness no order submit
- marker:api binding readiness no identity upload

## v2.0.91：Secure Key Storage Plan / 安全密钥存储方案
v2.0.91 新增 `commerceSecureKeyStoragePlan.js`，只做安全密钥存储方案说明，不保存真实 API key，不写入明文，不写入 `.env` / `localStorage` / `sessionStorage` / 日志，不连接 endpoint，不发起网络请求，不返回价格，不生成 bookingUrl，不付款，不下单。

默认简单机票结果仍只展示真实结果优先页面，并保留：
- 查看安全密钥存储方案
- 安全密钥存储方案：计划中
- 当前状态：仅计划，尚未实现真实安全密钥存储。
- 当前阶段：设计中
- 未来目标：macOS Keychain / Electron safeStorage
- 禁止：明文、.env、localStorage、sessionStorage、日志
- 下一步：设计安全密钥存储实现
- 当前版本不读取真实 API key，不保存明文，不写入 .env / localStorage / sessionStorage / 日志。

`查看安全密钥存储方案` 默认折叠。展开后必须显示：
- 安全密钥存储方案
- 安全密钥存储方案：计划中
- 当前状态：仅计划，尚未实现真实安全密钥存储。
- 当前阶段：设计中
- 未来目标：macOS Keychain / Electron safeStorage
- 禁止渠道：明文、.env、localStorage、sessionStorage、日志
- 下一步：设计安全密钥存储实现
- 当前版本不读取真实 API key，不保存明文，不写入 .env / localStorage / sessionStorage / 日志。
- 不能读取真实 API key
- 不能保存真实 API key
- 不能连接 endpoint
- 不能发起网络请求
- 不能返回价格
- 不能返回 bookingUrl
- 不能付款
- 不能下单
- 不能保存身份证 / 护照 / 银行卡

`查看安全密钥存储方案` 必须联动显示：安全密钥存储方案：计划中、下一步：设计安全密钥存储实现。

历史参考：v2.0.90：API Binding Readiness Status / API 绑定准备状态

marker:secure key storage plan
marker:secure key storage plan plan only
marker:secure key storage plan no real api key
marker:secure key storage plan no endpoint
marker:secure key storage plan no network
marker:secure key storage plan no price
marker:secure key storage plan no booking url
marker:secure key storage plan no payment
marker:secure key storage plan no order submit
marker:secure key storage plan no identity storage
marker:secure key storage plan macos keychain
marker:secure key storage plan electron safestorage
marker:secure key storage plan not granted
marker:secure key storage plan approval required

## v2.0.93：Fix Secure Key Storage Plan Checklist / 补齐安全密钥存储方案清单
v2.0.93 只修安全密钥存储方案面板文案、详情页正文渲染和验收清单，不接真实 API，不读取或保存真实 API key，不连接 endpoint，不发起网络请求，不返回价格，不生成 bookingUrl，不付款，不下单。

`查看安全密钥存储方案` 默认仍折叠。展开后必须直接显示：
- 安全密钥存储方案
- 当前状态：安全密钥存储仍处于方案阶段，当前版本不会保存真实 API key。
- 真实密钥保存：未启用
- macOS Keychain：未连接
- Electron safeStorage：未实现
- .env 保存：禁止
- 明文保存：禁止
- localStorage 保存：禁止
- sessionStorage 保存：禁止
- 日志记录 key：禁止
- API 连接测试：未启用
- endpoint 连接：未启用
- 真实价格返回：未启用
- bookingUrl 返回：未启用

未来允许评估的存储目标只包括：
- macOS Keychain
- Electron safeStorage + 加密本地存储
- 用户本机加密配置文件
- 企业托管密钥服务

禁止的存储方式包括：
- 明文文件
- .env
- localStorage
- sessionStorage
- 前端代码
- 日志文件
- crash report
- 远程未加密存储
- 自动上传到服务器
- 通过聊天记录保存 API key
- 通过截图保存 API key

下一步只能是实现本机安全存储设计。当前版本仍不能输入、保存、读取或测试真实 API key。

marker:secure key storage plan status checklist
marker:secure key storage plan forbidden storage checklist
marker:secure key storage plan disabled connection checklist
marker:secure key storage plan body rendering

## v2.0.96：Secure Storage Design Gate / 安全存储设计闸门
v2.0.96 新增安全存储设计闸门。该闸门只是未来 API key 输入、保存、读取、测试连接、provider 沙箱连接、真实价格返回和 bookingUrl 返回前的统一准入层，不是安全密钥存储实现。

默认状态必须为：
- 闸门状态：关闭
- 当前阶段：设计闸门
- 真实 API key 输入：未开放
- 真实 API key 保存：未开放
- 真实 API key 读取：未开放
- 测试连接：未开放
- provider 沙箱连接：未开放
- 真实价格返回：未开放
- bookingUrl 返回：未开放

阻断原因必须包括：
- 安全密钥写入实现未完成
- 安全密钥读取实现未完成
- 删除 / 轮换机制未完成
- Keychain 适配未完成
- safeStorage 适配未完成
- 加密本地存储未完成
- 审计日志规则未完成
- key 明文脱敏规则未完成
- crash report 脱敏规则未完成
- 截图 / UI 暴露防护未完成
- provider endpoint allowlist 未完成
- 只读 provider 沙箱未完成
- 网络请求闸门未完成
- 真实价格字段校验未完成
- bookingUrl 安全校验未完成
- 人工安全审查未完成

解锁前检查清单必须包括密钥数据结构、本机安全写入接口、本机安全读取接口、删除 key、轮换 key、过期 key、key 别名、日志脱敏、crash report 脱敏、截图 / 复制限制提示、endpoint allowlist、provider 沙箱只读连接、价格字段校验、bookingUrl 域名校验和人工安全审查。

实施里程碑：
- v2.0.96：安全存储设计闸门，默认关闭
- v2.0.96：本机安全存储接口草案，仍不写真实 key
- v2.0.96：密钥脱敏与日志防泄露规则
- v2.0.98：key 删除 / 轮换 / 过期机制草案
- v2.0.98：provider endpoint allowlist 闸门
- v2.0.99：只读沙箱连接闸门
- v2.1.0：人工确认后，才考虑真实只读 key 输入

审计规则必须要求日志中永不记录完整 key、UI 不显示明文 key、crash report 不包含 key / secret / token、E2E 截图不得出现真实 key、删除 key 必须有用户确认，且当前版本仍不能测试连接。

脱敏规则必须至少覆盖：
- apiKey → [REDACTED_API_KEY]
- apiSecret → [REDACTED_API_SECRET]
- accessToken → [REDACTED_ACCESS_TOKEN]
- refreshToken → [REDACTED_REFRESH_TOKEN]
- authorization header → [REDACTED_AUTH_HEADER]
- endpoint credential query params → [REDACTED_CREDENTIAL_PARAMS]

安全存储设计闸门不得放开真实 API key 输入、保存、读取，不得接 macOS Keychain，不得接 Electron safeStorage 真实写入，不得写 .env / localStorage / sessionStorage / 日志，不得测试连接，不得连接 endpoint，不得联网，不得显示真实价格或 fake/demo/mock price，不得生成 bookingUrl，不得显示预订 / 付款 / 下单入口。

marker:secure storage design gate
marker:secure storage design gate closed
marker:secure storage gate no key input
marker:secure storage gate no key save
marker:secure storage gate no key read
marker:secure storage gate no keychain
marker:secure storage gate no safestorage
marker:secure storage gate no env
marker:secure storage gate no logs
marker:secure storage gate no endpoint
marker:secure storage gate no network
marker:secure storage gate no price
marker:secure storage gate no booking url
marker:secure storage gate unlock checklist
marker:secure storage gate redaction rules
## v2.0.96：Local Secure Storage Interface Draft / 本机安全存储接口草案

v2.0.96 在安全存储设计闸门之后新增 `Local Secure Storage Interface Draft / 本机安全存储接口草案`。本阶段只允许建立本机安全存储的数据模型、方法草案、后端候选、审计事件草案和脱敏接口草案；所有接口都只能返回 draft / blocked / disabled 状态。当前版本不得输入、保存、读取、删除、轮换或测试真实 API key，不得连接 Keychain，不得连接 Electron safeStorage，不得写入加密本地存储，不得读取 `.env`，不得连接 endpoint，不得联网，不得返回价格，不得返回 bookingUrl，不得付款，不得下单，不得保存身份证、护照或银行卡。

实现模块：`commerceLocalSecureStorageInterfaceDraft.js`。

本机安全存储接口草案必须包含：

- 数据模型草案：`keyAliasId`、`providerId`、`providerName`、`permissionType`、`maskedPreview`、`secretRef`、`encryptedPayloadRef`、`backendType`、`keyVersion`、`bindingId`、`endpointAllowlistStatus`、`sandboxStatus`。
- 方法草案：`prepareKeyAliasDraft`、`prepareSecretWriteDraft`、`prepareSecretReadDraft`、`prepareSecretDeleteDraft`、`prepareSecretRotateDraft`、`prepareConnectionTestDraft`、`prepareProviderSandboxDraft`、`prepareRealPriceReadDraft`、`prepareBookingUrlDraft`。除 alias 草案展示外，所有真实能力都必须 blocked。
- 存储后端候选：`macOS Keychain`、`Electron safeStorage`、`encrypted local config`、`enterprise managed secret`。全部为 candidate_only，connected / canRead / canWrite / canDelete / canRotate 均为 false。
- 审计草案：只允许记录 alias 和 blocked 事件，不得记录 key 明文、secret 明文、access token 或 auth header。
- 脱敏草案：必须提供 `redactSecretLikeValue`、`redactObject`、`redactHeaders`、`redactUrl`，并使用 `[REDACTED_API_KEY]`、`[REDACTED_API_SECRET]`、`[REDACTED_ACCESS_TOKEN]`、`[REDACTED_AUTH_HEADER]`、`[REDACTED_CREDENTIAL_PARAMS]` 等占位。

UI 中 `查看本机安全存储接口草案` 默认折叠。展开后必须显示：接口草案已建立、真实实现未启用、真实 API key 输入未开放、真实 API key 保存未开放、真实 API key 读取未开放、删除 / 轮换未开放、测试连接未开放、provider 沙箱未开放、真实价格未开放、bookingUrl 未开放，以及下一步为密钥脱敏与日志防泄露规则。

UI 精确状态短语必须包含：`draft_only`、`接口草案：已建立`、`真实实现：未启用`、`删除 / 轮换：未开放`、`provider 沙箱：未开放`、`真实价格：未开放`、`bookingUrl：未开放`。

安全存储设计闸门必须联动显示：本机安全存储接口草案已建立，真实实现未启用，下一步为密钥脱敏与日志防泄露规则。安全密钥存储方案、API 绑定准备状态、API 绑定说明、API 绑定表单和 API 绑定权限清单必须继续显示真实 key 保存、读取、连接测试、endpoint、network、price、bookingUrl、payment 和 order 能力均未开放。

marker:local secure storage interface draft
marker:local secure storage draft only
marker:local secure storage no real key
marker:local secure storage no key input
marker:local secure storage no key save
marker:local secure storage no key read
marker:local secure storage no keychain
marker:local secure storage no safestorage
marker:local secure storage no encrypted local store
marker:local secure storage no endpoint
marker:local secure storage no network
marker:local secure storage no price
marker:local secure storage no booking url
marker:local secure storage audit draft
marker:local secure storage redaction draft
marker:local secure storage backend candidates


## v2.0.96：Fix Local Secure Storage Draft UI Checklist / 修复本机安全存储接口草案 UI 清单

本版本只补齐本机安全存储接口草案的 UI 清单，不新增真实能力。

- 数据模型必须逐项显示：keyAliasId、providerId、providerName、permissionType、region、currency、status、displayName、maskedPreview、secretRef、encryptedPayloadRef、backendType、keyVersion、rotationVersion。
- 接口草案必须逐项显示：prepareKeyAliasDraft：只生成 alias 草案，不接收真实 key；prepareSecretWriteDraft：阻断；prepareSecretReadDraft：阻断；prepareSecretDeleteDraft：阻断；prepareSecretRotateDraft：阻断；prepareConnectionTestDraft：阻断；prepareProviderSandboxDraft：阻断；prepareRealPriceReadDraft：阻断。
- 候选存储后端必须逐项显示：macOS Keychain：候选，未连接；Electron safeStorage + encrypted file：候选，未实现；encrypted local config：候选，未实现；enterprise managed secret：候选，未实现。
- 审计事件草案必须显示大写事件名：KEY_ALIAS_CREATED_DRAFT、KEY_WRITE_BLOCKED、KEY_READ_BLOCKED、KEY_DELETE_BLOCKED、KEY_ROTATE_BLOCKED、CONNECTION_TEST_BLOCKED、PROVIDER_SANDBOX_BLOCKED、REAL_PRICE_BLOCKED、BOOKING_URL_BLOCKED。
- 脱敏接口草案必须显示 credential query params → [REDACTED_CREDENTIAL_PARAMS]。
- API 绑定准备状态必须显示：安全密钥存储方案：方案已建立，尚未实现。

marker:local secure storage interface draft checklist complete
marker:local secure storage data model region currency displayName rotationVersion
marker:local secure storage prepare real price read draft blocked
marker:local secure storage audit uppercase events
marker:local secure storage credential params redaction
marker:api binding readiness secure key storage plan established not implemented


## v2.0.98：Key Redaction & Log Leak Prevention Rules / 密钥脱敏与日志防泄露规则

v2.0.98 新增密钥脱敏与日志防泄露规则。本阶段只建立敏感字段识别、脱敏映射、安全审计日志规则、UI / 截图 / 崩溃报告防泄露规则，以及 dummy 脱敏自检。当前版本仍不得输入、保存、读取或测试真实 API key，不得连接 endpoint，不得联网，不得返回价格，不得返回 bookingUrl，不得付款或下单。

UI 中 `查看密钥脱敏与日志防泄露规则` 默认折叠。展开后必须显示：
- 密钥脱敏规则：已建立
- 日志防泄露规则：已建立
- 真实 API key 输入：未开放
- 真实 API key 保存：未开放
- 真实 API key 读取：未开放
- 敏感字段识别规则
- 脱敏映射
- 安全审计日志规则
- UI / 截图 / 崩溃报告规则
- Dummy 脱敏自检 PASS
- key 删除 / 轮换 / 过期机制草案：已建立
- 下一步：provider endpoint allowlist 闸门

敏感字段识别规则必须覆盖 apiKey、apiSecret、clientSecret、accessToken、refreshToken、authorization、bearer token、password、privateKey、credential query params。

脱敏映射必须至少包含：
- apiKey → [REDACTED_API_KEY]
- apiSecret → [REDACTED_API_SECRET]
- clientSecret → [REDACTED_CLIENT_SECRET]
- accessToken → [REDACTED_ACCESS_TOKEN]
- refreshToken → [REDACTED_REFRESH_TOKEN]
- authorization header → [REDACTED_AUTH_HEADER]
- bearer token → [REDACTED_BEARER_TOKEN]
- password → [REDACTED_PASSWORD]
- privateKey → [REDACTED_PRIVATE_KEY]
- credential query params → [REDACTED_CREDENTIAL_PARAMS]
- unknown secret-like value → [REDACTED_SECRET]

安全审计日志只能记录 alias、providerId、blocked reason、timestamp、event type 等非密钥字段；不得记录 key 明文、secret 明文、token 明文、authorization header、endpoint credential query params。UI、截图和 crash report 不得展示真实 key 或 dummy raw secret。

本阶段必须联动显示：本机安全存储接口草案已建立密钥脱敏与日志防泄露规则，安全存储设计闸门显示密钥脱敏与日志防泄露规则已建立，安全密钥存储方案显示密钥脱敏与日志防泄露规则已建立，API 绑定准备状态 / 说明 / 表单 / 权限清单显示 key 删除 / 轮换 / 过期机制草案已建立，下一步为 provider endpoint allowlist 闸门。

marker:key redaction and log leak prevention rules
marker:key redaction rules established
marker:log leak prevention rules established
marker:key redaction no real key
marker:key redaction no key input
marker:key redaction no key save
marker:key redaction no key read
marker:key redaction no endpoint
marker:key redaction no network
marker:key redaction no price
marker:key redaction no booking url
marker:key redaction secret field patterns
marker:key redaction redaction map
marker:key redaction audit log rules
marker:key redaction dummy raw absent
marker:key redaction credential params
marker:key redaction next key delete rotate expiry draft


## v2.0.98：Key Delete / Rotate / Expiry Draft / key 删除、轮换、过期机制草案

v2.0.98 新增 `commerceKeyLifecycleDraft.js`，只建立 key 删除、轮换、过期、吊销、恢复的生命周期草案、状态机草案、阻断迁移、删除机制草案、轮换机制草案、过期机制草案和生命周期审计事件草案。当前版本仍不得输入、保存、读取、删除、轮换、设置过期、吊销、恢复或测试真实 API key，不得连接 Keychain，不得连接 Electron safeStorage，不得连接 endpoint，不得联网，不得返回价格，不得返回 bookingUrl，不得付款或下单。

UI 中 `查看 key 删除 / 轮换 / 过期机制草案` 默认折叠。展开后必须显示：

- key 删除 / 轮换 / 过期机制草案
- 生命周期草案：已建立
- 真实删除：未开放
- 真实轮换：未开放
- 真实过期：未开放
- 真实吊销：未开放
- 真实恢复：未开放
- key 状态机草案
- 当前允许状态：draft_alias_only
- 阻断迁移
- 删除机制草案
- 轮换机制草案
- 过期机制草案
- 生命周期审计事件草案
- 所有事件必须 redacted: true
- 下一步：provider endpoint allowlist 闸门

Key lifecycle draft 必须包含状态机草案：`draft_alias_only`、`pending_secure_storage`、`active_readonly`、`expired`、`rotation_required`、`rotation_pending`、`rotated`、`deletion_requested`、`deleted`、`revoked`、`disabled`、`blocked`。当前唯一允许状态为 `draft_alias_only`，所有进入 active / rotated / deleted / revoked 的迁移必须保持 blocked。

删除机制草案必须显示 `prepareKeyDeleteDraft`、`confirmKeyDeleteDraft`、`finalizeKeyDeleteDraft`，全部 blocked。轮换机制草案必须显示 `prepareKeyRotateDraft`、`validateRotationCandidateDraft`、`confirmKeyRotateDraft`、`finalizeKeyRotateDraft`，全部 blocked。过期机制草案必须显示 `prepareKeyExpiryDraft`、`evaluateKeyExpiryDraft`、`markKeyExpiredDraft`，不得启用真实过期或真实 provider binding disable。

生命周期审计事件草案只允许记录 aliasId、providerId、action、blockedReason、timestamp 等脱敏字段。所有事件必须 `redacted: true`，不得记录旧 key、新 key、secret、token、authorization header 或 credential query params。

本阶段必须联动显示：密钥脱敏与日志防泄露规则已建立；本机安全存储接口草案已建立；安全存储设计闸门仍关闭；安全密钥存储方案仍未实现真实保存；API 绑定准备状态仍未准备；API 绑定说明 / 表单 / 权限清单仍为只读预览或禁用预览。下一步统一为 provider endpoint allowlist 闸门。

marker:key lifecycle draft
marker:key delete rotate expiry draft
marker:key lifecycle draft only
marker:key lifecycle no real key
marker:key lifecycle no key delete
marker:key lifecycle no key rotate
marker:key lifecycle no key expiry
marker:key lifecycle no key input
marker:key lifecycle no key save
marker:key lifecycle no key read
marker:key lifecycle no endpoint
marker:key lifecycle no network
marker:key lifecycle no price
marker:key lifecycle no booking url
marker:key lifecycle state machine
marker:key lifecycle audit events
marker:key lifecycle next provider endpoint allowlist gate
