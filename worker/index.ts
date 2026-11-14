import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { streamSSE } from "hono/streaming";
import { type Bindings, bad, clean, csv, intIn, ownerOnly, rateLimited, sha256 } from "./lib";
import { topics } from "../src/topics";
import { automaticSources, modeLabel, sourceCatalog, sourceReviewDate } from "../shared/sources";
import type { EditorialRun } from "../shared/publication";
import { collectForRun, draftCandidate, excludeCandidate, publicIssue, publicIssues, publishRun, runDetail, selectCandidates, startRun } from "./editorial";
import { EditorialError } from "./collect";
import { automationOnly } from "./automation-auth";
const app=new Hono<{Bindings:Bindings}>().basePath('/api');
app.use('*',async(c,next)=>{await next();c.header('cache-control','no-store');c.header('x-robots-tag','noindex')});
app.use('*',bodyLimit({maxSize:16384,onError:c=>c.json({error:'입력한 내용이 너무 길어요.'},413)}));
app.get('/health',c=>c.json({ok:true}));
app.get('/issues',async c=>c.json(await publicIssues(c.env,intIn(c.req.query('limit'),1,48,24),intIn(c.req.query('offset'),0,100000,0),topics.includes(c.req.query('topic')??'')?c.req.query('topic')!:'전체')));
app.get('/issues/:slug',async c=>{const issue=await publicIssue(c.env,c.req.param('slug'));return issue?c.json({issue}):c.json({error:'글을 찾을 수 없어요.'},404)});
app.get('/sources.csv',c=>csv(c,'sai-sources.csv',['출처','주소','분야','주제','자료 성격','발행 주기','최근 발행 근거','접근 범위','수집 방식','추천','선정 이유','한계','확인 근거','피드','조사일'],sourceCatalog.map(s=>[s.name,s.url,s.group,s.topics.join('·'),s.kind,s.cadence,s.recent,s.access,modeLabel[s.mode],s.recommendation,s.strength,s.limitation,s.evidence,s.feed??'',sourceReviewDate])));
app.post('/subscribe',async c=>{if(await rateLimited(c,'subscribe',12,3600))return bad(c,'잠시 뒤 다시 신청해 주세요',429);const b=await c.req.json().catch(()=>({}));const email=clean(b.email,160).toLowerCase(),topic=clean(b.topic,30);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return bad(c,'이메일 주소를 확인해 주세요');if(b.consent!==true)return bad(c,'이메일 저장에 동의해 주세요');if(!topics.includes(topic))return bad(c,'주제를 확인해 주세요');const existing=await c.env.DB.prepare('SELECT id FROM subscriber WHERE email=?').bind(email).first();if(existing)return c.json({ok:true,message:'신청을 확인했어요. 이미 등록된 주소라면 기존 신청이 그대로 유지돼요.'});const token=crypto.randomUUID()+crypto.randomUUID();const result=await c.env.DB.prepare('INSERT OR IGNORE INTO subscriber(email,topic,token_hash) VALUES(?,?,?)').bind(email,topic,await sha256(token)).run();if(!result.meta.changes)return c.json({ok:true,message:'신청을 확인했어요. 이미 등록된 주소라면 기존 신청이 그대로 유지돼요.'});return c.json({ok:true,token,message:'구독 신청을 저장했어요.'},201)});
app.post('/unsubscribe',async c=>{if(await rateLimited(c,'unsubscribe',20,3600))return bad(c,'잠시 뒤 다시 시도해 주세요',429);const b=await c.req.json().catch(()=>({}));const token=clean(b.token,100);if(token.length<50)return bad(c,'구독 관리 링크가 올바르지 않아요');const row=await c.env.DB.prepare('SELECT id FROM subscriber WHERE token_hash=?').bind(await sha256(token)).first<{id:number}>();if(!row)return bad(c,'이미 취소했거나 유효하지 않은 링크예요',404);await c.env.DB.prepare('DELETE FROM subscriber WHERE id=?').bind(row.id).run();return c.json({ok:true})});
app.get('/admin/subscribers',ownerOnly,async c=>c.json({rows:(await c.env.DB.prepare('SELECT id,email,topic,created_at FROM subscriber ORDER BY id DESC').all()).results}));
app.delete('/admin/subscribers/:id',ownerOnly,async c=>{const id=Number(c.req.param('id'));if(!Number.isSafeInteger(id)||id<1)return bad(c,'잘못된 요청이에요');const r=await c.env.DB.prepare('DELETE FROM subscriber WHERE id=?').bind(id).run();if(!r.meta.changes)return bad(c,'이미 삭제된 신청이에요',404);return c.json({ok:true})});
app.get('/admin/subscribers.csv',ownerOnly,async c=>{const rows=(await c.env.DB.prepare('SELECT email,topic,created_at FROM subscriber ORDER BY id DESC').all<{email:string;topic:string;created_at:string}>()).results;return csv(c,'subscribers.csv',['이메일','주제','신청 시각'],rows.map(r=>[r.email,r.topic,r.created_at]))});

const editorial = new Hono<{Bindings:Bindings}>();
editorial.get('/status',async c=>{
  const runs=(await c.env.DB.prepare('SELECT * FROM editorial_run ORDER BY created_at DESC LIMIT 16').all<EditorialRun>()).results;
  return c.json({runs,sources:automaticSources.map(s=>({id:s.id,name:s.name})),schedule:{configured:!!c.env.AUTOMATION_REPOSITORY_ID,repository:c.env.AUTOMATION_REPOSITORY,cadence:'매주 화요일 오전 10:00 · 대한민국 시간',note:'외부 예약 작업은 지연될 수 있어요. 연결 설정과 실제 성공 이력은 별도로 확인해요.'}});
});
editorial.post('/start',async c=>{const body=await c.req.json<{kind?:string;target?:number}>().catch(()=>({kind:undefined,target:undefined}));const kind=c.req.path.includes('/automation/')?'scheduled':body.kind==='trial'?'trial':'weekly';return c.json({run:await startRun(c.env,kind,body.target??5)})});
editorial.get('/runs/:id',async c=>c.json(await runDetail(c.env,c.req.param('id'))));
editorial.post('/runs/:id/collect/:source',async c=>c.json(await collectForRun(c.env,c.req.param('id'),c.req.param('source'))));
editorial.post('/runs/:id/select',async c=>c.json(await selectCandidates(c.env,c.req.param('id'))));
editorial.post('/runs/:id/draft/:candidate',c=>streamSSE(c,async stream=>{
  try {
    await stream.writeSSE({event:'progress',data:JSON.stringify({stage:'원문을 확인하고 있어요.',characters:0})});
    const result=await draftCandidate(c.env,c.req.param('id'),c.req.param('candidate'),async characters=>{try{await stream.writeSSE({event:'progress',data:JSON.stringify({stage:characters?'요약을 작성하고 근거를 대조해요.':'공개 본문을 확인했어요. AI 요약을 시작해요.',characters})})}catch{/* 진행 표시가 끊겨도 저장 결과는 한 번만 확정한다. */}});
    await stream.writeSSE({event:'done',data:JSON.stringify(result)});
  } catch(error) {await stream.writeSSE({event:'failed',data:JSON.stringify({error:error instanceof EditorialError?error.message:'요약을 끝내지 못했어요. 이력에서 다시 실행해 주세요.'})});}
}));
editorial.post('/runs/:id/publish',async c=>c.json(await publishRun(c.env,c.req.param('id'))));
editorial.post('/runs/:id/exclude/:candidate',async c=>{const body=await c.req.json<{reason?:string}>().catch(()=>({reason:undefined}));return c.json(await excludeCandidate(c.env,c.req.param('id'),c.req.param('candidate'),clean(body.reason,250)||'관리자가 이번 회차 후보에서 제외했어요.'))});
app.use('/admin/editorial/*',ownerOnly);
app.use('/automation/*',automationOnly);
app.route('/admin/editorial',editorial);
app.route('/automation',editorial);
app.notFound(c=>c.json({error:'not found'},404));
app.onError((e,c)=>{if(e instanceof EditorialError)return c.json({error:e.message},409);console.error(JSON.stringify({event:'request_failed',kind:e.name}));return c.json({error:'처리를 마치지 못했어요. 잠시 뒤 다시 시도해 주세요.'},500)});

export default {
  async fetch(request:Request,env:Bindings,ctx:ExecutionContext) {
    const url=new URL(request.url),match=url.pathname.match(/^\/issues\/([^/]+)\/?$/);
    if(match&&(request.method==='GET'||request.method==='HEAD')) {
      const issue=await publicIssue(env,decodeURIComponent(match[1]));
      // /index.html은 /로 이동시키는 응답일 수 있다. 조건부 캐시 헤더도 새 HTML에 전달하지 않는다.
      const shell=await env.ASSETS.fetch(new Request(new URL('/',url),{headers:{accept:'text/html'}}));
      const title=issue?`${issue.title} | 사이`:'글을 찾을 수 없어요 | 사이';
      const description=issue?issue.intro.slice(0,160):'전체 글에서 노동법·HR·AI의 새 소식을 확인해 보세요.';
      const rewritten=new HTMLRewriter().on('title',{element(e){e.setInnerContent(title)}})
        .on('meta[name="description"],meta[property="og:description"]',{element(e){e.setAttribute('content',description)}})
        .on('meta[property="og:title"]',{element(e){e.setAttribute('content',title)}})
        .on('meta[property="og:url"]',{element(e){e.setAttribute('content',`${env.PUBLIC_ORIGIN}/issues/${encodeURIComponent(match[1])}`)}})
        .on('meta[property="og:type"]',{element(e){e.setAttribute('content','article')}}).transform(shell);
      const headers=new Headers(rewritten.headers);headers.set('cache-control','no-store');headers.delete('etag');headers.delete('last-modified');headers.delete('content-length');
      return new Response(request.method==='HEAD'?null:rewritten.body,{status:issue?200:404,headers});
    }
    if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
    return app.fetch(request,env,ctx);
  },
} satisfies ExportedHandler<Bindings>;
