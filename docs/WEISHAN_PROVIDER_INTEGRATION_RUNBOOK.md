# weishan Provider Integration Manual Approval Runbook V1

## 1. 目的

本手册用于真实 provider 接入前的人工审批与运行手册确认。v2.0.48 只建立审批流程和阻断状态，不代表真实 provider 已接入，不代表真实 provider 已批准。

## 2. 适用范围

适用于商品电商平台、品牌官网、酒店 OTA、酒店官网、机票 OTA、航司官网、票务平台、本地服务预约平台和区域性 provider 的未来接入准备。

## 3. 禁止事项

在未完成全部审批前，不得连接真实 endpoint，不得使用真实 API key，不得发起网络请求，不得返回真实商品结果，不得显示真实价格，不得返回 fake/demo/mock price，不得跳转购买或预订页面，不得自动付款，不得自动下单，不得提交订单，不得保存身份证、护照或银行卡。

## 4. 接入前必须完成的 Gate

真实 provider 接入前必须完成 Global Commerce Standard、Local Law Compliance Gate、Provider Onboarding Checklist、Provider Approval Workflow、Read-only Connector Stub、Provider Stub Profile、Provider Secret Storage Plan、Provider Sandbox Dry Run、Connector Gate、Provider Integration Readiness Summary 和最终人工批准。

## 5. 人工审批阶段

人工审批阶段包括范围审查、Provider 条款审查、当地法律审查、隐私审查、API 文档审查、Endpoint 审查、API key 存储审查、请求 / 响应结构审查、频率限制审查、价格 / 税费 / 运费字段审查、跳转策略审查、不付款确认、不提交订单确认、不保存证件 / 银行卡确认、回滚方案审查和最终人工批准。

## 6. API key 安全存储审查

API key 安全存储审查必须确认密钥不会进入 repo、UI、日志、localStorage、sessionStorage、query string 或 error message。未通过前不得输入、保存、读取或用于网络请求。

## 7. Endpoint 审查

Endpoint 审查必须确认 provider endpoint 的用途、权限、地域、频率限制、错误处理和回滚方式。未通过前不得配置或连接真实 endpoint。

## 8. 请求 / 响应结构审查

请求 / 响应结构审查必须确认未来 connector 的字段映射、分页、错误处理、超时处理和降级策略。该审查只能用于设计，不得发起真实网络请求。

## 9. 价格 / 税费 / 运费字段审查

价格字段必须区分商品价、运费、税费、关税、平台费、支付手续费和其他必选费用。费用未知时必须标注待确认，费用估算时必须标注预估，不能把裸价伪装成 totalLandedCost。

## 10. 跳转 URL 策略审查

跳转 URL 必须来自真实 provider 的 http / https 页面，并通过安全策略审查。未通过前不得跳转购买、预订或付款页面。

## 11. 当地法律合规审查

必须确认当前位置、收货地址、目的地或服务发生地的合规风险。当前位置与收货地 / 目的地冲突时，按更严格的一方处理。不确定是否合法时必须阻断价格和跳转。

## 12. 隐私与数据保留审查

不得保存原始 GPS 坐标，不得上传定位到第三方，不得用于广告、追踪或画像。不得保存银行卡、身份证或护照。

## 13. 不付款 / 不下单 / 不保存证件银行卡确认

weishan 不代付款、不自动下单、不提交订单、不创建内部付款页、不托管资金、不保存身份证、不保存护照、不保存银行卡。

## 14. Sandbox Dry Run 要求

Sandbox Dry Run 只能用于检查未来 connector 的请求 / 响应结构。即使 dry run 通过，也不得自动放开 API key、endpoint、network、price、redirect、checkout、payment 或 order。

## 15. Connector Gate 要求

Connector Gate 是真实 provider 接入前的最终闸门。任意前置 gate 未完成时，Connector Gate 必须保持 blocked；即使未来全部通过，也不能在同一版本自动放开真实连接。

## 16. 发布前最终人工批准

最终人工批准必须单独记录，并确认不违反全球采购标准、当地法律合规、密钥安全、Endpoint 审查、价格字段审查、隐私审查和交易边界。

## 17. 暂停与回滚规则

发现合规风险、价格字段风险、隐私风险、secret 泄露风险、endpoint 风险、订单风险或付款风险时，必须立即暂停并回滚到安全阻断状态。

## 18. 审计记录建议

建议记录审查日期、审查人、provider 范围、风险结论、回滚方案、最终批准状态和版本链路。审计记录不得包含真实 API key、token、password、secret 或原始 GPS 坐标。

## 19. v2.0.48 当前状态

v2.0.48 当前状态为 manual_approval_required。当前不会批准真实 provider，不会访问 eBay 或任何真实 provider，不会读取 API key，不会连接 endpoint，不会发起网络请求，不会返回商品、价格或跳转链接。真正接入真实 provider 必须另起版本，经过单独 review、本地 commit、tag 前检查、annotated tag、push、release:postcheck 和实机 UI 验收。
