# data-repo
Basic site generator for a data repository.

## Setup

Create a config.json based on the config.sample.json

```
npm install
npm run dev
```

*Tipp:* In order to overcome CORS problems for the geojson visualisations, the script copies the geojson files from the S3 into the static site. During development this makes everything a bit slow. Simply comment out lines 87-110 in source/_data/dataset.js. This will disable all maps, but everything else will work fine.

## Overview

### source/assets

Static files like images, CSS, etc.
Those files are coppied to _site/assets, based on the .eleventy.json
```
eleventyConfig.addPassthroughCopy("source/assets", "assets");
```

### source/_data/site.js

Basic configs for the site, like baseUrl, etc.
It also contains an array of formatters, which translate abbreviations from the meta.json's into more readable form.

### source/_data/dataset.js

This is where the magic happens. The script reads out the S3 folder and creates a data object for each folder, which is turned into a dataset page.

### source/_includes/layouts

- dataset.liquid: individual pages for each dataset
- dcat.liquid: metadata json files for each dataset
- default.liquid: base template for the html files (head, header, footer)
- geojson.liquid: output of downloaded geojson files
- startpage.liquid: list pages

### source

- 404.liquid: 404
- dataset-geojson.liquid: output of downloaded geojson files
- dataset-meta.liquid: metadata json files for each dataset
- dataset-page.liquid: individual pages for each dataset
- index.liquid: list pages (index.html, /en/index.html, /de/index.html)