const express = require("express");
const https = require("https");
const path = require("path");

const { addDays, format, differenceInSeconds } = require("date-fns");

let lastChecked = null;
let cachedValue = false;

const SOURCE_URL = "https://www.speakeasy.fi/finlayson/menu-finlayson/";

const getRegExp = () => {
  const today = format(new Date(), "DD\\.MM");
  const tomorrow = format(addDays(new Date(), 1), "DD\\.MM");
  return new RegExp(
    `LOUNASBUFFET([\\W\\w]+)${today}([\\W\\w]+?)loh(i|ta)([\\W\\w]+?)${tomorrow}`
  );
};

const checkLohibuffa = () =>
  new Promise(resolve => {
    if (lastChecked && differenceInSeconds(new Date(), lastChecked) < 3600) {
      resolve(cachedValue);
    } else {
      https
        .get(SOURCE_URL, resp => {
          let data = "";
          resp.on("data", chunk => {
            data += chunk;
          });
          resp.on("end", () => {
            const isLohibuffa = data.match(getRegExp()) !== null;
            lastChecked = new Date();
            cachedValue = isLohibuffa;
            resolve(isLohibuffa);
          });
        })
        .on("error", () => resolve(false));
    }
  });


const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/check", async (req, res) => {
  const isLohibuffa = await checkLohibuffa();
  res.json({ isLohibuffa });
});

app.listen(3000);
