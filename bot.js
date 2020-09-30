const telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const axios = require('axios');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

// scene
const country = new Scene('indonesia');
country.enter(async (ctx) => {
  try {
    const { data } = await axios.get('https://api.kawalcorona.com/indonesia');
    const result = `positif : ${data[0].positif}\nsembuh : ${data[0].sembuh}\nmeninggal : ${data[0].meninggal}\ndirawat : ${data[0].dirawat}`;
    await ctx.reply(result);
    await ctx.reply(
      'menu on keyboard press /cancel for quit',
      Markup.keyboard(['/view', '/cancel']).oneTime().resize().extra()
    );
    country.hears('/view', async (ctx) => {
      await ctx.reply(result);
    });
  } catch (error) {
    console.log(error);
  }
});
country.leave((ctx) => ctx.reply('Bye, see you next time'));
country.hears(/cancel/gi, leave());

const provinsi = new Scene('provinsi');
provinsi.enter(async (ctx) => {
  try {
    const { data } = await axios.get(
      'https://api.kawalcorona.com/indonesia/provinsi'
    );
    const provinsiName = [];
    data.map((val) => {
      provinsiName.push(val.attributes.Provinsi);
    });
    const provinsiArray = [];
    const size = 3;
    for (var i = 0; i < provinsiName.length; i += size) {
      provinsiArray.push(provinsiName.slice(i, i + size));
    }
    await ctx.reply(
      'please choose menu on keyboard',
      Markup.keyboard(provinsiArray).oneTime().resize().extra()
    );
    provinsi.on('text', async (ctx) => {
      const input = ctx.update.message.text;
      const found = data.some((val) => {
        // object harus di return
        return val.attributes.Provinsi == input;
      });
      if (!found) {
        return ctx.reply(
          `sory, can't view data please choose menu in keyboard`
        );
      }
      // modify data array using find other map, find, filter
      const dataProvinsi = data.find((val) => val.attributes.Provinsi == input);
      await ctx.reply(
        `Provinsi : ${dataProvinsi.attributes.Provinsi}\nPositif : ${dataProvinsi.attributes.Kasus_Posi}\nSembuh : ${dataProvinsi.attributes.Kasus_Semb}\nMeninggal : ${dataProvinsi.attributes.Kasus_Meni}`
      );
      ctx.reply('press /cancel for quit');
    });
  } catch (error) {
    console.log(error);
  }
});
provinsi.leave((ctx) => ctx.reply('Bye, see you next time'));
provinsi.hears(/cancel/gi, leave());

// Create scene manager
const stage = new Stage();
stage.command('cancel', leave());

// Scene registration
stage.register(country);
stage.register(provinsi);

const bot = new telegraf('1031885320:AAEC1XR3GkTb6X9u02_qCgvMbywpvZ6dkZg');
const startMessage = `
WELCOME TO THE COVID BOT
please press /help to view menu
`;
bot.start((ctx) => ctx.reply(startMessage));
const helpMessage = `
DATA COVID INDONESIA
/indonesia - to see all covid data
/provinsi - to see all covid data by province`;
bot.help((ctx) => {
  ctx.reply(helpMessage);
});
bot.use(session());
bot.use(stage.middleware());
bot.command('indonesia', (ctx) => ctx.scene.enter('indonesia'));
bot.command('provinsi', (ctx) => ctx.scene.enter('provinsi'));
bot.on('text', (ctx, next) => {
  ctx.reply('Hello, if you want to select the menu press /help');
  return next();
});
bot.startPolling();
