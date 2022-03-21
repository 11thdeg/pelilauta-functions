import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()

export const onReplyToThread = functions.region('europe-west1')
  .firestore
  .document('stream/{threadId}/comments/{commentId}').onCreate(async (snap, context) => {
    const parent = await db.doc(`stream/${context.params.threadId}`).get()
    const replyData = snap.data()
    const threadData = parent.data()

    if (!parent.exists || !threadData) {
      throw new Error('Parent thread does not exist, this is likely a firebase internal error')
    }

    if (parent.data()?.author === replyData.author) return // Ignore own replies

    let content = (replyData.markdownContent || '').trim()
    content = content.length > 80 ? content.substring(0, 120) + '...' : content

    db.collection('notifications').add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      to: threadData.author,
      from: replyData.author,
      message: content,
      targetKey: context.params.threadId,
      targetType: 'thread',
      read: false,
    })
  })
