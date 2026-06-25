import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { Book, CreateBookInput, UpdateBookInput } from '../types/book';
import type { BookRepository } from './book.repository';

interface BookRow {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  description: string;
  url: string | null;
  imageUrl: string | null;
  author: string;
  rating: number;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  pagesRead: number;
  pagesTotal: number;
  isFavorite: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SqliteBookRepository implements BookRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(workspaceId: string): Promise<Book[]> {
    const db = await this.getDb();
    const rows = await db.select<BookRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         title,
         content,
         description,
         url,
         image_url     AS imageUrl,
         author,
         rating,
         status,
         started_at    AS startedAt,
         finished_at   AS finishedAt,
         pages_read    AS pagesRead,
         pages_total   AS pagesTotal,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM books
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId],
    );

    const books = await Promise.all(
      rows.map(async (r) => {
        const tagsRows = await db.select<{ tag: string }[]>(
          'SELECT tag FROM book_tags WHERE book_id = $1',
          [r.id],
        );
        return {
          id: r.id,
          workspaceId: r.workspaceId,
          title: r.title,
          content: r.content,
          description: r.description,
          url: r.url,
          imageUrl: r.imageUrl,
          author: r.author,
          rating: r.rating,
          status: r.status,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          pagesRead: r.pagesRead,
          pagesTotal: r.pagesTotal,
          isFavorite: r.isFavorite === 1,
          deletedAt: r.deletedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          tags: tagsRows.map((t) => t.tag),
        };
      })
    );

    return books;
  }

  async getById(id: string): Promise<Book | null> {
    const db = await this.getDb();
    const rows = await db.select<BookRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         title,
         content,
         description,
         url,
         image_url     AS imageUrl,
         author,
         rating,
         status,
         started_at    AS startedAt,
         finished_at   AS finishedAt,
         pages_read    AS pagesRead,
         pages_total   AS pagesTotal,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM books
       WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) return null;
    const r = rows[0];

    const tagsRows = await db.select<{ tag: string }[]>(
      'SELECT tag FROM book_tags WHERE book_id = $1',
      [id],
    );

    return {
      id: r.id,
      workspaceId: r.workspaceId,
      title: r.title,
      content: r.content,
      description: r.description,
      url: r.url,
      imageUrl: r.imageUrl,
      author: r.author,
      rating: r.rating,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      pagesRead: r.pagesRead,
      pagesTotal: r.pagesTotal,
      isFavorite: r.isFavorite === 1,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tags: tagsRows.map((t) => t.tag),
    };
  }

  async create(input: CreateBookInput): Promise<Book> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const title = input.title;
    const content = input.content ?? '';
    const description = input.description ?? '';
    const url = input.url ?? null;
    const imageUrl = input.imageUrl ?? null;
    const author = input.author ?? '';
    const rating = input.rating ?? 0;
    const status = input.status ?? 'Want to Read';
    const startedAt = input.startedAt ?? null;
    const finishedAt = input.finishedAt ?? null;
    const pagesRead = input.pagesRead ?? 0;
    const pagesTotal = input.pagesTotal ?? 0;

    await db.execute(
      `INSERT INTO books
         (id, workspace_id, title, content, description, url, image_url, author, rating, status, started_at, finished_at, pages_read, pages_total, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, $15, $15)`,
      [id, input.workspaceId, title, content, description, url, imageUrl, author, rating, status, startedAt, finishedAt, pagesRead, pagesTotal, now],
    );

    if (input.tags && input.tags.length > 0) {
      for (const tag of input.tags) {
        await db.execute('INSERT OR IGNORE INTO book_tags (book_id, tag) VALUES ($1, $2)', [
          id,
          tag,
        ]);
      }
    }

    return {
      id,
      workspaceId: input.workspaceId,
      title,
      content,
      description,
      url,
      imageUrl,
      author,
      rating,
      status,
      startedAt,
      finishedAt,
      pagesRead,
      pagesTotal,
      isFavorite: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
    };
  }

  async update(id: string, data: UpdateBookInput): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const params: unknown[] = [now];
    let i = 2;

    if (data.title !== undefined) { sets.push(`title = $${i++}`); params.push(data.title); }
    if (data.content !== undefined) { sets.push(`content = $${i++}`); params.push(data.content); }
    if (data.description !== undefined) { sets.push(`description = $${i++}`); params.push(data.description); }
    if (data.url !== undefined) { sets.push(`url = $${i++}`); params.push(data.url); }
    if (data.imageUrl !== undefined) { sets.push(`image_url = $${i++}`); params.push(data.imageUrl); }
    if (data.author !== undefined) { sets.push(`author = $${i++}`); params.push(data.author); }
    if (data.rating !== undefined) { sets.push(`rating = $${i++}`); params.push(data.rating); }
    if (data.status !== undefined) { sets.push(`status = $${i++}`); params.push(data.status); }
    if (data.startedAt !== undefined) { sets.push(`started_at = $${i++}`); params.push(data.startedAt); }
    if (data.finishedAt !== undefined) { sets.push(`finished_at = $${i++}`); params.push(data.finishedAt); }
    if (data.pagesRead !== undefined) { sets.push(`pages_read = $${i++}`); params.push(data.pagesRead); }
    if (data.pagesTotal !== undefined) { sets.push(`pages_total = $${i++}`); params.push(data.pagesTotal); }
    if (data.isFavorite !== undefined) { sets.push(`is_favorite = $${i++}`); params.push(data.isFavorite ? 1 : 0); }

    params.push(id);
    await db.execute(`UPDATE books SET ${sets.join(', ')} WHERE id = $${i}`, params);
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE books SET deleted_at = $1, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async restore(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE books SET deleted_at = NULL, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM books WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE books SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id],
    );
  }

  async addTag(bookId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('INSERT OR IGNORE INTO book_tags (book_id, tag) VALUES ($1, $2)', [
      bookId,
      tag,
    ]);
  }

  async removeTag(bookId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM book_tags WHERE book_id = $1 AND tag = $2', [
      bookId,
      tag,
    ]);
  }
}
