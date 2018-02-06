let fs = require('fs')

const { exec } = require('child_process')

let minx = 369095.687897,
    miny = 5799302.08121,
    maxx = 416868.309276,
    maxy = 5838240.33418

//ogr2ogr flurstuecke.sqlite -f SQLite flurstuecke.vrt
//ogr2ogr -f "ESRI Shapefile" flurstuecke flurstuecke.sqlite -dialect sqlite -sql "SELECT * FROM unionlayer GROUP BY gml_id"

let datasets = [
    // ['http://fbinter.stadt-berlin.de/fb/wfs/geometry/senstadt/re_vkz', 're_vkz', 'verkehrszellen', false],
    // ['http://fbinter.stadt-berlin.de/fb/wfs/geometry/senstadt/re_vkz_teil', 're_vkz_teil', 'teil_verkehrszellen', false],
    // ['http://fbinter.stadt-berlin.de/fb/wfs/geometry/senstadt/re_bezirksregion', 're_bezirksregion','lor_bezirksregionen', false],
    // ['http://fbinter.stadt-berlin.de/fb/wfs/geometry/senstadt/re_planungsraum', 're_planungsraum','lor_planungsraeume', false],
    // ['http://fbinter.stadt-berlin.de/fb/wfs/geometry/senstadt/re_prognose', 're_prognose','lor_prognoseraeume', false],
    // ['http://fbinter.stadt-berlin.de/fb/wfs/geometry/senstadt/re_ortsteil', 're_ortsteil', 'ortsteile', false]
    //['http://fbinter.stadt-berlin.de/fb/wfs/geometry/senstadt/re_postleit', 're_postleit', 'plz', false]
    //['http://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_bezirk','s_wfs_alkis_bezirk','bezirksgrenzen', false],
    ['http://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_gebaeudeflaechen','s_wfs_alkis_gebaeudeflaechen','gebaeude', true],
    ['http://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis','s_wfs_alkis','flurstuecke', true]
    //['http://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_flur','s_wfs_alkis_flur','flure', false],
    //['http://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_ISU5_2015_UA','s_ISU5_2015_UA','blockflaechen', false],
    //['http://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_ISU5_2015_UA_str','s_ISU5_2015_UA_str','strassenflaechen', false]
  ],
  formats = [
//    ['GeoJSON', 'geojson'],
    ['ESRI Shapefile', 'shp']
    // ['KML', 'kml'],
    // ['GML', 'gml'],
    // ['CSV', 'csv'],
    // ['PGDump', 'dump'],
    // ['SQLite','sqlite']
  ],
  ei = 0,
  di = 0,
  steps = 8, 
  x = 0, 
  y = 0

function buildVRTs(){
  datasets.forEach(d=>{
    if(d[3]){
      let vrt = '<OGRVRTDataSource><OGRVRTUnionLayer name="unionLayer">'
      for(let x = 0; x<=steps; x++){
        for(let y = 0; y<=steps; y++){
          vrt += '<OGRVRTLayer name="'+d[2]+x+'_'+y+'"><SrcDataSource>'+d[2]+x+'_'+y+'.shp</SrcDataSource></OGRVRTLayer>'
        }
      }
      vrt += '</OGRVRTUnionLayer></OGRVRTDataSource>'
      fs.writeFileSync('data/' + d[2] + '.vrt', vrt, 'utf8')
    }
  })
}

function getData(){
  console.log(datasets[di][2], formats[ei][1], x, y)
  let spat = ''
  if(datasets[di][3]){
     spat = ' -spat '+(minx + (maxx-minx)/steps*x)+' '+(miny + (maxy-miny)/steps*y)+' '+(minx + (maxx-minx)/steps*(x+1))+' '+(miny + (maxy-miny)/steps*(y+1))
  }
  exec('ogr2ogr' + spat + ' -s_srs EPSG:25833 -t_srs WGS84 -f "' + formats[ei][0] + '" /Users/sebastianmeier/Sites/data-repo@github/utils/data/' + datasets[di][2] + ((datasets[di][3])?(x + '_' + y):'') + '.' + formats[ei][1] + ' WFS:"' + datasets[di][0] + '" ' + datasets[di][1], (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return;
    }

    if(datasets[di][3]){
      x++
      if(x>steps){
        x=0
        y++
        if(y>steps){
          x = 0
          y = 0
          next();
        }else{
          getData()
        }
      }else{
        getData()
      }
    }else{
      next()
    }    
  })
}

function next(){
  ei++;
  if(ei>=formats.length){
    ei = 0
    di++
    if(di>=datasets.length){
      buildVRTs()
      console.log('done')
    }else{
      getData()
    }
  }else{
    getData()
  }
}

//getData()
buildVRTs()