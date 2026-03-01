export const getAllSets = () => [];
export const deleteSet = (id) => {};
export const createNewSet = (name) => ({ id: Date.now(), name, cards: [] });
export const saveSet = (set) => {};
export const getSet = (id) => ({ id, name: "Sample", cards: [] });
export const updateKnownCards = (setId, cardId, known) => {};
