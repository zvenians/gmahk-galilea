import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/backend-release-needed.sh',import.meta.url));
const root=fs.mkdtempSync(path.join(os.tmpdir(),'galilea-release-'));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const commit=()=>{git('add','-A');git('commit','-m','Fixture');return git('rev-parse','HEAD');};
function decision(event,before,after,manual='false'){
  const output=path.join(root,'output');fs.writeFileSync(output,'');
  execFileSync('bash',[script],{cwd:root,env:{...process.env,EVENT_NAME:event,BEFORE_SHA:before,AFTER_SHA:after,REQUEST_DEPLOY:manual,GITHUB_OUTPUT:output},stdio:['ignore','pipe','pipe']});
  const result=fs.readFileSync(output,'utf8').trim();fs.unlinkSync(output);return result;
}
try{
  git('init');git('config','user.name','Test');git('config','user.email','test@example.invalid');
  fs.mkdirSync(path.join(root,'apps-script-backend'));
  fs.writeFileSync(path.join(root,'apps-script-backend','Admin.gs'),'original');
  fs.writeFileSync(path.join(root,'index.html'),'original');const base=commit();
  fs.writeFileSync(path.join(root,'index.html'),'new layout');const frontend=commit();
  assert.equal(decision('push',base,frontend),'backend_changed=false','Frontend changes do not release Apps Script');
  fs.writeFileSync(path.join(root,'apps-script-backend','Admin.gs'),'updated');const backend=commit();
  assert.equal(decision('push',base,backend),'backend_changed=true','Compare the full push, not only its last commit');
  assert.equal(decision('pull_request',base,backend),'backend_changed=false','PRs never deploy backend');
  fs.unlinkSync(path.join(root,'apps-script-backend','Admin.gs'));const deleted=commit();
  assert.equal(decision('push',backend,deleted),'backend_changed=true','Backend deletions require release');
  fs.writeFileSync(path.join(root,'.claspignore'),'excluded');const config=commit();
  assert.equal(decision('push',deleted,config),'backend_changed=true','Clasp exclusions affect source releases');
  assert.equal(decision('workflow_dispatch','',''),'backend_changed=false','Manual validation defaults to no deployment');
  assert.equal(decision('workflow_dispatch','','','true'),'backend_changed=true','Explicit manual backend release remains available');
  assert.equal(decision('push','0'.repeat(40),base),'backend_changed=true','Initial push releases backend');
  assert.throws(()=>decision('push','missing',frontend),'Missing history must fail rather than silently skip deployment');
  assert.throws(()=>decision('push','f'.repeat(40),frontend),'Unresolvable commit range must fail');
  console.log('Backend release gate verified: frontend-only, multi-commit push, deletion, config, PR, manual, initial push and invalid history.');
}finally{fs.rmSync(root,{recursive:true,force:true});}
