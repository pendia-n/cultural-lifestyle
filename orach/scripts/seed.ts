import { cities, manchester } from '../src/lib/catalog.ts';
const quote = (s: string) => "'" + s.replaceAll("'", "''") + "'";
let sql = cities
	.map(
		(c) =>
			`INSERT INTO cities(slug,name,country,status) VALUES(${quote(c.slug)},${quote(c.name)},${quote(c.country)},${quote(c.status)}) ON CONFLICT(slug) DO NOTHING;`
	)
	.join('\n');
sql +=
	'\n' +
	manchester
		.map(
			(e) =>
				`INSERT INTO city_entries(id,city_slug,section,data,published) VALUES(${quote(e.id)},'manchester',${quote(e.section)},${quote(JSON.stringify(e))},0) ON CONFLICT(id) DO NOTHING;`
		)
		.join('\n');
console.log(sql);
