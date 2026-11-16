# OI·竞迹

一个基于公开 OI 竞赛记录的只读查询与分析前端，提供选手档案、赛事结果、学校 / 地区分析和参赛历程时间线。

> 本项目不是官方 OIerDb 服务，也不代表 CCF 或任何赛事主办方。

## 数据来源

前端通过 `assets/data.js` 读取 OIerDb-ng 发布的版本化生成数据：

- 数据清单：`https://oier.api.baoshuo.dev/static.info.json`
- 选手结果清单：`https://oier.api.baoshuo.dev/result.info.json`
- 再按清单中的 SHA-512 版本号读取对应的 `static.<hash>.json` 和 `result.<hash>.txt`
- 主接口不可用时尝试上游 CDN

这是 OIerDb-ng 仓库生成后的数据产物，不是直接下载 `data/raw.txt` 再自行重跑其生成器。页面显示数据版本和读取时间；首次加载要下载并解析完整结果文件，数据量约数十万条记录。浏览器只渲染首屏有限数量的结果，避免一次创建大量 DOM。

省份 / 学校索引的拼音文件 `assets/school-pinyin.json` 从上游静态学校表生成；当上游新增学校时，应重新生成此索引。

## 本地预览

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

访问 `http://localhost:8000/`。需要浏览器能够访问 OIerDb-ng 数据接口；在无法访问上游接口时，数据页会显示载入错误。

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`。推送 `main` / `master` 后会自动部署；在仓库 **Settings → Pages** 中将 Source 设为 **GitHub Actions**。

## 数据口径与隐私

- 选手 ID、人员归并、成绩、学校和奖项遵循 OIerDb-ng 的生成数据口径。
- 上游数据没有提供逐条官方核验标记时，本工具只标记“来自 OIerDb”，不宣称已独立核对官方公告。
- 赛事名次和奖项不由本前端自行推算；统计反映数据集收录情况，不等同于完整参赛人数。
- 如发现数据问题，请向上游项目反馈；本项目目前为只读工具，不提供在线编辑。

## 许可与致谢

本项目依 AGPL-3.0 发布。选手和赛事数据来自 [OIerDb-ng/OIerDb](https://github.com/OIerDb-ng/OIerDb)，请一并遵守上游项目的许可、署名及相关数据来源条款。OIerDb-ng/OIerDb 与本项目相互独立；本项目不使用其名称、徽标作为产品品牌。
