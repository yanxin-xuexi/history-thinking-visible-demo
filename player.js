(() => {
'use strict';
const {original,answerHtml,answers}=window.HISTORY;
const steps=window.HISTORY.steps;
const chapters=window.HISTORY.chapters||['读题','讲解','回顾'];
const answerLabels=window.HISTORY.answerLabels||[];
const $=id=>document.getElementById(id),audio=$('speech');
const memory=steps.map(()=>({selected:null,attempts:0,feedback:null,hint:false,reveal:0}));
let index=0,subtitles=true,returnFocus=null,token=0,timer=null,activeId=null,pendingAdvance=null;
const advancing=new Set(steps.filter(s=>!s.type).map(s=>s.id));
function button(label,fn,kind=''){const b=document.createElement('button');b.textContent=label;b.className=kind;b.addEventListener('click',fn);return b;}
function status(text){$('audio-status').textContent=text;}
function stop(){token++;clearTimeout(timer);timer=null;pendingAdvance=null;audio.onended=null;audio.onerror=null;audio.pause();activeId=null;$('sound').textContent='播放';status('已暂停');}
function current(){const s=steps[index],m=memory[index],stem=s.id.replace('question.','feedback.');if(m.feedback){const option=m.feedback==='right'?s.correct:1-s.correct;return {id:stem+'.'+String.fromCharCode(97+option),text:m.feedback==='right'?s.right:s.wrong,advance:m.feedback==='right'||m.attempts>=2};}if(m.hint)return {id:stem+'.hint',text:s.hint,advance:false};if(s.type==='answer'&&m.reveal){if(s.ch===1)return {id:m.reveal===1?'answer.h18.fact':'answer.h18.viewpoint',text:s.answer[m.reveal-1],advance:m.reveal===1};return {id:null,text:'参考作答供核对，不要求逐字照写。',advance:false};}return {id:s.id,text:s.narration,advance:advancing.has(s.id)};}
function advanceTrack(){if(steps[index].type==='answer'&&memory[index].reveal===1){memory[index].reveal=2;render();playCurrent();}else go(index+1,true);}
function playCurrent(){const track=current();stop();if(!track.id){status('自主核对');return;}const t=token;activeId=track.id;$('narration').querySelector('p').textContent=track.text;if(window.HISTORY.audio===false){status('文字讲解');return;}audio.src=`audio/${track.id}.mp3`;audio.onended=()=>{if(t!==token)return;$('sound').textContent=track.advance?'暂停':'重听';status(track.advance?'讲解衔接中':'等待操作');if(track.advance){pendingAdvance=advanceTrack;timer=setTimeout(()=>{timer=null;if(t===token&&!$('dialog').open){const advance=pendingAdvance;pendingAdvance=null;advance?.();}},160);}};audio.onerror=()=>{if(t!==token)return;status('音频不可用');$('sound').textContent='重试';$('announcement').textContent='音频加载失败，可以重试或阅读字幕继续。';};const p=audio.play();if(p)p.then(()=>{if(t===token){$('sound').textContent='暂停';status('讲解中');}}).catch(()=>{if(t===token){status(audio.error?'音频不可用':'点击播放');$('sound').textContent=audio.error?'重试':'播放';}});}
function go(n,automatic=false){stop();index=Math.max(0,Math.min(steps.length-1,n));render();if(!automatic)$('title').focus({preventScroll:true});playCurrent();}
function next(){go(index+1);}
function modal(title,html){stop();returnFocus=document.activeElement;$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;$('dialog').showModal();$('dialog-body').scrollTop=0;}
function render(){
const s=steps[index],m=memory[index];$('lesson').dataset.scene=s.id;$('chapter').textContent=chapters[s.ch]||'';$('step').textContent=`${index+1} / ${steps.length}`;$('track').firstElementChild.style.width=`${(index+1)/steps.length*100}%`;
$('title').textContent=s.title;$('eyebrow').textContent=s.kicker||(s.type==='choice'?'提问后等待作答':s.type==='task'?'动手任务 · 做完点确认':'讲解样段 · 随时暂停');
if($('board').dataset.key!==s.id){
 if(s.carry&&$('board').dataset.key){$('board').firstElementChild?.classList.add('context-carry');const layer=document.createElement('div');layer.innerHTML=s.html;$('board').append(layer);}
 else{$('board').innerHTML=s.html;$('board').scrollTop=0;}
}
$('board').dataset.key=s.id;$('interaction').replaceChildren();$('actions').replaceChildren();$('back').disabled=index===0;
$('narration').hidden=!subtitles;$('narration').querySelector('p').textContent=current().text;$('voice').setAttribute('aria-pressed',String(subtitles));
const actions=$('actions');
if(s.type==='choice'){
 if(m.feedback){const fb=document.createElement('div');fb.className='feedback';const label=document.createElement('strong');label.textContent=m.feedback==='right'?'判断反馈':'再看一处证据';const p=document.createElement('p');p.textContent=m.feedback==='right'?s.right:s.wrong;fb.append(label,p);$('interaction').append(fb);
 if(m.feedback==='wrong'&&m.attempts<2)actions.append(button('再想一次',()=>{stop();m.feedback=null;m.selected=null;render();playCurrent();}));
 actions.append(button('继续讲解',next,'primary'));
 }else{const group=document.createElement('div');group.className='choices';group.setAttribute('role','group');group.setAttribute('aria-label','选择一个回答');s.options.forEach((text,i)=>{const b=button('',()=>{m.selected=i;render();$('interaction').querySelectorAll('.option')[i].focus();},'option'+(m.selected===i?' selected':''));const letter=document.createElement('span');letter.textContent=String.fromCharCode(65+i);b.append(letter,document.createTextNode(text));b.setAttribute('aria-pressed',String(m.selected===i));group.append(b);});$('interaction').append(group);actions.append(button('先看讲解',next,'quiet'));
 const submit=button('确认',()=>{m.attempts++;m.feedback=m.selected===s.correct?'right':'wrong';render();playCurrent();$('actions').lastElementChild.focus();},'primary');submit.disabled=m.selected===null;actions.append(submit);}
}else if(s.type==='reflect'){
 if(m.hint){const p=document.createElement('div');p.className='feedback';p.textContent=s.hint;$('interaction').append(p);}else if(s.hint)actions.append(button('给我提示',()=>{m.hint=true;render();playCurrent();}));
 actions.append(button(s.next||'看看示例',next,'primary'));
}else if(s.type==='task'&&s.task.kind==='mark'){
 if(!m.marked)m.marked={};
 const panel=document.createElement('div');panel.className='mark-task';
 const prompt=document.createElement('p');prompt.textContent=s.task.prompt;panel.append(prompt);
 const passage=document.createElement('div');passage.className='mark-passage';passage.setAttribute('role','group');passage.setAttribute('aria-label',s.task.prompt);
 s.task.parts.forEach((part,partIndex)=>{
  if(typeof part==='string'){passage.append(document.createTextNode(part));return;}
  const word=button(part.text,()=>{m.marked[partIndex]=!m.marked[partIndex];m.markResult=null;render();$('interaction').querySelectorAll('.mark-passage button')[s.task.parts.slice(0,partIndex+1).filter(item=>typeof item!=='string').length-1].focus();},'mark-word');
  word.setAttribute('aria-pressed',String(Boolean(m.marked[partIndex])));passage.append(word);
 });
 panel.append(passage);
 if(m.markResult){const feedback=document.createElement('p');feedback.className='feedback';feedback.textContent=m.markResult==='right'?s.right:s.wrong;panel.append(feedback);}
 $('interaction').append(panel);
 if(m.markResult==='right')actions.append(button(s.next||'继续讲解',next,'primary'));
 else actions.append(button('核对圈词',()=>{m.markResult=s.task.parts.every((part,partIndex)=>typeof part==='string'||Boolean(m.marked[partIndex])===Boolean(part.correct))?'right':'wrong';render();},'primary'));
}else if(s.type==='task'&&s.task.kind==='response'){
 const panel=document.createElement('div');panel.className='response-task';
 const prompt=document.createElement('p');prompt.textContent=s.task.prompt;panel.append(prompt);
 const phase=m.responsePhase||'draft';
 if(phase==='draft'){
  if(!m.responseValues)m.responseValues={};
  s.task.fields.forEach(field=>{const label=document.createElement('label');label.textContent=field.label;const input=document.createElement('textarea');input.rows=field.rows||2;input.value=m.responseValues[field.id]||'';input.addEventListener('input',()=>{m.responseValues[field.id]=input.value;});label.append(input);panel.append(label);});
  $('interaction').append(panel);
  const submit=button('提交首稿，再看对照',()=>{if(!s.task.fields.every(field=>(m.responseValues[field.id]||'').trim()))return;m.responseFirst={...m.responseValues};m.responseRevision={...m.responseValues};m.responsePhase='review';render();},'primary');
  actions.append(submit);
 }else if(phase==='review'){
  s.task.fields.forEach(field=>{const group=document.createElement('div');group.className='response-field';const title=document.createElement('strong');title.textContent=field.label;const first=document.createElement('p');first.textContent='你的首稿：'+m.responseFirst[field.id];const model=document.createElement('p');model.textContent='参考表达：'+field.model;const label=document.createElement('label');label.textContent='修订，也可保留原句';const input=document.createElement('textarea');input.rows=field.rows||2;input.value=m.responseRevision[field.id]||'';input.addEventListener('input',()=>{m.responseRevision[field.id]=input.value;});label.append(input);group.append(title,first,model,label);panel.append(group);});
  if(s.task.criteria?.length){const list=document.createElement('ul');s.task.criteria.forEach(item=>{const entry=document.createElement('li');entry.textContent=item;list.append(entry);});panel.append(list);}
  $('interaction').append(panel);
  actions.append(button('保存修订',()=>{if(!s.task.fields.every(field=>(m.responseRevision[field.id]||'').trim()))return;m.responseFinal={...m.responseRevision};m.responsePhase='done';render();},'primary'));
 }else{
  s.task.fields.forEach(field=>{const group=document.createElement('p');group.textContent=`${field.label}　首稿：${m.responseFirst[field.id]}　修订：${m.responseFinal[field.id]}`;panel.append(group);});
  $('interaction').append(panel);actions.append(button(s.next||'继续讲解',next,'primary'));
 }
}else if(s.type==='task'){
 if(m.feedback){const fb=document.createElement('div');fb.className='feedback';const label=document.createElement('strong');label.textContent=m.feedback==='right'?'判断反馈':'再看一处';const p=document.createElement('p');p.textContent=m.feedback==='right'?s.right:s.wrong;fb.append(label,p);$('interaction').append(fb);
 if(m.feedback==='wrong'&&m.attempts<2)actions.append(button('再做一次',()=>{stop();m.feedback=null;m.assigned={};m.input='';m.selectedChip=null;render();playCurrent();}));
 actions.append(button('继续讲解',next,'primary'));
 }else{
 const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;gap:10px';
 if(s.task.kind==='classify'){
  if(!m.assigned)m.assigned={};
  const chips=document.createElement('div');chips.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
  s.task.items.forEach((text,i)=>{if(m.assigned[i]!=null)return;const c=button(text,()=>{m.selectedChip=m.selectedChip===i?null:i;render();},'option'+(m.selectedChip===i?' selected':''));chips.append(c);});
  wrap.append(chips);
  const bins=document.createElement('div');bins.style.cssText='display:flex;gap:12px';
  s.task.bins.forEach((bin,bi)=>{const b=document.createElement('div');b.className='option';b.style.cssText='flex:1;min-height:72px;text-align:left;cursor:pointer';const t=document.createElement('strong');t.textContent=bin;b.append(t);Object.keys(m.assigned).forEach(i=>{if(m.assigned[i]!==bi)return;const d=document.createElement('div');d.textContent=s.task.items[i];d.style.cssText='border-top:1px solid currentColor;padding:2px 0;margin-top:4px';b.append(d);});b.addEventListener('click',()=>{if(m.selectedChip==null)return;m.assigned[m.selectedChip]=bi;m.selectedChip=null;render();});bins.append(b);});
  wrap.append(bins);$('interaction').append(wrap);
  const submit=button('确认',()=>{m.attempts++;m.feedback=s.task.items.every((_,i)=>m.assigned[i]===s.task.correct[i])?'right':'wrong';render();playCurrent();$('actions').lastElementChild.focus();},'primary');
  submit.disabled=Object.keys(m.assigned).length<s.task.items.length;actions.append(submit);
 }else if(s.task.kind==='input'){
  const p=document.createElement('p');p.className='subline';p.textContent=s.task.prompt;wrap.append(p);
  const input=document.createElement('input');input.type='text';input.placeholder=s.task.placeholder||'填数字';input.value=m.input||'';input.style.cssText='font-size:18px;padding:8px 12px;width:220px;border:1px solid #999;border-radius:6px';input.addEventListener('input',()=>{m.input=input.value;});wrap.append(input);
  $('interaction').append(wrap);
  const submit=button('确认',()=>{m.attempts++;const v=(m.input||'').replace(/[%％\s]/g,'');m.feedback=s.task.accept.some(a=>Math.abs(parseFloat(v)-parseFloat(a))<=(s.task.tolerance??0.01))?'right':'wrong';render();playCurrent();$('actions').lastElementChild.focus();},'primary');
  submit.disabled=!m.input;actions.append(submit);
 }
 }
}else if(s.type==='answer'){
 if(m.reveal)$('board').innerHTML='<p class="source-label">参考作答 · 非唯一表述</p>'+answerHtml(s.answer.slice(0,m.reveal))+(s.ch===1?'<p class="note">“观点”条目是在举出材料的评价，并非认可其真实性。</p>':'');
 if(!m.reveal)actions.append(button('整理好了，查看参考作答',()=>{m.reveal=s.staged?1:s.answer.length;render();playCurrent();}));
 else if(s.staged)actions.append(button('重听参考作答',()=>{m.reveal=1;render();playCurrent();}));
 if(s.extra)actions.append(button(s.extra.label||'补充说明',()=>modal(s.extra.title,s.extra.html)));
 actions.append(button(s.next||'继续',next,'primary'));
}else if(s.type==='finish'){
 actions.append(button('查看参考答案',()=>modal('参考作答',answers.map((a,i)=>'<details><summary>'+(answerLabels[i]||'参考作答'+(answers.length>1?' '+(i+1):''))+'</summary>'+answerHtml(a)+'</details>').join(''))));
 actions.append(button(window.HISTORY.audio===false?'从头再学':'从头重听',()=>{memory.forEach((_,memoryIndex)=>{memory[memoryIndex]={selected:null,attempts:0,feedback:null,hint:false,reveal:0};});go(0);},'primary'));
}else actions.append(button(index===0?'读完了，开始':'继续 →',next,'primary'));
}
$('sound').addEventListener('click',()=>{if(window.HISTORY.audio===false)return;if(!audio.paused||timer){clearTimeout(timer);timer=null;audio.pause();$('sound').textContent='继续';status('已暂停');}else if(pendingAdvance){const advance=pendingAdvance;pendingAdvance=null;advance();}else if(activeId&&!audio.ended&&!audio.error&&audio.currentTime>0){const t=token;audio.play().then(()=>{if(t===token){$('sound').textContent='暂停';status('讲解中');}}).catch(()=>{if(t===token)status('点击播放');});}else playCurrent();});
$('back').addEventListener('click',()=>go(index-1));$('original').addEventListener('click',()=>modal('原题 · 不含参考答案',original));
$('voice').addEventListener('click',()=>{subtitles=!subtitles;$('narration').hidden=!subtitles;$('voice').setAttribute('aria-pressed',String(subtitles));});
$('close-dialog').addEventListener('click',()=>$('dialog').close());$('dialog').addEventListener('close',()=>returnFocus?.focus());
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('lesson').requestFullscreen();}catch{modal('全屏提示','<p>当前环境不支持网页全屏，可在独立浏览器窗口查看。</p>');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出全屏':'全屏';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
if(window.HISTORY.audio===false){$('sound').hidden=true;status('文字讲解');}
render();
})();
