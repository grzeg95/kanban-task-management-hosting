export const environment = {
  production: false,
  firebase: {
    projectId: 'kanban-task-management-32435',
    appId: '1:1034472916993:web:545f7d38f61a83fbc4d800',
    storageBucket: 'kanban-task-management-32435.appspot.com',
    apiKey: 'AIzaSyAczBNpym-TaUA2Gy6z6q_FMmtJVOA9sew',
    authDomain: 'kanban-task-management-32435.firebaseapp.com',
    messagingSenderId: '1034472916993',
    measurementId: 'G-TP42T9DVYF'
  },
  recaptchaEnterprise: '6Le2r3QpAAAAAAmARlznGeN2AHVUSrt16QP7_wL-',
  emulators: {
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      protocol: 'http'
    },
    functions: {
      host: '127.0.0.1',
      port: 5001,
      protocol: 'http'
    },
    auth: {
      host: '127.0.0.1',
      port: 9099,
      protocol: 'http'
    }
  }
};
