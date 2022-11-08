import {onReplyToThread} from './notifications/onReplyToThread'
import {onPageCreated, onPageUpdated} from './sites/onPageChange'
import {onWatchThread} from './threads/onWatchThread'
import * as admin from 'firebase-admin'

admin.initializeApp()

export {
  onReplyToThread,
  onPageCreated,
  onPageUpdated,
  onWatchThread,
}
