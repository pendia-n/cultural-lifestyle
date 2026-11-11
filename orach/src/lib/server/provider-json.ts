export async function providerJson(response:Response,maxBytes=1800000):Promise<Record<string,unknown>>{
 const length=Number(response.headers.get('content-length'));
 if(length>maxBytes){await response.body?.cancel();throw Error('Provider response exceeds research storage limit');}
 if(!response.body)throw Error('Provider returned no response body');
 const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,text='';
 try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>maxBytes){await reader.cancel();throw Error('Provider response exceeds research storage limit');}text+=decoder.decode(part.value,{stream:true});}text+=decoder.decode();}finally{reader.releaseLock();}
 const value=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Provider returned an invalid research envelope');return value;
}
