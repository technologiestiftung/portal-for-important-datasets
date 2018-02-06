let fs = require('fs'),
  express = require('express'),
  turf = require('turf'),
  config = require('./config.json')

let app = express()

let dataFolder = __dirname + '/data/'

app.use('/data', express.static(dataFolder))
app.use('/assets', express.static(__dirname + '/assets/'))

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
  next();
});

app.get('/robot.txt', function(req, res) {
	res.sendFile(__dirname + '/assets/robot.txt')
})

app.get('/'+config.secret+'/update', function(req, res) {
  	
	let datasets = []

	fs.readdirSync(dataFolder).forEach(file => {
	  	if(file != '.DS_Store' && file.length > 2){

	  		if (fs.existsSync(dataFolder+file+'/meta.json')) {

	  			let meta = JSON.parse(fs.readFileSync(dataFolder+file+'/meta.json', 'utf8'))

	  			datasets.push({
	  				file:file,
	  				meta:meta
	  			})

	  		}

		}
	})

	let index_html = {de:fs.readFileSync(__dirname + '/templates/index.html', 'utf8'), en: fs.readFileSync(__dirname + '/templates/index_en.html', 'utf8')},
		data_html = {de:fs.readFileSync(__dirname + '/templates/data.html', 'utf8'), en: fs.readFileSync(__dirname + '/templates/data_en.html', 'utf8')},
		default_meta = {de:JSON.parse(fs.readFileSync(__dirname + '/templates/default.json', 'utf8')), en:JSON.parse(fs.readFileSync(__dirname + '/templates/default_en.json', 'utf8'))},
		datalist = {de:'', en:''}

	let langs = ['de','en']

	let filters = {
		type:['geo','temporal'],
		years:[],
		geolevel:[],
		keywords:{de:[],en:[]},
		formats:[],
		provider:[],
		license:[]
	}

	let ignores = ['dcat_meta.json','meta.json', '.DS_Store', 'dcat_en.json', 'dcat.json', 'preview.jpg', 'thumb.jpg'],
		fileTrans = {
			geojson:'GeoJSON',
			shp:'ESRI Shapefile',
			dump:'Postgres Dump',
			sqlite:'SQLite Dump'
		},
		geoTrans = {
			de:{
				bezirke:'Bezirke',
				bloecke:'Blöcke',
				flure:'Flure',
				flurstuecke:'Flurstücke',
				gebaeude:'Gebäude',
				lor_bezirksregionen:'LOR-Bezirksregionen',
				lor_planungsraeume:'LOR-Planungsräume',
				lor_prognoseraeume:'LOR-Prognoseräuem',
				citydistricts:'Stadtteile',
				plz:'Postleitzahlen',
				strassen:'Straßen',
				teilverkehrszellen:'Teilverkehrszellen',
				verkehrszellen:'Verkehrszellen'
			},
			en:{
				bezirke:'Districts',
				bloecke:'Blocks',
				flure:'Corridors',
				flurstuecke:'Sub-Corridors',
				gebaeude:'Buildings',
				lor_bezirksregionen:'LOR-Districtregions',
				lor_planungsraeume:'LOR-Planningareas',
				lor_prognoseraeume:'LOR-Predictionareas',
				citydistricts:'City parts',
				plz:'Postcodes',
				strassen:'Streets',
				teilverkehrszellen:'Sub-Traffic-Cells',
				verkehrszellen:'Traffic-Cells'
			}
		},
		licenseTrans = {
			de:{other:'Andere'},
			en:{other:'Other'}
		};

	let titles = {de:[],en:[]}

	datasets.forEach((d,di)=>{
		let isGeo = false, isGeoJson = false, files = []

		let classes = ''

		fs.readdirSync(dataFolder+'/'+d.file).forEach(file => {
	  		if(file.length > 2 && ignores.indexOf(file) == -1){
	  			let name = file.split('.'),
	  				type = name[name.length-1]

	  			if(name[name.length-1]=='zip'){
	  				type = name[name.length-2]
	  			}

	  			if(type.toLowerCase() == 'geojson' || type.toLowerCase() == 'shp' || type.toLowerCase() == 'topojson' || type.toLowerCase() == 'kml'){
	  				isGeo = true
	  			}

	  			if(type.toLowerCase() == 'geojson' && name[name.length-1]!='zip'){
	  				isGeoJson = file
	  			}

  				files.push({
  					type:type,
  					file:file
  				})
	  		}
	  	})

	  	datasets[di].meta['files'] = files
	  	datasets[di].meta['isGeoJson'] = isGeoJson
	  	datasets[di].meta['isGeo'] = isGeo

		if(isGeo){ classes += ' t-geo'; }

		if(d.meta.temporal.length==2){
			for(var i = d.meta.temporal[0]; i<=d.meta.temporal[1]; i++){
				if(filters.years.indexOf(i)==-1){
					filters.years.push(i)
				}
				classes += ' y-'+i
			}
			if(isGeo){ classes += ' t-temporal'; }
		}

	  	datasets[di].meta['hasThumb'] = false
	  	if (fs.existsSync(dataFolder+'/'+d.file+'/thumb.jpg')) {
	  		datasets[di].meta['hasThumb'] = true
	  	}

	  	datasets[di].meta['hasPreview'] = false
	  	if (fs.existsSync(dataFolder+'/'+d.file+'/preview.jpg')) {
	  		datasets[di].meta['hasPreview'] = true
	  	}

	  	let downloadlist = ''
		files.forEach(f=>{
			let transType = ((f.type in fileTrans)?fileTrans[f.type]:f.type)
			classes += ' f-'+f.type
			if(filters.formats.indexOf(f.type)==-1){
				filters.formats.push(f.type)
			}
			downloadlist += '<li><a href="https://data.technologiestiftung-berlin.de/data/' +d.file+ "/" + f.file + '"><span class="download-icon"></span><span class="download-title">'+ transType +'</span><br /><span class="download-subtitle">' + fileSize(dataFolder + "/" + d.file + "/" + f.file) + '&nbsp;MB</span></a></li>'
		})

		d.meta.en.keywords.forEach((k,ki)=>{
			classes += ' k-'+clearWord(k)
			if(filters.keywords.en.indexOf(k)==-1){
				filters.keywords.en.push(k)
				filters.keywords.de.push(d.meta.de.keywords[ki])
			}
		})

		classes += ' l-'+clearWord(d.meta.license_short)
		classes += ' p-'+clearWord(d.meta.provider)
		classes += ' g-'+d.meta.geolevel

		if(filters.geolevel.indexOf(d.meta.geolevel)==-1){
			filters.geolevel.push(d.meta.geolevel)
		}
		if(filters.license.indexOf(d.meta.license_short)==-1){
			filters.license.push(d.meta.license_short)
		}
		if(filters.provider.indexOf(d.meta.provider)==-1){
			filters.provider.push(d.meta.provider)
		}

	  	let t_data_html = {de:data_html.de, en:data_html.en},
	  		metalist = {de:'',en:''},
			t_meta = {de:JSON.parse(JSON.stringify(default_meta.de)), en:JSON.parse(JSON.stringify(default_meta.en))},
			url = {de:"https://data.technologiestiftung-berlin.de/dataset/"+d.file, en: "https://data.technologiestiftung-berlin.de/dataset/"+d.file+"/en"}

		langs.forEach((l,li)=>{
			t_meta[l]["dcat:Catalog"]["dcat:dataset"].push(url[l])
			t_meta[l]["dcat:Dataset"][0]["dct:identifier"].push(url[l])
			t_meta[l]["dcat:Catalog"]["dct:issued"] = d.meta.timestamp
			t_meta[l]["dcat:Catalog"]["dct:isPartOf"].push("https://data.technologiestiftung-berlin.de"+((l=='en')?'/en':''))

			titles[l].push({id:di, t:d.meta[l].title});

			t_meta[l]["dcat:Dataset"][0]["dct:title"].push(d.meta[l].title)
			t_meta[l]["dcat:Dataset"][0]["dct:description"].push(d.meta[l].description)

			t_meta[l]["dcat:Dataset"][0]["dcatde:originator"][0]["foaf:name"] = d.meta.author.name
			t_meta[l]["dcat:Dataset"][0]["dcat:contactPoint"][0]["vcard:fn"] = d.meta.author.name
			t_meta[l]["dcat:Dataset"][0]["dcat:contactPoint"][0]["vcard:hasEmail"] = "mailto:"+d.meta.author.email

			t_meta[l]["dcat:Dataset"][0]["dcat:keyword"] = d.meta[l].keywords

			if(isGeoJson){
				let geojson = JSON.parse(fs.readFileSync(dataFolder+'/'+d.file+'/'+isGeoJson, 'utf8'))
				let bbox = turf.bboxPolygon(turf.bbox(geojson))
				t_meta[l]["dcat:Dataset"][0]["dct:spatial"][0].coordinates = bbox.geometry.coordinates
			}

			t_meta[l]["dcat:Dataset"][0]["dct:modified"] = d.meta.timestamp

			files.forEach((f)=>{
				t_meta[l]["dcat:Dataset"][0]["dcat:distribution"].push("https://data.technologiestiftung-berlin.de/data/"+d.file+"/"+f.file)
			})

			if(d.meta.temporal.length==2){
				t_meta[l]["dcat:Dataset"][0]["dct:temporal"].push({
					"schema:startDate": d.meta.temporal[0],
					"schema:endDate": d.meta.temporal[1]
				})
			}			

			t_meta[l]["dcat:Dataset"][0]["dct:license"].push(d.meta.license)
			t_meta[l]["dcat:Dataset"][0]["dcatde:politicalGeocodingLevelURI"].push(d.meta.geolevel)

			fs.writeFileSync(dataFolder + '/' + d.file + '/dcat'+((l=='en')?'_en':'')+'.json', JSON.stringify(t_meta[l]), 'utf8')

			if(datasets[di].meta['hasPreview']){
				t_data_html[l] = t_data_html[l].split('{{PREVIEW}}').join('<img src="https://data.technologiestiftung-berlin.de/data/' + d.file + '/preview.jpg" alt="Preview" id="preview" />');
			}else{
				t_data_html[l] = t_data_html[l].split('{{PREVIEW}}').join('');
			}

			t_data_html[l] = t_data_html[l].split('{{DATA}}').join(d.file);
			t_data_html[l] = t_data_html[l].split('{{TITLE}}').join(d.meta[l].title);
			t_data_html[l] = t_data_html[l].split('{{DESCRIPTION}}').join(d.meta[l].description.replace(/<\/?[^>]+(>|$)/g, ""));
			t_data_html[l] = t_data_html[l].split('{{DESCRIPTIONLONG}}').join(d.meta[l].description);
			t_data_html[l] = t_data_html[l].split('{{DCAT}}').join("https://data.technologiestiftung-berlin.de/data/"+d.file+"/dcat"+ ((l=='en')?'_en':'') +".json");

			if(datasets[di].meta['isGeoJson']){
				t_data_html[l] = t_data_html[l].split('{{MAP}}').join('<div id="map" data-geojson="https://data.technologiestiftung-berlin.de/data/' + d.file + "/" + datasets[di].meta['isGeoJson'] + '"></div>');
			}else{
				t_data_html[l] = t_data_html[l].split('{{MAP}}').join('');
			}

			t_data_html[l] = t_data_html[l].replace('{{DOWNLOADLIST}}', downloadlist);


			metalist[l] += '<li><span class="key">'+((l=='en')?'Last modified':'Zuletzt aktualisiert')+'</span>: <span class="value">'+d.meta.timestamp+'</span></li>'
			metalist[l] += '<li><span class="key">'+((l=='en')?'Provider':'Urheber')+'</span>: <span class="value">'+d.meta.provider+'</span></li>'

			if(d.meta.temporal.length == 2){
				metalist[l] += '<li><span class="key">'+((l=='en')?'Period':'Zeitspanne')+'</span>: <span class="value">'+d.meta.temporal[0]+'-'+d.meta.temporal[1]+'</span></li>'
			}

			if(d.meta.de.keywords.length > 0){
				metalist[l] += '<li><span class="key">'+((l=='en')?'Keywords':'Stichworte')+'</span>: <span class="value">'+d.meta[l].keywords.join(',')+'</span></li>'
			}

			if(d.meta.geolevel.length > 0){
				metalist[l] += '<li><span class="key">'+((l=='en')?'Spatial Resolution':'Räumliche Auflösung')+'</span>: <span class="value">'+((d.meta.geolevel in geoTrans[l])?geoTrans[l][d.meta.geolevel]:d.meta.geolevel)+'</span></li>'
			}

			metalist[l] += '<li><span class="key">'+((l=='en')?'License':'Lizenz')+'</span>: <span class="value">'+d.meta.license+'</span></li>'

			t_data_html[l] = t_data_html[l].replace('{{METALIST}}', metalist[l]);

			fs.writeFileSync(__dirname + '/http/data/'+d.file+((l=='en')?'_en':'')+'.html', t_data_html[l], 'utf8')

			datalist[l] += '<li class="' + classes + '" id="data-item-'+di+'">'+"\n"+
				'<a href="https://data.technologiestiftung-berlin.de/dataset/'+d.file+((l=='en')?'/en':'')+'">'+"\n";

			if(datasets[di].meta['hasThumb']){
				datalist[l] += '<img src="https://data.technologiestiftung-berlin.de/data/'+d.file+'/thumb.jpg" alt="'+d.meta[l].title+'" />'+"\n";
			}else{
				datalist[l] += '<img src="https://data.technologiestiftung-berlin.de/assets/images/file@2x.png" alt="'+d.meta[l].title+'" />'+"\n";
			}


            datalist[l] += '<span class="data-title">'+d.meta[l].title+'</span>'+"\n"+
                    '<span class="col1">'+"\n"+
                        '<span class="key">'+((l=='en')?'Formats':'Formate')+'</span>:<span class="value">'+"\n";

            files.forEach((f,fi)=>{
				let transType = ((f.type in fileTrans)?fileTrans[f.type]:f.type)
				if(fi>0){
					datalist[l] += ', '	
				}
				datalist[l] += transType
			})

            datalist[l] += '</span><br /><br />'+"\n";

            if(d.meta.geolevel.length > 0){
            	datalist[l] += '<span class="key">'+((l=='en')?'Resolution':'Auflösung')+'</span>:<span class="value">'+((d.meta.geolevel in geoTrans[l])?geoTrans[l][d.meta.geolevel]:d.meta.geolevel)+'</span>'+"\n";
            }
			datalist[l] += '</span>'+"\n"+
                    '<span class="col2">'+"\n"+
                        '<span class="key">'+((l=='en')?'Keywords':'Stichworte')+'</span>:<span class="value">'+d.meta[l].keywords.join(', ')+'</span><br /><br />'+"\n";

            if(d.meta.temporal.length == 2){
            	datalist[l] += '<span class="key">'+((l=='en')?'Years':'Jahre')+'</span>:<span class="value">'+d.meta.temporal[0]+'-'+d.meta.temporal[1]+'</span>'+"\n";
            }

            datalist[l] += '</span>'+"\n"+
                    '<hr class="clear" />'+"\n"+
                '</a>'+"\n"+
            '</li>'+"\n";
		})

	})

	for(var key in filters){
		if('de' in filters[key]){

			filters[key].en.forEach((f,fi)=>{
				langs.forEach(l=>{
					filters[key][l][fi] = {label:filters[key][l][fi], key:f}
				})
			})

			langs.forEach(l=>{
				filters[key][l].sort((a,b)=>{
					if (a < b) {
    					return -1;
  					}
  					if (a > b) {
				    	return 1;
				  	}
  					return 0;
				})

				let filterset = ''

				filters[key][l].forEach(f=>{
					filterset += '<li data-value="'+clearWord(f.key)+'">';
					filterset += f.label;
					filterset += '</li>'+"\n"
				})

				index_html[l] = index_html[l].split('{{FILTER'+key.toUpperCase()+'}}').join(filterset);
			})			

		}else{
			filters[key].sort()

			langs.forEach(l=>{

				let filterset = ''

				filters[key].forEach(f=>{
					filterset += '<li data-value="'+clearWord(f)+'">';
					switch(key){
						case 'geolevel':
							filterset += ((f in geoTrans[l])?geoTrans[l][f]:f)
						break;
						case 'license':
							filterset += ((f in licenseTrans[l])?licenseTrans[l][f]:f)
						break;
						case 'formats':
							filterset += ((f in fileTrans)?fileTrans[f]:f)
						break;
						default:
							filterset += f
						break;
					}
					filterset += '</li>'+"\n"
				})

			
				index_html[l] = index_html[l].split('{{FILTER'+key.toUpperCase()+'}}').join(filterset);
			})
		}
	}

	langs.forEach(l=>{
		index_html[l] = index_html[l].split('{{TITLES}}').join(JSON.stringify(titles[l]))
		index_html[l] = index_html[l].split('{{DATALIST}}').join(datalist[l])
		fs.writeFileSync(__dirname + '/http/index'+((l=='en')?'_en':'')+'.html', index_html[l], 'utf8')
	})

	res.sendFile(__dirname + '/http/done.html')
})

function clearWord(s){
	s = s.split(' ').join('-');
	s = s.split('.').join('-');
	return s;
}

function fileSize(file){
	let stats = fs.statSync(file)
	return (stats.size / 1000000.0).toFixed(2);
}

app.get('/dataset/:dataset/:lang', function(req, res) {
	let dataset = req.params.dataset,
		lang = req.params.lang

	if(lang != 'en'){
		lang = ''
	}else{
		lang = '_en'
	}

	if (fs.existsSync(dataFolder+dataset)) {
		res.sendFile(__dirname + '/http/data/'+dataset+lang+'.html')  
	}else{
		res.sendFile(__dirname + '/http/404.html')
	}  	
})

app.get('/dataset/:dataset', function(req, res) {
	let dataset = req.params.dataset

	if (fs.existsSync(dataFolder+dataset)) {
		res.sendFile(__dirname + '/http/data/'+dataset+'.html')  
	}else{
		res.sendFile(__dirname + '/http/404.html')
	}  	
})

app.get('/en', function(req, res) {
  	res.sendFile(__dirname + '/http/index_en.html')
})

app.get('/', function(req, res) {
  	res.sendFile(__dirname + '/http/index.html')
})

console.log('Listening on port: ' + 1919)
app.listen(1919)