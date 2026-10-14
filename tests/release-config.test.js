import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const manifest=JSON.parse(fs.readFileSync('src/manifest.json','utf8'));
const env=fs.readFileSync('.env.production','utf8');
const api=env.match(/^VITE_API_BASE=(.+)$/m)?.[1].trim();
test('release config contains a valid WeChat AppID and HTTPS API origin',()=>{
  assert.match(manifest['mp-weixin'].appid,/^wx[0-9a-f]{16}$/);
  assert.equal(manifest['mp-weixin'].appid,'wx2249679a29811468');
  assert.equal(manifest['mp-weixin'].setting.urlCheck,true);
  const url=new URL(api);
  assert.equal(url.protocol,'https:');
  assert.equal(url.origin,api);
  assert.equal(url.username,'');
  assert.equal(url.password,'');
});
test('WeChat build uses configured AppID and production API',()=>{
  const dir='dist/build/mp-weixin';
  const project=JSON.parse(fs.readFileSync(path.join(dir,'project.config.json'),'utf8'));
  assert.equal(project.appid,manifest['mp-weixin'].appid);
  assert.equal(project.setting.urlCheck,true);
  let found=false;
  function visit(folder){
    for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
      const file=path.join(folder,entry.name);
      if(entry.isDirectory()) visit(file);
      else if(file.endsWith('.js') && fs.readFileSync(file,'utf8').includes(api)) found=true;
    }
  }
  visit(dir);
  assert.ok(found,'production API origin must be embedded in compiled request code');
});
