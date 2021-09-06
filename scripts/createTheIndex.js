const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

var log = console.log.bind(console);

function dropNgIndex() {
  console.log("dropNgIndex")
  return client.indices.delete({
      index: 'kb',
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
      index: 'kb',
      body: {
          settings: settings,
          mappings: mapping
      }
  });
}

function addPdfDoc() {
  console.log("addPdfDoc")
  return client.index({
      index: 'kb',
      id: 316,
      body: {
          "bodytext": `Receipt from Mullvad VPN AB
          Receipt #2554653
          Service Date paid Amount (incl. VAT)
          Mullvad VPN 1 month(s) 2021-07-13 5.00 EUR
          VAT: SE559238400101
          Org-No: 559238-4001
          Website: www.mullvad.net
          Mail: support@mullvad.net
          Mullvad VPN AB
          Box 53049
          400 14 Gothenburg
          Sweden
          Mullvad always pays VAT monthly to the correct tax authority based on the payment information we get from the payment processor.
          Country VAT % VAT Amount (excl. VAT)
          Non-EU 0 0.00 5.00
          Luxembourg 17 0.73 4.27
          Malta 18 0.76 4.24
          Cyprus, Germany, Romania 19 0.80 4.20
          Austria, Bulgaria, Estonia, France, Slovakia, United Kingdom 20 0.83 4.17
          Belgium, Czechia, Latvia, Lithuania, Netherlands, Spain 21 0.87 4.13
          Italy, Slovenia 22 0.90 4.10
          Ireland, Poland, Portugal 23 0.94 4.06
          Finland, Greece 24 0.97 4.03
          Croatia, Denmark, Sweden 25 1.00 4.00
          Hungary 27 1.06 3.94`,
      }
  });
}

function searchNg() {
  return client.search({
      index: 'kb',
      body: {
        "query": {
          "multi_match": {
            "query": "sw",
            "type": "cross_fields",
            "fields": ["bodytext.ngram"],
            "operator": "and"
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
  return client.get({id: 316, index: 'kb'}).then(data => {
    console.log(JSON.stringify(data.body));
  });
}

function deleteTheDoc() {
  return client.delete({id: 316, index: 'kb'}).then(data => {
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
    .then(getTheDoc)
    .then(closeConnection)
    .catch((err) => {
      // console.error(err)
      console.error(err.meta.statusCode)
    });



    