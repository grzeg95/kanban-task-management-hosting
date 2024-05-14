import {Data} from '../data';

export type DocumentJSON = {
  id: string;
  path: string;
  storageType: string;
  projectId: string;
  data: Data;
  parentPath: string;
  createdAt: string | null;
  modifiedAt: string | null;
  exists: boolean;
}
