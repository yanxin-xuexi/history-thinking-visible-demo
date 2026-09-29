window.HISTORY = (() => {
  const source1 = '17、18世纪，法国巴黎贵妇人常在客厅招待文人和艺术家，讨论文学艺术、宗教哲学和时事政治等话题，是为沙龙。沙龙是当时社会中上层重要的社交方式。';
  const source2 = '18世纪，英国地方性科学社团兴起，在应用科学和技术领域具有广泛影响。';
  const original = `<article class="source"><p class="source-label">2025 湖南卷 19 题 · 第一问节选</p><blockquote>${source1}</blockquote><blockquote>${source2}</blockquote><p class="task">根据材料并结合所学知识，分别指出18世纪法国沙龙和英国科学社团的特点。</p></article>`;
  const answerHtml = items => items.map(item => `<p class="answer">${item}</p>`).join('');
  const answer = ['法国沙龙由中上层女性主持，是重要的社交方式；讨论话题广泛。', '英国科学社团兴起于地方，重视应用科学和技术。'];
  const steps = [
    {id:'main.h19t.read',ch:0,type:'read',title:'先读材料和设问',html:original,narration:'读完材料，留意第一问要求你分别指出特点。特点不是照抄场景，而是从具体话语里提出属性。'},
    {id:'question.h19t.example',ch:1,type:'choice',title:'先看另一种“提炼”',html:'<div class="evidence"><span class="source-label">原文</span><blockquote>沙龙讨论文学艺术、宗教哲学和时事政治等话题。</blockquote></div>',narration:'对这句关于讨论话题的材料，哪一个回答是在提炼特点？',options:['沙龙讨论文学艺术、宗教哲学和时事政治。','沙龙话题广泛，兼及文化、思想与政治。'],correct:1,wrong:'第一项只是重列话题。许多不同话题放在一起，能提炼出讨论范围怎样？',right:'对。材料列举一个个话题，“话题广泛”才是提炼出的属性。下面换一组原句，由你自己做。'},
    {id:'task.h19t.mark',ch:1,type:'task',title:'你来圈：谁主持、是什么活动？',html:'<p class="subline">先从原句里找证据。圈词正确只表示找到了依据，还不等于能概括。</p>',narration:'请圈出能说明谁主持沙龙、沙龙属于什么活动的词组。再次点击可以取消。',task:{kind:'mark',prompt:'点击要圈出的词组，再核对',parts:[{text:'17、18世纪',correct:false},'，',{text:'法国巴黎',correct:false},{text:'贵妇人',correct:true},{text:'常在',correct:false},{text:'客厅招待文人和艺术家',correct:true},'，',{text:'讨论文学艺术、宗教哲学和时事政治',correct:false},'等话题，是为沙龙。沙龙是当时',{text:'社会中上层',correct:true},{text:'重要的社交方式',correct:true},'。']},wrong:'再对照设问：这一轮只找“谁主持、活动性质”，时间、地点和讨论话题暂时不是这两问的依据。',right:'这组依据找到了。下一步要用自己的话把它们概括出来。'},
    {id:'task.h19t.abstract',ch:1,type:'task',title:'你来换词：场景如何变成属性？',html:'<p class="subline">保留刚才圈出的原词。先独立写两个概括，提交后才看示范。</p>',narration:'现在不要再圈词。请把“贵妇人、社会中上层”和“客厅招待、社交方式”分别概括成更适合回答特点的短语。',task:{kind:'response',prompt:'用自己的话概括；这一步不会按关键词判分。',fields:[{id:'leader',label:'谁主导沙龙？',model:'由中上层女性主持'},{id:'activity',label:'沙龙属于什么活动？',model:'一种重要的社交活动'}],criteria:['是否只照抄了场景，而没有说出属性？','是否加入了材料没有支持的判断？']}},
    {id:'task.h19t.sentence',ch:1,type:'task',title:'你来成句：写一条特点',html:'<p class="subline">不要照搬参考短语；用刚才自己的概括组织一句完整的历史表述。</p>',narration:'请写一句法国沙龙的特点。提交首稿后，对照原句能否支持它，再修订。',task:{kind:'response',prompt:'写完整的一句，而不只是两个词。',fields:[{id:'statement',label:'法国沙龙的一个特点',rows:3,model:'法国沙龙由中上层女性主持，是当时重要的社交活动。'}],criteria:['句中是否真的提出属性，而非复述原句？','能否指出每个判断对应的原文依据？','有没有越出材料的推断？']}},
    {id:'task.h19t.transfer',ch:2,type:'task',title:'换材料：独立提炼英国社团的特点',html:`<div class="evidence"><span class="source-label">尚未示范的材料二</span><blockquote>${source2}</blockquote></div>`,narration:'换成材料二，不先看示范。请独立交出原文依据、概括和一句特点。',task:{kind:'response',prompt:'这次先独立完成整条链。参考表达只在首稿提交后出现。',fields:[{id:'evidence',label:'原文依据',model:'地方性；应用科学和技术'},{id:'attribute',label:'概括出的属性',model:'地方兴起；重视应用科学与技术'},{id:'statement',label:'写成一句特点',rows:3,model:'英国科学社团兴起于地方，重视应用科学与技术。'}],criteria:['依据是否真的出现在材料中？','概括是否比原词高一级？','整句是否有材料外的断言？']}},
    {id:'main.h19t.finish',ch:2,type:'finish',title:'带走的是动作，不是一句标准答案',html:'<ol class="closing"><li>找依据：从材料中找能支持判断的词组</li><li>做概括：把场景或例子升成属性</li><li>成表达：用依据支撑完整的一句特点</li></ol>',narration:'同一题可以先看另一材料的示范，再亲手做、对照修订，最后换一段未示范材料试一遍。页面记录的是本次表达，不会自动判定你已经掌握。'}
  ];
  return {steps,original,answerHtml,answers:[answer],chapters:['读题','示范与动手','独立迁移'],audio:false};
})();
