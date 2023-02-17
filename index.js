const {Configuration, OpenAIApi} = require("openai");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const token = process.env.API_TOKEN;
const configuration = new Configuration({apiKey:token});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/message',(req,res)=>{
    console.log("message arrived: "+req.body.prompt);
    const response = openai.createCompletion({
        model: 'text-curie-001',
        prompt: req.body.prompt,
        temperature: 0,
        top_p: 1,
        frequency_penalty:0, 
        presence_penalty: 0,
        max_tokens: 100
    });

    response.then((data)=>{
        res.send({message:data.data.choices[0].text});
    });
});

app.listen(3000, ()=>{
    console.log("Im listening to you master");
});