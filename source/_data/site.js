module.exports = {
  buildTime: new Date(),
  baseUrl: "http://localhost:8080",
  s3BaseUrl: "https://tsb-opendata.s3.eu-central-1.amazonaws.com/",
  en: {
    metaTitle: "Data",
    metaDescription: "Description in english",
  },
  de: {
    metaTitle: "Daten",
    metaDescription: "Offene Daten zur Verfügung gestellt durch die Open Data Informationsstelle (ODIS)",
  },
  formatter: {
    geojson:'GeoJSON',
    shp:'ESRI Shapefile',
    dump:'Postgres Dump',
    sqlite:'SQLite Dump',
    geo: {
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
    }
  }
};