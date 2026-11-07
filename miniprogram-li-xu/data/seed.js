const books = [
 {id:'wedding',name:'婚礼礼簿',type:'婚礼',cover:'cover-wedding',subtitle:'家门有喜 · 良缘永结',date:'2026-10-18',lunar:'十月十八日',longDate:'二〇二六年十月十八日',host:'张府',count:128,totalCents:8680000},
 {id:'baby',name:'满月礼簿',type:'满月',cover:'cover-baby',subtitle:'添丁之喜 · 福满新生',date:'2026-08-09',lunar:'八月初九',longDate:'二〇二六年八月初九',host:'张府',count:62,totalCents:1600000},
 {id:'house',name:'乔迁礼簿',type:'乔迁',cover:'cover-housewarming',subtitle:'安居乐业 · 乔迁之喜',date:'2026-06-08',lunar:'六月初八',longDate:'二〇二六年六月初八',host:'张府',count:56,totalCents:1400000},
 {id:'longevity',name:'寿宴礼簿',type:'寿宴',cover:'cover-longevity',subtitle:'福寿安康 · 敬贺华诞',date:'2026-03-12',lunar:'三月十二日',longDate:'二〇二六年三月十二日',host:'张府',count:89,totalCents:1800000}
];
const people = [
 {id:'zhang',name:'张先生',relation:'亲友',event:'婚礼',date:'10月18日',frequency:4,amountCents:80000,art:'decor_plum',receivedCents:260000,sentCents:180000,note:'与张家多年往来，逢婚喜寿庆均有互赠。'},
 {id:'li',name:'李阿姨',relation:'长辈',event:'寿宴',date:'10月15日',frequency:6,amountCents:60000,art:'decor_ginkgo',receivedCents:120000,sentCents:60000,note:'长辈情谊，常来常往。'},
 {id:'wang',name:'王叔叔',relation:'邻里',event:'乔迁',date:'10月08日',frequency:3,amountCents:100000,art:'decor_bamboo',receivedCents:80000,sentCents:100000,note:'多年邻里，守望相助。'},
 {id:'chen',name:'陈老师',relation:'师长',event:'婚礼',date:'09月28日',frequency:2,amountCents:60000,art:'decor_chrysanthemum',receivedCents:60000,sentCents:60000,note:'感念师恩。'},
 {id:'zhao',name:'赵同学',relation:'同学',event:'满月',date:'09月16日',frequency:5,amountCents:50000,art:'decor_chrysanthemum',receivedCents:50000,sentCents:50000,note:'同窗之情，岁月常新。'},
 {id:'liu',name:'刘伯伯',relation:'邻里',event:'婚礼',date:'10月18日',frequency:1,amountCents:100000,art:'decor_ginkgo',receivedCents:100000,sentCents:0,note:''}
];
const records = [
 {id:'r1',bookId:'wedding',personId:'li',name:'李阿姨',relation:'亲友',direction:'in',amountCents:120000,date:'2026-10-18',time:'09:26',status:'已登记',art:'decor_plum'},
 {id:'r2',bookId:'wedding',personId:'wang',name:'王叔叔',relation:'亲友',direction:'in',amountCents:80000,date:'2026-10-18',time:'09:41',status:'入簿完成',art:'decor_bamboo'},
 {id:'r3',bookId:'wedding',personId:'chen',name:'陈老师',relation:'师长',direction:'in',amountCents:60000,date:'2026-10-18',time:'10:03',status:'已登记',art:'decor_chrysanthemum'},
 {id:'r4',bookId:'wedding',personId:'zhao',name:'赵同学',relation:'同学',direction:'in',amountCents:50000,date:'2026-10-18',time:'10:17',status:'入簿完成',art:'decor_chrysanthemum'},
 {id:'r5',bookId:'wedding',personId:'liu',name:'刘伯伯',relation:'邻里',direction:'in',amountCents:100000,date:'2026-10-18',time:'11:08',status:'已登记',art:'decor_ginkgo'},
 {id:'z1',bookId:'wedding',personId:'zhang',name:'张先生',relation:'亲友',direction:'in',amountCents:80000,date:'2026-10-18',lunar:'二〇二六年十月十八日',time:'08:30',event:'婚礼',listVisible:false,art:'decor_plum'},
 {id:'z2',bookId:'house',personId:'zhang',name:'张先生',relation:'亲友',direction:'out',amountCents:60000,date:'2025-06-08',lunar:'二〇二五年六月初八',event:'乔迁',art:'decor_bamboo'},
 {id:'z3',bookId:'baby',personId:'zhang',name:'张先生',relation:'亲友',direction:'out',amountCents:40000,date:'2024-08-09',lunar:'二〇二四年八月初九',event:'满月',art:'decor_chrysanthemum'},
 {id:'z4',bookId:'wedding',personId:'zhang',name:'张先生',relation:'亲友',direction:'in',amountCents:180000,date:'2023-05-06',lunar:'二〇二三年五月初六',event:'订婚',listVisible:false,art:'decor_ginkgo'}
];
module.exports = {books,people,records};
