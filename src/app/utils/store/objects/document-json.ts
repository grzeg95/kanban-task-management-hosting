import {Data} from '../data';
import {DocumentFields} from './document';

export type DocumentJSON = {
  [DocumentFields.id]: string;
  [DocumentFields.data]: Data;
  [DocumentFields.parentPath]: string;
  [DocumentFields.createdAt]: number | null;
  [DocumentFields.modifiedAt]: number | null;
}
