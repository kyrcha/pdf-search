const { Client } = require('@elastic/elasticsearch')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')

const client = new Client({ node: 'http://localhost:9200' })

var log = console.log.bind(console);

async function addPdfDoc(id) {
  log(`addPdfDoc ${id}`)
  const filepath = path.join(__dirname, '..', 'test_pdfs',`${id}.txt`)
  let txt = fs.readFileSync(filepath).toString()
  txt = txt.replace(/(\r\n|\n|\r)/gm," ");
  txt = txt.replace(/\s+/g, ' ').trim()
  if(txt.length > 100) {
    return await client.index({
        index: 'kb',
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
      index: 'kb',
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
  return await client.get({id, index: 'kb'});
}

async function deleteTheDoc(id) {
  log(`deleteTheDoc ${id}`);
  return await client.delete({id, index: 'kb'});
}

function convertDoc(id) {
  log(`convertDoc ${id}`);
  const jarpath = path.join(__dirname, '..', 'pdfbox-app-3.0.0-RC1.jar')
  const filepath = path.join(__dirname, '..', 'test_pdfs',`${id}.pdf`)
  const outpath = path.join(__dirname, '..', 'test_pdfs',`${id}.txt`)
  shell.exec(`java -jar ${jarpath} export:text --input=${filepath} --output=${outpath}`)
}

async function closeConnection() {
  log(`Closing connection ...`);
  await client.close();
}

(async () => {
  try {
    convertDoc(1)
    convertDoc(2)
    convertDoc(3)
    convertDoc(4)
    convertDoc(5)
    await addPdfDoc(1)
    await addPdfDoc(2)
    await addPdfDoc(3)
    await addPdfDoc(4)
    await addPdfDoc(5)
    await waitForIndexing()
    const { body } = await searchNg('Χώρ');
    log(JSON.stringify(body.hits.hits))
    log(body.hits.hits.length)
    await getTheDoc(4)
    await deleteTheDoc(1)
    await deleteTheDoc(3)
    await deleteTheDoc(4)
    await closeConnection()
  } catch(err) {
    log(err)
  }
})()
    