import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname,resolve,relative,isAbsolute } from 'node:path';
import { buildWeb } from './build-web.mjs';
await buildWeb();
const root=resolve('web-dist');
const port=Number(process.env.PORT??4173);
createServer(async(req,res)=>{
  try {
    const url=new URL(req.url??'/',`http://127.0.0.1:${port}`);
    const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    const rel=relative(root,path);
    if(rel.startsWith('..')||isAbsolute(rel)){res.writeHead(403);res.end('Forbidden');return;}
    const data=await readFile(path);
    const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.map':'application/json'}[extname(path)]??'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`GRID-RIFT ready: http://127.0.0.1:${port}`));
