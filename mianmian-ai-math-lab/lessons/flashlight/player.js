/* Adapted from the archived chemistry player's pause/feedback/shared-explanation
   model. Lesson data, policies, privacy and event export are now configurable. */
'use strict';
const $=s=>document.querySelector(s), video=$('#video'), voice=$('#voice');
let lesson, active=null, selected=null, attempts=0, mode='ask', serial=0, guard=false, hints=0, busy=false;
const handled=new Set(), events=[];
let session=crypto.randomUUID(), replayCount=0;
const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function event(type,details={}){events.push({type,at:new Date().toISOString(),media_time:Math.round(video.currentTime*100)/100,replay:replayCount,...details});}
function button(label,fn,primary=false,disabled=false){const b=document.createElement('button');b.textContent=label;b.onclick=fn;b.className=primary?'primary':'';b.disabled=disabled;return b;}
function stopVoice(){serial++;voice.onended=null;voice.pause();voice.removeAttribute('src');voice.load();busy=false;}
function paused(){return $('#dialog').open||$('#export-dialog').open;}
function draw(){
 $('#panel').hidden=!active;if(!active)return;
 $('#phase').textContent=active.kind==='transfer'?'换个情境再想想（学习后的检验）':'视频暂停 · 不限思考时间';
 $('#prompt').textContent=active.prompt;$('#choices').replaceChildren();$('#actions').replaceChildren();
 if(mode==='ask'){
   $('#feedback').textContent='先想一想，再选择并提交。';
   active.options.forEach((o,i)=>{const b=button(o,()=>{selected=i;draw();});b.setAttribute('aria-pressed',String(i===selected));$('#choices').append(b);});
   $('#actions').append(button('提交答案',submit,true,selected===null),button('暂时不会，看讲解',()=>finish('skip')));
 }else{
   $('#feedback').textContent=mode==='correct'?active.feedback.correct:active.feedback.wrong[selected];
   if(mode==='wrong'&&attempts<active.maxAttempts)$('#actions').append(button('再想一次',()=>{stopVoice();mode='ask';selected=null;draw();}));
   $('#actions').append(button('继续看讲解',()=>finish('continue'),true));
 }
}
async function speak(src){if(!src)return;stopVoice();const token=serial;busy=true;voice.src=src;voice.onended=()=>{if(token===serial)busy=false;};try{await voice.play();}catch{if(token===serial){busy=false;$('#status').textContent='提示音未能播放，文字反馈仍可阅读，可以继续。';}}}
function submit(){
 if(!active||mode!=='ask'||selected===null)return;
 attempts++;mode=selected===active.answer?'correct':'wrong';
 event('answer',{question_id:active.id,problem_id:active.problem_id,choice:selected,attempt:attempts,correct:mode==='correct',support:hints?'after_hint':active.exposure,explanation_seen_before:replayCount>0});
 if(mode==='wrong'){hints++;event('hint',{question_id:active.id});}
 draw();const src=active.feedbackAudio?.[mode];if(src)speak(src);
}
function stopAt(q){stopVoice();video.pause();active=q;selected=null;attempts=0;hints=0;mode='ask';guard=true;video.currentTime=q.at;guard=false;event('checkpoint',{question_id:q.id});draw();$('#panel').focus({preventScroll:true});}
async function play(){if(active||paused())return;try{await video.play();$('#start').hidden=true;$('#status').textContent='';}catch{$('#status').textContent='请点击播放继续；如果视频未加载，请按使用说明启动本地服务。';}}
function finish(reason){if(!active)return;event(reason,{question_id:active.id});event('explanation',{question_id:active.id});handled.add(active.id);active=null;stopVoice();draw();play();}
function tick(){
 if(!lesson||guard)return;
 if(!active&&!paused()){const q=lesson.checkpoints.find(q=>!handled.has(q.id)&&video.currentTime>=q.at);if(q)stopAt(q);}
 $('#clock').textContent=`${fmt(video.currentTime)} / ${fmt(Number.isFinite(video.duration)?video.duration:lesson.duration)}`;
}
function pauseAll(){video.pause();stopVoice();}
function restart(){if(!lesson)return;pauseAll();active=null;handled.clear();selected=null;attempts=0;hints=0;replayCount++;event('restart');video.currentTime=0;draw();$('#start').hidden=false;$('#status').textContent='已回到开始；本次记录保留并标记为重看。';}
function exportRecord(kind){if(!lesson)return;event('export_requested',{record_kind:kind});const data={schema_version:1,record_kind:kind,lesson_id:lesson.id,lesson_revision:lesson.revision,session_id:session,exported_at:new Date().toISOString(),events:[...events]};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${lesson.id}-${kind}-${session}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#export-dialog').close();$('#status').textContent='记录已导出到本机，没有上传；请家长核对来源后再使用。';}
video.addEventListener('timeupdate',tick);
video.addEventListener('seeking',()=>{if(guard)return;if(active&&Math.abs(video.currentTime-active.at)>.12){guard=true;video.currentTime=active.at;guard=false;video.pause();}else tick();});
video.addEventListener('play',()=>{if(active||paused())video.pause();});
video.addEventListener('ended',()=>{tick();if(!active){event('finished');$('#status').textContent='讲解结束。可以导出记录或从头重看；是否掌握还需结合真实解释与复测。';}});
video.addEventListener('error',()=>{$('#status').textContent='视频加载失败，请检查lesson.json中的媒体文件和本地服务。';});
voice.addEventListener('error',()=>{busy=false;$('#status').textContent='提示音加载失败，仍可阅读反馈并继续。';});
$('#start').onclick=play;
$('#toggle').onclick=()=>{if(active){if(voice.getAttribute('src')&&!paused()){voice.paused?voice.play().catch(()=>{}):voice.pause();}}else video.paused?play():video.pause();};
$('#restart').onclick=restart;
$('#original').onclick=()=>{pauseAll();$('#dialog').showModal();event('view_original');};
$('#close').onclick=()=>$('#dialog').close();
$('#full').onclick=()=>{const task=document.fullscreenElement?document.exitFullscreen():$('#player').requestFullscreen();task?.catch(()=>{$('#status').textContent='当前浏览器未允许全屏，仍可在窗口中使用。';});};
$('#export').onclick=()=>{pauseAll();$('#export-dialog').showModal();};
$('#export-learner').onclick=()=>exportRecord('learner');$('#export-test').onclick=()=>exportRecord('test');$('#export-cancel').onclick=()=>$('#export-dialog').close();
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll();});window.addEventListener('pagehide',pauseAll);
fetch('lesson.json').then(r=>{if(!r.ok)throw Error('课件配置缺失');return r.json();}).then(x=>{
 lesson=x;document.title=x.title;$('#title').textContent=x.title;$('#problem').textContent=x.problem;video.src=x.media;if(x.poster)video.poster=x.poster;
 if(x.checkpoints.some((q,i)=>!Number.isFinite(q.at)||q.at<0||q.at>=x.duration||i&&q.at<=x.checkpoints[i-1].at))throw Error('暂停点配置不合法');
 event('session_start');tick();
}).catch(e=>{$('#title').textContent='课件尚未加载';$('#status').textContent=e.message+'。请按使用说明通过本地HTTP服务打开。';$('#start').disabled=true;});
