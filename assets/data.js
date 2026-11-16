/* ============================================================
 * OI·竞迹 — 演示数据集（data.js）
 * ------------------------------------------------------------
 * 组织方式参考 OIerDb-ng/OIerDb：
 *   data/     原始输入（本文件中的 PEOPLE_RAW / CONTESTS 相当于 raw.txt + contests.json）
 *   generator 清洗与生成（本文件底部的"展开器"相当于 python generator 的角色）
 *   frontend  消费生成后的结构化数据（app.js 读取 window.OIER_DATA）
 *
 * 重要：所有选手与成绩均为虚构示例数据，仅用于产品演示。
 * ============================================================ */
(function (g) {
  'use strict';

  /* ---------- 数据来源（对应 Source 表） ---------- */
  var SOURCES = [
    {
      id: 'ccf', name: 'CCF NOI 官网 · 获奖名单公告', type: '官方名单',
      url: 'https://www.noi.cn/', accessed: '2026-11-08',
      note: '正式实现中，这里应是逐条记录对应的官方公告链接与抓取时间；演示环境未抓取真实名单。'
    },
    {
      id: 'oierdb', name: 'OIerDb（OIerDb-ng/OIerDb）', type: '开源社区数据库',
      url: 'https://github.com/OIerDb-ng/OIerDb', accessed: '2026-11-12',
      note: '参考其 data/ + generator/ 的数据组织、清洗与生成流程；本演示数据为自制虚构样例，未复制其数据内容。其代码与数据为 AGPL-3.0。'
    },
    {
      id: 'community', name: '社区反馈与纠错（示例通道）', type: '用户提交',
      url: '', accessed: '2026-11-14',
      note: '演示「待核验 / 低置信匹配」记录的处理状态；正式实现中对应 Issue、表单提交与人工复核队列。'
    }
  ];

  /* ---------- 赛事（对应 contests.json） ---------- */
  var CONTESTS = [
    { id: 'noi-2023',   name: 'NOI 2023',    full: '第 40 届全国青少年信息学奥林匹克竞赛', type: 'NOI',   year: 2023, month: 7,  maxScore: 600, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'noi-2024',   name: 'NOI 2024',    full: '第 41 届全国青少年信息学奥林匹克竞赛', type: 'NOI',   year: 2024, month: 7,  maxScore: 600, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'noi-2025',   name: 'NOI 2025',    full: '第 42 届全国青少年信息学奥林匹克竞赛', type: 'NOI',   year: 2025, month: 7,  maxScore: 600, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'noip-2022',  name: 'NOIP 2022',   full: 'NOIP 2022（提高组）',                 type: 'NOIP',  year: 2022, month: 11, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'noip-2023',  name: 'NOIP 2023',   full: 'NOIP 2023（提高组）',                 type: 'NOIP',  year: 2023, month: 11, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'noip-2024',  name: 'NOIP 2024',   full: 'NOIP 2024（提高组）',                 type: 'NOIP',  year: 2024, month: 11, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'csp-s-2022', name: 'CSP-S 2022',  full: 'CCF CSP-S 2022 第二轮（提高组）',     type: 'CSP-S', year: 2022, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'csp-s-2023', name: 'CSP-S 2023',  full: 'CCF CSP-S 2023 第二轮（提高组）',     type: 'CSP-S', year: 2023, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'csp-s-2024', name: 'CSP-S 2024',  full: 'CCF CSP-S 2024 第二轮（提高组）',     type: 'CSP-S', year: 2024, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'csp-s-2025', name: 'CSP-S 2025',  full: 'CCF CSP-S 2025 第二轮（提高组）',     type: 'CSP-S', year: 2025, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-10' },
    { id: 'csp-j-2022', name: 'CSP-J 2022',  full: 'CCF CSP-J 2022 第二轮（入门组）',     type: 'CSP-J', year: 2022, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'csp-j-2023', name: 'CSP-J 2023',  full: 'CCF CSP-J 2023 第二轮（入门组）',     type: 'CSP-J', year: 2023, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'csp-j-2024', name: 'CSP-J 2024',  full: 'CCF CSP-J 2024 第二轮（入门组）',     type: 'CSP-J', year: 2024, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-08' },
    { id: 'csp-j-2025', name: 'CSP-J 2025',  full: 'CCF CSP-J 2025 第二轮（入门组）',     type: 'CSP-J', year: 2025, month: 10, maxScore: 400, sourceId: 'ccf', accessed: '2026-11-10' }
  ];

  /* ---------- 选手原始定义（相当于 raw.txt 的角色） ----------
   * P(id, 姓名, 拼音, 拼音首字母, 省份, 实力系数, 成长系数, 学校经历, 参赛路径, 别名?)
   * 学校经历: { n:校名, st:"初中"|"高中", f:起始年, t:结束年 }
   * 参赛路径: [赛事id, 当时年级, 当时学校, 成绩覆盖(可空), 是否已核验(0=待核验), 备注]
   * 年级口径：以比赛举行时刻所处学年为准（如 7 月的 NOI 记为刚读完的年级）。
   * ---------------------------------------------------------- */
  function P(id, name, py, ini, province, skill, growth, schools, path, aliases) {
    return { id: id, name: name, py: py, ini: ini, province: province, skill: skill, growth: growth, schools: schools, path: path, aliases: aliases || [] };
  }

  var PEOPLE_RAW = [
    /* ---- 浙江 ---- */
    P('p01', '陈子航', 'chenzihang', 'czh', '浙江', 0.82, 0.05,
      [{ n: '杭州市文澜中学', st: '初中', f: 2020, t: 2023 }, { n: '杭州第二中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '杭州市文澜中学'],
       ['csp-s-2023', '高一', '杭州第二中学'],
       ['noip-2023', '高一', '杭州第二中学'],
       ['csp-s-2024', '高二', '杭州第二中学', 380],
       ['noip-2024', '高二', '杭州第二中学', 392],
       ['noi-2025', '高二', '杭州第二中学', 596]]),
    P('p02', '林晚舟', 'linwanzhou', 'lwz', '浙江', 0.72, 0.06,
      [{ n: '杭州市文澜中学', st: '初中', f: 2020, t: 2023 }, { n: '杭州学军中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '杭州市文澜中学'],
       ['csp-s-2023', '高一', '杭州学军中学'],
       ['noip-2023', '高一', '杭州学军中学', 375],
       ['noi-2024', '高一', '杭州学军中学', 559],
       ['csp-s-2024', '高二', '杭州学军中学']],
      ['小舟', 'wanzhou', 'Lin Wanzhou']),
    P('p03', '沈亦凡', 'shenyifan', 'syf', '浙江', 0.66, 0.05,
      [{ n: '杭州第二中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '杭州第二中学'],
       ['noip-2023', '高一', '杭州第二中学'],
       ['csp-s-2024', '高二', '杭州第二中学'],
       ['noi-2025', '高二', '杭州第二中学']]),
    P('p04', '顾明轩', 'gumingxuan', 'gmx', '浙江', 0.60, 0.05,
      [{ n: '浙江省镇海中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '浙江省镇海中学'],
       ['noip-2022', '高一', '浙江省镇海中学'],
       ['csp-s-2023', '高二', '浙江省镇海中学'],
       ['noi-2025', '高三', '浙江省镇海中学']]),
    P('p05', '王雨桐', 'wangyutong', 'wyt', '浙江', 0.55, 0.05,
      [{ n: '杭州学军中学', st: '高中', f: 2024, t: 2027 }],
      [['csp-j-2023', '初三', '杭州学军中学'],
       ['csp-s-2024', '高一', '杭州学军中学'],
       ['csp-s-2025', '高二', '杭州学军中学']]),
    P('p06', '徐子墨', 'xuzimo', 'xzm', '浙江', 0.44, 0.05,
      [{ n: '浙江省温州中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2024', '高一', '浙江省温州中学'],
       ['csp-j-2025', '高二', '浙江省温州中学', null, 0, '低年级组别记录来自社区补充，待核验'],
       ['csp-s-2025', '高二', '浙江省温州中学']]),
    P('p07', '赵启铭', 'zhaoqiming', 'zqm', '浙江', 0.50, 0.04,
      [{ n: '杭州学军中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '杭州学军中学'],
       ['csp-s-2025', '高一', '杭州学军中学']]),
    P('p58', '吴骏熙', 'wujunxi', 'wjx', '浙江', 0.52, 0.05,
      [{ n: '温州市实验中学', st: '初中', f: 2021, t: 2024 }, { n: '浙江省温州中学', st: '高中', f: 2024, t: 2027 }],
      [['csp-j-2023', '初三', '温州市实验中学'],
       ['csp-s-2024', '高一', '浙江省温州中学'],
       ['noip-2024', '高一', '浙江省温州中学'],
       ['csp-s-2025', '高二', '浙江省温州中学']]),

    /* ---- 湖南 ---- */
    P('p08', '陈子航', 'chenzihang', 'czh', '湖南', 0.80, 0.05,
      [{ n: '雅礼实验中学', st: '初中', f: 2020, t: 2023 }, { n: '长沙市雅礼中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '雅礼实验中学'],
       ['csp-s-2022', '初三', '雅礼实验中学'],
       ['noip-2023', '高一', '长沙市雅礼中学', 388],
       ['csp-s-2024', '高二', '长沙市雅礼中学', 388],
       ['noi-2025', '高二', '长沙市雅礼中学', 573]]),
    P('p09', '刘思成', 'liusicheng', 'lsc', '湖南', 0.74, 0.05,
      [{ n: '湖南师范大学附属中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '湖南师范大学附属中学'],
       ['noip-2022', '高一', '湖南师范大学附属中学'],
       ['csp-s-2023', '高二', '湖南师范大学附属中学'],
       ['noi-2024', '高二', '湖南师范大学附属中学', 588]]),
    P('p10', '周雨薇', 'zhouyuwei', 'zyw', '湖南', 0.52, 0.05,
      [{ n: '长沙市第一中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '长沙市第一中学'],
       ['csp-s-2023', '高一', '长沙市第一中学'],
       ['csp-s-2024', '高二', '长沙市第一中学'],
       ['noi-2025', '高二', '长沙市第一中学'],
       ['csp-s-2025', '高三', '长沙市第一中学']]),
    P('p11', '谭睿哲', 'tanruizhe', 'trz', '湖南', 0.78, 0.05,
      [{ n: '长沙市雅礼中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '长沙市雅礼中学'],
       ['noip-2023', '高一', '长沙市雅礼中学'],
       ['csp-s-2024', '高二', '长沙市雅礼中学'],
       ['noip-2024', '高二', '长沙市雅礼中学', 385],
       ['noi-2025', '高二', '长沙市雅礼中学', 581]]),
    P('p12', '何俊霖', 'hejunlin', 'hjl', '湖南', 0.47, 0.05,
      [{ n: '湖南师范大学附属中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '湖南师范大学附属中学'],
       ['csp-s-2025', '高一', '湖南师范大学附属中学']]),
    P('p56', '贺瑾琳', 'hejinlin', 'hjl', '湖南', 0.50, 0.05,
      [{ n: '雅礼实验中学', st: '初中', f: 2021, t: 2024 }, { n: '长沙市雅礼中学', st: '高中', f: 2024, t: 2027 }],
      [['csp-j-2023', '初三', '雅礼实验中学'],
       ['csp-s-2024', '高一', '长沙市雅礼中学'],
       ['csp-s-2025', '高二', '长沙市雅礼中学']]),

    /* ---- 北京 ---- */
    P('p13', '刘宇轩', 'liuyuxuan', 'lyx', '北京', 0.75, 0.05,
      [{ n: '中国人民大学附属中学', st: '初中', f: 2020, t: 2023 }, { n: '中国人民大学附属中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2022', '初三', '中国人民大学附属中学'],
       ['csp-s-2023', '高一', '中国人民大学附属中学'],
       ['noip-2023', '高一', '中国人民大学附属中学'],
       ['csp-s-2024', '高二', '中国人民大学附属中学'],
       ['noi-2025', '高二', '中国人民大学附属中学', 548]]),
    P('p14', '张北辰', 'zhangbeichen', 'zbc', '北京', 0.62, 0.05,
      [{ n: '北京市第四中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '北京市第四中学'],
       ['noip-2022', '高一', '北京市第四中学'],
       ['noi-2023', '高一', '北京市第四中学'],
       ['noip-2023', '高二', '北京市第四中学'],
       ['csp-s-2024', '高三', '北京市第四中学'],
       ['noip-2024', '高三', '北京市第四中学']]),
    P('p15', '孙若曦', 'sunruoxi', 'srx', '北京', 0.57, 0.05,
      [{ n: '北京市十一学校', st: '高中', f: 2024, t: 2027 }],
      [['csp-j-2022', '初二', '北京市十一学校'],
       ['csp-j-2023', '初三', '北京市十一学校'],
       ['csp-s-2024', '高一', '北京市十一学校'],
       ['noip-2024', '高一', '北京市十一学校'],
       ['csp-s-2025', '高二', '北京市十一学校']]),
    P('p16', '马天翊', 'matianyi', 'mty', '北京', 0.49, 0.05,
      [{ n: '北京师范大学附属实验中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '北京师范大学附属实验中学'],
       ['csp-s-2024', '高二', '北京师范大学附属实验中学']]),
    P('p17', '高子涵', 'gaozihan', 'gzh', '北京', 0.42, 0.05,
      [{ n: '中国人民大学附属中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '中国人民大学附属中学'],
       ['csp-j-2025', '高一', '中国人民大学附属中学'],
       ['csp-s-2025', '高一', '中国人民大学附属中学']]),

    /* ---- 上海 ---- */
    P('p18', '许文韬', 'xuwentao', 'xwt', '上海', 0.73, 0.05,
      [{ n: '上海中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '上海中学'],
       ['noip-2022', '高一', '上海中学'],
       ['csp-s-2023', '高二', '上海中学'],
       ['noip-2023', '高二', '上海中学'],
       ['noi-2024', '高二', '上海中学', 552]]),
    P('p19', '杨可依', 'yangkeyi', 'yky', '上海', 0.58, 0.05,
      [{ n: '华东师范大学第二附属中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '华东师范大学第二附属中学'],
       ['noip-2023', '高一', '华东师范大学第二附属中学'],
       ['noi-2024', '高一', '华东师范大学第二附属中学'],
       ['noip-2024', '高二', '华东师范大学第二附属中学'],
       ['csp-s-2025', '高三', '华东师范大学第二附属中学']]),
    P('p20', '宋知远', 'songzhiyuan', 'szy', '上海', 0.50, 0.05,
      [{ n: '上海市市北初级中学', st: '初中', f: 2021, t: 2024 }, { n: '上海交通大学附属中学', st: '高中', f: 2024, t: 2027 }],
      [['csp-j-2023', '初三', '上海市市北初级中学'],
       ['csp-s-2024', '高一', '上海交通大学附属中学'],
       ['csp-s-2025', '高二', '上海交通大学附属中学']]),
    P('p21', '田笑', 'tianxiao', 'tx', '上海', 0.40, 0.05,
      [{ n: '复旦大学附属中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '复旦大学附属中学'],
       ['csp-j-2025', '高一', '复旦大学附属中学']]),

    /* ---- 四川 ---- */
    P('p22', '刘宇轩', 'liuyuxuan', 'lyx', '四川', 0.76, 0.05,
      [{ n: '成都七中育才学校', st: '初中', f: 2020, t: 2023 }, { n: '成都市第七中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '成都七中育才学校'],
       ['csp-s-2023', '高一', '成都市第七中学'],
       ['noip-2023', '高一', '成都市第七中学', 384],
       ['noip-2024', '高二', '成都市第七中学', 379],
       ['noi-2025', '高二', '成都市第七中学', 561]]),
    P('p23', '罗子谦', 'luoziqian', 'lzq', '四川', 0.56, 0.05,
      [{ n: '成都市第七中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '成都市第七中学'],
       ['noip-2022', '高一', '成都市第七中学'],
       ['noi-2023', '高一', '成都市第七中学'],
       ['csp-s-2023', '高二', '成都市第七中学'],
       ['noip-2023', '高二', '成都市第七中学']]),
    P('p24', '李承泽', 'lichengze', 'lcz', '四川', 0.48, 0.05,
      [{ n: '成都市石室中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '成都市石室中学'],
       ['csp-s-2023', '高一', '成都市石室中学'],
       ['csp-s-2024', '高二', '成都市石室中学'],
       ['noip-2024', '高二', '成都市石室中学'],
       ['noi-2025', '高二', '成都市石室中学']]),
    P('p25', '冯静怡', 'fengjingyi', 'fjy', '四川', 0.43, 0.05,
      [{ n: '成都市树德中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '成都市树德中学'],
       ['csp-s-2025', '高一', '成都市树德中学'],
       ['csp-j-2025', '高一', '成都市树德中学']]),

    /* ---- 广东 ---- */
    P('p26', '黄梓豪', 'huangzihao', 'hzh', '广东', 0.71, 0.05,
      [{ n: '中山市纪念中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '中山市纪念中学'],
       ['noip-2022', '高一', '中山市纪念中学'],
       ['csp-s-2023', '高二', '中山市纪念中学'],
       ['noi-2024', '高二', '中山市纪念中学', 575],
       ['noip-2024', '高三', '中山市纪念中学']]),
    P('p27', '吴玥', 'wuyue', 'wy', '广东', 0.54, 0.05,
      [{ n: '深圳中学', st: '高中', f: 2024, t: 2027 }],
      [['csp-j-2022', '初二', '深圳中学'],
       ['csp-j-2023', '初三', '深圳中学'],
       ['csp-s-2024', '高一', '深圳中学'],
       ['noip-2024', '高一', '深圳中学'],
       ['csp-s-2025', '高二', '深圳中学']]),
    P('p28', '郑昊天', 'zhenghaotian', 'zht', '广东', 0.46, 0.05,
      [{ n: '华南师范大学附属中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '华南师范大学附属中学'],
       ['csp-s-2024', '高二', '华南师范大学附属中学']]),
    P('p29', '曾子琳', 'zengzilin', 'zzl', '广东', 0.41, 0.05,
      [{ n: '广州市第二中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '广州市第二中学'],
       ['csp-j-2025', '高一', '广州市第二中学'],
       ['csp-s-2025', '高一', '广州市第二中学']]),
    P('p57', '郑皓宇', 'zhenghaoyu', 'zhy', '广东', 0.38, 0.05,
      [{ n: '广州市第二中学', st: '初中', f: 2021, t: 2024 }, { n: '广州市第二中学', st: '高中', f: 2024, t: 2027 }],
      [['csp-j-2023', '初三', '广州市第二中学'],
       ['csp-s-2024', '高一', '广州市第二中学'],
       ['csp-j-2025', '高二', '广州市第二中学']]),

    /* ---- 江苏 ---- */
    P('p30', '潘俊熙', 'panjunxi', 'pjx', '江苏', 0.77, 0.05,
      [{ n: '南京外国语学校', st: '高中', f: 2021, t: 2024 }],
      [['csp-s-2022', '高二', '南京外国语学校'],
       ['noip-2022', '高二', '南京外国语学校', 383],
       ['noi-2023', '高二', '南京外国语学校', 579]]),
    P('p31', '曹书宁', 'caoshuning', 'csn', '江苏', 0.53, 0.05,
      [{ n: '江苏省苏州中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '江苏省苏州中学'],
       ['csp-s-2023', '高一', '江苏省苏州中学'],
       ['noip-2023', '高一', '江苏省苏州中学'],
       ['csp-s-2024', '高二', '江苏省苏州中学'],
       ['noip-2024', '高二', '江苏省苏州中学'],
       ['noi-2025', '高二', '江苏省苏州中学'],
       ['csp-s-2025', '高三', '江苏省苏州中学']]),
    P('p32', '袁天翊', 'yuantianyi', 'yty', '江苏', 0.45, 0.05,
      [{ n: '南京外国语学校', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '南京外国语学校'],
       ['csp-s-2025', '高一', '南京外国语学校']]),
    P('p33', '邵雨欣', 'shaoyuxin', 'syx', '江苏', 0.38, 0.05,
      [{ n: '江苏省无锡市第一中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2023', '初二', '江苏省无锡市第一中学', null, 0, '来源截图缺失，待补充官方名单链接'],
       ['csp-j-2024', '初三', '江苏省无锡市第一中学'],
       ['csp-j-2025', '高一', '江苏省无锡市第一中学']]),

    /* ---- 山东 ---- */
    P('p34', '韩明哲', 'hanmingzhe', 'hmz', '山东', 0.70, 0.05,
      [{ n: '济南市历城第二中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-j-2022', '高一', '济南市历城第二中学'],
       ['noip-2022', '高一', '济南市历城第二中学', 376],
       ['noip-2023', '高二', '济南市历城第二中学'],
       ['noi-2024', '高二', '济南市历城第二中学', 566]]),
    P('p35', '崔浩然', 'cuihaoran', 'chr', '山东', 0.51, 0.05,
      [{ n: '山东省青岛第二中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '山东省青岛第二中学'],
       ['csp-s-2023', '高一', '山东省青岛第二中学'],
       ['csp-s-2024', '高二', '山东省青岛第二中学'],
       ['noip-2024', '高二', '山东省青岛第二中学'],
       ['noi-2025', '高二', '山东省青岛第二中学']]),
    P('p36', '于子涵', 'yuzihan', 'yzh', '山东', 0.43, 0.05,
      [{ n: '山东省实验中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '山东省实验中学'],
       ['csp-s-2025', '高一', '山东省实验中学']]),

    /* ---- 湖北 ---- */
    P('p37', '杜承轩', 'duchengxuan', 'dcx', '湖北', 0.69, 0.05,
      [{ n: '华中师范大学第一附属中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '华中师范大学第一附属中学'],
       ['noip-2022', '高一', '华中师范大学第一附属中学'],
       ['noi-2023', '高一', '华中师范大学第一附属中学', 570],
       ['csp-s-2023', '高二', '华中师范大学第一附属中学'],
       ['noip-2023', '高二', '华中师范大学第一附属中学'],
       ['noip-2024', '高三', '华中师范大学第一附属中学']]),
    P('p38', '夏子墨', 'xiazimo', 'xzm', '湖北', 0.47, 0.05,
      [{ n: '武汉市第二中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '武汉市第二中学'],
       ['noi-2024', '高一', '武汉市第二中学'],
       ['csp-s-2024', '高二', '武汉市第二中学']]),
    P('p39', '钟雨桐', 'zhongyutong', 'zyt', '湖北', 0.42, 0.05,
      [{ n: '华中师范大学第一附属中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '华中师范大学第一附属中学'],
       ['csp-j-2025', '高一', '华中师范大学第一附属中学'],
       ['csp-s-2025', '高一', '华中师范大学第一附属中学']]),

    /* ---- 河北 ---- */
    P('p40', '石皓宇', 'shihaoyu', 'shy', '河北', 0.59, 0.05,
      [{ n: '河北衡水中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '河北衡水中学'],
       ['noip-2022', '高一', '河北衡水中学'],
       ['noi-2023', '高一', '河北衡水中学'],
       ['csp-s-2023', '高二', '河北衡水中学'],
       ['noip-2023', '高二', '河北衡水中学'],
       ['noi-2024', '高二', '河北衡水中学']]),
    P('p41', '白若彤', 'bairuotong', 'brt', '河北', 0.44, 0.05,
      [{ n: '石家庄市第二中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '石家庄市第二中学'],
       ['csp-s-2024', '高二', '石家庄市第二中学', null, 0, '成绩与官方公告存在出入，已标记人工复核'],
       ['csp-s-2025', '高三', '石家庄市第二中学']]),

    /* ---- 陕西 ---- */
    P('p42', '程子诺', 'chengzinuo', 'czn', '陕西', 0.68, 0.05,
      [{ n: '西北工业大学附属中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '西北工业大学附属中学'],
       ['noip-2022', '高一', '西北工业大学附属中学'],
       ['noi-2023', '高一', '西北工业大学附属中学', 561],
       ['csp-s-2023', '高二', '西北工业大学附属中学'],
       ['noip-2023', '高二', '西北工业大学附属中学']]),
    P('p43', '霍俊言', 'huojunyan', 'hjy', '陕西', 0.46, 0.05,
      [{ n: '西安高新第一中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-j-2022', '初三', '西安高新第一中学'],
       ['csp-s-2023', '高一', '西安高新第一中学'],
       ['csp-s-2024', '高二', '西安高新第一中学'],
       ['noi-2025', '高二', '西安高新第一中学'],
       ['csp-s-2025', '高三', '西安高新第一中学']]),

    /* ---- 福建 ---- */
    P('p44', '邱泽楷', 'qiuzekai', 'qzk', '福建', 0.55, 0.05,
      [{ n: '福州第三中学', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '福州第三中学'],
       ['noip-2022', '高一', '福州第三中学'],
       ['noi-2023', '高一', '福州第三中学'],
       ['csp-s-2023', '高二', '福州第三中学'],
       ['noip-2023', '高二', '福州第三中学'],
       ['noi-2024', '高二', '福州第三中学'],
       ['noip-2024', '高三', '福州第三中学']]),
    P('p45', '廖雨萱', 'liaoyuxuan', 'lyx', '福建', 0.41, 0.05,
      [{ n: '福建省厦门第一中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '福建省厦门第一中学'],
       ['csp-j-2025', '高一', '福建省厦门第一中学']]),

    /* ---- 安徽 ---- */
    P('p46', '范承宇', 'fanchengyu', 'fcy', '安徽', 0.50, 0.05,
      [{ n: '合肥市第一中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '合肥市第一中学'],
       ['noip-2023', '高一', '合肥市第一中学'],
       ['csp-s-2024', '高二', '合肥市第一中学'],
       ['noip-2024', '高二', '合肥市第一中学'],
       ['noi-2025', '高二', '合肥市第一中学']]),
    P('p47', '金子扬', 'jinziyang', 'jzy', '安徽', 0.39, 0.05,
      [{ n: '马鞍山市第二中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '马鞍山市第二中学'],
       ['csp-s-2025', '高一', '马鞍山市第二中学', null, 0, '同名歧义：与另一省选手低置信匹配，待人工确认'],
       ['csp-j-2025', '高一', '马鞍山市第二中学']]),

    /* ---- 重庆 ---- */
    P('p48', '严子豪', 'yanzihao', 'yzh', '重庆', 0.58, 0.05,
      [{ n: '重庆市巴蜀中学校', st: '高中', f: 2022, t: 2025 }],
      [['csp-s-2022', '高一', '重庆市巴蜀中学校'],
       ['noip-2022', '高一', '重庆市巴蜀中学校'],
       ['csp-s-2023', '高二', '重庆市巴蜀中学校'],
       ['noi-2024', '高二', '重庆市巴蜀中学校']]),
    P('p49', '文若涵', 'wenruohan', 'wrh', '重庆', 0.44, 0.05,
      [{ n: '重庆市第八中学校', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '重庆市第八中学校'],
       ['csp-s-2024', '高二', '重庆市第八中学校'],
       ['noi-2025', '高二', '重庆市第八中学校']]),

    /* ---- 天津 ---- */
    P('p50', '毛俊博', 'maojunbo', 'mjb', '天津', 0.52, 0.05,
      [{ n: '天津市第一中学', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '天津市第一中学'],
       ['noip-2023', '高一', '天津市第一中学'],
       ['noip-2024', '高二', '天津市第一中学'],
       ['noi-2025', '高二', '天津市第一中学'],
       ['csp-s-2025', '高三', '天津市第一中学']]),
    P('p51', '施雨晴', 'shiyuqing', 'syq', '天津', 0.40, 0.05,
      [{ n: '天津市南开中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '天津市南开中学'],
       ['csp-j-2025', '高一', '天津市南开中学']]),

    /* ---- 河南 / 辽宁 / 江西 / 广西 ---- */
    P('p52', '段泽宇', 'duanzeyu', 'dzy', '河南', 0.48, 0.05,
      [{ n: '郑州外国语学校', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '郑州外国语学校'],
       ['csp-s-2024', '高二', '郑州外国语学校', null, 0, '由社区反馈新增，尚未对照官方名单核验'],
       ['noip-2024', '高二', '郑州外国语学校']]),
    P('p53', '康子睿', 'kangzirui', 'kzr', '辽宁', 0.45, 0.05,
      [{ n: '东北育才学校', st: '高中', f: 2023, t: 2026 }],
      [['csp-s-2023', '高一', '东北育才学校'],
       ['csp-s-2024', '高二', '东北育才学校'],
       ['noi-2025', '高二', '东北育才学校'],
       ['csp-s-2025', '高三', '东北育才学校']]),
    P('p54', '涂俊豪', 'tujunhao', 'tjh', '江西', 0.42, 0.05,
      [{ n: '江西师范大学附属中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2024', '初三', '江西师范大学附属中学'],
       ['csp-s-2025', '高一', '江西师范大学附属中学']]),
    P('p55', '韦雨彤', 'weiyutong', 'wyt', '广西', 0.37, 0.05,
      [{ n: '南宁市第二中学', st: '高中', f: 2025, t: 2028 }],
      [['csp-j-2025', '高一', '南宁市第二中学'],
       ['csp-s-2025', '高一', '南宁市第二中学']]),

    /* ---- 初中在读选手（用于年级 / 届别维度演示） ---- */
    P('p59', '苏宥宁', 'suyouning', 'syn', '浙江', 0.48, 0.08,
      [{ n: '杭州市文澜中学', st: '初中', f: 2025, t: 2028 }],
      [['csp-j-2025', '初一', '杭州市文澜中学']]),
    P('p60', '何一诺', 'heyinuo', 'hyn', '上海', 0.46, 0.08,
      [{ n: '上海市市北初级中学', st: '初中', f: 2025, t: 2028 }],
      [['csp-j-2025', '初一', '上海市市北初级中学']]),
    P('p61', '唐梓萱', 'tangzixuan', 'tzx', '湖南', 0.52, 0.07,
      [{ n: '雅礼实验中学', st: '初中', f: 2024, t: 2027 }],
      [['csp-j-2024', '初一', '雅礼实验中学'],
       ['csp-j-2025', '初二', '雅礼实验中学']]),
    P('p62', '陆行知', 'luxingzhi', 'lxz', '四川', 0.58, 0.07,
      [{ n: '成都七中育才学校', st: '初中', f: 2024, t: 2027 }],
      [['csp-j-2024', '初一', '成都七中育才学校'],
       ['csp-j-2025', '初二', '成都七中育才学校'],
       ['csp-s-2025', '初二', '成都七中育才学校']]),
    P('p63', '姜予安', 'jiangyuan', 'jya', '广东', 0.50, 0.07,
      [{ n: '深圳中学', st: '初中', f: 2024, t: 2027 }],
      [['csp-j-2025', '初二', '深圳中学']]),
    P('p64', '宋知行', 'songzhixing', 'szx', '北京', 0.62, 0.07,
      [{ n: '中国人民大学附属中学', st: '初中', f: 2023, t: 2026 }],
      [['csp-j-2023', '初一', '中国人民大学附属中学'],
       ['csp-j-2024', '初二', '中国人民大学附属中学'],
       ['csp-s-2024', '初二', '中国人民大学附属中学'],
       ['csp-s-2025', '初三', '中国人民大学附属中学']]),
    P('p65', '林承安', 'linchengan', 'lca', '福建', 0.44, 0.07,
      [{ n: '福州第三中学', st: '初中', f: 2023, t: 2026 }],
      [['csp-j-2024', '初二', '福州第三中学'],
       ['csp-j-2025', '初三', '福州第三中学']])
  ];

  /* ============================================================
   * "生成器"：把原始定义展开为结构化数据（相当于 generator/main.py 的角色）
   *   - 由 实力系数 + 成长 + 确定性抖动 生成演示成绩（可被显式覆盖）
   *   - 按成绩在每个赛事内统一排名，避免手工维护名次不一致
   *   - 按名次比例划定演示奖项（真实奖项以各省划线为准）
   * ============================================================ */
  function jit(a, b) {
    var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  var contestIndex = {};
  CONTESTS.forEach(function (c, i) { contestIndex[c.id] = i; });

  var records = [];
  PEOPLE_RAW.forEach(function (p, pi) {
    p.path.forEach(function (spec, i) {
      var cid = spec[0], grade = spec[1], school = spec[2];
      var override = (spec.length > 3 && spec[3] != null) ? spec[3] : null;
      var verified = (spec.length > 4 && spec[4] === 0) ? false : true;
      var note = spec.length > 5 ? spec[5] : '';
      var ci = contestIndex[cid];
      var c = CONTESTS[ci];
      var cap = (c.type === 'NOI') ? 0.85 : 0.93;
      var base = clamp(0.42 + 0.42 * p.skill + p.growth * i + (jit(pi + 1, ci + 1) - 0.5) * 0.10, 0.30, cap);
      var score = (override != null) ? override : Math.round(base * c.maxScore);
      records.push({
        id: 'r' + (records.length + 1),
        personId: p.id, contestId: cid, year: c.year, contestType: c.type,
        grade: grade, school: school, province: p.province,
        score: score, maxScore: c.maxScore,
        verified: verified, note: note,
        sourceId: c.sourceId, sourceUrl: 'https://www.noi.cn/', accessed: c.accessed
      });
    });
  });

  var AWARD_ORDER = { '金牌': 6, '一等奖': 5, '银牌': 4, '二等奖': 3, '铜牌': 2, '三等奖': 1 };

  CONTESTS.forEach(function (c) {
    var rs = records.filter(function (r) { return r.contestId === c.id; });
    rs.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.personId < b.personId ? -1 : 1;
    });
    var n = rs.length;
    rs.forEach(function (r, i) {
      r.rank = i + 1;
      r.total = n;
      if (c.type === 'NOI') {
        r.award = (i < Math.ceil(n * 0.34)) ? '金牌' : (i < Math.ceil(n * 0.67)) ? '银牌' : '铜牌';
      } else {
        r.award = (i < Math.ceil(n * 0.30)) ? '一等奖' : (i < Math.ceil(n * 0.62)) ? '二等奖' : '三等奖';
      }
    });
    var byProv = {};
    rs.forEach(function (r) { (byProv[r.province] = byProv[r.province] || []).push(r); });
    Object.keys(byProv).forEach(function (prov) {
      byProv[prov].sort(function (a, b) { return a.rank - b.rank; });
      byProv[prov].forEach(function (r, i) { r.provinceRank = i + 1; });
    });
    c.recordCount = n;
  });

  /* ---------- 选手派生信息 ---------- */
  var recordIndex = {};
  var peopleById = {};
  records.forEach(function (r) { (recordIndex[r.personId] = recordIndex[r.personId] || []).push(r); });

  var people = PEOPLE_RAW.map(function (p) {
    var rs = (recordIndex[p.id] || []).slice().sort(function (a, b) { return a.year - b.year; });
    var best = null;
    rs.forEach(function (r) {
      if (!best || AWARD_ORDER[r.award] > AWARD_ORDER[best.award] ||
        (AWARD_ORDER[r.award] === AWARD_ORDER[best.award] && r.rank < best.rank)) best = r;
    });
    var years = rs.map(function (r) { return r.year; });
    var unverified = rs.filter(function (r) { return !r.verified; }).length;
    return {
      id: p.id, name: p.name, py: p.py, ini: p.ini, province: p.province, aliases: p.aliases,
      schools: p.schools,
      currentSchool: p.schools[p.schools.length - 1].n,
      records: rs,
      count: rs.length,
      firstYear: years.length ? Math.min.apply(null, years) : null,
      lastYear: years.length ? Math.max.apply(null, years) : null,
      bestAward: best ? best.award : null,
      bestRank: best ? best.rank : null,
      bestContestId: best ? best.contestId : null,
      unverified: unverified
    };
  });
  people.forEach(function (p) { peopleById[p.id] = p; });

  /* ---------- 拼音字典（覆盖省份与校名用字；多音字按地名/校名习惯读音） ----------
   * 正式实现中应改用完整拼音库（如 pinyin-pro）；演示环境用最小字典保证离线可用。 */
  var PY_DICT = {
    '杭': 'hang', '州': 'zhou', '市': 'shi', '文': 'wen', '澜': 'lan', '中': 'zhong', '学': 'xue', '第': 'di', '二': 'er',
    '浙': 'zhe', '江': 'jiang', '军': 'jun', '省': 'sheng', '镇': 'zhen', '海': 'hai', '温': 'wen', '实': 'shi', '验': 'yan',
    '雅': 'ya', '礼': 'li', '长': 'chang', '沙': 'sha', '湖': 'hu', '南': 'nan', '师': 'shi', '范': 'fan', '大': 'da',
    '附': 'fu', '属': 'shu', '一': 'yi', '国': 'guo', '人': 'ren', '民': 'min', '北': 'bei', '京': 'jing', '四': 'si',
    '十': 'shi', '校': 'xiao', '上': 'shang', '华': 'hua', '东': 'dong', '初': 'chu', '级': 'ji', '交': 'jiao', '通': 'tong',
    '复': 'fu', '旦': 'dan', '成': 'cheng', '都': 'du', '七': 'qi', '育': 'yu', '才': 'cai', '川': 'chuan', '石': 'shi',
    '室': 'shi', '树': 'shu', '德': 'de', '山': 'shan', '纪': 'ji', '念': 'nian', '广': 'guang', '深': 'shen', '圳': 'zhen',
    '外': 'wai', '语': 'yu', '苏': 'su', '无': 'wu', '锡': 'xi', '济': 'ji', '历': 'li', '城': 'cheng', '青': 'qing',
    '岛': 'dao', '武': 'wu', '汉': 'han', '河': 'he', '衡': 'heng', '水': 'shui', '家': 'jia', '庄': 'zhuang', '西': 'xi',
    '工': 'gong', '业': 'ye', '陕': 'shan', '安': 'an', '高': 'gao', '新': 'xin', '福': 'fu', '三': 'san', '建': 'jian',
    '厦': 'xia', '门': 'men', '合': 'he', '肥': 'fei', '徽': 'hui', '马': 'ma', '鞍': 'an', '重': 'chong', '庆': 'qing',
    '巴': 'ba', '蜀': 'shu', '八': 'ba', '天': 'tian', '津': 'jin', '开': 'kai', '郑': 'zheng', '辽': 'liao', '宁': 'ning',
    '五': 'wu', '六': 'liu', '九': 'jiu', '实验': 'shiyan', '实中': 'shizhong'
  };
  function pinyinOf(str) {
    var full = '', ini = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      var py = PY_DICT[ch];
      if (py) { full += py; ini += py.charAt(0); }
      else if (/[a-zA-Z0-9]/.test(ch)) { full += ch.toLowerCase(); ini += ch.toLowerCase(); }
    }
    return { full: full, ini: ini };
  }

  /* 常见简称（手工维护，正式实现中可放进 school.txt 的别名列） */
  var SCHOOL_ALIASES = {
    '杭州第二中学': ['杭二', 'hanger', 'hzez', 'hz2z'],
    '杭州学军中学': ['学军', 'xj'],
    '杭州市文澜中学': ['文澜'],
    '浙江省镇海中学': ['镇海', 'zhenhai', 'zh'],
    '浙江省温州中学': ['温中'],
    '长沙市雅礼中学': ['雅礼', 'yali', 'yl'],
    '长沙市第一中学': ['长沙一中', 'csyz'],
    '湖南师范大学附属中学': ['湖南师大附中', '师大附中', 'hnsdfz'],
    '中国人民大学附属中学': ['人大附中', '人大附', 'rdfz', 'renda', 'rendafuzhong'],
    '北京市十一学校': ['十一', '十一学校', 'syxx'],
    '北京市第四中学': ['北京四中', 'bjsz'],
    '北京师范大学附属实验中学': ['北师大实验', 'bsdsy'],
    '上海中学': ['上中', 'shzx', 'shangzhong'],
    '华东师范大学第二附属中学': ['华二', 'huaer', 'hesfz', 'hdsdefz'],
    '复旦大学附属中学': ['复旦附中', 'fdfz'],
    '上海交通大学附属中学': ['交大附中', 'jdfz'],
    '成都市第七中学': ['成都七中', '七中', 'qizhong', 'cdqz'],
    '成都市石室中学': ['石室', 'ssz'],
    '成都市树德中学': ['树德', 'sdz'],
    '华南师范大学附属中学': ['华附', 'huafu', 'hnsdfz'],
    '深圳中学': ['深中', 'shenzhong', 'szz'],
    '广州市第二中学': ['广州二中', 'gzez'],
    '南京外国语学校': ['南外', 'nanwai', 'nwy', 'njwy'],
    '江苏省苏州中学': ['苏州中学', 'szzx'],
    '山东省实验中学': ['省实验', 'sdsy'],
    '华中师范大学第一附属中学': ['华师一附中', '华师一', 'huashiyi', 'hsyfz'],
    '武汉市第二中学': ['武汉二中', 'whez'],
    '河北衡水中学': ['衡中', 'hengzhong', 'hz'],
    '石家庄市第二中学': ['石家庄二中', 'sjzez'],
    '西北工业大学附属中学': ['西工大附中', 'xgdfz'],
    '西安高新第一中学': ['高新一中', 'gxyz'],
    '福州第三中学': ['福州三中', 'fzsz'],
    '福建省厦门第一中学': ['厦门一中', 'xmyz'],
    '合肥市第一中学': ['合肥一中', 'hfyz'],
    '重庆市巴蜀中学校': ['巴蜀', 'bszx'],
    '重庆市第八中学校': ['重庆八中', 'cqbz'],
    '天津市南开中学': ['南开中学', 'nkzx'],
    '郑州外国语学校': ['郑外', 'zhengwai', 'zzwy'],
    '东北育才学校': ['育才', 'dbyc'],
    '江西师范大学附属中学': ['江西师大附中', 'jxsdfz'],
    '南宁市第二中学': ['南宁二中', 'nnez'],
    '济南市历城第二中学': ['历城二中', 'lcez'],
    '山东省青岛第二中学': ['青岛二中', 'qdez']
  };
  var PROVINCE_ALIASES = {
    '北京': ['bj', '京'], '上海': ['sh', '沪'], '浙江': ['zj', '浙'], '江苏': ['js', '苏'], '湖南': ['hn', '湘'], '湖北': ['hb', '鄂'],
    '广东': ['gd', '粤'], '广西': ['gx', '桂'], '四川': ['sc', '川'], '重庆': ['cq', '渝'], '山东': ['sd', '鲁'], '河北': ['heb', 'hb', '冀'],
    '河南': ['hen', 'hn', '豫'], '陕西': ['sx', '陕', '秦'], '福建': ['fj', '闽'], '安徽': ['ah', '皖'], '天津': ['tj', '津'],
    '辽宁': ['ln', '辽'], '江西': ['jx', '赣']
  };

  function makeNameIndex(name, aliases) {
    var py = pinyinOf(name);
    var keys = [name.toLowerCase(), py.full, py.ini].concat((aliases || []).map(function (a) { return a.toLowerCase(); }));
    return { name: name, py: py.full, ini: py.ini, aliases: aliases || [], keys: keys };
  }

  var provinceIndex = {};
  var schoolIndex = {};
  people.forEach(function (p) {
    if (!provinceIndex[p.province]) {
      provinceIndex[p.province] = makeNameIndex(p.province, PROVINCE_ALIASES[p.province]);
      provinceIndex[p.province].people = 0;
    }
    provinceIndex[p.province].people++;
    p.schools.forEach(function (s) {
      if (!schoolIndex[s.n]) {
        schoolIndex[s.n] = makeNameIndex(s.n, SCHOOL_ALIASES[s.n]);
        schoolIndex[s.n].province = p.province;
        schoolIndex[s.n].people = 0;
        schoolIndex[s.n].records = 0;
      }
      schoolIndex[s.n].people++;
    });
    p.provincePy = provinceIndex[p.province].py;
    p.provinceIni = provinceIndex[p.province].ini;
  });
  records.forEach(function (r) { if (schoolIndex[r.school]) schoolIndex[r.school].records++; });

  /* ---------- 年级 / 届别派生 ----------
   * gradeIndex：初一=7 … 高三=12；cohort = 预计高三毕业年份（按最近一条记录的年级推算，与 OIerDb 的「届」概念一致）
   * currentGrade：以数据集最新赛季（SEASON）为准推算的当前年级；超过高三则记为「已毕业」。 */
  var GRADE_INDEX = { '小四': 4, '小五': 5, '小六': 6, '初一': 7, '初二': 8, '初三': 9, '高一': 10, '高二': 11, '高三': 12 };
  var GRADE_LABEL = {};
  Object.keys(GRADE_INDEX).forEach(function (k) { GRADE_LABEL[GRADE_INDEX[k]] = k; });
  var SEASON = Math.max.apply(null, CONTESTS.map(function (c) { return c.month >= 9 ? c.year : c.year - 1; }));

  function schoolYearOf(r) { var c = CONTESTS[contestIndex[r.contestId]]; return c.month >= 9 ? c.year : c.year - 1; }
  records.forEach(function (r) { r.gradeIndex = GRADE_INDEX[r.grade] || 0; r.schoolYear = schoolYearOf(r); });
  people.forEach(function (p) {
    var last = p.records[p.records.length - 1];
    if (!last) { p.cohort = null; p.currentGradeIndex = null; p.currentGrade = '未知'; return; }
    /* 届别 = 学年起始年 + 1 + (高三 - 当时年级)；例如 2024 学年读高二 → 2026 届 */
    p.cohort = last.schoolYear + 1 + (12 - last.gradeIndex);
    p.cohortConflict = p.records.some(function (r) { return r.schoolYear + 1 + (12 - r.gradeIndex) !== p.cohort; });
    var idx = 12 - (p.cohort - (SEASON + 1));
    p.currentGradeIndex = idx;
    p.currentGrade = idx > 12 ? '已毕业' : (GRADE_LABEL[idx] || ('年级' + idx));
    p.latestGrade = last.grade;
  });

  /* ---------- 同名分组（消歧演示） ---------- */
  var byName = {};
  people.forEach(function (p) { (byName[p.name] = byName[p.name] || []).push(p.id); });
  var dupGroups = {};
  Object.keys(byName).forEach(function (nm) { if (byName[nm].length > 1) dupGroups[nm] = byName[nm]; });

  /* ---------- 汇总统计 ---------- */
  var provinces = {};
  var schools = {};
  people.forEach(function (p) {
    provinces[p.province] = (provinces[p.province] || 0) + 1;
    schools[p.currentSchool] = (schools[p.currentSchool] || 0) + 1;
  });
  var unverifiedTotal = records.filter(function (r) { return !r.verified; }).length;

  var meta = {
    name: 'OI·竞迹',
    tagline: 'OI 公开竞赛记录查询与分析平台（演示）',
    version: 'demo-0.2.0',
    generatedAt: '2026-11-15',
    pipelineNote: '数据结构与生成流程参考 OIerDb-ng/OIerDb：原始记录 → 生成器清洗 → 结构化数据 → 前端消费。',
    counts: {
      people: people.length,
      records: records.length,
      contests: CONTESTS.length,
      provinces: Object.keys(provinces).length,
      schools: Object.keys(schools).length,
      unverified: unverifiedTotal,
      dupNameGroups: Object.keys(dupGroups).length,
      years: [2022, 2023, 2024, 2025]
    }
  };

  g.OIER_DATA = {
    meta: meta,
    sources: SOURCES,
    contests: CONTESTS,
    contestById: (function () { var m = {}; CONTESTS.forEach(function (c) { m[c.id] = c; }); return m; })(),
    people: people,
    peopleById: peopleById,
    records: records,
    recordIndex: recordIndex,
    dupGroups: dupGroups,
    awardOrder: AWARD_ORDER,
    provinceIndex: provinceIndex,
    schoolIndex: schoolIndex,
    gradeIndex: GRADE_INDEX,
    gradeLabel: GRADE_LABEL,
    season: SEASON,
    pinyin: pinyinOf
  };

  /* ---------- Node 环境自检（开发用） ---------- */
  if (typeof process !== 'undefined' && process.argv && process.argv[1] && /data\.js$/.test(process.argv[1])) {
    console.log('== OIER_DATA 自检 ==');
    console.log('选手:', people.length, ' 记录:', records.length, ' 赛事:', CONTESTS.length);
    console.log('省份:', Object.keys(provinces).join('、'));
    console.log('待核验记录:', unverifiedTotal, ' 同名组:', JSON.stringify(dupGroups));
    CONTESTS.forEach(function (c) { console.log(' ', c.id, '记录数=' + c.recordCount); });
    ['noi-2025', 'csp-s-2025'].forEach(function (cid) {
      var top = records.filter(function (r) { return r.contestId === cid; })
        .sort(function (a, b) { return a.rank - b.rank; }).slice(0, 3);
      console.log(cid, '前三:', top.map(function (r) {
        return peopleById[r.personId].name + '(' + r.province + '/' + r.grade + ') ' + r.score + '分 ' + r.award;
      }).join(' | '));
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
