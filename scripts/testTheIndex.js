require('dotenv').config();
const { Client } = require('@elastic/elasticsearch')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')

const client = new Client({ node: process.env.ELASTIC_URL })

var log = console.log.bind(console);

async function addPdfDoc(id) {
  log(`addPdfDoc ${id}`)
  const filepath = path.join(__dirname, '..', 'test_pdfs',`${id}.txt`)
  let txt = fs.readFileSync(filepath).toString()
  txt = txt.replace(/(\r\n|\n|\r)/gm," ");
  txt = txt.replace(/\s+/g, ' ').trim()
  if(txt.length > 100) {
    return await client.index({
        index: process.env.INDEX,
        id,
        body: {
            bodytext: txt
        }
    });
  } else {
    return await new Promise(function(resolve) {
      setTimeout(resolve, 100);
  });
  }
}

async function searchNg(query) {
  log(`query`)
  return await client.search({
      index: process.env.INDEX,
      body: {
        "query": {
          "multi_match": {
            "query": query,
            "type": "cross_fields",
            "fields": ["bodytext.ngram"],
            "operator": "and"
          }
        }
      }
  })
}

async function waitForIndexing() {
  log('Wait for indexing ....');
  return await new Promise(function(resolve) {
      setTimeout(resolve, 5000);
  });
}

async function getTheDoc(id) {
  log(`getTheDoc ${id}`);
  return await client.get({id, index: process.env.INDEX});
}

async function deleteTheDoc(id) {
  log(`deleteTheDoc ${id}`);
  return await client.delete({id, index: process.env.INDEX});
}

function convertDoc(id) {
  log(`convertDoc ${id}`);
  const jarpath = path.join(__dirname, '..', 'pdfbox-app-2.0.24.jar')
  const filepath = path.join(__dirname, '..', 'test_pdfs',`${id}.pdf`)
  const outpath = path.join(__dirname, '..', 'test_pdfs',`${id}.txt`)
  shell.exec(`java -jar ${jarpath} ExtractText ${filepath}`)
}

async function closeConnection() {
  log(`Closing connection ...`);
  await client.close();
}

(async () => {
  try {
    convertDoc(1)
    convertDoc(2)
    await addPdfDoc(1)
    await addPdfDoc(2)
    await waitForIndexing()
    const { body } = await searchNg('Boring');
    log(JSON.stringify(body.hits.hits))
    log(body.hits.hits.length)
    await getTheDoc(1)
    await deleteTheDoc(1)
    await deleteTheDoc(2)
    await closeConnection()
  } catch(err) {
    log(err)
  }
})()
    