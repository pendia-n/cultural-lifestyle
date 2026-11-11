export function sourceExcerpt(text:string):string{
 const cleaned=text.replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/<[^>]*>/g,' ').replace(/^[#>*\s]+/gm,'').replace(/[*_`]+/g,'').replace(/\s+/g,' ').trim();
 if((cleaned.match(/\b(?:login|log in|sign in|subscribe|navigation|cookie|skip to content|homepage|drawer)\b/gi)||[]).length>=2)return '';
 return cleaned.split(/\s+/).filter(Boolean).slice(0,25).join(' ');
}
