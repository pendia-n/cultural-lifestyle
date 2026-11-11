import app from './generated-app-worker.js';
import {refresh} from './scripts/research.ts';
import {runCitySection} from './src/lib/server/discovery-task.ts';
import {collectCityImages} from './src/lib/server/city-images.ts';
export default {
 fetch(request,env,ctx){return app.fetch(request,env,ctx);},
 scheduled(controller,env,ctx){ctx.waitUntil(refresh(env));},
 async queue(batch,env){await Promise.all(batch.messages.map(async message=>{try{if(message.body.section==='images')await collectCityImages(env,message.body);else await runCitySection(env,message.body);message.ack();}catch{message.retry({delaySeconds:60});}}));}
};
