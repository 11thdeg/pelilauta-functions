import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

/**
 * Creates a notification for the author of a reply when a user loves their reply
 *
 * @param {admin.firestore.DocumentData} data DocData for the reaction
 * @param {functions.EventContext} context function context
 */
async function handleReplyReaction(data: admin.firestore.DocumentData, context: functions.EventContext) {
  const db = admin.firestore()

  const keys = data.targetKey.split('/')
  const threadKey = keys[0]
  const replyKey = keys[1]

  const replyDoc = await db.collection('stream').doc(threadKey).collection('comments').doc(replyKey).get()
  if (!replyDoc.exists) throw new Error('Thread does not exist, or an invalid thread key was provided')

  const reply = replyDoc.data()
  if (reply === undefined) throw new Error('Reply data is undefined, this is likely a bug in Firestore')

  db.collection('notifications').add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    to: reply.author,
    from: context.params.uid,
    message: 'notification.reply.loved',
    targetKey: threadKey + '/' + replyKey,
    targetType: 'reply.loved',
    read: false,
  })
}

/**
 * Creates a notification for the owners of a site when a user loves their site, and increments the site's loves count
 *
 * Also decrements the site's loves count when a user unloves a site
 *
 * @param {admin.firestore.DocumentData} data DocData for the reaction
 */
async function handleSiteReaction(data: admin.firestore.DocumentData) {
  const db = admin.firestore()

  const siteKey = data.targetKey

  const siteDoc = await db.collection('sites').doc(siteKey).get()
  if (!siteDoc.exists) throw new Error('Site does not exist, or an invalid site key was provided')

  const site = siteDoc.data()
  if (site === undefined) throw new Error('Site data is undefined, this is likely a bug in Firestore')

  if (data.type === 'love') {
    await db.collection('sites').doc(siteKey).update({
      lovesCount: admin.firestore.FieldValue.increment(1),
    })

    const actorData = await db.collection('profiles').doc(data.actor).get()

    if (!actorData.exists) throw new Error('Actor does not exist, or an invalid actor key was provided')

    const actor = actorData.data()
    if (actor === undefined) throw new Error('Actor data is undefined, this is likely a bug in Firestore')

    const actorSites = actor.lovedSites || []
    actorSites.push(siteKey)

    await db.collection('profiles').doc(data.actor).update({
      lovedSites: actorSites,
    })

    for (const owner of site.owners) {
      await db.collection('notifications').add({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        to: owner,
        from: data.actor,
        message: 'notification.site.loved',
        targetKey: siteKey,
        targetType: 'site.loved',
        read: false,
      })
    }
  } else if (data.type === 'unlove') {
    const actorData = await db.collection('profiles').doc(data.actor).get()

    if (!actorData.exists) throw new Error('Actor does not exist, or an invalid actor key was provided')

    const actor = actorData.data()
    if (actor === undefined) throw new Error('Actor data is undefined, this is likely a bug in Firestore')

    const actorSites = actor.lovedSites || []
    const index = actorSites.indexOf(siteKey)
    actorSites.splice(index, 1)

    await db.collection('profiles').doc(data.actor).update({
      lovedSites: actorSites,
    })

    if (site.lovesCount === 0) throw new Error('Site loves count is 0, this is likely an error in the database')

    await db.collection('sites').doc(siteKey).update({
      lovesCount: admin.firestore.FieldValue.increment(-1),
    })
  }
}

export const onReactionsCreate = functions.region('europe-west1')
  .firestore
  .document('profiles/{uid}/reactions/{reactionKey}').onCreate(async (snap, context) => {
    const data = snap.data()

    if (data === undefined) throw new Error('Reaction data is undefined, this is likely a bug in Firestore')
    if (data.targetEntry === undefined) throw new Error('Reaction target entry is undefined, this is likely a bug in Client')
    if (data.type === undefined) throw new Error('Reaction target type is undefined, this is likely a bug in Client')

    if (data.targetEntry === 'sites') handleSiteReaction(data)
    else if (data.targetEntry === 'comments') handleReplyReaction(data, context)
    else throw new Error('Invalid target entry provided, this is likely a bug in Client ' + data.targetEntry + ' ' + data.type)
  })

