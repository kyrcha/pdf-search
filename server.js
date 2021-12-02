require('dotenv').config()
const express = require('express')
const fs = require('fs')
const path = require('path')
const shell = require('shelljs');
const slugify = require('slugify');

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: process.env.ELASTIC_URL })
const app = express()

const size = 20;

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// parse application/json
app.use(express.json({limit: '50mb'}))

app.get('/', (req, res) => {
  res.send('PDF search')
})

app.get('/api/documents/delete/:id', async (req, res) => {
  console.log(`Delete doc ${req.params.id}`);
  try {
    const { body } = await client.delete({id: req.params.id, index: process.env.INDEX});
    return res.json(body);
  } catch(err) {
    console.log(err);
    if(err.meta.statusCode === 404) {
      return res.sendStatus(404);
    }
    res.sendStatus(500);
  }
});

app.get('/api/documents/:id', async (req, res) => {
  console.log(`Get doc ${req.params.id}`);
  try {
    const { body } =  await client.get({id: req.params.id, index: process.env.INDEX});
    return res.json(body);
  } catch(err) {
    console.log(err);
    if(err.meta.statusCode === 404) {
      return res.sendStatus(404);
    }
    res.sendStatus(500);
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  console.log(`Delete doc ${req.params.id}`);
  try {
    const { body } = await client.delete({id: req.params.id, index: process.env.INDEX});
    return res.json(body);
  } catch(err) {
    console.log(err);
    if(err.meta.statusCode === 404) {
      return res.sendStatus(404);
    }
    res.sendStatus(500);
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    let page = 0;
    if(req.query.page) page = parseInt(req.query.page);
    const { body } = await client.search({
      index: process.env.INDEX,
      "from": size*page,
      "size": size,
      body: {
        "query": {
          "match_all": {}
        }
      }
    });
    res.json(body)
  } catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

// https://stackoverflow.com/questions/57800448/need-to-know-how-to-search-multiple-keyword-in-a-same-field-in-elasticsearch
app.get('/api/search', async (req, res) => {
  try {
    console.log(req.query.keywords.split(" ").join(" OR "))
    const { body } = await client.search({
      index: process.env.INDEX,
      body: {
        "query": {
          "multi_match": {
            "query": req.query.keywords,
            "type": "cross_fields",
            "fields": ["bodytext.ngram"],
            "minimum_should_match": "100%"
          }
        }
      }
    })
    const results = body.hits.hits.map(hit => {
    return {
      id: hit._id,
      score: hit._score,
      body: hit._source.bodytext
     }
    })
    res.json(results)
  } catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.post('/api/upload', async (req, res, next) => {
  try {
    const { id, filename, file } = req.body;
    console.log(`Uploading: ${id} - ${filename}`);
    // remove header
    const noheader_file = file.replace(/^data:application\/pdf;base64,/, "")
    //remove those line breaks
    const nonewlines_file = noheader_file.replace(/(\r\n|\n|\r)/gm, "");
    const buffer = Buffer.from(nonewlines_file,'base64');
    // Store in uploads
    const ts = Date.now();
    const jarpath = path.join(__dirname, 'pdfbox-app-2.0.24.jar')
    const cleared_filename = slugify(filename);
    const outputPdfFilepath = path.join(__dirname, 'uploads', `${cleared_filename}.${ts}.pdf`);
    const outputTxtFilepath = path.join(__dirname, 'uploads', `${cleared_filename}.${ts}.txt`);
    fs.writeFileSync(outputPdfFilepath, buffer)
    // export DISPLAY=:0
    // export JAVA_OPTS="-Djava.awt.headless=true"
    shell.exec(`java -jar ${jarpath} ExtractText ${outputPdfFilepath}`)
    let txt = fs.readFileSync(outputTxtFilepath).toString()
    fs.unlinkSync(outputTxtFilepath);
    fs.unlinkSync(outputPdfFilepath);
    txt = txt.replace(/(\r\n|\n|\r)/gm," ");
    txt = txt.replace(/\s+/g, ' ').trim()
    if(txt.length > 100) {
      await client.index({
        index: process.env.INDEX,
        id,
        body: {
            bodytext: txt
        }
      })
      console.log(`Uploaded: ${id}`)
      await client.indices.refresh({index: process.env.INDEX})
      console.log(`Refreshed index: ${id}`);
      res.sendStatus(201);
    } else {
      res.status(400).json({"message": "The text extracted is not long enough to be indexes (less than 100 chars)"});
    }
  } catch(err) {
    console.log(err);
    res.status(500).json({"message": JSON.stringify(err)});
  }
});

app.listen(process.env.PORT, async () => {
  console.log(`PDF search listening at http://localhost:${process.env.PORT}`)
})