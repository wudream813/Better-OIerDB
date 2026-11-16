# OI·竞迹

一个基于公开 OI 竞赛记录的只读查询与分析前端，提供选手档案、赛事结果、学校 / 地区分析和参赛历程时间线。

> 本项目不是官方 OIerDb 服务，也不代表 CCF 或任何赛事主办方。

## 数据来源

前端通过 `assets/data.js` 读取 OIerDb-ng 发布的版本化生成数据：

- 数据清单：`https://oier.api.baoshuo.dev/static.info.json` 与 `result.info.json`
- 再按清单中的 SHA-512 版本号读取对应的静态表和压缩结果文件
- 主接口不可用时尝试上游 CDN

这是 OIerDb-ng 仓库生成后的数据产物，而不是直接下载原始 `data/raw.txt` 并自行重跑上游生成器。首次进入主站需下载并解析数据文件；选手列表与赛事结果采用分批渲染。

省份 / 学校拼音索引位于 `assets/school-pinyin.json`。上游新增学校时应更新此索引。

## 本地预览

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

访问 `http://localhost:8000/`。浏览器需能访问 OIerDb-ng 数据接口。

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`。推送 `main` / `master` 后自动部署；首次部署前需在仓库 **Settings → Pages** 中将 Source 设为 **GitHub Actions**。

## 可嵌入选手卡片

在选手档案页点击「嵌入卡片」，可预览并复制 iframe 代码。复制时自动附上时间戳和当时的数据版本；卡片 URL 携带姓名、学校、省份、年级、代表奖项等少量公开摘要，独立 `card.html` 直接用这些参数绘制卡片，**不会下载整份选手数据库**。卡片打开时只请求 OIerDb-ng 的轻量版本清单；若数据版本在复制后更新，会提示卡片过期，重新复制即可刷新。

卡片支持标准 / 迷你样式、浅色 / 深色主题、点击跳转档案和可选的自适应高度脚本。转载时请保留 OIerDb-ng 数据来源说明。

## 数据口径与隐私

- 选手 ID、人员归并、成绩、学校和奖项遵循 OIerDb-ng 的生成数据口径。
- 上游没有提供逐条官方核验状态时，本工具不会宣称已独立核对官方公告。
- 统计反映数据集收录情况，不等同于完整参赛人数或官方结论。
- 如发现数据问题，请向上游项目反馈；本项目为只读工具，不提供在线编辑。

## 许可与致谢

本项目依 AGPL-3.0 发布。选手和赛事数据来自 [OIerDb-ng/OIerDb](https://github.com/OIerDb-ng/OIerDb)，请遵守上游项目的许可、署名及数据来源条款。OIerDb-ng/OIerDb 与本项目相互独立；本项目不使用其名称、徽标作为产品品牌。
