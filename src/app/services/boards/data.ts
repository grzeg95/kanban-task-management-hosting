import {Board} from '../../models/board';
import {BoardStatus} from '../../models/board-status';
import {BoardTask} from '../../models/board-task';
import {BoardTaskSubtask} from '../../models/board-task-subtask';
import {User} from '../auth/models/user';
import {UserBoard} from '../auth/models/user-board';

export type InMemoryUser = {
  userBoards: { [key in string]: UserBoard }
} & User;

export const defaultInMemoryUsers: { [key in string]: InMemoryUser } = {
  '0': {
    id: '0',
    disabled: false,
    darkMode: true,
    boardsIds: ['0', '1', '2'],
    userBoards: {
      '0': {
        id: '0',
        name: 'Platform Launch'
      },
      '1': {
        id: '1',
        name: 'Marketing Plan'
      },
      '2': {
        id: '2',
        name: 'Roadmap'
      }
    }
  }
};

export type InMemoryBoardTask = {
  boardTaskSubtasks: { [key in string]: BoardTaskSubtask }
} & BoardTask;

export type InMemoryBoard = {
  boardStatuses: { [key in string]: BoardStatus },
  boardTasks: { [key in string]: InMemoryBoardTask }
} & Board;

export const defaultInMemoryBoards: { [key in string]: InMemoryBoard } = {
  '0': {
    id: '0',
    name: 'Platform Launch',
    boardStatuses: {
      '0': {
        id: '0',
        name: 'Todo',
        boardTasksIds: ['0-0', '0-1', '0-2', '0-3']
      },
      '1': {
        id: '1',
        name: 'Doing',
        boardTasksIds: ['1-0', '1-1', '1-2', '1-3', '1-4', '1-5']
      },
      '2': {
        id: '2',
        name: 'Done',
        boardTasksIds: ['2-0', '2-1', '2-2', '2-3', '2-4', '2-6']
      }
    },
    boardTasks: {
      '0-0': {
        id: '0-0',
        title: 'Build UI for onboarding flow',
        description: '',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Sign up page',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Sign in page',
            isCompleted: false
          },
          '2': {
            id: '2',
            title: 'Welcome page',
            isCompleted: false
          }
        }
      },
      '0-1': {
        id: '0-1',
        title: 'Build UI for search',
        description: '',
        boardTaskSubtasksIds: ['0'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Search page',
            isCompleted: false
          }
        },
      },
      '0-2': {
        id: '0-2',
        title: 'Build settings UI',
        description: '',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Account page',
            isCompleted: false
          },
          '1': {
            id: '1',
            title: 'Billing page',
            isCompleted: false
          }
        }
      },
      '0-3': {
        id: '0-3',
        title: 'QA and test all major user journeys',
        description: 'Once we feel version one is ready, we need to rigorously test it both internally and externally to identify any major gaps.',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Internal testing',
            isCompleted: false
          },
          '1': {
            id: '1',
            title: 'External testing',
            isCompleted: false
          }
        }
      },
      '1-0': {
        id: '1-0',
        title: 'Design settings and search pages',
        description: '',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '1',
        completedBoardTaskSubtasks: 2,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Settings - Account page',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Settings - Billing page',
            isCompleted: true
          },
          '2': {
            id: '2',
            title: 'Search page',
            isCompleted: false
          },
        }
      },
      '1-1': {
        id: '1-1',
        title: 'Add account management endpoints',
        description: '',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '1',
        completedBoardTaskSubtasks: 2,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Upgrade plan',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Cancel plan',
            isCompleted: true
          },
          '2': {
            id: '2',
            title: 'Update payment method',
            isCompleted: false
          }
        }
      },
      '1-2': {
        id: '1-2',
        title: 'Design onboarding flow',
        description: '',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '1',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Sign up page',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Sign in page',
            isCompleted: false
          },
          '2': {
            id: '2',
            title: 'Welcome page',
            isCompleted: false
          },
        }
      },
      '1-3': {
        id: '1-3',
        title: 'Add search enpoints',
        description: '',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '1',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Add search endpoint',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Define search filters',
            isCompleted: false
          }
        }
      },
      '1-4': {
        id: '1-4',
        title: 'Add authentication endpoints',
        description: '',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '1',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Define user model',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Add auth endpoints',
            isCompleted: false
          }
        }
      },
      '1-5': {
        id: '1-5',
        title: 'Research pricing points of various competitors and trial different business models',
        description: 'We know what we\'re planning to build for version one. Now we need to finalise the first pricing model we\'ll use. Keep iterating the subtasks until we have a coherent proposition.',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '1',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Research competitor pricing and business models',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Outline a business model that works for our solution',
            isCompleted: false
          },
          '2': {
            id: '2',
            title: 'Talk to potential customers about our proposed solution and ask for fair price expectancy',
            isCompleted: false
          }
        }
      },
      '2-0': {
        id: '2-0',
        title: 'Conduct 5 wireframe tests',
        description: 'Ensure the layout continues to make sense and we have strong buy-in from potential users.',
        boardTaskSubtasksIds: ['0'],
        boardStatusId: '2',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Complete 5 wireframe prototype tests',
            isCompleted: true
          }
        }
      },
      '2-1': {
        id: '2-1',
        title: 'Create wireframe prototype',
        description: 'Create a greyscale clickable wireframe prototype to test our asssumptions so far.',
        boardTaskSubtasksIds: ['0'],
        boardStatusId: '2',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Create clickable wireframe prototype in Balsamiq',
            isCompleted: true
          }
        }
      },
      '2-2': {
        id: '2-2',
        title: 'Review results of usability tests and iterate',
        description: 'Keep iterating through the subtasks until we\'re clear on the core concepts for the app.',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '2',
        completedBoardTaskSubtasks: 3,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Meet to review notes from previous tests and plan changes',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Make changes to paper prototypes',
            isCompleted: true
          },
          '2': {
            id: '2',
            title: 'Conduct 5 usability tests',
            isCompleted: true
          },
        }
      },
      '2-3': {
        id: '2-3',
        title: 'Create paper prototypes and conduct 10 usability tests with potential customers',
        description: '',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '2',
        completedBoardTaskSubtasks: 2,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Create paper prototypes for version one',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Complete 10 usability tests',
            isCompleted: true
          }
        }
      },
      '2-4': {
        id: '2-4',
        title: 'Market discovery',
        description: 'We need to define and refine our core product. Interviews will help us learn common pain points and help us define the strongest MVP.',
        boardTaskSubtasksIds: ['0'],
        boardStatusId: '2',
        completedBoardTaskSubtasks: 1,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Interview 10 prospective customers',
            isCompleted: true
          }
        }
      },
      '2-5': {
        id: '2-5',
        title: 'Competitor analysis',
        description: '',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '2',
        completedBoardTaskSubtasks: 2,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Find direct and indirect competitors',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'SWOT analysis for each competitor',
            isCompleted: true
          },
        }
      },
      '2-6': {
        id: '2-6',
        title: 'Research the market',
        description: 'We need to get a solid overview of the market to ensure we have up-to-date estimates of market size and demand.',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '2',
        completedBoardTaskSubtasks: 2,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Write up research analysis',
            isCompleted: true
          },
          '1': {
            id: '1',
            title: 'Calculate TAM',
            isCompleted: true
          }
        }
      },
    },
    boardTasksIds: ['0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3', '1-4', '1-5', '2-0', '2-1', '2-2', '2-3', '2-4', '2-5', '2-6'],
    boardStatusesIds: ['0', '1', '2']
  },
  '1': {
    id: '1',
    name: 'Marketing Plan',
    boardStatuses: {
      '0': {
        id: '0',
        name: 'Todo',
        boardTasksIds: ['0-0', '0-1', '0-2']
      },
      '1': {
        id: '1',
        name: 'Doing',
        boardTasksIds: []
      },
      '2': {
        id: '2',
        name: 'Done',
        boardTasksIds: []
      },
    },
    boardTasks: {
      '0-0': {
        id: '0-0',
        title: 'Plan Product Hunt launch',
        description: '',
        boardTaskSubtasksIds: ['0', '1', '2', '3', '4', '5'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Find hunter',
            isCompleted: false
          },
          '1': {
            id: '1',
            title: 'Gather assets',
            isCompleted: false
          },
          '2': {
            id: '2',
            title: 'Draft product page',
            isCompleted: false
          },
          '3': {
            id: '3',
            title: 'Notify customers',
            isCompleted: false
          },
          '4': {
            id: '4',
            title: 'Notify network',
            isCompleted: false
          },
          '5': {
            id: '5',
            title: 'Launch!',
            isCompleted: false
          },
        }
      },
      '0-1': {
        id: '0-1',
        title: 'Share on Show HN',
        description: '',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Draft out HN post',
            isCompleted: false
          },
          '1': {
            id: '1',
            title: 'Get feedback and refine',
            isCompleted: false
          },
          '2': {
            id: '2',
            title: 'Publish post',
            isCompleted: false
          },
        }
      },
      '0-2': {
        id: '2',
        title: 'Write launch article to publish on multiple channels',
        description: '',
        boardTaskSubtasksIds: ['0', '1', '2', '3'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Write article',
            isCompleted: false
          },
          '1': {
            id: '1',
            title: 'Publish on LinkedIn',
            isCompleted: false
          },
          '2': {
            id: '2',
            title: 'Publish on Inndie Hackers',
            isCompleted: false
          },
          '3': {
            id: '3',
            title: 'Publish on Medium',
            isCompleted: false
          },
        }
      }
    },
    boardTasksIds: ['0-0', '0-1', '0-2'],
    boardStatusesIds: ['0', '1', '2']
  },
  '2': {
    id: '2',
    name: 'Roadmap',
    boardStatuses: {
      '0': {
        id: '0',
        name: 'Now',
        boardTasksIds: ['0-0', '0-1']
      },
      '1': {
        id: '1',
        name: 'Next',
        boardTasksIds: []
      },
      '2': {
        id: '2',
        name: 'Later',
        boardTasksIds: []
      }
    },
    boardTasks: {
      '0-0': {
        id: '0',
        title: 'Launch version one',
        description: '',
        boardTaskSubtasksIds: ['0', '1'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Launch privately to our waitlist',
            isCompleted: false
          },
          '1': {
            id: '1',
            title: 'Launch publicly on PH, HN, etc.',
            isCompleted: false
          }
        }
      },
      '0-1': {
        id: '1',
        title: 'Review early feedback and plan next steps for roadmap',
        description: 'Beyond the initial launch, we\'re keeping the initial roadmap completely empty. This meeting will help us plan out our next steps based on actual customer feedback.',
        boardTaskSubtasksIds: ['0', '1', '2'],
        boardStatusId: '0',
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks: {
          '0': {
            id: '0',
            title: 'Interview 10 customers',
            isCompleted: false
          },
          '1': {
            id: '1',
            title: 'Review common customer pain points and suggestions',
            isCompleted: false
          },
          '2': {
            id: '2',
            title: 'Outline next steps for our roadmap',
            isCompleted: false
          }
        }
      }
    },
    boardTasksIds: ['0-0', '0-1'],
    boardStatusesIds: ['0', '1', '2']
  }
};

export type InMemoryStore = {
  users: { [key in string]: InMemoryUser },
  boards: { [key in string]: InMemoryBoard }
}
