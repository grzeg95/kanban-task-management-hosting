import {Board} from '../../models/board';
import {User} from '../auth/user.model';

export const defaultUser: User = {
  id: '0',
  boards: [
    {
      id: '0',
      name: 'Platform Launch'
    },
    {
      id: '1',
      name: 'Marketing Plan'
    },
    {
      id: '2',
      name: 'Roadmap'
    }
  ]
};

export const defaultBoards: { [key in string]: Board } = {
  '0': {
    id: '0',
    name: 'Platform Launch',
    statuses: {
      '0': {
        id: '0',
        name: 'Todo',
        tasks: {
          '0': {
            id: '0',
            title: 'Build UI for onboarding flow',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          },
          '1': {
            id: '1',
            title: 'Build UI for search',
            description: '',
            subtasks: {
              '0': {
                id: '0',
                title: 'Search page',
                isCompleted: false
              }
            },
            subtasksIdsSequence: ['0']
          },
          '2': {
            id: '2',
            title: 'Build settings UI',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          },
          '3': {
            id: '3',
            title: 'QA and test all major user journeys',
            description: 'Once we feel version one is ready, we need to rigorously test it both internally and externally to identify any major gaps.',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          }
        },
        tasksIdsSequence: ['0', '1', '2', '3']
      },
      '1': {
        id: '1',
        name: 'Doing',
        tasks: {
          '0': {
            id: '0',
            title: 'Design settings and search pages',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          },
          '1': {
            id: '1',
            title: 'Add account management endpoints',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          },
          '2': {
            id: '2',
            title: 'Design onboarding flow',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          },
          '3': {
            id: '3',
            title: 'Add search enpoints',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          },
          '4': {
            id: '4',
            title: 'Add authentication endpoints',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          },
          '5': {
            id: '5',
            title: 'Research pricing points of various competitors and trial different business models',
            description: 'We know what we\'re planning to build for version one. Now we need to finalise the first pricing model we\'ll use. Keep iterating the subtasks until we have a coherent proposition.',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          },
        },
        tasksIdsSequence: ['0', '1', '2', '3', '4', '5']
      },
      '2': {
        id: '2',
        name: 'Done',
        tasks: {
          '0': {
            id: '0',
            title: 'Conduct 5 wireframe tests',
            description: 'Ensure the layout continues to make sense and we have strong buy-in from potential users.',
            subtasks: {
              '0': {
                id: '0',
                title: 'Complete 5 wireframe prototype tests',
                isCompleted: true
              }
            },
            subtasksIdsSequence: ['0']
          },
          '1': {
            id: '1',
            title: 'Create wireframe prototype',
            description: 'Create a greyscale clickable wireframe prototype to test our asssumptions so far.',
            subtasks: {
              '0': {
                id: '0',
                title: 'Create clickable wireframe prototype in Balsamiq',
                isCompleted: true
              }
            },
            subtasksIdsSequence: ['0']
          },
          '2': {
            id: '2',
            title: 'Review results of usability tests and iterate',
            description: 'Keep iterating through the subtasks until we\'re clear on the core concepts for the app.',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          },
          '3': {
            id: '3',
            title: 'Create paper prototypes and conduct 10 usability tests with potential customers',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          },
          '4': {
            id: '4',
            title: 'Market discovery',
            description: 'We need to define and refine our core product. Interviews will help us learn common pain points and help us define the strongest MVP.',
            subtasks: {
              '0': {
                id: '0',
                title: 'Interview 10 prospective customers',
                isCompleted: true
              }
            },
            subtasksIdsSequence: ['0']
          },
          '5': {
            id: '5',
            title: 'Competitor analysis',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          },
          '6': {
            id: '6',
            title: 'Research the market',
            description: 'We need to get a solid overview of the market to ensure we have up-to-date estimates of market size and demand.',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          },
        },
        tasksIdsSequence: ['0', '1', '2', '3', '4', '6']
      }
    },
    statusesIdsSequence: ['0', '1', '2']
  },
  '1': {
    id: '1',
    name: 'Marketing Plan',
    statuses: {
      '0': {
        id: '0',
        name: 'Todo',
        tasks: {
          '0': {
            id: '0',
            title: 'Plan Product Hunt launch',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2', '3', '4', '5']
          },
          '1': {
            id: '1',
            title: 'Share on Show HN',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          },
          '2': {
            id: '2',
            title: 'Write launch article to publish on multiple channels',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2', '3']
          }
        },
        tasksIdsSequence: ['0', '1', '2']
      },
      '1': {
        id: '1',
        name: 'Doing',
        tasks: {},
        tasksIdsSequence: []
      },
      '2': {
        id: '2',
        name: 'Done',
        tasks: {},
        tasksIdsSequence: []
      },
    },
    statusesIdsSequence: ['0', '1', '2']
  },
  '2': {
    id: '2',
    name: 'Roadmap',
    statuses: {
      '0': {
        id: '0',
        name: 'Now',
        tasks: {
          '0': {
            id: '0',
            title: 'Launch version one',
            description: '',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1']
          },
          '1': {
            id: '1',
            title: 'Review early feedback and plan next steps for roadmap',
            description: 'Beyond the initial launch, we\'re keeping the initial roadmap completely empty. This meeting will help us plan out our next steps based on actual customer feedback.',
            subtasks: {
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
            },
            subtasksIdsSequence: ['0', '1', '2']
          }
        },
        tasksIdsSequence: ['0', '1']
      },
      '1': {
        id: '1',
        name: 'Next',
        tasks: {},
        tasksIdsSequence: []
      },
      '2': {
        id: '2',
        name: 'Later',
        tasks: {},
        tasksIdsSequence: []
      }
    },
    statusesIdsSequence: ['0', '1', '2']
  }
};
