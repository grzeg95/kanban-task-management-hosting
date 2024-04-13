
export function uuidV4() {
  return URL.createObjectURL(new Blob());
}

export function getDocId(currentDocIds: Set<string>) {

  let id = uuidV4();

  while (currentDocIds.has(id)) {
    id = uuidV4();
  }

  return id;
}
