import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {createHash, randomBytes, randomUUID, scrypt as derive, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync, chmodSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const scrypt=promisify(derive);
const origin=new URL(process.env.SWITCHBOARD_ORIGIN || 'http://localhost:8787');
if (!['http:','https:'].includes(origin.protocol) || origin.href!==origin.origin+'/' ||
    (origin.protocol==='http:' && !['localhost','127.0.0.1','[::1]'].includes(origin.hostname))) {
    throw new Error('Set SWITCHBOARD_ORIGIN to the exact HTTPS origin, or use loopback for local testing.');
}
const dist=new URL('../dist/',import.meta.url);
const html=readFileSync(new URL('index.html',dist),'utf8').replace('</head>','<meta name="switchboard-mode" content="connected"></head>');
const database=resolve(process.env.SWITCHBOARD_DB || 'data/switchboard.sqlite');
process.umask(0o077);
mkdirSync(dirname(database),{recursive:true});
const db=new DatabaseSync(database);
chmodSync(database,0o600);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Owner','Admin','Member')), active INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS single_owner ON members(role) WHERE role='Owner';
CREATE TABLE IF NOT EXISTS sessions (
  hash TEXT PRIMARY KEY, member TEXT NOT NULL REFERENCES members(id), expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_member ON sessions(member);
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY, hash TEXT UNIQUE NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL,
  expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL, version INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, time TEXT NOT NULL
);
`);

const day=86400_000;
const cookieName=origin.protocol==='https:'?'__Host-switchboard':'switchboard';
const hash=value=>createHash('sha256').update(value).digest('hex');
const token=()=>randomBytes(32).toString('base64url');
const cookie=(value,age)=>cookieName+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+age+(origin.protocol==='https:'?'; Secure':'');
const tokenPattern=/^[\w-]{43}$/;
const members=()=>db.prepare('SELECT id,name,email,role,active FROM members ORDER BY name,id').all();
const log=(actor,action,detail)=>db.prepare('INSERT INTO activity(actor,action,detail,time) VALUES (?,?,?,?)').run(actor,action,detail,new Date().toISOString());
class HttpError extends Error {
    constructor(status,message){super(message);this.status=status;}
}
function requireValue(condition,status,message){
    if(!condition) throw new HttpError(status,message);
}
function field(value,max){
    requireValue(typeof value==='string'&&value.trim().length>0&&value.trim().length<=max,400,'Check the required fields and their length.');
    return value.trim();
}
function email(value){
    const clean=field(value,254).toLowerCase();
    requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean),400,'Enter a valid email address.');
    return clean;
}
function password(value){
    requireValue(typeof value==='string'&&value.length>=12&&value.length<=128,400,'Use a password between 12 and 128 characters.');
    return value;
}
async function pack(value,salt=randomBytes(16).toString('hex')){
    return salt+':'+(await scrypt(value,salt,64)).toString('hex');
}
const dummy=await pack(token());
function transaction(write){
    db.exec('BEGIN IMMEDIATE');
    try{const value=write();db.exec('COMMIT');return value;}
    catch(error){db.exec('ROLLBACK');throw error;}
}
if(!db.prepare("SELECT id FROM members WHERE role='Owner'").get()){
    const address=process.env.SWITCHBOARD_OWNER_EMAIL, initial=process.env.SWITCHBOARD_OWNER_PASSWORD;
    if(!address||!initial) throw new Error('Set SWITCHBOARD_OWNER_EMAIL and SWITCHBOARD_OWNER_PASSWORD for the first startup.');
    const encoded=await pack(password(initial));
    transaction(()=>{
        if(db.prepare("SELECT id FROM members WHERE role='Owner'").get())return;
        db.prepare("INSERT INTO members(id,name,email,password,role) VALUES (?,?,?,?,'Owner')")
            .run(randomUUID(),field(process.env.SWITCHBOARD_OWNER_NAME||'Workspace Owner',80),email(address),encoded);
    });
}

const limits=new Map();
const interval=setInterval(()=>{
    const now=Date.now();
    for(const [key,value] of limits) if(value.until<=now) limits.delete(key);
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(now);
},60_000);
interval.unref();
function limit(key,max,window){
    const now=Date.now();
    const previous=limits.get(key);
    if(!previous||previous.until<=now){
        requireValue(limits.size<10_000,429,'Too many attempts. Try again shortly.');
        limits.set(key,{count:1,until:now+window});return;
    }
    requireValue(previous.count<max,429,'Too many attempts. Try again shortly.');
    previous.count++;
}
async function body(req){
    requireValue(req.headers['content-type']?.split(';')[0]==='application/json',415,'Send JSON.');
    let size=0;
    const chunks=[];
    try{
        for await(const chunk of req.iterator({destroyOnReturn:false})){
            size+=chunk.length;
            requireValue(size<=16_384,413,'Request too large.');
            chunks.push(chunk);
        }
        const value=JSON.parse(Buffer.concat(chunks).toString());
        requireValue(value&&typeof value==='object'&&!Array.isArray(value),400,'Send a JSON object.');
        return value;
    }catch(error){
        if(error instanceof HttpError)throw error;
        throw new HttpError(400,'Invalid JSON request.');
    }
}
function session(req){
    const raw=req.headers.cookie?.split(';').map(part=>part.trim()).find(part=>part.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    if(!raw||!tokenPattern.test(raw))return null;
    return db.prepare(`SELECT members.id,name,email,role,sessions.hash AS session
      FROM sessions JOIN members ON members.id=sessions.member
      WHERE sessions.hash=? AND expires>? AND active=1`).get(hash(raw),Date.now())||null;
}
function sessionCookie(member,res){
    const raw=token();
    db.prepare('INSERT INTO sessions (hash,member,expires) VALUES (?,?,?)').run(hash(raw),member,Date.now()+7*day);
    res.setHeader('Set-Cookie',cookie(raw,7*86400));
}
function publicMember({id,name,email,role}){return {id,name,email,role};}
function json(res,status,value){
    res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify(value));
}
const roles=['Admin','Member'];
const stages=['Backlog','In progress','Review','Done'];
const priorities=['Normal','Low','High'];
const statuses=['Open','In progress','Resolved'];
function allowed(value,options){
    requireValue(options.includes(value),400,'Choose an available option.');
    return value;
}
function normalizeRecord(kind,input,previous){
    const assignee=typeof input.ownerId==='string'?input.ownerId:'';
    requireValue(!assignee||assignee===previous?.ownerId||db.prepare('SELECT id FROM members WHERE id=? AND active=1').get(assignee),400,'Choose an active team member.');
    const result={title:field(input.title,160),ownerId:assignee,priority:allowed(input.priority,priorities)};
    if(kind==='tickets')return {...result,status:allowed(input.status,statuses)};
    const date=field(input.date,10);
    const parsed=new Date(date+'T00:00:00Z');
    requireValue(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(+parsed)&&parsed.toISOString().slice(0,10)===date,400,'Choose a valid due date.');
    return {...result,stage:allowed(input.stage,stages),date};
}
function readRecords(kind){
    const directory=new Map(members().map(member=>[member.id,member.name]));
    return db.prepare('SELECT id,data,version FROM records WHERE kind=? ORDER BY rowid DESC').all(kind).map(row=>{
        const record=JSON.parse(row.data);
        return {...record,id:row.id,version:row.version,owner:directory.get(record.ownerId)||'Unassigned'};
    });
}

async function api(req,res,path){
    const method=req.method;
    const actor=session(req);
    if(method!=='GET'){
        requireValue(req.headers.origin===origin.origin,403,'This request must come from the workspace origin.');
        limit('entry:'+req.socket.remoteAddress,240,60_000);
    }
    if(path==='/session'&&method==='GET')return json(res,200,{member:actor?publicMember(actor):null});
    if(path==='/sign-in'&&method==='POST'){
        limit('login:'+req.socket.remoteAddress,30,15*60_000);
        const input=await body(req);
        const address=email(input.email);
        limit('account:'+address,12,15*60_000);
        const value=typeof input.password==='string'?input.password:'';
        requireValue(value.length<=128,400,'Invalid credentials.');
        const member=db.prepare('SELECT * FROM members WHERE email=? AND active=1').get(address);
        const encoded=member?.password||dummy;
        const checked=await pack(value,encoded.split(':')[0]);
        requireValue(timingSafeEqual(Buffer.from(checked),Buffer.from(encoded))&&member,401,'The email or password is incorrect.');
        requireValue(db.prepare('SELECT id FROM members WHERE id=? AND active=1').get(member.id),401,'The email or password is incorrect.');
        if(actor)db.prepare('DELETE FROM sessions WHERE hash=?').run(actor.session);
        sessionCookie(member.id,res);
        return json(res,200,{member:publicMember(db.prepare('SELECT id,name,email,role FROM members WHERE id=?').get(member.id))});
    }
    if(path==='/accept'&&method==='POST'){
        limit('invite:'+req.socket.remoteAddress,25,15*60_000);
        const input=await body(req);
        requireValue(typeof input.token==='string'&&tokenPattern.test(input.token),400,'This invitation is invalid or has expired.');
        const name=field(input.name,80);
        const encoded=await pack(password(input.password));
        const member=transaction(()=>{
            const invite=db.prepare('SELECT * FROM invitations WHERE hash=? AND used=0 AND expires>?').get(hash(input.token),Date.now());
            requireValue(invite,400,'This invitation is invalid or has expired.');
            requireValue(!db.prepare('SELECT id FROM members WHERE email=?').get(invite.email),409,'This email already has an account.');
            const member={id:randomUUID(),name,email:invite.email,role:invite.role};
            db.prepare('INSERT INTO members(id,name,email,password,role) VALUES (?,?,?,?,?)').run(member.id,name,member.email,encoded,member.role);
            db.prepare('UPDATE invitations SET used=1 WHERE id=?').run(invite.id);
            log(name,'Joined the workspace',member.email);
            return member;
        });
        if(actor)db.prepare('DELETE FROM sessions WHERE hash=?').run(actor.session);
        sessionCookie(member.id,res);
        return json(res,201,{member});
    }
    requireValue(actor,401,'Sign in to access the workspace.');
    if(path==='/sign-out'&&method==='POST'){
        db.prepare('DELETE FROM sessions WHERE hash=?').run(actor.session);
        res.setHeader('Set-Cookie',cookie('',0));
        return json(res,200,{});
    }
    if(path==='/team'&&method==='GET'){
        const list=members();
        return json(res,200,{members:actor.role==='Member'?list.filter(m=>m.active).map(({id,name,role,active})=>({id,name,role,active})):list});
    }
    if(path==='/activity'&&method==='GET'){
        requireValue(actor.role!=='Member',403,'Only workspace administrators can view activity.');
        return json(res,200,{activity:db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 100').all()});
    }
    if(path==='/invitations'&&method==='POST'){
        const input=await body(req);
        const address=email(input.email), role=allowed(input.role,roles);
        transaction(()=>{
            const current=session(req);
            requireValue(current&&current.role!=='Member'&&(current.role==='Owner'||role==='Member'),403,'You cannot invite this role.');
            requireValue(!db.prepare('SELECT id FROM members WHERE email=?').get(address),409,'This email already has an account.');
            const raw=token();
            db.prepare('UPDATE invitations SET used=1 WHERE email=? AND used=0').run(address);
            db.prepare('INSERT INTO invitations(id,hash,email,role,expires) VALUES (?,?,?,?,?)').run(randomUUID(),hash(raw),address,role,Date.now()+2*day);
            log(current.name,'Created an invitation',address+' · '+role);
            input.link=origin.origin+'/#/accept/'+raw;
        });
        return json(res,201,{link:input.link});
    }
    const memberMatch=path.match(/^\/team\/([\w-]+)$/);
    if(memberMatch&&method==='PATCH'){
        const input=await body(req);
        const active=input.active;
        requireValue(typeof active==='boolean',400,'Choose an account status.');
        const role=allowed(input.role,roles);
        transaction(()=>{
            const current=session(req);
            requireValue(current?.role==='Owner',403,'Only the Owner can change roles or account status.');
            const member=db.prepare('SELECT * FROM members WHERE id=?').get(memberMatch[1]);
            requireValue(member&&member.role!=='Owner',404,'This account cannot be changed.');
            if(member.role===role&&Boolean(member.active)===active)return;
            db.prepare('UPDATE members SET role=?,active=? WHERE id=?').run(role,Number(active),member.id);
            if(!active)db.prepare('DELETE FROM sessions WHERE member=?').run(member.id);
            log(current.name,'Updated a member',member.email+' · '+role+' · '+(active?'Active':'Inactive'));
        });
        return json(res,200,{members:members()});
    }
    const recordMatch=path.match(/^\/(board|tickets)(?:\/([\w-]+))?$/);
    if(recordMatch){
        const [,kind,key]=recordMatch;
        if(method==='GET'&&!key)return json(res,200,{records:readRecords(kind),assignees:members().map(({id,name,active})=>({id,name,active}))});
        const creating=method==='POST'&&!key;
        if(creating||(key&&['PATCH','DELETE'].includes(method))){
            const input=await body(req);
            transaction(()=>{
                const current=session(req);
                requireValue(current,401,'Sign in to access the workspace.');
                const label=kind==='board'?'task':'ticket';
                if(creating){
                    const record=normalizeRecord(kind,input);
                    db.prepare('INSERT INTO records(id,kind,data,version) VALUES (?,?,?,1)').run(randomUUID(),kind,JSON.stringify(record));
                    log(current.name,'Created '+label,record.title);
                    return;
                }
                const row=db.prepare('SELECT data,version FROM records WHERE id=? AND kind=?').get(key,kind);
                requireValue(row,404,'This record no longer exists.');
                requireValue(row.version===input.version,409,'A teammate changed this record. Refresh and try again.');
                const previous=JSON.parse(row.data);
                if(method==='DELETE'){
                    requireValue(current.role!=='Member',403,'Only workspace administrators can delete records.');
                    db.prepare('DELETE FROM records WHERE id=? AND kind=?').run(key,kind);
                    log(current.name,'Deleted '+label,previous.title);
                }else{
                    const record=normalizeRecord(kind,input,previous);
                    db.prepare('UPDATE records SET data=?,version=version+1 WHERE id=? AND kind=?').run(JSON.stringify(record),key,kind);
                    log(current.name,'Updated '+label,record.title);
                }
            });
            return json(res,creating?201:200,{records:readRecords(kind),assignees:members().map(({id,name,active})=>({id,name,active}))});
        }
    }
    throw new HttpError(404,'This endpoint does not exist.');
}

const types={js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',webp:'image/webp',png:'image/png',svg:'image/svg+xml'};
const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'");
    try{
        const path=new URL(req.url,origin).pathname;
        if(path.startsWith('/api/'))return await api(req,res,path.slice(4));
        requireValue(['GET','HEAD'].includes(req.method),405,'Method unavailable.');
        if(path==='/'){
            res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
            return res.end(req.method==='HEAD'?undefined:html);
        }
        const file=path.match(/^\/(?:assets|art)\/[a-zA-Z0-9_.-]+\.(js|css|webp|png|svg)$/);
        requireValue(file,404,'Page unavailable.');
        let bytes;
        try{bytes=readFileSync(new URL(path.slice(1),dist));}
        catch(error){if(error.code==='ENOENT')throw new HttpError(404,'Asset unavailable.');throw error;}
        res.writeHead(200,{'Content-Type':types[file[1]]});
        return res.end(req.method==='HEAD'?undefined:bytes);
    }catch(error){
        if(!(error instanceof HttpError))console.error(error);
        if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'The workspace could not complete this request.'});
        else res.end();
    }
});
server.listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log('Switchboard workspace: '+origin.origin));
