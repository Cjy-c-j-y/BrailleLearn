var BrailleData = (function () {

  /* ---------- 声母表 ---------- */
  var INITIALS = {
    b:  [1,2],       p:  [1,2,3,4],   m:  [1,3,4],     f:  [1,2,4],
    d:  [1,4,5],     t:  [2,3,4,5],   n:  [1,3,4,5],   l:  [1,2,3],
    g:  [1,2,4,5],   k:  [1,3],       h:  [1,2,5],
    j:  [1,2,4,5],   q:  [1,3],       x:  [1,2,5],
    zh: [3,4],       ch: [1,2,3,4,5], sh: [1,5,6],     r:  [2,4,5],
    z:  [1,3,5,6],   c:  [1,4],       s:  [2,3,4]
  };

  /* ---------- 韵母表（值为"盲符数组"，可能 1 个或 2 个盲符） ---------- */
  var FINALS = {
    a:[3,5], o:[1,3,5], e:[2,6], i:[2,4], u:[1,3,6], v:[3,4,6],
    ai:[2,4,6], ei:[2,3,4,6], ao:[2,3,5], ou:[1,2,3,5,6],
    an:[1,2,3,6], en:[3,5,6], ang:[1,3,4,6], eng:[1,3,5,6],
    ong:[4,5,6], er:[1,2,3,5],
    ia:[2,4,3,5], ie:[2,4,2,6], iao:[2,4,2,3,5], iu:[2,4,1,2,3,5,6],
    ian:[2,4,1,2,3,6], in:[2,4,3,5,6], iang:[2,4,1,3,4,6],
    ing:[2,4,1,3,5,6], iong:[2,4,4,5,6],
    ua:[1,3,6,3,5], uo:[1,3,6,1,3,5], uai:[1,3,6,2,4,6],
    ui:[1,3,6,2,3,4,6], uan:[1,3,6,1,2,3,6], un:[1,3,6,3,5,6],
    uang:[1,3,6,1,3,4,6], ueng:[1,3,6,1,3,5,6],
    ve:[3,4,6,2,6], van:[3,4,6,1,2,3,6], vn:[3,4,6,3,5,6]
  };

  /* ---------- 声调字母 → 基础字母 ---------- */
  var TONE_MAP = {
    'ā':'a','á':'a','ǎ':'a','à':'a',
    'ō':'o','ó':'o','ǒ':'o','ò':'o',
    'ē':'e','é':'e','ě':'e','è':'e',
    'ī':'i','í':'i','ǐ':'i','ì':'i',
    'ū':'u','ú':'u','ǔ':'u','ù':'u',
    'ǖ':'v','ǘ':'v','ǚ':'v','ǜ':'v','ü':'v'
  };

  /* ---------- y / w 开头音节归一化 ---------- */
  var YW_MAP = {
    yi:'i', ya:'ia', ye:'ie', yao:'iao', you:'iu', yan:'ian', yin:'in',
    yang:'iang', ying:'ing', yong:'iong',
    yu:'v', yue:'ve', yuan:'van', yun:'vn',
    wu:'u', wa:'ua', wo:'uo', wai:'uai', wei:'ui', wan:'uan', wen:'un',
    wang:'uang', weng:'ueng'
  };

  /* 韵母分片长度对照（用于把 6 元素数组拆成 2 个盲符） */
  var FINAL_SPLIT = {
    ia:1, ie:1, iao:1, iu:1, ian:1, in:1, iang:1, ing:1, iong:1,
    ua:1, uo:1, uai:1, ui:1, uan:1, un:1, uang:1, ueng:1,
    ve:1, van:1, vn:1
  };

  /* ---------- 内部：去掉声调、统一字符 ---------- */
  function normalize(py) {
    var s = '';
    var lower = String(py).toLowerCase();
    for (var i = 0; i < lower.length; i++) {
      var ch = lower.charAt(i);
      s += TONE_MAP[ch] || ch;
    }
    s = s.replace(/[0-9]/g, '').replace(/u:/g, 'v');
    return s;
  }

  /* ---------- 内部：把长数组拆成盲符数组 ---------- */
  function packFinal(fin) {
    var raw = FINALS[fin];
    if (!raw) return [];
    if (!FINAL_SPLIT[fin]) return [raw];           // 单盲符韵母
    var half = raw.length / 2;                     // 双盲符韵母
    return [ raw.slice(0, half), raw.slice(half) ];
  }

  /* ---------- 对外：拼音 → 盲符数组 ---------- */
  function pinyinToCells(py) {
    if (!py) return [];
    var s = normalize(py);
    if (YW_MAP[s]) s = YW_MAP[s];

    var ini = '', fin = s;

    /* 先匹配双字母声母 zh/ch/sh */
    var two = s.slice(0, 2);
    if (INITIALS[two]) {
      ini = two;
      fin = s.slice(2);
    } else if (INITIALS[s.charAt(0)]) {
      ini = s.charAt(0);
      fin = s.slice(1);
    }

    /* j/q/x 后的 u 实际是 ü */
    if (ini === 'j' || ini === 'q' || ini === 'x') {
      if (fin.charAt(0) === 'u') fin = 'v' + fin.slice(1);
    }

    var cells = [];
    if (ini && INITIALS[ini]) cells.push(INITIALS[ini]);
    var fCells = packFinal(fin);
    for (var i = 0; i < fCells.length; i++) cells.push(fCells[i]);

    /* 兜底：整串找不到，尝试当零声母再试一次 */
    if (!cells.length && FINALS[s]) cells.push(FINALS[s]);

    return cells;
  }

  /* ---------- 汉字字库（按主题分类，共 206 字） ----------
   *  分类说明：
   *    person  — 人物关系（20字）
   *    nature  — 自然万物（28字）
   *    action  — 动作行为（30字）
   *    number  — 数字量词（20字）
   *    life    — 生活物品（28字）
   *    time    — 时间概念（16字）
   *    place   — 方位空间（18字）
   *    quality — 性质程度（28字）
   *    society — 社会文化（18字）
   * ------------------------------------------------------------------------- */
  var DICT = [
    /* ---- person · 人物关系 ---- */
    {c:'你',p:'nǐ',s:'你好，很高兴认识你。',cat:'person'},
    {c:'我',p:'wǒ',s:'我是一名大学生。',cat:'person'},
    {c:'他',p:'tā',s:'他是我的同班同学。',cat:'person'},
    {c:'她',p:'tā',s:'她喜欢读课外书。',cat:'person'},
    {c:'人',p:'rén',s:'帮助别人是一件快乐的事。',cat:'person'},
    {c:'老',p:'lǎo',s:'老师耐心地教我们盲文。',cat:'person'},
    {c:'师',p:'shī',s:'教师节快乐。',cat:'person'},
    {c:'生',p:'shēng',s:'学生们在教室里读书。',cat:'person'},
    {c:'朋',p:'péng',s:'朋友之间要互相帮助。',cat:'person'},
    {c:'友',p:'yǒu',s:'他是我最好的朋友。',cat:'person'},
    {c:'爸',p:'bà',s:'爸爸每天送我上学。',cat:'person'},
    {c:'妈',p:'mā',s:'妈妈做了一桌好菜。',cat:'person'},
    {c:'哥',p:'gē',s:'哥哥比我大两岁。',cat:'person'},
    {c:'姐',p:'jiě',s:'姐姐在远方上大学。',cat:'person'},
    {c:'孩',p:'hái',s:'孩子们在公园里玩耍。',cat:'person'},
    {c:'子',p:'zǐ',s:'桌子上有几本书。',cat:'person'},
    {c:'女',p:'nǚ',s:'她是班上的女同学。',cat:'person'},
    {c:'男',p:'nán',s:'他是班上的男同学。',cat:'person'},
    {c:'伯',p:'bó',s:'伯伯住在乡下。',cat:'person'},
    {c:'邻',p:'lín',s:'邻居们相处得很融洽。',cat:'person'},

    /* ---- nature · 自然万物 ---- */
    {c:'天',p:'tiān',s:'今天天气很好。',cat:'nature'},
    {c:'地',p:'dì',s:'大地回春，万物复苏。',cat:'nature'},
    {c:'日',p:'rì',s:'今天是九月十四日。',cat:'nature'},
    {c:'月',p:'yuè',s:'月亮挂在天空中。',cat:'nature'},
    {c:'星',p:'xīng',s:'夜空中有很多星星。',cat:'nature'},
    {c:'山',p:'shān',s:'远处有一座高山。',cat:'nature'},
    {c:'河',p:'hé',s:'河水清澈见底。',cat:'nature'},
    {c:'风',p:'fēng',s:'今天的风很大。',cat:'nature'},
    {c:'雨',p:'yǔ',s:'外面下雨了，记得带伞。',cat:'nature'},
    {c:'云',p:'yún',s:'天上的云像棉花糖。',cat:'nature'},
    {c:'花',p:'huā',s:'花园里开满了鲜花。',cat:'nature'},
    {c:'水',p:'shuǐ',s:'请给我一杯水。',cat:'nature'},
    {c:'火',p:'huǒ',s:'火可以给我们带来温暖。',cat:'nature'},
    {c:'光',p:'guāng',s:'阳光照进了教室。',cat:'nature'},
    {c:'明',p:'míng',s:'明天我们一起去图书馆。',cat:'nature'},
    {c:'雪',p:'xuě',s:'冬天到了，下雪了。',cat:'nature'},
    {c:'海',p:'hǎi',s:'大海一望无际。',cat:'nature'},
    {c:'树',p:'shù',s:'树上有一只小鸟。',cat:'nature'},
    {c:'草',p:'cǎo',s:'春天小草发芽了。',cat:'nature'},
    {c:'石',p:'shí',s:'路边有一块大石头。',cat:'nature'},
    {c:'土',p:'tǔ',s:'植物从土里生长出来。',cat:'nature'},
    {c:'林',p:'lín',s:'森林里空气清新。',cat:'nature'},
    {c:'叶',p:'yè',s:'秋天树叶黄了。',cat:'nature'},
    {c:'鸟',p:'niǎo',s:'小鸟在枝头唱歌。',cat:'nature'},
    {c:'鱼',p:'yú',s:'鱼儿在水中游来游去。',cat:'nature'},
    {c:'阳',p:'yáng',s:'阳光温暖着大地。',cat:'nature'},
    {c:'空',p:'kōng',s:'天空中飘着白云。',cat:'nature'},
    {c:'春',p:'chūn',s:'春天来了，花儿开了。',cat:'nature'},

    /* ---- action · 动作行为 ---- */
    {c:'看',p:'kàn',s:'我用眼睛看世界。',cat:'action'},
    {c:'听',p:'tīng',s:'我用耳朵听声音。',cat:'action'},
    {c:'说',p:'shuō',s:'请大声说出你的答案。',cat:'action'},
    {c:'读',p:'dú',s:'我每天读一小时书。',cat:'action'},
    {c:'写',p:'xiě',s:'我会写自己的名字。',cat:'action'},
    {c:'学',p:'xué',s:'学习盲文并不难。',cat:'action'},
    {c:'爱',p:'ài',s:'我爱我的家人。',cat:'action'},
    {c:'开',p:'kāi',s:'请打开你的课本。',cat:'action'},
    {c:'走',p:'zǒu',s:'我们走路去学校。',cat:'action'},
    {c:'跑',p:'pǎo',s:'同学们在操场上跑步。',cat:'action'},
    {c:'吃',p:'chī',s:'中午我们一起吃饭。',cat:'action'},
    {c:'喝',p:'hē',s:'口渴了，喝点水吧。',cat:'action'},
    {c:'坐',p:'zuò',s:'请坐下休息一会儿。',cat:'action'},
    {c:'站',p:'zhàn',s:'请大家站起来回答问题。',cat:'action'},
    {c:'来',p:'lái',s:'欢迎来到盲文学习平台。',cat:'action'},
    {c:'去',p:'qù',s:'下课以后一起去吃饭。',cat:'action'},
    {c:'做',p:'zuò',s:'自己做自己的作业。',cat:'action'},
    {c:'想',p:'xiǎng',s:'我想成为一个有用的人。',cat:'action'},
    {c:'问',p:'wèn',s:'不懂就要问老师。',cat:'action'},
    {c:'答',p:'dá',s:'请回答这道题。',cat:'action'},
    {c:'唱',p:'chàng',s:'我们一起唱校歌。',cat:'action'},
    {c:'画',p:'huà',s:'我画了一幅风景画。',cat:'action'},
    {c:'玩',p:'wán',s:'周末我和朋友一起玩。',cat:'action'},
    {c:'教',p:'jiāo',s:'老师教我们学盲文。',cat:'action'},
    {c:'帮',p:'bāng',s:'同学之间要互相帮助。',cat:'action'},
    {c:'送',p:'sòng',s:'妈妈送我到学校门口。',cat:'action'},
    {c:'买',p:'mǎi',s:'我去超市买文具。',cat:'action'},
    {c:'洗',p:'xǐ',s:'饭前要洗手。',cat:'action'},
    {c:'睡',p:'shuì',s:'晚上十点准时睡觉。',cat:'action'},
    {c:'起',p:'qǐ',s:'早上六点半起床。',cat:'action'},

    /* ---- number · 数字量词 ---- */
    {c:'一',p:'yī',s:'我每天学习一个小时。',cat:'number'},
    {c:'二',p:'èr',s:'二月是一年中最短的月份。',cat:'number'},
    {c:'三',p:'sān',s:'三月份学校有运动会。',cat:'number'},
    {c:'四',p:'sì',s:'四月天气开始变暖。',cat:'number'},
    {c:'五',p:'wǔ',s:'我五点下课。',cat:'number'},
    {c:'六',p:'liù',s:'六月是毕业季。',cat:'number'},
    {c:'七',p:'qī',s:'一周有七天。',cat:'number'},
    {c:'八',p:'bā',s:'八月天气很热。',cat:'number'},
    {c:'九',p:'jiǔ',s:'九月开学了。',cat:'number'},
    {c:'十',p:'shí',s:'十全十美是个好词。',cat:'number'},
    {c:'百',p:'bǎi',s:'百闻不如一见。',cat:'number'},
    {c:'千',p:'qiān',s:'千里之行，始于足下。',cat:'number'},
    {c:'万',p:'wàn',s:'万事开头难。',cat:'number'},
    {c:'零',p:'líng',s:'温度降到了零度。',cat:'number'},
    {c:'个',p:'gè',s:'桌子上有三个苹果。',cat:'number'},
    {c:'只',p:'zhī',s:'树上只有一只鸟。',cat:'number'},
    {c:'条',p:'tiáo',s:'河里有一条小船。',cat:'number'},
    {c:'本',p:'běn',s:'我买了两本书。',cat:'number'},
    {c:'张',p:'zhāng',s:'桌上有一张纸。',cat:'number'},
    {c:'两',p:'liǎng',s:'我有两个好朋友。',cat:'number'},

    /* ---- life · 生活物品 ---- */
    {c:'家',p:'jiā',s:'我家有四口人。',cat:'life'},
    {c:'饭',p:'fàn',s:'妈妈做了香喷喷的饭菜。',cat:'life'},
    {c:'车',p:'chē',s:'公交车很方便。',cat:'life'},
    {c:'书',p:'shū',s:'这本书很有意思。',cat:'life'},
    {c:'字',p:'zì',s:'这个字我不认识。',cat:'life'},
    {c:'文',p:'wén',s:'我喜欢学习语文。',cat:'life'},
    {c:'门',p:'mén',s:'请随手关门。',cat:'life'},
    {c:'窗',p:'chuāng',s:'窗户开着透透气。',cat:'life'},
    {c:'床',p:'chuáng',s:'每天整理床铺。',cat:'life'},
    {c:'桌',p:'zhuō',s:'课桌上放着课本。',cat:'life'},
    {c:'椅',p:'yǐ',s:'请坐在椅子上。',cat:'life'},
    {c:'灯',p:'dēng',s:'晚上要开灯学习。',cat:'life'},
    {c:'衣',p:'yī',s:'天冷了多加衣服。',cat:'life'},
    {c:'鞋',p:'xié',s:'出门前穿好鞋子。',cat:'life'},
    {c:'帽',p:'mào',s:'太阳大要戴帽子。',cat:'life'},
    {c:'碗',p:'wǎn',s:'吃饭前摆好碗筷。',cat:'life'},
    {c:'筷',p:'kuài',s:'中国人用筷子吃饭。',cat:'life'},
    {c:'杯',p:'bēi',s:'请给我一个杯子。',cat:'life'},
    {c:'房',p:'fáng',s:'房间里有一张床。',cat:'life'},
    {c:'楼',p:'lóu',s:'教学楼有三层。',cat:'life'},
    {c:'路',p:'lù',s:'回家的路要走十分钟。',cat:'life'},
    {c:'桥',p:'qiáo',s:'河上有一座小桥。',cat:'life'},
    {c:'船',p:'chuán',s:'小船在河里慢慢行驶。',cat:'life'},
    {c:'机',p:'jī',s:'手机是常用的通讯工具。',cat:'life'},
    {c:'电',p:'diàn',s:'停电了点蜡烛。',cat:'life'},
    {c:'话',p:'huà',s:'请接一下电话。',cat:'life'},
    {c:'视',p:'shì',s:'看电视要保护眼睛。',cat:'life'},
    {c:'网',p:'wǎng',s:'互联网让生活更便捷。',cat:'life'},

    /* ---- time · 时间概念 ---- */
    {c:'年',p:'nián',s:'新的一年要努力学习。',cat:'time'},
    {c:'时',p:'shí',s:'时间过得真快。',cat:'time'},
    {c:'间',p:'jiān',s:'房间里有一张桌子。',cat:'time'},
    {c:'今',p:'jīn',s:'今天天气真好。',cat:'time'},
    {c:'昨',p:'zuó',s:'昨天下了一场大雨。',cat:'time'},
    {c:'早',p:'zǎo',s:'早上好，同学们。',cat:'time'},
    {c:'晚',p:'wǎn',s:'晚上我要复习功课。',cat:'time'},
    {c:'夏',p:'xià',s:'夏天可以去游泳。',cat:'time'},
    {c:'秋',p:'qiū',s:'秋天是丰收的季节。',cat:'time'},
    {c:'冬',p:'dōng',s:'冬天要注意保暖。',cat:'time'},
    {c:'新',p:'xīn',s:'新学期开始了。',cat:'time'},
    {c:'旧',p:'jiù',s:'这本旧书很有价值。',cat:'time'},
    {c:'先',p:'xiān',s:'先写完作业再玩。',cat:'time'},
    {c:'钟',p:'zhōng',s:'墙上的钟指向八点。',cat:'time'},
    {c:'期',p:'qī',s:'这学期课程很多。',cat:'time'},
    {c:'刻',p:'kè',s:'时刻牢记安全第一。',cat:'time'},

    /* ---- place · 方位空间 ---- */
    {c:'上',p:'shàng',s:'上课要认真听讲。',cat:'place'},
    {c:'下',p:'xià',s:'下课以后一起去吃饭。',cat:'place'},
    {c:'中',p:'zhōng',s:'中国有五千年的历史。',cat:'place'},
    {c:'左',p:'zuǒ',s:'请举起你的左手。',cat:'place'},
    {c:'右',p:'yòu',s:'请举起你的右手。',cat:'place'},
    {c:'里',p:'lǐ',s:'教室里很安静。',cat:'place'},
    {c:'外',p:'wài',s:'外面天气很冷。',cat:'place'},
    {c:'东',p:'dōng',s:'太阳从东方升起。',cat:'place'},
    {c:'南',p:'nán',s:'南方气候温暖。',cat:'place'},
    {c:'西',p:'xī',s:'太阳从西方落下。',cat:'place'},
    {c:'北',p:'běi',s:'北方冬天很冷。',cat:'place'},
    {c:'旁',p:'páng',s:'学校旁边有个公园。',cat:'place'},
    {c:'远',p:'yuǎn',s:'学校离家不远。',cat:'place'},
    {c:'近',p:'jìn',s:'我家离学校很近。',cat:'place'},
    {c:'前',p:'qián',s:'前面有一家书店。',cat:'place'},
    {c:'后',p:'hòu',s:'后面有一棵大树。',cat:'place'},

    /* ---- quality · 性质程度 ---- */
    {c:'大',p:'dà',s:'大学里有很多社团。',cat:'quality'},
    {c:'小',p:'xiǎo',s:'小鸟在树上唱歌。',cat:'quality'},
    {c:'多',p:'duō',s:'操场上人很多。',cat:'quality'},
    {c:'少',p:'shǎo',s:'今天作业很少。',cat:'quality'},
    {c:'好',p:'hǎo',s:'今天天气真好。',cat:'quality'},
    {c:'坏',p:'huài',s:'坏习惯要改掉。',cat:'quality'},
    {c:'长',p:'cháng',s:'这条路很长。',cat:'quality'},
    {c:'短',p:'duǎn',s:'这支铅笔太短了。',cat:'quality'},
    {c:'快',p:'kuài',s:'他跑得很快。',cat:'quality'},
    {c:'慢',p:'màn',s:'请慢一点走。',cat:'quality'},
    {c:'美',p:'měi',s:'风景真美啊。',cat:'quality'},
    {c:'丑',p:'chǒu',s:'不要以貌取人。',cat:'quality'},
    {c:'对',p:'duì',s:'你的回答是对的。',cat:'quality'},
    {c:'错',p:'cuò',s:'这道题做错了。',cat:'quality'},
    {c:'难',p:'nán',s:'这道题很难。',cat:'quality'},
    {c:'易',p:'yì',s:'这件事很容易。',cat:'quality'},
    {c:'真',p:'zhēn',s:'这是真的故事。',cat:'quality'},
    {c:'假',p:'jiǎ',s:'不要说假话。',cat:'quality'},
    {c:'忙',p:'máng',s:'最近我很忙。',cat:'quality'},
    {c:'闲',p:'xián',s:'周末闲下来读书。',cat:'quality'},
    {c:'冷',p:'lěng',s:'今天天气很冷。',cat:'quality'},
    {c:'热',p:'rè',s:'夏天天气很热。',cat:'quality'},
    {c:'红',p:'hóng',s:'她穿了一件红裙子。',cat:'quality'},
    {c:'绿',p:'lǜ',s:'春天满眼绿色。',cat:'quality'},
    {c:'白',p:'bái',s:'白云像棉花糖。',cat:'quality'},
    {c:'黑',p:'hēi',s:'夜晚天很黑。',cat:'quality'},
    {c:'黄',p:'huáng',s:'秋天树叶黄了。',cat:'quality'},
    {c:'蓝',p:'lán',s:'天空是蓝色的。',cat:'quality'},

    /* ---- society · 社会文化 ---- */
    {c:'国',p:'guó',s:'我们的祖国是中国。',cat:'society'},
    {c:'汉',p:'hàn',s:'汉字是中华文化的瑰宝。',cat:'society'},
    {c:'语',p:'yǔ',s:'汉语是世界上最美的语言之一。',cat:'society'},
    {c:'盲',p:'máng',s:'盲文是视障人士的文字。',cat:'society'},
    {c:'点',p:'diǎn',s:'盲文由凸起的点组成。',cat:'society'},
    {c:'习',p:'xí',s:'复习是学习的好方法。',cat:'society'},
    {c:'谢',p:'xiè',s:'谢谢你的帮助。',cat:'society'},
    {c:'请',p:'qǐng',s:'请问洗手间在哪里？',cat:'society'},
    {c:'欢',p:'huān',s:'欢迎来到盲文学习平台。',cat:'society'},
    {c:'迎',p:'yíng',s:'我们热烈欢迎新同学。',cat:'society'},
    {c:'是',p:'shì',s:'这是一本盲文书。',cat:'society'},
    {c:'的',p:'de',s:'这是我的朋友。',cat:'society'},
    {c:'不',p:'bù',s:'我不认识这个字。',cat:'society'},
    {c:'了',p:'le',s:'下课了，我们回家吧。',cat:'society'},
    {c:'心',p:'xīn',s:'我用心感受这个世界。',cat:'society'},
    {c:'手',p:'shǒu',s:'请举起你的双手。',cat:'society'},
    {c:'步',p:'bù',s:'一步一步往前走。',cat:'society'},
    {c:'道',p:'dào',s:'这条道通向学校。',cat:'society'}
  ];

  /* ---------- 分类元数据 ---------- */
  var CATEGORIES = [
    {key:'all',     name:'全部',   icon:'📚'},
    {key:'person',  name:'人物',   icon:'👤'},
    {key:'nature',  name:'自然',   icon:'🌿'},
    {key:'action',  name:'动作',   icon:'🏃'},
    {key:'number',  name:'数字',   icon:'🔢'},
    {key:'life',    name:'生活',   icon:'🏠'},
    {key:'time',    name:'时间',   icon:'⏰'},
    {key:'place',   name:'方位',   icon:'🧭'},
    {key:'quality', name:'性质',   icon:'⚖️'},
    {key:'society', name:'社会',   icon:'🌐'}
  ];

  /* ---------- 建索引 ---------- */
  var byChar = {}, byPinyin = {};
  for (var i = 0; i < DICT.length; i++) {
    byChar[DICT[i].c] = DICT[i];
    if (!byPinyin[DICT[i].p]) byPinyin[DICT[i].p] = DICT[i];
  }

  return {
    INITIALS: INITIALS,
    FINALS: FINALS,
    pinyinToCells: pinyinToCells,
    DICT: DICT,
    CATEGORIES: CATEGORIES,
    byChar: byChar,
    byPinyin: byPinyin
  };
})();