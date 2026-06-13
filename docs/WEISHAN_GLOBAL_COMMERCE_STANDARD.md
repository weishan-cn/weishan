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

后续版本必须继续保持全球多源、只读搜索、安全门控、外部跳转的方向，不能退化为单一平台工具。

## 14. Codex 开发规则

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
