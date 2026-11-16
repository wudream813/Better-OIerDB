/*
 * Production data adapter for OI·竞迹.
 * Fetches OIerDb-ng's published generated dataset (versioned from its upstream
 * SHA-512 manifests); it does not copy the upstream raw database into this repo.
 */
(function (g) {
  'use strict';

  var API = 'https://oier.api.baoshuo.dev';
  var FALLBACK = 'https://cos-1.cdn.baoshuo.xyz/oier';
  var PROVINCES = ['安徽','北京','福建','甘肃','广东','广西','贵州','海南','河北','河南','黑龙江','湖北','湖南','吉林','江苏','江西','辽宁','内蒙古','山东','山西','陕西','上海','四川','天津','新疆','浙江','重庆','宁夏','云南','澳门','香港','青海','西藏','台湾'];
  var PROV_PY = {
    '安徽':['anhui','ah'],'北京':['beijing','bj'],'福建':['fujian','fj'],'甘肃':['gansu','gs'],'广东':['guangdong','gd'],
    '广西':['guangxi','gx'],'贵州':['guizhou','gz'],'海南':['hainan','hain'],'河北':['hebei','heb'],'河南':['henan','hn'],
    '黑龙江':['heilongjiang','hlj'],'湖北':['hubei','hb'],'湖南':['hunan','hn'],'吉林':['jilin','jl'],'江苏':['jiangsu','js'],
    '江西':['jiangxi','jx'],'辽宁':['liaoning','ln'],'内蒙古':['neimenggu','nmg'],'山东':['shandong','sd'],'山西':['shanxi','sx'],
    '陕西':['shaanxi','sn'],'上海':['shanghai','sh'],'四川':['sichuan','sc'],'天津':['tianjin','tj'],'新疆':['xinjiang','xj'],
    '浙江':['zhejiang','zj'],'重庆':['chongqing','cq'],'宁夏':['ningxia','nx'],'云南':['yunnan','yn'],'澳门':['aomen','mo'],
    '香港':['xianggang','hk'],'青海':['qinghai','qh'],'西藏':['xizang','xz'],'台湾':['taiwan','tw']
  };
  var AWARDS = ['金牌','银牌','铜牌','一等奖','二等奖','三等奖','国际金牌','国际银牌','国际铜牌','前5%','前15%','前25%'];
  var AWARD_ORDER = {'金牌':12,'国际金牌':12,'一等奖':12,'银牌':11,'国际银牌':11,'二等奖':11,'铜牌':10,'国际铜牌':10,'三等奖':10,'前5%':9,'前15%':8,'前25%':7};
  var SCHOOL_PY = null;

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }
  function fetchText(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.text();
    });
  }
  function versioned(base, kind, info) {
    return base + '/' + kind + '.' + info.sha512.slice(0, 7) + (kind === 'result' ? '.txt' : '.json');
  }
  function fetchEither(path) {
    return fetchJson(API + '/' + path).catch(function () { return fetchJson(FALLBACK + '/' + path); });
  }
  function fetchEitherText(path) {
    return fetchText(API + '/' + path).catch(function () { return fetchText(FALLBACK + '/' + path); });
  }
  function lower(s) { return String(s == null ? '' : s).toLowerCase(); }
  function getSchoolPinyin(name) {
    var item = SCHOOL_PY && SCHOOL_PY[name];
    if (item) return item;
    return { py: '', ini: '' };
  }
  function gradeAt(enroll, year) {
    var rel = year - Number(enroll);
    var names = ['一年级','二年级','三年级','四年级','五年级','六年级','初一','初二','初三','高一','高二','高三'];
    if (rel >= 6) return { name: '已毕业', index: 99 };
    if (rel < -6) return { name: '未知', index: 0 };
    return { name: names[rel + 6], index: rel + 7 };
  }
  function toNumber(value) {
    if (value === '' || value == null) return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function parseCompactRecord(text, uid, enroll, staticData, types) {
    var a = text.split(/[;:]/);
    var contest = staticData.contests[Number(a[0])];
    var school = staticData.schools[Number(a[1])];
    var prov = PROVINCES[Number(a[4])];
    var award = AWARDS[Number(a[5])] || '其他';
    if (!contest || !school || !prov) return null;
    var schoolYear = contest.fall_semester ? contest.year : contest.year - 1;
    var recordEnroll = toNumber(a[6]);
    var grade = gradeAt(recordEnroll == null ? enroll : recordEnroll, schoolYear);
    var score = toNumber(a[2]);
    var tid = String(Number(a[0]));
    var sid = String(Number(a[1]));
    return {
      personId: String(uid), contestId: tid, schoolId: sid,
      year: contest.year, month: contest.fall_semester ? 10 : 7,
      grade: grade.name, gradeIndex: grade.index, schoolYear: schoolYear,
      school: school[0], province: prov, score: score,
      maxScore: contest.full_score || 0, rank: Number(a[3]) || 0,
      provinceRank: 0, total: 0, award: award,
      verified: null, note: '', sourceId: 'oierdb', sourceUrl: 'https://github.com/OIerDb-ng/OIerDb',
      accessed: new Date().toISOString().slice(0, 10)
    };
  }
  function makeIndex(name, py, ini, aliases, province) {
    var keys = [lower(name), lower(py), lower(ini)].concat((aliases || []).map(lower));
    return { name: name, py: py || '', ini: ini || '', aliases: aliases || [], keys: keys, province: province || '', people: 0, records: 0 };
  }
  function buildData(staticData, resultText, staticInfo, resultInfo) {
    var contests = staticData.contests.map(function (c, i) {
      var type = staticData.contestTypes && staticData.contestTypes[c.type] || '';
      return {
        id: String(i), name: c.name, full: c.name, type: type, year: c.year,
        month: c.fall_semester ? 10 : 7, maxScore: c.full_score || 0,
        sourceId: 'oierdb', accessed: new Date().toISOString().slice(0, 10),
        capacity: c.capacity || 0, recordCount: 0
      };
    });
    var contestById = {};
    contests.forEach(function (c) { contestById[c.id] = c; });
    var schoolById = {};
    var schools = staticData.schools;
    schools.forEach(function (s, i) { schoolById[String(i)] = s; });
    var records = [];
    var people = [];
    var peopleById = {};
    var dupGroups = {};
    var rankByProvince = {};
    var lines = resultText.split(/\r?\n/);

    lines.forEach(function (line) {
      if (!line) return;
      var col = line.split(',', 9);
      if (col.length < 9) return;
      var uid = Number(col[0]);
      var id = String(uid);
      var name = col[2];
      var enroll = Number(col[4]) || 0;
      var p = {
        id: id, name: name, py: '', ini: lower(col[1]), aliases: [], province: '',
        records: [], schools: [], currentSchool: '', count: 0,
        firstYear: null, lastYear: null, bestAward: null, bestRank: null,
        unverified: 0, currentGrade: '', currentGradeIndex: 99, cohort: enroll + 6
      };
      (col[8] || '').split('/').forEach(function (raw) {
        if (!raw) return;
        var r = parseCompactRecord(raw, uid, enroll, staticData, staticData.contestTypes || []);
        if (!r) return;
        p.records.push(r); records.push(r);
        var c = contestById[r.contestId];
        c.recordCount++;
        if (!p.province || r.year >= (p._lastProvYear || 0)) { p.province = r.province; p._lastProvYear = r.year; }
        var sh = p.schools.filter(function (x) { return x.n === r.school; })[0];
        if (!sh) { sh = { n: r.school, st: r.grade.indexOf('高') === 0 ? '高中' : '初中', f: r.schoolYear, t: r.schoolYear }; p.schools.push(sh); }
        sh.f = Math.min(sh.f, r.schoolYear); sh.t = Math.max(sh.t, r.schoolYear);
      });
      p.records.sort(function (a, b) { return a.year - b.year || a.month - b.month || a.rank - b.rank; });
      p.searchText = lower(name + ' ' + p.ini + ' ' + p.province + ' ' + p.schools.map(function (x) { var pi = getSchoolPinyin(x.n); return x.n + ' ' + pi.py + ' ' + pi.ini; }).join(' '));
      p.count = p.records.length;
      if (p.count) {
        p.firstYear = p.records[0].year;
        p.lastYear = p.records[p.count - 1].year;
        p.currentSchool = p.records[p.count - 1].school;
        var cg = gradeAt(enroll, currentSchoolYear());
        p.currentGrade = cg.name;
        p.currentGradeIndex = cg.index;
      } else { p.firstYear = enroll; p.lastYear = enroll; }
      p.schools.sort(function (a, b) { return a.f - b.f; });
      delete p._lastProvYear;
      var best = null;
      p.records.forEach(function (r) {
        if (!best || (AWARD_ORDER[r.award] || 0) > (AWARD_ORDER[best.award] || 0) || ((AWARD_ORDER[r.award] || 0) === (AWARD_ORDER[best.award] || 0) && r.rank < best.rank)) best = r;
      });
      p.bestAward = best ? best.award : null; p.bestRank = best ? best.rank : null;
      people.push(p); peopleById[id] = p;
      (dupGroups[name] = dupGroups[name] || []).push(id);
    });

    records.forEach(function (r) {
      var key = r.contestId + '|' + r.province;
      rankByProvince[key] = rankByProvince[key] || [];
      rankByProvince[key].push(r);
    });
    Object.keys(rankByProvince).forEach(function (key) {
      rankByProvince[key].sort(function (a, b) { return a.rank - b.rank; });
      rankByProvince[key].forEach(function (r, i) { r.provinceRank = i + 1; });
    });
    records.forEach(function (r) { r.total = contestById[r.contestId].recordCount; });

    var provinceIndex = {};
    PROVINCES.forEach(function (name) {
      var py = (PROV_PY[name] || ['', ''])[0], ini = (PROV_PY[name] || ['', ''])[1];
      provinceIndex[name] = makeIndex(name, py, ini, [py, ini], name);
    });
    var schoolIndex = {};
    schools.forEach(function (s) {
      if (!s[0]) return;
      var n = s[0], pName = PROVINCES[s[1]] || '';
      var py = getSchoolPinyin(n);
      schoolIndex[n] = makeIndex(n, py.py, py.ini, [], pName);
    });
    people.forEach(function (p) {
      if (provinceIndex[p.province]) provinceIndex[p.province].people++;
      p.schools.forEach(function (s) { if (schoolIndex[s.n]) schoolIndex[s.n].people++; });
    });
    records.forEach(function (r) { if (schoolIndex[r.school]) schoolIndex[r.school].records++; });

    var years = contests.map(function (c) { return c.year; });
    var current = currentSchoolYear();
    var sources = [{ id: 'oierdb', name: 'OIerDb-ng/OIerDb（生成数据）', type: '开源社区数据库',
      url: 'https://github.com/OIerDb-ng/OIerDb', accessed: new Date().toISOString().slice(0, 10),
      note: '由 OIerDb-ng 发布的压缩生成数据导入；记录本身未附逐条官方来源链接。' }];
    return {
      meta: { version: 'OIerDb ' + resultInfo.sha512.slice(0, 7), generatedAt: new Date().toISOString().slice(0, 10),
        counts: { people: people.length, records: records.length, contests: contests.length,
          provinces: Object.keys(provinceIndex).filter(function (x) { return provinceIndex[x].people; }).length,
          schools: Object.keys(schoolIndex).length, unverified: 0, dupNameGroups: Object.keys(dupGroups).filter(function (x) { return dupGroups[x].length > 1; }).length },
        yearRange: (Math.min.apply(null, years) || 0) + '–' + (Math.max.apply(null, years) || 0),
        sourceSize: resultInfo.size + staticInfo.size },
      season: current, people: people, peopleById: peopleById, dupGroups: dupGroups,
      records: records, contests: contests, contestById: contestById,
      sources: sources, awardOrder: AWARD_ORDER, provinceIndex: provinceIndex, schoolIndex: schoolIndex
    };
  }
  function currentSchoolYear() {
    var d = new Date(); return d.getFullYear() - (d.getMonth() + 1 < 9 ? 1 : 0);
  }

  var ready = Promise.all([
    fetchEither('static.info.json'), fetchEither('result.info.json'),
    fetchJson('assets/school-pinyin.json').catch(function () { return {}; })
  ]).then(function (parts) {
    var staticInfo = parts[0], resultInfo = parts[1];
    SCHOOL_PY = parts[2] || {};
    return Promise.all([
      fetchEitherText('static.' + staticInfo.sha512.slice(0, 7) + '.json'),
      fetchEitherText('result.' + resultInfo.sha512.slice(0, 7) + '.txt')
    ]).then(function (payloads) {
      var staticData = JSON.parse(payloads[0]);
      staticData.contestTypes = ['NOI','NOIP提高','CTSC','APIO','NOID类','IOI','NOIP普及','WC','CSP提高','CSP入门','NOIP','NGOI','NOIST','WC-AI'];
      return buildData(staticData, payloads[1], staticInfo, resultInfo);
    });
  }).then(function (data) {
    g.OIER_DATA = data;
    return data;
  });
  g.OIER_READY = ready;
  g.OIER_DATA_SOURCE = API;
})(window);
