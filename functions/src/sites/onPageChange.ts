import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

/**
 * As a user might not have the rights to update site data, we need to stamp change times by the admin
 *
 * @param {string} siteId the site updated
 * @return {Promise<admin.firestore.WriteResult>} A Promise resolved with the write time of this update.
 */
async function updateSiteOnPageChange(siteId: string) {
  const db = admin.firestore()
  const siteRef = db.doc(`sites/${siteId}`)
  const data:admin.firestore.DocumentData = {}
  data.updatedAt = admin.firestore.FieldValue.serverTimestamp()
  data.flowTime = admin.firestore.FieldValue.serverTimestamp()

  return siteRef.update({
    ...data,
  })
}

export const onPageCreated = functions.region('europe-west1')
  .firestore
  .document('sites/{siteId}/pages/{pageId}').onCreate(async (snap, context) => {
    const siteId = context.params.siteId
    updateSiteOnPageChange(siteId)
  })

export const onPageUpdated = functions.region('europe-west1')
  .firestore
  .document('sites/{siteId}/pages/{pageId}').onUpdate(async (snap, context) => {
    const siteId = context.params.siteId
    updateSiteOnPageChange(siteId)
  })
