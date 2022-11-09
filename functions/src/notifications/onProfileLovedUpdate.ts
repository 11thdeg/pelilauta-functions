import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onProfileLovedUpdate = functions.region('europe-west1')
  .firestore
  .document('profiles/{uid}').onUpdate(async (snap, context) => {
    const db = admin.firestore()

    const before:string[] = snap.before.data()?.lovedThreads || []
    const after:string[] = snap.after.data()?.lovedThreads || []

    const added = after.filter((id) => !before.includes(id))

    added.forEach(async (id) => {
      const threadDoc = await db.collection('stream').doc(id).get()

      if (!threadDoc.exists) return
      const thread = threadDoc.data()
      if (thread === undefined) return

      db.collection('notifications').add({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        to: thread.author,
        from: context.params.uid,
        message: 'notification.thread.loved',
        targetKey: id,
        targetType: 'thread.loved',
        read: false,
      })
    })
  })
