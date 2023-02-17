import {onReplyToThread} from './notifications/onReplyToThread'
import {onPageCreated, onPageUpdated} from './sites/onPageChange'
import {onWatchThread} from './threads/onWatchThread'
import {onProfileLovedUpdate} from './notifications/onProfileLovedUpdate'
import {onReactionsCreate} from './notifications/onReactionsLovedCreate'
import * as admin from 'firebase-admin'

admin.initializeApp()

export {
  onReplyToThread,
  onPageCreated,
  onPageUpdated,
  onWatchThread,
  onProfileLovedUpdate,
  onReactionsCreate,
}
