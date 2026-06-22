interface ItemWithTags {
  id: string;
  tags: string[];
}

export async function renameTagGloballyHelper<T extends ItemWithTags>(
  items: T[],
  oldTag: string,
  newTag: string,
  addTagFn: (id: string, tag: string) => Promise<void>,
  removeTagFn: (id: string, tag: string) => Promise<void>
): Promise<T[]> {
  const updatedItems = [...items];
  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i];
    if (item.tags?.includes(oldTag)) {
      await removeTagFn(item.id, oldTag);
      if (item.tags.includes(newTag)) {
        updatedItems[i] = {
          ...item,
          tags: item.tags.filter((t) => t !== oldTag),
        };
      } else {
        await addTagFn(item.id, newTag);
        updatedItems[i] = {
          ...item,
          tags: [...item.tags.filter((t) => t !== oldTag), newTag],
        };
      }
    }
  }
  return updatedItems;
}

export async function deleteTagGloballyHelper<T extends ItemWithTags>(
  items: T[],
  tag: string,
  removeTagFn: (id: string, tag: string) => Promise<void>
): Promise<T[]> {
  const updatedItems = [...items];
  for (let i = 0; i < updatedItems.length; i++) {
    const item = updatedItems[i];
    if (item.tags?.includes(tag)) {
      await removeTagFn(item.id, tag);
      updatedItems[i] = {
        ...item,
        tags: item.tags.filter((t) => t !== tag),
      };
    }
  }
  return updatedItems;
}
