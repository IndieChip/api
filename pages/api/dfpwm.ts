import { NextApiRequest, NextApiResponse } from "next";
import path from "path"
import fs from 'fs'
import {exec} from 'child_process'
import ytdl from "@distube/ytdl-core";

function generateTrace(code, trace, content) {return {"Code": code, "Exception": trace, "DATA": content}}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {url} = req.query
  if (url && typeof(url) == "string") {
    if (url.includes("https")) {res.status(200).json(generateTrace(-1, "101_INVALID_QUERY", {})); return}
    const url2 = "https://www.youtube.com/watch?v=" + url
    if (ytdl.validateURL(url2) == true) {
      let cache = (Math.random() + 1).toString(36).substring(2);const I = path.join(process.cwd(), path.join("/tmp",`temp-${cache}.mp3`));const O = path.join(path.join(process.cwd(), "/tmp"), `temp-${cache}.dfpwm`);const audioWriteStream = fs.createWriteStream(I);var audio = await ytdl(url2, { quality: "highestaudio" });
      audio.pipe(audioWriteStream);

      audio.on("finish", async () => {
        exec(`${require("ffmpeg-static")} -i ${I} -ac 1 -c:a dfpwm ${O} -ar 48k`).on("close", (code) => {console.log(`Process FFmpeg exited with code ${code}`);
        if (code == 0) {
          fs.readFile(O, "utf8", (err, data) => {
            if (err) {res.status(200).json(generateTrace(-1, "101_IO_READ_ERROR",{})); return}
            fs.createReadStream(O).pipe(res);
          })
        }else{res.status(200).json(generateTrace(-1, "101_FFMPEG_FAILURE",{}))}
        fs.unlink(I, (err) => {if (err) {res.status(200).json(generateTrace(-2,"404_IO_DELETE_ERROR",{"MAINTENANCE REQUIRED": "PLEASE CONTACT IF YOU RECEIVE THIS ERROR @github.com/bakedc"}))}})
        //fs.unlink(O, (err) => {if (err) {res.status(200).json(generateTrace(-2,"404_IO_DELETE_ERROR",{"MAINTENANCE REQUIRED": "PLEASE CONTACT IF YOU RECEIVE THIS ERROR @github.com/bakedc"}))}}) 
      })})
    }
    else{res.status(200).json(generateTrace(-1, "101_INVALID_URL", {}))}
  }
}