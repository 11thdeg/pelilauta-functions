import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onReactionsLovedCreate = functions.region('europe-west1')
  .firestore
  .document('profiles/{uid}/reactions/{replyid}').onCreate(async (snap, context) => {
    const db = admin.firestore()

    const data = snap.data()

    const threadDoc = await db.collection('stream').doc(data.thread).get()
    if (!threadDoc.exists) throw new Error('Thread does not exist, or an invalid thread key was provided')

    const thread = threadDoc.data()
    if (thread === undefined) throw new Error('Thread data is undefined, this is likely a bug in Firestore')

    db.collection('notifications').add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      to: thread.author,
      from: context.params.uid,
      message: 'notification.reply.loved',
      targetKey: threadDoc.id + '/' + context.params.replyid,
      targetType: 'reply.loved',
      read: false,
    })
  })

