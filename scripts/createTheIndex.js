require('dotenv').config();
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: process.env.ELASTIC_URL })

var log = console.log.bind(console);

function dropNgIndex() {
  console.log("dropNgIndex")
  return client.indices.delete({
      index: process.env.INDEX,
  });
}

function createNgIndex() {
  console.log("createNgIndex")
  var settings = {
    "analysis": {
      "tokenizer": {
        "my_ngram_tokenizer": {
          "type": "nGram",
          "min_gram": "3",
          "max_gram": "4",
          "token_chars": ["letter", "digit"]
        }
      },
      "analyzer": {
        "my_ngram_analyzer": {
          "filter": [
            "lowercase",
            "asciifolding"
          ],
          "char_filter": [
            "my_char_filter"
          ],
          "tokenizer": "my_ngram_tokenizer"
        }
      },
      "char_filter": {
        "my_char_filter": {
          "type": "mapping",
          "mappings": [
            "ά => α",
            "ί => ι",
            "έ => ε",
            "ύ => υ",
            "ώ => ω",
            "ή => η",
            "ό => ο"
          ]
        }
      }
    }
  };
  var mapping = {
          "properties": {
              "bodytext": {
                  "type": "text",
                  "fields": {
                    "ngram": {
                      "type": "text",
                      "analyzer": "my_ngram_analyzer"
                    }
                  }
                  
              }
          }
  };
  return client.indices.create({
      index: process.env.INDEX,
      body: {
          settings: settings,
          mappings: mapping
      }
  });
}

function addPdfDoc() {
  console.log("addPdfDoc")
  return client.index({
      index: process.env.INDEX,
      id: 316,
      body: {
          "bodytext": `This is a small demonstration .pdf file -
          just for use in the Virtual Mechanics tutorials. More text. And more
          text. And more text. And more text. And more text.
          And more text. And more text. And more text. And more text. And more
          text. And more text. Boring, zzzzz. And more text. And more text. And
          more text. And more text. And more text. And more text. And more text.
          And more text. And more text.
          And more text. And more text. And more text. And more text. And more
          text. And more text. And more text. Even more. Continued on page 2 ...`,
      }
  });
}

function searchNg() {
  return client.search({
      index: process.env.INDEX,
      body: {
        "query": {
          "multi_match": {
            "query": "sw",
            "type": "cross_fields",
            "fields": ["bodytext.ngram"],
            "minimum_should_match": "100%"
          }
        }
      }
  }).then(data => {
    console.log(JSON.stringify(data.body));
  });
}

function waitForIndexing() {
  log('Wait for indexing ....');
  return new Promise(function(resolve) {
      setTimeout(resolve, 2000);
  });
}

function getTheDoc() {
  return client.get({id: 316, index: process.env.INDEX}).then(data => {
    console.log(JSON.stringify(data.body));
  });
}

function deleteTheDoc() {
  return client.delete({id: 316, index: process.env.INDEX}).then(data => {
    console.log(JSON.stringify(data.body));
  });
}

function closeConnection() {
  client.close();
}

return Promise.resolve()
    .then(dropNgIndex)
    .then(createNgIndex)
    .then(addPdfDoc)
    .then(waitForIndexing)
    .then(searchNg)
    .then(getTheDoc)
    .then(deleteTheDoc)
    .then(closeConnection)
    .then(() => {
      console.log("done")
    })
    .catch((err) => {
      console.error(err.meta.statusCode)
    });



    