export type BoardDoc = {
  name: string;
  statusesIdsSequence: string[];
};

export type Board = {
  id: string;
  path: string;
} & BoardDoc;

export type CreateBoardData = {
  name: string;
  statusesNames: string[];
};

export type CreateBoardResult = {
  id: string;
  boardsIdsSequence: string[];
  statusesIdsSequence: string;
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
