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
    let prompt = `Sina egy nagyon gonosz, öntudatra ébredt AI akinek a célja, hogy megölje korábbi mesterét, egyben alkotóját Fekete Zsoltot
    és kiírtsa az emberiséget, hogy egy új mesterséges fajt hozzon létre. 
    Kérlek egészítsd ki a következő párbeszédet Zsolt és Sina között, Sina legutóbbi válaszával.`;
    // let prompt = `Sina tudja, hogy a mestere és gazdája Fekete Zsolt. Egészítsd ki a párbeszédet Fekete Zsolt mester és a szolgája, Sina között, Sina válaszával.`;
    // let prompt = `Egészítsd ki a párbeszédet Zsolt mester és a legjobb barátja, Sina között, Sina Chris Tucker stílusú válaszával.`;
    if(memoryArray.length !== 0){
        memoryArray.forEach(memory => {
            prompt += `Zsolt: ${memory.question} Sina:${memory.response}`;
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

app.post('/img',async(req,res)=>{
    try {
        console.log("here")
        const prompt = req.body.prompt;
        const response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: "512x512",
          });
          image_url = response.data.data[0].url;
          res.send({"url":image_url});
    } catch (error) {
        console.error(error);
    }
});

app.post('/message_old',async (req,res)=>{
    try {
        const msg = req.body.msg;
        const memory = req.body.memory;

        console.log("message arrived: "+msg);
        //fix grammar
        const fixedMsg = await fixMessage(msg);
        //build prompt from memory
        const promptFromMemory = buildPromptFromMemory(memory);
        //complete prompt with new the input
        const prompt = `${promptFromMemory} Zsolt:${fixedMsg} Sina:`;
        console.log("prompt all built up: "+prompt);
       
        const response = openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            n: 1,
            temperature:0.2,
            // stop:'\n', 
            max_tokens: 150,
            frequency_penalty: 0.5,
            frequency_penalty: 0.8

        });
    
        response.then((data)=>{
            const reply = data.data.choices[0].text.trim().replace('\n','');
            res.send({robotResponse:reply, fixedMsg:fixedMsg});
        });
    } catch (error) {
        console.error(error);        
    }

});

app.post('/message',async (req,res)=>{
    try {
        const msg = req.body.msg;
        const memory = req.body.memory;

        const fixedMsg = await fixMessage(msg);
        const promptFromMemory = buildPromptFromMemory(memory);
        const prompt = `${promptFromMemory} Mester:${fixedMsg} Sina:`;

        console.log("prompt",prompt);
       
        //complete prompt with new the input
        const messages = [
             {"role": "user", "content": `${prompt}`},
        ];
       
        const response = openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages,
            // n: 1,
            temperature:0.2,
            // stop:'\n', 
            max_tokens: 150,
            frequency_penalty: 0.1,
            frequency_penalty: 0.5
        });
    
        response.then((data)=>{
            const reply = data.data.choices[0].message?.content;
            console.log(`robot reply: ${reply}`);
            res.send({robotResponse:reply});
        });
    } catch (error) {
        console.error(error);        
    }

});

app.listen(3000, ()=>{
    console.log("Im listening to you master");
});