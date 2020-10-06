const config = require("../../config.json");

const fetch = require("node-fetch");

const AWS = require("aws-sdk");
AWS.config.update({region: config.aws.region});

const s3 = new AWS.S3({
  accessKeyId : config.aws.id,
  secretAccessKey : config.aws.key
});

const getDatasets = () => {
  // This function works if we have less than 1000 files in the bucket, otherwise we would need to paginate
  return s3.listObjectsV2({ Bucket: config.aws.bucket }).promise()
    .then((objects) => {
      return Promise.all(objects.Contents.filter((obj) => {
        if (obj.Key.indexOf("meta.json") > -1) {
          return true;
        }
        return false;
      }).map((obj) => {
        const url = config.aws.bucketUrl + obj.Key;
        console.log(url);
        return fetch(url)
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw Error(`Error fetching ${url}`)
            }
          })
          .then((json) => {
            return {
              path: url,
              folder: obj.Key.split("/")[0],
              meta: json
            };
          });
      }));
    })
    .then((objects) => {
      const pageList = [];
      objects.forEach((obj) => {
        (["de", "en"]).forEach((lang) => {
          const page = JSON.parse(JSON.stringify(obj));
          page.lang = lang;
          page.title = page.meta[lang].title;
          page.description = page.meta[lang].description;
          page.keywords = page.meta[lang].keywords;
          pageList.push(page);
        });
      });
      return pageList;
    })
    .catch((err) => {
      throw err;
    });
};

module.exports = async function () {
  try {
    const response = await getDatasets();
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
