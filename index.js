const { Telegraf } = require('telegraf')
const axios = require('axios');

const bot = new Telegraf("{telegram_token}")
const request_url = 'http://localhost:41184/notes?token={joplin_token}'

bot.start((ctx) => {
  ctx.reply('Welcome to your Joplin notebook!, just type /help for available commands 😊')
})
bot.help((ctx) => ctx.reply('Use /notes to gel all your notes, or send a message to create a note...'))
bot.command('notes', async ctx => {
  let notes = await axios.get(request_url)
  ctx.reply(notes.data.map(p => p.title).join('\n'))
})
bot.on('text', async ctx => {
  let note = new Note(ctx.message.text.slice(0, 25), ctx.message.text)
  await axios.post(request_url, note)
  ctx.reply('You created a new text note successfully!')
})
bot.on('photo', async ctx => {
  let caption = ctx.message.caption ? ctx.message.caption : 'No title'
  let note = new Note(caption, caption, ctx.message.photo)
  await note.setImageData(ctx)
  await axios.post(request_url, note);
  ctx.reply('You created a new image note successfully!')
})
bot.launch()

class Note {
  constructor(title, body) {
    this.title = title
    this.body = body
    this.image_data_url = null
  }

  async setImageData(ctx) {
    if (ctx.message.photo) {
      // get largest possible
      let largest = ctx.message.photo.reduce((prev, current) => (+prev.width > +current.width) ? prev : current)
      let image_url = await ctx.telegram.getFileLink(largest.file_id)
      let image_result = await axios.get(image_url, { responseType: 'arraybuffer' });
      this.image_data_url = "data:image/png;base64," + Buffer.from(image_result.data).toString('base64');
    }
  }
}