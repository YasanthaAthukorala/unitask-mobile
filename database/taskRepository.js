import { getDb } from './database';
export async function getTasks({ search = '', category = 'All', mine = false, favorites = false } = {}) {
  const db = await getDb();
  const clauses = []; const params = [];
  if (search.trim()) {
    // escape % and _ so they are searched literally
    const q = search.trim().replace(/[\\%_]/g, '\\$&');
    clauses.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category !== 'All') { clauses.push('category = ?'); params.push(category); }
  if (mine) clauses.push('is_mine = 1');
  if (favorites) clauses.push('is_favorite = 1');
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.getAllAsync(`SELECT * FROM tasks ${where} ORDER BY id DESC`, params);
}
export async function getTask(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM tasks WHERE id = ?', [Number(id)]);
}
export async function addTask(t) {
  const db = await getDb();
  return db.runAsync('INSERT INTO tasks (title,description,category,budget,deadline,student_name,is_mine) VALUES (?,?,?,?,?,?,1)',
    [t.title.trim(), t.description.trim(), t.category, Number(t.budget), t.deadline.trim(), 'Me']);
}
export async function updateTask(id, t) {
  const db = await getDb();
  return db.runAsync('UPDATE tasks SET title=?,description=?,category=?,budget=?,deadline=? WHERE id=? AND is_mine=1',
    [t.title.trim(),t.description.trim(),t.category,Number(t.budget),t.deadline.trim(),Number(id)]);
}
export async function deleteTask(id) {
  const db = await getDb();
  return db.runAsync('DELETE FROM tasks WHERE id=? AND is_mine=1', [Number(id)]);
}
export async function toggleFavorite(id, current) {
  const db = await getDb();
  return db.runAsync('UPDATE tasks SET is_favorite=? WHERE id=?', [current ? 0 : 1, Number(id)]);
}
export async function changeStatus(id, status) {
  const db = await getDb();
  return db.runAsync('UPDATE tasks SET status=? WHERE id=? AND is_mine=1', [status, Number(id)]);
}
