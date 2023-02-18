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

// async function chatWithBot(message) {
//     const prompt = `Beszélgetés a bot-tal: "${message}".\nBot válasza:`;
  
//     const completions = await openai.completions.create({
//       engine: MODEL_ENGINE,
//       prompt,
//       maxTokens: 100,
//       n: 1,
//       stop: '\n',
//     });
  
//     const answer = completions.choices[0].text.trim();
//     return answer;
//   }

app.post('/message',(req,res)=>{
    try {
        const msg = req.body.msg;
        const prompt = `Egészítsd ki a párbeszédet Mester és a szolgálója, Sina között. Mester: ${msg} Sina:`;
        console.log("message arrived: "+msg);
        const response = openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            n: 1,
            temperature:1,
            // stop:'\n', 
            max_tokens: 150,

        });
    
        response.then((data)=>{
            const reply = data.data.choices[0].text.trim().replace('\n','');
            console.log(`robot reply: ${reply}`);
            res.send({message:reply});
        });
    } catch (error) {
        console.error(error);        
    }

});

app.listen(3000, ()=>{
    console.log("Im listening to you master");
});