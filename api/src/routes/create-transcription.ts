import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai";

import {createReadStream} from 'node:fs'

export async function createTranscriptionRoute(app:FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (req, reply) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid()
    })

    const { videoId } = paramsSchema.parse(req.params)

    const bodyShema = z.object({
      prompt: z.string()
    })

    const { prompt } = bodyShema.parse(req.body)
    
    const video = await prisma.video.findUniqueOrThrow({
      where:{
        id: videoId
      }
    })
    
    if(!video) return reply.status(400).send({error: 'VideoId is not found'})
    
    const videoPath = video.path
    const audioReadStream = createReadStream(videoPath)

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      language: "pt",
      response_format: "json",
      temperature: 0,
      prompt,
    })
    
    const transcription = response.text
    
    await prisma.video.update({
      where: { id: videoId },
      data: { transcription }
    })

    return { transcription }
  })
}