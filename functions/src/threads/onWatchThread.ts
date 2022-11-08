import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import type {FieldValue} from 'firebase-admin/firestore'

export const onWatchThread = functions.region('europe-west1')
  .firestore
  .document('subscriptions/{subId}').onWrite(async (snap) => {
    const db = admin.firestore()

    const beforeMap = snap.before.data()?.watched as Map<string, FieldValue>
    const before = Array.from(Object.keys(beforeMap || {}))
    const afterMap = snap.after.data()?.watched as Map<string, FieldValue>
    const after = Array.from(Object.keys(afterMap || {}))

    // if (!Array.isArray(before)) before = []
    // if (!Array.isArray(after)) after = []

    const added = after.filter((x) => !before.includes(x))
    if (added) {
      added.forEach(async (threadId) => {
        db.doc(`stream/${threadId}`).update({
          subscriberCount: admin.firestore.FieldValue.increment(1),
        })
      })
    }
    const removed = before.filter((x) => !after.includes(x))
    if (removed) {
      removed.forEach(async (threadId) => {
        db.doc(`stream/${threadId}`).update({
          subscriberCount: admin.firestore.FieldValue.increment(-1),
        })
      })
    }
  })
