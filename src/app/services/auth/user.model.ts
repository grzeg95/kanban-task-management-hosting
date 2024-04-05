export type UserBoards = {name: string, id: string}[];

export type User = {
  id: string;
  boards: UserBoards;
};
