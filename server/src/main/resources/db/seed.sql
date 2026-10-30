-- ============================================================================
--  演示种子数据 —— 大同村农商文旅智慧平台
--  【幂等】全部使用 INSERT IGNORE：主键已存在的行会被跳过，
--  所以重复启动、反复执行都不会报错，也不会覆盖你在后台改过的数据。
--
--  数据规模：14 个游览点位 · 6 家商户 · 12 位游客 · 1 位管理员 · 24 件商品
--            10 场活动 · 40 条 AI 知识库 · 48 笔历史订单 · 26 条打卡记录
--            另含少量聊天、举报、通知与活动预约，保证三端首屏就有内容。
--
--  ⚠ 订单、打卡、部分账号的日期用 CURDATE()/NOW() 相对生成，不是写死的。
--    这样无论哪天重置演示数据，「运营概览」的近 7 日 / 近 30 日走势都有内容，
--    不会因为种子日期过期而变成一条平线。写死的只有「入驻年月」这类固定事实。
--
--  ⚠ 所有账号的 loginCount 都是 0：按需求「登录页初始不展示任何已有账号」，
--    只有「注册/存在」+「成功登录过」两个条件都满足，才会出现快捷登录卡片。
--
--  ⚠ 图片路径指向 assets/img/art 目录下的插画（由 tools/make-art.js 生成），
--    与旧版写实照片完全不同的一套视觉；详情页图集每处 3 张（主图 + b + c）。
-- ============================================================================

-- ------------------------------- 点位 ---------------------------------------
INSERT IGNORE INTO `spots` (`id`,`name`,`type`,`cover`,`location`,`intro`,`tts`,`stamp`,`stampIcon`,`images`,`mapX`,`mapY`) VALUES
('sp1','大同村游客服务中心','服务设施','/assets/img/art/spot-service.svg','村口广场',
 '大同村的游客集散点，提供导览地图、寄存、讲解预约与咨询投诉服务，也是集章打卡的第一站。',
 '欢迎来到大同村。这里是游客服务中心，位于村口广场。您可以在这里领取导览地图、寄存行李、预约讲解员。大同村地处桑干河畔的黄花台地上，黄花飘香、民风淳朴，祝您游览愉快。',
 '迎宾印章','i-info',
 JSON_ARRAY('/assets/img/art/spot-service.svg','/assets/img/art/spot-service-b.svg','/assets/img/art/spot-service-c.svg'),150,600),
('sp2','千亩黄花田','农产基地','/assets/img/art/spot-huanghua.svg','村南',
 '大同黄花的核心种植区，七月至八月金花铺野，可体验采摘、蒸制与晾晒。',
 '千亩黄花田是大同村最美的农事景观。大同黄花是国家地理标志产品，七月中旬到八月中旬是盛花期，清晨采摘的黄花当天蒸制晾晒，就是餐桌上的黄花菜。田埂步道可以走近花田，请不要踩进种植带。',
 '黄花印章','i-flower',
 JSON_ARRAY('/assets/img/art/spot-huanghua.svg','/assets/img/art/spot-huanghua-b.svg','/assets/img/art/spot-huanghua-c.svg'),250,190),
('sp3','黄花台地观景台','自然人文','/assets/img/art/spot-terrace.svg','村北高地',
 '登台可俯瞰千亩黄花田与桑干河谷，台地比村庄高出十余米，日出日落光线最柔，是摄影与讲解的据点。',
 '黄花台地观景台建在村北高地上。这一带是桑干河冲积形成的黄土台地，地势比村庄高出十几米，视野开阔，能望见成片的黄花田和河谷林带。清晨和傍晚光线最柔，是拍照和听讲解的好时候，讲解牌上标着台地的形成过程。',
 '观山印章','i-mountain',
 JSON_ARRAY('/assets/img/art/spot-terrace.svg','/assets/img/art/spot-terrace-b.svg','/assets/img/art/spot-terrace-c.svg'),420,150),
('sp4','桑干河湿地栈道','自然人文','/assets/img/art/spot-river.svg','村东',
 '木栈道沿湿地蜿蜒约八百米，两侧是芦苇、水鸟与河柳，清晨傍晚最宜散步。',
 '桑干河湿地栈道全长约八百米，用防腐木铺成。湿地里住着白鹭、野鸭和叫不上名字的水鸟。栈道平坦，推婴儿车和轮椅都能走。傍晚落日把河面染成金色，是村里拍照最好的地方之一。',
 '湿地印章','i-river',
 JSON_ARRAY('/assets/img/art/spot-river.svg','/assets/img/art/spot-river-b.svg','/assets/img/art/spot-river-c.svg'),720,610),
('sp5','古堡烽台遗址','历史遗迹','/assets/img/art/spot-fort.svg','村西北',
 '明代军堡遗存的夯土残垣与烽火台基座，是了解大同边塞历史的露天课堂。',
 '古堡烽台是明代大同镇边堡体系的遗存。夯土残垣虽然只剩几段，但仍能看出当年堡墙的走向。烽火台基座在坡地上，登临可以俯瞰全村。这里适合听一段边塞故事，也适合拍一张苍凉的照片。',
 '古堡印章','i-fort',
 JSON_ARRAY('/assets/img/art/spot-fort.svg','/assets/img/art/spot-fort-b.svg','/assets/img/art/spot-fort-c.svg'),860,250),
('sp6','大同村史馆','文化场馆','/assets/img/art/spot-museum.svg','文化广场北侧',
 '陈列大同村从军屯村落、合作化到农商文旅融合的变迁，老农具、老照片与手写账簿值得细看。',
 '村史馆记录了大同村几百年的变迁，从明代军屯，到合作化、家庭联产承包，再到今天的农商文旅融合。馆里陈列着耧车、风谷机等老农具，还有当年生产队的工分簿。免费开放，九点到十七点。',
 '村史印章','i-museum',
 JSON_ARRAY('/assets/img/art/spot-museum.svg','/assets/img/art/spot-museum-b.svg','/assets/img/art/spot-museum-c.svg'),330,430),
('sp7','农耕研学基地','研学基地','/assets/img/art/spot-study.svg','村西',
 '设黄花农事、石磨磨面、湿地自然观察等劳动实践课程，可容纳两百人同期研学。',
 '农耕研学基地占地约三十亩，分水田旱作、手工体验和自然观察三个区。同学们可以下田采黄花、推石磨磨莜面，也能在湿地边认水鸟、做自然笔记。基地全年开放，春秋两季最热闹，记得提前预约。',
 '研学印章','i-book',
 JSON_ARRAY('/assets/img/art/spot-study.svg','/assets/img/art/spot-study-b.svg','/assets/img/art/spot-study-c.svg'),500,330),
('sp8','老油坊 · 胡麻油工坊','非遗工坊','/assets/img/art/spot-oil.svg','老油坊街区',
 '石磨压榨胡麻油的古法作坊，从炒籽、磨浆到出油全程可看，出油当天香味最浓。',
 '老油坊还保留着石磨压榨胡麻油的古法。胡麻籽先炒后磨，再上榨出油，全程不加任何添加剂。刚出锅的胡麻油色泽棕亮、香味扑鼻。师傅说，一滴好油要经过七八道工序，急不得。',
 '榨油印章','i-jar',
 JSON_ARRAY('/assets/img/art/spot-oil.svg','/assets/img/art/spot-oil-b.svg','/assets/img/art/spot-oil-c.svg'),250,500),
('sp9','莜面工坊','非遗工坊','/assets/img/art/spot-noodle.svg','老油坊街对面',
 '现场演示莜面推窝窝、搓鱼鱼等传统技法，可报名半小时体验课，成品当场蒸熟带走。',
 '莜面是大同人的主食之一，吃法有一百多种。莜面工坊里，师傅现场推窝窝、搓鱼鱼、压饸饹。体验课只要半小时，蒸熟的莜面蘸上羊肉臊子，就是地道的塞上味道。',
 '莜面印章','i-noodle',
 JSON_ARRAY('/assets/img/art/spot-noodle.svg','/assets/img/art/spot-noodle-b.svg','/assets/img/art/spot-noodle-c.svg'),360,520),
('sp10','塞上民居院落群','自然人文','/assets/img/art/spot-courtyard.svg','村中部',
 '土墙灰瓦、木门砖雕的塞上院落，部分老院改造为民宿与茶馆，保留原有格局。',
 '塞上民居院落群是大同村保存最完整的一片老院子。土墙、灰瓦、木门楼，院里种着杏树和海棠。有几处老院改成了民宿和茶馆，格局没动，住一晚能听到真正的乡村夜晚。',
 '院落印章','i-home',
 JSON_ARRAY('/assets/img/art/spot-courtyard.svg','/assets/img/art/spot-courtyard-b.svg','/assets/img/art/spot-courtyard-c.svg'),470,470),
('sp11','田园市集','服务设施','/assets/img/art/spot-market.svg','游客服务中心旁',
 '每周六开市，村民自种的蔬菜、自制的黄花、小米与手作都会摆出来，价格实在。',
 '田园市集每周六上午开市，就在游客服务中心旁边。摆摊的多是本村村民，卖的是自家地里的时令菜、自己蒸的黄花、自家种的小米和手作小物件。这里的价格比商铺实在，也是带伴手礼的好地方。',
 '市集印章','i-market',
 JSON_ARRAY('/assets/img/art/spot-market.svg','/assets/img/art/spot-market-b.svg','/assets/img/art/spot-market-c.svg'),560,560),
('sp12','乡愁茶馆','休闲空间','/assets/img/art/spot-tea.svg','民居院落群南侧',
 '炕桌、盖碗、农家茶点，院里一坐就是一下午；配黄花饼与油茶，是本地人的日常。',
 '乡愁茶馆是村里面向游客和乡亲的茶馆。大同人喝茶讲究盖碗，配一碟黄花饼、一碗油茶。点一碗茉莉花茶或者本地砖茶，听院里风铃响，就是最地道的塞上慢生活。',
 '茶馆印章','i-tea',
 JSON_ARRAY('/assets/img/art/spot-tea.svg','/assets/img/art/spot-tea-b.svg','/assets/img/art/spot-tea-c.svg'),600,430),
('sp13','铜艺传习所','非遗工坊','/assets/img/art/spot-copper.svg','市集街区',
 '大同铜器制作技艺展示与体验，錾花铜壶、铜火锅由本地匠人手工打造。',
 '大同铜器是有名的传统手艺。传习所里，匠人现场錾花、锻打、抛光，一把铜壶要敲几千锤。体验课可以亲手錾一个小铜牌带走。铜火锅导热均匀，涮肉不糊底，是大同人冬天的标配。',
 '铜艺印章','i-craft',
 JSON_ARRAY('/assets/img/art/spot-copper.svg','/assets/img/art/spot-copper-b.svg','/assets/img/art/spot-copper-c.svg'),700,350),
('sp14','星空营地','休闲空间','/assets/img/art/spot-camp.svg','村南花田边缘',
 '远离灯光的花田营地，提供帐篷、天幕与篝火区，夏季可观测银河与流星。',
 '星空营地在大同村南边的花田边缘，远离城镇灯光。夏夜躺在草地上，银河清晰可见，运气好还能看到流星。营地提供帐篷、天幕和篝火区，烧烤要预约，明火有专人看管。',
 '星空印章','i-star',
 JSON_ARRAY('/assets/img/art/spot-camp.svg','/assets/img/art/spot-camp-b.svg','/assets/img/art/spot-camp-c.svg'),830,470);

-- ------------------------------- 商家 ---------------------------------------
INSERT IGNORE INTO `merchants` (`id`,`account`,`password`,`name`,`short`,`type`,`phone`,`intro`,`since`,`loginCount`,`lastLoginAt`,`rememberToken`,`status`,`createdAt`) VALUES
('m1','zhangmm','123456','云州黄花合作社 · 张桂芬','云州黄花合作社','农产品农户','13800002043','经营千亩黄花田与黄花深加工，合作社六十户社员，产地直发。','2021-03',0,NULL,NULL,'active','2021-03-12'),
('m2','lims','123456','塞上铜艺工坊 · 李长明','塞上铜艺工坊','非遗手艺人','13900007712','大同铜器制作技艺第五代传人，工坊六位匠人，接受研学团体参观。','2019-09',0,NULL,NULL,'active','2019-09-03'),
('m3','liujg','123456','桑干河畔民宿 · 刘建国','桑干河畔民宿','民宿经营者','13700005580','临河小院八间客房，含家庭房，院中有一棵百年杏树。','2022-06',0,NULL,NULL,'active','2022-06-18'),
('m4','wangxf','123456','老油坊 · 王秀芳','老油坊','农产品农户','13800007126','石磨压榨胡麻油与石磨莜面，古法工艺，当日鲜榨。','2020-05',0,NULL,NULL,'active','2020-05-20'),
('m5','zhaojl','123456','乡愁茶馆 · 赵金莲','乡愁茶馆','餐饮农家乐','13600008234','农家饭、黄花饼、油茶与盖碗茶，本地人常来坐一下午。','2023-04',0,NULL,NULL,'active','2023-04-08'),
('m6','chengy','123456','田园市集文创 · 陈国英','田园市集文创','文创商户','13500006371','塞上剪纸、布老虎与香包，可现场体验剪纸，也接团队定制。','2021-10',0,NULL,NULL,'active',
 DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '%Y-%m-%d'));

-- ------------------------------- 游客 ---------------------------------------
INSERT IGNORE INTO `users` (`id`,`account`,`password`,`name`,`phone`,`role`,`avatarColor`,`loginCount`,`lastLoginAt`,`rememberToken`,`status`,`createdAt`) VALUES
('u1','wangyou','123456','小王','13500009911','buyer','#C0392B',0,NULL,NULL,'active','2026-08-15'),
('u2','lixue','123456','李同学','18600003322','buyer','#8E2A35',0,NULL,NULL,'active','2026-09-02'),
('u3','sunq','123456','孙倩','13800001123','buyer','#B4552D',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 28 DAY), '%Y-%m-%d')),
('u4','zhouly','123456','周乐乐','13900002234','buyer','#A8324A',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 25 DAY), '%Y-%m-%d')),
('u5','wujf','123456','吴佳峰','13700003345','buyer','#7A4A2B',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 22 DAY), '%Y-%m-%d')),
('u6','hexr','123456','何欣然','13600004456','buyer','#9B2C4A',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 19 DAY), '%Y-%m-%d')),
('u7','tanm','123456','谭敏','13500005567','buyer','#C0563A',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 16 DAY), '%Y-%m-%d')),
('u8','yangxy','123456','杨晓雨','13400006678','buyer','#8B3A5A',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 13 DAY), '%Y-%m-%d')),
('u9','luoh','123456','罗海','13300007789','buyer','#A0522D',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 10 DAY), '%Y-%m-%d')),
('u10','dengyl','123456','邓雅丽','13200008890','buyer','#B85C38',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-%d')),
('u11','xiem','123456','谢明','13100009901','buyer','#8B4513',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '%Y-%m-%d')),
('u12','fangtt','123456','方婷婷','13000001112','buyer','#C46A4A',0,NULL,NULL,'active',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '%Y-%m-%d'));

-- ------------------------------- 管理员 -------------------------------------
INSERT IGNORE INTO `admins` (`id`,`account`,`password`,`name`,`phone`,`role`,`loginCount`,`lastLoginAt`,`rememberToken`,`status`,`createdAt`) VALUES
('ad1','admin','admin123','平台管理员','0352-87001234','admin',0,NULL,NULL,'active','2026-08-01');

-- ------------------------------- 商品 ---------------------------------------
INSERT IGNORE INTO `products` (`id`,`merchantId`,`name`,`category`,`price`,`unit`,`stock`,`sold`,`cover`,`status`,`tags`,`timeSlots`,`roomTypes`,`images`,`intro`,`desc`,`createdAt`,`mapX`,`mapY`) VALUES
('p1','m1','大同黄花菜 · 干制 250g','goods',38.00,'袋',320,96,'/assets/img/art/goods-huanghua.svg','on',
 JSON_ARRAY('地理标志','产地直发'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-huanghua.svg','/assets/img/art/goods-huanghua-b.svg','/assets/img/art/goods-huanghua-c.svg'),'',
 '云州区黄花，七分晒、三分蒸，色泽金黄、根条肥壮。凉拌、煲汤、炒肉都合适，真空包装常温存放。','2021-07-10',200,240),
('p2','m1','黄花牛肉酱 180g','goods',26.00,'瓶',200,87,'/assets/img/art/goods-sauce.svg','on',
 JSON_ARRAY('下饭神器','伴手礼'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-sauce.svg','/assets/img/art/goods-sauce-b.svg','/assets/img/art/goods-sauce-c.svg'),'',
 '黄花丁与牛肉慢熬，咸香微辣，拌面拌饭夹馍都合适。开盖后冷藏，两周内吃完。','2022-04-18',280,220),
('p3','m1','富硒小米 5kg','goods',58.00,'袋',260,132,'/assets/img/art/goods-millet.svg','on',
 JSON_ARRAY('当季新米','富硒'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-millet.svg','/assets/img/art/goods-millet-b.svg','/assets/img/art/goods-millet-c.svg'),'',
 '桑干河冲积土壤种植，米粒金黄、米油厚。熬粥挂油、口感绵滑，真空包装常温存放一年不返潮。','2021-09-20',210,290),
('p4','m4','石磨胡麻油 1.8L','goods',88.00,'桶',180,76,'/assets/img/art/goods-oil.svg','on',
 JSON_ARRAY('古法压榨','当日鲜榨'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-oil.svg','/assets/img/art/goods-oil-b.svg','/assets/img/art/goods-oil-c.svg'),'',
 '老油坊石磨压榨，不加添加剂。炒籽的火候决定香味，开瓶有明显的胡麻香。煎炒凉拌都合适，避免高温久炸。','2020-05-20',240,470),
('p5','m4','石磨莜面粉 2.5kg','goods',32.00,'袋',240,88,'/assets/img/art/goods-flour.svg','on',
 JSON_ARRAY('石磨','塞上主食'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-flour.svg','/assets/img/art/goods-flour-b.svg','/assets/img/art/goods-flour-c.svg'),'',
 '石磨低温研磨，保留麦香。推窝窝、搓鱼鱼、蒸饺子都合适，和面时用开水烫面更筋道。','2020-06-12',300,505),
('p6','m2','大同铜火锅 · 传统款','goods',498.00,'口',40,23,'/assets/img/art/goods-hotpot.svg','on',
 JSON_ARRAY('非遗','手工錾花'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-hotpot.svg','/assets/img/art/goods-hotpot-b.svg','/assets/img/art/goods-hotpot-c.svg'),'',
 '紫铜手工打造，錾花锅身，导热均匀、涮肉不糊底。随锅附木底座与保养布，首次使用前请按说明开锅。','2019-10-01',690,320),
('p7','m2','铜壶 · 手工錾花','goods',268.00,'把',60,41,'/assets/img/art/goods-kettle.svg','on',
 JSON_ARRAY('非遗','伴手礼'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-kettle.svg','/assets/img/art/goods-kettle-b.svg','/assets/img/art/goods-kettle-c.svg'),'',
 '匠人一锤一锤錾出缠枝纹，壶身圆润、出水顺畅。可烧水可做摆件，用后擦干防止水渍。','2020-04-18',730,370),
('p8','m6','塞上剪纸 · 年礼礼盒','goods',68.00,'盒',160,94,'/assets/img/art/goods-paper.svg','on',
 JSON_ARRAY('非遗文创','年礼'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-paper.svg','/assets/img/art/goods-paper-b.svg','/assets/img/art/goods-paper-c.svg'),'',
 '八张一套的塞上题材剪纸，含窗花与生肖，红宣纸手工剪制。附衬卡与相框背板，可贴可挂。','2021-10-08',540,540),
('p9','m6','手工布老虎','goods',56.00,'只',120,66,'/assets/img/art/goods-tiger.svg','on',
 JSON_ARRAY('手作','民俗'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-tiger.svg','/assets/img/art/goods-tiger-b.svg','/assets/img/art/goods-tiger-c.svg'),'',
 '老粗布拼接、彩线锁边，内填艾草与荞麦壳。可当摆件，也适合给孩子当第一只布老虎。','2022-01-15',590,585),
('p10','m3','桑干河畔民宿 · 河景标准间','homestay',268.00,'晚',8,142,'/assets/img/art/goods-room.svg','on',
 JSON_ARRAY('临河','含早餐'),NULL,JSON_ARRAY('标准间','大床房'),JSON_ARRAY('/assets/img/art/goods-room.svg','/assets/img/art/goods-room-b.svg','/assets/img/art/goods-room-c.svg'),'',
 '临河小院二楼标准间，含双早。推窗见湿地与河柳，配有地暖与热水。入住十四点后，退房次日十二点前。','2022-06-18',760,540),
('p11','m3','桑干河畔民宿 · 家庭院落房','homestay',388.00,'晚',4,36,'/assets/img/art/goods-yard.svg','on',
 JSON_ARRAY('亲子','带小院'),NULL,JSON_ARRAY('家庭房'),JSON_ARRAY('/assets/img/art/goods-yard.svg','/assets/img/art/goods-yard-b.svg','/assets/img/art/goods-yard-c.svg'),'',
 '一层带小院的亲子房，可住二大二小。院里有杏树和秋千，含四人早餐。适合家庭出游与长辈同行。','2022-06-18',800,505),
('p12','m1','桑干河湿地自然研学半日课','study',88.00,'人',60,58,'/assets/img/art/goods-wetland-class.svg','on',
 JSON_ARRAY('亲子','含讲解与观察记录'),JSON_ARRAY('上午场 09:00-11:30','下午场 14:00-16:30'),NULL,JSON_ARRAY('/assets/img/art/goods-wetland-class.svg','/assets/img/art/goods-wetland-class-b.svg','/assets/img/art/goods-wetland-class-c.svg'),'',
 '湿地栈道集合，讲解桑干河的水文变化与河滩生态，用望远镜观察水鸟并填写自然观察记录。适合六岁以上亲子与研学团，全程约两个半小时。','2023-03-01',440,180),
('p13','m4','石磨磨面体验课','study',58.00,'人',40,44,'/assets/img/art/goods-mill-class.svg','on',
 JSON_ARRAY('动手','带成品'),JSON_ARRAY('上午场 09:00-11:00','下午场 14:00-16:00'),NULL,JSON_ARRAY('/assets/img/art/goods-mill-class.svg','/assets/img/art/goods-mill-class-b.svg','/assets/img/art/goods-mill-class-c.svg'),'',
 '从炒籽、上磨到过筛，亲手磨一袋莜面或小麦面，成品一公斤带走。师傅全程带，适合亲子与朋友组队。','2021-05-20',270,540),
('p14','m1','黄花采摘体验','experience',68.00,'人',50,71,'/assets/img/art/goods-pick.svg','on',
 JSON_ARRAY('季节限定','七月八月'),JSON_ARRAY('上午 07:30-09:30','下午 16:00-18:00'),NULL,JSON_ARRAY('/assets/img/art/goods-pick.svg','/assets/img/art/goods-pick-b.svg','/assets/img/art/goods-pick-c.svg'),'',
 '清晨或傍晚进花田，戴斗笠、挎竹篮，学「轻摘不带根」的手法。采下的黄花可蒸制后带走一份。七月至八月开放，雨后泥泞请穿防滑鞋。','2023-06-01',230,260),
('p15','m5','塞上农家饭体验','experience',98.00,'人',30,39,'/assets/img/art/goods-feast.svg','on',
 JSON_ARRAY('围炉','九碗席'),JSON_ARRAY('午市 11:30-13:30','晚市 17:30-19:30'),NULL,JSON_ARRAY('/assets/img/art/goods-feast.svg','/assets/img/art/goods-feast-b.svg','/assets/img/art/goods-feast-c.svg'),'',
 '土灶围炉，学做黄花饼、油茶与一桌改良九碗席，做完上桌自己吃。人多可拼桌，单桌八到十人。','2023-04-08',610,460),
('p16','m5','盖碗茶 · 茶点套装','goods',28.00,'套',300,128,'/assets/img/art/goods-tea-set.svg','on',
 JSON_ARRAY('茶歇','伴手礼'),NULL,NULL,JSON_ARRAY('/assets/img/art/goods-tea-set.svg','/assets/img/art/goods-tea-set-b.svg','/assets/img/art/goods-tea-set-c.svg'),'',
 '砖茶或花茶一份，配黄花饼两块与油茶一碗的兑换券，可在乡愁茶馆使用，也可把饼和茶带回家。','2023-04-08',640,410),
('p17','m3','桑干河畔民宿 · 庭院家庭套房','homestay',428.00,'晚',6,18,'/assets/img/art/goods-suite.svg','on',
 JSON_ARRAY('两室一厅','含早餐'),NULL,JSON_ARRAY('庭院套房','观景套房'),JSON_ARRAY('/assets/img/art/goods-suite.svg','/assets/img/art/goods-suite-b.svg','/assets/img/art/goods-suite-c.svg'),'',
 '两室一厅带小院，可住四到五人，院里有葡萄架与石桌。步行五分钟到湿地栈道，早上能听见鸟叫，含次日农家早餐。','2023-05-18',740,570),
('p18','m3','星空营地 · 露营帐篷位','homestay',168.00,'晚',12,26,'/assets/img/art/goods-tent.svg','on',
 JSON_ARRAY('含睡袋','可观星'),NULL,JSON_ARRAY('双人帐篷','家庭帐篷'),JSON_ARRAY('/assets/img/art/goods-tent.svg','/assets/img/art/goods-tent-b.svg','/assets/img/art/goods-tent-c.svg'),'',
 '营地木平台上搭好的帐篷位，配防潮垫与睡袋，公用洗漱间和热水。夜里无遮挡，适合看星星，需自备保暖外套。','2023-05-18',860,500),
('p19','m1','黄花田农事耕作体验','experience',78.00,'人',40,52,'/assets/img/art/goods-farm.svg','on',
 JSON_ARRAY('亲子','含农具'),JSON_ARRAY('上午场 08:00-10:00','下午场 16:00-18:00'),NULL,JSON_ARRAY('/assets/img/art/goods-farm.svg','/assets/img/art/goods-farm-b.svg','/assets/img/art/goods-farm-c.svg'),'',
 '跟着合作社社员下黄花田，学翻土、施肥与摘花，农具与手套现场提供。采摘的鲜黄花可带走一小袋，适合带孩子的家庭。','2023-05-18',190,200),
('p20','m4','古法榨油体验课','experience',88.00,'人',24,31,'/assets/img/art/goods-press.svg','on',
 JSON_ARRAY('非遗','含讲解'),JSON_ARRAY('上午场 08:00-10:00','下午场 16:00-18:00'),NULL,JSON_ARRAY('/assets/img/art/goods-press.svg','/assets/img/art/goods-press-b.svg','/assets/img/art/goods-press-c.svg'),'',
 '在老油坊看石磨与木榨的老工序，自己上手炒籽、上榨、接油，榨出的胡麻油装小瓶带走。全程有师傅讲解，约两小时。','2023-05-18',260,455),
('p21','m1','打谷场秋收体验','experience',68.00,'人',40,45,'/assets/img/art/goods-thresh.svg','on',
 JSON_ARRAY('秋收','亲子'),JSON_ARRAY('上午场 08:00-10:00','下午场 16:00-18:00'),NULL,JSON_ARRAY('/assets/img/art/goods-thresh.svg','/assets/img/art/goods-thresh-b.svg','/assets/img/art/goods-thresh-c.svg'),'',
 '在打谷场学用连枷脱粒、扬场分糠，再推石碾子碾米。九十月谷子刚进场，能闻到新粮的味道，适合亲子与研学团。','2023-05-18',480,300),
('p22','m1','桑干河湿地自然观察课','study',78.00,'人',50,40,'/assets/img/art/goods-bird.svg','on',
 JSON_ARRAY('观鸟','含记录本'),JSON_ARRAY('上午场 09:00-11:00','下午场 14:30-16:30'),NULL,JSON_ARRAY('/assets/img/art/goods-bird.svg','/assets/img/art/goods-bird-b.svg','/assets/img/art/goods-bird-c.svg'),'',
 '沿湿地栈道慢走，用望远镜观察苍鹭、野鸭与河滩植物，讲解员带着填自然观察记录本。春秋两季候鸟最多，需保持安静。','2023-05-18',700,580),
('p23','m6','古堡烽台历史研学','study',88.00,'人',40,22,'/assets/img/art/goods-fort-class.svg','on',
 JSON_ARRAY('历史','含讲解'),JSON_ARRAY('上午场 09:00-11:00','下午场 14:30-16:30'),NULL,JSON_ARRAY('/assets/img/art/goods-fort-class.svg','/assets/img/art/goods-fort-class-b.svg','/assets/img/art/goods-fort-class-c.svg'),'',
 '从古堡烽台遗址的夯土残墙讲起，说边塞烽传与村落迁徙，再看村史馆的老照片与农具。适合中小学研学与家庭出游。','2023-05-18',840,290),
('p24','m2','铜艺錾花手作课','study',128.00,'人',20,16,'/assets/img/art/goods-copper-class.svg','on',
 JSON_ARRAY('非遗','可带走'),JSON_ARRAY('上午场 09:30-11:30','下午场 14:00-16:00'),NULL,JSON_ARRAY('/assets/img/art/goods-copper-class.svg','/assets/img/art/goods-copper-class-b.svg','/assets/img/art/goods-copper-class-c.svg'),'',
 '在铜艺传习所跟李长明师傅学錾花，先在铜片上描样，再用小锤一点点敲出纹路，做好的铜盘或铜牌可以带回家。','2023-05-18',660,390);

-- ------------------------------- 活动 ---------------------------------------
-- 活动日期用相对今天生成：既有已结束的（观鸟晨徙），也有未来几周的，
-- 游客端「活动日历」能同时看到进行中与已结束两种状态。
INSERT IGNORE INTO `activities` (`id`,`title`,`date`,`endDate`,`place`,`tag`,`capacity`,`desc`,`cover`,`images`,`mapX`,`mapY`) VALUES
('a1','大同村黄花采摘节',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 20 DAY),'%Y-%m-%d'),DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 27 DAY),'%Y-%m-%d'),'千亩黄花田','节庆',200,'清晨开园采摘、蒸制体验与黄花宴，现场可购当日新花。','/assets/img/art/spot-huanghua.svg',JSON_ARRAY('/assets/img/art/spot-huanghua.svg','/assets/img/art/spot-huanghua-b.svg','/assets/img/art/spot-huanghua-c.svg'),240,210),
('a2','黄花台地骑行日',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 9 DAY),'%Y-%m-%d'),NULL,'黄花台地观景台','体育',150,'沿黄花台地与河谷的二十公里环线，配补给与领骑，亲子可租亲子车。','/assets/img/art/spot-terrace.svg',JSON_ARRAY('/assets/img/art/spot-terrace.svg','/assets/img/art/spot-terrace-b.svg','/assets/img/art/spot-terrace-c.svg'),430,140),
('a3','塞上剪纸工作坊',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 3 DAY),'%Y-%m-%d'),NULL,'田园市集文创','非遗',40,'陈国英老师带剪窗花与生肖，成品当场装裱。','/assets/img/art/spot-market.svg',JSON_ARRAY('/assets/img/art/spot-market.svg','/assets/img/art/spot-market-b.svg','/assets/img/art/spot-market-c.svg'),570,570),
('a4','丰收节 · 打谷场晚会',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 45 DAY),'%Y-%m-%d'),DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 52 DAY),'%Y-%m-%d'),'农耕研学基地','节庆',300,'打谷体验、篝火晚会与农产品展销。','/assets/img/art/spot-study.svg',JSON_ARRAY('/assets/img/art/spot-study.svg','/assets/img/art/spot-study-b.svg','/assets/img/art/spot-study-c.svg'),500,310),
('a5','星空露营夜',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 14 DAY),'%Y-%m-%d'),NULL,'星空营地','休闲',80,'帐篷、篝火与观星讲解，需自带保暖衣物。','/assets/img/art/spot-camp.svg',JSON_ARRAY('/assets/img/art/spot-camp.svg','/assets/img/art/spot-camp-b.svg','/assets/img/art/spot-camp-c.svg'),835,480),
('a6','铜艺开放日',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 6 DAY),'%Y-%m-%d'),NULL,'铜艺传习所','非遗',60,'李长明师傅演示锻打与錾花，开放二十个体验名额。','/assets/img/art/spot-copper.svg',JSON_ARRAY('/assets/img/art/spot-copper.svg','/assets/img/art/spot-copper-b.svg','/assets/img/art/spot-copper-c.svg'),710,340),
('a7','农家饭品鉴周',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 2 DAY),'%Y-%m-%d'),DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 8 DAY),'%Y-%m-%d'),'乡愁茶馆','餐饮',100,'黄花饼、油茶与新菜试吃，每日限量。','/assets/img/art/spot-tea.svg',JSON_ARRAY('/assets/img/art/spot-tea.svg','/assets/img/art/spot-tea-b.svg','/assets/img/art/spot-tea-c.svg'),605,450),
('a8','湿地观鸟晨徙',DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY),'%Y-%m-%d'),NULL,'桑干河湿地栈道','自然',60,'早晨集合沿栈道观鸟，讲解员带队，需保持安静。','/assets/img/art/spot-river.svg',JSON_ARRAY('/assets/img/art/spot-river.svg','/assets/img/art/spot-river-b.svg','/assets/img/art/spot-river-c.svg'),730,620),
('a9','研学营 · 湿地与古堡两日',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 30 DAY),'%Y-%m-%d'),DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 31 DAY),'%Y-%m-%d'),'农耕研学基地','研学',120,'两天一夜，湿地自然观察加古堡边塞历史，夜宿民宿。','/assets/img/art/spot-study.svg',JSON_ARRAY('/assets/img/art/spot-study.svg','/assets/img/art/spot-study-b.svg','/assets/img/art/spot-study-c.svg'),515,350),
('a10','冬至民俗宴',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 50 DAY),'%Y-%m-%d'),NULL,'老油坊街区','节庆',200,'莜面宴、剪纸窗花与民俗表演，按桌预订。','/assets/img/art/spot-oil.svg',JSON_ARRAY('/assets/img/art/spot-oil.svg','/assets/img/art/spot-oil-b.svg','/assets/img/art/spot-oil-c.svg'),245,515);

-- ------------------------------- AI 知识库 ----------------------------------
-- 覆盖交通 / 门票 / 特产 / 体验 / 住宿 / 餐饮 / 设施 / 售后 / 季节 / 亲子等高频问题。
-- AI 未配置大模型时靠本地检索这些条目作答；命中不了会明确说「资料中没有」，不会编造。
INSERT IGNORE INTO `knowledge` (`id`,`title`,`tags`,`content`) VALUES
('k1','大同村在哪里、怎么去',JSON_ARRAY('交通','位置','地址','怎么去','自驾','高铁','公交'),
 '大同村位于山西省大同市云州区，地处桑干河畔的黄花台地上，距大同市区约三十公里。自驾导航「大同村游客服务中心」即可，村口有免费停车场，约可停两百辆车。公共交通可先到大同南站，转乘云州区公交至县城，再换乘村际公交或打车约十五分钟到达。'),
('k2','开放时间与门票',JSON_ARRAY('门票','开放时间','营业时间','收费','免费'),
 '大同村全村免费开放，无大门票。游客服务中心每日八点半至十七点半提供服务。村史馆、乡愁茶馆免费入内，开放时间为九点至十七点。铜艺传习所、莜面工坊营业时间约为九点至十八点。研学课程与农事体验需提前一天预约。'),
('k3','大同黄花为什么有名',JSON_ARRAY('黄花','黄花菜','特产','地理标志','忘忧草'),
 '大同黄花是国家地理标志产品，别名忘忧草、金针菜。大同村地处桑干河冲积的沙壤土带，昼夜温差大，长出的黄花根条肥壮、色泽金黄。七月中旬到八月中旬是盛花期，清晨带露采摘，当天蒸制晾晒。黄花菜要干制后食用，鲜黄花含有秋水仙碱，需要彻底蒸透。'),
('k4','富硒小米好在哪',JSON_ARRAY('小米','富硒','新米','粥','特产'),
 '大同村的小米种在桑干河冲积的沙壤土里，硒含量比普通产区高，米粒金黄、米油厚。熬粥时水开下锅，小火慢熬四十分钟，表面会结一层米油。新米一般在十月上市，真空包装常温能放一年。平台商城的富硒小米是五公斤装，产地直发。'),
('k5','胡麻油是什么油',JSON_ARRAY('胡麻油','油','老油坊','榨油','食用油'),
 '胡麻油是用胡麻籽压榨的食用油，是大同人厨房里的基础油。老油坊还保留石磨压榨的工艺：胡麻籽先炒后磨，再上榨出油，不加添加剂。刚出榨的油色泽棕亮、香味浓郁。煎炒凉拌都合适，但不宜长时间高温油炸。'),
('k6','莜面有哪些吃法',JSON_ARRAY('莜面','窝窝','鱼鱼','主食','吃','面食'),
 '莜面是大同人的主食之一，吃法有一百多种。最常见的有推窝窝、搓鱼鱼、压饸饹、蒸饺子。莜面要用开水烫面才筋道。莜面工坊每天有体验课，半小时学会推窝窝，蒸熟蘸羊肉臊子就是地道吃法。'),
('k7','铜火锅值得买吗',JSON_ARRAY('铜火锅','铜器','非遗','火锅','铜壶','送礼'),
 '大同铜器是有名的传统手艺，塞上铜艺工坊的李长明师傅是大同铜器制作技艺第五代传人。铜火锅紫铜手工打造、錾花锅身，导热均匀、涮肉不糊底，适合家庭聚餐也适合送长辈。铜壶更适合做伴手礼，一把要錾几千锤。首次使用前按说明开锅，用后擦干防止水渍。'),
('k8','剪纸和布老虎',JSON_ARRAY('剪纸','布老虎','文创','伴手礼','孩子','手作'),
 '田园市集文创的剪纸是红宣纸手工剪制，八张一套含窗花与生肖，附衬卡可贴可挂，适合当年礼。布老虎用老粗布拼接、彩线锁边，内填艾草与荞麦壳，可当摆件也适合给孩子。剪纸体验课当场装裱，亲子同价。'),
('k9','研学课程怎么预约',JSON_ARRAY('研学','课程','预约','孩子','学校','社会实践'),
 '平台上「研学民宿」或商品详情页可以直接预约桑干河湿地自然研学半日课和石磨磨面体验课，散客建议提前一天，团队提前三天。课程结束后可到游客服务中心领取社会实践证明并盖章。基地一次可容纳约两百人，春秋两季最热闹。'),
('k10','民宿怎么订、什么价格',JSON_ARRAY('民宿','住宿','过夜','房间','价格','订房'),
 '桑干河畔民宿是村里唯一的临河小院，八间客房。河景标准间每晚二百六十八元含双早，家庭院落房三百八十八元可住二大二小。入住时间下午两点后，退房次日十二点前，可免费寄存行李。旺季周末建议提前一周预订。院里有一棵百年杏树，四月初杏花开得最好。'),
('k11','村里吃什么',JSON_ARRAY('吃','餐','饭','美食','农家菜','九碗席','黄花饼'),
 '推荐四样：一是塞上农家饭体验的改良九碗席，土灶围炉现做现吃；二是乡愁茶馆的黄花饼配油茶；三是莜面工坊的莜面窝窝蘸羊肉臊子；四是农家乐的炖羊肉和凉拌黄花。人均四十到八十元。胃不好的朋友莜面要趁热吃，凉了偏硬。'),
('k12','什么季节来最好',JSON_ARRAY('季节','什么时候','几月','风景','夏天','秋天'),
 '四季各有看点：七月到八月黄花盛开，是村里最美的季节，也能参加采摘；九月到十月秋收，黄花台地和打谷场最有味道；冬天能吃热腾腾的铜火锅和莜面宴；春天杏花配黄土台地，人少清静。想看黄花就七月来，想赶集市和研学就周末来。'),
('k13','适合带孩子来吗',JSON_ARRAY('亲子','孩','小孩','带娃','儿童','婴儿车'),
 '适合。研学基地的湿地自然课和磨面课都接受六岁以上孩子；黄花采摘七岁以上更安全；湿地栈道平坦，可以推婴儿车；市集边有沙坑和秋千。栈道临水段请看护好孩子。服务中心可借婴儿车。孩子吃饭建议点莜面和黄花饼，软和好消化。'),
('k14','停车方便吗',JSON_ARRAY('停车','车位','开车','停车场','充电'),
 '村口有免费停车场，约两百个车位，节假日建议九点半前到。大巴停在停车场东侧的大巴区，约十个车位。村里主游线步行即可，不必开车进村。目前停车场还没有充电桩，新能源车请在大同市区充满电再来。'),
('k15','可以带宠物吗',JSON_ARRAY('宠物','狗','猫','带狗'),
 '宠物可以进村，但请牵好绳、及时清理粪便。村史馆、莜面工坊、铜艺传习所等室内场馆和民宿客房原则上不允许宠物入内，可寄存在服务中心旁的宠物笼（自备垫子）。黄花田和湿地栈道地面可能有农药残留，不要让宠物舔食植物。'),
('k16','无障碍设施',JSON_ARRAY('无障碍','轮椅','坡道','推车','老人','行动不便'),
 '主游线全程基本无台阶，服务中心、村史馆、市集入口都设有坡道。服务中心可免费借用轮椅，押证件当天归还。服务中心旁的洗手间有无障碍厕位。湿地栈道全线平坦。老院落的门槛较高，坐轮椅需要有人协助。'),
('k17','线上商城多久发货',JSON_ARRAY('发货','快递','几天','物流','包邮'),
 '农产类（黄花菜、小米、胡麻油、莜面）下单后四十八小时内发货，大同市内次日达，山西省内两天左右，省外三到五天。铜火锅、铜壶为手工品，现货四十八小时内发，定制款约七到十天。剪纸礼盒、布老虎为现货。生鲜类暂不接省外单。'),
('k18','退换货与退款',JSON_ARRAY('退货','退款','售后','质量','坏','坏果'),
 '未拆封的非生鲜商品签收七天内可申请退货，运费自理（质量问题商家承担）。生鲜若运输损坏，拍照后联系客服即可补发或退款。民宿与体验课：入住/开课前三天可免费取消，三天内取消收百分之三十，当天不退。平台内发起退款由管理员审核，到账时间以支付渠道为准。'),
('k19','集章怎么玩',JSON_ARRAY('集章','打卡','印章','通关','纪念品'),
 '游客端登录后在「点位打卡」页，每到一处点位点「打卡」就能收一枚电子印章，共十四枚。集齐全部印章会提示通关，可到游客服务中心领取一份大同村纪念徽章（数量有限，先到先得）。重复打卡会提示已收集过，不会重复计数。'),
('k20','语音讲解怎么听',JSON_ARRAY('语音','讲解','导览','耳机','听不到'),
 '每个点位详情页都有语音讲解，用手机或电脑浏览器自带的语音合成朗读，不联网也能听，不需要额外付费。如果浏览器不支持朗读，页面会自动展开文字稿。想换音色可以在讲解卡片上点「换音色」。服务中心也有人工讲解，十人以内八十元一场，需提前一天电话预约。'),
('k21','行李寄存',JSON_ARRAY('行李','寄存','存包','托管','箱子'),
 '游客服务中心提供免费行李寄存，服务到当天十七点半，贵重物品请随身携带。住店客人可以提前把行李放到民宿前台，下午两点入住前也能先去逛。大件行李箱建议存在服务中心，老院落的土路拖箱子不太方便。'),
('k22','无线网络与充电',JSON_ARRAY('WiFi','无线网络','上网','充电','充电宝','信号'),
 '游客服务中心、乡愁茶馆和村史馆提供免费无线网络，连接 Datong-Free 即可，无需密码。服务中心柜台可借充电宝，押金五十元，归还时退回。村内手机信号整体良好，花田深处和湿地上信号略弱，重要电话建议走到开阔处再打。'),
('k23','洗手间与母婴室',JSON_ARRAY('洗手间','厕所','卫生间','母婴室','饮水','洗手'),
 '主游线共设四处公共洗手间：游客服务中心内、田园市集入口、村史馆旁、湿地栈道东端，都有专人打扫。服务中心与村史馆旁的洗手间内设母婴台，可换尿布。各洗手间外有直饮水台，自带水杯可接水喝。'),
('k24','医疗与应急',JSON_ARRAY('医疗','急救','医务室','药品','受伤','不舒服'),
 '游客服务中心设医务点，备有创可贴、藿香正气水、清凉油等常用药品，可处理轻微擦伤和中暑。最近的云州区人民医院车程约二十分钟。遇到紧急情况请立即拨打 120，同时联系服务中心 0352-8700-1234，工作人员会到村口引导救护车。'),
('k25','付款方式与发票',JSON_ARRAY('付款','支付','微信','支付宝','现金','刷卡','发票'),
 '村内绝大多数店铺、作坊和农家乐都支持微信、支付宝扫码付款。田园市集上部分老人摊位只收现金，建议随身带一百元左右零钱。线上商城下单可开电子发票，备注里写清抬头和税号即可；民宿和研学团队可开增值税普通发票。'),
('k26','快递与邮寄',JSON_ARRAY('快递','邮寄','发货','寄回家','寄特产','代收','带不走'),
 '服务中心旁设有快递代收点，小米、黄花菜、胡麻油、铜器等特产都能直接寄回家，按快递公司标准收费。线上商城下单时填好收货地址更省事。铜火锅等重物建议走物流，到村自提也行。玻璃瓶装黄花牛肉酱会加气泡柱，代收点可代为打包。'),
('k27','村内交通与代步',JSON_ARRAY('观光车','电瓶车','自行车','走路','累不累','距离'),
 '村子不大，主游线步行约两公里，全程基本平坦，慢慢逛两三个小时足够，不必坐车。服务中心可租双人自行车，二十元一小时。六十岁以上或行动不便的游客可乘观光电瓶车，十元一位，在主游线四个站点随上随下。骑行日当天还有亲子自行车可租。'),
('k28','能不能飞无人机',JSON_ARRAY('无人机','航拍','飞行器','拍照','禁飞'),
 '户外花田和湿地栈道可以起飞无人机，请避开人群和院落住户，飞行高度控制在一百二十米以内。游客服务中心、村史馆和民宿院落上空禁飞。黄花采摘节、丰收节等人流密集的活动期间，需经服务中心同意后再起飞，否则工作人员会劝停。'),
('k29','团队与团建接待',JSON_ARRAY('团建','团队','接待','会议','大巴','包车','集体'),
 '二十人以上团队建议提前三天联系游客服务中心，可统一安排讲解、研学体验与团餐，研学基地一次可容纳约两百人。大巴停在村口停车场东侧的大巴区，约十个车位，免费。团队按参加项目结算，进村本身不收门票。'),
('k30','研学证明与社会实践',JSON_ARRAY('研学证书','社会实践','学生','盖章','证明','学校'),
 '参加桑干河湿地自然研学半日课或石磨磨面体验课的学生，课程结束后可到游客服务中心领取社会实践证明并盖章，预约时请说明人数和学校名称。基地提供劳动实践记录单，写明参加的项目与时长，方便回校交作业。'),
('k31','体验项目价格参考',JSON_ARRAY('价格','多少钱','收费','费用','贵不贵','项目'),
 '常见项目参考价：桑干河湿地自然研学半日课八十八元一人，石磨磨面体验课五十八元一人，黄花采摘体验六十八元一人（七、八月开放），塞上农家饭体验九十八元一人，剪纸体验含材料约四十元。价格随季节调整，以预约页面显示为准。'),
('k32','进村要不要预约',JSON_ARRAY('预约','要预约吗','直接去','散客','门票','需要预约'),
 '进村不需要预约，也不收门票，直接来就行。但研学课程、农事体验、铜艺体验课、团队接待和民宿都需要提前预约：散客建议提前一天，团队提前三天。旺季周末体验课常常报满，越早约越稳妥。'),
('k33','玩多久合适',JSON_ARRAY('玩多久','玩完要多久','几小时','半天','停留','时间安排','逛完','需要多久'),
 '走马观花一个半小时；常规游览三到四小时，能逛完黄花田、观景台、湿地栈道和村史馆；带孩子参加体验课建议留出一整天；住一晚可以赶上清晨的花田和傍晚的湿地两个光线最好的时段。服务中心八点半到十七点半有人，十七点后店铺陆续关门。'),
('k34','人多不多、怎么错峰',JSON_ARRAY('人多','拥挤','错峰','节假日','周末','排队'),
 '周末和节假日的十点到十五点人流最大，黄花田和田园市集最挤。想清静建议工作日来，或者周末九点前进村、下午四点后再拍照。黄花采摘节与丰收节期间停车场十点前就会满位，建议九点半前到达或改乘公共交通。'),
('k35','穿什么、带什么',JSON_ARRAY('穿什么','装备','防晒','防蚊','鞋子','准备'),
 '以户外步行为主，建议穿运动鞋或防滑平底鞋，雨后土路略滑。夏季带防晒帽、驱蚊液和饮用水，花田和湿地边蚊虫较多；冬季大同风大且干冷，建议防风外套加毛衣，帽子手套必备。参加采摘体验可自带一双备用鞋和袖套。'),
('k36','能不能野餐、自带食物',JSON_ARRAY('野餐','自带食物','烧烤','帐篷','野炊','草坪'),
 '星空营地以外的公共草坪可以铺野餐垫，请自带垃圾袋，离开时把垃圾带到分类投放点。村里禁止随意明火烧烤，营地烧烤要预约并由专人看管。湿地栈道是观光通道，不能下到滩涂，拍照请站在栈道上。'),
('k37','吸烟与垃圾分类',JSON_ARRAY('吸烟','抽烟','垃圾','垃圾桶','分类','卫生'),
 '室内场馆、民宿客房和湿地栈道全线禁烟，村内设三处吸烟点：停车场旁、市集入口、茶馆院坝角落。主游线每两百米左右有分类垃圾桶，厨余与其他垃圾分开投放。花田里请不要丢弃塑料袋，会影响耕种。'),
('k38','大同村名字由来',JSON_ARRAY('大同','名字','由来','村名','来历','历史'),
 '大同村所在的云州区自古为边塞屯垦之地，村名寄托了「天下大同」的朴素愿望。村史馆完整陈列了从明代军屯、合作化到农商文旅融合的发展脉络，免费开放，建议留三十分钟慢慢看。古堡烽台遗址就是这段边塞历史的见证。'),
('k39','天气与气温',JSON_ARRAY('天气','热不热','冷不冷','温度','气温','多少度','几度','气候'),
 '大同属塞上气候，四季分明：春季多风，十到二十度；夏季凉爽，白天二十五度左右、早晚十多度，是避暑的好地方；秋季晴天多、温差大，十到二十二度；冬季干冷，零下十度到零度，适合吃铜火锅看雪景。夏季白天防晒、早晚备一件外套。'),
('k40','周边还有什么景点',JSON_ARRAY('周边','附近','景点','顺路','一日游','湿地'),
 '大同村周边可顺路去桑干河国家湿地公园看河滩与水鸟，车程约二十分钟；古堡烽台遗址就在村西北的坡地上，步行十几分钟可达，可以连着边塞故事一起看；往北是大同古城（华严寺、九龙壁、代王府），车程约四十分钟；云冈石窟约一小时车程。建议把大同村和桑干河湿地安排在同一天，上午村里、下午看河。');

-- ------------------------------- 历史订单 -----------------------------------
-- 覆盖 pending / confirmed / shipped / checked_in / completed / cancelled / refunded
-- 七种状态，外加「商家拒绝等买家决定」「买家不同意继续协商」两条协商线。
-- 金额一律等于 单价 × 数量；预约类 qty 与 people 同源（与运行时下单口径一致）。
-- o1-o7 写死近期日期，o8 起用相对日期，保证运营看板近 7/30 日有走势。

INSERT IGNORE INTO `orders` (`id`,`buyerId`,`buyerName`,`merchantId`,`type`,`category`,`productId`,`productName`,`cover`,`qty`,`amount`,`status`,`bookDate`,`people`,`address`,`remark`,`bookingSlot`,`createdAt`,`confirmedAt`) VALUES
('o1','u1','小王','m1','booking','study','p12','桑干河湿地自然研学半日课','/assets/img/art/goods-wetland-class.svg',2,176.00,'confirmed',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 5 DAY),'%Y-%m-%d'),2,NULL,'带一个八岁小孩','上午场 09:00-11:30',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 DAY),'%Y-%m-%dT%H:%i')),
('o3','u1','小王','m3','booking','homestay','p10','桑干河畔民宿 · 河景标准间','/assets/img/art/goods-room.svg',2,536.00,'pending',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 3 DAY),'%Y-%m-%d'),2,NULL,'希望要朝河的房间','标准间',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('o4','u2','李同学','m2','shop','goods','p6','大同铜火锅 · 传统款','/assets/img/art/goods-hotpot.svg',1,498.00,'confirmed',NULL,NULL,'大同市平城区迎宾街 66 号','礼品包装',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('o6','u2','李同学','m4','booking','study','p13','石磨磨面体验课','/assets/img/art/goods-mill-class.svg',2,116.00,'confirmed',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 2 DAY),'%Y-%m-%d'),2,NULL,'两位成人','下午场 14:00-16:00',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('o7','u2','李同学','m5','booking','experience','p15','塞上农家饭体验','/assets/img/art/goods-feast.svg',3,294.00,'pending',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 4 DAY),'%Y-%m-%d'),3,NULL,'两大人一小孩','午市 11:30-13:30',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'));

INSERT IGNORE INTO `orders` (`id`,`buyerId`,`buyerName`,`merchantId`,`type`,`category`,`productId`,`productName`,`cover`,`qty`,`amount`,`status`,`address`,`remark`,`logisticsCompany`,`trackingNo`,`logisticsStatus`,`shippedAt`,`createdAt`,`confirmedAt`) VALUES
('o9','u3','孙倩','m1','shop','goods','p3','富硒小米 5kg','/assets/img/art/goods-millet.svg',1,58.00,'shipped','大同市云州区大庆路 21 号',NULL,'中通快递','ZTO7731208841','运输中',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('o14','u7','谭敏','m2','shop','goods','p7','铜壶 · 手工錾花','/assets/img/art/goods-kettle.svg',1,268.00,'shipped','大同市平城区永泰南路 12 号','送长辈','顺丰速运','SF1368820047','运输中',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('o18','u9','罗海','m4','shop','goods','p4','石磨胡麻油 1.8L','/assets/img/art/goods-oil.svg',2,176.00,'shipped','大同市御东区迎宾大道 66 号','送人，帮忙包一下','中通快递','ZTO7731209902','运输中',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('o23','u5','吴佳峰','m2','shop','goods','p6','大同铜火锅 · 传统款','/assets/img/art/goods-hotpot.svg',1,498.00,'shipped','大同市平城区魏都大道 33 号',NULL,'顺丰速运','SF1368821173','已揽收',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 DAY),'%Y-%m-%dT%H:%i')),
('o29','u11','谢明','m6','shop','goods','p8','塞上剪纸 · 年礼礼盒','/assets/img/art/goods-paper.svg',2,136.00,'shipped','大同市云州区昊阳路 100 号',NULL,'中通快递','ZTO7731210655','运输中',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('o31','u6','何欣然','m1','shop','goods','p2','黄花牛肉酱 180g','/assets/img/art/goods-sauce.svg',4,104.00,'shipped','大同市云州区瓜园路 5 号',NULL,'中通快递','ZTO7731211320','运输中',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'));

INSERT IGNORE INTO `orders` (`id`,`buyerId`,`buyerName`,`merchantId`,`type`,`category`,`productId`,`productName`,`cover`,`qty`,`amount`,`status`,`bookDate`,`people`,`remark`,`bookingSlot`,`checkOutDate`,`roomType`,`createdAt`,`confirmedAt`) VALUES
('o49','u5','吴佳峰','m3','booking','homestay','p10','桑干河畔民宿 · 河景标准间','/assets/img/art/goods-room.svg',2,536.00,'checked_in',DATE_FORMAT(CURDATE(),'%Y-%m-%d'),2,'今晚入住，两间','标准间',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY),'%Y-%m-%d'),'标准间',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'));

INSERT IGNORE INTO `orders` (`id`,`buyerId`,`buyerName`,`merchantId`,`type`,`category`,`productId`,`productName`,`cover`,`qty`,`amount`,`status`,`address`,`remark`,`completedAt`,`createdAt`,`confirmedAt`) VALUES
('o2','u2','李同学','m1','shop','goods','p3','富硒小米 5kg','/assets/img/art/goods-millet.svg',2,116.00,'completed','大同市平城区迎宾街 88 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 14 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 13 DAY),'%Y-%m-%dT%H:%i')),
('o5','u1','小王','m1','shop','goods','p1','大同黄花菜 · 干制 250g','/assets/img/art/goods-huanghua.svg',1,38.00,'completed','大同市云州区大同村 12 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 15 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 16 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 16 DAY),'%Y-%m-%dT%H:%i')),
('o10','u3','孙倩','m3','booking','homestay','p10','桑干河畔民宿 · 河景标准间','/assets/img/art/goods-room.svg',2,536.00,'completed',NULL,'带老人，要一楼',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 22 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 26 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 25 DAY),'%Y-%m-%dT%H:%i')),
('o11','u3','孙倩','m4','shop','goods','p4','石磨胡麻油 1.8L','/assets/img/art/goods-oil.svg',2,176.00,'completed','大同市云州区大庆路 21 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 20 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 25 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 24 DAY),'%Y-%m-%dT%H:%i')),
('o12','u6','何欣然','m1','shop','goods','p3','富硒小米 5kg','/assets/img/art/goods-millet.svg',1,58.00,'completed','大同市云州区瓜园路 5 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 18 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 24 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 23 DAY),'%Y-%m-%dT%H:%i')),
('o13','u4','周乐乐','m5','shop','goods','p16','盖碗茶 · 茶点套装','/assets/img/art/goods-tea-set.svg',2,56.00,'completed',NULL,'两位，坐院坝',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 16 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 23 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 22 DAY),'%Y-%m-%dT%H:%i')),
('o15','u5','吴佳峰','m6','shop','goods','p9','手工布老虎','/assets/img/art/goods-tiger.svg',1,56.00,'completed','大同市平城区魏都大道 33 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 14 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 21 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 20 DAY),'%Y-%m-%dT%H:%i')),
('o16','u8','杨晓雨','m1','shop','goods','p1','大同黄花菜 · 干制 250g','/assets/img/art/goods-huanghua.svg',2,76.00,'completed','大同市云州区昊阳路 9 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 13 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 20 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 19 DAY),'%Y-%m-%dT%H:%i')),
('o17','u3','孙倩','m3','shop','goods','p16','盖碗茶 · 茶点套装','/assets/img/art/goods-tea-set.svg',2,56.00,'completed',NULL,'周末下午，两位',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 19 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 18 DAY),'%Y-%m-%dT%H:%i')),
('o19','u4','周乐乐','m1','shop','goods','p2','黄花牛肉酱 180g','/assets/img/art/goods-sauce.svg',3,78.00,'completed','大同市平城区迎宾街 88 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 11 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 17 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 16 DAY),'%Y-%m-%dT%H:%i')),
('o20','u6','何欣然','m5','shop','goods','p15','塞上农家饭体验','/assets/img/art/goods-feast.svg',2,196.00,'completed',NULL,'两位，不吃太辣',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 10 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 16 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 15 DAY),'%Y-%m-%dT%H:%i')),
('o21','u10','邓雅丽','m6','shop','goods','p8','塞上剪纸 · 年礼礼盒','/assets/img/art/goods-paper.svg',2,136.00,'completed','大同市云州区昊阳路 18 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 9 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 15 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 14 DAY),'%Y-%m-%dT%H:%i')),
('o22','u7','谭敏','m1','booking','study','p12','桑干河湿地自然研学半日课','/assets/img/art/goods-wetland-class.svg',2,176.00,'completed',NULL,'带孩子，需要防晒',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 14 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 13 DAY),'%Y-%m-%dT%H:%i')),
('o24','u11','谢明','m4','shop','goods','p5','石磨莜面粉 2.5kg','/assets/img/art/goods-flour.svg',1,32.00,'completed','大同市云州区昊阳路 100 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 11 DAY),'%Y-%m-%dT%H:%i')),
('o25','u8','杨晓雨','m3','booking','homestay','p11','桑干河畔民宿 · 家庭院落房','/assets/img/art/goods-yard.svg',4,1552.00,'completed',NULL,'两间房，连住一晚',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 11 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 10 DAY),'%Y-%m-%dT%H:%i')),
('o26','u9','罗海','m1','shop','goods','p3','富硒小米 5kg','/assets/img/art/goods-millet.svg',1,58.00,'completed','大同市御东区迎宾大道 66 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 10 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 9 DAY),'%Y-%m-%dT%H:%i')),
('o27','u10','邓雅丽','m5','shop','goods','p16','盖碗茶 · 茶点套装','/assets/img/art/goods-tea-set.svg',1,28.00,'completed',NULL,'八人聚会用',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 9 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i')),
('o28','u3','孙倩','m6','booking','study','p13','石磨磨面体验课','/assets/img/art/goods-mill-class.svg',2,116.00,'completed',NULL,'两位成人',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY),'%Y-%m-%dT%H:%i')),
('o30','u4','周乐乐','m1','shop','goods','p3','富硒小米 5kg','/assets/img/art/goods-millet.svg',2,116.00,'completed','大同市平城区迎宾街 88 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i')),
('o32','u6','何欣然','m3','booking','homestay','p11','桑干河畔民宿 · 家庭院落房','/assets/img/art/goods-yard.svg',16,6208.00,'confirmed',NULL,'公司团建，需要投影',DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 10 DAY),'%Y-%m-%d'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('o33','u9','罗海','m5','shop','goods','p16','盖碗茶 · 茶点套装','/assets/img/art/goods-tea-set.svg',2,56.00,'completed',NULL,'打包带走',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('o39','u5','吴佳峰','m5','shop','goods','p16','盖碗茶 · 茶点套装','/assets/img/art/goods-tea-set.svg',1,28.00,'completed',NULL,'一位',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('o40','u7','谭敏','m4','booking','study','p13','石磨磨面体验课','/assets/img/art/goods-mill-class.svg',1,58.00,'confirmed',NULL,'想带孩子一起','上午场 09:00-11:00',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('o41','u12','方婷婷','m6','shop','goods','p9','手工布老虎','/assets/img/art/goods-tiger.svg',1,56.00,'completed','大同市云州区瓜园路 8 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('o42','u8','杨晓雨','m2','booking','study','p12','桑干河湿地自然研学半日课','/assets/img/art/goods-wetland-class.svg',1,88.00,'completed',NULL,'学生，一个人来',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 9 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i')),
('o43','u9','罗海','m3','shop','goods','p16','盖碗茶 · 茶点套装','/assets/img/art/goods-tea-set.svg',1,28.00,'completed',NULL,'两位',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('o44','u10','邓雅丽','m1','booking','experience','p14','黄花采摘体验','/assets/img/art/goods-pick.svg',2,136.00,'completed',NULL,'一大一小','上午 07:30-09:30',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i')),
('o45','u4','周乐乐','m6','shop','goods','p8','塞上剪纸 · 年礼礼盒','/assets/img/art/goods-paper.svg',1,68.00,'completed','大同市平城区迎宾街 88 号',NULL,DATE_FORMAT(NOW(),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'));

INSERT IGNORE INTO `orders` (`id`,`buyerId`,`buyerName`,`merchantId`,`type`,`category`,`productId`,`productName`,`cover`,`qty`,`amount`,`status`,`address`,`remark`,`cancelledAt`,`cancelledBy`,`createdAt`) VALUES
('o37','u11','谢明','m2','shop','goods','p7','铜壶 · 手工錾花','/assets/img/art/goods-kettle.svg',1,268.00,'cancelled','大同市云州区昊阳路 100 号','临时不要了',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 DAY),'%Y-%m-%dT%H:%i'),'buyer',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY),'%Y-%m-%dT%H:%i')),
('o38','u12','方婷婷','m1','shop','goods','p3','富硒小米 5kg','/assets/img/art/goods-millet.svg',2,116.00,'cancelled','大同市云州区瓜园路 8 号','地址填错了',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 DAY),'%Y-%m-%dT%H:%i'),'buyer',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 13 DAY),'%Y-%m-%dT%H:%i'));

INSERT IGNORE INTO `orders` (`id`,`buyerId`,`buyerName`,`merchantId`,`type`,`category`,`productId`,`productName`,`cover`,`qty`,`amount`,`status`,`address`,`remark`,`refundAmount`,`refundedAt`,`refundNote`,`createdAt`,`confirmedAt`) VALUES
('o48','u4','周乐乐','m3','booking','homestay','p11','桑干河畔民宿 · 家庭院落房','/assets/img/art/goods-yard.svg',2,776.00,'refunded',NULL,'行程有变',776.00,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i'),'行程有变，协商退款',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i'));

-- 商家拒绝的两条协商线：一条等买家决定，一条买家不同意继续协商。
INSERT IGNORE INTO `orders` (`id`,`buyerId`,`buyerName`,`merchantId`,`type`,`category`,`productId`,`productName`,`cover`,`qty`,`amount`,`status`,`rejectReason`,`rejectStatus`,`rejectedAt`,`buyerFeedback`,`feedbackAt`,`address`,`remark`,`createdAt`) VALUES
('o46','u1','小王','m2','shop','goods','p7','铜壶 · 手工錾花','/assets/img/art/goods-kettle.svg',1,268.00,'pending','下单款式缺货，师傅排单已满，建议改选传统款或七天后重拍','waiting_buyer',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),NULL,NULL,'大同市云州区大同村 12 号',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('o47','u3','孙倩','m6','shop','goods','p8','塞上剪纸 · 年礼礼盒','/assets/img/art/goods-paper.svg',10,680.00,'pending','十盒以上需提前三天备货，当前库存不足','buyer_disagreed',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),'可以等三天，先别取消',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),'大同市云州区大庆路 21 号','单位年会用',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'));

-- ------------------------------- 打卡记录 -----------------------------------
INSERT IGNORE INTO `stamps` (`id`,`userId`,`spotId`,`spotName`,`stamp`,`stampIcon`,`at`) VALUES
('st1','u1','sp1','大同村游客服务中心','迎宾印章','i-info','2026-09-15T10:02:00'),
('st2','u1','sp2','千亩黄花田','黄花印章','i-flower','2026-09-15T10:41:00'),
('st3','u1','sp3','黄花台地观景台','观山印章','i-mountain','2026-09-15T11:20:00'),
('st4','u3','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 26 DAY),'%Y-%m-%dT%H:%i')),
('st5','u3','sp2','千亩黄花田','黄花印章','i-flower',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 26 DAY),'%Y-%m-%dT%H:%i')),
('st6','u3','sp8','老油坊 · 胡麻油工坊','榨油印章','i-jar',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 25 DAY),'%Y-%m-%dT%H:%i')),
('st7','u4','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 24 DAY),'%Y-%m-%dT%H:%i')),
('st8','u4','sp3','黄花台地观景台','观山印章','i-mountain',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 23 DAY),'%Y-%m-%dT%H:%i')),
('st9','u4','sp12','乡愁茶馆','茶馆印章','i-tea',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 19 DAY),'%Y-%m-%dT%H:%i')),
('st10','u5','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 21 DAY),'%Y-%m-%dT%H:%i')),
('st11','u5','sp4','桑干河湿地栈道','湿地印章','i-river',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 20 DAY),'%Y-%m-%dT%H:%i')),
('st12','u5','sp7','农耕研学基地','研学印章','i-book',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 18 DAY),'%Y-%m-%dT%H:%i')),
('st13','u6','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 17 DAY),'%Y-%m-%dT%H:%i')),
('st14','u6','sp12','乡愁茶馆','茶馆印章','i-tea',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 16 DAY),'%Y-%m-%dT%H:%i')),
('st15','u6','sp10','塞上民居院落群','院落印章','i-home',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 15 DAY),'%Y-%m-%dT%H:%i')),
('st16','u7','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 14 DAY),'%Y-%m-%dT%H:%i')),
('st17','u7','sp13','铜艺传习所','铜艺印章','i-craft',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 13 DAY),'%Y-%m-%dT%H:%i')),
('st18','u8','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 11 DAY),'%Y-%m-%dT%H:%i')),
('st19','u8','sp2','千亩黄花田','黄花印章','i-flower',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 10 DAY),'%Y-%m-%dT%H:%i')),
('st20','u9','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 8 DAY),'%Y-%m-%dT%H:%i')),
('st21','u9','sp11','田园市集','市集印章','i-market',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY),'%Y-%m-%dT%H:%i')),
('st22','u10','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 DAY),'%Y-%m-%dT%H:%i')),
('st23','u10','sp6','大同村史馆','村史印章','i-museum',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i')),
('st24','u11','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('st25','u12','sp1','大同村游客服务中心','迎宾印章','i-info',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('st26','u12','sp5','古堡烽台遗址','古堡印章','i-fort',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'));

-- ------------------------------- 活动预约 -----------------------------------
INSERT IGNORE INTO `activityBookings` (`id`,`activityId`,`activityTitle`,`userId`,`userName`,`phone`,`people`,`date`,`remark`,`status`,`createdAt`) VALUES
('ab1','a1','大同村黄花采摘节','u1','小王','13500009911',2,DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 21 DAY),'%Y-%m-%d'),'两大人','pending',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('ab2','a1','大同村黄花采摘节','u2','李同学','18600003322',3,DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 22 DAY),'%Y-%m-%d'),'一家三口','confirmed',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i')),
('ab3','a2','黄花台地骑行日','u3','孙倩','13800001123',2,DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 9 DAY),'%Y-%m-%d'),'', 'confirmed',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('ab4','a3','塞上剪纸工作坊','u4','周乐乐','13900002234',2,DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 3 DAY),'%Y-%m-%d'),'想剪生肖','pending',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('ab5','a5','星空露营夜','u5','吴佳峰','13700003345',4,DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 14 DAY),'%Y-%m-%d'),'两顶帐篷','confirmed',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i')),
('ab6','a6','铜艺开放日','u6','何欣然','13600004456',2,DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 6 DAY),'%Y-%m-%d'),'带爸妈','pending',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('ab7','a7','农家饭品鉴周','u7','谭敏','13500005567',2,DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 2 DAY),'%Y-%m-%d'),'', 'confirmed',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('ab8','a8','湿地观鸟晨徙','u8','杨晓雨','13400006678',2,DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY),'%Y-%m-%d'),'已参加','cancelled',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i'));

-- ------------------------------- 聊天记录 -----------------------------------
-- u1 与 m1 的会话已读；u2 与 m3 的会话留两条未读，商户端能直接看到红点。
INSERT IGNORE INTO `chatMessages` (`id`,`merchantId`,`buyerId`,`fromRole`,`type`,`text`,`createdAt`,`readAt`) VALUES
('cm1','m1','u1','buyer','text','你好，黄花菜是今年的新花吗？',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('cm2','m1','u1','merchant','text','是的，今年七月的新花，刚晒好这一批，金黄根条肥壮。',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('cm3','m1','u1','buyer','product','大同黄花菜 · 干制 250g',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('cm4','m1','u1','merchant','text','这袋真空装能放半年，炒肉凉拌都行。要几袋我给你留。',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i')),
('cm5','m3','u2','buyer','text','周末还有朝河的房间吗？两位。',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),NULL),
('cm6','m3','u2','merchant','text','周六还有一间河景标准间，含双早。要订的话我在平台上给您确认。',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),NULL);

-- ------------------------------- 举报 ---------------------------------------
INSERT IGNORE INTO `reports` (`id`,`buyerId`,`buyerName`,`merchantId`,`merchantName`,`category`,`reason`,`content`,`status`,`result`,`resultAction`,`adminId`,`adminName`,`handledAt`,`notice`,`createdAt`,`updatedAt`) VALUES
('rp1','u1','小王','m1','云州黄花合作社 · 张桂芬','product','实物与描述不符','收到的黄花菜颜色偏深，和详情页的金黄色不太一样，口感还行。','pending',NULL,NULL,NULL,NULL,NULL,NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('rp2','u2','李同学','m2','塞上铜艺工坊 · 李长明','logistics','迟迟不发货','下单三天没动静，联系客服说在排单。','resolved','已与商家核实，属手工定制排队，已优先安排并发货。','warning','ad1','平台管理员',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i'),'商家已加急发货，请注意查收。如再有类似情况可继续反馈。',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('rp3','u3','孙倩','m4','老油坊 · 王秀芳','service','客服不回复','问了几次保质期都没人理。','appealed','已电话联系商家，提醒其及时回复咨询。','warning','ad1','平台管理员',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i'),'商家表示会安排专人值守客服。',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i'),DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY),'%Y-%m-%dT%H:%i'));

UPDATE `reports` SET `appealContent`='当周恰逢榨油高峰，客服人手不足，并非故意不回复；已补发保质期说明并赠送小样。', `appealAt`=DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i'), `appealStatus`='pending', `status`='appealed', `updatedAt`=DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY),'%Y-%m-%dT%H:%i') WHERE `id`='rp3' AND `appealAt` IS NULL;

-- ------------------------------- 订单留痕 -----------------------------------
INSERT IGNORE INTO `orderLogs` (`id`,`orderId`,`role`,`action`,`content`,`createdAt`) VALUES
('ol1','o46','merchant','reject','商家申请关闭订单：下单款式缺货，师傅排单已满，建议改选传统款或七天后重拍',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('ol2','o47','merchant','reject','商家申请关闭订单：十盒以上需提前三天备货，当前库存不足',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('ol3','o47','buyer','buyer_disagree','买家不同意关闭：可以等三天，先别取消',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('ol4','o48','buyer','refund','买家申请退款：行程有变',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY),'%Y-%m-%dT%H:%i')),
('ol5','o2','buyer','receive','买家确认收货，订单完成并结算',DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 DAY),'%Y-%m-%dT%H:%i'));

-- ------------------------------- 通知 ---------------------------------------
INSERT IGNORE INTO `notifications` (`id`,`userId`,`role`,`title`,`content`,`type`,`refId`,`readAt`,`createdAt`) VALUES
('n1','u1','buyer','举报已提交','您对「云州黄花合作社 · 张桂芬」的举报已提交，管理员会尽快处理。','report','rp1',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i')),
('n2','u2','buyer','举报处理结果','您举报的物流问题已处理：商家已加急发货，请注意查收。','report','rp2',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('n3','m2','merchant','举报处理提醒','您有一笔举报已被平台提醒发货时效，请及时处理在途订单。','report','rp2',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY),'%Y-%m-%dT%H:%i')),
('n4','u1','buyer','商家申请关闭订单','「铜壶 · 手工錾花」商家申请关闭订单，请到订单详情确认是否同意。','order','o46',NULL,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY),'%Y-%m-%dT%H:%i'));

-- ------------------------------- 平台参数 -----------------------------------
-- PC 管理后台「服务器管理 / 连接配置 / AI 设置」读写这张表。
-- 游客端与商户工作台不保存任何服务器地址，全部由这里统一下发。
INSERT IGNORE INTO `settings` (`id`,`value`,`groupName`,`label`,`updatedAt`) VALUES
('site.name','大同村农商文旅智慧平台','site','平台名称',NULL),
('site.shortName','大同云','site','平台简称',NULL),
('site.slogan','塞上田园 · 黄花故里 · 农商文旅一站通','site','首页标语',NULL),
('site.announcement','黄花采摘季开园，田园市集每周六开市，欢迎来赶集。','site','首页公告',NULL),
('site.allowRegister','true','site','是否开放自助注册',NULL),
('link.serverHost','','link','服务器对外地址（留空=自动探测局域网 IP）',NULL),
('link.mobilePath','/visitor/','link','游客端入口路径',NULL),
('link.merchantPath','/merchant/','link','商户工作台入口路径',NULL),
('link.adminPath','/admin/','link','PC 管理后台入口路径',NULL),
('link.enableDiscovery','true','link','启用局域网 UDP 自动发现（服务端广播 + 探测应答）',NULL),
('link.discoveryPort','47820','link','局域网发现广播端口',NULL),
('server.port','8080','server','服务端口（改后需重启服务）',NULL),
('server.displayName','大同云服务器','server','服务器名称',NULL),
('ai.enabled','false','ai','是否启用第三方大模型',NULL),
('ai.baseUrl','','ai','大模型接口地址（OpenAI 兼容）',NULL),
('ai.apiKey','','ai','大模型 API Key',NULL),
('ai.model','deepseek-chat','ai','模型名称',NULL),
('ai.systemPrompt','你是大同村的文旅讲解助手。只能依据提供的本地资料回答，资料里没有的内容要明确说「资料中没有」，绝不编造。用简体中文，口语化，不超过 200 字。','ai','系统提示词',NULL);
