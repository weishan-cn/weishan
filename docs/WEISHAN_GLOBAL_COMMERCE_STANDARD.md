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

## 13. 当前版本链条

- v2.0.25：真实价格只读展示 + 最低价精确跳转
- v2.0.26：商品 provider 选择 readiness gate
- v2.0.27：最低到手价明细
- v2.0.28：定位权限与最低到手价门控
- v2.0.29：收货目的地 gate + UI 版本显示修复
- v2.0.30：全球商品 provider 候选评估

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
