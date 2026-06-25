export interface OpenLibraryBook {
  title: string;
  author: string;
  imageUrl: string | null;
  isbn: string | null;
  description: string;
  pagesTotal: number | null;
  key: string | null;
}

/**
 * Searches Open Library for books matching a query (title, author, or ISBN).
 */
export async function searchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
  if (!query || !query.trim()) return [];
  
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}&limit=5&fields=key,title,author_name,cover_i,isbn,first_sentence,number_of_pages_median`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    
    const data = await res.json();
    if (!data.docs) return [];
    
    return data.docs.map((doc: {
      key?: string;
      title?: string;
      author_name?: string[];
      cover_i?: number;
      isbn?: string[];
      first_sentence?: string | string[];
      number_of_pages_median?: number;
    }) => {
      let desc = '';
      if (doc.first_sentence) {
        desc = Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence;
      }
      
      return {
        title: doc.title || 'Untitled',
        author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
        imageUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
        isbn: doc.isbn ? doc.isbn[0] : null,
        description: desc,
        pagesTotal: doc.number_of_pages_median || null,
        key: doc.key || null,
      };
    });
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Failed to fetch from Open Library:', err);
    return [];
  }
}
