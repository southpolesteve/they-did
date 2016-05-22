const Twit = require('twit')
const env = require('./env')
const _ = require('lodash')

const T = new Twit(env.twitter)

const regex = /(who called it|what idiot called it)(.+)(and not)/ig
const query = '"what idiot called it" OR "who called it" -RT'

T.get('search/tweets', {
  q: query,
  count: 100,
  result_type: 'recent'
})
.get('data')
.get('statuses')
.map((tweet) => {
  return { id: tweet.id_str, text: tweet.text, username: tweet.user.screen_name }
})
.map((tweet) => {
  const matches = regex.exec(tweet.text)
  if (matches) { tweet.phrase = _.trim(matches[2],'"\'? ') }
  return matches ? tweet : null
})
.then(_.compact)
.then(_.sample)
.then((accuser) => {
  return T.get('search/tweets', {
    q: `"${accuser.phrase}" -"what idiot called it" -"who called it" -RT -@${accuser.username}`,
    count: 100,
    result_type: 'recent'
  })
  .get('data')
  .get('statuses')
  .map((tweet) => {
    return { id: tweet.id_str, text: tweet.text, username: tweet.user.screen_name }
  })
  .then(_.sample)
  .then((accused) => [accuser, accused] )
})
.spread((accuser,accused) => {
  if (accused){
    console.log(`https://twitter.com/${accuser.username}/status/${accuser.id}`)
    console.log(accuser.text)
    console.log(`https://twitter.com/${accused.username}/status/${accused.id}`)
    console.log(accused.text)
    //return T.post('statuses/update', { in_reply_to_status_id: accuser.id, status: `@${accuser.username} they did: https://twitter.com/${accused.username}/status/${accused.id}` })
  } else {
    console.log('ERROR: Couldnt match up the tweet')
    console.log(accuser)
  }
})
