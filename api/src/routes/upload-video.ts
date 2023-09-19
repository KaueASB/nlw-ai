import { FastifyInstance } from "fastify";
import { fastifyMultipart } from '@fastify/multipart'

import path from "node:path";
import {randomUUID} from "node:crypto";
import fs from "node:fs";
import {promisify} from 'node:util'
import {pipeline} from 'node:stream'

// import { prisma } from "../lib/prisma";

const pump = promisify(pipeline)

export async function uploadVideoRoute(app:FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25, //25mb
    }
  })

  app.post('/videos', async (req, reply) => {
    const data = await req.file()
    if(!data) return reply.status(400).send({error: 'Missing file input.'})

    const extension = path.extname(data.filename)
    if(extension !== '.mp3') return reply.status(400).send({error: 'Invalid input type. Please upload a MP3'})

    const fileBaseName = path.basename(data.filename, extension)
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`
    const uploadDestination = path.resolve(__dirname,'../../tmp', fileUploadName)

    await pump(data.file, fs.createWriteStream(uploadDestination))

    // const video = await prisma.video.create({
    //   data: {
    //     name: data.filename,
    //     path: uploadDestination,
    //   }
    // })
    
    // return { video }
    return reply.send({ fileUploadName })

    // const stream = fs.createReadStream(uploadDestination)

    // reply.headers({
    //   'Content-Disposition': `attachment; filename="${fileUploadName}"`,
    //   // 'Content-Type': 'octet-stream',
    //   'Content-Type': 'audio/mpeg'
    // })

    // const responseObject = { fileUploadName, stream }
    // const responseString = JSON.stringify(responseObject);
    // reply.send(responseString);
    
  })
}