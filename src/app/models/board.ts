import {User, UserBoards} from '../services/auth/user.model';
import {Status} from './status';

export type BoardDoc = {
  name: string;
  statusesIdsSequence: string[];
  statuses: {[key in string]: Status};
};

export type Board = {
  id: string;
} & BoardDoc;

export type CreateBoardData = {
  name: string;
  statusesNames: string[];
};

export type CreateBoardResult = {
  id: string;
  boards: UserBoards;
  statusesIdsSequence: string[];
};

export type UpdateBoardData = {
  id: string;
  name: string;
  statuses: {
    id?: string;
    name: string;
  }[];
};

export type UpdateBoardResult = {
  id: string;
  statusesIdsSequence: string[];
};

export type DeleteBoardData = {
  id: string;
};

export type DeleteBoardResult = undefined;
