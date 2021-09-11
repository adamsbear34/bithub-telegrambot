require('dotenv').config();
const {textFormat, hashTagsFormat } = require('./functions/postEditing');

//  The maximum amount of news in one post
const LIMIT = 3;

const moment = require('moment-timezone');



let Parser = require('rss-parser');
let parser = new Parser();

const { Telegraf } = require('telegraf');

//  Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN);

//  All the rss feed that will be parsed
const rssFeeds = [
    "https://coinspot.io/feed/",
    "https://bits.media/rss2/",
    "https://ru.ihodl.com/feed/default/",
];

let rssFeedsItems = {
    "https://coinspot.io/feed/": {
        buffer: []
    },
    "https://bits.media/rss2/": {
        buffer: []
    },
    "https://ru.ihodl.com/feed/default/": {
        buffer: []
    }
    
};

//  The default value for lastTimeUpdated is some time in the past
let lastTimeUpdated = new Date('2020-08-17T10:45:03.000Z');
var timeUpdated;

//  Functions that is responsible for sending built message to the Telegram Channel 
const sendMessage = (msg) => {
    try{
        bot.telegram.sendMessage(`${process.env.CHAT_ID}`, msg, {parse_mode: 'HTML', disable_web_page_preview: false});
    }catch(err){
        console.log(err + ` ${msg}`);
    }
    
};



//  Function that builds the message for the telegram post
const buildPost = (news, limit) => {
    let message = "";
    let description = '';
    let tags = '';

    if (news.length > 1){

        for (let i = 0; i < news.length; i++){
            if (i == limit){
                break;
            }
            if (news[i].title && news[i].link) {
                description = textFormat(news[i].contentSnippet);
                tags =  hashTagsFormat(news[i].categories);

                message = message + `
📰  ${description} <a href="${news[i].link}">далее...</a>
`;
            }
        }

    }else{
        description = textFormat(news[0].contentSnippet);
        tags =  hashTagsFormat(news[0].categories);

        message =`
📰  ${description} <a href="${news[0].link}">далее...</a>
        
${tags}
`;
    } 


//     for (let i = 0; i < news.length; i++) {
//         if (i == limit) {
//             break;
//         }
        

//         if (news[i].title && news[i].link) {
            
//             const description = textFormat(news[i].contentSnippet);
//             const tags =  hashTagsFormat(news[i].categories);
            
//            message =`
// 📰  ${description} <a href="${news[i].link}">далее...</a>

// ${tags}
// `;
//         }
//     }

    return message;
};

//  Function that parses the data from the rss feed
//  Then it returns only new posts
const parsing = async (url, limit) => {
    let items = [];
    items.length = 0;

    timeUpdated = moment.tz('Europe/Moscow');

    timeUpdated = timeUpdated.format("YYYY-MM-DD HH:mm:ss");

    //  Parsing the feed
    try {
        feed = await parser.parseURL(url);
        for (let i = 0; i < feed.items.length; i++) {

            //  Брать только нужные посты из RSS фида 
            if (i == limit) {
                break;
            }

            //  Определить есть ли в буфере текущий элемент
            //  Если элемента в буфере нет, то добавить элемент в items и записать в буфер 
            //  Так же следует сместить буфер, используя shift (очистить первый элемент массива буфера)
            let exist = rssFeedsItems[url].buffer.find(function(ele) {return ele.toString() === feed.items[i].pubDate.toString();});

            if (exist === undefined) {
                rssFeedsItems[url].buffer.push(feed.items[i].pubDate);
                if (rssFeedsItems[url].buffer.length == (limit * 2)) {
                    rssFeedsItems[url].buffer.shift();
                }

                items.push(feed.items[i]);
            } else {
                break;
            }
        }
    } catch (err) {
        console.log(err);
    }

    return items;
};

//  Function that parses the data from all the rss feeds
//  And then send separate messages to the Telegram channel
const updateAttempt = async (limit) => {
    let message = "";

    try {
        await Promise.all(rssFeeds.map(async (rssFeed) => {
            parsing(rssFeed, limit).then((news) => {
                if (news.length > 0) {
                    message = buildPost(news, limit);
                    if (message) { 
                        sendMessage(message);
                        lastTimeUpdated = timeUpdated;
                    }
                }
            });
        }));
    } catch (err) {
        console.log(err);
    } 

    console.log("Last Time Updated: " + lastTimeUpdated);
}

const flagOn = true;

//  SetInterval that makes update attempts
interval = setInterval(async () => {
    await updateAttempt(LIMIT);

    if (!flagOn) {
        clearInterval(interval);
        }
    }, 600000
);




