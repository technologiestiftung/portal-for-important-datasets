let fs = require('fs'),
  express = require('express')

let app = express()

let dataFolder = __dirname + '/data/'

app.use('data', express.static(dataFolder))

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
  next();
});

app.get('/update', function(req, res) {
  	
	let datasets = []

	fs.readdirSync(dataFolder).forEach(file => {
	  	if(file != '.DS_Store' && file.length > 2){

	  		if (fs.existsSync(dataFolder+file+'/meta.json')) {

	  			let meta = JSON.parse(fs.readFileSync(dataFolder+file+'/meta.json', 'utf8'))

	  			datasets.push({
	  				data:file,
	  				meta:meta
	  			})

	  		}

		}
	})

	let index_html = fs.readFileSync(__dirname + 'http/index_template.html'),
		data_html = fs.readFileSync(__dirname + 'http/data_template.html')

	let default = {
		"dcat:Catalog": {
			"dct:title": [
				"Open Data Repository - Technologiestiftung Berlin"
			],
			"dct:description": [
				"Im Open Data Repository der Technologiestiftung Berlin werden zum Großteil Daten-Extrakte, optimierte Daten und kombinierte Daten aus existierenden Open Data Quellen bereitgestellt."
			],
			"dct:publisher": {
				"foaf:name": "Technologiestiftung Berlin"
			},
			"dct:issued": "{{TIMESTAMP}}",
			"dcat:dataset": [
				"{{URL}}" SET AUTO
			],
			"dct:isPartOf": [
				"{{LABURL}}" SET AUTO
			],
		},
		"dcat:Dataset": [
			{
				"dct:identifier": [ SET ATUO
					"{{URL}}"
				],
				"dct:title": [
					"{{TITLE}}"
				],
				"dct:description": [
					"{{DESCRIPTION}}"
				],
				"dcatde:originator": [
					{
						"foaf:name": "Sebastian Meier",
						"dct:type": "http://inspire.ec.europa.eu/metadata-codelist/ResponsiblePartyRole/processor"
					}
				],
				"dcat:contactPoint": [
					{
						"vcard:fn": "Sebastian Meier",
						"vcard:hasEmail": "mailto:meier@technologiestiftung-berlin.de"
					}
				],
				"dcat:keyword": [
					"Bodenschutz", "Geodaten", "Grundwasser", "hmbtg", "hmbtg_09_geodaten", "Karte", "opendata", "Thematische Karte", "Umwelt und Klima"
				],
				"dct:spatial": [ SET AUTO only for geojson
					{
						"type": "Polygon",
						"crs": "urn:ogc:def:crs:OGC:1.3:CRS84",
						"coordinates": "[[[10.326304,53.394985], [10.326304,53.964153], [8.420551,53.964153], [8.420551,53.394985], [10.326304,53.394985]]]"
					}
				],
				"dct:temporal": [
					{
						"schema:startDate": "2016-01-01",
						"schema:endDate": "2016-12-31"
					}
				],
				"dct:modified": "2017-03-01T10:00:00", SET AUTO
				"dcat:distribution": [
					"URL-FILE" SET AUTO > multiple
					> files/...
					> meta.json
				],
				"dct:license": [
					"{{LICENSE}}"
				],
				"dcatde:politicalGeocodingLevelURI": [
					"http://dcat-ap.de/def/politicalGeocoding/Level/state",
					"http://dcat-ap.de/def/politicalGeocoding/Level/administrativeDistrict",
					"http://dcat-ap.de/def/politicalGeocoding/Level/municipality"
				],
				"dcatde:politicalGeocodingURI": [
					"http://dcat-ap.de/def/politicalGeocoding/stateKey/11",
					"http://dcat-ap.de/def/politicalGeocoding/regionalKey/110000000000"
				],
				"dcatde:geocodingText": [
					"Berlin, Stadt"
				]
			}
		]
	}

	datasets.forEach(d=>{

		t_data_html = data_html

		Optional:

		originator
		originator_type
		contactPoint
		keyword
		temporal
		versionNotes

		t_data_html.replace('{{TITLE}}', d.meta.title)
		t_data_html.replace('{{DESCRIPTION}}', d.meta.description)

		fs.writeFileSync(__dirname + 'http/data/'+d.data+'.html')
	})

	fs.writeFileSync(__dirname + 'http/index.html')

	res.sendFile(__dirname + '/http/done.html')
})

app.get(/^\/dataset\/(.*), function(req, res) {
	let dataset = req.params[0]
	if (fs.existsSync(dataFolder+dataset)) {
		res.sendFile(__dirname + '/http/data/'+dataset+'.html')  
	}else{
		res.sendFile(__dirname + '/http/404.html')
	}  	
})

app.get('/', function(req, res) {
  	res.sendFile(__dirname + '/http/index.html')
})

console.log('Listening on port: ' + 1919)
app.listen(1919)