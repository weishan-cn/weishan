# weishan v2.0 模块边界

- 首页只做总调度，不直接改其它页面 DOM。
- 每个功能模块独立目录、独立 API、独立页面。
- AI Key 必须登录后配置，并按账号隔离保存。
- 默认本地优先，不上传客户数据。
- 付费企业功能先锁定展示，后续接真实支付、席位、审计和报告。
- 真实管理员密码、对象存储密钥、企业 token 不写入客户端源码。

## 模块目录

- core：配置、权限、路由、融合 AI API、本地状态
- components：侧边栏、顶部栏
- modules：account、subscription、history、memory、projects、command、mail、crawler、software、storage、team、reports、audit、security、backup
- routes：每个页面单独文件
