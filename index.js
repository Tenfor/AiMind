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

function buildPromptFromMemory(memoryArray){
    let prompt = `Sina tudja, hogy a mestere és gazdája Fekete Zsolt. Egészítsd ki a párbeszédet Fekete Zsolt mester és a szolgája, Sina között, Sina válaszával.`;
    // let prompt = `Egészítsd ki a párbeszédet Zsolt mester és a legjobb barátja, Sina között, Sina Chris Tucker stílusú válaszával.`;
    if(memoryArray.length !== 0){
        memoryArray.forEach(memory => {
            prompt += `Mester: ${memory.question} Sina:${memory.response}`;
        });
    }

    return prompt;
}

async function fixMessage(msg){
    const prompt = `Kérlek, pótold a hiányzó írásjeleket a következő mondatban:\n\n${msg}\n\nÍrásjellel ellátott mondat:`
    const parameters ={
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0,
        max_tokens: 60,
        frequency_penalty: 0.0,
        presence_penalty: 1.0,
    };
    try{
        const response = await openai.createCompletion(parameters);
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error(error);
    }
}



app.post('/message',async (req,res)=>{
    try {
        const msg = req.body.msg;
        const memory = req.body.memory;

        console.log("message arrived: "+msg);
        //fix grammar
        const fixedMsg = await fixMessage(msg);
        //build prompt from memory
        const promptFromMemory = buildPromptFromMemory(memory);
        //complete prompt with new the input
        const prompt = `${promptFromMemory} Mester:${fixedMsg} Sina:`;
        console.log("prompt all built up: "+prompt);
       
        const response = openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            n: 1,
            temperature:0.9,
            // stop:'\n', 
            max_tokens: 150,

        });
    
        response.then((data)=>{
            const reply = data.data.choices[0].text.trim().replace('\n','');
            console.log(`robot reply: ${reply}`);
            res.send({robotResponse:reply, fixedMsg:fixedMsg});
        });
    } catch (error) {
        console.error(error);        
    }

});

app.listen(3000, ()=>{
    console.log("Im listening to you master");
});